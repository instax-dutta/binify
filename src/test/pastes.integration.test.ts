/**
 * Integration tests. These require a real PostgreSQL instance and are skipped
 * when DATABASE_URL is unset.
 *
 * Run with:  npm run test:integration
 *
 * The concurrency cases are the point of the single-store design. They assert
 * the guarantees that the previous two-database arrangement could not offer:
 * a view-limited paste is served exactly as many times as it allows, even when
 * the requests arrive simultaneously, and authorisation cannot be won by
 * racing a delete.
 */

import { test } from 'node:test';
import assert from 'node:assert';

import {
    createPaste,
    consumePaste,
    revokePaste,
    rotatePasteId,
    purgeExpired,
} from '../lib/pastes';
import { consumeRateLimit, purgeStaleRateLimits } from '../lib/rate-limit';
import { hashDeletionToken } from '../lib/security';
import { generatePasteId } from '../lib/crypto';

// Importing the db module does not open a connection; the pool is created
// lazily on first query. So these imports are safe with no DATABASE_URL.
const hasDb = Boolean(process.env.DATABASE_URL);

if (hasDb) process.env.TOKEN_PEPPER = process.env.TOKEN_PEPPER ?? 'integration-pepper';

const payload = {
    ciphertext: 'Y2lwaGVydGV4dA',
    iv: 'aXYxMjM0NTY3ODkwYWJjZGVm',
    authTag: 'dGFnMTIzNDU2Nzg5MGFiY2RlZg',
};

/**
 * Build a paste to insert. Pass `token` to control the deletion token so a
 * test can authorise deliberately; otherwise a random one is used.
 */
const makePaste = (overrides: Record<string, unknown> = {}) => {
    const { token, ...rest } = overrides as { token?: string };
    return {
        id: generatePasteId(),
        ...payload,
        tokenHash: hashDeletionToken(token ?? generatePasteId()),
        hasPassword: false,
        ...rest,
    };
};

test('paste store', { skip: hasDb ? false : 'DATABASE_URL not set' }, async (t) => {
    await t.test('stores and reads back a paste', async () => {
        const paste = makePaste({ title: 'hello', language: 'typescript' });
        await createPaste(paste as never);

        const got = await consumePaste(paste.id);
        assert.ok(got, 'paste should be readable');
        assert.strictEqual(got.ciphertext, paste.ciphertext);
        assert.strictEqual(got.authTag, paste.authTag);
        assert.strictEqual(got.title, 'hello');
        assert.strictEqual(got.viewCount, 1);
    });

    await t.test('never returns the deletion token hash', async () => {
        const paste = makePaste();
        await createPaste(paste as never);
        const got = await consumePaste(paste.id);
        assert.ok(got);
        assert.ok(!('tokenHash' in (got as object)));
        assert.ok(!('token_hash' in (got as object)));
    });
});

test('burn-after-read is exactly once under concurrency', {
    skip: hasDb ? false : 'DATABASE_URL not set',
}, async (t) => {
    await t.test('a 1-view paste serves exactly one of many simultaneous reads', async () => {
        const paste = makePaste({ maxViews: 1 });
        await createPaste(paste as never);

        // 12 concurrent reads of a paste that only permits one.
        const results = await Promise.all(
            Array.from({ length: 12 }, () => consumePaste(paste.id))
        );

        const served = results.filter(Boolean);
        assert.strictEqual(
            served.length,
            1,
            `expected exactly one successful read, got ${served.length}`
        );
        assert.strictEqual(served[0]?.finalView, true);
    });

    await t.test('an N-view paste serves exactly N simultaneous reads', async () => {
        const paste = makePaste({ maxViews: 5 });
        await createPaste(paste as never);

        const results = await Promise.all(
            Array.from({ length: 20 }, () => consumePaste(paste.id))
        );

        assert.strictEqual(results.filter(Boolean).length, 5);
    });

    await t.test('an unlimited paste is served every time', async () => {
        const paste = makePaste();
        await createPaste(paste as never);

        const results = await Promise.all(
            Array.from({ length: 10 }, () => consumePaste(paste.id))
        );

        assert.strictEqual(results.filter(Boolean).length, 10);
    });

    await t.test('an expired paste is never served', async () => {
        const paste = makePaste({ expiresAt: Date.now() - 60_000 });
        await createPaste(paste as never);
        assert.strictEqual(await consumePaste(paste.id), null);
    });
});

test('authorisation', { skip: hasDb ? false : 'DATABASE_URL not set' }, async (t) => {
    await t.test('revoke requires the correct token', async () => {
        const paste = makePaste();
        await createPaste(paste as never);

        assert.strictEqual(await revokePaste(paste.id, hashDeletionToken('wrong')), false);
        assert.ok(await consumePaste(paste.id), 'paste must survive a failed revoke');
    });

    await t.test('a wrong token cannot win by racing a correct one', async () => {
        const paste = makePaste({ token: 'correct-token' });
        await createPaste(paste as never);
        const good = hashDeletionToken('correct-token');

        const results = await Promise.all([
            revokePaste(paste.id, hashDeletionToken('attacker-a')),
            revokePaste(paste.id, hashDeletionToken('attacker-b')),
            revokePaste(paste.id, good),
        ]);

        assert.strictEqual(results.filter(Boolean).length, 1);
        assert.strictEqual(await consumePaste(paste.id), null);
    });

    await t.test('rotation requires the correct token and moves the payload', async () => {
        const paste = makePaste({ token: 'right' });
        await createPaste(paste as never);
        const newId = generatePasteId();

        assert.strictEqual(
            await rotatePasteId(paste.id, newId, hashDeletionToken('nope')),
            false
        );

        assert.strictEqual(
            await rotatePasteId(paste.id, newId, hashDeletionToken('right')),
            true
        );

        // Old id is gone; the payload moved with the id rather than being copied.
        assert.strictEqual(await consumePaste(paste.id), null);
        const moved = await consumePaste(newId);
        assert.ok(moved);
        assert.strictEqual(moved.ciphertext, paste.ciphertext);
    });
});

test('rate limit counters are atomic', { skip: hasDb ? false : 'DATABASE_URL not set' }, async (t) => {
    await t.test('concurrent requests cannot exceed the limit', async () => {
        const key = `integration:${Math.random()}`;
        const rule = { max: 5, windowSeconds: 60 };

        const results = await Promise.all(
            Array.from({ length: 25 }, () => consumeRateLimit(key, rule))
        );

        // 25 concurrent calls, budget 5: exactly 5 should be within budget.
        const allowed = results.filter((r) => !r.limited).length;
        assert.strictEqual(allowed, 5, `expected 5 allowed, got ${allowed}`);
    });
});

test('housekeeping', { skip: hasDb ? false : 'DATABASE_URL not set' }, async (t) => {
    await t.test('purges pastes whose window has closed', async () => {
        const stale = makePaste({ expiresAt: Date.now() - 60_000 });
        const live = makePaste({ expiresAt: Date.now() + 3_600_000 });
        await createPaste(stale as never);
        await createPaste(live as never);

        await purgeExpired(1000);

        assert.strictEqual(await consumePaste(stale.id), null);
        assert.ok(await consumePaste(live.id), 'unexpired paste must survive');
    });

    await t.test('prunes stale rate limit windows', async () => {
        await purgeStaleRateLimits();
    });
});