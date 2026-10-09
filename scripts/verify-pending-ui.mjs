/**
 * G11: paste pages announce a useful loading and error state rather than an
 * empty frame.
 *
 * The viewer decrypts in the browser, so there is a real window where the
 * frame is empty. Without an announced state a screen reader user is told
 * nothing is happening.
 */

import { withServer, pass, fail } from './lib/harness.mjs';

const PASTE_ID = 'AAAAAAAAAAAAAAAAAAAAAA';

await withServer(async (base) => {
    const problems = [];

    // Loading and error affordances exist at the route level.
    for (const rel of ['src/app/loading.tsx', 'src/app/error.tsx', 'src/app/global-error.tsx']) {
        let ok = false;
        try {
            const src = (await import('node:fs')).readFileSync(
                `${new URL('..', import.meta.url).pathname.replace(/\/$/, '')}/${rel}`,
                'utf8'
            );
            ok = /aria-live|role=/.test(src);
        } catch {
            ok = false;
        }
        if (!ok) problems.push(`${rel} is missing or has no live region`);
    }

    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ headless: true });
    try {
        // A paste that cannot exist still renders an explained failure, and
        // that failure is announced rather than silently blank.
        const page = await browser.newPage();
        // A viewer without the key fragment is refused before any fetch, which is
        // correct behaviour. Include a fragment so the request is actually made.
        await page.goto(`${base}/p/${PASTE_ID}#testkey`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2500);

        const text = await page.evaluate(() => document.body.innerText);
        if (!/not exist|no longer available|does not/i.test(text)) {
            problems.push(`missing-paste view showed no explanation: ${JSON.stringify(text.slice(0, 160))}`);
        }

        const heading = await page.evaluate(() => {
            const h = document.querySelector('h1, h2, [role="alert"]');
            return h ? h.textContent?.trim() : null;
        });
        if (!heading) problems.push('the failure state exposes no heading or alert');

        // The loading state must be perceivable while the paste is fetched.
        const nav = await browser.newPage();
        await nav.goto(`${base}/p/${PASTE_ID}#testkey`, { waitUntil: 'commit' });
        await nav.waitForSelector('[aria-live], [role="status"], [role="alert"]', { timeout: 4000 })
            .catch(() => problems.push('no live region appears during the loading window'));
        await nav.close();

        await page.close();
    } finally {
        await browser.close();
    }

    for (const p of problems) console.error(`  ✗ ${p}`);
    if (problems.length) fail(`${problems.length} pending-state problem(s)`);
    pass('PENDING-UI PASS');
});