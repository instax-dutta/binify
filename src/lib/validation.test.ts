import { test } from 'node:test';
import assert from 'node:assert';
import { calculateExpiration, type ExpirationType } from './validation.ts';

/**
 * Expiry is the rule that decides when a secret dies, and it had no test at
 * all. Ported from an unmerged branch that had been open since March, minus the
 * half that tested `calculateTTL` - a function that no longer exists.
 *
 * The clock is mocked so the assertions are exact rather than approximate.
 */
test('calculateExpiration', async (t) => {
    t.mock.timers.enable({ apis: ['Date'] });
    const now = 1_000_000;
    t.mock.timers.setTime(now);

    const MINUTE = 60 * 1000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    await t.test('never expires with no timestamp', () => {
        assert.strictEqual(calculateExpiration('never'), undefined);
    });

    await t.test('honours each timed window exactly', () => {
        const expected: Partial<Record<ExpirationType, number>> = {
            '5min': now + 5 * MINUTE,
            '1hour': now + HOUR,
            '1day': now + DAY,
            '7days': now + 7 * DAY,
            '30days': now + 30 * DAY,
        };
        for (const [type, at] of Object.entries(expected)) {
            assert.strictEqual(calculateExpiration(type as ExpirationType), at, type);
        }
    });

    await t.test('view-count and first-reading slips carry no timestamp', () => {
        // They die by being read, not by the clock; a timestamp here would
        // delete a slip that nobody has opened yet.
        assert.strictEqual(calculateExpiration('views'), undefined);
        assert.strictEqual(calculateExpiration('burn'), undefined);
    });

    await t.test('a timed window is measured from the moment of sealing', () => {
        const later = now + 10 * DAY;
        t.mock.timers.setTime(later);
        assert.strictEqual(calculateExpiration('5min'), later + 5 * MINUTE);
    });
});
