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

const getDateInTimeZone = (date: Date, timeZone: string): string => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${values.year}-${values.month}-${values.day}`;
};

const getScheduledDate = (scheduledAt: Date): string => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(scheduledAt);
};

const appointmentStatusToQueueStatus: Partial<Record<AppointmentStatus, QueueStatus>> = {
    ARRIVED: 'ARRIVED',
    IN_QUEUE: 'WAITING',
    CALLED: 'CALLED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW',
};

const finalAppointmentStatuses: AppointmentStatus[] = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

const appointmentDetailsInclude = {
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
} satisfies Prisma.AppointmentInclude;

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
            include: appointmentDetailsInclude,
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
            const updateResult = await tx.appointment.updateMany({
                where: {
                    id: appointmentId,
                    OR: [
                        {
                            status,
                        },
                        {
                            status: {
                                notIn: finalAppointmentStatuses,
                            },
                        },
                    ],
                },
                data: {
                    status,
                },
            });

            if (updateResult.count === 0) {
                const existingAppointment = await tx.appointment.findUnique({
                    where: {
                        id: appointmentId,
                    },
                    select: {
                        id: true,
                        status: true,
                    },
                });

                if (!existingAppointment) {
                    return {
                        appointment: null,
                        failureReason: 'NOT_FOUND' as const,
                    };
                }

                return {
                    appointment: null,
                    failureReason: 'FINAL_STATUS_CONFLICT' as const,
                };
            }

            if (queueStatus !== undefined) {
                await tx.queueEntry.updateMany({
                    where: {
                        appointmentId,
                    },
                    data: {
                        status: queueStatus,
                    },
                });

                if (queueStatus === 'CALLED') {
                    await tx.queueEntry.updateMany({
                        where: {
                            appointmentId,
                            calledAt: null,
                        },
                        data: {
                            calledAt: new Date(),
                        },
                    });
                }

                if (queueStatus === 'COMPLETED') {
                    await tx.queueEntry.updateMany({
                        where: {
                            appointmentId,
                            completedAt: null,
                        },
                        data: {
                            completedAt: new Date(),
                        },
                    });
                }
            }

            const appointment = await tx.appointment.findUnique({
                where: {
                    id: appointmentId,
                },
                include: appointmentDetailsInclude,
            });

            return {
                appointment,
                failureReason: null,
            };
        });
    },

    createWithQueueEntry(
        clinicId: string,
        createdByUserId: string,
        data: CreateAppointmentInput,
        clinicTimezone: string
    ) {
        const scheduledAt = new Date(data.scheduledAt);
        const queueDate = getDateInTimeZone(scheduledAt, clinicTimezone);

        return prisma.$transaction(async (tx) => {
            const lockKey = `${clinicId}:${data.doctorId}:${queueDate}`;

            await tx.$queryRaw`
            SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
        `;

            const [positionResult] = await tx.$queryRaw<Array<{ maxPosition: number | null }>>`
            SELECT MAX(queue_entry."position")::int AS "maxPosition"
            FROM "queue_entries" AS queue_entry
            INNER JOIN "appointments" AS appointment
                ON appointment."id" = queue_entry."appointmentId"
            WHERE queue_entry."clinicId" = ${clinicId}::uuid
                AND queue_entry."doctorId" = ${data.doctorId}::uuid
                AND (
                    appointment."scheduledAt" AT TIME ZONE ${clinicTimezone}
                )::date = (
                    ${scheduledAt}::timestamptz AT TIME ZONE ${clinicTimezone}
                )::date
        `;

            const nextPosition = (positionResult?.maxPosition ?? 0) + 1;

            const appointment = await tx.appointment.create({
                data: {
                    clinicId,
                    doctorId: data.doctorId,
                    patientId: data.patientId,
                    scheduledAt,
                    durationMinutes: data.durationMinutes,
                    status: AppointmentStatus.SCHEDULED,
                    reason: data.reason ?? null,
                    notes: data.notes ?? null,
                    bookingSource: data.bookingSource,
                    createdByUserId,
                },
            });

            await tx.queueEntry.create({
                data: {
                    clinicId,
                    appointmentId: appointment.id,
                    doctorId: data.doctorId,
                    patientId: data.patientId,
                    position: nextPosition,
                    status: QueueStatus.WAITING,
                },
            });

            return appointment;
        });
    },
};
