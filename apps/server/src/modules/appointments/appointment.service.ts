import { AppointmentStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { appointmentRepository } from './appointment.repository.js';
import type { CreateAppointmentInput, ListAppointmentsQueryInput } from './appointment.types.js';

const conflictingAppointmentStatuses: AppointmentStatus[] = [
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

    async listAppointments(clinicId: string, filters: ListAppointmentsQueryInput) {
        const clinic = await appointmentRepository.findClinicById(clinicId);

        if (!clinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (!clinic.isActive) {
            throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
        }

        if (filters.doctorId !== undefined) {
            const doctor = await appointmentRepository.findDoctorById(filters.doctorId);

            if (!doctor) {
                throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found');
            }

            const doctorClinicLink = await appointmentRepository.findActiveDoctorClinicLink(
                clinicId,
                filters.doctorId
            );

            if (!doctorClinicLink) {
                throw new AppError(
                    403,
                    'DOCTOR_NOT_LINKED_TO_CLINIC',
                    'Doctor is not linked to this clinic'
                );
            }
        }

        if (filters.patientId !== undefined) {
            const patient = await appointmentRepository.findPatientById(filters.patientId);

            if (!patient) {
                throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
            }

            const patientClinicLink = await appointmentRepository.findActivePatientClinicLink(
                clinicId,
                filters.patientId
            );

            if (!patientClinicLink) {
                throw new AppError(
                    403,
                    'PATIENT_NOT_LINKED_TO_CLINIC',
                    'Patient is not linked to this clinic'
                );
            }
        }

        return appointmentRepository.findAppointmentsByClinicId(clinicId, filters);
    },

    async updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
        const result = await appointmentRepository.updateAppointmentStatus(appointmentId, status);

        if (result.failureReason === 'NOT_FOUND') {
            throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
        }

        if (result.failureReason === 'FINAL_STATUS_CONFLICT') {
            throw new AppError(
                409,
                'APPOINTMENT_STATUS_FINAL',
                'Completed, cancelled, or no-show appointments cannot be changed to another status'
            );
        }

        if (!result.appointment) {
            throw new AppError(
                500,
                'APPOINTMENT_STATUS_UPDATE_FAILED',
                'Appointment status update failed'
            );
        }

        return result.appointment;
    },
};
