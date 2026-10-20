import {
    AppointmentActualOutcome,
    AppointmentActivityType,
    AppointmentOutcomeSource,
    AppointmentStatus,
} from '../../generated/prisma/client.js';

export type AttendanceActivityEvidence = {
    type: AppointmentActivityType;
    occurredAt: Date;
};

export type DerivedAppointmentOutcome = {
    actualOutcome: AppointmentActualOutcome;
    actualNoShow: boolean | null;
    outcomeSource: AppointmentOutcomeSource;
    evidenceAt: Date | null;
    exclusionReason: string | null;
};

/** Resolves an operational appointment state to a conservative training label. */
export function deriveAppointmentOutcome({
    status,
    arrivedAt,
    activities,
    observedAt,
}: {
    status: AppointmentStatus;
    arrivedAt: Date | null;
    activities: AttendanceActivityEvidence[];
    observedAt: Date;
}): DerivedAppointmentOutcome {
    const attendanceActivityTypes = new Set<AppointmentActivityType>([
        AppointmentActivityType.PATIENT_ARRIVED,
        AppointmentActivityType.PATIENT_CALLED,
        AppointmentActivityType.APPOINTMENT_COMPLETED,
    ]);
    const activityEvidence = activities
        .filter((activity) => attendanceActivityTypes.has(activity.type))
        .map((activity) => activity.occurredAt)
        .sort((left, right) => left.getTime() - right.getTime())[0];
    const evidenceAt =
        [arrivedAt, activityEvidence]
            .filter((value): value is Date => value !== null && value !== undefined)
            .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;

    if (status === AppointmentStatus.NO_SHOW) {
        return evidenceAt
            ? {
                  actualOutcome: AppointmentActualOutcome.EXCLUDED,
                  actualNoShow: null,
                  outcomeSource: AppointmentOutcomeSource.CONFLICTING_EVIDENCE,
                  evidenceAt,
                  exclusionReason: 'ATTENDANCE_EVIDENCE_CONFLICTS_WITH_NO_SHOW',
              }
            : {
                  actualOutcome: AppointmentActualOutcome.NO_SHOW,
                  actualNoShow: true,
                  outcomeSource: AppointmentOutcomeSource.NO_SHOW_STATUS,
                  evidenceAt: observedAt,
                  exclusionReason: null,
              };
    }

    // A completed status is authoritative within the lifecycle. Old rows may
    // predate arrival tracking, so use its activity timestamp or observation.
    if (status === AppointmentStatus.COMPLETED && evidenceAt === null) {
        return {
            actualOutcome: AppointmentActualOutcome.ATTENDED,
            actualNoShow: false,
            outcomeSource: AppointmentOutcomeSource.COMPLETED_STATUS,
            evidenceAt: observedAt,
            exclusionReason: null,
        };
    }

    if (evidenceAt) {
        return {
            actualOutcome: AppointmentActualOutcome.ATTENDED,
            actualNoShow: false,
            outcomeSource: AppointmentOutcomeSource.ARRIVAL_EVIDENCE,
            evidenceAt,
            exclusionReason: null,
        };
    }

    if (status === AppointmentStatus.CANCELLED) {
        return {
            actualOutcome: AppointmentActualOutcome.CANCELLED,
            actualNoShow: null,
            outcomeSource: AppointmentOutcomeSource.CANCELLATION_STATUS,
            evidenceAt: observedAt,
            exclusionReason: null,
        };
    }

    return {
        actualOutcome: AppointmentActualOutcome.PENDING,
        actualNoShow: null,
        outcomeSource: AppointmentOutcomeSource.UNRESOLVED,
        evidenceAt: null,
        exclusionReason: null,
    };
}

/**
 * Conservative per-run filter for future dataset preparation. Snapshot data
 * must belong to the current scheduled visit, and generation must precede
 * verified outcome evidence. Legacy snapshots are intentionally excluded.
 */
export function isPredictionEligibleForOutcome({
    prediction,
    outcome,
    currentScheduledAt,
}: {
    prediction: {
        createdAt: Date;
        featureSchemaVersion: string | null;
        featureSnapshot: unknown;
        ruleVersion: string | null;
    };
    outcome: DerivedAppointmentOutcome;
    currentScheduledAt: Date;
}): boolean {
    if (
        outcome.actualNoShow === null ||
        outcome.evidenceAt === null ||
        prediction.featureSchemaVersion === null ||
        prediction.featureSnapshot === null ||
        prediction.ruleVersion === null ||
        prediction.createdAt.getTime() >= currentScheduledAt.getTime() ||
        prediction.createdAt.getTime() >= outcome.evidenceAt.getTime()
    ) {
        return false;
    }

    if (
        typeof prediction.featureSnapshot !== 'object' ||
        prediction.featureSnapshot === null ||
        !('scheduledAt' in prediction.featureSnapshot) ||
        typeof prediction.featureSnapshot.scheduledAt !== 'string'
    ) {
        return false;
    }

    const snapshotSchedule = new Date(prediction.featureSnapshot.scheduledAt);
    return (
        Number.isFinite(snapshotSchedule.getTime()) &&
        snapshotSchedule.getTime() === currentScheduledAt.getTime()
    );
}
