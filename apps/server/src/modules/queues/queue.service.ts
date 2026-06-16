import { AppointmentStatus, QueueStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { queueRepository } from './queue.repository.js';

const finalQueueStatuses: QueueStatus[] = [
    QueueStatus.COMPLETED,
    QueueStatus.CANCELLED,
    QueueStatus.NO_SHOW,
];

const queueStatusToAppointmentStatus: Record<QueueStatus, AppointmentStatus> = {
    ARRIVED: AppointmentStatus.ARRIVED,
    WAITING: AppointmentStatus.IN_QUEUE,
    CALLED: AppointmentStatus.CALLED,
    COMPLETED: AppointmentStatus.COMPLETED,
    CANCELLED: AppointmentStatus.CANCELLED,
    NO_SHOW: AppointmentStatus.NO_SHOW,
};

export const queueService = {
    calculateNextQueuePosition(highestPosition: number | null): number {
        return (highestPosition ?? 0) + 1;
    },

    async listQueueByClinicDate(userId: string, clinicId: string, date: string) {
        const user = await queueRepository.findUserById(userId);

        if (!user || user.status !== 'ACTIVE') {
            throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
        }

        if (user.clinicId !== clinicId) {
            throw new AppError(
                403,
                'CLINIC_ACCESS_DENIED',
                'You do not have access to this clinic'
            );
        }

        const clinic = await queueRepository.findClinicById(clinicId);

        if (!clinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (!clinic.isActive) {
            throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
        }

        return queueRepository.findQueueByClinicDate(clinicId, date, clinic.timezone);
    },

    async updateQueueStatus(
        userId: string,
        clinicId: string,
        queueEntryId: string,
        status: QueueStatus
    ) {
        const user = await queueRepository.findUserById(userId);

        if (!user || user.status !== 'ACTIVE') {
            throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
        }

        if (user.clinicId !== clinicId) {
            throw new AppError(
                403,
                'CLINIC_ACCESS_DENIED',
                'You do not have access to this clinic'
            );
        }

        const clinic = await queueRepository.findClinicById(clinicId);

        if (!clinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (!clinic.isActive) {
            throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
        }

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

        return queueRepository.updateQueueEntryStatus(
            queueEntryId,
            queueEntry.appointmentId,
            status,
            queueStatusToAppointmentStatus[status]
        );
    },
};
