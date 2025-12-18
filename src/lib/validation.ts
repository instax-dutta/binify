/**
 * Validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Expiration type options
 */
export const ExpirationTypeSchema = z.enum([
    'never',
    '5min',
    '1hour',
    '1day',
    '7days',
    '30days',
    'views',
    'burn',
]);

export type ExpirationType = z.infer<typeof ExpirationTypeSchema>;

/**
 * Create paste request schema
 */
export const CreatePasteSchema = z.object({
    // Encrypted payload
    ciphertext: z.string().min(1, 'Content cannot be empty'),
    iv: z.string().min(1, 'IV is required'),
    authTag: z.string().min(1, 'Auth tag is required'),
    salt: z.string().optional(),

    // Expiration settings
    expirationType: ExpirationTypeSchema,
    maxViews: z.number().int().positive().max(1000).optional(),

    // Metadata
    hasPassword: z.boolean().default(false),
    language: z.string().max(50).optional(),
    title: z.string().max(200).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
});

export type CreatePasteRequest = z.infer<typeof CreatePasteSchema>;

/**
 * Create paste response schema
 */
export const CreatePasteResponseSchema = z.object({
    pasteId: z.string(),
    expiresAt: z.number().optional(),
    maxViews: z.number().optional(),
});

export type CreatePasteResponse = z.infer<typeof CreatePasteResponseSchema>;

/**
 * Get paste response schema
 */
export const GetPasteResponseSchema = z.object({
    // Encrypted payload
    ciphertext: z.string(),
    iv: z.string(),
    authTag: z.string(),
    salt: z.string().optional(),

    // Metadata
    createdAt: z.number(),
    expiresAt: z.number().optional(),
    viewCount: z.number(),
    maxViews: z.number().optional(),
    hasPassword: z.boolean(),
    language: z.string().optional(),
    title: z.string().optional(),
    tags: z.array(z.string()).optional(),

    // Status
    willBurn: z.boolean(), // True if this is the last view before burn
});

export type GetPasteResponse = z.infer<typeof GetPasteResponseSchema>;

/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
    error: z.string(),
    code: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Calculate expiration timestamp from expiration type
 */
export function calculateExpiration(
    expirationType: ExpirationType
): number | undefined {
    const now = Date.now();

    switch (expirationType) {
        case 'never':
            return undefined;
        case '5min':
            return now + 5 * 60 * 1000;
        case '1hour':
            return now + 60 * 60 * 1000;
        case '1day':
            return now + 24 * 60 * 60 * 1000;
        case '7days':
            return now + 7 * 24 * 60 * 60 * 1000;
        case '30days':
            return now + 30 * 24 * 60 * 60 * 1000;
        case 'views':
        case 'burn':
            return undefined; // No time-based expiration
        default:
            return undefined;
    }
}

/**
 * Calculate TTL in seconds from expiration timestamp
 */
export function calculateTTL(expiresAt?: number): number | undefined {
    if (!expiresAt) return undefined;

    const now = Date.now();
    const ttlMs = expiresAt - now;

    if (ttlMs <= 0) return 0;

    return Math.floor(ttlMs / 1000);
}

/**
 * Validate paste size (1MB limit)
 */
export const MAX_PASTE_SIZE = 1024 * 1024; // 1MB

export function validatePasteSize(ciphertext: string): boolean {
    // Estimate size (base64 encoded data is ~1.33x original size)
    const estimatedSize = (ciphertext.length * 3) / 4;
    return estimatedSize <= MAX_PASTE_SIZE;
}

/**
 * Get client IP from request headers
 */
export function getClientIp(headers: Headers): string {
    return (
        headers.get('x-forwarded-for')?.split(',')[0] ||
        headers.get('x-real-ip') ||
        'unknown'
    );
}
