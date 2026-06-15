import { AppError } from '../../utils/AppError.js';
import { queueRepository } from './queue.repository.js';

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
};