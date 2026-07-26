import { Router } from 'express';
import { authenticateClerkIdentity, authenticateRequest } from './auth.middleware.js';
import { getCurrentUserController, getOnboardingStatusController } from './auth.controller.js';

const authRouter = Router();

authRouter.get('/onboarding-status', authenticateClerkIdentity, getOnboardingStatusController);
authRouter.get('/me', authenticateRequest, getCurrentUserController);

export { authRouter };
