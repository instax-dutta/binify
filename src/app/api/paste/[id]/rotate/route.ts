/**
 * POST /api/paste/[id]/rotate - Change paste ID (Link Rotation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPasteMetadata, getDb } from '@/lib/db';
import { getPaste, storePaste, getPasteTTL, deletePaste } from '@/lib/redis';
import { generatePasteId } from '@/lib/crypto';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: oldId } = await params;
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { error: 'Authorization token required for rotation.' },
                { status: 401 }
            );
        }

        const metadata = await getPasteMetadata(oldId);

        if (!metadata) {
            return NextResponse.json(
                { error: 'Paste session not found.' },
                { status: 404 }
            );
        }

        if (metadata.deletionToken !== token) {
            return NextResponse.json(
                { error: 'Invalid authorization token. Rotation denied.' },
                { status: 403 }
            );
        }

        // 1. Generate new ID
        const newId = generatePasteId();

        // 2. Translocate payload in Redis
        const payload = await getPaste(oldId);
        if (!payload) {
            return NextResponse.json(
                { error: 'Encrypted payload missing or already purged.' },
                { status: 404 }
            );
        }

        const ttl = await getPasteTTL(oldId);

        // TTL from Redis: -1 (no expiry), -2 (doesn't exist)
        // storePaste expects seconds
        await storePaste(newId, payload, ttl > 0 ? ttl : undefined);

        // 3. Update ID in Database
        const db = getDb();
        try {
            await db.execute({
                sql: 'UPDATE pastes SET id = ?, updated_at = ? WHERE id = ?',
                args: [newId, Date.now(), oldId],
            });
        } catch (dbError) {
            console.error('[DB_ERROR] Failed to rotate ID:', dbError);
            // Cleanup new redis entry if DB fails
            await deletePaste(newId);
            throw new Error('Database synchronization failed during rotation.');
        }

        // 4. Cleanup old Redis key
        await deletePaste(oldId);

        return NextResponse.json({
            success: true,
            newId,
            message: 'Paste ID rotated successfully.',
        });
    } catch (error) {
        console.error('[API_ERROR] Rotation failure:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Rotation sequence failed.' },
            { status: 500 }
        );
    }
}
