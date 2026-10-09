import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Build the Content Security Policy.
 *
 * Note on nonces: a per-request nonce cannot be used here. Most of this site is
 * statically prerendered at build time, so the HTML exists before any request
 * arrives and there is no nonce to stamp onto Next.js's inline
 * `self.__next_f.push` bootstrap. A nonce-based policy paired with
 * 'strict-dynamic' would therefore block every script on those pages while
 * still looking correct. Forcing dynamic rendering to enable nonces would
 * trade the main performance property of the site for a marginal CSP gain, so
 * static rendering wins and `unsafe-inline` in script-src is accepted instead.
 *
 * That concession is bounded by the rest of the policy: an injected script
 * cannot load remote code (no external origins, no `unsafe-eval` in production),
 * cannot exfiltrate anywhere (connect-src is 'self'), and cannot be framed,
 * plugin-loaded, or used as a form target.
 */
function buildCsp(isSecureRequest: boolean): string {
    const scriptSrc = isProd
        ? `'self' 'unsafe-inline'`
        : // The React Fast Refresh runtime evaluates source at runtime.
          `'self' 'unsafe-inline' 'unsafe-eval'`;

    return [
        `default-src 'self'`,
        `script-src ${scriptSrc}`,
        // React sets inline styles, so this one cannot be nonce-protected.
        `style-src 'self' 'unsafe-inline'`,
        `font-src 'self'`,
        `img-src 'self' data: blob:`,
        // The browser only ever talks to this origin's own API routes.
        `connect-src 'self'`,
        `frame-src 'none'`,
        `object-src 'none'`,
        `worker-src 'self' blob:`,
        `manifest-src 'self'`,
        `form-action 'self'`,
        `base-uri 'none'`,
        `frame-ancestors 'none'`,
        // Only meaningful on an already-secure origin, where it stops
        // mixed content. Emitting it on a plain-HTTP origin makes WebKit upgrade
        // every subresource to https, which fails the handshake against an HTTP
        // server and leaves Safari with an unstyled, unhydrated page. Chromium
        // tolerates the same failure, so this is invisible without a WebKit test.
        ...(isSecureRequest ? [`upgrade-insecure-requests`] : []),
    ].join('; ');
}

/** Whether this request already arrived over TLS, directly or via a proxy. */
function isSecureRequest(request: NextRequest): boolean {
    const forwarded = request.headers.get('x-forwarded-proto');
    if (forwarded) return forwarded.split(',')[0].trim() === 'https';
    return request.nextUrl.protocol === 'https:';
}

export function proxy(request: NextRequest) {
    const secure = isSecureRequest(request);
    const csp = buildCsp(secure);
    const response = NextResponse.next();

    response.headers.set('Content-Security-Policy', csp);

    // --- Transport and framing ---
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    if (isProd && secure) {
        // preload opts the domain into the browser's HSTS list.
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload'
        );
    }

    // --- Feature policy ---
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
    );

    // --- Cross-origin isolation ---
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

    // --- Strip anything identifying that a response may carry ---
    response.headers.delete('X-Powered-By');
    response.headers.delete('Server');

    // Paste material must not be cached by any intermediary.
    if (request.nextUrl.pathname.startsWith('/api/')) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }

    // A crawl of the paste surface is neither useful to an index nor desirable.
    if (request.nextUrl.pathname.startsWith('/p/')) {
        response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Everything except static assets and the manifest.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|manifest\\.json).*)',
    ],
};