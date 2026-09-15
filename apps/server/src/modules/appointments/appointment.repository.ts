import { prisma } from '../../config/prisma.js';
import {
    AppointmentStatus,
    Prisma,
    QueueStatus,
} from '../../generated/prisma/client.js';
import type {
    NoShowPredictionOutput,
    StoredNoShowPredictionForResponse,
} from '../predictions/prediction.types.js';
import { establishAppointmentArrivalIfNeeded } from './appointment.arrival.repository.js';
import {
    finalAppointmentStatuses,
    getAllowedAppointmentCurrentStatusesForRequest,
    isAppointmentStatusTransitionAllowed,
    reschedulableAppointmentStatuses,
} from './appointment.lifecycle.js';
import type { CreateAppointmentInput, ListAppointmentsQueryInput } from './appointment.types.js';

type PrismaQueryable = typeof prisma | Prisma.TransactionClient;

const getClinicDateRange = async (
    client: PrismaQueryable,
    date: string,
    clinicTimezone: string
) => {
    const [dateRange] = await client.$queryRaw<Array<{ start: Date; end: Date }>>`
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

const finalQueueStatuses: QueueStatus[] = [
    QueueStatus.COMPLETED,
    QueueStatus.CANCELLED,
    QueueStatus.NO_SHOW,
];

const noShowPredictionBookingSelect = {
    id: true,
    riskLevel: true,
    score: true,
    reasons: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.NoShowPredictionSelect;

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
    noShowPrediction: {
        select: noShowPredictionBookingSelect,
    },
} satisfies Prisma.AppointmentInclude;

export const appointmentRepository = {
    findClinicById(clinicId: string, client: PrismaQueryable = prisma) {
        return client.clinic.findUnique({
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
            const dateRange = await getClinicDateRange(prisma, filters.date, clinicTimezone);

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

    findDoctorById(doctorId: string, client: PrismaQueryable = prisma) {
        return client.doctor.findUnique({
            where: {
                id: doctorId,
            },
        });
    },

    findPatientById(patientId: string, client: PrismaQueryable = prisma) {
        return client.patient.findUnique({
            where: {
                id: patientId,
            },
        });
    },

    findActiveDoctorClinicLink(
        clinicId: string,
        doctorId: string,
        client: PrismaQueryable = prisma
    ) {
        return client.doctorClinic.findFirst({
            where: {
                clinicId,
                doctorId,
                isActive: true,
            },
        });
    },

    findActivePatientClinicLink(
        clinicId: string,
        patientId: string,
        client: PrismaQueryable = prisma
    ) {
        return client.patientClinic.findFirst({
            where: {
                clinicId,
                patientId,
                isActive: true,
            },
        });
    },

    findDoctorAvailabilityPeriods(
        doctorClinicId: string,
        client: PrismaQueryable = prisma
    ) {
        return client.doctorAvailabilityPeriod.findMany({
            where: {
                doctorClinicId,
            },
            select: {
                weekday: true,
                startTime: true,
                endTime: true,
            },
            orderBy: [
                {
                    weekday: 'asc',
                },
                {
                    startTime: 'asc',
                },
            ],
        });
    },

    async getClinicLocalAppointmentParts(
        scheduledAt: Date,
        clinicTimezone: string,
        client: PrismaQueryable = prisma
    ) {
        const [parts] = await client.$queryRaw<
            Array<{
                localDate: string;
                localTime: string;
                isoWeekday: number;
                seconds: unknown;
            }>
        >`
            SELECT
                to_char(${scheduledAt}::timestamptz AT TIME ZONE ${clinicTimezone}, 'YYYY-MM-DD') AS "localDate",
                to_char(${scheduledAt}::timestamptz AT TIME ZONE ${clinicTimezone}, 'HH24:MI') AS "localTime",
                EXTRACT(ISODOW FROM ${scheduledAt}::timestamptz AT TIME ZONE ${clinicTimezone})::int AS "isoWeekday",
                EXTRACT(SECOND FROM ${scheduledAt}::timestamptz AT TIME ZONE ${clinicTimezone}) AS "seconds"
        `;

        return parts;
    },

    async getClinicLocalDateWeekday(date: string, client: PrismaQueryable = prisma) {
        const [parts] = await client.$queryRaw<
            Array<{
                localDate: string;
                isoWeekday: number;
            }>
        >`
            SELECT
                to_char(${date}::date, 'YYYY-MM-DD') AS "localDate",
                EXTRACT(ISODOW FROM ${date}::date)::int AS "isoWeekday"
        `;

        return parts ?? null;
    },

    async getClinicLocalDateTimeInstants(
        date: string,
        localTimes: string[],
        clinicTimezone: string
    ) {
        if (localTimes.length === 0) {
            return [];
        }

        const localTimeValues = Prisma.join(localTimes.map((time) => Prisma.sql`(${time})`));

        return prisma.$queryRaw<
            Array<{
                localTime: string;
                instant: Date;
                resolvedLocalDate: string;
                resolvedLocalTime: string;
            }>
        >`
            WITH requested("localTime") AS (
                VALUES ${localTimeValues}
            ),
            converted AS (
                SELECT
                    "localTime"::text AS "localTime",
                    (${date}::date + "localTime"::time) AT TIME ZONE ${clinicTimezone} AS "instant"
                FROM requested
            )
            SELECT
                "localTime",
                "instant",
                to_char("instant" AT TIME ZONE ${clinicTimezone}, 'YYYY-MM-DD') AS "resolvedLocalDate",
                to_char("instant" AT TIME ZONE ${clinicTimezone}, 'HH24:MI') AS "resolvedLocalTime"
            FROM converted
            ORDER BY "localTime"::time
        `;
    },

    async findDoctorSchedulingAppointmentsForDate(
        clinicId: string,
        doctorId: string,
        date: string,
        clinicTimezone: string,
        bufferMinutes: number,
        statuses: AppointmentStatus[],
        excludeAppointmentId?: string,
        client: PrismaQueryable = prisma
    ) {
        const dateRange = await getClinicDateRange(client, date, clinicTimezone);

        if (!dateRange) {
            return [];
        }

        return client.$queryRaw<Array<{ id: string; scheduledAt: Date; durationMinutes: number }>>`
            SELECT "id", "scheduledAt", "durationMinutes"
            FROM "appointments"
            WHERE "clinicId" = ${clinicId}::uuid
              AND "doctorId" = ${doctorId}::uuid
              AND "status"::text IN (${Prisma.join(statuses)})
              AND (${excludeAppointmentId ?? null}::uuid IS NULL OR "id" <> ${excludeAppointmentId ?? null}::uuid)
              AND "scheduledAt" < ${dateRange.end}
              AND "scheduledAt" + (("durationMinutes" + ${bufferMinutes}) * interval '1 minute') > ${dateRange.start}
            ORDER BY "scheduledAt" ASC
        `;
    },

    acquireDoctorScheduleLock(
        tx: Prisma.TransactionClient,
        clinicId: string,
        doctorId: string,
        clinicLocalDate?: string
    ) {
        return tx.$queryRaw`
            SELECT pg_advisory_xact_lock(
                hashtextextended(
                    concat(
                        ${clinicId},
                        ':',
                        ${doctorId},
                        CASE
                            WHEN ${clinicLocalDate ?? null}::text IS NULL THEN ''
                            ELSE concat(':', ${clinicLocalDate ?? null})
                        END
                    ),
                    0
                )
            )
        `;
    },

    findOverlappingDoctorAppointment(
        tx: Prisma.TransactionClient,
        clinicId: string,
        doctorId: string,
        scheduledAt: Date,
        durationMinutes: number,
        bufferMinutes: number,
        statuses: AppointmentStatus[],
        excludeAppointmentId?: string
    ) {
        return tx.$queryRaw<Array<{ id: string }>>`
            SELECT "id"
            FROM "appointments"
            WHERE "clinicId" = ${clinicId}::uuid
              AND "doctorId" = ${doctorId}::uuid
              AND "status"::text IN (${Prisma.join(statuses)})
              AND (${excludeAppointmentId ?? null}::uuid IS NULL OR "id" <> ${excludeAppointmentId ?? null}::uuid)
              AND "scheduledAt" < ${new Date(
                  scheduledAt.getTime() + (durationMinutes + bufferMinutes) * 60_000
              )}
              AND "scheduledAt" + (("durationMinutes" + ${bufferMinutes}) * interval '1 minute') > ${scheduledAt}
            LIMIT 1
        `;
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

    findAppointmentDetailsById(appointmentId: string, clinicId: string) {
        return prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                clinicId,
            },
            include: appointmentDetailsInclude,
        });
    },

    findAppointmentRescheduleState(
        tx: Prisma.TransactionClient,
        appointmentId: string,
        clinicId: string
    ) {
        return tx.appointment.findFirst({
            where: {
                id: appointmentId,
                clinicId,
            },
            select: {
                id: true,
                clinicId: true,
                doctorId: true,
                patientId: true,
                scheduledAt: true,
                durationMinutes: true,
                status: true,
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
    },

    updateAppointmentScheduledAt(
        tx: Prisma.TransactionClient,
        appointmentId: string,
        clinicId: string,
        expectedScheduledAt: Date,
        scheduledAt: Date
    ) {
        return tx.appointment.updateMany({
            where: {
                id: appointmentId,
                clinicId,
                scheduledAt: expectedScheduledAt,
                status: {
                    in: [...reschedulableAppointmentStatuses],
                },
            },
            data: {
                scheduledAt,
            },
        });
    },

    updateQueueEntryPosition(
        tx: Prisma.TransactionClient,
        queueEntryId: string,
        clinicId: string,
        position: number
    ) {
        return tx.queueEntry.updateMany({
            where: {
                id: queueEntryId,
                clinicId,
            },
            data: {
                position,
            },
        });
    },

    updateAppointmentStatus(appointmentId: string, clinicId: string, status: AppointmentStatus) {
        const queueStatus = appointmentStatusToQueueStatus[status];
        const now = new Date();

        return prisma.$transaction(async (tx) => {
            const existingAppointment = await tx.appointment.findFirst({
                where: {
                    id: appointmentId,
                    clinicId,
                },
                select: {
                    id: true,
                    clinicId: true,
                    patientId: true,
                    scheduledAt: true,
                    status: true,
                    arrivedAt: true,
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

            if (!isAppointmentStatusTransitionAllowed(existingAppointment.status, status)) {
                return {
                    appointment: null,
                    failureReason: 'INVALID_STATUS_TRANSITION' as const,
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
                    clinicId,
                    status: {
                        in: getAllowedAppointmentCurrentStatusesForRequest(status),
                    },
                },
                data: {
                    status,
                },
            });

            if (updateResult.count !== 1) {
                return {
                    appointment: null,
                    failureReason: 'STATUS_TRANSITION_CONFLICT' as const,
                };
            }

            if (existingAppointment.arrivedAt === null) {
                await establishAppointmentArrivalIfNeeded({
                    tx,
                    appointmentId,
                    clinicId: existingAppointment.clinicId,
                    patientId: existingAppointment.patientId,
                    scheduledAt: existingAppointment.scheduledAt,
                    targetStatus: status,
                    arrivalTimestamp: now,
                });
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

            const appointment = await tx.appointment.findFirst({
                where: {
                    id: appointmentId,
                    clinicId,
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
    ): Promise<StoredNoShowPredictionForResponse> {
        return tx.noShowPrediction.create({
            data: {
                appointmentId,
                clinicId,
                patientId,
                riskLevel: prediction.riskLevel,
                score: prediction.score,
                reasons: prediction.reasons,
            },
            select: noShowPredictionBookingSelect,
        });
    },
};
