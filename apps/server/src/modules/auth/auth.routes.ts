import { rateLimit } from '../../middleware/rateLimit.js';
import { Router, type RequestHandler } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { authenticateClerkIdentity, authenticateRequest } from './auth.middleware.js';
import {
    createClinicOnboardingController,
    getCurrentUserController,
    getOnboardingStatusController,
} from './auth.controller.js';
import { onboardingClinicSchema } from './auth.validation.js';

const authRouter = Router();
const onboardingClinicRequestValidator = validateRequest({ body: onboardingClinicSchema });
export const validateOnboardingClinicRequest: RequestHandler = (req, res, next) => {
    onboardingClinicRequestValidator(req, res, next);
};

authRouter.get(
    '/onboarding-status',
    authenticateClerkIdentity,
    rateLimit('identityRead'),
    getOnboardingStatusController
);
authRouter.post(
    '/onboarding/clinic',
    authenticateClerkIdentity,
    validateOnboardingClinicRequest,
    rateLimit('onboarding'),
    createClinicOnboardingController
);
authRouter.get('/me', authenticateRequest, rateLimit('identityRead'), getCurrentUserController);

export { authRouter };
