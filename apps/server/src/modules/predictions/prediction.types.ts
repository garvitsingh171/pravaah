export type NoShowRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export const NO_SHOW_FEATURE_SCHEMA_VERSION = 'no-show-features-v1';
export const NO_SHOW_RULE_VERSION = 'starter-rule-v1';

export type PredictionGenerationSource = 'APPOINTMENT_CREATION' | 'BACKFILL' | 'LEGACY_EXISTING';

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

export type NoShowFeatureSnapshotV1 = {
    scheduledAt: string;
    bookedAt: string;
    patientNoShowCount: number;
    patientLateArrivalCount: number;
    patientCompletedAppointmentCount: number;
    distanceFromClinicKm: number | null;
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
    featureSchemaVersion?: string;
    featureSnapshot?: NoShowFeatureSnapshotV1;
    ruleVersion?: string;
    generationSource?: PredictionGenerationSource;
    runKey?: string | null;
};

export type NoShowPredictionRun = NoShowPredictionOutput & {
    featureSchemaVersion: typeof NO_SHOW_FEATURE_SCHEMA_VERSION;
    featureSnapshot: NoShowFeatureSnapshotV1;
    ruleVersion: typeof NO_SHOW_RULE_VERSION;
    generationSource: Exclude<PredictionGenerationSource, 'LEGACY_EXISTING'>;
    runKey?: string | null;
};

export type StoredNoShowPredictionForResponse = {
    id: string;
    riskLevel: NoShowRiskLevel;
    score: number;
    reasons: unknown;
    featureSchemaVersion?: string | null;
    featureSnapshot?: unknown;
    ruleVersion?: string | null;
    generationSource?: PredictionGenerationSource;
    createdAt: Date;
    updatedAt: Date;
};

export type NoShowPredictionResponse = {
    id: string;
    riskLevel: NoShowRiskLevel;
    score: number;
    reasons: unknown[];
    suggestedActions: string[];
    ruleVersion: string | null;
    featureSchemaVersion: string | null;
    generationSource: PredictionGenerationSource;
    modelVersion: string | null;
    generatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};
