import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatus, QueueStatus } from '../../../generated/prisma/client.js';

const mockTransaction = vi.hoisted(() => vi.fn());
const mockAppointmentUpdateMany = vi.hoisted(() => vi.fn());
const mockAppointmentFindFirst = vi.hoisted(() => vi.fn());
const mockQueueEntryFindFirst = vi.hoisted(() => vi.fn());
const mockQueueEntryUpdateMany = vi.hoisted(() => vi.fn());
const mockQueueEntryFindUniqueOrThrow = vi.hoisted(() => vi.fn());
const mockEstablishAppointmentArrivalIfNeeded = vi.hoisted(() => vi.fn());
const mockApplyPatientAppointmentOutcome = vi.hoisted(() => vi.fn());

vi.mock('../../../config/prisma.js', () => ({
    prisma: {
        $transaction: mockTransaction,
    },
}));

vi.mock('../../appointments/appointment.arrival.repository.js', () => ({
    establishAppointmentArrivalIfNeeded: mockEstablishAppointmentArrivalIfNeeded,
}));

vi.mock('../../patients/patient.statistics.repository.js', () => ({
    applyPatientAppointmentOutcome: mockApplyPatientAppointmentOutcome,
}));

import { queueRepository } from '../queue.repository.js';

const transactionClient = {
    appointment: {
        findFirst: mockAppointmentFindFirst,
        updateMany: mockAppointmentUpdateMany,
    },
    queueEntry: {
        findFirst: mockQueueEntryFindFirst,
        updateMany: mockQueueEntryUpdateMany,
        findUniqueOrThrow: mockQueueEntryFindUniqueOrThrow,
    },
};
const eventTimestamp = new Date('2026-09-15T10:20:00.000Z');

