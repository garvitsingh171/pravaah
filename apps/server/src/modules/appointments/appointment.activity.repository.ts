import {
    AppointmentActivityType,
    type AppointmentStatus,
    type Prisma,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import type { EstablishAppointmentArrivalResult } from './appointment.arrival.repository.js';
import type { AppointmentTerminalReasonContext } from './appointment.terminal-reason.js';
import {
    buildAppointmentCancelledActivityMetadata,
    buildAppointmentNoShowActivityMetadata,
    buildAppointmentStatusActivityMetadata,
    buildPatientArrivedActivityMetadata,
    getAppointmentActivityTypeForStatus,
    type AppointmentActivityMetadata,
} from './appointment.activity.js';

type CreateAppointmentActivityInput = {
    appointmentId: string;
    clinicId: string;
    actorUserId: string | null;
    type: AppointmentActivityType;
    occurredAt: Date;
    metadata: AppointmentActivityMetadata;
};

type RecordAppointmentTransitionActivitiesInput = {
    tx: Prisma.TransactionClient;
    appointmentId: string;
    clinicId: string;
    actorUserId: string;
    previousStatus: AppointmentStatus;
    newStatus: AppointmentStatus;
    eventTimestamp: Date;
    didTransition: boolean;
    arrivalResult: EstablishAppointmentArrivalResult;
    terminalReason: AppointmentTerminalReasonContext;
};

const createAppointmentActivity = (
    tx: Prisma.TransactionClient,
    input: CreateAppointmentActivityInput
) => {
    return tx.appointmentActivity.create({
        data: {
            appointmentId: input.appointmentId,
            clinicId: input.clinicId,
            actorUserId: input.actorUserId,
            type: input.type,
            occurredAt: input.occurredAt,
            metadata: input.metadata as Prisma.InputJsonObject,
        },
    });
};

export const appointmentActivityRepository = {
    createAppointmentActivity,

    findAppointmentActivities(appointmentId: string, clinicId: string) {
        return prisma.appointmentActivity.findMany({
            where: {
                appointmentId,
                clinicId,
            },
            select: {
                id: true,
                type: true,
                occurredAt: true,
                metadata: true,
                createdAt: true,
                actor: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                    },
                },
            },
            orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        });
    },

    async recordAppointmentTransitionActivities({
        tx,
        appointmentId,
        clinicId,
        actorUserId,
        previousStatus,
        newStatus,
        eventTimestamp,
        didTransition,
        arrivalResult,
        terminalReason,
    }: RecordAppointmentTransitionActivitiesInput): Promise<void> {
        if (arrivalResult.wasEstablished && arrivalResult.outcome) {
            await createAppointmentActivity(tx, {
                appointmentId,
                clinicId,
                actorUserId,
                type: AppointmentActivityType.PATIENT_ARRIVED,
                occurredAt: eventTimestamp,
                metadata: buildPatientArrivedActivityMetadata({
                    fromStatus: previousStatus,
                    toStatus: newStatus,
                    outcome: arrivalResult.outcome,
                }),
            });
        }

        if (!didTransition) {
            return;
        }

        const statusActivityType = getAppointmentActivityTypeForStatus(newStatus);

        // PATIENT_ARRIVED is owned exclusively by the guarded first-arrival write above.
        if (
            statusActivityType === null ||
            statusActivityType === AppointmentActivityType.PATIENT_ARRIVED
        ) {
            return;
        }

        let metadata: AppointmentActivityMetadata;

        if (newStatus === 'CANCELLED') {
            if (!terminalReason || !('cancellationReason' in terminalReason)) {
                throw new Error('TERMINAL_REASON_CONTEXT_MISSING');
            }

            metadata = buildAppointmentCancelledActivityMetadata({
                fromStatus: previousStatus,
                toStatus: newStatus,
                cancellationReason: terminalReason.cancellationReason,
                cancellationNote: terminalReason.cancellationNote,
            });
        } else if (newStatus === 'NO_SHOW') {
            if (!terminalReason || !('noShowReason' in terminalReason)) {
                throw new Error('TERMINAL_REASON_CONTEXT_MISSING');
            }

            metadata = buildAppointmentNoShowActivityMetadata({
                fromStatus: previousStatus,
                toStatus: newStatus,
                noShowReason: terminalReason.noShowReason,
                noShowNote: terminalReason.noShowNote,
            });
        } else {
            metadata = buildAppointmentStatusActivityMetadata(previousStatus, newStatus);
        }

        await createAppointmentActivity(tx, {
            appointmentId,
            clinicId,
            actorUserId,
            type: statusActivityType,
            occurredAt: eventTimestamp,
            metadata,
        });
    },
};
