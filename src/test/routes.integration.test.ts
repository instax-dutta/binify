/**
 * Route-level integration tests.
 *
 * These exercise the actual Next.js route handlers — the same functions the
 * platform invokes — against a real database. Before these existed, every auth
 * guarantee in the app was only verified by hand-typed curl commands, so a
 * refactor that reordered a check would have passed CI.
 *
 * Requires DATABASE_URL; skipped otherwise.
 *
 *   npm run test:integration
 */

import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';

import { POST as createPasteRoute } from '@/app/api/paste/route';
import { GET as readRoute, DELETE as revokeRoute } from '@/app/api/paste/[id]/route';
import { POST as rotateRoute } from '@/app/api/paste/[id]/rotate/route';
import { POST as initRoute, GET as initGetRoute } from '@/app/api/init/route';
import { GET as cleanupRoute } from '@/app/api/cron/cleanup/route';
import { hashDeletionToken, generateToken } from '@/lib/security';
import { generatePasteId } from '@/lib/crypto';
import { createPaste } from '@/lib/pastes';
import { getPool } from '@/lib/db';

// Both are read at call time rather than module load, so plain imports are safe.
process.env.TOKEN_PEPPER = process.env.TOKEN_PEPPER ?? 'route-test-pepper';
// Give each test its own rate-limit bucket instead of sharing one.
process.env.TRUST_PROXY = 'true';

const hasDb = Boolean(process.env.DATABASE_URL);

const ORIGIN = 'http://localhost:3000';

let ipCounter = 0;
/** A fresh client identity per call so rate limits never leak between tests. */
const nextIp = () => `198.51.${(ipCounter >> 8) & 255}.${ipCounter++ & 255}`;

/**
 * Build an X-Forwarded-For value the way a trusted proxy would: the chain it
 * observed, with the client it actually saw appended LAST. `getClientIp` reads
 * the final entry, so that is where the per-test identity has to go.
 */
const xff = (ip: string) => `10.0.0.1, ${ip}`;

function post(url: string, body: unknown, ip = nextIp()): NextRequest {
    return new NextRequest(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': xff(ip) },
        body: JSON.stringify(body),
    });
}

function get(url: string, ip = nextIp()): NextRequest {
    return new NextRequest(url, { headers: { 'x-forwarded-for': xff(ip) } });
}

function del(url: string, ip = nextIp()): NextRequest {
    return new NextRequest(url, { method: 'DELETE', headers: { 'x-forwarded-for': xff(ip) } });
}

const validPaste = {
    ciphertext: 'Y2lwaGVydGV4dA',
    iv: 'aXYxMjM0NTY3ODkwYWJjZGVm',
    authTag: 'dGFnMTIzNDU2Nzg5MGFiY2RlZg',
    expirationType: '1day',
};

const readParams = (id: string) => ({ params: Promise.resolve({ id }) });

async function truncate() {
    await getPool().query('TRUNCATE pastes, rate_limits');
}

beforeEach(async () => {
    if (!hasDb) return;
    ipCounter = 0;
    await truncate();
});

after(async () => {
    if (!hasDb) return;
    await getPool().end();
});

/* -------------------------------------------------------------------------- */

