/**
 * GET /api/paste/[id] - Retrieve encrypted paste
 * DELETE /api/paste/[id] - Securely revoke (delete) paste
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

/**
 * GET - Retrieve paste and update view state
 */
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
            throw new Error(`Database nexus unreachable`);
        }

        if (!metadata) {
            return NextResponse.json(
                { error: 'Paste session not found.' },
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
                { error: 'Transmission expired.' },
                { status: 410 }
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
                { error: 'Encrypted payload missing.' },
                { status: 404 }
            );
        }

        // Determine if this will be the last view
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
        }

        // Return encrypted payload and metadata (EXCEPT deletion token)
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
            { error: error instanceof Error ? error.message : 'Internal Systems Failure.' },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Securely revoke a paste using deletion token
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Authorization token required for revocation.' },
                { status: 401 }
            );
        }

        const metadata = await getPasteMetadata(id);

        if (!metadata) {
            return NextResponse.json(
                { error: 'Paste session not found.' },
                { status: 404 }
            );
        }

        if (metadata.deletionToken !== token) {
            return NextResponse.json(
                { error: 'Invalid authorization token. Revocation denied.' },
                { status: 403 }
            );
        }

        // Securely purge from both layers
        await deletePaste(id);
        await deletePasteMetadata(id);

        return NextResponse.json({ success: true, message: 'Paste securely revoked.' });
    } catch (error) {
        console.error('[API_ERROR] Revocation failure:', error);
        return NextResponse.json(
            { error: 'Revocation sequence failed.' },
            { status: 500 }
        );
    }
}
