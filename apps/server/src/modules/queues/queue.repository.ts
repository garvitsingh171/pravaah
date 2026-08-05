import { prisma } from '../../config/prisma.js';
import { AppointmentStatus, Prisma, QueueStatus } from '../../generated/prisma/client.js';

const noShowPredictionQueueSelect = {
    id: true,
    riskLevel: true,
    score: true,
    reasons: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.NoShowPredictionSelect;

const queueEntryDetailsInclude = {
    appointment: {
        select: {
            id: true,
            scheduledAt: true,
            durationMinutes: true,
            status: true,
            bookingSource: true,
            reason: true,
            notes: true,
            noShowPrediction: {
                select: noShowPredictionQueueSelect,
            },
        },
    },
    doctor: {
        select: {
            id: true,
            fullName: true,
            specialization: true,
            qualification: true,
        },
    },
    patient: {
        select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            gender: true,
            age: true,
        },
    },
} satisfies Prisma.QueueEntryInclude;

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

const acquireQueueScopeLock = (
    tx: Prisma.TransactionClient,
    clinicId: string,
    doctorId: string,
    clinicLocalDate: string
) => {
    return tx.$queryRaw`
        SELECT pg_advisory_xact_lock(
            hashtextextended(
                concat(
                    ${clinicId},
                    ':',
                    ${doctorId},
                    ':',
                    ${clinicLocalDate}
                ),
                0
            )
        )
    `;
};

const finalQueueStatuses: QueueStatus[] = [
    QueueStatus.COMPLETED,
    QueueStatus.CANCELLED,
    QueueStatus.NO_SHOW,
];

const finalAppointmentStatuses: AppointmentStatus[] = [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
];

