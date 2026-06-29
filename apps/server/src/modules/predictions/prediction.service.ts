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

const NO_SHOW_RULE_VERSION = 'starter-rule-v1';
const SHORT_NOTICE_BOOKING_HOURS = 24;
const LONG_ADVANCE_BOOKING_DAYS = 14;
const MODERATE_DISTANCE_KM = 8;
const LONG_DISTANCE_KM = 15;

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

export const getSuggestedNoShowActions = (
    riskLevel: NoShowRiskLevel,
    reasons: NoShowPredictionReason[] | unknown[]
): string[] => {
    const reasonCodes = new Set(
        reasons.reduce<string[]>((codes, reason) => {
            if (
                typeof reason === 'object' &&
                reason !== null &&
                'code' in reason &&
                typeof reason.code === 'string'
            ) {
                codes.push(reason.code);
            }

            return codes;
        }, [])
    );

    const suggestedActions: string[] = [];

    if (riskLevel === 'HIGH') {
        suggestedActions.push('Review this appointment during front-desk preparation.');
        suggestedActions.push('Consider a manual confirmation call before the appointment time.');
        suggestedActions.push(
            'Keep the slot visible so staff can decide what to do if the patient is late.'
        );
    } else if (riskLevel === 'MEDIUM') {
        suggestedActions.push('Consider a manual confirmation if staff have capacity.');
        suggestedActions.push('Check the appointment during normal queue preparation.');
    } else {
        suggestedActions.push('Use the normal reception workflow for this appointment.');
        suggestedActions.push(
            'Keep the appointment in the regular queue plan unless staff decide otherwise.'
        );
    }

    if (reasonCodes.has('PREVIOUS_NO_SHOW_HISTORY')) {
        suggestedActions.push(
            'Review the patient attendance history before choosing any follow-up.'
        );
    }

    if (reasonCodes.has('LATE_ARRIVAL_HISTORY')) {
        suggestedActions.push(
            'Ask staff to watch arrival status and update it manually if needed.'
        );
    }

    if (reasonCodes.has('LONG_DISTANCE_FROM_CLINIC')) {
        suggestedActions.push('If staff speak with the patient, clearly confirm the visit time.');
    }

    if (reasonCodes.has('SHORT_NOTICE_BOOKING')) {
        suggestedActions.push('Confirm that the patient understood the appointment time.');
    }

    if (reasonCodes.has('LONG_ADVANCE_BOOKING')) {
        suggestedActions.push('Consider a closer-to-date manual confirmation if workload allows.');
    }

    if (reasonCodes.has('NEW_PATIENT')) {
        suggestedActions.push('Verify contact details during the normal reception workflow.');
    }

    if (reasonCodes.has('STRONG_ATTENDANCE_HISTORY')) {
        suggestedActions.push('Treat the lower risk as helpful context, not a final decision.');
    }

    return [...new Set(suggestedActions)];
};

export const predictNoShowRisk = (input: NoShowPredictionInput): NoShowPredictionOutput => {
    let score = 0;
    const reasons: NoShowPredictionReason[] = [];

    const hoursUntilAppointment = getHoursBetween(input.bookedAt, input.scheduledAt);

    const patientNoShowCount = input.patientNoShowCount ?? 0;
    const patientLateArrivalCount = input.patientLateArrivalCount ?? 0;
    const patientCompletedAppointmentCount = input.patientCompletedAppointmentCount ?? 0;
    const totalPastAppointments = patientNoShowCount + patientCompletedAppointmentCount;
    const distanceFromClinicKm = input.distanceFromClinicKm ?? null;

    if (patientNoShowCount >= 2) {
        score += 40;

        reasons.push({
            code: 'PREVIOUS_NO_SHOW_HISTORY',
            message: 'This patient has missed two or more past appointments at this clinic.',
            scoreImpact: 40,
        });
    } else if (patientNoShowCount === 1) {
        score += 25;

        reasons.push({
            code: 'PREVIOUS_NO_SHOW_HISTORY',
            message: 'This patient has missed one past appointment at this clinic.',
            scoreImpact: 25,
        });
    }

    if (patientLateArrivalCount >= 2) {
        score += 15;

        reasons.push({
            code: 'LATE_ARRIVAL_HISTORY',
            message: 'This patient has arrived late multiple times before.',
            scoreImpact: 15,
        });
    } else if (patientLateArrivalCount === 1) {
        score += 8;

        reasons.push({
            code: 'LATE_ARRIVAL_HISTORY',
            message: 'This patient has one previous late arrival.',
            scoreImpact: 8,
        });
    }

    if (distanceFromClinicKm !== null && distanceFromClinicKm >= LONG_DISTANCE_KM) {
        score += 15;

        reasons.push({
            code: 'LONG_DISTANCE_FROM_CLINIC',
            message: `The patient is about ${distanceFromClinicKm} km from the clinic.`,
            scoreImpact: 15,
        });
    } else if (distanceFromClinicKm !== null && distanceFromClinicKm >= MODERATE_DISTANCE_KM) {
        score += 8;

        reasons.push({
            code: 'LONG_DISTANCE_FROM_CLINIC',
            message: `The patient is about ${distanceFromClinicKm} km from the clinic.`,
            scoreImpact: 8,
        });
    }

    if (hoursUntilAppointment <= SHORT_NOTICE_BOOKING_HOURS) {
        score += 15;

        reasons.push({
            code: 'SHORT_NOTICE_BOOKING',
            message: 'This appointment was booked less than 24 hours before the visit.',
            scoreImpact: 15,
        });
    }

    if (hoursUntilAppointment >= LONG_ADVANCE_BOOKING_DAYS * 24) {
        score += 10;

        reasons.push({
            code: 'LONG_ADVANCE_BOOKING',
            message: 'This appointment was booked more than 14 days in advance.',
            scoreImpact: 10,
        });
    }

    if (totalPastAppointments === 0) {
        score += 10;

        reasons.push({
            code: 'NEW_PATIENT',
            message: 'This patient has no previous appointment history at this clinic.',
            scoreImpact: 10,
        });
    }

    if (patientCompletedAppointmentCount >= 3 && patientNoShowCount === 0) {
        score -= 20;

        reasons.push({
            code: 'STRONG_ATTENDANCE_HISTORY',
            message: 'This patient has a strong attendance history at this clinic.',
            scoreImpact: -20,
        });
    }

    const finalScore = clampScore(score);
    const riskLevel = getRiskLevel(finalScore);

    return {
        riskLevel,
        score: finalScore,
        reasons,
        suggestedActions: getSuggestedNoShowActions(riskLevel, reasons),
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
        score: prediction.score,
        reasons: Array.isArray(prediction.reasons) ? prediction.reasons : [],
        suggestedActions: getSuggestedNoShowActions(
            prediction.riskLevel,
            Array.isArray(prediction.reasons) ? prediction.reasons : []
        ),
        modelVersion: NO_SHOW_RULE_VERSION,
        generatedAt: prediction.createdAt,
        createdAt: prediction.createdAt,
        updatedAt: prediction.updatedAt,
    };
}
