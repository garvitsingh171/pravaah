import { AppError } from '../../utils/AppError.js';
import { doctorRepository } from './doctor.repository.js';
import type { CreateDoctorInput, UpdateDoctorInput } from './doctor.types.js';

export const doctorService = {
    async createDoctor(clinicId: string, input: CreateDoctorInput) {
        const existingClinic = await doctorRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        return doctorRepository.createDoctorWithClinicLink(clinicId, input);
    },

    async listDoctorsByClinic(clinicId: string) {
        const existingClinic = await doctorRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const doctorLinks = await doctorRepository.findDoctorLinksByClinicId(clinicId);

        return doctorLinks.map((doctorLink) => ({
            doctorClinicId: doctorLink.id,
            clinicLinkIsActive: doctorLink.isActive,
            ...doctorLink.doctor,
        }));
    },

    async updateDoctor(clinicId: string, doctorId: string, input: UpdateDoctorInput) {
        const existingClinic = await doctorRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const existingDoctor = await doctorRepository.findDoctorById(doctorId);

        if (!existingDoctor) {
            throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found');
        }

        const doctorClinicLink = await doctorRepository.findDoctorClinicLink(clinicId, doctorId);

        if (!doctorClinicLink) {
            throw new AppError(
                404,
                'DOCTOR_NOT_LINKED_TO_CLINIC',
                'Doctor is not linked to this clinic'
            );
        }

        return doctorRepository.updateDoctor(doctorId, input);
    },
};
