import { test } from 'node:test';
import assert from 'node:assert';
import { validatePasteSize, MAX_PASTE_SIZE } from './paste-size.ts';

test('validatePasteSize', async (t) => {
    await t.test('should return true for empty string', () => {
        assert.strictEqual(validatePasteSize(''), true);
    });

    await t.test('should return true for string at MAX_PASTE_SIZE limit', () => {
        // Base64 estimation is (length * 3) / 4
        // To get estimatedSize = MAX_PASTE_SIZE, length = MAX_PASTE_SIZE * 4 / 3
        const length = (MAX_PASTE_SIZE * 4) / 3;
        const input = 'A'.repeat(length);
        assert.strictEqual(validatePasteSize(input), true);
    });

    await t.test('should return false for string just above MAX_PASTE_SIZE limit', () => {
        const length = (MAX_PASTE_SIZE * 4) / 3 + 1;
        const input = 'A'.repeat(length);
        assert.strictEqual(validatePasteSize(input), false);
    });

    await t.test('should return true for a small string', () => {
        assert.strictEqual(validatePasteSize('small string'), true);
    });

    await t.test('should return false for a very large string', () => {
        const input = 'A'.repeat(MAX_PASTE_SIZE * 2);
        assert.strictEqual(validatePasteSize(input), false);
    });
});
