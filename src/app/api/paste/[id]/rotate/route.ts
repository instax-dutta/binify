/**
 * POST /api/paste/[id]/rotate - Change a paste's public id (link rotation).
 *
 * Because the payload and metadata share a row, rotation is a single UPDATE:
 * there is no second key to move and no window where the paste exists twice or
 * nowhere.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePasteId } from '@/lib/crypto';
import { hashDeletionToken } from '@/lib/security';
import { rotatePasteId } from '@/lib/pastes';
import { consumeRateLimit } from '@/lib/rate-limit';
import { RATE_LIMITS } from '@/lib/limits';
import { getClientIp } from '@/lib/ip';
import { z } from 'zod';
import { ApiError, apiHeaders, assertValidPasteId } from '@/lib/http';
import { errorResponse } from '@/lib/api';

const RotateSchema = z.object({
    token: z.string().min(1).max(256),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: oldId } = await params;
        assertValidPasteId(oldId);

        const verdict = await consumeRateLimit(
            `rotate:${getClientIp(request)}`,
            RATE_LIMITS.rotate
        );
        if (verdict.limited) {
            throw ApiError.rateLimited(verdict.resetIn);
        }

        const parsed = RotateSchema.safeParse(await request.json());
        if (!parsed.success) {
            throw ApiError.unauthorized();
        }

        const newId = generatePasteId();

        // One statement: authorise on the token hash and move the id together.
        const rotated = await rotatePasteId(
            oldId,
            newId,
            hashDeletionToken(parsed.data.token)
        );

        if (!rotated) {
            throw ApiError.unauthorized();
        }

        return NextResponse.json(
            { success: true, newId, message: 'Paste id rotated.' },
            { headers: apiHeaders(verdict, RATE_LIMITS.rotate.max) }
        );
    } catch (err) {
        return errorResponse(err, 'rotate paste');
    }
}