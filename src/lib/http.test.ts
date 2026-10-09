import { test } from 'node:test';
import assert from 'node:assert';
import { ApiError, assertValidPasteId, apiHeaders } from './http.ts';

test('assertValidPasteId', async (t) => {
    await t.test('accepts a well-formed nanoid(14) id', () => {
        assert.doesNotThrow(() => assertValidPasteId('6N5Gtuzh8EOWi8'));
    });

    await t.test('rejects ids of the wrong length', () => {
        assert.throws(() => assertValidPasteId('tooshort'), ApiError);
        // 15 characters: one over the limit.
        assert.throws(() => assertValidPasteId('waaaaaaaaaaaaaaa'), ApiError);
    });

    await t.test('rejects characters outside the URL-safe alphabet', () => {
        assert.throws(() => assertValidPasteId("'; DROP TABLE x --"), ApiError);
        assert.throws(() => assertValidPasteId('../../../etc/pw'), ApiError);
        assert.throws(() => assertValidPasteId('abc def ghij k'), ApiError);
        assert.throws(() => assertValidPasteId('abcdefghijklm\u0000'), ApiError);
    });

    await t.test('reports a malformed id as not found, not as a validation error', () => {
        try {
            assertValidPasteId('bad id');
            assert.fail('expected a throw');
        } catch (err) {
            assert.ok(err instanceof ApiError);
            // 404 rather than 400, so probing reveals nothing about the format.
            assert.strictEqual(err.status, 404);
        }
    });
});

test('ApiError', async (t) => {
    await t.test('carries a status and a stable machine-readable code', () => {
        const err = ApiError.notFound();
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.code, 'not_found');
        assert.ok(err instanceof Error);
    });

    await t.test('unauthorized, notFound and gone are distinct', () => {
        const statuses = new Set([
            ApiError.unauthorized().status,
            ApiError.notFound().status,
            ApiError.gone().status,
        ]);
        assert.strictEqual(statuses.size, 3);
    });
});

test('apiHeaders', async (t) => {
    await t.test('forbids caching of paste material', () => {
        const headers = apiHeaders() as Record<string, string>;
        assert.match(headers['Cache-Control'], /no-store/);
    });

    await t.test('exposes rate-limit state only when supplied', () => {
        const without = apiHeaders() as Record<string, string>;
        assert.strictEqual(without['X-RateLimit-Remaining'], undefined);

        const with_ = apiHeaders({ limited: false, remaining: 7, resetIn: 42 }, 10) as Record<
            string,
            string
        >;
        assert.strictEqual(with_['X-RateLimit-Limit'], '10');
        assert.strictEqual(with_['X-RateLimit-Remaining'], '7');
        assert.strictEqual(with_['X-RateLimit-Reset'], '42');
    });
});