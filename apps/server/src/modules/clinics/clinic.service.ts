import { AppError } from '../../utils/AppError.js';
import { predictNoShowRisk } from '../predictions/prediction.service.js';
import { clinicRepository } from './clinic.repository.js';
import type { ProvisionSampleDataServiceInput, UpdateClinicInput } from './clinic.types.js';

export const clinicService = {
    async updateClinic(clinicId: string, input: UpdateClinicInput) {
        const existingClinic = await clinicRepository.findById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (input.slug !== undefined && input.slug !== existingClinic.slug) {
            const clinicWithSameSlug = await clinicRepository.findBySlug(input.slug);

            if (clinicWithSameSlug) {
                throw new AppError(409, 'CLINIC_SLUG_ALREADY_EXISTS', 'Clinic slug already exists');
            }
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

        return {
            outcome: result.outcome,
            summary: {
                ...result.summary,
                today: result.today,
            },
        };
    },
};