export const queueRepository = {
    async findQueueByClinicDate(clinicId: string, date: string, clinicTimezone: string) {
        const dateRange = await getClinicDateRange(prisma, date, clinicTimezone);

        if (!dateRange) {
            return [];
        }

        return prisma.queueEntry.findMany({
            where: {
                clinicId,
                appointment: {
                    scheduledAt: {
                        gte: dateRange.start,
                        lt: dateRange.end,
                    },
                },
            },
            include: queueEntryDetailsInclude,
            orderBy: [
                {
                    doctorId: 'asc',
                },
                {
                    position: 'asc',
                },
                {
                    appointment: {
                        scheduledAt: 'asc',
                    },
                },
            ],
        });
    },

    async findActiveQueueByClinicDate(
        clinicId: string,
        date: string,
        clinicTimezone: string,
        activeStatuses: QueueStatus[]
    ) {
        const dateRange = await getClinicDateRange(prisma, date, clinicTimezone);

        if (!dateRange) {
            return [];
        }

        return prisma.queueEntry.findMany({
            where: {
                clinicId,
                status: {
                    in: activeStatuses,
                },
                appointment: {
                    scheduledAt: {
                        gte: dateRange.start,
                        lt: dateRange.end,
                    },
                },
            },
            include: queueEntryDetailsInclude,
            orderBy: [
                {
                    position: 'asc',
                },
                {
                    appointment: {
                        scheduledAt: 'asc',
                    },
                },
            ],
        });
    },

    async findActiveQueueByClinicDoctorDate(
        clinicId: string,
        doctorId: string,
        date: string,
        clinicTimezone: string,
        activeStatuses: QueueStatus[]
    ) {
        const dateRange = await getClinicDateRange(prisma, date, clinicTimezone);

        if (!dateRange) {
            return [];
        }

        return prisma.queueEntry.findMany({
            where: {
                clinicId,
                doctorId,
                status: {
                    in: activeStatuses,
                },
                appointment: {
                    scheduledAt: {
                        gte: dateRange.start,
                        lt: dateRange.end,
                    },
                },
            },
            include: queueEntryDetailsInclude,
            orderBy: [
                {
                    position: 'asc',
                },
                {
                    appointment: {
                        scheduledAt: 'asc',
                    },
                },
            ],
        });
    },

    findQueueEntryById(queueEntryId: string) {
        return prisma.queueEntry.findUnique({
            where: {
                id: queueEntryId,
            },
            include: queueEntryDetailsInclude,
        });
    },

    findQueueEntriesByIds(queueEntryIds: string[]) {
        return prisma.queueEntry.findMany({
            where: {
                id: {
                    in: queueEntryIds,
                },
            },
            include: queueEntryDetailsInclude,
        });
    },

    async updateQueueEntryStatus(
        queueEntryId: string,
        appointmentId: string,
        clinicId: string,
        status: QueueStatus,
        appointmentStatus: AppointmentStatus,
        timestampUpdates: { calledAt?: Date; completedAt?: Date }
    ) {
        return prisma.$transaction(async (tx) => {
            const queueUpdateResult = await tx.queueEntry.updateMany({
                where: {
                    id: queueEntryId,
                    clinicId,
                    OR: [
                        {
                            status,
                        },
                        {
                            status: {
                                notIn: finalQueueStatuses,
                            },
                        },
                    ],
                },
                data: {
                    status,
                },
            });

            if (queueUpdateResult.count !== 1) {
                throw new Error('QUEUE_STATUS_UPDATE_CONFLICT');
            }

            if (timestampUpdates.calledAt !== undefined) {
                await tx.queueEntry.updateMany({
                    where: {
                        id: queueEntryId,
                        clinicId,
                        calledAt: null,
                    },
                    data: {
                        calledAt: timestampUpdates.calledAt,
                    },
                });
            }

            if (timestampUpdates.completedAt !== undefined) {
                await tx.queueEntry.updateMany({
                    where: {
                        id: queueEntryId,
                        clinicId,
                        completedAt: null,
                    },
                    data: {
                        completedAt: timestampUpdates.completedAt,
                    },
                });
            }

            const appointmentUpdateResult = await tx.appointment.updateMany({
                where: {
                    id: appointmentId,
                    clinicId,
                    OR: [
                        {
                            status: appointmentStatus,
                        },
                        {
                            status: {
                                notIn: finalAppointmentStatuses,
                            },
                        },
                    ],
                },
                data: {
                    status: appointmentStatus,
                },
            });

            if (appointmentUpdateResult.count !== 1) {
                throw new Error('APPOINTMENT_STATUS_SYNC_CONFLICT');
            }

            return tx.queueEntry.findUniqueOrThrow({
                where: {
                    id: queueEntryId,
                },
                include: queueEntryDetailsInclude,
            });
        });
    },

    async reorderQueueEntries(
        clinicId: string,
        doctorId: string,
        date: string,
        clinicTimezone: string,
        queueEntryIds: string[],
        activeStatuses: QueueStatus[]
    ) {
        return prisma.$transaction(async (tx) => {
            await acquireQueueScopeLock(tx, clinicId, doctorId, date);

            const dateRange = await getClinicDateRange(tx, date, clinicTimezone);

            if (!dateRange) {
                throw new Error('QUEUE_REORDER_CONFLICT');
            }

            const activeQueueEntries = await tx.queueEntry.findMany({
                where: {
                    clinicId,
                    doctorId,
                    status: {
                        in: activeStatuses,
                    },
                    appointment: {
                        scheduledAt: {
                            gte: dateRange.start,
                            lt: dateRange.end,
                        },
                    },
                },
                select: {
                    id: true,
                },
                orderBy: [
                    {
                        position: 'asc',
                    },
                    {
                        appointment: {
                            scheduledAt: 'asc',
                        },
                    },
                ],
            });

            const activeQueueEntryIds = new Set(
                activeQueueEntries.map((queueEntry) => queueEntry.id)
            );
            const requestedQueueEntryIds = new Set(queueEntryIds);

            if (
                activeQueueEntries.length !== queueEntryIds.length ||
                activeQueueEntries.some((queueEntry) => !requestedQueueEntryIds.has(queueEntry.id)) ||
                queueEntryIds.some((queueEntryId) => !activeQueueEntryIds.has(queueEntryId))
            ) {
                throw new Error('QUEUE_REORDER_CONFLICT');
            }

            for (const [index, queueEntryId] of queueEntryIds.entries()) {
                const updatedQueueEntry = await tx.queueEntry.updateMany({
                    where: {
                        id: queueEntryId,
                        clinicId,
                        doctorId,
                        status: {
                            in: activeStatuses,
                        },
                    },
                    data: {
                        position: 1_000_000 + index,
                    },
                });

                if (updatedQueueEntry.count !== 1) {
                    throw new Error('QUEUE_REORDER_CONFLICT');
                }
            }

            for (const [index, queueEntryId] of queueEntryIds.entries()) {
                const updatedQueueEntry = await tx.queueEntry.updateMany({
                    where: {
                        id: queueEntryId,
                        clinicId,
                        doctorId,
                        status: {
                            in: activeStatuses,
                        },
                    },
                    data: {
                        position: index + 1,
                    },
                });

                if (updatedQueueEntry.count !== 1) {
                    throw new Error('QUEUE_REORDER_CONFLICT');
                }
            }

            return tx.queueEntry.findMany({
                where: {
                    id: {
                        in: queueEntryIds,
                    },
                    clinicId,
                    doctorId,
                    status: {
                        in: activeStatuses,
                    },
                },
                include: queueEntryDetailsInclude,
                orderBy: [
                    {
                        position: 'asc',
                    },
                    {
                        appointment: {
                            scheduledAt: 'asc',
                        },
                    },
                ],
            });
        });
    },

    async findHighestQueuePosition(
        tx: Prisma.TransactionClient,
        clinicId: string,
        doctorId: string,
        scheduledAt: Date,
        clinicTimezone: string
    ): Promise<number | null> {
        await tx.$queryRaw`
            SELECT pg_advisory_xact_lock(
                hashtextextended(
                    concat(
                        ${clinicId},
                        ':',
                        ${doctorId},
                        ':',
                        to_char(
                            ${scheduledAt}::timestamptz AT TIME ZONE ${clinicTimezone},
                            'YYYY-MM-DD'
                        )
                    ),
                    0
                )
            )
        `;

        const [result] = await tx.$queryRaw<Array<{ highestPosition: number | null }>>`
            SELECT MAX(queue_entry."position")::int AS "highestPosition"
            FROM "queue_entries" AS queue_entry
            INNER JOIN "appointments" AS appointment
                ON appointment."id" = queue_entry."appointmentId"
            WHERE queue_entry."clinicId" = ${clinicId}::uuid
                AND queue_entry."doctorId" = ${doctorId}::uuid
                AND (
                    appointment."scheduledAt" AT TIME ZONE ${clinicTimezone}
                )::date = (
                    ${scheduledAt}::timestamptz AT TIME ZONE ${clinicTimezone}
                )::date
        `;

        return result?.highestPosition ?? null;
    },

    createQueueEntry(
        tx: Prisma.TransactionClient,
        clinicId: string,
        appointmentId: string,
        doctorId: string,
        patientId: string,
        position: number
    ) {
        return tx.queueEntry.create({
            data: {
                clinicId,
                appointmentId,
                doctorId,
                patientId,
                position,
                status: QueueStatus.WAITING,
            },
        });
    },
};
