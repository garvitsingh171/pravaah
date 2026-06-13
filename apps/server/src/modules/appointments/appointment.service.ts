import { AppointmentStatus, Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { appointmentRepository } from './appointment.repository.js';
import type { CreateAppointmentInput } from './appointment.types.js';

const conflictingAppointmentStatuses = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_QUEUE,
    AppointmentStatus.CALLED,
];

async function validateAppointmentClinicOwnership(
    clinicId: string,
    doctorId: string,
    patientId: string
): Promise<void> {
    const clinic = await appointmentRepository.findClinicById(clinicId);

    if (!clinic) {
        throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
    }

    if (!clinic.isActive) {
        throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
    }

    const doctor = await appointmentRepository.findDoctorById(doctorId);

    if (!doctor) {
        throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found');
    }

    const patient = await appointmentRepository.findPatientById(patientId);

    if (!patient) {
        throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
    }

    const doctorClinicLink = await appointmentRepository.findActiveDoctorClinicLink(
        clinicId,
        doctorId
    );

    if (!doctorClinicLink) {
        throw new AppError(
            403,
            'DOCTOR_NOT_LINKED_TO_CLINIC',
            'Doctor is not linked to this clinic'
        );
    }

    const patientClinicLink = await appointmentRepository.findActivePatientClinicLink(
        clinicId,
        patientId
    );

    if (!patientClinicLink) {
        throw new AppError(
            403,
            'PATIENT_NOT_LINKED_TO_CLINIC',
            'Patient is not linked to this clinic'
        );
    }
}

export const appointmentService = {
    async createAppointment(
        clinicId: string,
        createdByUserId: string,
        input: CreateAppointmentInput
    ) {
        await validateAppointmentClinicOwnership(clinicId, input.doctorId, input.patientId);

        const scheduledAt = new Date(input.scheduledAt);

        const existingDoctorAppointment = await appointmentRepository.findDoctorAppointmentAtTime(
            clinicId,
            input.doctorId,
            scheduledAt,
            conflictingAppointmentStatuses
        );

        if (existingDoctorAppointment) {
            throw new AppError(
                409,
                'APPOINTMENT_SLOT_CONFLICT',
                'This doctor already has an appointment in this time slot.'
            );
        }

        return appointmentRepository.create(clinicId, createdByUserId, input);
    },

    async listAppointments(clinicId: string) {
        const clinic = await appointmentRepository.findClinicById(clinicId);

        if (!clinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (!clinic.isActive) {
            throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
        }

        return appointmentRepository.findAppointmentsByClinicId(clinicId);
    },
};
