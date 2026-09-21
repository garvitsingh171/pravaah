import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockTransaction = vi.hoisted(() => vi.fn());
const mockPatientCreate = vi.hoisted(() => vi.fn());
const mockPatientUpdate = vi.hoisted(() => vi.fn());
const mockPatientFindUnique = vi.hoisted(() => vi.fn());
const mockPatientClinicCreate = vi.hoisted(() => vi.fn());
const mockPatientClinicUpdate = vi.hoisted(() => vi.fn());

vi.mock('../../../config/prisma.js', () => ({
    prisma: {
        $transaction: mockTransaction,
    },
}));

import { patientRepository } from '../patient.repository.js';

const transactionClient = {
    patient: {
        create: mockPatientCreate,
        update: mockPatientUpdate,
        findUnique: mockPatientFindUnique,
    },
    patientClinic: {
        create: mockPatientClinicCreate,
        update: mockPatientClinicUpdate,
    },
};

describe('patientRepository structured location persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTransaction.mockImplementation(async (operation) => operation(transactionClient));
        mockPatientCreate.mockResolvedValue({ id: 'patient-id' });
        mockPatientFindUnique.mockResolvedValue({ id: 'patient-id' });
    });

    it('stores structured location on Patient and clinic-specific fields on PatientClinic', async () => {
        await patientRepository.createPatientWithClinicLink('clinic-id', {
            fullName: 'Riya Malhotra',
            phone: '+91 90000 02001',
            addressLine1: 'B-42, Malviya Nagar',
            addressLine2: 'Near Gaurav Tower',
            city: 'Jaipur',
            state: 'Rajasthan',
            country: 'India',
            pincode: '302017',
            notes: 'Clinic-specific note',
            distanceFromClinicKm: 4.2,
        });

        expect(mockPatientCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                address: 'B-42, Malviya Nagar',
                addressLine1: 'B-42, Malviya Nagar',
                addressLine2: 'Near Gaurav Tower',
                city: 'Jaipur',
                state: 'Rajasthan',
                country: 'India',
                pincode: '302017',
            }),
        });
        expect(mockPatientClinicCreate).toHaveBeenCalledWith({
            data: {
                patientId: 'patient-id',
                clinicId: 'clinic-id',
                notes: 'Clinic-specific note',
                distanceFromClinicKm: 4.2,
            },
        });
    });

    it('updates each structured location field independently without moving clinic data', async () => {
        await patientRepository.updatePatientWithClinicDetails('clinic-id', 'patient-id', {
            city: 'Jaipur',
            addressLine2: null,
            distanceFromClinicKm: null,
        });

        expect(mockPatientUpdate).toHaveBeenCalledWith({
            where: { id: 'patient-id' },
            data: {
                city: 'Jaipur',
                addressLine2: null,
            },
        });
        expect(mockPatientClinicUpdate).toHaveBeenCalledWith({
            where: {
                patientId_clinicId: {
                    patientId: 'patient-id',
                    clinicId: 'clinic-id',
                },
            },
            data: {
                distanceFromClinicKm: null,
            },
        });
    });
});
