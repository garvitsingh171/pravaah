import { prisma } from '../../config/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';

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
};
