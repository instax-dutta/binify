/**
 * G9: the homepage payload stays within its declared budget.
 *
 * The budget is read from package.json so it is a stated contract rather than a
 * number copied from a previous run.
 */

import { read, withServer, pass, fail, kb } from './lib/harness.mjs';

const budget = JSON.parse(read('package.json')).performanceBudget;
if (!budget?.homepageJsGzipBytes) {
    fail('package.json does not declare performanceBudget.homepageJsGzipBytes');
}

await withServer(async (base) => {
    const html = await (await fetch(base + '/')).text();
    const urls = new Set(
        [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g)].map((m) => m[1])
    );

    let js = 0;
    let css = 0;
    const detail = [];

    for (const u of urls) {
        const res = await fetch(base + u, { headers: { 'accept-encoding': 'br, gzip' } });
        const size = Number(res.headers.get('content-length') ?? 0);
        if (u.endsWith('.css')) css += size;
        else js += size;
        detail.push(`${u.split('/').pop()} ${size}`);
    }

    const htmlSize = Buffer.byteLength(html);
    const total = js + css + htmlSize;

    console.error(`  chunks: ${urls.size}`);
    console.error(`  html          ${kb(htmlSize)}`);
    console.error(`  js  (gzip)    ${kb(js)}`);
    console.error(`  css (gzip)    ${kb(css)}`);
    console.error(`  total         ${kb(total)}  (budget ${kb(budget.homepageJsGzipBytes)} on js)`);

    if (js > budget.homepageJsGzipBytes) {
        fail(
            `homepage JavaScript is ${kb(js)}, over the ${kb(budget.homepageJsGzipBytes)} budget`,
            detail.join('\n')
        );
    }
    if (total > budget.homepageTotalBytes) {
        fail(
            `homepage total is ${kb(total)}, over the ${kb(budget.homepageTotalBytes)} budget`,
            detail.join('\n')
        );
    }

    pass('BUDGET PASS');
});