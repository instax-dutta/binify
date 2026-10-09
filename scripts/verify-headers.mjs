/**
 * G2: the built app returns hardened security headers, and its production
 * Content-Security-Policy omits unsafe-eval.
 */

import { withServer, assertAll, pass, fail } from './lib/harness.mjs';

await withServer(async (base) => {
    const res = await fetch(base + '/');
    const h = res.headers;
    const csp = h.get('content-security-policy') ?? '';

    // A directive set the policy is expected to carry, and the ones that must
    // not be present. Absence is asserted against the parsed directive set
    // rather than a substring, so a directive hidden in a comment would fail.
    const directives = new Map(
        csp.split(';').map((s) => s.trim()).filter(Boolean).map((s) => {
            const [k, ...v] = s.split(/\s+/);
            return [k, v];
        })
    );

    assertAll([
        {
            name: 'Content-Security-Policy present',
            ok: csp.length > 0,
            detail: 'no CSP header',
        },
        {
            name: 'no unsafe-eval in script-src (production)',
            ok: !(directives.get('script-src') ?? []).includes("'unsafe-eval'"),
            detail: `script-src: ${directives.get('script-src')?.join(' ')}`,
        },
        {
            name: "frame-ancestors 'none'",
            ok: (directives.get('frame-ancestors') ?? []).includes("'none'"),
            detail: 'missing frame-ancestors none',
        },
        {
            name: "base-uri 'none'",
            ok: (directives.get('base-uri') ?? []).includes("'none'"),
            detail: 'missing base-uri none',
        },
        {
            name: "object-src 'none'",
            ok: (directives.get('object-src') ?? []).includes("'none'"),
            detail: 'missing object-src none',
        },
        {
            // upgrade-insecure-requests makes WebKit fail every subresource on
            // an HTTP origin, so it must be absent here.
            name: 'no upgrade-insecure-requests on a plain-HTTP response',
            ok: !directives.has('upgrade-insecure-requests'),
            detail: 'directive present over http',
        },
        {
            name: 'connect-src limited to self',
            ok: JSON.stringify(directives.get('connect-src')) === JSON.stringify(["'self'"]),
            detail: `connect-src: ${directives.get('connect-src')?.join(' ')}`,
        },
        {
            name: 'no third-party origin in any directive',
            ok: ![...directives.values()].flat().some((v) => v.startsWith('http')),
            detail: 'a directive allows a remote origin',
        },
        {
            name: 'X-Frame-Options: DENY',
            ok: h.get('x-frame-options') === 'DENY',
            detail: `got ${h.get('x-frame-options')}`,
        },
        {
            name: 'X-Content-Type-Options: nosniff',
            ok: h.get('x-content-type-options') === 'nosniff',
            detail: `got ${h.get('x-content-type-options')}`,
        },
        {
            // HSTS must not be advertised on a plain-HTTP origin.
            name: 'no HSTS on a plain-HTTP response',
            ok: h.get('strict-transport-sransport-security') === null &&
                h.get('strict-transport-security') === null,
            detail: `got ${h.get('strict-transport-security')}`,
        },
        {
            name: 'Referrer-Policy set',
            ok: Boolean(h.get('referrer-policy')),
            detail: 'missing Referrer-Policy',
        },
        {
            name: 'Permissions-Policy denies camera and microphone',
            ok: /camera=\(\)/.test(h.get('permissions-policy') ?? '') &&
                /microphone=\(\)/.test(h.get('permissions-policy') ?? ''),
            detail: `got ${h.get('permissions-policy')}`,
        },
        {
            name: 'Cross-Origin-Opener-Policy set',
            ok: Boolean(h.get('cross-origin-opener-policy')),
            detail: 'missing COOP',
        },
        {
            name: 'framework not advertised',
            ok: h.get('x-powered-by') === null,
            detail: `X-Powered-By: ${h.get('x-powered-by')}`,
        },
    ]);

    // On a TLS-looking request the transport directives must appear.
    const secureRes = await fetch(base + '/', { headers: { 'x-forwarded-proto': 'https' } });
    const secureCsp = secureRes.headers.get('content-security-policy') ?? '';
    if (!/upgrade-insecure-requests/.test(secureCsp)) {
        fail('upgrade-insecure-requests missing on a TLS request');
    }
    const hsts = secureRes.headers.get('strict-transport-security') ?? '';
    if (!/max-age=\d{7,}/.test(hsts) || !hsts.includes('preload')) {
        fail(`HSTS missing or wrong on a TLS request: "${hsts}"`);
    }

    // API responses must never be cached by an intermediary.
    const api = await fetch(base + '/api/paste/AAAAAAAAAAAAAAAAAAAAAA');
    if (!/no-store/.test(api.headers.get('cache-control') ?? '')) {
        fail('API responses are not marked no-store');
    }

    pass('HEADERS PASS');
});