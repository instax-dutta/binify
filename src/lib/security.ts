import { timingSafeEqual } from 'node:crypto';

/**
 * Perform a timing-safe string comparison to prevent timing attacks.
 * This is particularly important for comparing sensitive tokens like
 * deletion tokens or API secrets.
 *
 * @param a The first string to compare
 * @param b The second string to compare
 * @returns True if the strings are equal, false otherwise
 */
export function safeCompare(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);

    if (aBuffer.length !== bBuffer.length) {
        // Still perform a comparison to mitigate timing differences,
        // even though the lengths don't match.
        timingSafeEqual(aBuffer, aBuffer);
        return false;
    }

    return timingSafeEqual(aBuffer, bBuffer);
}
