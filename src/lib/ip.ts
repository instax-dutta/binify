/**
 * Client IP resolution for rate limiting.
 *
 * The only trustworthy source is the address the platform itself observed.
 * `X-Forwarded-For` is attacker-controlled unless a proxy that overwrites it is
 * known to sit in front of the app, so trusting it by default lets a caller
 * pick their own rate-limit bucket by rotating the header — which makes the
 * limiter useless.
 *
 * Set TRUST_PROXY=true only when a reverse proxy you control strips inbound
 * X-Forwarded-For and writes its own. On Vercel `request.ip` is supplied by the
 * platform, so the header path is never taken and the variable is unnecessary.
 */

/** Bucket used when the client address cannot be established. */
const UNVERIFIED = 'unverified';

function trustsProxyHeaders(): boolean {
    return process.env.TRUST_PROXY === 'true';
}

export function getClientIp(req: { ip?: string; headers: Headers }): string {
    // 1. The address the platform verified.
    if (req.ip) {
        return req.ip;
    }

    // 2. Header-based identification only behind a proxy we control.
    if (trustsProxyHeaders()) {
        const xForwardedFor = req.headers.get('x-forwarded-for');
        if (xForwardedFor) {
            // The closest trusted proxy appends last, so the final entry is the
            // one it observed.
            const ips = xForwardedFor
                .split(',')
                .map((ip) => ip.trim())
                .filter(Boolean);
            if (ips.length > 0) {
                return ips[ips.length - 1];
            }
        }
    }

    // 3. Fail closed. Sharing one bucket is strictly better than letting every
    //    caller choose a fresh one, which would defeat rate limiting entirely.
    return UNVERIFIED;
}

export { UNVERIFIED as UNVERIFIED_IP };