test('POST /api/paste', { skip: hasDb ? false : 'DATABASE_URL not set' }, async (t) => {
    await t.test('creates a paste and returns a one-time token', async () => {
        const res = await createPasteRoute(post(`${ORIGIN}/api/paste`, validPaste));
        assert.strictEqual(res.status, 201);

        const body = await res.json();
        assert.match(body.pasteId, /^[A-Za-z0-9_-]{14}$/);
        assert.strictEqual(typeof body.deletionToken, 'string');
        assert.ok(body.deletionToken.length >= 32);
    });

    await t.test('never returns the stored token hash', async () => {
        const res = await createPasteRoute(post(`${ORIGIN}/api/paste`, validPaste));
        const { pasteId, deletionToken } = await res.json();

        const row = await getPool().query('SELECT token_hash FROM pastes WHERE id = $1', [
            pasteId,
        ]);
        assert.notStrictEqual(row.rows[0].token_hash, deletionToken);
        assert.strictEqual(row.rows[0].token_hash, hashDeletionToken(deletionToken));
    });

    await t.test('rejects a malformed body', async () => {
        const res = await createPasteRoute(
            post(`${ORIGIN}/api/paste`, { ...validPaste, expirationType: 'forever' })
        );
        assert.strictEqual(res.status, 400);
    });

    await t.test('rejects a missing content type', async () => {
        const req = new NextRequest(`${ORIGIN}/api/paste`, {
            method: 'POST',
            headers: { 'x-forwarded-for': nextIp() },
            body: JSON.stringify(validPaste),
        });
        const res = await createPasteRoute(req);
        assert.strictEqual(res.status, 415);
    });

    await t.test('rejects an oversized payload before parsing it', async () => {
        const req = new NextRequest(`${ORIGIN}/api/paste`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'content-length': String(64 * 1024 * 1024),
                'x-forwarded-for': nextIp(),
            },
            body: JSON.stringify(validPaste),
        });
        const res = await createPasteRoute(req);
        assert.strictEqual(res.status, 413);
    });

    await t.test('does not leak internals in the error body', async () => {
        const res = await createPasteRoute(post(`${ORIGIN}/api/paste`, { bad: true }));
        const raw = JSON.stringify(await res.json());
        assert.ok(!/select |insert |pg_|ECONN|postgres/i.test(raw), raw);
    });

    await t.test('rate limits creates per client', async () => {
        const ip = nextIp();
        const codes: number[] = [];
        for (let i = 0; i < 13; i++) {
            const res = await createPasteRoute(post(`${ORIGIN}/api/paste`, validPaste, ip));
            codes.push(res.status);
        }
        assert.strictEqual(codes.filter((c) => c === 201).length, 10);
        assert.strictEqual(codes.filter((c) => c === 429).length, 3);
    });

    await t.test('sets no-store on the response', async () => {
        const res = await createPasteRoute(post(`${ORIGIN}/api/paste`, validPaste));
        assert.match(res.headers.get('cache-control') ?? '', /no-store/);
    });
});

/* -------------------------------------------------------------------------- */

test('GET /api/paste/[id]', { skip: hasDb ? false : 'DATABASE_URL not set' }, async (t) => {
    const seed = async (over: Record<string, unknown> = {}) => {
        const id = generatePasteId();
        await createPaste({
            id,
            ciphertext: 'Yw',
            iv: 'aXYx',
            authTag: 'dGFn',
            tokenHash: hashDeletionToken(generateToken()),
            hasPassword: false,
            ...over,
        } as never);
        return id;
    };

    await t.test('returns the payload and metadata', async () => {
        const id = await seed({ title: 'hello', language: 'typescript' });
        const res = await readRoute(get(`${ORIGIN}/api/paste/${id}`), readParams(id));
        assert.strictEqual(res.status, 200);

        const body = await res.json();
        assert.strictEqual(body.ciphertext, 'Yw');
        assert.strictEqual(body.title, 'hello');
        assert.strictEqual(body.viewCount, 1);
        assert.ok(!('deletionToken' in body), 'token must never be returned');
    });

    await t.test('never returns the token hash', async () => {
        const id = await seed();
        const res = await readRoute(get(`${ORIGIN}/api/paste/${id}`), readParams(id));
        assert.ok(!('tokenHash' in (await res.json())));
    });

    await t.test('404s an unknown id', async () => {
        const id = generatePasteId();
        const res = await readRoute(get(`${ORIGIN}/api/paste/${id}`), readParams(id));
        assert.strictEqual(res.status, 404);
    });

    await t.test('rejects a malformed id without querying', async () => {
        // Must not reach the database with hostile input, and must be
        // indistinguishable from a missing paste.
        const res = await readRoute(get(`${ORIGIN}/api/paste/x`), readParams("'; DROP TABLE pastes--"));
        assert.strictEqual(res.status, 404);
    });

    await t.test('survives an injection attempt in the id', async () => {
        await seed();
        const hostile = "abc'; DELETE FROM pastes; --";
        const res = await readRoute(get(`${ORIGIN}/api/paste/x`), readParams(hostile));
        assert.strictEqual(res.status, 404);
        const { rows } = await getPool().query('SELECT count(*)::int AS n FROM pastes');
        assert.ok(rows[0].n > 0, 'table must still exist and hold rows');
    });

    await t.test('burn-after-read serves exactly one reader', async () => {
        const id = await seed({ maxViews: 1 });
        const results = await Promise.all(
            Array.from({ length: 8 }, () => readRoute(get(`${ORIGIN}/api/paste/${id}`), readParams(id)))
        );
        assert.strictEqual(results.filter((r) => r.status === 200).length, 1);
    });

    await t.test('an expired paste is never served', async () => {
        const id = await seed({ expiresAt: Date.now() - 1000 });
        const res = await readRoute(get(`${ORIGIN}/api/paste/${id}`), readParams(id));
        assert.ok(res.status === 410 || res.status === 404);
        assert.notStrictEqual(res.status, 200);
    });

    await t.test('rate limits reads per client', async () => {
        const id = await seed();
        const ip = nextIp();
        const codes: number[] = [];
        for (let i = 0; i < 65; i++) {
            const res = await readRoute(get(`${ORIGIN}/api/paste/${id}`, ip), readParams(id));
            codes.push(res.status);
        }
        assert.ok(codes.includes(429), 'reads should be capped');
    });
});

