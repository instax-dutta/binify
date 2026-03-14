/**
 * Utility to securely retrieve client IP from request headers
 */

/**
 * Get client IP from request headers
 * Handles proxy headers securely by prioritizing x-real-ip and
 * taking the last entry in x-forwarded-for to prevent spoofing.
 */
export function getClientIp(headers: Headers): string {
    // 1. Check x-real-ip (often set by Vercel, Nginx, etc.)
    const xRealIp = headers.get('x-real-ip');
    if (xRealIp) return xRealIp;

    // 2. Check x-forwarded-for
    const xForwardedFor = headers.get('x-forwarded-for');
    if (xForwardedFor) {
        // We take the LAST IP in the list.
        // If the client spoofs XFF, their spoofed IP will be at the beginning.
        // The real client IP (seen by the proxy) will be appended to the list.
        const ips = xForwardedFor.split(',').map(ip => ip.trim()).filter(Boolean);
        if (ips.length > 0) {
            return ips[ips.length - 1];
        }
    }

    return 'unknown';
}
