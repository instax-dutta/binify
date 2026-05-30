/**
 * POST /api/init - Initialize database schema
 * This should be called once during deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { logger, sanitizeError } from '@/lib/logging';

export async function POST(request: NextRequest) {
    try {
        // Basic security check: INIT_SECRET must be set and match the auth header
        const initSecret = process.env.INIT_SECRET;
        const authHeader = request.headers.get('authorization');

        if (!initSecret || authHeader !== `Bearer ${initSecret}`) {
            if (!initSecret) {
                logger.error('INIT_SECRET environment variable is not set');
            }
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await initializeDatabase();

        return NextResponse.json(
            { message: 'Database initialized successfully' },
            { status: 200 }
        );
    } catch (error) {
        logger.error('Error initializing database:', sanitizeError(error));

        return NextResponse.json(
            { error: 'Failed to initialize database' },
            { status: 500 }
        );
    }
}
