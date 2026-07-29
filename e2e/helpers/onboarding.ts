import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { uniqueRunSuffix } from './environment';

export type E2EClinic = {
    name: string;
    slug: string;
};

export const createE2EClinic = (): E2EClinic => {
    const suffix = uniqueRunSuffix();

    return {
        name: `Pravaah E2E Clinic ${suffix}`,
        slug: `pravaah-e2e-clinic-${suffix}`,
    };
};

export const fillClinicOnboardingForm = async (page: Page, clinic: E2EClinic) => {
    await page.getByLabel(/clinic name/i).fill(clinic.name);
    await page.getByLabel(/clinic slug/i).fill(clinic.slug);
    await page.getByLabel(/clinic phone/i).fill('+91 90000 00000');
    await page.getByLabel(/clinic email/i).fill('frontdesk@example.com');
    await page.getByLabel(/address line 1/i).fill('12 Test Care Road');
    await page.getByLabel(/^city/i).fill('Bengaluru');
    await page.getByLabel(/^state/i).fill('Karnataka');
    await page.getByLabel(/^country/i).fill('India');
    await page.getByLabel(/pincode/i).fill('560001');
    await page.getByLabel(/timezone/i).fill('Asia/Kolkata');
    await page.getByLabel(/opening time/i).fill('09:00');
    await page.getByLabel(/closing time/i).fill('18:00');
    await page.getByLabel(/slot duration minutes/i).fill('15');
    await page.getByLabel(/buffer minutes/i).fill('0');
};

export const completeClinicOnboardingWithoutSampleData = async (
    page: Page,
    clinic = createE2EClinic()
) => {
    await expect(page.getByRole('heading', { name: /create your clinic workspace/i })).toBeVisible();
    await fillClinicOnboardingForm(page, clinic);
    await page.getByRole('button', { name: /create clinic workspace/i }).click();
    await expect(page.getByRole('heading', { name: /add fictional sample data/i })).toBeVisible();
    await page.getByRole('button', { name: /continue with an empty clinic/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard overview/i })).toBeVisible();

    return clinic;
};
