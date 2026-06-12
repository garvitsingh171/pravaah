import { AppError } from '../../utils/AppError.js';
import { patientRepository } from './patient.repository.js';
import type { CreatePatientInput, UpdatePatientInput } from './patient.types.js';

export const patientService = {
    async createPatient(clinicId: string, input: CreatePatientInput) {
        const existingClinic = await patientRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        return patientRepository.createPatientWithClinicLink(clinicId, input);
    },

    async updatePatient(clinicId: string, patientId: string, input: UpdatePatientInput) {
        const existingClinic = await patientRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const existingPatient = await patientRepository.findPatientById(patientId);

        if (!existingPatient) {
            throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
        }

        const patientClinicLink = await patientRepository.findPatientClinicLink(
            patientId,
            clinicId
        );

        if (!patientClinicLink) {
            throw new AppError(
                403,
                'PATIENT_NOT_LINKED_TO_CLINIC',
                'Patient is not linked to this clinic'
            );
        }

        return patientRepository.updatePatientWithClinicDetails(clinicId, patientId, input);
    },
};
