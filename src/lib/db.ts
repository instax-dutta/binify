/**
 * TursoDB (libSQL) client for paste metadata storage
 */

import { createClient, type Client } from '@libsql/client';

let dbClient: Client | null = null;

/**
 * Get or create TursoDB client
 */
export function getDb(): Client {
    if (!dbClient) {
        const url = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!url) {
            throw new Error('TURSO_DATABASE_URL environment variable is not set');
        }

        dbClient = createClient({
            url,
            authToken,
        });
    }

    return dbClient;
}

/**
 * Initialize database schema
 */
export async function initializeDatabase() {
    const db = getDb();

    await db.execute(`
    CREATE TABLE IF NOT EXISTS pastes (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      max_views INTEGER,
      view_count INTEGER DEFAULT 0,
      burned INTEGER DEFAULT 0,
      has_password INTEGER DEFAULT 0,
      metadata TEXT,
      deletion_token TEXT,
      updated_at INTEGER NOT NULL
    )
  `);

    // Create index for cleanup queries
    await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_expires_at ON pastes(expires_at)
  `);

    // Create index for burned pastes
    await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_burned ON pastes(burned)
  `);

    console.log('Database initialized successfully');
}

/**
 * Paste metadata type
 */
export interface PasteMetadata {
    id: string;
    createdAt: number;
    expiresAt?: number;
    maxViews?: number;
    viewCount: number;
    burned: boolean;
    hasPassword: boolean;
    deletionToken?: string;
    metadata?: {
        tags?: string[];
        language?: string;
        title?: string;
    };
}

/**
 * Create paste metadata record
 */
export async function createPasteMetadata(
    paste: Omit<PasteMetadata, 'viewCount' | 'burned'>
): Promise<void> {
    const db = getDb();
    const now = Date.now();

    await db.execute({
        sql: `
      INSERT INTO pastes (
        id, created_at, expires_at, max_views, view_count, 
        burned, has_password, metadata, deletion_token, updated_at
      ) VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?)
    `,
        args: [
            paste.id,
            paste.createdAt,
            paste.expiresAt ?? null,
            paste.maxViews ?? null,
            paste.hasPassword ? 1 : 0,
            paste.metadata ? JSON.stringify(paste.metadata) : null,
            paste.deletionToken ?? null,
            now,
        ],
    });
}

/**
 * Get paste metadata by ID
 */
export async function getPasteMetadata(id: string): Promise<PasteMetadata | null> {
    const db = getDb();

    const result = await db.execute({
        sql: 'SELECT * FROM pastes WHERE id = ?',
        args: [id],
    });

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id as string,
        createdAt: row.created_at as number,
        expiresAt: row.expires_at ? (row.expires_at as number) : undefined,
        maxViews: row.max_views ? (row.max_views as number) : undefined,
        viewCount: row.view_count as number,
        burned: Boolean(row.burned),
        hasPassword: Boolean(row.has_password),
        deletionToken: row.deletion_token as string || undefined,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    };
}

/**
 * Increment view count for a paste
 */
export async function incrementViewCount(id: string): Promise<void> {
    const db = getDb();
    const now = Date.now();

    await db.execute({
        sql: 'UPDATE pastes SET view_count = view_count + 1, updated_at = ? WHERE id = ?',
        args: [now, id],
    });
}

/**
 * Mark paste as burned
 */
export async function markPasteAsBurned(id: string): Promise<void> {
    const db = getDb();
    const now = Date.now();

    await db.execute({
        sql: 'UPDATE pastes SET burned = 1, updated_at = ? WHERE id = ?',
        args: [now, id],
    });
}

/**
 * Delete paste metadata
 */
export async function deletePasteMetadata(id: string): Promise<void> {
    const db = getDb();

    await db.execute({
        sql: 'DELETE FROM pastes WHERE id = ?',
        args: [id],
    });
}

/**
 * Check if paste has expired
 */
export function isPasteExpired(paste: PasteMetadata): boolean {
    if (paste.burned) {
        return true;
    }

    if (paste.expiresAt && Date.now() > paste.expiresAt) {
        return true;
    }

    if (paste.maxViews && paste.viewCount >= paste.maxViews) {
        return true;
    }

    return false;
}

/**
 * Cleanup expired pastes (for manual cleanup or cron)
 * Returns IDs of expired pastes
 */
export async function getExpiredPasteIds(): Promise<string[]> {
    const db = getDb();
    const now = Date.now();

    const result = await db.execute({
        sql: `
      SELECT id FROM pastes 
      WHERE (expires_at IS NOT NULL AND expires_at < ?) 
         OR burned = 1
    `,
        args: [now],
    });

    return result.rows.map((row) => row.id as string);
}
