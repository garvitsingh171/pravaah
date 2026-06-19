import { prisma } from '../../config/prisma.js';
import { AppointmentStatus } from '../../generated/prisma/client.js';

const getClinicDateRange = async (date: string, clinicTimezone: string) => {
    const [dateRange] = await prisma.$queryRaw<Array<{ start: Date; end: Date }>>`
        SELECT
            (${date}::date::timestamp AT TIME ZONE ${clinicTimezone}) AS "start",
            ((${date}::date + 1)::timestamp AT TIME ZONE ${clinicTimezone}) AS "end"
    `;

    return dateRange;
};

export const dashboardRepository = {
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

    findClinicById(clinicId: string) {
        return prisma.clinic.findUnique({
            where: {
                id: clinicId,
            },
        });
    },

    async countAppointmentsByStatus(clinicId: string, date: string, clinicTimezone: string) {
        const dateRange = await getClinicDateRange(date, clinicTimezone);

        if (!dateRange) {
            return [];
        }

        return prisma.appointment.groupBy({
            by: ['status'],
            where: {
                clinicId,
                scheduledAt: {
                    gte: dateRange.start,
                    lt: dateRange.end,
                },
            },
            _count: {
                status: true,
            },
        });
    },

    async countQueueEntriesByStatus(clinicId: string, date: string, clinicTimezone: string) {
        const dateRange = await getClinicDateRange(date, clinicTimezone);

        if (!dateRange) {
            return [];
        }

        return prisma.queueEntry.groupBy({
            by: ['status'],
            where: {
                clinicId,
                appointment: {
                    scheduledAt: {
                        gte: dateRange.start,
                        lt: dateRange.end,
                    },
                },
            },
            _count: {
                status: true,
            },
        });
    },

    async findAppointmentsForRiskSummary(clinicId: string, date: string, clinicTimezone: string) {
        const dateRange = await getClinicDateRange(date, clinicTimezone);

        if (!dateRange) {
            return [];
        }

        return prisma.appointment.findMany({
            where: {
                clinicId,
                scheduledAt: {
                    gte: dateRange.start,
                    lt: dateRange.end,
                },
                status: {
                    in: [
                        AppointmentStatus.SCHEDULED,
                        AppointmentStatus.CONFIRMED,
                        AppointmentStatus.ARRIVED,
                        AppointmentStatus.IN_QUEUE,
                        AppointmentStatus.CALLED,
                    ],
                },
            },
            select: {
                patientId: true,
                scheduledAt: true,
                createdAt: true,
            },
        });
    },

    countPatientAppointmentsByStatuses(
        clinicId: string,
        patientIds: string[],
        statuses: AppointmentStatus[]
    ) {
        return prisma.appointment.groupBy({
            by: ['patientId', 'status'],
            where: {
                clinicId,
                patientId: {
                    in: patientIds,
                },
                status: {
                    in: statuses,
                },
            },
            _count: {
                status: true,
            },
        });
    },
};
