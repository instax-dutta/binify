import { test } from 'node:test';
import assert from 'node:assert';
import { safeCompare, generateToken, verifyHash } from './security.ts';

process.env.TOKEN_PEPPER = 'test-pepper-value';

test('safeCompare', async (t) => {
    await t.test('should return true for identical strings', () => {
        assert.strictEqual(safeCompare('hello', 'hello'), true);
        assert.strictEqual(safeCompare('', ''), true);
        assert.strictEqual(safeCompare('a'.repeat(100), 'a'.repeat(100)), true);
    });

    await t.test('should return false for different strings of same length', () => {
        assert.strictEqual(safeCompare('hello', 'world'), false);
        assert.strictEqual(safeCompare('abcde', 'abcdf'), false);
    });

    await t.test('should return false for different strings of different length', () => {
        assert.strictEqual(safeCompare('hello', 'hello world'), false);
        assert.strictEqual(safeCompare('short', 'longer string'), false);
        assert.strictEqual(safeCompare('', 'not empty'), false);
    });

    await t.test('should handle unicode correctly', () => {
        assert.strictEqual(safeCompare('🔒', '🔒'), true);
        assert.strictEqual(safeCompare('🔒', '🔓'), false);
    });
});

test('generateToken', async (t) => {
    await t.test('should produce URL-safe output', () => {
        const token = generateToken();
        assert.match(token, /^[A-Za-z0-9_-]+$/);
    });

    await t.test('should produce enough entropy to resist guessing', () => {
        // 32 bytes -> 43 base64url chars.
        assert.strictEqual(generateToken().length, 43);
    });

    await t.test('should not repeat', () => {
        const seen = new Set(Array.from({ length: 500 }, () => generateToken()));
        assert.strictEqual(seen.size, 500);
    });
});

test('verifyHash', async (t) => {
    const { hashDeletionToken } = await import('./security.ts');

    await t.test('accepts the matching hash', () => {
        const h = hashDeletionToken('tok');
        assert.strictEqual(verifyHash(h, h), true);
    });

    await t.test('rejects a non-matching hash of equal length', () => {
        assert.strictEqual(
            verifyHash(hashDeletionToken('tok-a'), hashDeletionToken('tok-b')),
            false
        );
    });

    await t.test('rejects when no row was found', () => {
        assert.strictEqual(verifyHash(undefined, hashDeletionToken('tok')), false);
    });

    await t.test('does not throw on a null stored value', () => {
        assert.strictEqual(verifyHash(null as unknown as undefined, 'x'), false);
    });

    await t.test('never reports a match for the decoy', () => {
        // The decoy exists purely to equalise timing on a miss.
        assert.strictEqual(
            verifyHash(undefined, 'f'.repeat(64)),
            false
        );
    });
});

test('deletion token storage', async (t) => {
    const { hashDeletionToken } = await import('./security.ts');

    await t.test('should not store the token verbatim', async () => {
        const token = generateToken();
        const hash = hashDeletionToken(token);
        assert.notStrictEqual(hash, token);
        assert.ok(!hash.includes(token));
    });

    await t.test('should be deterministic for the same token', async () => {
        const token = generateToken();
        assert.strictEqual(hashDeletionToken(token), hashDeletionToken(token));
    });

    await t.test('should differ for different tokens', async () => {
        assert.notStrictEqual(hashDeletionToken(generateToken()), hashDeletionToken(generateToken()));
    });

    await t.test('should not verify a different token', async () => {
        const stored = hashDeletionToken(generateToken());
        const candidate = hashDeletionToken(generateToken());
        assert.strictEqual(safeCompare(stored, candidate), false);
    });

    await t.test('should refuse to hash without a configured pepper', async () => {
        const original = process.env.TOKEN_PEPPER;
        delete process.env.TOKEN_PEPPER;
        try {
            assert.throws(() => hashDeletionToken('anything'), /TOKEN_PEPPER/);
        } finally {
            process.env.TOKEN_PEPPER = original;
        }
    });
});