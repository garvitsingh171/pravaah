import { prisma } from '../../config/prisma.js';
import { AppointmentStatus } from '../../generated/prisma/client.js';
import type { CreateAppointmentInput } from './appointment.types.js';

export const appointmentRepository = {
    create(clinicId: string, createdByUserId: string, data: CreateAppointmentInput) {
        return prisma.appointment.create({
            data: {
                clinicId,
                doctorId: data.doctorId,
                patientId: data.patientId,
                scheduledAt: new Date(data.scheduledAt),
                durationMinutes: data.durationMinutes,
                status: AppointmentStatus.SCHEDULED,
                reason: data.reason ?? null,
                notes: data.notes ?? null,
                bookingSource: data.bookingSource,
                createdByUserId,
            },
        });
    },
};
