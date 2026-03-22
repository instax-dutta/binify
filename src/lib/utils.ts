import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Common utility to handle fetch responses, parse JSON, and throw consistent errors.
 */
export async function handleResponse<T>(response: Response, defaultErrorMessage: string): Promise<T> {
    let data: any = {};
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        try {
            data = await response.json();
        } catch (e) {
            // If JSON parsing fails despite the content-type, we'll stick with the default error
        }
    }

    if (!response.ok) {
        throw new Error(data.error || defaultErrorMessage);
    }

    return data as T;
}
