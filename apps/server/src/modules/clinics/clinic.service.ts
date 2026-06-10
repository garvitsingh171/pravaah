import { AppError } from '../../utils/AppError.js';
import { clinicRepository } from './clinic.repository.js';
import type { CreateClinicInput, UpdateClinicInput } from './clinic.types.js';

export const clinicService = {
    async createClinic(input: CreateClinicInput) {
        const existingClinic = await clinicRepository.findBySlug(input.slug);

        if (existingClinic) {
            throw new AppError(409, 'CLINIC_SLUG_ALREADY_EXISTS', 'Clinic slug already exists');
        }

        return clinicRepository.create(input);
    },

    async updateClinic(clinicId: string, input: UpdateClinicInput) {
        const existingClinic = await clinicRepository.findById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (input.slug !== undefined && input.slug !== existingClinic.slug) {
            const clinicWithSameSlug = await clinicRepository.findBySlug(input.slug);

            if (clinicWithSameSlug) {
                throw new AppError(
                    409,
                    'CLINIC_SLUG_ALREADY_EXISTS',
                    'Clinic slug already exists'
                );
            }
        }

        return clinicRepository.update(clinicId, input);
    },
};