import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    findPrediction: vi.fn(),
    findOwn: vi.fn(),
    save: vi.fn(),
    requireClinicStaff: vi.fn(),
    verifyClinicAccess: vi.fn(),
    getSuggestedNoShowActions: vi.fn(),
}));

vi.mock('../prediction-feedback.repository.js', () => ({ predictionFeedbackRepository: {
    findPrediction: mocks.findPrediction, findOwn: mocks.findOwn, save: mocks.save,
} }));
vi.mock('../../auth/access.service.js', () => ({ accessService: {
    requireClinicStaff: mocks.requireClinicStaff, verifyClinicAccess: mocks.verifyClinicAccess,
} }));
vi.mock('../prediction.service.js', () => ({ getSuggestedNoShowActions: mocks.getSuggestedNoShowActions }));

import { predictionFeedbackService } from '../prediction-feedback.service.js';

const prediction = { id: 'prediction-id', clinicId: 'clinic-id', riskLevel: 'HIGH', reasons: [{ code: 'SHORT_NOTICE_BOOKING' }] };
const staff = { id: 'staff-id', clinicId: 'clinic-id', role: 'STAFF', status: 'ACTIVE' };
const body = { usefulness: 'USEFUL' as const, actionTaken: 'CONTACTED_PATIENT' as const, note: 'Called to confirm.' };

describe('predictionFeedbackService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireClinicStaff.mockReturnValue(staff);
        mocks.findPrediction.mockResolvedValue(prediction);
        mocks.verifyClinicAccess.mockResolvedValue({ id: 'clinic-id' });
        mocks.getSuggestedNoShowActions.mockReturnValue(['Server-generated recommendation']);
        mocks.save.mockResolvedValue({ id: 'feedback-id', predictionId: 'prediction-id' });
    });

    it('authorizes staff against the prediction clinic and saves feedback to that run with server context', async () => {
        await predictionFeedbackService.saveOwn(staff as never, 'prediction-id', body);
        expect(mocks.verifyClinicAccess).toHaveBeenCalledWith(staff, 'clinic-id');
        expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
            predictionId: 'prediction-id', staffUserId: 'staff-id', body,
            recommendationSnapshot: ['Server-generated recommendation'],
            recommendationVersion: 'starter-rule-v1/recommendations-v1',
        }));
    });

    it('returns only the authenticated user\'s feedback', async () => {
        mocks.findOwn.mockResolvedValue({ id: 'own-feedback' });
        await predictionFeedbackService.getOwn(staff as never, 'prediction-id');
        expect(mocks.findOwn).toHaveBeenCalledWith('prediction-id', 'staff-id');
    });

    it('returns not found for an unknown prediction and does not write', async () => {
        mocks.findPrediction.mockResolvedValue(null);
        await expect(predictionFeedbackService.saveOwn(staff as never, 'missing', body)).rejects.toMatchObject({ code: 'PREDICTION_NOT_FOUND' });
        expect(mocks.save).not.toHaveBeenCalled();
    });
});
