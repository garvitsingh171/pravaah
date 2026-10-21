import {
    DATASET_SCHEMA_VERSION,
    MINIMUM_EXPORT_COHORT,
    PRIVACY_TRANSFORMATION_VERSION,
    SELECTION_POLICY_VERSION,
    type DatasetQualityReport,
    type DatasetRow,
    type ExclusionCode,
} from './dataset-export.types.js';

export function createQualityReport({
    rows,
    candidateAppointments,
    excluded,
    rejectedRuns,
    from,
    to,
    format,
    createdAt = new Date(),
    duplicateRecordsPrevented = 0,
    minimumCohortSize = MINIMUM_EXPORT_COHORT,
}: {
    rows: DatasetRow[];
    candidateAppointments: number;
    excluded: Partial<Record<ExclusionCode, number>>;
    rejectedRuns: Partial<Record<ExclusionCode, number>>;
    from: Date;
    to: Date;
    format: 'csv' | 'jsonl';
    createdAt?: Date;
    duplicateRecordsPrevented?: number;
    minimumCohortSize?: number;
}): DatasetQualityReport {
    const suppressed = rows.length < minimumCohortSize;
    const noShows = suppressed ? 0 : rows.filter((row) => row.actualNoShow).length;
    const attended = suppressed ? 0 : rows.length - noShows;
    const exportedRecords = suppressed ? 0 : rows.length;
    const missingValues = Object.fromEntries(
        [
            'previousNoShows',
            'previousLateArrivals',
            'previousCompletedVisits',
            'distanceFromClinicKm',
            'bookingLeadHours',
            'appointmentDayOfWeek',
            'appointmentTimeBucket',
            'actualNoShow',
        ].map((key) => [
            key,
            suppressed
                ? 0
                : rows.filter(
                      (row) =>
                          row[key as keyof DatasetRow] === null ||
                          row[key as keyof DatasetRow] === undefined
                  ).length,
        ])
    ) as DatasetQualityReport['missingValues'];
    return {
        datasetSchemaVersion: DATASET_SCHEMA_VERSION,
        sourceFeatureSchemaVersions: ['no-show-features-v1'],
        selectionPolicyVersion: SELECTION_POLICY_VERSION,
        privacyTransformationVersion: PRIVACY_TRANSFORMATION_VERSION,
        createdAt: createdAt.toISOString(),
        reportingPeriod: { from: from.toISOString(), to: to.toISOString() },
        outputFormat: format,
        candidateAppointments,
        eligibleAppointments: rows.length,
        exportedRecords,
        verifiedNoShows: noShows,
        verifiedAttendances: attended,
        classDistributionPercent: {
            noShow: rows.length ? Math.round((noShows / rows.length) * 10_000) / 100 : 0,
            attended: rows.length ? Math.round((attended / rows.length) * 10_000) / 100 : 0,
        },
        missingValues,
        excludedAppointments: excluded,
        rejectedPredictionRuns: rejectedRuns,
        duplicateRecordsPrevented,
        invalidFeatureSnapshots: rejectedRuns.INVALID_FEATURE_VALUES ?? 0,
        unsupportedVersions: rejectedRuns.UNSUPPORTED_FEATURE_VERSION ?? 0,
        historicalLeakageExclusions:
            (rejectedRuns.PREDICTION_AFTER_OUTCOME ?? 0) +
            (rejectedRuns.PREDICTION_AFTER_APPOINTMENT ?? 0),
        privacyRelatedExclusions: suppressed ? rows.length : 0,
        minimumCohortSize,
        exportSuppressed: suppressed,
    };
}
