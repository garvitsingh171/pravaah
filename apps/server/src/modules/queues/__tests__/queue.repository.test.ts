import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatus, QueueStatus } from '../../../generated/prisma/client.js';

const mockTransaction = vi.hoisted(() => vi.fn());
const mockAppointmentFindFirst = vi.hoisted(() => vi.fn());
const mockAppointmentUpdateMany = vi.hoisted(() => vi.fn());
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
        findFirst: mockAppointmentFindFirst,
        updateMany: mockAppointmentUpdateMany,
    },
    queueEntry: {
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
        mockAppointmentFindFirst.mockResolvedValue({
            status: AppointmentStatus.SCHEDULED,
        });

        await expect(
            queueRepository.updateQueueEntryStatus(
                'queue-entry-id',
                'appointment-id',
                'clinic-id',
                QueueStatus.COMPLETED,
                AppointmentStatus.COMPLETED,
                {}
            )
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

        mockAppointmentFindFirst.mockResolvedValue({
            status: AppointmentStatus.SCHEDULED,
        });
        mockQueueEntryUpdateMany.mockResolvedValue({
            count: 1,
        });
        mockAppointmentUpdateMany.mockResolvedValue({
            count: 1,
        });
        mockQueueEntryFindUniqueOrThrow.mockResolvedValue(queueEntry);

        const result = await queueRepository.updateQueueEntryStatus(
            'queue-entry-id',
            'appointment-id',
            'clinic-id',
            QueueStatus.NO_SHOW,
            AppointmentStatus.NO_SHOW,
            {}
        );

        expect(mockQueueEntryUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
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
                    status: {
                        in: [
                            AppointmentStatus.SCHEDULED,
                            AppointmentStatus.CONFIRMED,
                            AppointmentStatus.ARRIVED,
                            AppointmentStatus.IN_QUEUE,
                            AppointmentStatus.CALLED,
                            AppointmentStatus.NO_SHOW,
                        ],
                    },
                }),
                data: {
                    status: AppointmentStatus.NO_SHOW,
                },
            })
        );
        expect(result).toBe(queueEntry);
    });

    it('keeps appointment lifecycle guards on the final synchronized write', async () => {
        mockAppointmentFindFirst.mockResolvedValue({
            status: AppointmentStatus.IN_QUEUE,
        });
        mockQueueEntryUpdateMany.mockResolvedValue({
            count: 1,
        });
        mockAppointmentUpdateMany.mockResolvedValue({
            count: 0,
        });

        await expect(
            queueRepository.updateQueueEntryStatus(
                'queue-entry-id',
                'appointment-id',
                'clinic-id',
                QueueStatus.COMPLETED,
                AppointmentStatus.COMPLETED,
                {}
            )
        ).rejects.toThrow('APPOINTMENT_STATUS_SYNC_CONFLICT');
    });
});
