/**
 * HTTP primitives shared by the API routes.
 *
 * Deliberately free of framework imports so the validation and error-shaping
 * logic can be exercised directly, without booting a Next.js server.
 */

/**
 * A failure safe to return to the caller.
 *
 * Internal details (driver messages, SQL fragments, upstream hostnames) belong
 * in the log, never in the response body: they tell an attacker which vendors
 * and hosts the deployment uses.
 */
export class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    /** Headers this failure requires, merged into the error response. */
    readonly headers: Record<string, string>;

    constructor(
        status: number,
        code: string,
        message: string,
        headers: Record<string, string> = {}
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.headers = headers;
    }

    static unauthorized(): ApiError {
        return new ApiError(401, 'unauthorized', 'Unauthorized.');
    }

    static notFound(): ApiError {
        return new ApiError(404, 'not_found', 'Not found.');
    }

    static rateLimited(resetIn: number): ApiError {
        return new ApiError(
            429,
            'rate_limited',
            'Rate limit exceeded. Try again later.',
            // A client told how long to wait does not have to guess or poll.
            { 'Retry-After': String(Math.max(1, Math.ceil(resetIn))) }
        );
    }

    static badRequest(message = 'Invalid request payload.'): ApiError {
        return new ApiError(400, 'invalid_request', message);
    }

    static tooLarge(message = 'Payload exceeds the size limit.'): ApiError {
        return new ApiError(413, 'too_large', message);
    }

    static unsupportedMediaType(): ApiError {
        return new ApiError(415, 'unsupported_media_type', 'Expected JSON.');
    }
}

export interface RateLimitState {
    limited: boolean;
    remaining: number;
    resetIn: number;
}

/**
 * Standard headers for every API response: no caching of paste material, and
 * rate-limit state so well-behaved clients can back off without guessing.
 */
export function apiHeaders(verdict?: RateLimitState, limit?: number): Record<string, string> {
    const headers: Record<string, string> = {
        // Paste responses must never be cached by a CDN or an intermediary.
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
    };

    if (verdict) {
        if (limit !== undefined) {
            headers['X-RateLimit-Limit'] = String(limit);
        }
        headers['X-RateLimit-Remaining'] = String(verdict.remaining);
        headers['X-RateLimit-Reset'] = String(verdict.resetIn);
    }

    return headers;
}

/** Paste IDs are nanoid(14): 14 characters from the URL-safe alphabet. */
const ID_PATTERN = /^[A-Za-z0-9_-]{14}$/;

export function isValidPasteId(id: string): boolean {
    return ID_PATTERN.test(id);
}

/**
 * Validate a paste ID before it reaches the database.
 *
 * Without this, any request can push an arbitrary string into a query
 * parameter, which both wastes index lookups and lets a caller probe with
 * hostile input. A malformed id is reported as missing rather than invalid, so
 * the endpoint reveals nothing about the expected format.
 */
export function assertValidPasteId(id: string): void {
    if (!isValidPasteId(id)) {
        throw ApiError.notFound();
    }
}