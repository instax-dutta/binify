/**
 * Server-side secret handling.
 *
 * Deletion tokens are 32-character nanoids (~192 bits of entropy), so they are
 * never brute-forceable. What matters is that a database dump must not hand an
 * attacker the ability to delete or rotate anyone's paste, so tokens are stored
 * as a peppered HMAC rather than in the clear.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_BYTES = 32;

/**
 * Hash a deletion token for storage.
 *
 * The pepper lives only in the environment, so a stolen database backup is not
 * enough to forge a matching hash.
 */
export function hashDeletionToken(token: string): string {
    const pepper = process.env.TOKEN_PEPPER;
    if (!pepper) {
        throw new Error('TOKEN_PEPPER environment variable is not set');
    }
    return createHmac('sha256', pepper).update(token).digest('hex');
}

/**
 * Constant-time string comparison.
 *
 * Used where a value is compared outside the database. Comparisons that can run
 * as a SQL predicate (see `sqlSafeEquals`) are better: they never expose a
 * per-character timing signal to the caller at all.
 */
export function safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
        // Compare something of equal length so the failure path costs the same
        // as the success path.
        timingSafeEqual(bufA, bufA);
        return false;
    }

    return timingSafeEqual(bufA, bufB);
}

/**
 * Decoy used to keep the comparison cost identical when no row matched.
 *
 * Without this, a request for a non-existent paste would return sooner than
 * one for an existing paste, which turns the token check into an oracle for
 * "does this id exist". Comparing against this fixed value costs the same as a
 * real comparison and always fails.
 */
const DECOY_HASH =
    '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Constant-time check that `candidate` matches the hash stored for a row.
 *
 * @param stored The stored hash, or undefined when no row was found.
 * @param candidate The hash to test.
 */
export function verifyHash(
    stored: string | undefined,
    candidate: string
): boolean {
    // Compare against the decoy on a miss so both paths do identical work.
    return safeCompare(stored ?? DECOY_HASH, candidate);
}

/**
 * Generate a deletion token from the server CSPRNG.
 */
export function generateToken(): string {
    const buf = new Uint8Array(TOKEN_BYTES);
    crypto.getRandomValues(buf);
    return Buffer.from(buf).toString('base64url');
}