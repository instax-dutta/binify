/**
 * G3: the production Content-Security-Policy does not block the application's
 * own scripts in a real browser.
 *
 * This is the gate that would have caught the nonce/`strict-dynamic` mistake,
 * where a syntactically valid policy silently blocked all JavaScript.
 */

import { withServer, withBrowser, pass, fail } from './lib/harness.mjs';

await withServer(async (base) => {
    await withBrowser(async (browser) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        /** @type {{violation: string}[]} */
        const cspViolations = [];
        page.on('console', (msg) => {
            const t = msg.text();
            if (/Content Security Policy/i.test(t)) {
                cspViolations.push({ violation: t });
            }
        });

        const failed = [];
        page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText ?? ''}`));

        const navRes = await page.goto(base + '/', { waitUntil: 'networkidle' });
        const cspHeader = navRes?.headers()?.get('content-security-policy') ?? '';

        // A policy that blocks scripts still renders server HTML. Prove the
        // application actually hydrated by driving a real interaction.
        const PROBE = 'const hydrated = true;';
        await page.fill('textarea', PROBE);
        await page.waitForTimeout(400);
        const counter = await page.evaluate(
            () => document.body.innerText.match(/(\d+) CHARS/)?.[1]
        );

        const checks = [
            {
                name: 'the response carries a Content-Security-Policy',
                ok: Boolean(cspHeader),
                detail: 'no CSP header on the document response',
            },
            {
                name: 'no CSP console violations',
                ok: cspViolations.length === 0,
                detail: cspViolations.map((v) => v.violation).join(' | ').slice(0, 400),
            },
            {
                name: 'no failed network requests',
                ok: failed.length === 0,
                detail: failed.join(' | ').slice(0, 400),
            },
            {
                name: 'React hydrated (typing updates the char counter)',
                ok: counter === String(PROBE.length),
                detail: `counter read "${counter}", expected ${PROBE.length}`,
            },
        ];

        for (const c of checks) {
            if (!c.ok) console.error(`  ✗ ${c.name}: ${c.detail}`);
        }

        await context.close();

        if (checks.some((c) => !c.ok)) {
            fail('the CSP blocks the application');
        }
        pass('CSP-NOT-BLOCKING PASS');
    }, { name: 'chromium' });
});