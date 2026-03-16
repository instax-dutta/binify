/**
 * Paste metadata type
 */
export interface PasteMetadata {
    id: string;
    createdAt: number;
    expiresAt?: number;
    maxViews?: number;
    viewCount: number;
    burned: boolean;
    hasPassword: boolean;
    deletionToken?: string;
    metadata?: {
        tags?: string[];
        language?: string;
        title?: string;
    };
}

/**
 * Check if paste has expired
 */
export function isPasteExpired(paste: PasteMetadata): boolean {
    if (paste.burned) {
        return true;
    }

    if (paste.expiresAt && Date.now() > paste.expiresAt) {
        return true;
    }

    if (paste.maxViews && paste.viewCount >= paste.maxViews) {
        return true;
    }

    return false;
}
