export const DATASET_SCHEMA_VERSION = 'pravaah-ml-dataset-v1';
export const SELECTION_POLICY_VERSION = 'latest-eligible-run-v1';
export const PRIVACY_TRANSFORMATION_VERSION = 'cohort20-distance-rounded-v1';
export const MINIMUM_EXPORT_COHORT = 20;
export const SUPPORTED_FEATURE_SCHEMA = 'no-show-features-v1';

export type DatasetRow = {
    previousNoShows: number;
    previousLateArrivals: number;
    previousCompletedVisits: number;
    distanceFromClinicKm: number | null;
    bookingLeadHours: number;
    appointmentDayOfWeek: number;
    appointmentTimeBucket: 'MORNING' | 'AFTERNOON' | 'EVENING';
    actualNoShow: boolean;
};

export type ExclusionCode =
    | 'NO_VERIFIED_OUTCOME'
    | 'CANCELLED_OUTCOME'
    | 'CONFLICTING_EVIDENCE'
    | 'MISSING_FEATURE_SNAPSHOT'
    | 'UNSUPPORTED_FEATURE_VERSION'
    | 'INVALID_FEATURE_VALUES'
    | 'PREDICTION_AFTER_OUTCOME'
    | 'PREDICTION_AFTER_APPOINTMENT'
    | 'SCHEDULE_MISMATCH'
    | 'NO_ELIGIBLE_PREDICTION'
    | 'PRIVACY_POLICY_EXCLUSION';

export type CandidatePrediction = {
    id: string;
    clinicId: string;
    createdAt: Date;
    featureSchemaVersion: string | null;
    featureSnapshot: unknown;
    ruleVersion: string | null;
};

export type DatasetCandidate = {
    appointmentId: string;
    clinicId: string;
    scheduledAt: Date;
    clinicTimezone: string;
    outcome: {
        clinicId: string;
        actualOutcome: 'PENDING' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED' | 'EXCLUDED';
        actualNoShow: boolean | null;
        outcomeSource: string;
        evidenceAt: Date | null;
    } | null;
    predictions: CandidatePrediction[];
};

export type DatasetQualityReport = {
    datasetSchemaVersion: string;
    sourceFeatureSchemaVersions: string[];
    selectionPolicyVersion: string;
    privacyTransformationVersion: string;
    createdAt: string;
    reportingPeriod: { from: string; to: string };
    outputFormat: 'csv' | 'jsonl';
    candidateAppointments: number;
    eligibleAppointments: number;
    exportedRecords: number;
    verifiedNoShows: number;
    verifiedAttendances: number;
    classDistributionPercent: { noShow: number; attended: number };
    missingValues: Record<keyof DatasetRow, number>;
    excludedAppointments: Partial<Record<ExclusionCode, number>>;
    rejectedPredictionRuns: Partial<Record<ExclusionCode, number>>;
    duplicateRecordsPrevented: number;
    invalidFeatureSnapshots: number;
    unsupportedVersions: number;
    historicalLeakageExclusions: number;
    privacyRelatedExclusions: number;
    minimumCohortSize: number;
    exportSuppressed: boolean;
};
