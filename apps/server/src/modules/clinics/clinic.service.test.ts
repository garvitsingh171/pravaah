import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';

const mockClinicRepository = vi.hoisted(() => ({
    findById: vi.fn(),
    findBySlug: vi.fn(),
    update: vi.fn(),
    provisionSampleData: vi.fn(),
}));

const mockPredictNoShowRisk = vi.hoisted(() => vi.fn());

vi.mock('./clinic.repository.js', () => ({
    clinicRepository: mockClinicRepository,
}));

vi.mock('../predictions/prediction.service.js', () => ({
    predictNoShowRisk: mockPredictNoShowRisk,
}));

import { clinicService } from './clinic.service.js';

const activeAdminUser = {
    id: 'admin-user-id',
    clerkUserId: 'admin-clerk-user-id',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    clinicId: 'clinic-id',
};

const createdSummary = {
    doctors: 3,
    patients: 6,
    appointments: 9,
    noShowPredictions: 9,
    queueEntries: 6,
    todayQueueEntries: 6,
};

describe('clinicService.provisionSampleData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockClinicRepository.provisionSampleData.mockResolvedValue({
            outcome: 'CREATED',
            today: '2026-06-20',
            summary: createdSummary,
        });
    });

    it('provisions sample data for the authenticated Admin clinic using the trusted user id', async () => {
        await expect(
            clinicService.provisionSampleData({
                clinicId: 'clinic-id',
                user: activeAdminUser,
            })
        ).resolves.toEqual({
            outcome: 'CREATED',
            summary: {
                ...createdSummary,
                today: '2026-06-20',
            },
        });

        expect(mockClinicRepository.provisionSampleData).toHaveBeenCalledWith(
            {
                clinicId: 'clinic-id',
                createdByUserId: 'admin-user-id',
            },
            mockPredictNoShowRisk
        );
    });

    it('returns an idempotent already-provisioned result without treating it as a failure', async () => {
        mockClinicRepository.provisionSampleData.mockResolvedValue({
            outcome: 'ALREADY_PROVISIONED',
            today: '2026-06-20',
            summary: createdSummary,
        });

        await expect(
            clinicService.provisionSampleData({
                clinicId: 'clinic-id',
                user: activeAdminUser,
            })
        ).resolves.toEqual({
            outcome: 'ALREADY_PROVISIONED',
            summary: {
                ...createdSummary,
                today: '2026-06-20',
            },
        });
    });

    it('rejects missing authenticated users before repository writes', async () => {
        await expect(
            clinicService.provisionSampleData({
                clinicId: 'clinic-id',
                user: undefined,
            })
        ).rejects.toThrow(
            new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
        );

        expect(mockClinicRepository.provisionSampleData).not.toHaveBeenCalled();
    });

    it('maps a missing clinic to the existing clinic not found error', async () => {
        mockClinicRepository.provisionSampleData.mockResolvedValue({
            outcome: 'CLINIC_NOT_FOUND',
            today: '',
            summary: null,
        });

        await expect(
            clinicService.provisionSampleData({
                clinicId: 'clinic-id',
                user: activeAdminUser,
            })
        ).rejects.toThrow(new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found'));
    });
});
