import { prisma } from '../../config/prisma.js';
import { AppointmentStatus, Prisma, QueueStatus } from '../../generated/prisma/client.js';

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

export const queueRepository = {
    findClinicById(clinicId: string) {
        return prisma.clinic.findUnique({
            where: {
                id: clinicId,
            },
        });
    },

    findUserById(userId: string) {
        return prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                clinicId: true,
                status: true,
            },
        });
    },

    async findQueueByClinicDate(clinicId: string, date: string, clinicTimezone: string) {
        const [dateRange] = await prisma.$queryRaw<Array<{ start: Date; end: Date }>>`
            SELECT
                (${date}::date::timestamp AT TIME ZONE ${clinicTimezone}) AS "start",
                ((${date}::date + 1)::timestamp AT TIME ZONE ${clinicTimezone}) AS "end"
        `;

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

    updateQueueEntryStatus(
        queueEntryId: string,
        appointmentId: string,
        status: QueueStatus,
        appointmentStatus: AppointmentStatus
    ) {
        const now = new Date();

        const queueUpdateData: Prisma.QueueEntryUpdateInput = {
            status,
        };

        const appointmentUpdateData: Prisma.AppointmentUpdateInput = {
            status: appointmentStatus,
        };

        if (status === QueueStatus.CALLED) {
            queueUpdateData.calledAt = now;
        }

        if (status === QueueStatus.COMPLETED) {
            queueUpdateData.completedAt = now;
        }

        return prisma.$transaction(async (tx) => {
            await tx.appointment.update({
                where: {
                    id: appointmentId,
                },
                data: appointmentUpdateData,
            });

            return tx.queueEntry.update({
                where: {
                    id: queueEntryId,
                },
                data: queueUpdateData,
                include: queueEntryDetailsInclude,
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
