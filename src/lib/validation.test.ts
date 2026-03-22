import { test } from 'node:test';
import assert from 'node:assert';
import { calculateExpiration, calculateTTL } from './validation.ts';

test('calculateTTL', async (t) => {
    t.mock.timers.enable({ apis: ['Date'] });
    const now = 1000000;
    t.mock.timers.setTime(now);

    await t.test('should return undefined when expiresAt is undefined', () => {
        assert.strictEqual(calculateTTL(undefined), undefined);
    });

    await t.test('should return positive seconds for future timestamp', () => {
        const future = now + 5000;
        assert.strictEqual(calculateTTL(future), 5);
    });

    await t.test('should return 0 for past timestamp (edge case)', () => {
        const past = now - 5000;
        assert.strictEqual(calculateTTL(past), 0);
    });

    await t.test('should return 0 for current timestamp', () => {
        assert.strictEqual(calculateTTL(now), 0);
    });

    await t.test('should floor the result', () => {
        const future = now + 5500;
        assert.strictEqual(calculateTTL(future), 5);
    });
});

test('calculateExpiration', async (t) => {
    t.mock.timers.enable({ apis: ['Date'] });
    const now = 1000000;
    t.mock.timers.setTime(now);

    await t.test('should return undefined for "never"', () => {
        assert.strictEqual(calculateExpiration('never'), undefined);
    });

    await t.test('should return now + 5 min', () => {
        assert.strictEqual(calculateExpiration('5min'), now + 5 * 60 * 1000);
    });

    await t.test('should return now + 1 hour', () => {
        assert.strictEqual(calculateExpiration('1hour'), now + 60 * 60 * 1000);
    });

    await t.test('should return now + 1 day', () => {
        assert.strictEqual(calculateExpiration('1day'), now + 24 * 60 * 60 * 1000);
    });

    await t.test('should return now + 7 days', () => {
        assert.strictEqual(calculateExpiration('7days'), now + 7 * 24 * 60 * 60 * 1000);
    });

    await t.test('should return now + 30 days', () => {
        assert.strictEqual(calculateExpiration('30days'), now + 30 * 24 * 60 * 60 * 1000);
    });

    await t.test('should return undefined for "views"', () => {
        assert.strictEqual(calculateExpiration('views'), undefined);
    });

    await t.test('should return undefined for "burn"', () => {
        assert.strictEqual(calculateExpiration('burn'), undefined);
    });
});
