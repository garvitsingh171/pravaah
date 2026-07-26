import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { authenticateClerkIdentity, authenticateRequest } from './auth.middleware.js';
import {
    createClinicOnboardingController,
    getCurrentUserController,
    getOnboardingStatusController,
} from './auth.controller.js';
import { onboardingClinicSchema } from './auth.validation.js';

const authRouter = Router();

authRouter.get('/onboarding-status', authenticateClerkIdentity, getOnboardingStatusController);
authRouter.post(
    '/onboarding/clinic',
    authenticateClerkIdentity,
    validateRequest({ body: onboardingClinicSchema }),
    createClinicOnboardingController
);
authRouter.get('/me', authenticateRequest, getCurrentUserController);

export { authRouter };
