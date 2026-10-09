/**
 * Paste size validation.
 *
 * The limit is configurable because it is really a budget decision, not a
 * technical one. The binding constraint is the database's monthly egress
 * allowance, not this app's memory: every paste *read* pulls its payload back
 * out of the database, so the limit multiplies into reads.
 *
 * On a plan with 5 GB/month of transfer, a 4 MB cap yields roughly 1,250
 * full-size reads before the database is throttled. At 1 MB it is ~5,000.
 */

/** Default: 4 MB, unchanged from before. */
const DEFAULT_MAX_PASTE_SIZE = 4 * 1024 * 1024;

/** Guard against a typo turning into an unbounded or zero limit. */
const CEILING = 4 * 1024 * 1024;
const FLOOR = 1024;

function resolveMaxPasteSize(): number {
    const raw = process.env.MAX_PASTE_SIZE;
    if (!raw) return DEFAULT_MAX_PASTE_SIZE;

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_MAX_PASTE_SIZE;

    return Math.min(CEILING, Math.max(FLOOR, parsed));
}

export const MAX_PASTE_SIZE = resolveMaxPasteSize();

/**
 * Decode a base64url length to its byte count without allocating the buffer.
 *
 * Base64 encodes 3 bytes as 4 characters; the padding-free alphabet used here
 * makes the exact arithmetic cheap and avoids decoding a multi-megabyte string
 * just to measure it.
 */
export function decodedByteLength(base64: string): number {
    const len = base64.length;
    if (len === 0) return 0;
    // Every 4 characters carry 3 bytes, with the remainder carrying fewer.
    const fullGroups = Math.floor(len / 4);
    const remainder = len % 4;
    return fullGroups * 3 + (remainder === 2 ? 1 : remainder === 3 ? 2 : 0);
}

export function validatePasteSize(ciphertext: string): boolean {
    return decodedByteLength(ciphertext) <= MAX_PASTE_SIZE;
}
