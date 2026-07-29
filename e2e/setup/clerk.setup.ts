import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import { assertE2EEnvironmentIsSafe } from '../helpers/environment';

setup.describe.configure({ mode: 'serial' });

setup('validate dedicated test environment and prepare Clerk testing token', async () => {
    assertE2EEnvironmentIsSafe();
    await clerkSetup();
});
