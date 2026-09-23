import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../../generated/prisma/client.js';
import { AppError } from '../../../utils/AppError.js';

const mockClinicRepository = vi.hoisted(() => ({
    findById: vi.fn(),
    findSettingsById: vi.fn(),
    update: vi.fn(),
    saveGeocodingResultIfCurrent: vi.fn(),
    markGeocodingFailedIfCurrent: vi.fn(),
    prepareGeocoding: vi.fn(),
    provisionSampleData: vi.fn(),
}));

const mockPredictNoShowRisk = vi.hoisted(() => vi.fn());
const mockGeocodingService = vi.hoisted(() => ({
    isConfigured: vi.fn(() => true),
    geocodeAddress: vi.fn(),
}));
const mockRoutingRepository = vi.hoisted(() => ({
    invalidateCalculatedRoutesForClinic: vi.fn(),
}));

vi.mock('../clinic.repository.js', () => ({
    clinicRepository: mockClinicRepository,
}));

vi.mock('../../predictions/prediction.service.js', () => ({
    predictNoShowRisk: mockPredictNoShowRisk,
}));

vi.mock('../../geocoding/geocoding.service.js', () => ({
    geocodingService: mockGeocodingService,
}));

vi.mock('../../routing/routing.repository.js', () => ({
    routingRepository: mockRoutingRepository,
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

    it('invalidates and geocodes only when the normalized structured address changes', async () => {
        const existingClinic = {
            id: 'clinic-id',
            addressLine1: '12 Wellness Road',
            addressLine2: null,
            city: 'Jaipur',
            state: 'Rajasthan',
            country: 'India',
            pincode: '302017',
        };
        const geocodedClinic = {
            ...existingClinic,
            city: 'Mumbai',
            geocodingStatus: 'GEOCODED',
        };
        const result = {
            latitude: 19.076,
            longitude: 72.8777,
            provider: 'GEOAPIFY' as const,
            confidence: 0.9,
            resultType: 'street',
            matchType: 'full_match',
            placeId: 'place-id',
            formattedAddress: '12 Wellness Road, Mumbai, Maharashtra, India',
        };

        mockClinicRepository.findById.mockResolvedValue(existingClinic);
        mockClinicRepository.update.mockResolvedValue({
            ...existingClinic,
            city: 'Mumbai',
            geocodingStatus: 'NOT_GEOCODED',
        });
        mockGeocodingService.geocodeAddress.mockResolvedValue({ outcome: 'SUCCESS', result });
        mockClinicRepository.findSettingsById.mockResolvedValue(geocodedClinic);

        await expect(
            clinicService.updateClinic('clinic-id', { city: 'Mumbai' })
        ).resolves.toBe(geocodedClinic);

        expect(mockClinicRepository.update).toHaveBeenCalledWith(
            'clinic-id',
            { city: 'Mumbai' },
            { sourceHash: expect.any(String), attemptId: expect.any(String) }
        );
        expect(mockGeocodingService.geocodeAddress).toHaveBeenCalledTimes(1);
        expect(mockClinicRepository.saveGeocodingResultIfCurrent).toHaveBeenCalledWith(
            'clinic-id',
            expect.any(String),
            expect.any(String),
            result
        );
    });

    it('invalidates routes when a clinic address becomes incomplete', async () => {
        const existingClinic = {
            id: 'clinic-id',
            addressLine1: '12 Wellness Road',
            addressLine2: null,
            city: 'Jaipur',
            state: 'Rajasthan',
            country: 'India',
            pincode: '302017',
            latitude: 26.9,
            longitude: 75.8,
        };
        const updatedClinic = { ...existingClinic, city: null };

        mockClinicRepository.findById.mockResolvedValue(existingClinic);
        mockClinicRepository.update.mockResolvedValue(updatedClinic);

        await expect(
            clinicService.updateClinic('clinic-id', { city: null })
        ).resolves.toBe(updatedClinic);

        expect(mockRoutingRepository.invalidateCalculatedRoutesForClinic).toHaveBeenCalledWith(
            'clinic-id'
        );
        expect(mockGeocodingService.geocodeAddress).not.toHaveBeenCalled();
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
