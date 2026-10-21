import { datasetRowSchema } from './dataset-export.schema.js';
import type { DatasetRow } from './dataset-export.types.js';

export const DATASET_COLUMNS = [
    'previousNoShows',
    'previousLateArrivals',
    'previousCompletedVisits',
    'distanceFromClinicKm',
    'bookingLeadHours',
    'appointmentDayOfWeek',
    'appointmentTimeBucket',
    'actualNoShow',
] as const satisfies readonly (keyof DatasetRow)[];

export function serializeDataset(rows: DatasetRow[], format: 'csv' | 'jsonl'): string {
    const validated = rows.map((row) => datasetRowSchema.parse(row));
    if (format === 'jsonl')
        return (
            validated.map((row) => JSON.stringify(row)).join('\n') + (validated.length ? '\n' : '')
        );
    const encode = (value: unknown) => {
        const normalized =
            typeof value === 'boolean' ? (value ? '1' : '0') : value === null ? '' : String(value);
        return /[",\r\n]/.test(normalized) ? `"${normalized.replaceAll('"', '""')}"` : normalized;
    };
    return (
        [
            DATASET_COLUMNS.join(','),
            ...validated.map((row) => DATASET_COLUMNS.map((key) => encode(row[key])).join(',')),
        ].join('\r\n') + '\r\n'
    );
}
