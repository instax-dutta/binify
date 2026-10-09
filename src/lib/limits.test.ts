import { test } from 'node:test';
import assert from 'node:assert';
import { consumeLocalRateLimit, RATE_LIMITS } from './limits.ts';

const unique = () => `test:${Math.random().toString(36).slice(2)}`;

test('consumeLocalRateLimit', async (t) => {
    await t.test('allows traffic up to the limit', () => {
        const rule = { max: 3, windowSeconds: 60 };
        const id = unique();

        assert.strictEqual(consumeLocalRateLimit(id, rule).limited, false);
        assert.strictEqual(consumeLocalRateLimit(id, rule).limited, false);
        assert.strictEqual(consumeLocalRateLimit(id, rule).limited, false);
    });

    await t.test('blocks traffic beyond the limit', () => {
        const rule = { max: 2, windowSeconds: 60 };
        const id = unique();

        consumeLocalRateLimit(id, rule);
        consumeLocalRateLimit(id, rule);
        assert.strictEqual(consumeLocalRateLimit(id, rule).limited, true);
    });

    await t.test('tracks identifiers independently', () => {
        const rule = { max: 1, windowSeconds: 60 };
        const a = unique();
        const b = unique();

        assert.strictEqual(consumeLocalRateLimit(a, rule).limited, false);
        assert.strictEqual(consumeLocalRateLimit(a, rule).limited, true);
        assert.strictEqual(consumeLocalRateLimit(b, rule).limited, false);
    });

    await t.test('reports remaining quota without going negative', () => {
        const rule = { max: 2, windowSeconds: 60 };
        const id = unique();

        assert.strictEqual(consumeLocalRateLimit(id, rule).remaining, 1);
        assert.strictEqual(consumeLocalRateLimit(id, rule).remaining, 0);
        assert.strictEqual(consumeLocalRateLimit(id, rule).remaining, 0);
    });

    await t.test('returns a reset time inside the window', () => {
        const verdict = consumeLocalRateLimit(unique(), { max: 5, windowSeconds: 30 });
        assert.ok(verdict.resetIn > 0);
        assert.ok(verdict.resetIn <= 30);
    });
});

test('RATE_LIMITS', async (t) => {
    await t.test('every route has a positive budget and window', () => {
        for (const [route, rule] of Object.entries(RATE_LIMITS)) {
            assert.ok(rule.max > 0, `${route} max`);
            assert.ok(rule.windowSeconds > 0, `${route} window`);
        }
    });

    await t.test('reads use a shorter window than state-changing routes', () => {
        // Reads are metered per minute to blunt scraping; writes are metered per
        // hour because each one is expensive.
        assert.ok(RATE_LIMITS.read.windowSeconds < RATE_LIMITS.create.windowSeconds);
        assert.ok(RATE_LIMITS.rotate.windowSeconds > RATE_LIMITS.read.windowSeconds);
    });
});