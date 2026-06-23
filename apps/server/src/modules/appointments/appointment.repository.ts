import { prisma } from '../../config/prisma.js';
import { AppointmentStatus, Prisma, QueueStatus } from '../../generated/prisma/client.js';
import type {
    NoShowPredictionOutput,
    NoShowPredictionReason,
} from '../predictions/prediction.types.js';
import type {
    AppointmentBookingNoShowPrediction,
    CreateAppointmentInput,
    ListAppointmentsQueryInput,
} from './appointment.types.js';

const getClinicDateRange = async (date: string, clinicTimezone: string) => {
    const [dateRange] = await prisma.$queryRaw<Array<{ start: Date; end: Date }>>`
        SELECT
            (${date}::date::timestamp AT TIME ZONE ${clinicTimezone}) AS "start",
            ((${date}::date + 1)::timestamp AT TIME ZONE ${clinicTimezone}) AS "end"
    `;

    return dateRange;
};

const appointmentStatusToQueueStatus: Partial<Record<AppointmentStatus, QueueStatus>> = {
    ARRIVED: QueueStatus.ARRIVED,
    IN_QUEUE: QueueStatus.WAITING,
    CALLED: QueueStatus.CALLED,
    COMPLETED: QueueStatus.COMPLETED,
    CANCELLED: QueueStatus.CANCELLED,
    NO_SHOW: QueueStatus.NO_SHOW,
};

const finalAppointmentStatuses: AppointmentStatus[] = [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
];

const finalQueueStatuses: QueueStatus[] = [
    QueueStatus.COMPLETED,
    QueueStatus.CANCELLED,
    QueueStatus.NO_SHOW,
];

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

const noShowPredictionBookingSelect = {
    id: true,
    appointmentId: true,
    clinicId: true,
    patientId: true,
    riskLevel: true,
    score: true,
    reasons: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.NoShowPredictionSelect;

export const appointmentRepository = {
    findClinicById(clinicId: string) {
        return prisma.clinic.findUnique({
            where: {
                id: clinicId,
            },
        });
    },

    async findAppointmentsByClinicId(
        clinicId: string,
        filters: ListAppointmentsQueryInput,
        clinicTimezone: string
    ) {
        const where: Prisma.AppointmentWhereInput = {
            clinicId,
        };

        if (filters.date !== undefined) {
            const dateRange = await getClinicDateRange(filters.date, clinicTimezone);

            if (!dateRange) {
                return [];
            }

            where.scheduledAt = {
                gte: dateRange.start,
                lt: dateRange.end,
            };
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

    acquireAppointmentSlotLock(
        tx: Prisma.TransactionClient,
        clinicId: string,
        doctorId: string,
        scheduledAt: Date
    ) {
        return tx.$queryRaw`
            SELECT pg_advisory_xact_lock(
                hashtextextended(
                    concat(
                        ${clinicId},
                        ':',
                        ${doctorId},
                        ':',
                        ${scheduledAt.toISOString()}
                    ),
                    0
                )
            )
        `;
    },

    findDoctorAppointmentAtTime(
        tx: Prisma.TransactionClient,
        clinicId: string,
        doctorId: string,
        scheduledAt: Date,
        statuses: AppointmentStatus[]
    ) {
        return tx.appointment.findFirst({
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

    countPatientAppointmentsByStatus(
        clinicId: string,
        patientId: string,
        statuses: AppointmentStatus[]
    ) {
        return prisma.appointment.count({
            where: {
                clinicId,
                patientId,
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
        const now = new Date();

        return prisma.$transaction(async (tx) => {
            const existingAppointment = await tx.appointment.findUnique({
                where: {
                    id: appointmentId,
                },
                select: {
                    id: true,
                    clinicId: true,
                    status: true,
                    queueEntry: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (!existingAppointment) {
                return {
                    appointment: null,
                    failureReason: 'NOT_FOUND' as const,
                };
            }

            if (
                finalAppointmentStatuses.includes(existingAppointment.status) &&
                existingAppointment.status !== status
            ) {
                return {
                    appointment: null,
                    failureReason: 'FINAL_STATUS_CONFLICT' as const,
                };
            }

            if (queueStatus !== undefined && !existingAppointment.queueEntry) {
                return {
                    appointment: null,
                    failureReason: 'QUEUE_ENTRY_NOT_FOUND' as const,
                };
            }

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

            if (updateResult.count !== 1) {
                return {
                    appointment: null,
                    failureReason: 'FINAL_STATUS_CONFLICT' as const,
                };
            }

            if (queueStatus !== undefined) {
                const queueUpdateResult = await tx.queueEntry.updateMany({
                    where: {
                        appointmentId,
                        clinicId: existingAppointment.clinicId,
                        OR: [
                            {
                                status: queueStatus,
                            },
                            {
                                status: {
                                    notIn: finalQueueStatuses,
                                },
                            },
                        ],
                    },
                    data: {
                        status: queueStatus,
                    },
                });

                if (queueUpdateResult.count !== 1) {
                    throw new Error('QUEUE_STATUS_SYNC_CONFLICT');
                }

                if (queueStatus === QueueStatus.CALLED) {
                    await tx.queueEntry.updateMany({
                        where: {
                            appointmentId,
                            clinicId: existingAppointment.clinicId,
                            calledAt: null,
                        },
                        data: {
                            calledAt: now,
                        },
                    });
                }

                if (queueStatus === QueueStatus.COMPLETED) {
                    await tx.queueEntry.updateMany({
                        where: {
                            appointmentId,
                            clinicId: existingAppointment.clinicId,
                            completedAt: null,
                        },
                        data: {
                            completedAt: now,
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

    runInTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
        return prisma.$transaction(operation);
    },

    createAppointment(
        tx: Prisma.TransactionClient,
        clinicId: string,
        createdByUserId: string,
        data: CreateAppointmentInput
    ) {
        return tx.appointment.create({
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

    createNoShowPrediction(
        tx: Prisma.TransactionClient,
        clinicId: string,
        appointmentId: string,
        patientId: string,
        prediction: NoShowPredictionOutput
    ): Promise<AppointmentBookingNoShowPrediction> {
        return tx.noShowPrediction
            .create({
                data: {
                    appointmentId,
                    clinicId,
                    patientId,
                    riskLevel: prediction.riskLevel,
                    score: prediction.score,
                    reasons: prediction.reasons,
                },
                select: noShowPredictionBookingSelect,
            })
            .then((storedPrediction) => ({
                ...storedPrediction,
                reasons: storedPrediction.reasons as NoShowPredictionReason[],
            }));
    },
};
