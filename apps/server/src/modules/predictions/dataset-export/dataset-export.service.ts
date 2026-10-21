import { evaluateCandidate } from './dataset-export.validation.js';
import { createQualityReport } from './dataset-export.report.js';
import {
    DATASET_SCHEMA_VERSION,
    type DatasetCandidate,
    type DatasetQualityReport,
    type DatasetRow,
    type ExclusionCode,
} from './dataset-export.types.js';
import { datasetRowSchema } from './dataset-export.schema.js';
import { MINIMUM_EXPORT_COHORT } from './dataset-export.types.js';

export function createDatasetAccumulator({
    clinicId,
    from,
    to,
    format,
    createdAt,
    minimumCohortSize,
}: {
    clinicId: string;
    from: Date;
    to: Date;
    format: 'csv' | 'jsonl';
    createdAt?: Date;
    minimumCohortSize?: number;
}) {
    if (
        minimumCohortSize !== undefined &&
        (!Number.isSafeInteger(minimumCohortSize) ||
            minimumCohortSize < MINIMUM_EXPORT_COHORT ||
            minimumCohortSize > 100_000)
    ) {
        throw new Error('INVALID_MINIMUM_COHORT_SIZE');
    }
    const rows: DatasetRow[] = [];
    const excluded: Partial<Record<ExclusionCode, number>> = {};
    const rejectedRuns: Partial<Record<ExclusionCode, number>> = {};
    const seenAppointments = new Set<string>();
    let duplicateRecordsPrevented = 0;
    let candidateAppointments = 0;

    const add = (candidates: DatasetCandidate[]) => {
        candidateAppointments += candidates.length;
        for (const candidate of candidates) {
            // Clinic scope is checked again here so a faulty repository cannot widen the export.
            if (candidate.clinicId !== clinicId) {
                excluded.PRIVACY_POLICY_EXCLUSION = (excluded.PRIVACY_POLICY_EXCLUSION ?? 0) + 1;
                continue;
            }
            if (seenAppointments.has(candidate.appointmentId)) {
                duplicateRecordsPrevented += 1;
                continue;
            }
            seenAppointments.add(candidate.appointmentId);
            const evaluation = evaluateCandidate(candidate);
            for (const code of evaluation.rejectedRuns) {
                rejectedRuns[code] = (rejectedRuns[code] ?? 0) + 1;
            }
            if (evaluation.row) {
                rows.push(datasetRowSchema.parse(evaluation.row));
            } else {
                const reason = evaluation.exclusion ?? 'NO_ELIGIBLE_PREDICTION';
                excluded[reason] = (excluded[reason] ?? 0) + 1;
            }
        }
    };
    const finish = (): { rows: DatasetRow[]; report: DatasetQualityReport } => {
        const report = createQualityReport({
            rows,
            candidateAppointments,
            excluded,
            rejectedRuns,
            from,
            to,
            format,
            ...(createdAt ? { createdAt } : {}),
            duplicateRecordsPrevented,
            ...(minimumCohortSize ? { minimumCohortSize } : {}),
        });
        if (report.exportedRecords !== report.verifiedNoShows + report.verifiedAttendances) {
            throw new Error('DATASET_LABEL_COUNT_MISMATCH');
        }
        if (rows.some((row) => typeof row.actualNoShow !== 'boolean')) {
            throw new Error('DATASET_INVALID_LABEL');
        }
        return {
            rows: report.exportSuppressed ? [] : rows,
            report: { ...report, datasetSchemaVersion: DATASET_SCHEMA_VERSION },
        };
    };
    return { add, finish };
}

export function prepareDataset(options: {
    candidates: DatasetCandidate[];
    clinicId: string;
    from: Date;
    to: Date;
    format: 'csv' | 'jsonl';
    createdAt?: Date;
    minimumCohortSize?: number;
}): { rows: DatasetRow[]; report: DatasetQualityReport } {
    const accumulator = createDatasetAccumulator(options);
    accumulator.add(options.candidates);
    return accumulator.finish();
}
