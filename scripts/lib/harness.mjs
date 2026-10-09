/**
 * Shared helpers for the verification gates.
 *
 * Every gate that needs a running application boots the same production build
 * on a free port and tears it down again, so all of them observe the same
 * artifact rather than drifting into testing different things.
 */

import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import { existsSync, readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

// harness.mjs lives at scripts/lib/, so the repository root is two levels up.
export const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');

/** Read a repository file as text. */
export function read(rel) {
    return readFileSync(`${ROOT}/${rel}`, 'utf8');
}

export function exists(rel) {
    return existsSync(`${ROOT}/${rel}`);
}

/** Print the marker only after every assertion passed. */
export function pass(marker) {
    console.log(marker);
    process.exit(0);
}

export function fail(message, detail) {
    console.error(`FAIL: ${message}`);
    if (detail) console.error(detail);
    process.exit(1);
}

/** Collect failures so a report lists everything wrong, not just the first. */
export function assertAll(checks) {
    const failed = checks.filter((c) => !c.ok);
    for (const f of failed) {
        console.error(`  ✗ ${f.name}: ${f.detail}`);
    }
    if (failed.length) {
        fail(`${failed.length} of ${checks.length} checks failed`);
    }
    return checks;
}

export function freePort() {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.on('error', reject);
        srv.listen(0, '127.0.0.1', () => {
            const { port } = srv.address();
            srv.close(() => resolve(port));
        });
    });
}

/**
 * Boot `next start` against the production build and wait until it answers.
 * Always tears the process down, including on failure.
 */
export async function withServer(fn, { timeoutMs = 90_000 } = {}) {
    const built = spawnSync('node', ['-e', `require('fs').existsSync('.next/BUILD_ID')`], {
        cwd: ROOT,
    });
    if (built.status !== 0) {
        fail('no production build found — run `npm run build` first');
    }

    const port = await freePort();
    const child = spawn('node_modules/.bin/next', ['start', '-p', String(port)], {
        cwd: ROOT,
        env: { ...process.env, NODE_ENV: 'production' },
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    let log = '';
    child.stdout.on('data', (d) => { log += d; });
    child.stderr.on('data', (d) => { log += d; });

    const base = `http://127.0.0.1:${port}`;
    const deadline = Date.now() + timeoutMs;
    let up = false;

    while (Date.now() < deadline) {
        if (child.exitCode !== null) break;
        try {
            const res = await fetch(base + '/', { signal: AbortSignal.timeout(4000) });
            if (res.ok) { up = true; break; }
        } catch {
            await delay(250);
        }
    }

    try {
        if (!up) fail(`server did not become ready on ${base}`, log.slice(-1500));
        return await fn(base, { port, log: () => log });
    } finally {
        child.kill('SIGTERM');
        await delay(300);
        if (child.exitCode === null) child.kill('SIGKILL');
    }
}

/** Start a browser via Playwright, failing loudly if the build is missing. */
export async function withBrowser(fn, { name, headless = true } = {}) {
    let mod;
    try {
        mod = await import('@playwright/test');
    } catch {
        fail('@playwright/test is not installed in this environment');
    }

    const browserType = mod[name];
    if (!browserType) fail(`unknown browser: ${name}`);

    const browser = await browserType.launch({ headless });
    try {
        return await fn(browser);
    } finally {
        await browser.close();
    }
}

/** Human-readable byte size for reports. */
export const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;