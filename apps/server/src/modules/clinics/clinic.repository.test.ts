import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockTransaction = vi.hoisted(() => vi.fn());
const mockClinicFindUnique = vi.hoisted(() => vi.fn());
const mockClinicUpdate = vi.hoisted(() => vi.fn());

vi.mock('../../config/prisma.js', () => ({
    prisma: {
        clinic: {
            findUnique: mockClinicFindUnique,
            update: mockClinicUpdate,
        },
        $transaction: mockTransaction,
    },
}));

import { clinicRepository } from './clinic.repository.js';

describe('clinicRepository.findSettingsById', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('selects supported settings fields without clinic relationships or security-sensitive user data', async () => {
        mockClinicFindUnique.mockResolvedValue({
            id: 'clinic-id',
            name: 'Pravaah Family Clinic',
        });

        await clinicRepository.findSettingsById('clinic-id');

        expect(mockClinicFindUnique).toHaveBeenCalledWith({
            where: {
                id: 'clinic-id',
            },
            select: expect.objectContaining({
                id: true,
                name: true,
                slug: true,
                phone: true,
                email: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                country: true,
                pincode: true,
                timezone: true,
                openingTime: true,
                closingTime: true,
                slotDurationMinutes: true,
                bufferMinutes: true,
                createdAt: true,
                updatedAt: true,
            }),
        });
        expect(mockClinicFindUnique.mock.calls[0]?.[0].select).not.toHaveProperty('users');
        expect(mockClinicFindUnique.mock.calls[0]?.[0].select).not.toHaveProperty('isActive');
    });
});

describe('clinicRepository.update', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('updates only supported clinic settings fields', async () => {
        await clinicRepository.update('clinic-id', {
            name: 'Updated Clinic',
            phone: null,
            email: 'frontdesk@example.com',
            addressLine1: '12 Wellness Road',
            addressLine2: null,
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400001',
            timezone: 'Asia/Kolkata',
            openingTime: '09:00',
            closingTime: '18:00',
            slotDurationMinutes: 20,
            bufferMinutes: 5,
        });

        expect(mockClinicUpdate).toHaveBeenCalledWith({
            where: {
                id: 'clinic-id',
            },
            data: {
                name: 'Updated Clinic',
                phone: null,
                email: 'frontdesk@example.com',
                addressLine1: '12 Wellness Road',
                addressLine2: null,
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                pincode: '400001',
                timezone: 'Asia/Kolkata',
                openingTime: '09:00',
                closingTime: '18:00',
                slotDurationMinutes: 20,
                bufferMinutes: 5,
            },
            select: expect.objectContaining({
                id: true,
                name: true,
                slug: true,
                phone: true,
                email: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                country: true,
                pincode: true,
                timezone: true,
                openingTime: true,
                closingTime: true,
                slotDurationMinutes: true,
                bufferMinutes: true,
                createdAt: true,
                updatedAt: true,
            }),
        });
        expect(mockClinicUpdate.mock.calls[0]?.[0].data).not.toHaveProperty('slug');
        expect(mockClinicUpdate.mock.calls[0]?.[0].data).not.toHaveProperty('isActive');
        expect(mockClinicUpdate.mock.calls[0]?.[0].select).not.toHaveProperty('isActive');
    });
});

describe('clinicRepository.provisionSampleData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('runs sample writes inside a Prisma transaction and propagates transaction failures', async () => {
        const rollbackError = new Error('transaction rolled back');

        mockTransaction.mockRejectedValue(rollbackError);

        await expect(
            clinicRepository.provisionSampleData(
                {
                    clinicId: 'clinic-id',
                    createdByUserId: 'admin-user-id',
                },
                vi.fn()
            )
        ).rejects.toBe(rollbackError);

        expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
});
