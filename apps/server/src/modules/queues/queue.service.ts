import { AppError } from '../../utils/AppError.js';
import { queueRepository } from './queue.repository.js';

export const queueService = {
    calculateNextQueuePosition(highestPosition: number | null): number {
        return (highestPosition ?? 0) + 1;
    },

    async listQueueByClinicDate(clinicId: string, date: string) {
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
