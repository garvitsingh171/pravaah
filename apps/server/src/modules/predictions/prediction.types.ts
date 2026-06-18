export type NoShowRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type NoShowPredictionReasonCode =
    | 'PREVIOUS_NO_SHOW_HISTORY'
    | 'SHORT_NOTICE_BOOKING'
    | 'LONG_ADVANCE_BOOKING'
    | 'NEW_PATIENT'
    | 'STRONG_ATTENDANCE_HISTORY';

export type NoShowPredictionInput = {
    scheduledAt: Date;
    bookedAt: Date;
    patientNoShowCount?: number;
    patientCompletedAppointmentCount?: number;
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
};
