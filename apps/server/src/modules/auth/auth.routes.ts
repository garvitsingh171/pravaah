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

authRouter.get('/onboarding-status', authenticateClerkIdentity, getOnboardingStatusController);
authRouter.post(
    '/onboarding/clinic',
    authenticateClerkIdentity,
    validateOnboardingClinicRequest,
    createClinicOnboardingController
);
authRouter.get('/me', authenticateRequest, getCurrentUserController);

export { authRouter };
