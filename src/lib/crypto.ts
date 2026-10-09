import { nanoid } from 'nanoid';

/**
 * Client-side cryptography utilities for zero-knowledge encryption
 * Uses Web Crypto API with AES-256-GCM
 * All encryption/decryption happens in the browser - server never sees plaintext
 */

// Constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 600000;
const PBKDF2_ITERATIONS_LEGACY = 100000;


/**
 * Generate a random encryption key
 * @returns Base64URL encoded key
 */
export async function generateKey(): Promise<string> {
    const key = new Uint8Array(KEY_LENGTH / 8);
    crypto.getRandomValues(key);
    return arrayBufferToBase64Url(key);
}

/**
 * Derive a key from a password using PBKDF2
 * @param password User password
 * @param salt Salt for key derivation
 * @param iterations Number of PBKDF2 iterations
 * @returns Derived key
 */
async function deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
    iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const importedKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt.buffer as ArrayBuffer,
            iterations: iterations,
            hash: 'SHA-256',
        },
        importedKey,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * The cleartext that gets encrypted.
 *
 * Sealing the descriptive fields inside the ciphertext rather than alongside it
 * means AES-GCM's auth tag covers them too. Previously `title`, `language`,
 * `expiresAt` and `maxViews` travelled in cleartext next to the ciphertext and
 * were trusted on faith, so a malicious or compromised server could rewrite any
 * of them and the client had no way to notice. Inside the envelope, altering one
 * of them makes decryption fail.
 */
export interface SealedPaste {
    /** Marker so a decrypted blob can be told apart from a legacy one. */
    v: 2;
    content: string;
    title?: string;
    language?: string;
    /** Client-computed, so the user is not at the mercy of a tampered column. */
    expiresAt?: number;
    maxViews?: number;
}

/**
 * Identify a sealed envelope. Deliberately strict: a legacy paste decrypts to
 * bare text, and misreading arbitrary content as an envelope would silently
 * drop the user's paste.
 */
export function isSealedPaste(value: unknown): value is SealedPaste {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value as SealedPaste).v === 2 &&
        typeof (value as SealedPaste).content === 'string'
    );
}

/**
 * Wrap a paste's cleartext and its descriptive fields for encryption.
 */
export function sealPaste(fields: Omit<SealedPaste, 'v'>): string {
    const envelope: SealedPaste = { v: 2, ...fields };
    return JSON.stringify(envelope);
}

/**
 * Unwrap a decrypted blob, accepting either a sealed envelope or legacy
 * bare-text content.
 */
export function openSealed(plaintext: string): SealedPaste {
    // Cheap length guard so a large paste is not parsed as JSON for nothing.
    if (plaintext.length > 2 && plaintext.startsWith('{"v":2,')) {
        try {
            const parsed: unknown = JSON.parse(plaintext);
            if (isSealedPaste(parsed)) return parsed;
        } catch {
            // Fall through and treat it as legacy content.
        }
    }
    return { v: 2, content: plaintext };
}

/**
 * Encrypt content with optional password protection
 * @param content Plaintext content to encrypt
 * @param baseKey Base64URL encoded encryption key
 * @param password Optional password for additional protection
 * @returns Encrypted data structure
 */
