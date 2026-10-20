import { AppError } from '../../utils/AppError.js';
import { accessService } from '../auth/access.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { getSuggestedNoShowActions } from './prediction.service.js';
import { predictionFeedbackRepository } from './prediction-feedback.repository.js';
import type { PredictionFeedbackBody } from './prediction-feedback.validation.js';

export const RECOMMENDATION_CONTEXT_VERSION = 'starter-rule-v1/recommendations-v1';

async function authorizePrediction(user: AuthenticatedUser | undefined, predictionId: string) {
    const staff = accessService.requireClinicStaff(user);
    const prediction = await predictionFeedbackRepository.findPrediction(predictionId);
    if (!prediction) throw new AppError(404, 'PREDICTION_NOT_FOUND', 'Prediction not found');
    await accessService.verifyClinicAccess(staff, prediction.clinicId);
    return { staff, prediction };
}

export const predictionFeedbackService = {
    async getOwn(user: AuthenticatedUser | undefined, predictionId: string) {
        const { staff } = await authorizePrediction(user, predictionId);
        return predictionFeedbackRepository.findOwn(predictionId, staff.id);
    },

    async saveOwn(user: AuthenticatedUser | undefined, predictionId: string, body: PredictionFeedbackBody) {
        const { staff, prediction } = await authorizePrediction(user, predictionId);
        const recommendationSnapshot = getSuggestedNoShowActions(
            prediction.riskLevel,
            Array.isArray(prediction.reasons) ? prediction.reasons : []
        );
        return predictionFeedbackRepository.save({
            predictionId,
            staffUserId: staff.id,
            body,
            recommendationSnapshot,
            recommendationVersion: RECOMMENDATION_CONTEXT_VERSION,
        });
    },
};
