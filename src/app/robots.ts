import type { MetadataRoute } from 'next';

/**
 * Crawler policy.
 *
 * Paste content is already unreadable to a crawler: the decryption key lives in
 * the URL fragment, which is never sent to the server, so a fetched response
 * body is ciphertext. This policy makes that explicit so crawlers do not
 * accumulate the URLs (which would leak that a given paste existed, and when)
 * in their own indexes, and so they stay off the API.
 *
 * Disallowing is a request, not a control. The real protections are the
 * `noindex` metadata on /p/*, per-route rate limiting, and the fact that the
 * server cannot decrypt what it serves.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/docs', '/security', '/privacy', '/terms'],
                // User content, API surface, and the management console.
                disallow: ['/p/', '/api/', '/revoke'],
            },
            {
                // Scrapers that ignore Disallow should not be invited to spend
                // crawl budget here either.
                userAgent: ['GPTBot', 'CCBot', 'anthropic-ai', 'ClaudeBot', 'Bytespider'],
                disallow: '/',
            },
        ],
        sitemap: 'https://bin.sdad.pro/sitemap.xml',
        host: 'https://bin.sdad.pro',
    };
}