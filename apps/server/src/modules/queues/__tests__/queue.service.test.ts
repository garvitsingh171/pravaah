import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockQueueRepository = vi.hoisted(() => ({
    findQueueByClinicDate: vi.fn(),
    findQueueEntryById: vi.fn(),
    updateQueueEntryStatus: vi.fn(),
    findQueueEntriesByIds: vi.fn(),
    findActiveQueueByClinicDate: vi.fn(),
    findActiveQueueByClinicDoctorDate: vi.fn(),
    reorderQueueEntries: vi.fn(),
}));

const mockAccessService = vi.hoisted(() => ({
    verifyClinicAccess: vi.fn(),
}));

vi.mock('../queue.repository.js', () => ({
    queueRepository: mockQueueRepository,
}));

vi.mock('../../auth/access.service.js', () => ({
    accessService: mockAccessService,
}));

import { queueService } from '../queue.service.js';

const authenticatedUser = {
    id: 'user-id',
    clerkUserId: 'clerk-user-id',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    clinicId: 'clinic-id',
};

const createQueueEntry = (
    overrides: Partial<{
        id: string;
        clinicId: string;
        appointmentId: string;
        doctorId: string;
        patientId: string;
        position: number;
        status: string;
    }> = {}
) => ({
    id: overrides.id ?? 'queue-entry-id',
    clinicId: overrides.clinicId ?? 'clinic-id',
    appointmentId: overrides.appointmentId ?? 'appointment-id',
    doctorId: overrides.doctorId ?? 'doctor-id',
    patientId: overrides.patientId ?? 'patient-id',
    position: overrides.position ?? 1,
    status: overrides.status ?? 'WAITING',
    queuedAt: new Date('2026-06-18T10:00:00.000Z'),
    calledAt: null,
    completedAt: null,
    createdAt: new Date('2026-06-18T10:00:00.000Z'),
    updatedAt: new Date('2026-06-18T10:00:00.000Z'),
    appointment: {
        id: overrides.appointmentId ?? 'appointment-id',
        scheduledAt: new Date('2026-06-20T10:00:00.000Z'),
        durationMinutes: 15,
        status: 'IN_QUEUE',
        bookingSource: 'RECEPTION',
        reason: 'Fever',
        notes: null,
        noShowPrediction: null,
    },
    doctor: {
        id: overrides.doctorId ?? 'doctor-id',
        fullName: 'Dr. Asha Rao',
        specialization: 'General Medicine',
        qualification: 'MBBS',
    },
    patient: {
        id: overrides.patientId ?? 'patient-id',
        fullName: 'Rohan Mehta',
        phone: '9999999999',
        email: null,
        gender: null,
        age: 34,
    },
});

describe('queueService.listQueueByClinicDate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('adds public no-show prediction data to queue entries', async () => {
        const noShowPrediction = {
            id: 'no-show-prediction-id',
            riskLevel: 'HIGH' as const,
            score: 60,
            reasons: [
                {
                    code: 'PREVIOUS_NO_SHOW_HISTORY',
                    message: 'Patient has multiple previous no-show appointments.',
                    scoreImpact: 40,
                },
            ],
            createdAt: new Date('2026-06-18T10:00:01.000Z'),
            updatedAt: new Date('2026-06-18T10:00:01.000Z'),
        };

        mockAccessService.verifyClinicAccess.mockResolvedValue({
            id: 'clinic-id',
            isActive: true,
            timezone: 'Asia/Kolkata',
        });

        mockQueueRepository.findQueueByClinicDate.mockResolvedValue([
            {
                id: 'queue-entry-id',
                clinicId: 'clinic-id',
                appointmentId: 'appointment-id',
                doctorId: 'doctor-id',
                patientId: 'patient-id',
                position: 1,
                status: 'WAITING',
                queuedAt: new Date('2026-06-18T10:00:00.000Z'),
                calledAt: null,
                completedAt: null,
                createdAt: new Date('2026-06-18T10:00:00.000Z'),
                updatedAt: new Date('2026-06-18T10:00:00.000Z'),
                appointment: {
                    id: 'appointment-id',
                    scheduledAt: new Date('2026-06-20T10:00:00.000Z'),
                    durationMinutes: 15,
                    status: 'SCHEDULED',
                    bookingSource: 'RECEPTION',
                    reason: 'Fever',
                    notes: null,
                    noShowPrediction,
                },
                doctor: {
                    id: 'doctor-id',
                    fullName: 'Dr. Asha Rao',
                    specialization: 'General Medicine',
                    qualification: 'MBBS',
                },
                patient: {
                    id: 'patient-id',
                    fullName: 'Rohan Mehta',
                    phone: '9999999999',
                    email: null,
                    gender: null,
                    age: 34,
                },
            },
        ]);

        const result = await queueService.listQueueByClinicDate(
            authenticatedUser,
            'clinic-id',
            '2026-06-20'
        );

        expect(mockAccessService.verifyClinicAccess).toHaveBeenCalledWith(
            authenticatedUser,
            'clinic-id'
        );
        expect(mockQueueRepository.findQueueByClinicDate).toHaveBeenCalledWith(
            'clinic-id',
            '2026-06-20',
            'Asia/Kolkata'
        );
        expect(result).toHaveLength(1);
        expect(result[0]?.noShowPrediction).toEqual({
            ...noShowPrediction,
            suggestedActions: expect.arrayContaining([
                'Review this appointment during front-desk preparation.',
            ]),
            modelVersion: 'starter-rule-v1',
            generatedAt: noShowPrediction.createdAt,
        });
        expect(result[0]?.appointment).not.toHaveProperty('noShowPrediction');
        expect(result[0]?.noShowPrediction).toHaveProperty('score', 60);
        expect(result[0]?.noShowPrediction).not.toHaveProperty('appointmentId');
    });
});

