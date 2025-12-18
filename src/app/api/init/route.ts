/**
 * POST /api/init - Initialize database schema
 * This should be called once during deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        // Basic security check: if INIT_SECRET is set, require it
        const initSecret = process.env.INIT_SECRET;
        const authHeader = request.headers.get('authorization');

        if (initSecret && authHeader !== `Bearer ${initSecret}`) {
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
        console.error('Error initializing database:', error);

        return NextResponse.json(
            { error: 'Failed to initialize database' },
            { status: 500 }
        );
    }
}
