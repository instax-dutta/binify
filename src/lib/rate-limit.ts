/**
 * Durable rate-limit counters, backed by the same Postgres instance as the
 * data.
 *
 * Used for state-changing routes, where exceeding a limit costs money or data
 * and the count must survive the instance being recycled. The counter update is
 * a single upsert, so concurrent requests cannot both observe the same
 * pre-increment value and slip past the limit.
 */

import { queryOne } from './db';

export type { RateLimitRule, RateLimitVerdict } from './limits';

export interface DurableVerdict {
    limited: boolean;
    remaining: number;
    resetIn: number;
}

/**
 * Consume one unit of quota for `identifier`.
 *
 * `window_start` is reset in the same statement that increments `count`, so a
 * lapsed window can never keep counting against the previous window's total.
 */
export async function consumeRateLimit(
    identifier: string,
    rule: { max: number; windowSeconds: number }
): Promise<DurableVerdict> {
    const row = await queryOne<{ count: number; reset_in: string }>(
        `INSERT INTO rate_limits (key, window_start, count)
              VALUES ($1, now(), 1)
         ON CONFLICT (key) DO UPDATE SET
               count = CASE
                         WHEN rate_limits.window_start <= now() - ($2::int * interval '1 second')
                         THEN 1
                         ELSE rate_limits.count + 1
                     END,
               window_start = CASE
                         WHEN rate_limits.window_start <= now() - ($2::int * interval '1 second')
                         THEN now()
                         ELSE rate_limits.window_start
                     END
        RETURNING count,
                  EXTRACT(EPOCH FROM ($2::int * interval '1 second'
                                     - (now() - rate_limits.window_start))) AS reset_in`,
        [identifier, rule.windowSeconds]
    );

    const count = row?.count ?? 1;

    return {
        limited: count > rule.max,
        remaining: Math.max(0, rule.max - count),
        resetIn: Math.max(0, Math.ceil(Number(row?.reset_in ?? rule.windowSeconds))),
    };
}

/**
 * Drop windows that can no longer affect a verdict. Keeps the table bounded
 * without needing a separate janitor process.
 */
export async function purgeStaleRateLimits(): Promise<number> {
    const row = await queryOne<{ count: string }>(
        `WITH deleted AS (
             DELETE FROM rate_limits
              WHERE window_start <= now() - interval '24 hours'
              RETURNING 1
         )
         SELECT count(*) AS count FROM deleted`
    );
    return Number(row?.count ?? 0);
}