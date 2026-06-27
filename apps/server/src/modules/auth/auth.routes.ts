import { Router } from 'express';
import { authenticateRequest } from './auth.middleware.js';
import { getCurrentUserController } from './auth.controller.js';

const authRouter = Router();

authRouter.get('/me', authenticateRequest, getCurrentUserController);

export { authRouter };
