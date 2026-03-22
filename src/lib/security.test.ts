import { test } from 'node:test';
import assert from 'node:assert';
import { safeCompare } from './security.ts';

test('safeCompare function', async (t) => {
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
