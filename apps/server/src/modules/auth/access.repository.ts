import { prisma } from '../../config/prisma.js';

export const accessRepository = {
    findClinicById(clinicId: string) {
        return prisma.clinic.findUnique({
            where: {
                id: clinicId,
            },
            select: {
                id: true,
                isActive: true,
                timezone: true,
            },
        });
    },

    findAppointmentClinicById(appointmentId: string) {
        return prisma.appointment.findUnique({
            where: {
                id: appointmentId,
            },
            select: {
                id: true,
                clinicId: true,
            },
        });
    },
};
