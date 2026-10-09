/**
 * In-process rate limiting, and the route budgets.
 *
 * Used for reads. Every read already costs a database round trip; writing a
 * counter row for each one would double write throughput on a free tier. An
 * in-process window still stops a scraper hammering a single instance, and it
 * is deliberately not treated as a security boundary — see
 * `consumeRateLimit` in ./rate-limit for the durable counters that guard the
 * state-changing routes.
 *
 * Free of framework and database imports, so it can be exercised directly.
 */

export interface RateLimitVerdict {
    limited: boolean;
    remaining: number;
    /** Seconds until the current window rolls over. */
    resetIn: number;
}

export interface RateLimitRule {
    max: number;
    windowSeconds: number;
}

/** Route budgets. Reads are capped because each one is a database row read. */
export const RATE_LIMITS = {
    create: { max: 10, windowSeconds: 3600 },
    read: { max: 60, windowSeconds: 60 },
    rotate: { max: 10, windowSeconds: 3600 },
    revoke: { max: 20, windowSeconds: 3600 },
} as const satisfies Record<string, RateLimitRule>;

const buckets = new Map<string, { start: number; count: number }>();

// Bound the map so a flood of distinct keys (e.g. unique IPs) cannot grow it
// without limit. When it fills, the oldest entries are dropped.
const MAX_BUCKETS = 10_000;

const STALE_AFTER_MS = 86_400_000;

function sweep(now: number): void {
    for (const [key, bucket] of buckets) {
        if (now - bucket.start > STALE_AFTER_MS) buckets.delete(key);
    }
    while (buckets.size > MAX_BUCKETS) {
        const oldest = buckets.keys().next();
        if (oldest.done) break;
        buckets.delete(oldest.value);
    }
}

/**
 * Consume one unit of quota from the in-process window for `identifier`.
 */
export function consumeLocalRateLimit(
    identifier: string,
    rule: RateLimitRule
): RateLimitVerdict {
    const now = Date.now();
    const windowMs = rule.windowSeconds * 1000;

    let bucket = buckets.get(identifier);
    if (!bucket || now - bucket.start >= windowMs) {
        bucket = { start: now, count: 0 };
        buckets.set(identifier, bucket);
    }

    bucket.count += 1;

    if (buckets.size > MAX_BUCKETS) sweep(now);

    return {
        limited: bucket.count > rule.max,
        remaining: Math.max(0, rule.max - bucket.count),
        resetIn: Math.max(1, Math.ceil((bucket.start + windowMs - now) / 1000)),
    };
}