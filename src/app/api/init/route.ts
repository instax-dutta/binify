/**
 * POST /api/init - Create the database schema.
 *
 * Authorisation fails closed. The previous guard was
 * `if (initSecret && authHeader !== ...)`, which meant that an unset
 * INIT_SECRET disabled the check entirely and left schema creation open to
 * anyone. Requiring the secret to be both configured and correct is the only
 * arrangement where a missing configuration is safe.
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, withInitLock } from '@/lib/db';
import { safeCompare } from '@/lib/security';
import { consumeLocalRateLimit } from '@/lib/limits';
import { getClientIp } from '@/lib/ip';
import { logger } from '@/lib/logging';
import { ApiError } from '@/lib/http';
import { errorResponse } from '@/lib/api';

// Defence in depth: an endpoint that can run DDL should not be reachable in a
// tight loop even by someone who has the secret.
const INIT_RATE_LIMIT = { max: 5, windowSeconds: 3600 };

/**
 * Constant-time comparison of the presented bearer token against the secret.
 * Compared in constant time because the secret is a fixed-length high-entropy
 * value whose prefix must not be recoverable from response latency.
 */
function isAuthorised(request: NextRequest): boolean {
    const initSecret = process.env.INIT_SECRET;
    if (!initSecret) return false;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) return false;

    return safeCompare(authHeader, `Bearer ${initSecret}`);
}

export async function POST(request: NextRequest) {
    try {
        const verdict = consumeLocalRateLimit(
            `init:${getClientIp(request)}`,
            INIT_RATE_LIMIT
        );
        if (verdict.limited) {
            throw ApiError.rateLimited(verdict.resetIn);
        }

        if (!process.env.INIT_SECRET) {
            // Log the misconfiguration server-side; tell the caller nothing.
            logger.error('[INIT] INIT_SECRET is not configured. Refusing to initialise.');
            throw ApiError.unauthorized();
        }

        if (!isAuthorised(request)) {
            throw ApiError.unauthorized();
        }

        await withInitLock(() => initializeDatabase());

        return NextResponse.json(
            { message: 'Database initialised.' },
            { status: 200, headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (err) {
        return errorResponse(err, 'initialise database');
    }
}

/** Anything but POST is not offered here. */
export function GET() {
    return new NextResponse(null, {
        status: 405,
        headers: { Allow: 'POST' },
    });
}