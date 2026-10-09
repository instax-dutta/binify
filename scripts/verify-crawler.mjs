/**
 * G4: paste pages are excluded from indexing and the crawler policy covers the
 * whole surface.
 */

import { withServer, assertAll, pass } from './lib/harness.mjs';

const PASTE_ID = 'AAAAAAAAAAAAAAAAAAAAAA';

await withServer(async (base) => {
    const paste = await fetch(`${base}/p/${PASTE_ID}`);
    const pasteHtml = await paste.text();
    const metaRobots = pasteHtml.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? '';

    const robots = await fetch(base + '/robots.txt');
    const robotsTxt = await robots.text();

    const sitemap = await fetch(base + '/sitemap.xml');
    const sitemapBody = await sitemapBody(sitemap);

    const marketingPages = ['/', '/docs', '/security', '/privacy', '/terms'];

    // Each marketing page must carry its own title and description; identical
    // metadata across indexable pages was a real defect.
    const metaByPage = new Map();
    for (const p of marketingPages) {
        const html = await (await fetch(base + p)).text();
        metaByPage.set(p, {
            title: html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '',
            description: html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '',
        });
    }
    const titles = [...metaByPage.values()].map((m) => m.title);
    const descriptions = [...metaByPage.values()].map((m) => m.description);

    assertAll([
        {
            name: '/p/* sends a noindex X-Robots-Tag',
            ok: /noindex/i.test(paste.headers.get('x-robots-tag') ?? ''),
            detail: `got "${paste.headers.get('x-robots-tag')}"`,
        },
        {
            name: '/p/* sends noindex meta robots',
            ok: /noindex/i.test(metaRobots) && /nofollow/i.test(metaRobots),
            detail: `meta robots content was "${metaRobots}"`,
        },
        {
            name: 'robots.txt disallows /p/',
            ok: /Disallow:\s*\/p\//i.test(robotsTxt),
            detail: 'no Disallow for /p/',
        },
        {
            name: 'robots.txt disallows /api/',
            ok: /Disallow:\s*\/api\//i.test(robotsTxt),
            detail: 'no Disallow for /api/',
        },
        {
            name: 'robots.txt disallows /revoke',
            ok: /Disallow:\s*\/revoke/i.test(robotsTxt),
            detail: 'no Disallow for /revoke',
        },
        {
            name: 'robots.txt names AI scraper agents',
            ok: /GPTBot|ClaudeBot|anthropic-ai|Bytespider/i.test(robotsTxt),
            detail: 'no AI scraper agent block',
        },
        {
            name: 'robots.txt references a sitemap',
            ok: /Sitemap:/i.test(robotsTxt),
            detail: 'no Sitemap directive',
        },
        {
            name: 'sitemap.xml is served',
            ok: sitemap.ok && sitemapBody.includes('<urlset'),
            detail: `status ${sitemap.status}`,
        },
        {
            name: 'sitemap omits paste URLs',
            ok: !sitemapBody.includes('/p/'),
            detail: 'sitemap lists /p/ URLs',
        },
        {
            name: 'every marketing page has a distinct title',
            ok: new Set(titles).size === titles.length,
            detail: `titles: ${JSON.stringify(titles)}`,
        },
        {
            name: 'every marketing page has a distinct description',
            ok: new Set(descriptions).size === descriptions.length,
            detail: `descriptions repeat: ${descriptions.length} pages, ${new Set(descriptions).size} distinct`,
        },
    ]);

    pass('CRAWLER PASS');
});

async function sitemapBody(res) {
    return res.text();
}