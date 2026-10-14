import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Read an API response that may or may not carry JSON.
 *
 * Every handler that calls `fetch` has to do the same three things: parse the
 * body only when it is JSON, fail with the server's own message when it is not
 * ok, and otherwise hand back the parsed value. The revoke desk had this
 * written out twice; that is where the two copies of a bug live.
 *
 * Ported from an unmerged branch that had been open since March: the same idea,
 * rewritten against the current call sites.
 */
export async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    let data: unknown = {};

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        data = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
        const message =
            typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
                ? (data as { error: string }).error
                : fallbackMessage;
        throw new Error(message);
    }

    return data as T;
}
