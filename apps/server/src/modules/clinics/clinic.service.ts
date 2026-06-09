import { clinicRepository } from './clinic.repository.js';
import type { CreateClinicInput } from './clinic.types.js';

export const clinicService = {
    async createClinic(input: CreateClinicInput) {
        const existingClinic = await clinicRepository.findBySlug(input.slug);

        if (existingClinic) {
            const error = new Error('Clinic slug already exists');
            error.name = 'CLINIC_SLIG_ALREADY_EXISTS';
            throw error;
        }

        return clinicRepository.create(input);
    },
};
