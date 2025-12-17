/**
 * POST /api/init - Initialize database schema
 * This should be called once during deployment
 */

import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export async function POST() {
    try {
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
