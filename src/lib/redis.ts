/**
 * Upstash Redis client for encrypted paste payload storage
 */

import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
export function getRedis(): Redis {
    if (!redisClient) {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            throw new Error('Upstash Redis environment variables are not set');
        }

        redisClient = new Redis({
            url,
            token,
        });
    }

    return redisClient;
}

/**
 * Encrypted paste payload structure
 */
export interface EncryptedPayload {
    ciphertext: string;
    iv: string;
    salt?: string;
    authTag: string;
}

/**
 * Store encrypted paste in Redis
 * @param pasteId Paste ID
 * @param payload Encrypted payload
 * @param ttlSeconds Time-to-live in seconds (optional)
 */
export async function storePaste(
    pasteId: string,
    payload: EncryptedPayload,
    ttlSeconds?: number
): Promise<void> {
    const redis = getRedis();
    const key = `paste:${pasteId}`;

    if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, payload);
    } else {
        await redis.set(key, payload);
    }
}

/**
 * Retrieve encrypted paste from Redis
 * @param pasteId Paste ID
 * @returns Encrypted payload or null if not found
 */
export async function getPaste(pasteId: string): Promise<EncryptedPayload | null> {
    const redis = getRedis();
    const key = `paste:${pasteId}`;

    try {
        return await redis.get<EncryptedPayload>(key);
    } catch (err) {
        console.error('[REDIS_GET_ERROR] Failed to parse payload:', err);
        return null; // Treat corrupted data as not found
    }
}

/**
 * Delete paste from Redis (burn-after-read)
 * @param pasteId Paste ID
 * @returns The payload if it existed, null otherwise
 */
export async function deletePaste(pasteId: string): Promise<EncryptedPayload | null> {
    const redis = getRedis();
    const key = `paste:${pasteId}`;

    try {
        // We fetch first to return the value
        const value = await redis.get<EncryptedPayload>(key);
        if (value) {
            await redis.del(key);
        }
        return value;
    } catch (err) {
        console.error('[REDIS_DEL_ERROR] Failed to fetch before delete:', err);
        return null;
    }
}

/**
 * Check if paste exists in Redis
 * @param pasteId Paste ID
 */
export async function pasteExists(pasteId: string): Promise<boolean> {
    const redis = getRedis();
    const key = `paste:${pasteId}`;
    const exists = await redis.exists(key);
    return exists === 1;
}

/**
 * Get remaining TTL for a paste
 * @param pasteId Paste ID
 * @returns TTL in seconds, -1 if no expiry, -2 if doesn't exist
 */
export async function getPasteTTL(pasteId: string): Promise<number> {
    const redis = getRedis();
    const key = `paste:${pasteId}`;
    return await redis.ttl(key);
}

/**
 * Rate limiting using Redis
 * @param identifier IP address or user identifier
 * @param maxRequests Maximum requests allowed
 * @param windowSeconds Time window in seconds
 * @returns true if rate limit exceeded
 */
export async function isRateLimited(
    identifier: string,
    maxRequests: number,
    windowSeconds: number
): Promise<boolean> {
    const redis = getRedis();
    const key = `ratelimit:${identifier}`;

    const current = await redis.incr(key);

    if (current === 1) {
        // First request in window, set expiry
        await redis.expire(key, windowSeconds);
    }

    return current > maxRequests;
}

/**
 * Get current rate limit count
 * @param identifier IP address or user identifier
 */
export async function getRateLimitCount(identifier: string): Promise<number> {
    const redis = getRedis();
    const key = `ratelimit:${identifier}`;
    const count = await redis.get<number>(key);
    return count ?? 0;
}

/**
 * Delete multiple pastes (for cleanup)
 * @param pasteIds Array of paste IDs
 */
export async function deletePastes(pasteIds: string[]): Promise<void> {
    if (pasteIds.length === 0) return;

    const redis = getRedis();
    const keys = pasteIds.map((id) => `paste:${id}`);

    await redis.del(...keys);
}
