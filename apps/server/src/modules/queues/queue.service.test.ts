import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockQueueRepository = vi.hoisted(() => ({
    findQueueByClinicDate: vi.fn(),
    findQueueEntryById: vi.fn(),
    updateQueueEntryStatus: vi.fn(),
    findQueueEntriesByIds: vi.fn(),
    findActiveQueueByClinicDate: vi.fn(),
    reorderQueueEntries: vi.fn(),
}));

const mockAccessService = vi.hoisted(() => ({
    verifyClinicAccess: vi.fn(),
}));

vi.mock('./queue.repository.js', () => ({
    queueRepository: mockQueueRepository,
}));

vi.mock('../auth/access.service.js', () => ({
    accessService: mockAccessService,
}));

import { queueService } from './queue.service.js';

const authenticatedUser = {
    id: 'user-id',
    clerkUserId: 'clerk-user-id',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    clinicId: 'clinic-id',
};

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
        expect(result[0]?.noShowPrediction).toEqual(noShowPrediction);
        expect(result[0]?.appointment).not.toHaveProperty('noShowPrediction');
        expect(result[0]?.noShowPrediction).toHaveProperty('score', 60);
        expect(result[0]?.noShowPrediction).not.toHaveProperty('appointmentId');
    });
});
