import { AppointmentStatus, QueueStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { accessService } from '../auth/access.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { toNoShowPredictionResponse } from '../predictions/prediction.service.js';
import type { StoredNoShowPredictionForResponse } from '../predictions/prediction.types.js';
import { queueRepository } from './queue.repository.js';

const finalQueueStatuses: QueueStatus[] = [
    QueueStatus.COMPLETED,
    QueueStatus.CANCELLED,
    QueueStatus.NO_SHOW,
];

const activeQueueStatuses: QueueStatus[] = [
    QueueStatus.ARRIVED,
    QueueStatus.WAITING,
    QueueStatus.CALLED,
];

const queueStatusToAppointmentStatus: Record<QueueStatus, AppointmentStatus> = {
    ARRIVED: AppointmentStatus.ARRIVED,
    WAITING: AppointmentStatus.IN_QUEUE,
    CALLED: AppointmentStatus.CALLED,
    COMPLETED: AppointmentStatus.COMPLETED,
    CANCELLED: AppointmentStatus.CANCELLED,
    NO_SHOW: AppointmentStatus.NO_SHOW,
};

type QueueEntryWithAppointmentPrediction = {
    appointment: {
        noShowPrediction: StoredNoShowPredictionForResponse | null;
    };
};

const withQueueNoShowPredictionResponse = <T extends QueueEntryWithAppointmentPrediction>(
    queueEntry: T
) => {
    const { noShowPrediction, ...appointment } = queueEntry.appointment;

    return {
        ...queueEntry,
        appointment,
        noShowPrediction: toNoShowPredictionResponse(noShowPrediction),
    };
};

export const queueService = {
    calculateNextQueuePosition(highestPosition: number | null): number {
        return (highestPosition ?? 0) + 1;
    },

    async listQueueByClinicDate(
        user: AuthenticatedUser | undefined,
        clinicId: string,
        date: string
    ) {
        const clinic = await accessService.verifyClinicAccess(user, clinicId);

        const queueEntries = await queueRepository.findQueueByClinicDate(
            clinicId,
            date,
            clinic.timezone
        );

        return queueEntries.map(withQueueNoShowPredictionResponse);
    },

    async updateQueueStatus(
        user: AuthenticatedUser | undefined,
        clinicId: string,
        queueEntryId: string,
        status: QueueStatus
    ) {
        await accessService.verifyClinicAccess(user, clinicId);

        const queueEntry = await queueRepository.findQueueEntryById(queueEntryId);

        if (!queueEntry) {
            throw new AppError(404, 'QUEUE_ENTRY_NOT_FOUND', 'Queue entry not found');
        }

        if (queueEntry.clinicId !== clinicId) {
            throw new AppError(
                403,
                'QUEUE_ENTRY_CLINIC_MISMATCH',
                'Queue entry does not belong to this clinic'
            );
        }

        if (finalQueueStatuses.includes(queueEntry.status)) {
            throw new AppError(
                409,
                'QUEUE_ENTRY_FINAL_STATUS',
                'Final queue entries cannot be updated'
            );
        }

        const now = new Date();
        const timestampUpdates: { calledAt?: Date; completedAt?: Date } = {};

        if (status === QueueStatus.CALLED && !queueEntry.calledAt) {
            timestampUpdates.calledAt = now;
        }

        if (status === QueueStatus.COMPLETED && !queueEntry.completedAt) {
            timestampUpdates.completedAt = now;
        }

        try {
            const updatedQueueEntry = await queueRepository.updateQueueEntryStatus(
                queueEntryId,
                queueEntry.appointmentId,
                clinicId,
                status,
                queueStatusToAppointmentStatus[status],
                timestampUpdates
            );

            return withQueueNoShowPredictionResponse(updatedQueueEntry);
        } catch (error) {
            if (
                error instanceof Error &&
                ['QUEUE_STATUS_UPDATE_CONFLICT', 'APPOINTMENT_STATUS_SYNC_CONFLICT'].includes(
                    error.message
                )
            ) {
                throw new AppError(
                    409,
                    'STATUS_SYNC_CONFLICT',
                    'Status changed while updating. Please refresh and try again.'
                );
            }

            throw error;
        }
    },

    async reorderQueue(
        user: AuthenticatedUser | undefined,
        clinicId: string,
        date: string,
        queueEntryIds: string[]
    ) {
        const clinic = await accessService.verifyClinicAccess(user, clinicId);

        const requestedQueueEntries = await queueRepository.findQueueEntriesByIds(queueEntryIds);

        if (requestedQueueEntries.length !== queueEntryIds.length) {
            throw new AppError(
                404,
                'QUEUE_ENTRY_NOT_FOUND',
                'One or more queue entries were not found'
            );
        }

        const hasEntryFromAnotherClinic = requestedQueueEntries.some(
            (queueEntry) => queueEntry.clinicId !== clinicId
        );

        if (hasEntryFromAnotherClinic) {
            throw new AppError(
                403,
                'QUEUE_ENTRY_CLINIC_MISMATCH',
                'One or more queue entries do not belong to this clinic'
            );
        }

        const hasFinalQueueEntry = requestedQueueEntries.some((queueEntry) =>
            finalQueueStatuses.includes(queueEntry.status)
        );

        if (hasFinalQueueEntry) {
            throw new AppError(
                409,
                'QUEUE_ENTRY_FINAL_STATUS',
                'Final queue entries cannot be reordered'
            );
        }

        const activeQueueEntries = await queueRepository.findActiveQueueByClinicDate(
            clinicId,
            date,
            clinic.timezone,
            activeQueueStatuses
        );

        if (activeQueueEntries.length !== queueEntryIds.length) {
            throw new AppError(
                400,
                'QUEUE_REORDER_INCOMPLETE',
                'Reorder request must include all active queue entries for the selected date'
            );
        }

        const activeQueueEntryIds = new Set(activeQueueEntries.map((queueEntry) => queueEntry.id));

        const hasInvalidQueueEntryForDate = queueEntryIds.some(
            (queueEntryId) => !activeQueueEntryIds.has(queueEntryId)
        );

        if (hasInvalidQueueEntryForDate) {
            throw new AppError(
                400,
                'QUEUE_REORDER_INVALID_ENTRIES',
                'Reorder request contains queue entries outside the active queue for this date'
            );
        }

        try {
            const queueEntries = await queueRepository.reorderQueueEntries(
                clinicId,
                queueEntryIds,
                activeQueueStatuses
            );

            return queueEntries.map(withQueueNoShowPredictionResponse);
        } catch (error) {
            if (error instanceof Error && error.message === 'QUEUE_REORDER_CONFLICT') {
                throw new AppError(
                    409,
                    'QUEUE_REORDER_CONFLICT',
                    'Queue changed while reordering. Please refresh and try again.'
                );
            }

            throw error;
        }
    },
};
