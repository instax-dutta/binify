/**
 * GET /api/paste/[id] - Retrieve encrypted paste
 * DELETE /api/paste/[id] - Delete paste (revoke)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    getPasteMetadata,
    incrementViewCount,
    markPasteAsBurned,
    deletePasteMetadata,
    isPasteExpired,
} from '@/lib/db';
import { getPaste, deletePaste } from '@/lib/redis';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get metadata from database
        let metadata;
        try {
            metadata = await getPasteMetadata(id);
        } catch (dbError) {
            console.error('[DB_ERROR] Failed to fetch metadata:', dbError);
            throw new Error(`Database nexus unreachable: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }

        if (!metadata) {
            return NextResponse.json(
                { error: 'Paste session not found. It may have been purged or never existed.' },
                { status: 404 }
            );
        }

        // Check if paste has expired
        if (isPasteExpired(metadata)) {
            // Clean up
            try {
                await deletePaste(id);
                await deletePasteMetadata(id);
            } catch (cleanupError) {
                console.error('[CLEANUP_ERROR] Failed to purge expired paste:', cleanupError);
            }

            return NextResponse.json(
                { error: 'Transmission expired. The content has been securely purged.' },
                { status: 410 } // 410 Gone
            );
        }

        // Get encrypted payload from Redis
        let payload;
        try {
            payload = await getPaste(id);
        } catch (redisError) {
            console.error('[REDIS_ERROR] Failed to fetch payload:', redisError);
            throw new Error('Storage nexus out of sync.');
        }

        if (!payload || !payload.ciphertext) {
            return NextResponse.json(
                { error: 'Encrypted payload missing or corrupted.' },
                { status: 404 }
            );
        }

        // Determine if this will be the last view (burn-after-read)
        const willBurn =
            metadata.maxViews !== undefined &&
            metadata.viewCount + 1 >= metadata.maxViews;

        // Secure state updates
        try {
            if (willBurn) {
                await deletePaste(id);
                await markPasteAsBurned(id);
            } else {
                await incrementViewCount(id);
            }
        } catch (updateError) {
            console.error('[SYNC_ERROR] Failed to update paste state:', updateError);
            // We continue anyway so the user can at least view the paste once
        }

        // Return encrypted payload and metadata
        return NextResponse.json({
            ciphertext: payload.ciphertext,
            iv: payload.iv,
            authTag: payload.authTag,
            salt: payload.salt,
            createdAt: metadata.createdAt,
            expiresAt: metadata.expiresAt,
            viewCount: metadata.viewCount + 1,
            maxViews: metadata.maxViews,
            hasPassword: metadata.hasPassword,
            language: metadata.metadata?.language,
            title: metadata.metadata?.title,
            willBurn,
        });
    } catch (error) {
        console.error('[API_ERROR] Retrieval failure:', error);

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Systems Failure during retrieval.' },
            { status: 500 }
        );
    }
}

// DELETE /api/paste/[id] is removed for security reasons. 
// Revocation is currently managed by the burn-after-read logic.
