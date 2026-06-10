import { Prisma } from '../../generated/prisma/client.js';
import { clinicRepository } from './clinic.repository.js';
import type { CreateClinicInput, UpdateClinicInput } from './clinic.types.js';

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
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const conflictError = new Error('Clinic slug already exists');
                conflictError.name = 'CLINIC_SLUG_ALREADY_EXISTS';
                throw conflictError;
            }

            throw error;
        }
    },

    async updateClinic(clinicId: string, input: UpdateClinicInput) {
        const existingClinic = await clinicRepository.findById(clinicId);

        if (!existingClinic) {
            const error = new Error('Clinic not found');
            error.name = 'CLINIC_NOT_FOUND';
            throw error;
        }

        if (input.slug !== undefined && input.slug !== existingClinic.slug) {
            const clinicWithSameSlug = await clinicRepository.findBySlug(input.slug);

            if (clinicWithSameSlug) {
                const error = new Error('Clinic slug already exists');
                error.name = 'CLINIC_SLUG_ALREADY_EXISTS';
                throw error;
            }
        }

        try {
            return await clinicRepository.update(clinicId, input);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const conflictError = new Error('Clinic slug already exists');
                conflictError.name = 'CLINIC_SLUG_ALREADY_EXISTS';
                throw conflictError;
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                const notFoundError = new Error('Clinic not found');
                notFoundError.name = 'CLINIC_NOT_FOUND';
                throw notFoundError;
            }

            throw error;
        }
    },
};