/* -------------------------------------------------------------------------- */

test('DELETE /api/paste/[id]', { skip: hasDb ? false : 'DATABASE_URL not set' }, async (t) => {
    const seed = async (token = generateToken()) => {
        const id = generatePasteId();
        await createPaste({
            id,
            ciphertext: 'Yw',
            iv: 'aXYx',
            authTag: 'dGFn',
            // Hash the SAME token that is handed back to the test.
            tokenHash: hashDeletionToken(token),
            hasPassword: false,
        } as never);
        return { id, token };
    };

    await t.test('rejects a wrong token with 401', async () => {
        const { id } = await seed();
        const res = await revokeRoute(
            del(`${ORIGIN}/api/paste/${id}?token=nope`),
            readParams(id)
        );
        assert.strictEqual(res.status, 401);
    });

    await t.test('a wrong token leaves the paste intact', async () => {
        const { id } = await seed();
        await revokeRoute(del(`${ORIGIN}/api/paste/${id}?token=nope`), readParams(id));
        const res = await readRoute(get(`${ORIGIN}/api/paste/${id}`), readParams(id));
        assert.strictEqual(res.status, 200);
    });

    await t.test('revokes with the correct token', async () => {
        const { id, token } = await seed('the-real-token');
        const res = await revokeRoute(
            del(`${ORIGIN}/api/paste/${id}?token=${token}`),
            readParams(id)
        );
        assert.strictEqual(res.status, 200);
        const after = await readRoute(get(`${ORIGIN}/api/paste/${id}`), readParams(id));
        assert.strictEqual(after.status, 404);
    });

    await t.test('a missing token is 401, not 400', async () => {
        const { id } = await seed();
        const res = await revokeRoute(del(`${ORIGIN}/api/paste/${id}`), readParams(id));
        assert.strictEqual(res.status, 401);
    });

    await t.test('does not reveal whether an id exists', async () => {
        const { id } = await seed();
        const wrongToken = await revokeRoute(
            del(`${ORIGIN}/api/paste/${id}?token=nope`),
            readParams(id)
        );
        const missing = await revokeRoute(
            del(`${ORIGIN}/api/paste/${generatePasteId()}?token=nope`),
            readParams(generatePasteId())
        );
        assert.strictEqual(wrongToken.status, missing.status);
        assert.deepStrictEqual(await wrongToken.json(), await missing.json());
    });
});

/* -------------------------------------------------------------------------- */

test('POST /api/paste/[id]/rotate', { skip: hasDb ? false : 'DATABASE_URL not set' }, async (t) => {
    const seed = async (token: string) => {
        const id = generatePasteId();
        await createPaste({
            id,
            ciphertext: 'Yw',
            iv: 'aXYx',
            authTag: 'dGFn',
            tokenHash: hashDeletionToken(token),
            hasPassword: false,
        } as never);
        return id;
    };

    await t.test('rotates with the correct token and keeps the payload', async () => {
        const id = await seed('rot-me');
        const res = await rotateRoute(
            post(`${ORIGIN}/api/paste/${id}/rotate`, { token: 'rot-me' }),
            readParams(id)
        );
        assert.strictEqual(res.status, 200);

        const { newId } = await res.json();
        assert.notStrictEqual(newId, id);

        assert.strictEqual((await readRoute(get(`${ORIGIN}/api/paste/${id}`), readParams(id))).status, 404);
        const moved = await readRoute(get(`${ORIGIN}/api/paste/${newId}`), readParams(newId));
        assert.strictEqual(moved.status, 200);
        assert.strictEqual((await moved.json()).ciphertext, 'Yw');
    });

    await t.test('rejects a wrong token and does not rotate', async () => {
        const id = await seed('right-token');
        const res = await rotateRoute(
            post(`${ORIGIN}/api/paste/${id}/rotate`, { token: 'wrong' }),
            readParams(id)
        );
        assert.strictEqual(res.status, 401);
        assert.strictEqual((await readRoute(get(`${ORIGIN}/api/paste/${id}`), readParams(id))).status, 200);
    });

    await t.test('rejects a missing token body', async () => {
        const id = await seed('t');
        const res = await rotateRoute(
            post(`${ORIGIN}/api/paste/${id}/rotate`, {}),
            readParams(id)
        );
        assert.strictEqual(res.status, 401);
    });
});