describe('queueService.reorderQueue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAccessService.verifyClinicAccess.mockResolvedValue({
            id: 'clinic-id',
            isActive: true,
            timezone: 'Asia/Kolkata',
        });
    });

    it('reorders the complete active queue for one doctor and clinic-local date', async () => {
        const firstEntry = createQueueEntry({
            id: 'queue-entry-1',
            appointmentId: 'appointment-1',
            position: 1,
        });
        const secondEntry = createQueueEntry({
            id: 'queue-entry-2',
            appointmentId: 'appointment-2',
            position: 2,
        });
        const requestedIds = [secondEntry.id, firstEntry.id];

        mockQueueRepository.findQueueEntriesByIds.mockResolvedValue([firstEntry, secondEntry]);
        mockQueueRepository.findActiveQueueByClinicDoctorDate.mockResolvedValue([
            firstEntry,
            secondEntry,
        ]);
        mockQueueRepository.reorderQueueEntries.mockResolvedValue([
            {
                ...secondEntry,
                position: 1,
            },
            {
                ...firstEntry,
                position: 2,
            },
        ]);

        const result = await queueService.reorderQueue(
            authenticatedUser,
            'clinic-id',
            '2026-06-20',
            requestedIds
        );

        expect(mockQueueRepository.findActiveQueueByClinicDoctorDate).toHaveBeenCalledWith(
            'clinic-id',
            'doctor-id',
            '2026-06-20',
            'Asia/Kolkata',
            ['ARRIVED', 'WAITING', 'CALLED']
        );
        expect(mockQueueRepository.reorderQueueEntries).toHaveBeenCalledWith(
            'clinic-id',
            'doctor-id',
            '2026-06-20',
            'Asia/Kolkata',
            requestedIds,
            ['ARRIVED', 'WAITING', 'CALLED']
        );
        expect(result.map((queueEntry) => queueEntry.id)).toEqual(requestedIds);
    });

    it('rejects duplicate queue entry ids before repository membership reads', async () => {
        await expect(
            queueService.reorderQueue(authenticatedUser, 'clinic-id', '2026-06-20', [
                'queue-entry-1',
                'queue-entry-1',
            ])
        ).rejects.toMatchObject({
            code: 'QUEUE_REORDER_DUPLICATE_ENTRY',
            statusCode: 400,
        });

        expect(mockQueueRepository.findQueueEntriesByIds).not.toHaveBeenCalled();
    });

    it('rejects entries from different doctor queues', async () => {
        mockQueueRepository.findQueueEntriesByIds.mockResolvedValue([
            createQueueEntry({
                id: 'queue-entry-1',
                doctorId: 'doctor-id-1',
            }),
            createQueueEntry({
                id: 'queue-entry-2',
                doctorId: 'doctor-id-2',
            }),
        ]);

        await expect(
            queueService.reorderQueue(authenticatedUser, 'clinic-id', '2026-06-20', [
                'queue-entry-1',
                'queue-entry-2',
            ])
        ).rejects.toMatchObject({
            code: 'QUEUE_SCOPE_MISMATCH',
            statusCode: 400,
        });

        expect(mockQueueRepository.reorderQueueEntries).not.toHaveBeenCalled();
    });

    it('rejects incomplete active doctor-date membership', async () => {
        const firstEntry = createQueueEntry({
            id: 'queue-entry-1',
        });
        const secondEntry = createQueueEntry({
            id: 'queue-entry-2',
        });

        mockQueueRepository.findQueueEntriesByIds.mockResolvedValue([firstEntry]);
        mockQueueRepository.findActiveQueueByClinicDoctorDate.mockResolvedValue([
            firstEntry,
            secondEntry,
        ]);

        await expect(
            queueService.reorderQueue(authenticatedUser, 'clinic-id', '2026-06-20', [
                'queue-entry-1',
            ])
        ).rejects.toMatchObject({
            code: 'QUEUE_REORDER_INCOMPLETE',
            statusCode: 400,
        });
    });

    it('rejects final queue entries', async () => {
        mockQueueRepository.findQueueEntriesByIds.mockResolvedValue([
            createQueueEntry({
                id: 'queue-entry-1',
                status: 'COMPLETED',
            }),
        ]);

        await expect(
            queueService.reorderQueue(authenticatedUser, 'clinic-id', '2026-06-20', [
                'queue-entry-1',
            ])
        ).rejects.toMatchObject({
            code: 'QUEUE_ENTRY_FINAL_STATUS',
            statusCode: 409,
        });
    });
});
