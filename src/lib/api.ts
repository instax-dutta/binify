/**
 * Framework glue for API routes. The rules and the error type live in ./http so
 * they stay testable without a server; this module only adapts them to
 * `NextResponse`.
 */

import { NextResponse } from 'next/server';
import { logger, sanitizeError } from './logging';
import { ApiError, apiHeaders, type RateLimitState } from './http';

export { ApiError, apiHeaders, assertValidPasteId, isValidPasteId } from './http';

/**
 * Turn anything thrown inside a handler into a response.
 *
 * Only `ApiError` messages reach the client; everything else collapses to a
 * generic 500 while the real cause is logged with a request id that the caller
 * can quote in a bug report.
 */
export function errorResponse(err: unknown, context: string): NextResponse {
    const requestId = crypto.randomUUID();

    if (err instanceof ApiError) {
        return NextResponse.json(
            { error: err.message, code: err.code },
            { status: err.status, headers: apiHeaders() }
        );
    }

    logger.error(`[API_ERROR] ${context} requestId=${requestId}`, sanitizeError(err));

    return NextResponse.json(
        { error: 'Internal server error.', requestId },
        { status: 500, headers: apiHeaders() }
    );
}

/**
 * Re-exported so routes can attach rate-limit headers without importing two
 * modules.
 */
export type { RateLimitState };