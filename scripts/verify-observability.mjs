/**
 * G12: a failure can be diagnosed from production without exposing a secret.
 *
 * An operator has to be able to correlate a bug report with a log line, and
 * nothing that identifies the infrastructure may reach the caller. Both are
 * checked against a running server rather than by reading code.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { withServer, read, assertAll, pass } from './lib/harness.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
// Not underscore-prefixed: the App Router treats `_name` as a private folder and
// never routes it, which would make this gate vacuous.
const PROBE_TREE = `${ROOT}/src/app/gate-probe-500`;
const PROBE = `${PROBE_TREE}/api/blow-up`;

function build() {
    return spawnSync('node_modules/.bin/next', ['build'], {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 12 * 60_000,
        env: { ...process.env, NODE_ENV: 'production' },
    });
}

/**
 * Build with a temporary API route that throws something the server did not
 * anticipate, so the real 500 path can be observed over HTTP, then restore the
 * tree.
 *
 * A client error such as 404 or 429 would not exercise it: those are ApiErrors,
 * which are meant to be readable and carry no request id. Only an unexpected
 * throw reaches the internal-failure branch.
 */
async function withFailingRoute(fn) {
    mkdirSync(PROBE, { recursive: true });
    writeFileSync(
        `${PROBE}/route.ts`,
        `// Temporary route created by scripts/verify-observability.mjs.
// Mirrors a real API route: the handler is wrapped so an unexpected throw goes
// through the same errorResponse path as production.
import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';

export async function GET() {
    try {
        throw new Error('connection refused to db.internal.example.invalid');
    } catch (err) {
        return errorResponse(err, 'gate probe');
    }
}
`
    );

    let outcome;
    try {
        const b = build();
        if (b.status !== 0) {
            outcome = {
                ok: false,
                detail: `probe build failed: ${`${b.stdout}\n${b.stderr}`.slice(-1000)}`,
            };
        } else {
            outcome = await fn();
        }
    } catch (err) {
        outcome = { ok: false, detail: err instanceof Error ? err.message : String(err) };
    } finally {
        rmSync(PROBE_TREE, { recursive: true, force: true });
        build();
    }
    return outcome;
}

const checks = [];

const result = await withFailingRoute(() =>
    withServer(async (base, { log }) => {
        // ---- the unexpected-failure branch ------------------------------
        const res = await fetch(`${base}/gate-probe-500/api/blow-up`);
        const text = await res.text();
        let body = {};
        try {
            body = JSON.parse(text);
        } catch {
            /* handled by the shape check below */
        }

        checks.push({
            name: 'an unexpected failure is reported as a 500',
            ok: res.status === 500,
            detail: `got status ${res.status}`,
        });

        checks.push({
            name: 'an unexpected failure returns a correlatable request id',
            ok: typeof body.requestId === 'string' && /^[0-9a-f-]{36}$/.test(body.requestId),
            detail: `body was ${text.slice(0, 200)}`,
        });

        checks.push({
            name: 'an unexpected failure does not leak an internal message',
            ok: !/connection refused|db\.internal|postgres|neon|ECONNREFUSED|node_modules|at Object/i
                .test(text),
            detail: `response body looks internal: ${text.slice(0, 200)}`,
        });

        checks.push({
            name: 'the request id also reaches the log line',
            ok: body.requestId ? log().includes(body.requestId) : false,
            detail: 'the logged failure carries a different or no request id',
        });

        // ---- a client error stays readable, which is the point of ApiError -
        const notFound = await fetch(`${base}/api/paste/00000000000000`);
        const nfBody = await notFound.json().catch(() => ({}));
        checks.push({
            name: 'a missing paste is a 404 with a usable message, not a 500',
            ok: notFound.status === 404 && typeof nfBody.error === 'string' && !nfBody.requestId,
            detail: `got ${notFound.status} ${JSON.stringify(nfBody).slice(0, 160)}`,
        });

        // ---- no response names the deployment ---------------------------
        const probes = [
            { name: 'the home page', path: '/' },
            { name: 'a missing paste page', path: '/p/00000000000000' },
            { name: 'the docs page', path: '/docs' },
            {
                name: 'a rejected paste create',
                path: '/api/paste',
                init: { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
            },
        ];

        for (const probe of probes) {
            const r = await fetch(base + probe.path, probe.init ?? {});
            const t = await r.text();
            checks.push({
                name: `${probe.name} leaks no database or host detail`,
                ok: !/postgres|neon\.tech|npg_|aws\.neon|binify_app|node_modules/i.test(t),
                detail: `response mentions infrastructure in ${probe.path}`,
            });
        }

        // ---- the source must not log a secret ---------------------------
        const loggingSrc = read('src/lib/logging.ts');
        const apiSrc = read('src/lib/api.ts');

        checks.push({
            name: 'the logger redacts rather than dumping objects',
            ok: /sanitizeError/.test(loggingSrc),
            detail: 'src/lib/logging.ts has no redaction helper',
        });

        checks.push({
            name: 'the logger never writes a credential',
            ok: !/console\.(log|error|warn)\([^)]*(TOKEN_PEPPER|INIT_SECRET|CRON_SECRET|DATABASE_URL)/i
                .test(loggingSrc),
            detail: 'src/lib/logging.ts appears to log a credential',
        });

        checks.push({
            name: 'the API error path passes the error through sanitizeError',
            ok: /sanitizeError\(err\)/.test(apiSrc),
            detail: 'src/lib/api.ts logs the raw error instead of the sanitized one',
        });

        return { ok: true, detail: '' };
    })
);

// The result must be propagated; withServer hands back its callback's value.
if (!result.ok) {
    console.error(`FAIL: the observability probe did not run`);
    console.error(result.detail);
    process.exit(1);
}

assertAll(checks);
pass('OBSERVABILITY PASS');