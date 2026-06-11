import { AppError } from '../../utils/AppError.js';
import { patientRepository } from './patient.repository.js';
import type { CreatePatientInput } from './patient.types.js';

export const patientService = {
    async createPatient(clinicId: string, input: CreatePatientInput) {
        const existingClinic = await patientRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        return patientRepository.createPatientWithClinicLink(clinicId, input);
    },
};
