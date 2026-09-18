import { AppointmentStatus, QueueStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { accessService } from '../auth/access.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { toNoShowPredictionResponse } from '../predictions/prediction.service.js';
import type { StoredNoShowPredictionForResponse } from '../predictions/prediction.types.js';
import { isFinalQueueStatus, isQueueStatusTransitionAllowed } from './queue.lifecycle.js';
import { queueRepository } from './queue.repository.js';

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
        const authenticatedUser = accessService.requireClinicStaff(user);
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

        if (queueEntry.status === status) {
            return withQueueNoShowPredictionResponse(queueEntry);
        }

        if (isFinalQueueStatus(queueEntry.status)) {
            throw new AppError(
                409,
                'QUEUE_ENTRY_FINAL_STATUS',
                'Final queue entries cannot be updated'
            );
        }

        if (!isQueueStatusTransitionAllowed(queueEntry.status, status)) {
            throw new AppError(
                409,
                'QUEUE_STATUS_TRANSITION_INVALID',
                `Queue entry cannot transition from ${queueEntry.status} to ${status}.`
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
            const updatedQueueEntry = await queueRepository.updateQueueEntryStatus({
                queueEntryId,
                appointmentId: queueEntry.appointmentId,
                clinicId,
                expectedQueueStatus: queueEntry.status,
                expectedAppointmentStatus: queueEntry.appointment.status,
                status,
                appointmentStatus: queueStatusToAppointmentStatus[status],
                timestampUpdates,
                eventTimestamp: now,
                actorUserId: authenticatedUser.id,
            });

            return withQueueNoShowPredictionResponse(updatedQueueEntry);
        } catch (error) {
            if (error instanceof Error && error.message === 'PATIENT_CLINIC_LINK_NOT_FOUND') {
                throw new AppError(
                    409,
                    'PATIENT_CLINIC_LINK_NOT_FOUND',
                    'Patient-clinic link was not found while updating appointment history.'
                );
            }

            if (error instanceof Error && error.message === 'CLINIC_NOT_FOUND') {
                throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
            }

            if (error instanceof Error && error.message === 'QUEUE_STATUS_TRANSITION_INVALID') {
                throw new AppError(
                    409,
                    'QUEUE_STATUS_TRANSITION_INVALID',
                    `Queue entry cannot transition from ${queueEntry.status} to ${status}.`
                );
            }

            if (
                error instanceof Error &&
                error.message === 'APPOINTMENT_STATUS_TRANSITION_INVALID'
            ) {
                throw new AppError(
                    409,
                    'APPOINTMENT_STATUS_TRANSITION_INVALID',
                    'Requested appointment status transition is not allowed'
                );
            }

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

        if (new Set(queueEntryIds).size !== queueEntryIds.length) {
            throw new AppError(
                400,
                'QUEUE_REORDER_DUPLICATE_ENTRY',
                'Reorder request cannot contain duplicate queue entries'
            );
        }

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
            isFinalQueueStatus(queueEntry.status)
        );

        if (hasFinalQueueEntry) {
            throw new AppError(
                409,
                'QUEUE_ENTRY_FINAL_STATUS',
                'Final queue entries cannot be reordered'
            );
        }

        const requestedDoctorIds = new Set(
            requestedQueueEntries.map((queueEntry) => queueEntry.doctorId)
        );
        const requestedDoctorId = Array.from(requestedDoctorIds)[0];

        if (!requestedDoctorId || requestedDoctorIds.size !== 1) {
            throw new AppError(
                400,
                'QUEUE_SCOPE_MISMATCH',
                'Reorder request must stay within one doctor queue'
            );
        }

        const activeQueueEntries = await queueRepository.findActiveQueueByClinicDoctorDate(
            clinicId,
            requestedDoctorId,
            date,
            clinic.timezone,
            activeQueueStatuses
        );

        if (activeQueueEntries.length !== queueEntryIds.length) {
            throw new AppError(
                400,
                'QUEUE_REORDER_INCOMPLETE',
                'Reorder request must include all active queue entries for the selected doctor and date'
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
                'Reorder request contains queue entries outside the active queue for this doctor and date'
            );
        }

        try {
            const queueEntries = await queueRepository.reorderQueueEntries(
                clinicId,
                requestedDoctorId,
                date,
                clinic.timezone,
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
