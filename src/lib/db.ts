/**
 * PostgreSQL connection layer.
 *
 * Single datastore: encrypted payloads and their metadata live in one table so
 * a paste is created, read, burned, rotated and revoked atomically. There is no
 * second store to keep in sync, so no dual-write can half-apply.
 */

import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { logger, sanitizeError } from './logging';

let pool: Pool | null = null;

/**
 * Lazily create the pool.
 *
 * On serverless the connection must point at a pooled endpoint (Neon's
 * `-pooled` hostname, Supabase's transaction/session pooler, or a pgbouncer in
 * front). Direct connections will exhaust Postgres' backend slots under
 * concurrency.
 */
export function getPool(): Pool {
    if (pool) return pool;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
        connectionString,
        // Serverless instances are short-lived and may scale to zero; keep the
        // ceiling tight so a traffic spike cannot open unbounded backends.
        max: Number(process.env.DATABASE_POOL_MAX ?? 5),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    });

    // A pool-level error (e.g. an idle backend dropped by the server) must not
    // become an unhandled 'error' event and crash the instance.
    pool.on('error', (err) => {
        logger.error('[PG_POOL_ERROR]', sanitizeError(err));
    });

    return pool;
}

/**
 * Run a parameterised query. Never interpolate caller input into SQL.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = []
): Promise<T[]> {
    const result = await getPool().query<T>(text, params);
    return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = []
): Promise<T | null> {
    const rows = await query<T>(text, params);
    return rows[0] ?? null;
}

/**
 * Run `fn` inside a transaction, rolling back on any throw.
 */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {
            /* the connection is already unusable; releasing it is enough */
        });
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Schema DDL. Idempotent, so it is safe to run on every deploy and from the
 * migration script. This is the only definition of the schema in the repo.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS pastes (
  id            TEXT PRIMARY KEY,
  ciphertext    TEXT        NOT NULL,
  iv            TEXT        NOT NULL,
  auth_tag      TEXT        NOT NULL,
  salt          TEXT,
  iterations    INTEGER,
  token_hash    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  max_views     INTEGER,
  view_count    INTEGER     NOT NULL DEFAULT 0,
  burned        BOOLEAN     NOT NULL DEFAULT FALSE,
  has_password  BOOLEAN     NOT NULL DEFAULT FALSE,
  title         TEXT,
  language      TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pastes_expires_at
  ON pastes (expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pastes_created_at ON pastes (created_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT PRIMARY KEY,
  window_start  TIMESTAMPTZ NOT NULL,
  count         INTEGER     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);
`;

/**
 * Create tables and indexes if they do not exist. Safe to run repeatedly.
 */
export async function initializeDatabase(): Promise<void> {
    await getPool().query(SCHEMA_SQL);
    logger.info('Database schema verified');
}

/**
 * Row-level advisory lock to keep concurrent init calls from racing each other.
 */
export async function withInitLock<T>(fn: () => Promise<T>): Promise<T> {
    const client = await getPool().connect();
    try {
        await client.query('SELECT pg_advisory_lock($1)', [0x62696e69]);
        return await fn();
    } finally {
        await client.query('SELECT pg_advisory_unlock($1)', [0x62696e69]).catch(() => {});
        client.release();
    }
}