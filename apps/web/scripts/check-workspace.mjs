// Run against preview-workspace.mjs. Supply an installed playwright-core module via PLAYWRIGHT_MODULE.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright-core');
const output = process.env.PREVIEW_OUTPUT ?? '/tmp/pravaah-ui-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox'],
});
const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
});
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const results = [];
const routes = [
    'dashboard',
    'appointments',
    'queue',
    'doctors',
    'patients',
    'staff',
    'clinic-settings',
    'profile',
    'doctors/new',
    'patients/new',
];
const widths = [320, 375, 390, 768, 1024, 1280, 1440, 1920];
try {
    for (const route of routes) {
        await page.goto(`http://127.0.0.1:4175/${route}`);
        await page.waitForSelector('main h1');
        await page.waitForTimeout(350);
        for (const width of widths) {
            await page.setViewportSize({ width, height: 1000 });
            const layout = await page.evaluate(() => {
                const main = document.querySelector('main');
                return {
                    bodyOverflow: document.documentElement.scrollWidth > innerWidth,
                    mainOverflow: main.scrollWidth > main.clientWidth + 1,
                    headingCount: document.querySelectorAll('main h1').length,
                };
            });
            let violations = [];
            if ([390, 1440].includes(width)) {
                await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
                violations = await page.evaluate(async () =>
                    (
                        await window.axe.run(document, {
                            runOnly: {
                                type: 'tag',
                                values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
                            },
                        })
                    ).violations.map((v) => ({
                        id: v.id,
                        impact: v.impact,
                        nodes: v.nodes.map((n) => ({
                            target: n.target,
                            summary: n.failureSummary,
                        })),
                    }))
                );
                await page.screenshot({
                    path: resolve(output, `${route.replace('/', '-')}-${width}.png`),
                });
            }
            results.push({ route, width, ...layout, violations });
        }
        await writeFile(
            resolve(output, 'results.json'),
            JSON.stringify({ results, errors }, null, 2)
        );
        console.log(`${route}: reviewed at ${widths.length} widths`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://127.0.0.1:4175/dashboard');
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    if (!(await page.getByRole('button', { name: 'Expand sidebar' }).isVisible()))
        throw new Error('Compact navigation unavailable');
    await page.reload();
    await page.getByRole('button', { name: 'Expand sidebar' }).waitFor();
    await page.getByRole('button', { name: 'Expand sidebar' }).click();
    await page.getByRole('button', { name: 'Open quick actions and page search' }).click();
    await page.getByRole('combobox', { name: 'Search pages and actions' }).fill('queue');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/queue');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open clinic navigation' }).click();
    await page.getByRole('dialog', { name: 'Clinic workspace navigation menu' }).waitFor();
    await page.keyboard.press('Escape');
    if (
        !(await page
            .getByRole('button', { name: 'Open clinic navigation' })
            .evaluate((el) => el === document.activeElement))
    )
        throw new Error('Drawer did not restore focus');
    await page.goto('http://127.0.0.1:4175/appointments');
    await page.getByRole('button', { name: 'Book appointment', exact: true }).click();
    await page.getByRole('dialog', { name: 'Book appointment', exact: true }).waitFor();
    await page.screenshot({ path: resolve(output, 'booking-390.png') });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const dialogViolations = await page.evaluate(async () =>
        (
            await window.axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
            })
        ).violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        }))
    );
    results.push({ route: 'booking-dialog', width: 390, violations: dialogViolations });
    await page.keyboard.press('Escape');
    await page
        .getByRole('button', { name: /View risk details for/ })
        .first()
        .click();
    await page.getByRole('dialog').waitFor();
    await page.screenshot({ path: resolve(output, 'risk-390.png') });
    const riskViolations = await page.evaluate(async () =>
        (
            await window.axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
            })
        ).violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        }))
    );
    results.push({ route: 'risk-dialog', width: 390, violations: riskViolations });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open quick actions and page search' }).click();
    await page.screenshot({ path: resolve(output, 'commands-390.png') });
    const commandViolations = await page.evaluate(async () =>
        (
            await window.axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
            })
        ).violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        }))
    );
    results.push({ route: 'command-dialog', width: 390, violations: commandViolations });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://127.0.0.1:4175/dashboard');
    await page.getByRole('link', { name: /Completed visits:.*View appointments/ }).waitFor();
    await page.locator('main').evaluate((el) => (el.scrollTop = 650));
    await page.waitForTimeout(100);
    await page.getByRole('link', { name: 'Your account', exact: true }).click();
    await page.waitForURL('**/profile');
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('main')?.scrollTop >= 640);
    console.log(
        'Interactions: compact preference, command navigation, mobile Escape/focus, booking and risk dialogs, history scroll restoration'
    );
} finally {
    await writeFile(resolve(output, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    await browser.close();
}
const failures = results.filter((r) => r.bodyOverflow || r.mainOverflow || r.violations.length);
console.log(
    JSON.stringify(
        {
            checks: results.length,
            failures: failures.map((r) => ({
                route: r.route,
                width: r.width,
                bodyOverflow: r.bodyOverflow,
                mainOverflow: r.mainOverflow,
                violations: r.violations.map((v) => v.id),
            })),
            errors,
        },
        null,
        2
    )
);
if (failures.length || errors.length) process.exitCode = 1;