export async function encryptContent(
    content: string,
    baseKey: string,
    password?: string
): Promise<{
    ciphertext: string;
    iv: string;
    salt?: string;
    authTag: string;
    /** Present only for legacy PBKDF2 pastes; ignored when `kdf` is set. */
    iterations?: number;
    kdf?: 'argon2id';
}> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    // Generate random IV
    const iv = new Uint8Array(IV_LENGTH);
    crypto.getRandomValues(iv);

    let cryptoKey: CryptoKey;
    let salt: string | undefined;

    if (password) {
        // Argon2id, memory-hard, run off the main thread.
        const saltBytes = new Uint8Array(SALT_LENGTH);
        crypto.getRandomValues(saltBytes);
        salt = arrayBufferToBase64Url(saltBytes);
        const { deriveArgon2idKey } = await import('./argon2');
        cryptoKey = await deriveArgon2idKey(password, salt);
    } else {
        // Use base key directly
        const keyBuffer = base64UrlToArrayBuffer(baseKey);
        cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: ALGORITHM, length: KEY_LENGTH },
            false,
            ['encrypt']
        );
    }

    // Encrypt with AES-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: ALGORITHM,
            iv,
        },
        cryptoKey,
        data
    );

    // AES-GCM produces ciphertext + auth tag (last 16 bytes)
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedArray.slice(0, -16);
    const authTag = encryptedArray.slice(-16);

    return {
        ciphertext: arrayBufferToBase64Url(ciphertext),
        iv: arrayBufferToBase64Url(iv),
        salt,
        authTag: arrayBufferToBase64Url(authTag),
        // Only meaningful when a password is set. Reporting a PBKDF2 iteration
        // count on an Argon2id paste, or on a paste with no password at all,
        // was misleading.
        kdf: password ? 'argon2id' : undefined,
    };
}

/**
 * Decrypt content
 * @param encryptedData Encrypted data structure
 * @param baseKey Base64URL encoded encryption key
 * @param password Optional password if content is password-protected
 * @returns Decrypted plaintext content
 */
export async function decryptContent(
    encryptedData: {
        ciphertext: string;
        iv: string;
        salt?: string;
        authTag: string;
        /** Legacy PBKDF2 pastes only. */
        iterations?: number;
        kdf?: 'argon2id';
    },
    baseKey: string,
    password?: string
): Promise<string> {
    const { ciphertext, iv, salt, authTag } = encryptedData;

    let cryptoKey: CryptoKey;

    if (password && salt) {
        if (encryptedData.kdf === 'argon2id') {
            const { deriveArgon2idKey } = await import('./argon2');
        cryptoKey = await deriveArgon2idKey(password, salt);
        } else {
            // Legacy paste created before the Argon2id switch.
            const saltBuffer = base64UrlToArrayBuffer(salt);
            const iterations = encryptedData.iterations || PBKDF2_ITERATIONS_LEGACY;
            cryptoKey = await deriveKeyFromPassword(
                password,
                new Uint8Array(saltBuffer),
                iterations
            );
        }
    } else {
        // Use base key directly
        const keyBuffer = base64UrlToArrayBuffer(baseKey);
        cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: ALGORITHM, length: KEY_LENGTH },
            false,
            ['decrypt']
        );
    }

    // Reconstruct full encrypted buffer (ciphertext + auth tag)
    const ciphertextBuffer = base64UrlToArrayBuffer(ciphertext);
    const authTagBuffer = base64UrlToArrayBuffer(authTag);
    const ivBuffer = base64UrlToArrayBuffer(iv);

    const encryptedBuffer = new Uint8Array(
        ciphertextBuffer.byteLength + authTagBuffer.byteLength
    );
    encryptedBuffer.set(new Uint8Array(ciphertextBuffer), 0);
    encryptedBuffer.set(new Uint8Array(authTagBuffer), ciphertextBuffer.byteLength);

    // Decrypt
    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv: new Uint8Array(ivBuffer),
            },
            cryptoKey,
            encryptedBuffer
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        throw new Error('Decryption failed. Invalid key or password.');
    }
}

/**
 * Convert ArrayBuffer to Base64URL string
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    // Convert to URL-safe base64
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert Base64URL string to ArrayBuffer
 */
function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
    // Convert from URL-safe base64
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding
    while (base64.length % 4) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generate a cryptographically secure paste ID
 * @returns URL-safe paste ID (14 characters)
 */
export function generatePasteId(): string {
    return nanoid(14);
}

/**
 * Generate a cryptographically secure deletion token
 * @returns URL-safe deletion token (32 characters)
 */
export function generateDeletionToken(): string {
    return nanoid(32);
}

/**
 * Hash a string using SHA-256 (for password verification hints, not storage)
 * @param input String to hash
 * @returns Base64URL encoded hash
 */
export async function hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToBase64Url(hashBuffer);
}