/* -------------------------------------------------------------------------- */

test('POST /api/init fails closed', { skip: hasDb ? false : 'DATABASE_URL not set' }, async (t) => {
    await t.test('refuses when INIT_SECRET is not configured', async () => {
        const original = process.env.INIT_SECRET;
        delete process.env.INIT_SECRET;
        try {
            const res = await initRoute(new NextRequest(`${ORIGIN}/api/init`, { method: 'POST' }));
            assert.strictEqual(res.status, 401);
        } finally {
            process.env.INIT_SECRET = original;
        }
    });

    await t.test('refuses without a bearer token', async () => {
        const original = process.env.INIT_SECRET;
        process.env.INIT_SECRET = 'a-secret';
        try {
            const res = await initRoute(new NextRequest(`${ORIGIN}/api/init`, { method: 'POST' }));
            assert.strictEqual(res.status, 401);
        } finally {
            process.env.INIT_SECRET = original;
        }
    });

    await t.test('refuses a wrong bearer token', async () => {
        const original = process.env.INIT_SECRET;
        process.env.INIT_SECRET = 'a-secret';
        try {
            const res = await initRoute(
                new NextRequest(`${ORIGIN}/api/init`, {
                    method: 'POST',
                    headers: { authorization: 'Bearer wrong' },
                })
            );
            assert.strictEqual(res.status, 401);
        } finally {
            process.env.INIT_SECRET = original;
        }
    });

    await t.test('succeeds with the right token', async () => {
        const original = process.env.INIT_SECRET;
        process.env.INIT_SECRET = 'a-secret';
        try {
            const res = await initRoute(
                new NextRequest(`${ORIGIN}/api/init`, {
                    method: 'POST',
                    headers: { authorization: 'Bearer a-secret' },
                })
            );
            assert.strictEqual(res.status, 200);
        } finally {
            process.env.INIT_SECRET = original;
        }
    });

    await t.test('GET is not allowed', async () => {
        const res = await initGetRoute();
        assert.strictEqual(res.status, 405);
        assert.strictEqual(res.headers.get('allow'), 'POST');
    });
});

/* -------------------------------------------------------------------------- */

test('GET /api/cron/cleanup fails closed', { skip: hasDb ? false : 'DATABASE_URL not set' }, async (t) => {
    await t.test('refuses when CRON_SECRET is not configured', async () => {
        const original = process.env.CRON_SECRET;
        delete process.env.CRON_SECRET;
        try {
            const res = await cleanupRoute(get(`${ORIGIN}/api/cron/cleanup`));
            assert.strictEqual(res.status, 401);
        } finally {
            process.env.CRON_SECRET = original;
        }
    });

    await t.test('refuses a wrong token', async () => {
        const original = process.env.CRON_SECRET;
        process.env.CRON_SECRET = 'cron-secret';
        try {
            const res = await cleanupRoute(
                new NextRequest(`${ORIGIN}/api/cron/cleanup`, {
                    headers: { authorization: 'Bearer nope' },
                })
            );
            assert.strictEqual(res.status, 401);
        } finally {
            process.env.CRON_SECRET = original;
        }
    });

    await t.test('purges expired rows with the right token', async () => {
        const original = process.env.CRON_SECRET;
        process.env.CRON_SECRET = 'cron-secret';
        try {
            await createPaste({
                id: generatePasteId(),
                ciphertext: 'Yw',
                iv: 'aXYx',
                authTag: 'dGFn',
                tokenHash: hashDeletionToken(generateToken()),
                hasPassword: false,
                expiresAt: Date.now() - 60_000,
            } as never);

            const res = await cleanupRoute(
                new NextRequest(`${ORIGIN}/api/cron/cleanup`, {
                    headers: { authorization: 'Bearer cron-secret' },
                })
            );
            assert.strictEqual(res.status, 200);
            assert.ok((await res.json()).pastesPurged >= 1);
        } finally {
            process.env.CRON_SECRET = original;
        }
    });
});
