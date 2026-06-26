import { prisma } from '../../config/prisma.js';
import { AppointmentStatus, Prisma, RiskLevel } from '../../generated/prisma/client.js';

const noShowPredictionDashboardSelect = {
    id: true,
    riskLevel: true,
    score: true,
    reasons: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.NoShowPredictionSelect;

const appointmentDetailsSelect = {
    id: true,
    patientId: true,
    scheduledAt: true,
    durationMinutes: true,
    status: true,
    bookingSource: true,
    reason: true,
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
    noShowPrediction: {
        select: noShowPredictionDashboardSelect,
    },
} satisfies Prisma.AppointmentSelect;

const activityAppointmentSelect = {
    id: true,
    scheduledAt: true,
    durationMinutes: true,
    status: true,
    bookingSource: true,
    reason: true,
    createdAt: true,
    updatedAt: true,
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
} satisfies Prisma.AppointmentSelect;

const activityQueueSelect = {
    id: true,
    position: true,
    status: true,
    queuedAt: true,
    calledAt: true,
    completedAt: true,
    updatedAt: true,
    appointment: {
        select: {
            id: true,
            scheduledAt: true,
            durationMinutes: true,
            status: true,
            bookingSource: true,
            reason: true,
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
} satisfies Prisma.QueueEntrySelect;

const activeAppointmentStatuses: AppointmentStatus[] = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_QUEUE,
    AppointmentStatus.CALLED,
];

const getClinicDateRange = async (date: string, clinicTimezone: string) => {
    const [dateRange] = await prisma.$queryRaw<Array<{ start: Date; end: Date }>>`
        SELECT
            (${date}::date::timestamp AT TIME ZONE ${clinicTimezone}) AS "start",
            ((${date}::date + 1)::timestamp AT TIME ZONE ${clinicTimezone}) AS "end"
    `;

    return dateRange;
};

export const dashboardRepository = {
    getClinicDateRange,

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

    async countNoShowPredictionsByRiskLevel(
        clinicId: string,
        date: string,
        clinicTimezone: string
    ) {
        const dateRange = await getClinicDateRange(date, clinicTimezone);

        if (!dateRange) {
            return [];
        }

        return prisma.noShowPrediction.groupBy({
            by: ['riskLevel'],
            where: {
                clinicId,
                appointment: {
                    scheduledAt: {
                        gte: dateRange.start,
                        lt: dateRange.end,
                    },
                    status: {
                        in: activeAppointmentStatuses,
                    },
                },
            },
            _count: {
                riskLevel: true,
            },
        });
    },

    async findAppointmentsMissingNoShowPrediction(
        clinicId: string,
        date: string,
        clinicTimezone: string
    ) {
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
                    in: activeAppointmentStatuses,
                },
                noShowPrediction: null,
            },
            select: {
                id: true,
                clinicId: true,
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

    createNoShowPredictions(predictions: Prisma.NoShowPredictionCreateManyInput[]) {
        return prisma.noShowPrediction.createMany({
            data: predictions,
            skipDuplicates: true,
        });
    },

    async findHighRiskAppointmentCandidates(
        clinicId: string,
        date: string,
        clinicTimezone: string
    ) {
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
                    in: activeAppointmentStatuses,
                },
                noShowPrediction: {
                    is: {
                        riskLevel: RiskLevel.HIGH,
                    },
                },
            },
            select: appointmentDetailsSelect,
            orderBy: {
                scheduledAt: 'asc',
            },
        });
    },

    async findAppointmentActivityCandidates(
        clinicId: string,
        dateRange: { start: Date; end: Date }
    ) {
        return prisma.appointment.findMany({
            where: {
                clinicId,
                OR: [
                    {
                        createdAt: {
                            gte: dateRange.start,
                            lt: dateRange.end,
                        },
                    },
                    {
                        updatedAt: {
                            gte: dateRange.start,
                            lt: dateRange.end,
                        },
                    },
                ],
            },
            select: activityAppointmentSelect,
            orderBy: {
                updatedAt: 'desc',
            },
        });
    },

    async findQueueActivityCandidates(clinicId: string, dateRange: { start: Date; end: Date }) {
        return prisma.queueEntry.findMany({
            where: {
                clinicId,
                appointment: {
                    scheduledAt: {
                        gte: dateRange.start,
                        lt: dateRange.end,
                    },
                },
                OR: [
                    {
                        queuedAt: {
                            gte: dateRange.start,
                            lt: dateRange.end,
                        },
                    },
                    {
                        calledAt: {
                            gte: dateRange.start,
                            lt: dateRange.end,
                        },
                    },
                    {
                        completedAt: {
                            gte: dateRange.start,
                            lt: dateRange.end,
                        },
                    },
                    {
                        updatedAt: {
                            gte: dateRange.start,
                            lt: dateRange.end,
                        },
                    },
                ],
            },
            select: activityQueueSelect,
            orderBy: {
                updatedAt: 'desc',
            },
        });
    },
};
