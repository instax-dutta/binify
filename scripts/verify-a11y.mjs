/**
 * G7: the audited pages carry no serious or critical accessibility
 * violations, and the custom select is operable by keyboard alone.
 *
 * The keyboard case is checked separately because the custom dropdown is the
 * component most likely to break it, and an automated axe pass would not
 * notice a control that cannot be reached with Tab.
 */

import { withServer, pass, fail } from './lib/harness.mjs';

const PAGES = ['/', '/docs', '/security', '/privacy', '/terms', '/revoke'];
const SERIOUS = new Set(['serious', 'critical']);

await withServer(async (base) => {
    const { chromium } = await import('@playwright/test');
    const { AxeBuilder } = await import('@axe-core/playwright');
    const browser = await chromium.launch({ headless: true });

    const problems = [];
    let totalViolations = 0;

    try {
        for (const p of PAGES) {
            const page = await browser.newPage();
            await page.goto(base + p, { waitUntil: 'networkidle' });

            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            const bad = results.violations.filter((v) => SERIOUS.has(v.impact));
            totalViolations += bad.length;
            for (const v of bad) {
                problems.push(`${p}: [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`);
                for (const n of v.nodes.slice(0, 2)) {
                    problems.push(`      ${n.target.join(' ')}`);
                }
            }
            await page.close();
        }

        // Keyboard operability of the custom select, which replaced a native
        // <select> and therefore has to reimplement focus and activation.
        const page = await browser.newPage();
        await page.goto(base + '/', { waitUntil: 'networkidle' });

        const trigger = page.locator('#expiration-select');
        await trigger.focus();
        const focusable = await trigger.evaluate((el) => el === document.activeElement);

        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        const opened = await page.locator('[role="option"]').count();

        let choseByKeyboard = false;
        if (opened > 0) {
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(300);
            const label = await trigger.innerText();
            choseByKeyboard = /hour|day|minute|never|views|burn/i.test(label);
            if (!choseByKeyboard) problems.push(`select label after keyboard use was "${label}"`);
        } else {
            problems.push('select did not expose options after Enter');
        }

        const escapeCloses = await (async () => {
            await trigger.click();
            await page.waitForTimeout(200);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
            return (await page.locator('[role="option"]').count()) === 0;
        })();

        if (!focusable) problems.push('select trigger cannot receive focus');
        if (!escapeCloses) problems.push('Escape does not close the dropdown');

        await page.close();
    } finally {
        await browser.close();
    }

    console.error(`  axe: ${totalViolations} serious/critical violation(s) across ${PAGES.length} pages`);
    for (const p of problems) console.error(`  ✗ ${p}`);

    if (problems.length) fail(`${problems.length} accessibility problem(s)`);
    pass('A11Y PASS');
});