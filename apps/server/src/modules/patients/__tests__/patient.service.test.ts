import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../utils/AppError.js';

const mockPatientRepository = vi.hoisted(() => ({
    findClinicById: vi.fn(),
    findPatientById: vi.fn(),
    findPatientClinicLink: vi.fn(),
    createPatientWithClinicLink: vi.fn(),
    updatePatientWithClinicDetails: vi.fn(),
    saveGeocodingResultIfCurrent: vi.fn(),
    markGeocodingFailedIfCurrent: vi.fn(),
    prepareGeocoding: vi.fn(),
    findPatientByIdWithClinic: vi.fn(),
    invalidateCalculatedRoutesForPatient: vi.fn(),
    listPatientsByClinic: vi.fn(),
}));

const mockGeocodingService = vi.hoisted(() => ({
    isConfigured: vi.fn(() => true),
    geocodeAddress: vi.fn(),
}));

const mockRoutingService = vi.hoisted(() => ({
    calculatePatientClinicRoute: vi.fn(),
}));

vi.mock('../patient.repository.js', () => ({
    patientRepository: mockPatientRepository,
}));

vi.mock('../../geocoding/geocoding.service.js', () => ({
    geocodingService: mockGeocodingService,
}));

vi.mock('../../routing/routing.service.js', () => ({
    routingService: mockRoutingService,
}));

vi.mock('../../routing/routing.repository.js', () => ({
    routingRepository: mockPatientRepository,
}));

import { patientService } from '../patient.service.js';

const completeAddress = {
    addressLine1: 'B-42, Malviya Nagar',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    pincode: '302017',
};

