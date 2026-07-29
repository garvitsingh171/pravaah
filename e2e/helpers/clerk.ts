import { setupClerkTestingToken } from '@clerk/testing/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { uniqueRunSuffix } from './environment';

export type E2EIdentity = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
};

export const createE2EIdentity = (): E2EIdentity => {
    const suffix = uniqueRunSuffix();

    return {
        email: `pravaah+clerk_test_${suffix}@example.com`,
        password: `PravaahTest-${suffix}!`,
        firstName: 'Pravaah',
        lastName: `Test ${suffix}`,
    };
};

export const signUpWithClerk = async (page: Page, identity: E2EIdentity) => {
    await setupClerkTestingToken({ page });
    await page.goto('/sign-up');
    await expect(page.locator('input[name=emailAddress]')).toBeVisible();

    const firstNameInput = page.locator('input[name=firstName]');
    if (await firstNameInput.isVisible()) {
        await firstNameInput.fill(identity.firstName);
    }

    const lastNameInput = page.locator('input[name=lastName]');
    if (await lastNameInput.isVisible()) {
        await lastNameInput.fill(identity.lastName);
    }

    const usernameInput = page.locator('input[name=username]');
    if (await usernameInput.isVisible()) {
        await usernameInput.fill(`pravaah_${Date.now()}`);
    }

    await page.locator('input[name=emailAddress]').fill(identity.email);

    const passwordInput = page.locator('input[name=password]');
    if (await passwordInput.isVisible()) {
        await passwordInput.fill(identity.password);
    }

    const legalAcceptedInput = page.locator('input[name=legalAccepted]');
    if (await legalAcceptedInput.isVisible()) {
        await legalAcceptedInput.check();
    }

    await page.getByRole('button', { name: /continue|sign up|create account/i }).click();

    const verificationCode = page.getByRole('textbox', { name: /verification code|code/i });
    if (await verificationCode.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await verificationCode.pressSequentially('424242');
        await page.getByRole('button', { name: /continue|verify/i }).click();
    }

    await expect(page).toHaveURL(/\/onboarding\/clinic|\/dashboard|\/doctors|\/patients|\/appointments|\/queue/);
};
