/**
 * G10: every static asset referenced by metadata and the manifest exists and
 * is within budget.
 *
 * A missing icon is a 404 that no other gate would notice, and an oversized
 * asset is a performance regression that only a measured budget catches.
 */

import { statSync } from 'node:fs';
import { read, assertAll, pass, kb } from './lib/harness.mjs';

const budget = JSON.parse(read('package.json')).performanceBudget;

/** Every absolute public/ reference the app can emit. */
function references() {
    const layout = read('src/app/layout.tsx');
    const manifest = JSON.parse(read('public/manifest.json'));
    const robots = read('src/app/robots.ts');
    const sitemap = read('src/app/sitemap.ts');

    const out = new Set();

    // Only real file paths. robots.txt and sitemap.ts also contain route
    // patterns such as /p/ and /api/, which are directories, not assets.
    const isFile = (p) => {
        const last = p.split('/').filter(Boolean).pop() ?? '';
        return last.includes('.') || ['manifest.json', 'robots.txt', 'sitemap.xml'].includes(last);
    };
    const add = (p) => {
        if (typeof p === 'string' && p.startsWith('/') && isFile(p)) out.add(p);
    };

    for (const m of layout.matchAll(/url: '(\/[^']+)'/g)) add(m[1]);
    for (const entry of manifest.icons ?? []) add(entry.src);
    add(manifest.start_url);
    for (const m of robots.matchAll(/Sitemap: '([^']+)'/g)) add(m[1]);
    for (const m of sitemap.matchAll(/Sitemap: '([^']+)'/g)) add(m[1]);

    return [...out];
}

const refs = references();
const checks = [];

for (const ref of refs) {
    const rel = `public${ref}`;
    let size = null;
    try {
        size = statSync(`${new URL('..', import.meta.url).pathname.replace(/\/$/, '')}/${rel}`).size;
    } catch {
        size = null;
    }
    checks.push({
        name: `${ref} exists`,
        ok: size !== null,
        detail: 'file referenced by metadata or manifest does not exist',
    });
    if (size !== null && budget.maxAssetBytes) {
        checks.push({
            name: `${ref} within per-asset budget`,
            ok: size <= budget.maxAssetBytes,
            detail: `${kb(size)} exceeds ${kb(budget.maxAssetBytes)}`,
        });
    }
}

// The previous defect: a single 600 KB file served as a 32x32 favicon.
const icon32 = refs.find((r) => /32x32|icon-32/.test(r));
if (icon32) {
    const size = statSync(`${new URL('..', import.meta.url).pathname.replace(/\/$/, '')}/public${icon32}`).size;
    checks.push({
        name: 'the 32x32 favicon is small',
        ok: size <= 8 * 1024,
        detail: `favicon is ${kb(size)}; a 32px glyph should be under 8 KB`,
    });
}

// Total of everything in public/ that ships to a browser.
const { readdirSync } = await import('node:fs');
const pubRoot = `${new URL('..', import.meta.url).pathname.replace(/\/$/, '')}/public`;
let total = 0;
for (const f of readdirSync(pubRoot)) {
    if (/\.(png|jpe?g|svg|ico|webp)$/i.test(f)) total += statSync(`${pubRoot}/${f}`).size;
}
checks.push({
    name: 'total public asset weight within budget',
    ok: total <= budget.publicAssetsBytes,
    detail: `${kb(total)} exceeds ${kb(budget.publicAssetsBytes)}`,
});
console.error(`  referenced assets: ${refs.length}, total shipped: ${kb(total)}`);

assertAll(checks);
pass('ASSETS PASS');