import { AppError } from '../../utils/AppError.js';
import { predictNoShowRisk } from '../predictions/prediction.service.js';
import { clinicRepository } from './clinic.repository.js';
import type { ProvisionSampleDataServiceInput, UpdateClinicInput } from './clinic.types.js';

export const clinicService = {
    async getClinicSettings(clinicId: string) {
        const clinic = await clinicRepository.findSettingsById(clinicId);

        if (!clinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        return clinic;
    },

    async updateClinic(clinicId: string, input: UpdateClinicInput) {
        const existingClinic = await clinicRepository.findById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        return clinicRepository.update(clinicId, input);
    },

    async provisionSampleData({ clinicId, user }: ProvisionSampleDataServiceInput) {
        if (!user) {
            throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
        }

        const result = await clinicRepository.provisionSampleData(
            {
                clinicId,
                createdByUserId: user.id,
            },
            predictNoShowRisk
        );

        if (result.outcome === 'CLINIC_NOT_FOUND') {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (result.outcome === 'INVALID_CLINIC_TIMEZONE') {
            throw new AppError(
                422,
                'INVALID_CLINIC_TIMEZONE',
                'Clinic timezone is invalid. Update clinic settings before provisioning sample data.'
            );
        }

        return {
            outcome: result.outcome,
            summary: {
                ...result.summary,
                today: result.today,
            },
        };
    },
};
