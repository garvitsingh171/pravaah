import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatus, QueueStatus } from '../../../generated/prisma/client.js';

const mockTransaction = vi.hoisted(() => vi.fn());
const mockAppointmentUpdateMany = vi.hoisted(() => vi.fn());
const mockQueueEntryFindFirst = vi.hoisted(() => vi.fn());
const mockQueueEntryUpdateMany = vi.hoisted(() => vi.fn());
const mockQueueEntryFindUniqueOrThrow = vi.hoisted(() => vi.fn());

vi.mock('../../../config/prisma.js', () => ({
    prisma: {
        $transaction: mockTransaction,
    },
}));

import { queueRepository } from '../queue.repository.js';

const transactionClient = {
    appointment: {
        updateMany: mockAppointmentUpdateMany,
    },
    queueEntry: {
        findFirst: mockQueueEntryFindFirst,
        updateMany: mockQueueEntryUpdateMany,
        findUniqueOrThrow: mockQueueEntryFindUniqueOrThrow,
    },
};

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
            status: QueueStatus.WAITING,
            appointment: {
                status: AppointmentStatus.SCHEDULED,
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
            })
        ).rejects.toThrow('QUEUE_STATUS_UPDATE_CONFLICT');

        expect(mockQueueEntryUpdateMany).not.toHaveBeenCalled();
        expect(mockAppointmentUpdateMany).not.toHaveBeenCalled();
    });
});
