/**
 * Logging utilities for secure and consistent log output
 */

/**
 * Sanitizes an error object to prevent sensitive data exposure.
 * Extracts only the message and name, which are generally safe to log.
 * @param error The error object to sanitize
 * @returns A sanitized error information string
 */
export function sanitizeError(error: unknown): string {
    if (error instanceof Error) {
        return `[${error.name}] ${error.message}`;
    }

    if (typeof error === 'string') {
        return error;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}
