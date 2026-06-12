import { AppointmentStatus } from '../../generated/prisma/client.js';
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

export const appointmentService = {
    async createAppointment(
        clinicId: string,
        createdByUserId: string,
        input: CreateAppointmentInput
    ) {
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
};
