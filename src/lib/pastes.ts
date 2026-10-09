/**
 * Paste storage. One row holds both the ciphertext and its metadata, so every
 * lifecycle transition (create, read-and-count, burn, rotate, revoke, expire)
 * is a single atomic statement.
 */

import { query, queryOne, getPool, transaction } from './db';
import { verifyHash } from './security';

export interface PasteRecord {
    id: string;
    ciphertext: string;
    iv: string;
    authTag: string;
    salt?: string;
    iterations?: number;
    createdAt: number;
    expiresAt?: number;
    maxViews?: number;
    viewCount: number;
    burned: boolean;
    hasPassword: boolean;
    title?: string;
    language?: string;
    /** True when this read consumed the paste's last permitted view. */
    finalView: boolean;
}

interface PasteRow {
    id: string;
    ciphertext: string;
    iv: string;
    auth_tag: string;
    salt: string | null;
    iterations: number | null;
    created_at: Date;
    expires_at: Date | null;
    max_views: number | null;
    view_count: number;
    burned: boolean;
    has_password: boolean;
    title: string | null;
    language: string | null;
    final_view: boolean | null;
}

const toMillis = (d: Date | null): number | undefined =>
    d ? new Date(d).getTime() : undefined;

function mapRow(row: PasteRow, finalView: boolean): PasteRecord {
    return {
        id: row.id,
        ciphertext: row.ciphertext,
        iv: row.iv,
        authTag: row.auth_tag,
        salt: row.salt ?? undefined,
        iterations: row.iterations ?? undefined,
        createdAt: new Date(row.created_at).getTime(),
        expiresAt: toMillis(row.expires_at),
        maxViews: row.max_views ?? undefined,
        viewCount: row.view_count,
        burned: row.burned,
        hasPassword: row.has_password,
        title: row.title ?? undefined,
        language: row.language ?? undefined,
        finalView,
    };
}

export interface CreatePasteInput {
    id: string;
    ciphertext: string;
    iv: string;
    authTag: string;
    salt?: string;
    iterations?: number;
    /** Already hashed by hashDeletionToken. */
    tokenHash: string;
    expiresAt?: number;
    maxViews?: number;
    hasPassword: boolean;
    title?: string;
    language?: string;
}

