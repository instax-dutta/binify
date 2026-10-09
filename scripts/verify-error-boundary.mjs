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
import { withServer, pass, fail } from './lib/harness.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const THROW_ROUTE = `${ROOT}/src/app/__gate-throw/page.tsx`;

function structural() {
    const problems = [];
    for (const rel of ['src/app/error.tsx', 'src/app/global-error.tsx']) {
        const path = `${ROOT}/${rel}`;
        if (!existsSync(path)) { problems.push(`${rel} missing`); continue; }
        const src = readFileSync(path, 'utf8');
        if (!/^'use client'|^"use client"/m.test(src)) {
            problems.push(`${rel} must be a client component`);
        }
        if (!/export default/.test(src)) problems.push(`${rel} has no default export`);
        // The boundary must accept Next's reset prop and wire it to a control,
        // so a visitor can retry without a full page load.
        const acceptsReset = /reset\s*[:,}]/.test(src) || /reset\s*=\s*\{/.test(src);
        const wiresReset = /onClick=\{reset\}|onClick=\{\(\)\s*=>\s*reset\(\)/.test(src);
        if (!acceptsReset) problems.push(`${rel} does not accept a reset prop`);
        if (!wiresReset) problems.push(`${rel} does not wire reset to a control`);
        if (!/<html|<div/.test(src)) problems.push(`${rel} renders no markup`);
    }
    return problems;
}

const problems = structural();
if (problems.length) {
    fail('error boundary structure is wrong', problems.join('\n'));
}

mkdirSync(`${ROOT}/src/app/__gate-throw`, { recursive: true });
writeFileSync(
    THROW_ROUTE,
    `'use client';
// Temporary route created by scripts/verify-error-boundary.mjs.
export default function Throws() {
    throw new Error('gate: deliberate render failure');
}
`
);

let built = false;
try {
    const b = spawnSync('node_modules/.bin/next', ['build'], {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 10 * 60_000,
        env: { ...process.env, NODE_ENV: 'production' },
    });
    if (b.status !== 0) {
        fail('could not build the probe route', `${b.stdout}\n${b.stderr}`.slice(-1500));
    }
    built = true;

    await withServer(async (base) => {
        const { chromium } = await import('@playwright/test');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(`${base}/__gate-throw`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        const body = await page.evaluate(() => document.body.innerText);
        await browser.close();

        // The boundary's own copy must be visible. Next.js's default fallback
        // does not contain these words, so their presence proves the boundary
        // rendered rather than the framework's generic page.
        const boundaryText = /something went wrong|try again|unexpected error/i.test(body);

        if (!boundaryText) {
            fail(
                'the error boundary did not render',
                `body was: ${JSON.stringify(body.slice(0, 300))}`
            );
        }
        pass('ERROR-BOUNDARY PASS');
    });
} finally {
    rmSync(`${ROOT}/src/app/__gate-throw`, { recursive: true, force: true });
    // Leave the tree without a stale build of the probe route.
    if (built) {
        spawnSync('node_modules/.bin/next', ['build'], {
            cwd: ROOT,
            encoding: 'utf8',
            timeout: 10 * 60_000,
            env: { ...process.env, NODE_ENV: 'production' },
        });
    }
}