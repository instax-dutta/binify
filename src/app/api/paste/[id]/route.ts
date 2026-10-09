/**
 * GET    /api/paste/[id] - Retrieve an encrypted paste (consumes one view)
 * DELETE /api/paste/[id] - Revoke a paste with its deletion token
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    consumePaste,
    getPasteState,
    deleteIfExhausted,
    revokePaste,
} from '@/lib/pastes';
import { consumeRateLimit } from '@/lib/rate-limit';
import { consumeLocalRateLimit, RATE_LIMITS } from '@/lib/limits';
import { getClientIp } from '@/lib/ip';
import { hashDeletionToken } from '@/lib/security';
import { ApiError, apiHeaders, assertValidPasteId } from '@/lib/http';
import { errorResponse } from '@/lib/api';

/**
 * GET - Retrieve a paste and advance its view budget.
 *
 * `consumePaste` decides inside a single statement whether this caller is the
 * one that gets the last permitted view, so parallel requests cannot both
 * succeed. The client decrypts with a key held in the URL fragment, which the
 * server never receives, so the response body is ciphertext to anyone who has
 * only the paste id.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        assertValidPasteId(id);

        const verdict = consumeLocalRateLimit(`read:${getClientIp(request)}`, RATE_LIMITS.read);
        if (verdict.limited) {
            throw ApiError.rateLimited(verdict.resetIn);
        }

        const paste = await consumePaste(id);

        if (!paste) {
            // Distinguish "gone" from "never existed" without leaking anything
            // about rows that do exist.
            const state = await getPasteState(id);
            if (!state) throw ApiError.notFound();
            if (state.expired || state.exhausted) throw ApiError.gone();
            throw ApiError.notFound();
        }

        // This read used the final view; purge now that the payload has been
        // handed over. Idempotent, so a racing purge is harmless.
        if (paste.finalView) {
            void deleteIfExhausted(id);
        }

        return NextResponse.json(
            {
                ciphertext: paste.ciphertext,
                iv: paste.iv,
                authTag: paste.authTag,
                salt: paste.salt,
                iterations: paste.iterations,
                createdAt: paste.createdAt,
                expiresAt: paste.expiresAt,
                viewCount: paste.viewCount,
                maxViews: paste.maxViews,
                hasPassword: paste.hasPassword,
                language: paste.language,
                title: paste.title,
                finalView: paste.finalView,
            },
            { headers: apiHeaders(verdict, RATE_LIMITS.read.max) }
        );
    } catch (err) {
        return errorResponse(err, 'read paste');
    }
}

/**
 * DELETE - Revoke a paste.
 *
 * Authorisation and deletion are one statement against the stored token hash.
 * An absent paste and a wrong token are both reported identically, so the
 * endpoint cannot be used to confirm that an id exists.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        assertValidPasteId(id);

        const verdict = await consumeRateLimit(
            `revoke:${getClientIp(request)}`,
            RATE_LIMITS.revoke
        );
        if (verdict.limited) {
            throw ApiError.rateLimited(verdict.resetIn);
        }

        const token = new URL(request.url).searchParams.get('token');
        if (!token || token.length > 256) {
            throw ApiError.unauthorized();
        }

        const revoked = await revokePaste(id, hashDeletionToken(token));
        if (!revoked) {
            // Same response whether the id was wrong or the token was wrong.
            throw ApiError.unauthorized();
        }

        return NextResponse.json(
            { success: true, message: 'Paste revoked.' },
            { headers: apiHeaders(verdict, RATE_LIMITS.revoke.max) }
        );
    } catch (err) {
        return errorResponse(err, 'revoke paste');
    }
}