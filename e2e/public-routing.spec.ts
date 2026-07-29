import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

test('public visitor can open landing page and auth actions', async ({ page }) => {
    await page.goto('/');

    await expect(
        page.getByRole('heading', {
            name: /one operational workspace for small and medium clinic teams/i,
        })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /^sign in$/i }).first()).toHaveAttribute(
        'href',
        '/login'
    );
    await expect(page.getByRole('link', { name: /^create account$/i })).toHaveAttribute(
        'href',
        '/sign-up'
    );
});

test('signed-out visitor opening protected route is redirected to current sign-in route', async ({
    page,
}) => {
    await setupClerkTestingToken({ page });
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login\?redirect_url=%2Fdashboard/);
    await expect(page.getByRole('heading', { name: /sign in to pravaah/i })).toBeVisible();
    await expect(page.getByText(/dashboard overview/i)).not.toBeVisible();
});