export async function createPaste(paste: CreatePasteInput): Promise<void> {
    await query(
        `INSERT INTO pastes (
             id, ciphertext, iv, auth_tag, salt, iterations, token_hash,
             expires_at, max_views, has_password, title, language
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
            paste.id,
            paste.ciphertext,
            paste.iv,
            paste.authTag,
            paste.salt ?? null,
            paste.iterations ?? null,
            paste.tokenHash,
            paste.expiresAt ? new Date(paste.expiresAt) : null,
            paste.maxViews ?? null,
            paste.hasPassword,
            paste.title ?? null,
            paste.language ?? null,
        ]
    );
}

/**
 * Read a paste and consume one view in a single statement.
 *
 * The `view_count < max_views` guard is what makes burn-after-read and
 * view-limited reads safe under concurrency: Postgres decides the winner while
 * holding the row lock, so simultaneous requests cannot both be served the
 * last view. Returns null when the paste is absent, expired, burned, or has no
 * views left.
 */
export async function consumePaste(id: string): Promise<PasteRecord | null> {
    const row = await queryOne<PasteRow>(
        `UPDATE pastes
            SET view_count = view_count + 1,
                updated_at = now()
          WHERE id = $1
            AND NOT burned
            AND (expires_at IS NULL OR expires_at > now())
            AND (max_views IS NULL OR view_count < max_views)
        RETURNING id, ciphertext, iv, auth_tag, salt, iterations, created_at, expires_at,
                  max_views, view_count, burned, has_password, title, language,
                  (max_views IS NOT NULL AND view_count >= max_views) AS final_view`,
        [id]
    );

    if (!row) return null;
    return mapRow(row, Boolean(row.final_view));
}

/**
 * Read metadata only, without consuming a view. Used to distinguish a missing
 * paste from an expired or exhausted one.
 */
export async function getPasteState(
    id: string
): Promise<{ expired: boolean; exhausted: boolean } | null> {
    const row = await queryOne<{
        expires_at: Date | null;
        max_views: number | null;
        view_count: number;
        burned: boolean;
    }>(
        `SELECT expires_at, max_views, view_count, burned
           FROM pastes
          WHERE id = $1`,
        [id]
    );

    if (!row) return null;

    return {
        expired: Boolean(row.expires_at && new Date(row.expires_at).getTime() <= Date.now()),
        exhausted: Boolean(row.burned || (row.max_views !== null && row.view_count >= row.max_views)),
    };
}

/**
 * Delete a paste whose view budget is now spent. Idempotent: a duplicate call
 * affects zero rows and does not error.
 */
export async function deleteIfExhausted(id: string): Promise<void> {
    await query(
        `DELETE FROM pastes
          WHERE id = $1
            AND (burned = TRUE OR (max_views IS NOT NULL AND view_count >= max_views))`,
        [id]
    );
}

/**
 * Revoke a paste, authorising on the stored token hash.
 *
 * The hash comparison runs in the application via `verifyHash`, which uses
 * `timingSafeEqual` and performs a decoy comparison when no row matched. That
 * matters twice over: a SQL `=` on the digest is not constant-time, and an
 * early return on "no such id" would otherwise reveal that the paste exists.
 *
 * Postgres has no callable constant-time text comparison — `ct_equal` exists
 * only as an internal symbol and is not in `pg_proc` — so the comparison has to
 * happen here. The read and the delete are wrapped in one transaction so the
 * row cannot change in between.
 */
export async function revokePaste(id: string, tokenHash: string): Promise<boolean> {
    return transaction(async (client) => {
        const { rows } = await client.query<{ token_hash: string | null }>(
            'SELECT token_hash FROM pastes WHERE id = $1',
            [id]
        );

        if (!verifyHash(rows[0]?.token_hash ?? undefined, tokenHash)) {
            return false;
        }

        await client.query('DELETE FROM pastes WHERE id = $1', [id]);
        return true;
    });
}

/**
 * Rotate a paste's public ID. The payload does not move, because it lives in
 * the same row as the metadata being updated.
 *
 * Authorisation is the same constant-time check as `revokePaste`.
 */
export async function rotatePasteId(
    oldId: string,
    newId: string,
    tokenHash: string
): Promise<boolean> {
    return transaction(async (client) => {
        const { rows } = await client.query<{ token_hash: string | null }>(
            'SELECT token_hash FROM pastes WHERE id = $1',
            [oldId]
        );

        if (!verifyHash(rows[0]?.token_hash ?? undefined, tokenHash)) {
            return false;
        }

        const { rowCount } = await client.query(
            'UPDATE pastes SET id = $2, updated_at = now() WHERE id = $1',
            [oldId, newId]
        );
        return (rowCount ?? 0) > 0;
    });
}

export async function pasteExists(id: string): Promise<boolean> {
    const row = await queryOne<{ one: number }>(
        `SELECT 1 AS one FROM pastes WHERE id = $1`,
        [id]
    );
    return row !== null;
}

/**
 * Remove pastes whose retention window has passed. Replaces the expiry that
 * Redis previously handled automatically.
 */
export async function purgeExpired(limit = 500): Promise<number> {
    const rows = await query<{ id: string }>(
        `DELETE FROM pastes
          WHERE id IN (
              SELECT id FROM pastes
               WHERE expires_at IS NOT NULL AND expires_at <= now()
               LIMIT $1
          )
        RETURNING id`,
        [limit]
    );
    return rows.length;
}

/**
 * Opportunistic cleanup so data does not outlive its expiry even if no cron
 * job has fired. Cheap: bounded, index-backed, and a no-op most of the time.
 */
export async function opportunisticPurge(): Promise<void> {
    try {
        await getPool().query(
            `DELETE FROM pastes
              WHERE id IN (
                  SELECT id FROM pastes
                   WHERE expires_at IS NOT NULL AND expires_at <= now()
                   LIMIT 25
              )`
        );
    } catch {
        // Cleanup must never fail a user request.
    }
}