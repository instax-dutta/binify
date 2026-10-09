/**
 * G12: a failure can be diagnosed from production without exposing a secret.
 *
 * Two properties, both checked against a running server rather than by reading
 * code. An operator has to be able to correlate a report with a log line, and
 * nothing that identifies the infrastructure may reach the caller.
 */

import { withServer, assertAll, pass } from './lib/harness.mjs';

const checks = [];

await withServer(async (base) => {
    // ---- 500 responses must be correlatable -----------------------------
    // A request that fails for a reason the server did not anticipate gets an
    // opaque body plus an id that also appears in the log line.
    const missing = await fetch(`${base}/api/paste/00000000000000`, {
        headers: { 'content-type': 'application/json' },
    });
    const body = await missing.json().catch(() => ({}));

    checks.push({
        name: 'a server-side failure returns a request id',
        ok: typeof body.requestId === 'string' && /^[0-9a-f-]{36}$/.test(body.requestId),
        detail: `got ${JSON.stringify(body).slice(0, 200)}`,
    });

    checks.push({
        name: 'a server-side failure does not leak an internal message',
        ok: !/postgres|neon|ECONNREFUSED|node_modules|at Object|SELECT|INSERT/i.test(
            JSON.stringify(body)
        ),
        detail: `response body looks internal: ${JSON.stringify(body).slice(0, 200)}`,
    });

    // ---- every response must stay free of the deployment's identity ------
    // These are the strings that tell an attacker who the operator chose.
    const probes = [
        { name: 'the home page', path: '/' },
        { name: 'a missing paste', path: '/p/00000000000000' },
        { name: 'the docs page', path: '/docs' },
        { name: 'a rejected paste create', path: '/api/paste' },
    ];

    for (const probe of probes) {
        const init =
            probe.path === '/api/paste'
                ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }
                : {};
        const res = await fetch(base + probe.path, init);
        const text = await res.text();
        checks.push({
            name: `${probe.name} leaks no database or host detail`,
            ok: !/postgres|neon\.tech|npg_|aws\.neon|binify_app|node_modules/i.test(text),
            detail: `response mentions infrastructure in ${probe.path}`,
        });
    }

    // ---- the source must not log a secret --------------------------------
    const { read } = await import('./lib/harness.mjs');
    const loggingSrc = read('src/lib/logging.ts');
    const apiSrc = read('src/lib/api.ts');

    checks.push({
        name: 'the logger redacts rather than dumping objects',
        ok: /sanitizeError/.test(loggingSrc),
        detail: 'src/lib/logging.ts has no redaction helper',
    });

    checks.push({
        name: 'the logger never writes a credential',
        ok: !/(console\.(log|error|warn)\([^)]*(TOKEN_PEPPER|INIT_SECRET|CRON_SECRET|DATABASE_URL|password|token)\b)/i
            .test(loggingSrc),
        detail: 'src/lib/logging.ts appears to log a credential',
    });

    checks.push({
        name: 'a logged failure carries the request id for correlation',
        ok: /requestId=/.test(apiSrc) && /logger\.error/.test(apiSrc),
        detail: 'the API error path does not log a request id',
    });

    // ---- the sanitize helper must actually be applied ---------------------
    checks.push({
        name: 'the API error path passes the error through sanitizeError',
        ok: /sanitizeError\(err\)/.test(apiSrc),
        detail: 'src/lib/api.ts logs the raw error instead of the sanitized one',
    });
});

assertAll(checks);
pass('OBSERVABILITY PASS');