import { test } from 'node:test';
import assert from 'node:assert';
import { parseMaxPasteSize, validatePasteSize, decodedByteLength, MAX_PASTE_SIZE } from './paste-size.ts';

test('decodedByteLength', async (t) => {
    await t.test('is exact for full 4-character groups', () => {
        assert.strictEqual(decodedByteLength('AAAA'), 3);
        assert.strictEqual(decodedByteLength('AAAAAAAA'), 6);
    });

    await t.test('handles the 2- and 3-character remainders', () => {
        assert.strictEqual(decodedByteLength('AA'), 1);
        assert.strictEqual(decodedByteLength('AAA'), 2);
    });

    await t.test('handles empty and single-character input', () => {
        assert.strictEqual(decodedByteLength(''), 0);
        assert.strictEqual(decodedByteLength('A'), 0);
    });

    await t.test('matches a real base64url round trip', () => {
        for (const bytes of [1, 2, 3, 4, 5, 100, 255]) {
            const b64 = Buffer.from(Uint8Array.from({ length: bytes }, (_, i) => i))
                .toString('base64url');
            assert.strictEqual(decodedByteLength(b64), bytes, `for ${bytes} bytes`);
        }
    });
});

test('validatePasteSize', async (t) => {
    // Build a base64url string that decodes to exactly `bytes` bytes.
    const ofBytes = (bytes: number) =>
        Buffer.alloc(bytes, 0x41).toString('base64url');

    await t.test('accepts an empty string', () => {
        assert.strictEqual(validatePasteSize(''), true);
    });

    await t.test('accepts content of exactly the limit', () => {
        assert.strictEqual(validatePasteSize(ofBytes(MAX_PASTE_SIZE)), true);
    });

    await t.test('rejects one byte over the limit', () => {
        assert.strictEqual(validatePasteSize(ofBytes(MAX_PASTE_SIZE + 1)), false);
    });

    await t.test('accepts small input', () => {
        assert.strictEqual(validatePasteSize(ofBytes(1024)), true);
    });

    await t.test('rejects input far above the limit', () => {
        assert.strictEqual(validatePasteSize(ofBytes(MAX_PASTE_SIZE * 2)), false);
    });

    await t.test('does not allocate to measure', () => {
        // A 4 MB string would be wasteful to decode; the check is arithmetic.
        const started = Date.now();
        assert.strictEqual(validatePasteSize('A'.repeat(6_000_000)), false);
        assert.ok(Date.now() - started < 500, 'measurement should be near-instant');
    });
});

test('parseMaxPasteSize', async (t) => {
    const DEFAULT = 4 * 1024 * 1024;
    const CEILING = 4 * 1024 * 1024;
    const FLOOR = 1024;

    await t.test('falls back to the default when unset or blank', () => {
        assert.strictEqual(parseMaxPasteSize(undefined), DEFAULT);
        assert.strictEqual(parseMaxPasteSize(''), DEFAULT);
        assert.strictEqual(parseMaxPasteSize('   '), DEFAULT);
    });

    await t.test('falls back to the default on an unparseable value', () => {
        // The point of these: '1MB' is the trap. parseInt would read it as 1 and
        // clamp to the 1 KB floor, silently capping every paste at a kilobyte.
        assert.strictEqual(parseMaxPasteSize('abc'), DEFAULT);
        assert.strictEqual(parseMaxPasteSize('1MB'), DEFAULT);
        assert.strictEqual(parseMaxPasteSize('12abc'), DEFAULT);
        assert.strictEqual(parseMaxPasteSize('1_000_000'), DEFAULT);
        assert.strictEqual(parseMaxPasteSize('NaN'), DEFAULT);
        assert.strictEqual(parseMaxPasteSize('-1'), DEFAULT);
        assert.strictEqual(parseMaxPasteSize('1e6'), DEFAULT);
    });

    await t.test('honours a configured value', () => {
        // The value this deployment actually uses.
        assert.strictEqual(parseMaxPasteSize('1000000'), 1_000_000);
        assert.strictEqual(parseMaxPasteSize('262144'), 262_144);
    });

    await t.test('clamps a value above the hard ceiling', () => {
        assert.strictEqual(parseMaxPasteSize('999999999'), CEILING);
    });

    await t.test('clamps a value below the floor instead of disabling it', () => {
        // Zero and other small numbers are valid integers, so they clamp rather
        // than fall back, and the limit can never be switched off.
        assert.strictEqual(parseMaxPasteSize('0'), FLOOR);
        assert.strictEqual(parseMaxPasteSize('10'), FLOOR);
        assert.strictEqual(parseMaxPasteSize('1024'), FLOOR);
    });
});
