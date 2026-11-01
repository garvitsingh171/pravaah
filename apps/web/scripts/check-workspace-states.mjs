// Failure and access-state checks against the isolated, read-only fictional preview.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright-core');
const output = process.env.PREVIEW_OUTPUT ?? '/tmp/pravaah-ui-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox'],
});
const checks = [];
const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
});
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const check = async (name, run) => {
    await run();
    checks.push(name);
    console.log(`PASS ${name}`);
};
try {
    await check('Empty appointments provide a booking recovery action', async () => {
        await page.setExtraHTTPHeaders({ 'x-preview-state': 'empty' });
        await page.goto('http://127.0.0.1:4175/appointments');
        await page.getByRole('heading', { name: /no appointments/i }).waitFor();
        if (
            !(await page
                .getByRole('button', { name: 'Book appointment', exact: true })
                .first()
                .isEnabled())
        )
            throw new Error('Missing booking action');
        await page.screenshot({ path: `${output}/appointments-empty-390.png` });
    });
    await check('Dashboard load failure offers Retry', async () => {
        await page.setExtraHTTPHeaders({ 'x-preview-state': 'error' });
        await page.goto('http://127.0.0.1:4175/dashboard');
        await page.getByText('Dashboard could not be loaded', { exact: true }).waitFor();
        await page.getByRole('button', { name: /try again|retry/i }).waitFor();
        await page.screenshot({ path: `${output}/dashboard-error-390.png` });
    });
    await check('Slow queue distinguishes pending counts from confirmed zero', async () => {
        await page.setExtraHTTPHeaders({ 'x-preview-state': 'slow' });
        await page.goto('http://127.0.0.1:4175/queue');
        await page.getByText('No confirmed queue data yet').waitFor();
        await page.getByText('Waiting for the first confirmed update').first().waitFor();
        await page.getByRole('heading', { name: 'Doctor lanes' }).waitFor();
    });
    await check('Staff cannot see administration commands or open clinic settings', async () => {
        await page.setExtraHTTPHeaders({ 'x-preview-role': 'STAFF' });
        await page.goto('http://127.0.0.1:4175/dashboard');
        await page.getByRole('button', { name: 'Open quick actions and page search' }).click();
        if (await page.getByRole('option', { name: /Clinic Settings|^Staff / }).count())
            throw new Error('Admin command exposed');
        await page.keyboard.press('Escape');
        await page.goto('http://127.0.0.1:4175/clinic-settings');
        await page.waitForURL('**/dashboard');
    });
    await check('Failed settings save preserves edits and the dirty indicator', async () => {
        await page.setExtraHTTPHeaders({});
        await page.goto('http://127.0.0.1:4175/clinic-settings');
        const name = page.getByRole('textbox', { name: /Clinic name/ });
        await name.fill('Edited Demo Clinic');
        if (!(await page.getByRole('button', { name: 'Reload', exact: true }).isDisabled()))
            throw new Error('Reload can discard edits');
        await page.getByRole('button', { name: 'Save settings', exact: true }).click();
        await page.getByText('Clinic settings were not saved', { exact: true }).waitFor();
        if ((await name.inputValue()) !== 'Edited Demo Clinic')
            throw new Error('Input lost on failure');
        await page.getByText('You have unsaved changes').waitFor();
        await page.getByRole('button', { name: 'Reset changes' }).click();
    });
    await check('Keyboard shortcut opens the palette and leaves typing alone', async () => {
        await page.goto('http://127.0.0.1:4175/patients');
        await page.locator('main h1').waitFor();
        await page.keyboard.press('Control+k');
        await page.getByRole('dialog', { name: 'Find a page or action' }).waitFor();
        await page.keyboard.press('Escape');
        const search = page.getByRole('searchbox').first();
        await search.focus();
        await page.keyboard.press('Control+k');
        if (await page.getByRole('dialog').count())
            throw new Error('Shortcut interferes with input');
    });
    await check(
        'Native drag sends the doctor order; rejection retains entries and reports failure',
        async () => {
            await page.setViewportSize({ width: 1440, height: 1000 });
            await page.goto('http://127.0.0.1:4175/queue');
            await page.getByRole('heading', { name: 'Doctor lanes' }).waitFor();
            const request = page.waitForRequest(
                (request) =>
                    request.url().endsWith('/queue/reorder') && request.method() === 'PATCH'
            );
            // Start the native drag before scrolling the nested workspace to the target.
            // dragTo() can scroll the source away before crossing Chrome's drag threshold.
            const source = page.locator('#queue-entry-queue-0 [draggable]');
            await source.scrollIntoViewIfNeeded();
            const start = await source.boundingBox();
            if (!start) throw new Error('Drag handle is not visible');
            await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
            await page.mouse.down();
            await page.mouse.move(start.x + start.width / 2 + 15, start.y + start.height / 2 + 15, {
                steps: 5,
            });
            const target = page.locator('#queue-entry-queue-4');
            await target.scrollIntoViewIfNeeded();
            const end = await target.boundingBox();
            if (!end) throw new Error('Drop target is not visible');
            await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 20 });
            await page.mouse.up();
            const payload = (await request).postDataJSON();
            if (
                JSON.stringify(payload.expectedQueueEntryIds) !==
                JSON.stringify(['queue-0', 'queue-2', 'queue-4'])
            )
                throw new Error('Wrong expected doctor order');
            if (
                JSON.stringify(payload.queueEntryIds) !==
                JSON.stringify(['queue-2', 'queue-4', 'queue-0'])
            )
                throw new Error('Wrong requested doctor order');
            await page.getByText('Queue order was not updated', { exact: true }).waitFor();
            if ((await page.getByTestId('active-queue-card').count()) !== 5)
                throw new Error('Queue entry disappeared');
        }
    );
} finally {
    await writeFile(`${output}/states.json`, JSON.stringify({ checks, errors }, null, 2));
    await browser.close();
}
if (errors.length) throw new Error(errors.join('\n'));