describe('queueRepository.updateQueueEntryStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTransaction.mockImplementation(async (operation) => operation(transactionClient));
    });

    it('rejects queue-driven writes that imply invalid appointment lifecycle transitions', async () => {
        mockQueueEntryFindFirst.mockResolvedValue({
            status: QueueStatus.WAITING,
            appointment: {
                status: AppointmentStatus.SCHEDULED,
            },
        });

        await expect(
            queueRepository.updateQueueEntryStatus({
                queueEntryId: 'queue-entry-id',
                appointmentId: 'appointment-id',
                clinicId: 'clinic-id',
                expectedQueueStatus: QueueStatus.WAITING,
                expectedAppointmentStatus: AppointmentStatus.SCHEDULED,
                status: QueueStatus.COMPLETED,
                appointmentStatus: AppointmentStatus.COMPLETED,
                timestampUpdates: {},
                eventTimestamp,
            })
        ).rejects.toThrow('APPOINTMENT_STATUS_TRANSITION_INVALID');

        expect(mockQueueEntryUpdateMany).not.toHaveBeenCalled();
        expect(mockAppointmentUpdateMany).not.toHaveBeenCalled();
    });

    it('allows supported queue-driven appointment transitions', async () => {
        const queueEntry = {
            id: 'queue-entry-id',
            clinicId: 'clinic-id',
            appointmentId: 'appointment-id',
            status: QueueStatus.NO_SHOW,
            appointment: {
                noShowPrediction: null,
            },
        };

        mockQueueEntryFindFirst.mockResolvedValue({
            patientId: 'patient-id',
            status: QueueStatus.WAITING,
            appointment: {
                scheduledAt: new Date('2026-09-15T10:00:00.000Z'),
                status: AppointmentStatus.SCHEDULED,
                arrivedAt: null,
            },
        });
        mockQueueEntryUpdateMany.mockResolvedValue({
            count: 1,
        });
        mockAppointmentUpdateMany.mockResolvedValue({
            count: 1,
        });
        mockQueueEntryFindUniqueOrThrow.mockResolvedValue(queueEntry);

        const result = await queueRepository.updateQueueEntryStatus({
            queueEntryId: 'queue-entry-id',
            appointmentId: 'appointment-id',
            clinicId: 'clinic-id',
            expectedQueueStatus: QueueStatus.WAITING,
            expectedAppointmentStatus: AppointmentStatus.SCHEDULED,
            status: QueueStatus.NO_SHOW,
            appointmentStatus: AppointmentStatus.NO_SHOW,
            timestampUpdates: {},
            eventTimestamp,
        });

        expect(mockQueueEntryUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: 'queue-entry-id',
                    clinicId: 'clinic-id',
                    status: QueueStatus.WAITING,
                }),
                data: {
                    status: QueueStatus.NO_SHOW,
                },
            })
        );
        expect(mockAppointmentUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: 'appointment-id',
                    clinicId: 'clinic-id',
                    status: AppointmentStatus.SCHEDULED,
                }),
                data: {
                    status: AppointmentStatus.NO_SHOW,
                },
            })
        );
        expect(result).toBe(queueEntry);
        expect(mockEstablishAppointmentArrivalIfNeeded).not.toHaveBeenCalled();
        expect(mockApplyPatientAppointmentOutcome).toHaveBeenCalledWith({
            tx: transactionClient,
            clinicId: 'clinic-id',
            patientId: 'patient-id',
            previousStatus: AppointmentStatus.SCHEDULED,
            newStatus: AppointmentStatus.NO_SHOW,
            eventTimestamp,
        });
    });

    it('uses the shared arrival writer when queue updates establish appointment presence', async () => {
        const scheduledAt = new Date('2026-09-15T10:00:00.000Z');
        const queueEntry = {
            id: 'queue-entry-id',
            clinicId: 'clinic-id',
            appointmentId: 'appointment-id',
            status: QueueStatus.WAITING,
            appointment: {
                noShowPrediction: null,
            },
        };

        mockQueueEntryFindFirst.mockResolvedValue({
            patientId: 'patient-id',
            status: QueueStatus.WAITING,
            appointment: {
                scheduledAt,
                status: AppointmentStatus.SCHEDULED,
                arrivedAt: null,
            },
        });
        mockQueueEntryUpdateMany.mockResolvedValue({
            count: 1,
        });
        mockAppointmentUpdateMany.mockResolvedValue({
            count: 1,
        });
        mockQueueEntryFindUniqueOrThrow.mockResolvedValue(queueEntry);

        await expect(
            queueRepository.updateQueueEntryStatus({
                queueEntryId: 'queue-entry-id',
                appointmentId: 'appointment-id',
                clinicId: 'clinic-id',
                expectedQueueStatus: QueueStatus.WAITING,
                expectedAppointmentStatus: AppointmentStatus.SCHEDULED,
                status: QueueStatus.ARRIVED,
                appointmentStatus: AppointmentStatus.ARRIVED,
                timestampUpdates: {},
                eventTimestamp,
            })
        ).resolves.toBe(queueEntry);

        expect(mockEstablishAppointmentArrivalIfNeeded).toHaveBeenCalledWith(
            expect.objectContaining({
                appointmentId: 'appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                scheduledAt,
                targetStatus: AppointmentStatus.ARRIVED,
                arrivalTimestamp: eventTimestamp,
            })
        );
    });

    it('rejects invalid queue lifecycle transitions inside the transaction', async () => {
        mockQueueEntryFindFirst.mockResolvedValue({
            status: QueueStatus.CALLED,
            appointment: {
                status: AppointmentStatus.CALLED,
            },
        });

        await expect(
            queueRepository.updateQueueEntryStatus({
                queueEntryId: 'queue-entry-id',
                appointmentId: 'appointment-id',
                clinicId: 'clinic-id',
                expectedQueueStatus: QueueStatus.CALLED,
                expectedAppointmentStatus: AppointmentStatus.CALLED,
                status: QueueStatus.WAITING,
                appointmentStatus: AppointmentStatus.IN_QUEUE,
                timestampUpdates: {},
                eventTimestamp,
            })
        ).rejects.toThrow('QUEUE_STATUS_TRANSITION_INVALID');

        expect(mockQueueEntryUpdateMany).not.toHaveBeenCalled();
        expect(mockAppointmentUpdateMany).not.toHaveBeenCalled();
    });

    it('keeps appointment lifecycle guards on the final synchronized write', async () => {
        mockQueueEntryFindFirst.mockResolvedValue({
            status: QueueStatus.WAITING,
            appointment: {
                status: AppointmentStatus.IN_QUEUE,
            },
        });
        mockQueueEntryUpdateMany.mockResolvedValue({
            count: 1,
        });
        mockAppointmentUpdateMany.mockResolvedValue({
            count: 0,
        });

        await expect(
            queueRepository.updateQueueEntryStatus({
                queueEntryId: 'queue-entry-id',
                appointmentId: 'appointment-id',
                clinicId: 'clinic-id',
                expectedQueueStatus: QueueStatus.WAITING,
                expectedAppointmentStatus: AppointmentStatus.IN_QUEUE,
                status: QueueStatus.COMPLETED,
                appointmentStatus: AppointmentStatus.COMPLETED,
                timestampUpdates: {},
                eventTimestamp,
            })
        ).rejects.toThrow('APPOINTMENT_STATUS_SYNC_CONFLICT');
    });

    it('rejects stale queue writes instead of reinterpreting the newer queue status', async () => {
        mockQueueEntryFindFirst.mockResolvedValue({
            status: QueueStatus.CALLED,
            appointment: {
                status: AppointmentStatus.CALLED,
            },
        });

        await expect(
            queueRepository.updateQueueEntryStatus({
                queueEntryId: 'queue-entry-id',
                appointmentId: 'appointment-id',
                clinicId: 'clinic-id',
                expectedQueueStatus: QueueStatus.WAITING,
                expectedAppointmentStatus: AppointmentStatus.IN_QUEUE,
                status: QueueStatus.CANCELLED,
                appointmentStatus: AppointmentStatus.CANCELLED,
                timestampUpdates: {},
                eventTimestamp,
            })
        ).rejects.toThrow('QUEUE_STATUS_UPDATE_CONFLICT');

        expect(mockQueueEntryUpdateMany).not.toHaveBeenCalled();
        expect(mockAppointmentUpdateMany).not.toHaveBeenCalled();
    });

    it('does not apply outcome statistics when concurrent requests reach the same target', async () => {
        const queueEntry = {
            id: 'queue-entry-id',
            status: QueueStatus.COMPLETED,
            appointment: {
                noShowPrediction: null,
            },
        };

        mockQueueEntryFindFirst
            .mockResolvedValueOnce({
                patientId: 'patient-id',
                status: QueueStatus.CALLED,
                appointment: {
                    scheduledAt: new Date('2026-09-17T10:00:00.000Z'),
                    status: AppointmentStatus.CALLED,
                    arrivedAt: new Date('2026-09-17T10:02:00.000Z'),
                },
            })
            .mockResolvedValueOnce({
                status: QueueStatus.COMPLETED,
            });
        mockAppointmentUpdateMany.mockResolvedValue({ count: 0 });
        mockAppointmentFindFirst.mockResolvedValue({
            status: AppointmentStatus.COMPLETED,
        });
        mockQueueEntryUpdateMany.mockResolvedValue({ count: 0 });
        mockQueueEntryFindUniqueOrThrow.mockResolvedValue(queueEntry);

        await expect(
            queueRepository.updateQueueEntryStatus({
                queueEntryId: 'queue-entry-id',
                appointmentId: 'appointment-id',
                clinicId: 'clinic-id',
                expectedQueueStatus: QueueStatus.CALLED,
                expectedAppointmentStatus: AppointmentStatus.CALLED,
                status: QueueStatus.COMPLETED,
                appointmentStatus: AppointmentStatus.COMPLETED,
                timestampUpdates: {
                    completedAt: eventTimestamp,
                },
                eventTimestamp,
            })
        ).resolves.toBe(queueEntry);

        expect(mockApplyPatientAppointmentOutcome).not.toHaveBeenCalled();
    });
});
