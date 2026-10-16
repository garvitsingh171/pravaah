import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockTransaction = vi.hoisted(() => vi.fn());
const mockClinicFindUnique = vi.hoisted(() => vi.fn());
const mockClinicUpdate = vi.hoisted(() => vi.fn());

vi.mock('../../../config/prisma.js', () => ({
    prisma: {
        clinic: {
            findUnique: mockClinicFindUnique,
            update: mockClinicUpdate,
        },
        $transaction: mockTransaction,
    },
}));

import { clinicRepository } from '../clinic.repository.js';

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
                lateArrivalGraceMinutes: true,
                createdAt: true,
                updatedAt: true,
            }),
        });
        expect(mockClinicFindUnique.mock.calls[0]?.[0].select).not.toHaveProperty('users');
        expect(mockClinicFindUnique.mock.calls[0]?.[0].select).toHaveProperty('isActive', true);
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
            lateArrivalGraceMinutes: 0,
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
                lateArrivalGraceMinutes: 0,
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
                lateArrivalGraceMinutes: true,
                createdAt: true,
                updatedAt: true,
            }),
        });
        expect(mockClinicUpdate.mock.calls[0]?.[0].data).not.toHaveProperty('slug');
        expect(mockClinicUpdate.mock.calls[0]?.[0].data).not.toHaveProperty('isActive');
        expect(mockClinicUpdate.mock.calls[0]?.[0].select).toHaveProperty('isActive', true);
    });
});

describe('clinicRepository.setActive', () => {
    const tx = {
        $queryRaw: vi.fn(),
        clinic: { findUnique: vi.fn(), update: vi.fn() },
        appointment: { count: vi.fn() },
        queueEntry: { count: vi.fn() },
        lifecycleEvent: { create: vi.fn() },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockTransaction.mockImplementation((callback) => callback(tx));
        tx.$queryRaw.mockResolvedValue([{ id: 'clinic-id' }]);
        tx.clinic.findUnique.mockResolvedValue({
            id: 'clinic-id',
            name: 'Clinic A',
            isActive: true,
        });
        tx.appointment.count.mockResolvedValue(0);
        tx.queueEntry.count.mockResolvedValue(0);
        tx.clinic.update.mockResolvedValue({ id: 'clinic-id', isActive: false });
    });

    it('requires the exact clinic name before deactivation', async () => {
        const result = await clinicRepository.setActive({
            clinicId: 'clinic-id',
            actorUserId: 'admin-id',
            isActive: false,
            confirmClinicName: 'Wrong clinic',
        });

        expect(result).toEqual({ outcome: 'CONFIRMATION_MISMATCH' });
        expect(tx.clinic.update).not.toHaveBeenCalled();
    });

    it('blocks deactivation until unresolved appointments are resolved', async () => {
        tx.appointment.count.mockResolvedValueOnce(2).mockResolvedValueOnce(2);

        const result = await clinicRepository.setActive({
            clinicId: 'clinic-id',
            actorUserId: 'admin-id',
            isActive: false,
            confirmClinicName: 'Clinic A',
        });

        expect(result).toMatchObject({
            outcome: 'ACTIVE_VISITS',
            impact: { futureAppointments: 2 },
        });
        expect(tx.clinic.update).not.toHaveBeenCalled();
        expect(tx.lifecycleEvent.create).not.toHaveBeenCalled();
    });

    it('deactivates with an event once the clinic has no unresolved visits', async () => {
        const result = await clinicRepository.setActive({
            clinicId: 'clinic-id',
            actorUserId: 'admin-id',
            isActive: false,
            confirmClinicName: 'Clinic A',
        });

        expect(result).toMatchObject({ outcome: 'UPDATED', clinic: { isActive: false } });
        expect(tx.clinic.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { isActive: false } })
        );
        expect(tx.lifecycleEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ actorUserId: 'admin-id', action: 'DEACTIVATED' }),
        });
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
