/**
 * Securely extract the client IP from a request object.
 * Prioritizes the verified 'ip' property from the platform (e.g., Vercel),
 * then falls back to the X-Forwarded-For header if necessary.
 */
export function getClientIp(req: { ip?: string; headers: Headers }): string {
    // 1. Prioritize the verified IP provided by the platform (e.g., NextRequest.ip)
    if (req.ip) {
        return req.ip;
    }

    // 2. Fallback to X-Forwarded-For.
    // The last IP in the list is the one appended by the closest trusted proxy.
    const xForwardedFor = req.headers.get('x-forwarded-for');
    if (xForwardedFor) {
        const ips = xForwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
        if (ips.length > 0) {
            return ips[ips.length - 1];
        }
    }

    return 'unknown';
}
