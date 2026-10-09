/**
 * GET /api/cron/keepalive - Touch the database so the compute does not idle out.
 *
 * Read the runbook before assuming this is what keeps Neon available. It is not,
 * and this route is the smaller half of the answer.
 *
 * Neon has two very different behaviours that are easy to conflate:
 *
 *   1. Scale to zero. After 5 minutes with no queries the compute suspends and
 *      wakes again on the next connection in a few hundred milliseconds. This is
 *      not an outage and nothing is lost. Calling it a "die" overstates it.
 *
 *   2. Consumption quotas. If the project hits a compute-time, storage or
 *      transfer quota, Neon suspends the computes and, unlike scale to zero,
 *      a new connection does NOT wake them. They stay down until the billing
 *      period resets. This is the one that can actually take the site offline,
 *      and pinging makes it worse: a keepalive spends compute time and egress,
 *      both of which are the quota.
 *
 * So: for (1), the real fix is one setting, `suspend_timeout_seconds: 0` on a
 * paid plan, which keeps the compute resident without any traffic at all. For
 * (2) nothing keeps it alive, and the fix is the limits instead.
 *
 * What this route is genuinely good for is telling the two apart: it reports
 * whether a query succeeded and how long it took, so a scheduled run turns
 * "the database is unreachable" into a log line instead of a mystery. It runs
 * SELECT 1, which moves no rows and returns no payload.
 *
 * Protected by CRON_SECRET and fails closed, for the same reason /api/init does.
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { safeCompare } from '@/lib/security';
import { logger } from '@/lib/logging';
import { ApiError } from '@/lib/http';
import { errorResponse } from '@/lib/api';

/** Resolve quickly rather than holding a Vercel function open for a cold start. */
const PROBE_TIMEOUT_MS = 15_000;

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function isAuthorised(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) return false;

    return safeCompare(authHeader, `Bearer ${secret}`);
}

export async function GET(request: NextRequest) {
    try {
        if (!isAuthorised(request)) {
            throw ApiError.unauthorized();
        }

        const started = Date.now();

        // A cold compute can take a moment to resume, so the budget covers that
        // rather than reporting a false failure for a healthy database.
        const result = await Promise.race([
            queryOne<{ ok: number }>('SELECT 1 AS ok'),
            new Promise<never>((_, reject) =>
                setTimeout(
                    () => reject(new Error('probe timed out')),
                    PROBE_TIMEOUT_MS
                )
            ),
        ]);

        const durationMs = Date.now() - started;

        if (result?.ok !== 1) {
            throw new Error('probe returned an unexpected result');
        }

        logger.info(`[KEEPALIVE] database reachable in ${durationMs}ms`);

        return NextResponse.json(
            { ok: true, durationMs, at: new Date().toISOString() },
            { status: 200, headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (err) {
        // Reuse the shared shape so a monitor reads the same requestId convention
        // as every other route, and the cause still lands in the log rather than
        // in the response.
        logger.error('[KEEPALIVE] probe failed');
        return errorResponse(err, 'keepalive probe');
    }
}