import { Router } from 'express';

import { getHealthCheck } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', getHealthCheck);
