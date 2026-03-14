/**
 * Paste size validation logic.
 */

/**
 * Validate paste size (4MB limit)
 */
export const MAX_PASTE_SIZE = 4 * 1024 * 1024; // 4MB

export function validatePasteSize(ciphertext: string): boolean {
    // Estimate size (base64 encoded data is ~1.33x original size)
    const estimatedSize = (ciphertext.length * 3) / 4;
    return estimatedSize <= MAX_PASTE_SIZE;
}
