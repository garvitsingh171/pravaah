import type {
    NoShowPredictionInput,
    NoShowPredictionOutput,
    NoShowPredictionReason,
    NoShowPredictionResponse,
    NoShowRiskLevel,
    StoredNoShowPredictionForResponse,
} from './prediction.types.js';

const MINIMUM_SCORE = 0;
const MAXIMUM_SCORE = 100;

const MEDIUM_RISK_SCORE = 30;
const HIGH_RISK_SCORE = 60;

const SHORT_NOTICE_BOOKING_HOURS = 24;
const LONG_ADVANCE_BOOKING_DAYS = 14;

const getHoursBetween = (from: Date, to: Date): number => {
    return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
};

const clampScore = (score: number): number => {
    return Math.max(MINIMUM_SCORE, Math.min(score, MAXIMUM_SCORE));
};

const getRiskLevel = (score: number): NoShowRiskLevel => {
    if (score >= HIGH_RISK_SCORE) {
        return 'HIGH';
    }

    if (score >= MEDIUM_RISK_SCORE) {
        return 'MEDIUM';
    }

    return 'LOW';
};

export const predictNoShowRisk = (input: NoShowPredictionInput): NoShowPredictionOutput => {
    let score = 0;
    const reasons: NoShowPredictionReason[] = [];

    const hoursUntilAppointment = getHoursBetween(input.bookedAt, input.scheduledAt);

    const patientNoShowCount = input.patientNoShowCount ?? 0;
    const patientCompletedAppointmentCount = input.patientCompletedAppointmentCount ?? 0;
    const totalPastAppointments = patientNoShowCount + patientCompletedAppointmentCount;

    if (patientNoShowCount >= 2) {
        score += 40;

        reasons.push({
            code: 'PREVIOUS_NO_SHOW_HISTORY',
            message: 'Patient has multiple previous no-show appointments.',
            scoreImpact: 40,
        });
    } else if (patientNoShowCount === 1) {
        score += 25;

        reasons.push({
            code: 'PREVIOUS_NO_SHOW_HISTORY',
            message: 'Patient has one previous no-show appointment.',
            scoreImpact: 25,
        });
    }

    if (hoursUntilAppointment <= SHORT_NOTICE_BOOKING_HOURS) {
        score += 20;

        reasons.push({
            code: 'SHORT_NOTICE_BOOKING',
            message: 'Appointment was booked with less than 24 hours notice.',
            scoreImpact: 20,
        });
    }

    if (hoursUntilAppointment >= LONG_ADVANCE_BOOKING_DAYS * 24) {
        score += 15;

        reasons.push({
            code: 'LONG_ADVANCE_BOOKING',
            message: 'Appointment was booked more than 14 days in advance.',
            scoreImpact: 15,
        });
    }

    if (totalPastAppointments === 0) {
        score += 15;

        reasons.push({
            code: 'NEW_PATIENT',
            message: 'Patient has no previous appointment history.',
            scoreImpact: 15,
        });
    }

    if (patientCompletedAppointmentCount >= 3 && patientNoShowCount === 0) {
        score -= 20;

        reasons.push({
            code: 'STRONG_ATTENDANCE_HISTORY',
            message: 'Patient has a strong previous attendance history.',
            scoreImpact: -20,
        });
    }

    const finalScore = clampScore(score);

    return {
        riskLevel: getRiskLevel(finalScore),
        score: finalScore,
        reasons,
    };
};

export function toNoShowPredictionResponse(
    prediction: StoredNoShowPredictionForResponse
): NoShowPredictionResponse;
export function toNoShowPredictionResponse(prediction: null | undefined): null;
export function toNoShowPredictionResponse(
    prediction: StoredNoShowPredictionForResponse | null | undefined
): NoShowPredictionResponse | null;
export function toNoShowPredictionResponse(
    prediction: StoredNoShowPredictionForResponse | null | undefined
): NoShowPredictionResponse | null {
    if (!prediction) {
        return null;
    }

    return {
        id: prediction.id,
        riskLevel: prediction.riskLevel,
        reasons: Array.isArray(prediction.reasons) ? prediction.reasons : [],
        createdAt: prediction.createdAt,
        updatedAt: prediction.updatedAt,
    };
}
