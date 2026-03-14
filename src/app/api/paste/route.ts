/**
 * POST /api/paste - Create encrypted paste
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePasteId, generateDeletionToken } from '@/lib/crypto';
import { createPasteMetadata } from '@/lib/db';
import { storePaste } from '@/lib/redis';
import { isRateLimited } from '@/lib/redis';
import { sanitizeError } from '@/lib/logging';
import {
    CreatePasteSchema,
    calculateExpiration,
    calculateTTL,
    validatePasteSize,
    getClientIp,
} from '@/lib/validation';

// Rate limiting: 10 pastes per hour per IP
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const clientIp = getClientIp(request);
        const rateLimited = await isRateLimited(
            clientIp,
            RATE_LIMIT_MAX,
            RATE_LIMIT_WINDOW
        );

        if (rateLimited) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                { status: 429 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = CreatePasteSchema.parse(body);

        // Validate paste size
        if (!validatePasteSize(validatedData.ciphertext)) {
            return NextResponse.json(
                { error: 'Paste size exceeds 4MB limit' },
                { status: 413 }
            );
        }

        // Generate paste ID and deletion token
        const pasteId = generatePasteId();
        const deletionToken = generateDeletionToken();

        // Calculate expiration
        const expiresAt = calculateExpiration(validatedData.expirationType);
        const ttl = calculateTTL(expiresAt);

        // Determine max views
        let maxViews: number | undefined;
        if (validatedData.expirationType === 'burn') {
            maxViews = 1;
        } else if (validatedData.expirationType === 'views') {
            maxViews = validatedData.maxViews;
        }

        // Store payload and metadata in parallel for improved performance
        await Promise.all([
            // Store encrypted payload in Redis
            (async () => {
                try {
                    await storePaste(
                        pasteId,
                        {
                            ciphertext: validatedData.ciphertext,
                            iv: validatedData.iv,
                            authTag: validatedData.authTag,
                            salt: validatedData.salt,
                            iterations: validatedData.iterations,
                        },
                        ttl
                    );
                } catch (redisError) {
                    console.error('[REDIS_ERROR] Failed to store payload:', sanitizeError(redisError));
                    throw new Error('Storage nexus unavailable. Check infrastructure status.');
                }
            })(),

            // Store metadata in TursoDB
            (async () => {
                try {
                    await createPasteMetadata({
                        id: pasteId,
                        createdAt: Date.now(),
                        expiresAt,
                        maxViews,
                        hasPassword: validatedData.hasPassword,
                        deletionToken,
                        metadata: {
                            language: validatedData.language,
                            title: validatedData.title,
                        },
                    });
                } catch (dbError) {
                    console.error('[DB_ERROR] Full failure detail:', sanitizeError(dbError));
                    const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown Database Error';
                    // Attempt to clean up Redis if DB fails
                    try {
                        await storePaste(pasteId, { ciphertext: '', iv: '', authTag: '' }, 1);
                    } catch (e) {
                        // Silent catch for cleanup failure
                    }
                    throw new Error(`Database synchronization failed: ${errorMessage}`);
                }
            })(),
        ]);

        // Return paste ID and metadata
        return NextResponse.json(
            {
                pasteId,
                deletionToken,
                expiresAt,
                maxViews,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[API_ERROR] Critical failure in /api/paste:', sanitizeError(error));

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid request payload structure.', details: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Critical Internal Systems Failure.' },
            { status: 500 }
        );
    }
}
