import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../../generated/prisma/client.js';
import { AppError } from '../../../utils/AppError.js';

const mockClinicRepository = vi.hoisted(() => ({
    findById: vi.fn(),
    findSettingsById: vi.fn(),
    update: vi.fn(),
    provisionSampleData: vi.fn(),
}));

const mockPredictNoShowRisk = vi.hoisted(() => vi.fn());

vi.mock('../clinic.repository.js', () => ({
    clinicRepository: mockClinicRepository,
}));

vi.mock('../../predictions/prediction.service.js', () => ({
    predictNoShowRisk: mockPredictNoShowRisk,
}));

import { clinicService } from '../clinic.service.js';

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

describe('clinicService.getClinicSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns selected clinic settings when the clinic exists', async () => {
        const clinic = {
            id: 'clinic-id',
            name: 'Pravaah Family Clinic',
            slug: 'pravaah-family-clinic',
        };

        mockClinicRepository.findSettingsById.mockResolvedValue(clinic);

        await expect(clinicService.getClinicSettings('clinic-id')).resolves.toBe(clinic);
        expect(mockClinicRepository.findSettingsById).toHaveBeenCalledWith('clinic-id');
    });

    it('maps a missing clinic to the existing clinic not found error', async () => {
        mockClinicRepository.findSettingsById.mockResolvedValue(null);

        await expect(clinicService.getClinicSettings('clinic-id')).rejects.toThrow(
            new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found')
        );
    });
});

describe('clinicService.updateClinic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('updates supported clinic settings without checking or changing slug ownership fields', async () => {
        const input = {
            name: 'Updated Clinic',
            phone: null,
            slotDurationMinutes: 20,
        };
        const updatedClinic = {
            id: 'clinic-id',
            ...input,
        };

        mockClinicRepository.findById.mockResolvedValue({
            id: 'clinic-id',
            slug: 'existing-slug',
        });
        mockClinicRepository.update.mockResolvedValue(updatedClinic);

        await expect(clinicService.updateClinic('clinic-id', input)).resolves.toBe(updatedClinic);
        expect(mockClinicRepository.update).toHaveBeenCalledWith('clinic-id', input);
    });

    it('maps a missing clinic update to the existing clinic not found error', async () => {
        mockClinicRepository.findById.mockResolvedValue(null);

        await expect(
            clinicService.updateClinic('clinic-id', {
                name: 'Updated Clinic',
            })
        ).rejects.toThrow(new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found'));
        expect(mockClinicRepository.update).not.toHaveBeenCalled();
    });
});

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

    it('maps an invalid stored clinic timezone to a controlled provisioning error', async () => {
        mockClinicRepository.provisionSampleData.mockResolvedValue({
            outcome: 'INVALID_CLINIC_TIMEZONE',
            today: '',
            summary: null,
        });

        await expect(
            clinicService.provisionSampleData({
                clinicId: 'clinic-id',
                user: activeAdminUser,
            })
        ).rejects.toThrow(
            new AppError(
                422,
                'INVALID_CLINIC_TIMEZONE',
                'Clinic timezone is invalid. Update clinic settings before provisioning sample data.'
            )
        );
    });
});