describe('patientService geocoding orchestration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPatientRepository.findClinicById.mockResolvedValue({ id: 'clinic-id' });
    });

    it('creates the Patient and PatientClinic link before persisting a successful lookup', async () => {
        const createdPatient = { id: 'patient-id', ...completeAddress };
        const result = {
            latitude: 26.8467,
            longitude: 75.7894,
            provider: 'GEOAPIFY' as const,
            confidence: 0.92,
            resultType: 'amenity',
            matchType: 'full_match',
            placeId: 'place-id',
            formattedAddress: 'B-42, Malviya Nagar, Jaipur, Rajasthan, India',
        };

        mockPatientRepository.createPatientWithClinicLink.mockResolvedValue(createdPatient);
        mockGeocodingService.geocodeAddress.mockResolvedValue({ outcome: 'SUCCESS', result });
        mockPatientRepository.findPatientById.mockResolvedValue({
            ...createdPatient,
            geocodingStatus: 'GEOCODED',
        });

        await expect(
            patientService.createPatient('clinic-id', {
                fullName: 'Riya Malhotra',
                phone: '+91 90000 02001',
                ...completeAddress,
            })
        ).resolves.toMatchObject({ geocodingStatus: 'GEOCODED' });

        expect(mockPatientRepository.createPatientWithClinicLink).toHaveBeenCalledWith(
            'clinic-id',
            expect.objectContaining(completeAddress),
            {
                sourceHash: expect.any(String),
                attemptId: expect.any(String),
            }
        );
        expect(mockGeocodingService.geocodeAddress).toHaveBeenCalledTimes(1);
        expect(mockPatientRepository.saveGeocodingResultIfCurrent).toHaveBeenCalledWith(
            'patient-id',
            expect.any(String),
            expect.any(String),
            result
        );
    });

    it('does not use provider credits for an incomplete patient address', async () => {
        const createdPatient = { id: 'patient-id', addressLine1: '12 Demo Road' };
        mockPatientRepository.createPatientWithClinicLink.mockResolvedValue(createdPatient);

        await expect(
            patientService.createPatient('clinic-id', {
                fullName: 'Riya Malhotra',
                phone: '+91 90000 02001',
                addressLine1: '12 Demo Road',
            })
        ).resolves.toBe(createdPatient);

        expect(mockGeocodingService.geocodeAddress).not.toHaveBeenCalled();
    });

    it('keeps core patient creation successful when route enrichment fails', async () => {
        const createdPatient = { id: 'patient-id', ...completeAddress };
        mockPatientRepository.createPatientWithClinicLink.mockResolvedValue(createdPatient);
        mockGeocodingService.geocodeAddress.mockResolvedValue({
            outcome: 'SUCCESS',
            result: {
                latitude: 26.8467,
                longitude: 75.7894,
                provider: 'GEOAPIFY',
                confidence: null,
                resultType: null,
                matchType: null,
                placeId: null,
                formattedAddress: null,
            },
        });
        mockPatientRepository.findPatientById.mockResolvedValue({
            ...createdPatient,
            latitude: 26.8467,
            longitude: 75.7894,
            geocodingStatus: 'GEOCODED',
        });
        mockPatientRepository.findClinicById.mockResolvedValue({
            id: 'clinic-id',
            latitude: 26.85305,
            longitude: 75.80573,
            geocodingStatus: 'GEOCODED',
        });
        mockRoutingService.calculatePatientClinicRoute.mockRejectedValue(
            new Error('database unavailable while saving derived route')
        );

        await expect(
            patientService.createPatient('clinic-id', {
                fullName: 'Riya Malhotra',
                phone: '+91 90000 02001',
                ...completeAddress,
            })
        ).resolves.toBeDefined();

        expect(mockPatientRepository.createPatientWithClinicLink).toHaveBeenCalledTimes(1);
        expect(mockRoutingService.calculatePatientClinicRoute).toHaveBeenCalledWith({
            clinicId: 'clinic-id',
            patientId: 'patient-id',
        });
    });

    it('does not geocode when a patient update changes only unrelated data', async () => {
        mockPatientRepository.findPatientById.mockResolvedValue({
            id: 'patient-id',
            ...completeAddress,
        });
        mockPatientRepository.findPatientClinicLink.mockResolvedValue({ id: 'patient-clinic-id' });
        const updatedPatient = { id: 'patient-id', ...completeAddress, phone: '+91 90000 02002' };
        mockPatientRepository.updatePatientWithClinicDetails.mockResolvedValue(updatedPatient);

        await expect(
            patientService.updatePatient('clinic-id', 'patient-id', {
                phone: '+91 90000 02002',
            })
        ).resolves.toBe(updatedPatient);

        expect(mockGeocodingService.geocodeAddress).not.toHaveBeenCalled();
        expect(mockPatientRepository.updatePatientWithClinicDetails).toHaveBeenCalledWith(
            'clinic-id',
            'patient-id',
            { phone: '+91 90000 02002' }
        );
    });

    it('invalidates routes when a patient address becomes incomplete', async () => {
        mockPatientRepository.findPatientById.mockResolvedValue({
            id: 'patient-id',
            ...completeAddress,
        });
        mockPatientRepository.findPatientClinicLink.mockResolvedValue({ id: 'patient-clinic-id' });
        const updatedPatient = { id: 'patient-id', ...completeAddress, city: null };
        mockPatientRepository.updatePatientWithClinicDetails.mockResolvedValue(updatedPatient);

        await expect(
            patientService.updatePatient('clinic-id', 'patient-id', { city: null })
        ).resolves.toBe(updatedPatient);

        expect(mockPatientRepository.invalidateCalculatedRoutesForPatient).toHaveBeenCalledWith(
            'patient-id'
        );
        expect(mockGeocodingService.geocodeAddress).not.toHaveBeenCalled();
    });

    it('rejects a retry when the patient is not linked to the requested clinic', async () => {
        mockPatientRepository.findPatientById.mockResolvedValue({
            id: 'patient-id',
            ...completeAddress,
        });
        mockPatientRepository.findPatientClinicLink.mockResolvedValue(null);

        await expect(patientService.retryGeocoding('clinic-id', 'patient-id')).rejects.toThrow(
            new AppError(
                403,
                'PATIENT_NOT_LINKED_TO_CLINIC',
                'Patient is not linked to this clinic'
            )
        );
        expect(mockGeocodingService.geocodeAddress).not.toHaveBeenCalled();
    });
});
