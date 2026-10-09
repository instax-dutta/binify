/**
 * POST /api/paste - Create an encrypted paste.
 *
 * The payload and its metadata are written as one row in one statement, so the
 * paste either exists completely or not at all.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePasteId } from '@/lib/crypto';
import { generateToken, hashDeletionToken } from '@/lib/security';
import { createPaste, opportunisticPurge } from '@/lib/pastes';
import { consumeRateLimit } from '@/lib/rate-limit';
import { consumeLocalRateLimit, RATE_LIMITS } from '@/lib/limits';
import { getClientIp } from '@/lib/ip';
import {
    CreatePasteSchema,
    calculateExpiration,
    validatePasteSize,
    MAX_PASTE_SIZE,
} from '@/lib/validation';
import { ApiError, apiHeaders, assertValidPasteId } from '@/lib/http';
import { errorResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        const verdict = await consumeRateLimit(
            `create:${getClientIp(request)}`,
            RATE_LIMITS.create
        );

        if (verdict.limited) {
            throw ApiError.rateLimited(verdict.resetIn);
        }

        // Cap the body before parsing. Vercel already caps request size, but
        // checking the declared length rejects an oversized payload without
        // buffering it.
        const declared = Number(request.headers.get('content-length') ?? 0);
        if (declared > MAX_PASTE_SIZE * 2) {
            throw ApiError.tooLarge();
        }

        const contentType = request.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
            throw ApiError.unsupportedMediaType();
        }

        const parsed = CreatePasteSchema.safeParse(await request.json());
        if (!parsed.success) {
            throw ApiError.badRequest();
        }
        const data = parsed.data;

        if (!validatePasteSize(data.ciphertext)) {
            throw ApiError.tooLarge();
        }

        // Three independent nanoid draws. A collision is handled by the primary
        // key rejecting the insert, so there is nothing to retry around.
        const pasteId = generatePasteId();
        const deletionToken = generateToken();
        const expiresAt = calculateExpiration(data.expirationType);

        let maxViews: number | undefined;
        if (data.expirationType === 'burn') {
            maxViews = 1;
        } else if (data.expirationType === 'views') {
            maxViews = data.maxViews;
        }

        await createPaste({
            id: pasteId,
            ciphertext: data.ciphertext,
            iv: data.iv,
            authTag: data.authTag,
            salt: data.salt,
            iterations: data.iterations,
            // Only the hash is persisted, so a database dump cannot revoke or
            // rotate anyone's paste.
            tokenHash: hashDeletionToken(deletionToken),
            expiresAt,
            maxViews,
            hasPassword: data.hasPassword,
            title: data.title,
            language: data.language,
        });

        // Best-effort housekeeping; never surfaced to the caller.
        void opportunisticPurge();

        return NextResponse.json(
            { pasteId, deletionToken, expiresAt, maxViews },
            { status: 201, headers: apiHeaders(verdict, RATE_LIMITS.create.max) }
        );
    } catch (err) {
        return errorResponse(err, 'create paste');
    }
}