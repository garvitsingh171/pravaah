import { AppointmentStatus, QueueStatus, type Prisma } from '../../generated/prisma/client.js';

const unresolvedAppointmentStatuses = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_QUEUE,
    AppointmentStatus.CALLED,
];

const activeQueueStatuses = [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.CALLED];

export type LifecycleImpact = {
    futureAppointments: number;
    activeAppointments: number;
    activeQueueEntries: number;
};

export const lifecycleRepository = {
    async countImpact(
        tx: Prisma.TransactionClient,
        clinicId: string,
        scope: { doctorId?: string; patientId?: string } = {},
        now = new Date()
    ): Promise<LifecycleImpact> {
        const appointmentWhere = {
            clinicId,
            ...scope,
            status: { in: unresolvedAppointmentStatuses },
        };
        const queueWhere = {
            clinicId,
            ...scope,
            status: { in: activeQueueStatuses },
            appointment: { status: { in: unresolvedAppointmentStatuses } },
        };
        const [futureAppointments, activeAppointments, activeQueueEntries] = await Promise.all([
            tx.appointment.count({ where: { ...appointmentWhere, scheduledAt: { gte: now } } }),
            tx.appointment.count({ where: appointmentWhere }),
            tx.queueEntry.count({ where: queueWhere }),
        ]);

        return { futureAppointments, activeAppointments, activeQueueEntries };
    },

    createEvent(
        tx: Prisma.TransactionClient,
        input: {
            clinicId: string;
            actorUserId: string;
            entityType: string;
            entityId: string;
            action: string;
            metadata?: Prisma.InputJsonObject;
        }
    ) {
        return tx.lifecycleEvent.create({ data: input });
    },
};
