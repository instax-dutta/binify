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
        const metadata = await getPasteMetadata(id);

        if (!metadata) {
            return NextResponse.json(
                { error: 'Paste not found' },
                { status: 404 }
            );
        }

        // Check if paste has expired
        if (isPasteExpired(metadata)) {
            // Clean up
            await deletePaste(id);
            await deletePasteMetadata(id);

            return NextResponse.json(
                { error: 'Paste has expired or been deleted' },
                { status: 410 } // 410 Gone
            );
        }

        // Get encrypted payload from Redis
        const payload = await getPaste(id);

        if (!payload) {
            return NextResponse.json(
                { error: 'Paste content not found' },
                { status: 404 }
            );
        }

        // Determine if this will be the last view (burn-after-read)
        const willBurn =
            metadata.maxViews !== undefined &&
            metadata.viewCount + 1 >= metadata.maxViews;

        // If burn-after-read, delete immediately
        if (willBurn) {
            await deletePaste(id);
            await markPasteAsBurned(id);
        } else {
            // Increment view count
            await incrementViewCount(id);
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
            tags: metadata.metadata?.tags,
            willBurn,
        });
    } catch (error) {
        console.error('Error retrieving paste:', error);

        return NextResponse.json(
            { error: 'Failed to retrieve paste' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Delete from both Redis and database
        await deletePaste(id);
        await deletePasteMetadata(id);

        return NextResponse.json(
            { message: 'Paste deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting paste:', error);

        return NextResponse.json(
            { error: 'Failed to delete paste' },
            { status: 500 }
        );
    }
}
