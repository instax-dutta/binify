/**
 * G9: the homepage payload stays within its declared budget.
 *
 * The budget is read from package.json so it is a stated contract rather than a
 * number copied from a previous run.
 *
 * Sizes are the exact bytes on the wire. Node's fetch transparently decompresses
 * responses and omits content-length when the body is chunked, so an earlier
 * version of this gate measured every chunk as 0 bytes and passed unconditionally.
 * A raw socket request is used instead, and a self-check asserts the
 * instrumentation actually observed data.
 */

import http from 'node:http';
import { read, withServer, pass, fail, kb } from './lib/harness.mjs';

const budget = JSON.parse(read('package.json')).performanceBudget;
if (!budget?.homepageJsGzipBytes) {
    fail('package.json does not declare performanceBudget.homepageJsGzipBytes');
}

/**
 * Count the bytes a server actually writes for one path, without any
 * transparent decompression.
 */
function measure(base, path) {
    const { hostname, port } = new URL(base);
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                host: hostname,
                port,
                path,
                method: 'GET',
                headers: {
                    // Ask for compression the way a browser would.
                    'accept-encoding': 'gzip, deflate, br',
                    'user-agent': 'gzip',
                },
            },
            (res) => {
                let bytes = 0;
                res.on('data', (c) => { bytes += c.length; });
                res.on('end', () =>
                    resolve({ bytes, encoding: res.headers['content-encoding'] ?? 'identity' })
                );
                res.on('error', reject);
            }
        );
        req.on('error', reject);
        req.end();
    });
}

await withServer(async (base) => {
    const html = await (await fetch(base + '/')).text();
    const urls = new Set(
        [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g)].map((m) => m[1])
    );

    if (urls.size === 0) {
        fail('no chunks discovered in the homepage — the measurement would be vacuous');
    }

    let js = 0;
    let css = 0;
    let htmlBytes = 0;
    const detail = [];

    const home = await measure(base, '/');
    htmlBytes = home.bytes;

    for (const u of urls) {
        const { bytes, encoding } = await measure(base, u);
        if (u.endsWith('.css')) css += bytes;
        else js += bytes;
        detail.push(`  ${u.split('/').pop().padEnd(28)} ${kb(bytes).padStart(9)}  ${encoding}`);
    }

    const total = js + css + htmlBytes;

    console.error(`  chunks: ${urls.size}   home: ${kb(htmlBytes)}`);
    for (const d of detail) console.error(d);
    console.error(`  html          ${kb(htmlBytes)}`);
    console.error(`  js  (wire)    ${kb(js)}`);
    console.error(`  css (wire)    ${kb(css)}`);
    console.error(`  total         ${kb(total)}`);

    // Instrumentation self-check. If a future change breaks the measurement,
    // the gate must fail loudly rather than report a suspiciously round zero.
    if (js <= 0 || css <= 0 || htmlBytes <= 0) {
        fail(
            'the measurement returned no data, so the budget was not actually enforced',
            `js=${js} css=${css} html=${htmlBytes}`
        );
    }

    // Sanity bound: a real Next.js build is far above this. A total below it
    // means the crawler found almost nothing and the gate is not measuring the
    // homepage.
    if (total < 10 * 1024) {
        fail(`measured total ${kb(total)} is implausibly small for a real build`);
    }

    if (js > budget.homepageJsGzipBytes) {
        fail(`homepage JavaScript is ${kb(js)}, over the ${kb(budget.homepageJsGzipBytes)} budget`, detail.join('\n'));
    }
    if (total > budget.homepageTotalBytes) {
        fail(`homepage total is ${kb(total)}, over the ${kb(budget.homepageTotalBytes)} budget`, detail.join('\n'));
    }

    pass('BUDGET PASS');
});