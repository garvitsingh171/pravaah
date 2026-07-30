import { expect, test } from '@playwright/test';
import { createE2EIdentity, signUpWithClerk } from './helpers/clerk';
import {
    completeClinicOnboardingWithoutSampleData,
    createE2EClinic,
    fillClinicOnboardingForm,
} from './helpers/onboarding';

test('sign-up onboarding journey can continue without sample data', async ({ page }) => {
    await signUpWithClerk(page, createE2EIdentity());
    await page.goto('/onboarding/clinic');

    await completeClinicOnboardingWithoutSampleData(page);

    await expect(page.getByText(/first-run setup/i)).toBeVisible();
    await expect(page.getByText(/0 of 4 steps completed|1 of 4 steps completed/i)).toBeVisible();
});

test('sample-data journey provisions fictional records in the new clinic', async ({ page }) => {
    await signUpWithClerk(page, createE2EIdentity());
    await page.goto('/onboarding/clinic');
    const clinic = createE2EClinic();

    await fillClinicOnboardingForm(page, clinic);
    await page.getByRole('button', { name: /create clinic workspace/i }).click();
    await expect(page.getByRole('heading', { name: /add fictional sample data/i })).toBeVisible();
    await page.getByRole('button', { name: /add fictional sample data/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard overview/i })).toBeVisible();
    await page.getByRole('link', { name: /doctors/i }).click();
    await expect(page.getByText(/doctor/i).first()).toBeVisible();
    await page.getByRole('link', { name: /patients/i }).click();
    await expect(page.getByText(/patient/i).first()).toBeVisible();
});

test('sample-data workflow supports doctor edit, patient edit, and manual queue reorder', async ({
    page,
}) => {
    await signUpWithClerk(page, createE2EIdentity());
    await page.goto('/onboarding/clinic');
    const clinic = createE2EClinic();

    await fillClinicOnboardingForm(page, clinic);
    await page.getByRole('button', { name: /create clinic workspace/i }).click();
    await expect(page.getByRole('heading', { name: /add fictional sample data/i })).toBeVisible();
    await page.getByRole('button', { name: /add fictional sample data/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: /doctors/i }).click();
    await expect(page.getByRole('heading', { name: /^doctors$/i })).toBeVisible();
    await page.getByRole('button', { name: /edit dr\. asha raman/i }).click();
    await page.getByLabel(/specialization/i).fill('Family Care');
    await page.getByRole('button', { name: /save doctor/i }).click();
    await expect(page.getByText('Family Care')).toBeVisible();

    await page.getByRole('link', { name: /patients/i }).click();
    await expect(page.getByRole('heading', { name: /^patients$/i })).toBeVisible();
    await page.getByRole('button', { name: /edit riya malhotra/i }).click();
    await page.getByLabel(/^city$/i).fill('Mysuru');
    await page.getByRole('button', { name: /save patient/i }).click();
    await expect(page.getByText('Mysuru')).toBeVisible();

    await page.getByRole('link', { name: /queue/i }).click();
    await expect(page.getByRole('heading', { name: /live queue/i })).toBeVisible();
    await expect(page.getByText('Riya Malhotra')).toBeVisible();
    await page.getByRole('button', { name: /move riya malhotra down/i }).click();
    await expect(page.getByText('Moved Riya Malhotra.')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toContainText('Kabir Sen');
});

test('browser validation prevents empty onboarding form submission', async ({ page }) => {
    await signUpWithClerk(page, createE2EIdentity());
    await page.goto('/onboarding/clinic');

    await expect(
        page.getByRole('heading', { name: /create your clinic workspace/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /create clinic workspace/i }).click();

    await expect(page.getByText('Clinic name is required.')).toBeVisible();
    await expect(page.getByText('Clinic slug is required.')).toBeVisible();
    await expect(
        page.getByRole('heading', { name: /add fictional sample data/i })
    ).not.toBeVisible();
});

test('provisioning failure feedback preserves input and retry reaches dashboard', async ({
    page,
}) => {
    await signUpWithClerk(page, createE2EIdentity());
    await page.goto('/onboarding/clinic?redirect_url=%2Fdashboard');
    const clinic = createE2EClinic();
    let failedOnce = false;

    await page.route('**/api/auth/onboarding/clinic', async (route) => {
        if (!failedOnce) {
            failedOnce = true;
            await route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'E2E_PROVISIONING_FAILURE',
                        message: 'Temporary provisioning failure',
                    },
                }),
            });
            return;
        }

        await route.continue();
    });

    await fillClinicOnboardingForm(page, clinic);
    await page.getByRole('button', { name: /create clinic workspace/i }).click();

    await expect(page.getByText('Temporary provisioning failure')).toBeVisible();
    await expect(page.getByLabel(/clinic name/i)).toHaveValue(clinic.name);

    await page.getByRole('button', { name: /create clinic workspace/i }).click();
    await expect(page.getByRole('heading', { name: /add fictional sample data/i })).toBeVisible();
    await page.getByRole('button', { name: /continue with an empty clinic/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
});

test('refresh preserves onboarding and completed application states', async ({ page }) => {
    await signUpWithClerk(page, createE2EIdentity());
    await page.goto('/onboarding/clinic');
    await page.reload();

    await expect(
        page.getByRole('heading', { name: /create your clinic workspace/i })
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);

    await completeClinicOnboardingWithoutSampleData(page);
    await page.reload();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard overview/i })).toBeVisible();
});

test('completed user opening onboarding is routed into the application', async ({ page }) => {
    await signUpWithClerk(page, createE2EIdentity());
    await page.goto('/onboarding/clinic');
    await completeClinicOnboardingWithoutSampleData(page);

    await page.goto('/onboarding/clinic?redirect_url=%2Fappointments');

    await expect(page).toHaveURL(/\/appointments/);
    await expect(page.getByRole('heading', { name: /appointments/i })).toBeVisible();
});

test('focused v0.1 operational smoke flow reaches core pages', async ({ page }) => {
    await signUpWithClerk(page, createE2EIdentity());
    await page.goto('/onboarding/clinic');
    await completeClinicOnboardingWithoutSampleData(page);

    await page.getByRole('link', { name: /doctors/i }).click();
    await expect(page.getByRole('heading', { name: /^doctors$/i })).toBeVisible();
    await page.getByRole('link', { name: /patients/i }).click();
    await expect(page.getByRole('heading', { name: /^patients$/i })).toBeVisible();
    await page.getByRole('link', { name: /appointments/i }).click();
    await expect(page.getByRole('heading', { name: /^appointments$/i })).toBeVisible();
    await page.getByRole('link', { name: /queue/i }).click();
    await expect(page.getByRole('heading', { name: /^queue$/i })).toBeVisible();
});
