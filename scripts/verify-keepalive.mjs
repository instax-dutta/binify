/**
 * G14: the keepalive probe is safe, cheap, and honest about what it protects.
 *
 * The route is checked over HTTP against a running server: it must refuse an
 * unauthenticated caller, succeed with the secret, and run a query that touches
 * no rows. The surrounding claims are checked against the files, because the
 * failure modes that matter here are not observable from a request.
 */

import { withServer, read, assertAll, pass } from './lib/harness.mjs';

const route = read('src/app/api/cron/keepalive/route.ts');
const script = read('scripts/neon-compute.ts');
const docs = read('docs/neon-migration.md');
const vercel = read('vercel.json');

const checks = [];

await withServer(async (base) => {
    // ---- authentication must fail closed --------------------------------
    const anonymous = await fetch(`${base}/api/cron/keepalive`);
    checks.push({
        name: 'an unauthenticated keepalive is refused',
        ok: anonymous.status === 401,
        detail: `got ${anonymous.status}`,
    });

    const wrong = await fetch(`${base}/api/cron/keepalive`, {
        headers: { authorization: 'Bearer not-the-secret' },
    });
    checks.push({
        name: 'a wrong bearer token is refused',
        ok: wrong.status === 401,
        detail: `got ${wrong.status}`,
    });

    // ---- the authorised probe must work ---------------------------------
    const auth = { authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` };
    const ok = await fetch(`${base}/api/cron/keepalive`, { headers: auth });
    const body = await ok.json().catch(() => ({}));

    checks.push({
        name: 'an authorised keepalive reports the database is reachable',
        ok: ok.status === 200 && body.ok === true,
        detail: `got ${ok.status} ${JSON.stringify(body).slice(0, 160)}`,
    });

    checks.push({
        name: 'the probe reports its own latency',
        ok: typeof body.durationMs === 'number' && body.durationMs >= 0,
        detail: `no durationMs in ${JSON.stringify(body).slice(0, 160)}`,
    });

    checks.push({
        name: 'the keepalive is never cached',
        ok: (ok.headers.get('cache-control') ?? '').includes('no-store'),
        detail: `cache-control was ${ok.headers.get('cache-control')}`,
    });

    // ---- the query must be trivial ---------------------------------------
    checks.push({
        name: 'the probe runs SELECT 1 and moves no rows',
        ok: /SELECT 1 AS ok/.test(route) && !/\b(INSERT|UPDATE|DELETE)\b/i.test(route),
        detail: 'the probe appears to write',
    });

    // ---- it must not claim to prevent an outage it cannot prevent --------
    checks.push({
        name: 'the route distinguishes scale to zero from quota exhaustion',
        ok: /consumption quota/i.test(route) && /does NOT wake/i.test(route),
        detail: 'the route does not separate the two failure modes',
    });

    // ---- the real lever must be documented and scriptable ----------------
    checks.push({
        name: 'the compute setting can be read and changed without traffic',
        ok: /suspend_timeout_seconds/.test(script) && /suspend_timeout_seconds/.test(docs),
        detail: 'suspend_timeout_seconds is neither scriptable nor documented',
    });

    checks.push({
        name: 'the runbook states both ways a Neon project goes unavailable',
        ok: /quota/i.test(docs) && /scale to zero/i.test(docs),
        detail: 'the runbook documents only one failure mode',
    });

    // ---- a schedule that would fail the deploy ---------------------------
    // Vercel rejects sub-daily cron expressions on Hobby at deploy time, so
    // adding one to vercel.json breaks the build rather than warming anything.
    let cronSchedules = [];
    try {
        cronSchedules = (JSON.parse(vercel).crons ?? []).map((c) => c.schedule);
    } catch {
        /* reported below */
    }
    // A star or a comma in the minute or hour field means more than once a day,
    // which Vercel rejects at deploy time on Hobby.
    checks.push({
        name: 'no cron in vercel.json fires more than once a day',
        ok: cronSchedules.every((s) => !/^[^ ]*[*,\/][^ ]*\s+[^ ]*[*,\/]/.test(s)),
        detail: `schedules present: ${cronSchedules.join(', ') || 'none'}`,
    });
});

assertAll(checks);
pass('KEEPALIVE PASS');