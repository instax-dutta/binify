/**
 * G5: an unhandled render error is caught by a route error boundary instead of
 * escaping to a blank frame.
 *
 * Verified behaviourally, not by inspecting the file. The gate adds a temporary
 * route that throws during render, builds, confirms the boundary's own copy is
 * what the visitor sees, then removes the route and restores the tree.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { withServer, withBrowser, pass, fail } from './lib/harness.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
// Deliberately not prefixed with an underscore: the App Router treats `_name`
// as a private folder and never routes it, which would make this gate vacuous.
const PROBE_DIR = `${ROOT}/src/app/gate-probe-throw`;

function build() {
    return spawnSync('node_modules/.bin/next', ['build'], {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 12 * 60_000,
        env: { ...process.env, NODE_ENV: 'production' },
    });
}

function structural() {
    const problems = [];
    for (const rel of ['src/app/error.tsx', 'src/app/global-error.tsx']) {
        const path = `${ROOT}/${rel}`;
        if (!existsSync(path)) { problems.push(`${rel} missing`); continue; }
        const src = readFileSync(path, 'utf8');
        if (!/^['"]use client['"]/m.test(src)) problems.push(`${rel} must be a client component`);
        if (!/export default/.test(src)) problems.push(`${rel} has no default export`);
        // The boundary must accept Next's reset prop and wire it to a control, so
        // a visitor can retry without a full page load.
        if (!/reset\s*[:,}]/.test(src) && !/reset\s*=\s*\{/.test(src)) {
            problems.push(`${rel} does not accept a reset prop`);
        }
        if (!/onClick=\{reset\}|onClick=\{\(\)\s*=>\s*reset\(\)/.test(src)) {
            problems.push(`${rel} does not wire reset to a control`);
        }
        if (!/role="alert"|aria-live/.test(src)) problems.push(`${rel} has no live region`);
    }
    return problems;
}

const problems = structural();
if (problems.length) fail('error boundary structure is wrong', problems.join('\n'));

/**
 * Run `fn`, then always clean up before the process ends. process.exit() skips
 * `finally`, so cleanup is performed here and the outcome is returned rather
 * than thrown.
 */
async function withProbeRoute(fn) {
    mkdirSync(PROBE_DIR, { recursive: true });
    writeFileSync(
        `${PROBE_DIR}/page.tsx`,
        `'use client';
// Temporary route created by scripts/verify-error-boundary.mjs.
export default function Throws() {
    throw new Error('gate: deliberate render failure');
}
`
    );

    let outcome = { ok: false, detail: '' };
    try {
        const b = build();
        if (b.status !== 0) {
            outcome = { ok: false, detail: `probe build failed: ${`${b.stdout}\n${b.stderr}`.slice(-1200)}` };
        } else {
            outcome = await fn();
        }
    } catch (err) {
        outcome = { ok: false, detail: err instanceof Error ? err.message : String(err) };
    } finally {
        // Remove the probe and rebuild so the tree is left exactly as found.
        rmSync(PROBE_DIR, { recursive: true, force: true });
        build();
    }
    return outcome;
}

// withServer returns its callback's value; it must be returned onward or a
// failure inside would be silently discarded and this gate would always pass.
const result = await withProbeRoute(() =>
    withServer(async (base) => {
        await withBrowser(async (browser) => {
            const page = await browser.newPage();
            const res = await page.goto(`${base}/gate-probe-throw`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1500);
            const body = await page.evaluate(() => document.body.innerText);

            // The boundary's own copy must be visible. Next.js's default fallback
            // does not contain these words, so their presence proves the boundary
            // rendered rather than the framework's generic page.
            const rendered = /something went wrong|try again|unexpected error/i.test(body);
            if (!rendered) {
                return {
                    ok: false,
                    detail: `status ${res?.status()}, body was ${JSON.stringify(body.slice(0, 300))}`,
                };
            }
            return { ok: true, detail: '' };
        }, { name: 'chromium' });
    })
);

if (!result.ok) fail('the error boundary did not render', result.detail);
pass('ERROR-BOUNDARY PASS');