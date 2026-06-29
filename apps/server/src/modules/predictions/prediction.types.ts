export type NoShowRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type NoShowPredictionReasonCode =
    | 'PREVIOUS_NO_SHOW_HISTORY'
    | 'LATE_ARRIVAL_HISTORY'
    | 'LONG_DISTANCE_FROM_CLINIC'
    | 'SHORT_NOTICE_BOOKING'
    | 'LONG_ADVANCE_BOOKING'
    | 'NEW_PATIENT'
    | 'STRONG_ATTENDANCE_HISTORY';

export type NoShowPredictionInput = {
    scheduledAt: Date;
    bookedAt: Date;
    patientNoShowCount?: number;
    patientLateArrivalCount?: number;
    patientCompletedAppointmentCount?: number;
    distanceFromClinicKm?: number | null;
};

export type NoShowPredictionReason = {
    code: NoShowPredictionReasonCode;
    message: string;
    scoreImpact: number;
};

export type NoShowPredictionOutput = {
    riskLevel: NoShowRiskLevel;
    score: number;
    reasons: NoShowPredictionReason[];
    suggestedActions: string[];
};

export type StoredNoShowPredictionForResponse = {
    id: string;
    riskLevel: NoShowRiskLevel;
    score: number;
    reasons: unknown;
    createdAt: Date;
    updatedAt: Date;
};

export type NoShowPredictionResponse = {
    id: string;
    riskLevel: NoShowRiskLevel;
    score: number;
    reasons: unknown[];
    suggestedActions: string[];
    modelVersion: string;
    generatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};
