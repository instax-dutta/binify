/**
 * Argon2id key derivation.
 *
 * Kept in its own module, imported only from the password branch, so it can be
 * split out of the main bundle. Argon2 is only needed once a paste actually has
 * a password, and inlining it into the shared crypto module added roughly 60 KB
 * to every page load.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/** OWASP recommended baseline: 19 MiB memory-hard, 3 passes, 1 lane. */
const ARGON2_PARAMS = {
    t: 3,
    m: 19_456, // KiB == 19 MiB
    p: 1,
    dkLen: KEY_LENGTH / 8,
} as const;

/**
 * Derive an AES-GCM CryptoKey from a password.
 *
 * Uses the audited implementation from @noble/hashes rather than a hand-rolled
 * one. Argon2 is not something to implement from scratch.
 *
 * The result is copied into a plain `ArrayBuffer`-backed array because Web
 * Crypto's `importKey` rejects views over a `SharedArrayBuffer`.
 */
export async function deriveArgon2idKey(
    password: string,
    salt: string
): Promise<CryptoKey> {
    const { argon2idAsync } = await import('@noble/hashes/argon2.js');
    const derived = await argon2idAsync(password, salt, ARGON2_PARAMS);
    const secret = new Uint8Array(derived);

    return crypto.subtle.importKey(
        'raw',
        secret,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}
