import { isPredictionEligibleForOutcome } from '../appointment-outcome.js';
import { featureSnapshotV1Schema } from './dataset-export.schema.js';
import {
    SUPPORTED_FEATURE_SCHEMA,
    type DatasetCandidate,
    type DatasetRow,
    type ExclusionCode,
} from './dataset-export.types.js';

export type CandidateEvaluation = {
    row: DatasetRow | null;
    rejectedRuns: ExclusionCode[];
    exclusion: ExclusionCode | null;
};

const localDateParts = (date: Date, timezone: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        hour: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    return {
        weekday: parts.find((part) => part.type === 'weekday')?.value,
        hour: Number(parts.find((part) => part.type === 'hour')?.value),
    };
};

export function evaluateCandidate(candidate: DatasetCandidate): CandidateEvaluation {
    const { outcome } = candidate;
    if (!outcome || outcome.actualOutcome === 'PENDING' || outcome.actualNoShow === null) {
        return { row: null, rejectedRuns: [], exclusion: 'NO_VERIFIED_OUTCOME' };
    }
    if (outcome.actualOutcome === 'CANCELLED') {
        return { row: null, rejectedRuns: [], exclusion: 'CANCELLED_OUTCOME' };
    }
    if (outcome.actualOutcome === 'EXCLUDED' || outcome.outcomeSource === 'CONFLICTING_EVIDENCE') {
        return { row: null, rejectedRuns: [], exclusion: 'CONFLICTING_EVIDENCE' };
    }
    if (
        (outcome.actualOutcome === 'ATTENDED' && outcome.actualNoShow !== false) ||
        (outcome.actualOutcome === 'NO_SHOW' && outcome.actualNoShow !== true) ||
        (outcome.actualOutcome === 'ATTENDED' &&
            !['ARRIVAL_EVIDENCE', 'COMPLETED_STATUS'].includes(outcome.outcomeSource)) ||
        (outcome.actualOutcome === 'NO_SHOW' && outcome.outcomeSource !== 'NO_SHOW_STATUS') ||
        !['ATTENDED', 'NO_SHOW'].includes(outcome.actualOutcome)
    ) {
        return { row: null, rejectedRuns: [], exclusion: 'NO_VERIFIED_OUTCOME' };
    }

    const rejectedRuns: ExclusionCode[] = [];
    const eligible = candidate.predictions.flatMap((prediction) => {
        let failure: ExclusionCode | null = null;
        if (prediction.clinicId !== candidate.clinicId || outcome.clinicId !== candidate.clinicId) {
            failure = 'NO_ELIGIBLE_PREDICTION';
        } else if (
            prediction.featureSnapshot === null ||
            prediction.featureSnapshot === undefined
        ) {
            failure = 'MISSING_FEATURE_SNAPSHOT';
        } else if (prediction.featureSchemaVersion !== SUPPORTED_FEATURE_SCHEMA) {
            failure = 'UNSUPPORTED_FEATURE_VERSION';
        } else if (
            !Number.isFinite(prediction.createdAt.getTime()) ||
            !Number.isFinite(candidate.scheduledAt.getTime())
        ) {
            failure = 'INVALID_FEATURE_VALUES';
        } else {
            const parsed = featureSnapshotV1Schema.safeParse(prediction.featureSnapshot);
            if (!parsed.success) failure = 'INVALID_FEATURE_VALUES';
            else if (
                new Date(parsed.data.bookedAt).getTime() > prediction.createdAt.getTime() ||
                new Date(parsed.data.bookedAt).getTime() >
                    new Date(parsed.data.scheduledAt).getTime()
            )
                failure = 'INVALID_FEATURE_VALUES';
            else if (
                !isPredictionEligibleForOutcome({
                    prediction,
                    outcome: {
                        actualOutcome: outcome.actualOutcome,
                        actualNoShow: outcome.actualNoShow,
                        outcomeSource: outcome.outcomeSource as never,
                        evidenceAt: outcome.evidenceAt,
                        exclusionReason: null,
                    },
                    currentScheduledAt: candidate.scheduledAt,
                })
            ) {
                failure =
                    prediction.createdAt >= (outcome.evidenceAt ?? new Date(0))
                        ? 'PREDICTION_AFTER_OUTCOME'
                        : prediction.createdAt >= candidate.scheduledAt
                          ? 'PREDICTION_AFTER_APPOINTMENT'
                          : 'SCHEDULE_MISMATCH';
            }
        }
        if (failure) {
            rejectedRuns.push(failure);
            return [];
        }
        return [prediction];
    });

    eligible.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id)
    );
    const selected = eligible[0];
    if (!selected) {
        const exclusion = rejectedRuns.includes('PREDICTION_AFTER_OUTCOME')
            ? 'PREDICTION_AFTER_OUTCOME'
            : rejectedRuns.includes('PREDICTION_AFTER_APPOINTMENT')
              ? 'PREDICTION_AFTER_APPOINTMENT'
              : rejectedRuns.includes('SCHEDULE_MISMATCH')
                ? 'SCHEDULE_MISMATCH'
                : 'NO_ELIGIBLE_PREDICTION';
        return { row: null, rejectedRuns, exclusion };
    }

    const snapshot = featureSnapshotV1Schema.parse(selected.featureSnapshot);
    const bookedAt = new Date(snapshot.bookedAt);
    const scheduledAt = new Date(snapshot.scheduledAt);
    const bookingLeadHours = (scheduledAt.getTime() - bookedAt.getTime()) / 3_600_000;
    let parts: ReturnType<typeof localDateParts>;
    try {
        parts = localDateParts(scheduledAt, candidate.clinicTimezone);
    } catch {
        return { row: null, rejectedRuns, exclusion: 'INVALID_FEATURE_VALUES' };
    }
    const weekday =
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday ?? '') + 1;
    const appointmentTimeBucket =
        parts.hour < 12 ? 'MORNING' : parts.hour < 17 ? 'AFTERNOON' : 'EVENING';
    const distance = snapshot.distanceFromClinicKm;
    const row: DatasetRow = {
        previousNoShows: snapshot.patientNoShowCount,
        previousLateArrivals: snapshot.patientLateArrivalCount,
        previousCompletedVisits: snapshot.patientCompletedAppointmentCount,
        // Distance is rounded to the nearest kilometre; null remains missing.
        distanceFromClinicKm: distance === null ? null : Math.round(distance),
        bookingLeadHours: Math.round(bookingLeadHours * 100) / 100,
        appointmentDayOfWeek: weekday,
        appointmentTimeBucket,
        actualNoShow: outcome.actualNoShow,
    };
    if (
        !Number.isInteger(weekday) ||
        weekday < 1 ||
        bookingLeadHours < 0 ||
        !Number.isFinite(bookingLeadHours)
    ) {
        return { row: null, rejectedRuns, exclusion: 'INVALID_FEATURE_VALUES' };
    }
    return { row, rejectedRuns, exclusion: null };
}
