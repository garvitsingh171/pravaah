import { Prisma } from '../../generated/prisma/client.js';
import { clinicRepository } from './clinic.repository.js';
import type { CreateClinicInput } from './clinic.types.js';

export const clinicService = {
    async createClinic(input: CreateClinicInput) {
        const existingClinic = await clinicRepository.findBySlug(input.slug);

        if (existingClinic) {
            const error = new Error('Clinic slug already exists');
            error.name = 'CLINIC_SLUG_ALREADY_EXISTS';
            throw error;
        }

        try {
            return await clinicRepository.create(input);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
            ) {
                const conflictError = new Error('Clinic slug already exists');
                conflictError.name = 'CLINIC_SLUG_ALREADY_EXISTS';
                throw conflictError;
            }

            throw error;
        }
    },
};
