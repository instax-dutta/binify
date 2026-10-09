/**
 * GET /api/cron/cleanup - Scheduled housekeeping.
 *
 * Redis previously expired payloads on its own. With a single relational store,
 * expiry has to be driven from here, so this endpoint is what stands in for the
 * TTL: it deletes pastes whose retention window has closed and prunes rate
 * limit windows that can no longer affect a verdict.
 *
 * Protected by CRON_SECRET, which Vercel sends as a bearer token on scheduled
 * invocations. Fails closed for the same reason /api/init does.
 */

import { NextRequest, NextResponse } from 'next/server';
import { purgeExpired } from '@/lib/pastes';
import { purgeStaleRateLimits } from '@/lib/rate-limit';
import { safeCompare } from '@/lib/security';
import { logger } from '@/lib/logging';
import { ApiError } from '@/lib/http';
import { errorResponse } from '@/lib/api';

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

        const pastes = await purgeExpired(1000);
        const limits = await purgeStaleRateLimits();

        logger.info(`[CRON] purged ${pastes} pastes, ${limits} rate limit windows`);

        return NextResponse.json(
            { pastesPurged: pastes, rateLimitsPurged: limits },
            { status: 200, headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (err) {
        return errorResponse(err, 'cleanup cron');
    }
}