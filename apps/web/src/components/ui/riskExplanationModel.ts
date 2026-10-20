import type { PredictionGenerationSource, RiskLevel } from '../../types';

export type NormalizedRiskFactor = {
    key: string;
    title: string;
    message: string | null;
    scoreImpact: number | null;
};

const reasonTitles: Record<string, string> = {
    PREVIOUS_NO_SHOW_HISTORY: 'Previous No-Shows',
    LATE_ARRIVAL_HISTORY: 'Late Arrival History',
    LONG_DISTANCE_FROM_CLINIC: 'Travel Distance',
    SHORT_NOTICE_BOOKING: 'Short-Notice Booking',
    LONG_ADVANCE_BOOKING: 'Advance Booking',
    NEW_PATIENT: 'New Patient',
    STRONG_ATTENDANCE_HISTORY: 'Strong Attendance History',
};

export function normalizePredictionReasons(reasons: unknown): NormalizedRiskFactor[] {
    if (!Array.isArray(reasons)) return [];

    return reasons.flatMap((reason, index) => {
        if (typeof reason === 'string' && reason.trim()) {
            return [
                {
                    key: `legacy-${index}`,
                    title: 'Prediction factor',
                    message: reason.trim(),
                    scoreImpact: null,
                },
            ];
        }
        if (typeof reason !== 'object' || reason === null) return [];

        const record = reason as Record<string, unknown>;
        const code =
            typeof record.code === 'string' && record.code.trim() ? record.code.trim() : null;
        const rawTitle =
            typeof record.title === 'string' && record.title.trim() ? record.title.trim() : null;
        const title = rawTitle ?? (code ? (reasonTitles[code] ?? code.replaceAll('_', ' ')) : null);
        const rawMessage =
            typeof record.message === 'string'
                ? record.message.trim()
                : typeof record.description === 'string'
                  ? record.description.trim()
                  : '';
        const scoreImpact =
            typeof record.scoreImpact === 'number' && Number.isFinite(record.scoreImpact)
                ? record.scoreImpact
                : null;

        if (!title && !rawMessage) return [];
        return [
            {
                key: `${code ?? title ?? 'factor'}-${index}`,
                title: title ?? rawMessage,
                message: rawMessage || null,
                scoreImpact,
            },
        ];
    });
}

export function formatScoreImpact(scoreImpact: number | null): {
    value: string;
    direction: string;
} {
    if (scoreImpact === null || !Number.isFinite(scoreImpact)) {
        return { value: 'Impact not available', direction: '' };
    }
    const value = scoreImpact > 0 ? `+${scoreImpact}` : `${scoreImpact}`;
    const direction =
        scoreImpact > 0 ? 'Increases risk' : scoreImpact < 0 ? 'Reduces risk' : 'No score change';
    return { value: `${value} ${Math.abs(scoreImpact) === 1 ? 'point' : 'points'}`, direction };
}

export function formatPredictionDistance(value: unknown): string {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 'Not available';
    return `${Number.isInteger(value) ? value : value.toFixed(1)} km`;
}

export function getRiskDescription(riskLevel: RiskLevel): string {
    const descriptions: Record<RiskLevel, string> = {
        LOW: 'Lower estimated no-show risk based on the current rule-based assessment.',
        MEDIUM: 'Moderate estimated no-show risk based on the current rule-based assessment.',
        HIGH: 'Higher estimated no-show risk based on the current rule-based assessment.',
    };
    return descriptions[riskLevel];
}

export function formatGenerationSource(
    source: PredictionGenerationSource | null | undefined
): string {
    const labels: Record<string, string> = {
        APPOINTMENT_CREATION: 'Appointment Creation',
        APPOINTMENT_RESCHEDULED: 'Appointment Rescheduled',
        PATIENT_HISTORY_CHANGED: 'Patient History Updated',
        TRAVEL_DISTANCE_CHANGED: 'Travel Distance Updated',
        BACKFILL: 'Historical Backfill',
        LEGACY_EXISTING: 'Legacy Prediction',
    };
    if (!source) return 'Not available';
    return labels[source] ?? source;
}

export function normalizeSuggestedActions(actions: unknown): string[] {
    if (!Array.isArray(actions)) return [];
    const seen = new Set<string>();
    return actions.flatMap((action) => {
        if (typeof action !== 'string' || !action.trim() || seen.has(action.trim())) return [];
        seen.add(action.trim());
        return [action.trim()];
    });
}
