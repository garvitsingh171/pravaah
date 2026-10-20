import { type Prisma } from '../../generated/prisma/client.js';
import { deriveAppointmentOutcome } from './appointment-outcome.js';

/** Must be called from the appointment/queue lifecycle transaction. */
export async function synchronizeAppointmentPredictionOutcome({
    tx,
    appointmentId,
    clinicId,
    observedAt,
}: {
    tx: Prisma.TransactionClient;
    appointmentId: string;
    clinicId: string;
    observedAt: Date;
}): Promise<void> {
    const appointment = await tx.appointment.findFirst({
        where: { id: appointmentId, clinicId },
        select: { status: true, arrivedAt: true },
    });
    if (!appointment) throw new Error('APPOINTMENT_NOT_FOUND');

    const activities = await tx.appointmentActivity.findMany({
        where: { appointmentId, clinicId },
        select: { type: true, occurredAt: true },
        orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
    });
    const outcome = deriveAppointmentOutcome({
        status: appointment.status,
        arrivedAt: appointment.arrivedAt,
        activities,
        observedAt,
    });
    const current = await tx.appointmentPredictionOutcome.findUnique({
        where: { appointmentId },
        select: {
            clinicId: true,
            actualOutcome: true,
            actualNoShow: true,
            outcomeSource: true,
            outcomeRecordedAt: true,
            evidenceAt: true,
            exclusionReason: true,
        },
    });
    if (current && current.clinicId !== clinicId) {
        throw new Error('APPOINTMENT_OUTCOME_CLINIC_MISMATCH');
    }
    const isSameNoShowOutcome =
        outcome.actualOutcome === 'NO_SHOW' &&
        current?.actualOutcome === outcome.actualOutcome &&
        current.actualNoShow === outcome.actualNoShow &&
        current.outcomeSource === outcome.outcomeSource &&
        current.exclusionReason === outcome.exclusionReason;
    const stableOutcome = {
        ...outcome,
        evidenceAt:
            isSameNoShowOutcome && current.evidenceAt !== null
                ? current.evidenceAt
                : outcome.evidenceAt,
    };
    const outcomeRecordedAt =
        stableOutcome.actualOutcome === 'PENDING'
            ? null
            : (current?.outcomeRecordedAt ?? observedAt);
    const same =
        current?.clinicId === clinicId &&
        current.actualOutcome === stableOutcome.actualOutcome &&
        current.actualNoShow === stableOutcome.actualNoShow &&
        current.outcomeSource === stableOutcome.outcomeSource &&
        current.outcomeRecordedAt?.getTime() === outcomeRecordedAt?.getTime() &&
        current.evidenceAt?.getTime() === stableOutcome.evidenceAt?.getTime() &&
        current.exclusionReason === stableOutcome.exclusionReason;

    if (same) return;

    await tx.appointmentPredictionOutcome.upsert({
        where: { appointmentId },
        create: {
            appointmentId,
            clinicId,
            ...stableOutcome,
            outcomeRecordedAt,
        },
        update: {
            clinicId,
            ...stableOutcome,
            outcomeRecordedAt,
        },
    });
}
