/**
 * POST /api/init - Initialize database schema
 * This should be called once during deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { logger, sanitizeError } from '@/lib/logging';
import { safeCompare } from '@/lib/security';

export async function POST(request: NextRequest) {
    try {
        // Basic security check: if INIT_SECRET is set, require it
        const initSecret = process.env.INIT_SECRET;
        const authHeader = request.headers.get('authorization');

        if (initSecret && (!authHeader || !safeCompare(authHeader, `Bearer ${initSecret}`))) {
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
