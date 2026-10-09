/**
 * G6: the primary user journeys work in Chromium, Firefox and WebKit.
 *
 * Browsers run sequentially: this gate is often executed on small machines and
 * three concurrent browser processes is both slower and less reliable.
 */

import { withServer, pass, fail } from './lib/harness.mjs';

const BROWSERS = ['chromium', 'firefox', 'webkit'];

await withServer(async (base) => {
    const results = [];

    for (const name of BROWSERS) {
        let browserType;
        try {
            ({ [name]: browserType } = await import('@playwright/test'));
        } catch {
            fail('@playwright/test is not installed');
        }

        let browser;
        try {
            browser = await browserType.launch({ headless: true });
        } catch (err) {
            results.push({ name, ok: false, detail: `launch failed: ${err.message.split('\n')[0]}` });
            continue;
        }

        try {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', (e) => errors.push(e.message));

            // Journey: land, type, confirm live state, encrypt, follow the link.
            await page.goto(base + '/', { waitUntil: 'networkidle' });

            await page.fill('input[placeholder*="title" i]', 'Cross-browser');
            await page.fill('textarea', 'export const answer = 42;');
            await page.waitForTimeout(400);

            const counter = await page.evaluate(
                () => document.body.innerText.match(/(\d+) CHARS/)?.[1]
            );
            const expected = String('export const answer = 42;'.length);

            const enabled = await page.evaluate(() => {
                const b = [...document.querySelectorAll('button')].find((x) =>
                    x.textContent.includes('ENCRYPT')
                );
                return b ? !b.disabled : null;
            });

            await page.click('button[type=submit]');
            await page.waitForTimeout(3000);
            const shareLink = await page.evaluate(() =>
                [...document.querySelectorAll('a')].map((a) => a.href).find((h) => h.includes('/p/'))
            );

            let decrypted = false;
            if (shareLink) {
                const viewer = await browser.newPage();
                await viewer.goto(shareLink, { waitUntil: 'networkidle' });
                await viewer.waitForTimeout(2000);
                decrypted = await viewer.evaluate(() =>
                    document.body.innerText.includes('export const answer = 42;')
                );
                await viewer.close();
            }

            const problems = [];
            if (counter !== expected) problems.push(`char counter ${counter} != ${expected}`);
            if (enabled !== true) problems.push('submit button stayed disabled');
            if (!shareLink) problems.push('no share link produced');
            if (shareLink && !decrypted) problems.push('share link did not decrypt');
            if (errors.length) problems.push(`page errors: ${errors.join('; ')}`);

            results.push({ name, ok: problems.length === 0, detail: problems.join(' | ') });
            await page.close();
        } catch (err) {
            results.push({ name, ok: false, detail: err.message.split('\n')[0] });
        } finally {
            await browser.close();
        }
    }

    for (const r of results) {
        console.error(`  ${r.ok ? 'ok' : 'FAIL'}  ${r.name}${r.ok ? '' : ` — ${r.detail}`}`);
    }

    if (results.some((r) => !r.ok)) {
        fail('the journey did not pass in every browser');
    }
    pass('BROWSERS PASS');
});