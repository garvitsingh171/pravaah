import { appointmentRepository } from './appointment.repository.js';
import type { CreateAppointmentInput } from './appointment.types.js';

export const appointmentService = {
    async createAppointment(
        clinicId: string,
        createdByUserId: string,
        input: CreateAppointmentInput
    ) {
        return appointmentRepository.create(clinicId, createdByUserId, input);
    },
};
