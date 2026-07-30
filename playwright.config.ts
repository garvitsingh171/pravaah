import { defineConfig, devices } from '@playwright/test';

const webBaseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const apiBaseURL = process.env.E2E_API_BASE_URL ?? 'http://localhost:5000/api';
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL ?? '';
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY ?? '';
const isCI = Boolean(process.env.CI);

const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : undefined,
    reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
    timeout: 60_000,
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL: webBaseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    outputDir: 'test-results',
    webServer: [
        {
            command: `DATABASE_URL=${shellQuote(e2eDatabaseUrl)} CLIENT_URL=${shellQuote(
                webBaseURL
            )} npm run dev:server`,
            url: apiBaseURL.replace(/\/api\/?$/, '/api/health'),
            reuseExistingServer: false,
            timeout: 120_000,
        },
        {
            command: `VITE_API_BASE_URL=${shellQuote(
                apiBaseURL
            )} VITE_CLERK_PUBLISHABLE_KEY=${shellQuote(clerkPublishableKey)} npm run dev:web`,
            url: webBaseURL,
            reuseExistingServer: false,
            timeout: 120_000,
        },
    ],
    projects: [
        {
            name: 'clerk setup',
            testMatch: /setup\/clerk\.setup\.ts/,
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
            dependencies: ['clerk setup'],
            testIgnore: /setup\/clerk\.setup\.ts/,
        },
    ],
});
