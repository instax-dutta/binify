/**
 * Securely extract the client IP from request headers.
 * Prioritizes the X-Real-IP header or the last entry in the X-Forwarded-For list.
 */
export function getClientIp(headers: Headers): string {
    const xRealIp = headers.get('x-real-ip');
    if (xRealIp) {
        return xRealIp;
    }

    const xForwardedFor = headers.get('x-forwarded-for');
    if (xForwardedFor) {
        const ips = xForwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
        if (ips.length > 0) {
            // The last IP in the list is the one appended by the closest trusted proxy
            return ips[ips.length - 1];
        }
    }

    return 'unknown';
}
