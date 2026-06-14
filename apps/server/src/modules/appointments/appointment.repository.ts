import { prisma } from '../../config/prisma.js';
import { AppointmentStatus, Prisma, QueueStatus } from '../../generated/prisma/client.js';
import type { CreateAppointmentInput, ListAppointmentsQueryInput } from './appointment.types.js';

const getDateRange = (date: string): { gte: Date; lt: Date } => {
    const start = new Date(`${date}T00:00:00.000+05:30`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
        gte: start,
        lt: end,
    };
};

const appointmentStatusToQueueStatus: Partial<Record<AppointmentStatus, QueueStatus>> = {
    ARRIVED: 'ARRIVED',
    IN_QUEUE: 'WAITING',
    CALLED: 'CALLED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW',
};

const getQueueTimestampUpdates = (queueStatus: QueueStatus): Prisma.QueueEntryUpdateInput => {
    const now = new Date();

    if (queueStatus === 'CALLED') {
        return {
            calledAt: now,
        };
    }

    if (queueStatus === 'COMPLETED') {
        return {
            completedAt: now,
        };
    }

    return {};
};

export const appointmentRepository = {
    findClinicById(clinicId: string) {
        return prisma.clinic.findUnique({
            where: {
                id: clinicId,
            },
        });
    },

    findAppointmentsByClinicId(clinicId: string, filters: ListAppointmentsQueryInput) {
        const where: Prisma.AppointmentWhereInput = {
            clinicId,
        };

        if (filters.date !== undefined) {
            where.scheduledAt = getDateRange(filters.date);
        }

        if (filters.doctorId !== undefined) {
            where.doctorId = filters.doctorId;
        }

        if (filters.patientId !== undefined) {
            where.patientId = filters.patientId;
        }

        if (filters.status !== undefined) {
            where.status = filters.status;
        }

        return prisma.appointment.findMany({
            where,
            include: {
                doctor: {
                    select: {
                        id: true,
                        fullName: true,
                        specialization: true,
                        qualification: true,
                        registrationNumber: true,
                        phone: true,
                        email: true,
                        gender: true,
                        experienceYears: true,
                        isActive: true,
                    },
                },
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                        gender: true,
                        dateOfBirth: true,
                        age: true,
                        address: true,
                        city: true,
                        emergencyContactName: true,
                        emergencyContactPhone: true,
                        isActive: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
                queueEntry: {
                    select: {
                        id: true,
                        position: true,
                        status: true,
                        queuedAt: true,
                        calledAt: true,
                        completedAt: true,
                    },
                },
            },
            orderBy: {
                scheduledAt: 'asc',
            },
        });
    },

    findDoctorById(doctorId: string) {
        return prisma.doctor.findUnique({
            where: {
                id: doctorId,
            },
        });
    },

    findPatientById(patientId: string) {
        return prisma.patient.findUnique({
            where: {
                id: patientId,
            },
        });
    },

    findActiveDoctorClinicLink(clinicId: string, doctorId: string) {
        return prisma.doctorClinic.findFirst({
            where: {
                clinicId,
                doctorId,
                isActive: true,
            },
        });
    },

    findActivePatientClinicLink(clinicId: string, patientId: string) {
        return prisma.patientClinic.findFirst({
            where: {
                clinicId,
                patientId,
                isActive: true,
            },
        });
    },

    findDoctorAppointmentAtTime(
        clinicId: string,
        doctorId: string,
        scheduledAt: Date,
        statuses: AppointmentStatus[]
    ) {
        return prisma.appointment.findFirst({
            where: {
                clinicId,
                doctorId,
                scheduledAt,
                status: {
                    in: statuses,
                },
            },
        });
    },

    findAppointmentById(appointmentId: string) {
        return prisma.appointment.findUnique({
            where: {
                id: appointmentId,
            },
            include: {
                queueEntry: true,
            },
        });
    },

    updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
        const queueStatus = appointmentStatusToQueueStatus[status];

        return prisma.$transaction(async (tx) => {
            const updatedAppointment = await tx.appointment.update({
                where: {
                    id: appointmentId,
                },
                data: {
                    status,
                },
                include: {
                    doctor: {
                        select: {
                            id: true,
                            fullName: true,
                            specialization: true,
                            qualification: true,
                            registrationNumber: true,
                            phone: true,
                            email: true,
                            gender: true,
                            experienceYears: true,
                            isActive: true,
                        },
                    },
                    patient: {
                        select: {
                            id: true,
                            fullName: true,
                            phone: true,
                            email: true,
                            gender: true,
                            dateOfBirth: true,
                            age: true,
                            address: true,
                            city: true,
                            emergencyContactName: true,
                            emergencyContactPhone: true,
                            isActive: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                        },
                    },
                    queueEntry: {
                        select: {
                            id: true,
                            position: true,
                            status: true,
                            queuedAt: true,
                            calledAt: true,
                            completedAt: true,
                        },
                    },
                },
            });

            if (queueStatus !== undefined) {
                await tx.queueEntry.updateMany({
                    where: {
                        appointmentId,
                    },
                    data: {
                        status: queueStatus,
                        ...getQueueTimestampUpdates(queueStatus),
                    },
                });
            }

            return updatedAppointment;
        });
    },

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
