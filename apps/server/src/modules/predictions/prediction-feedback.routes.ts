import { rateLimit } from '../../middleware/rateLimit.js';
import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { authenticateRequest, requireClinicStaffRole } from '../auth/auth.middleware.js';
import {
    getPredictionFeedbackController,
    savePredictionFeedbackController,
} from './prediction-feedback.controller.js';
import {
    predictionFeedbackBodySchema,
    predictionFeedbackParamsSchema,
} from './prediction-feedback.validation.js';

const predictionFeedbackRouter = Router();
predictionFeedbackRouter.get(
    '/:predictionId/feedback',
    authenticateRequest,
    requireClinicStaffRole,
    validateRequest({ params: predictionFeedbackParamsSchema }),
    rateLimit('collection'),
    getPredictionFeedbackController
);
predictionFeedbackRouter.put(
    '/:predictionId/feedback',
    authenticateRequest,
    requireClinicStaffRole,
    validateRequest({ params: predictionFeedbackParamsSchema, body: predictionFeedbackBodySchema }),
    rateLimit('mutation'),
    savePredictionFeedbackController
);

export { predictionFeedbackRouter };
