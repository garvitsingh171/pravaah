import { describe, expect, it } from 'vitest';
import { prepareDataset } from '../dataset-export.service.js';
import { serializeDataset } from '../dataset-export.serializer.js';
import type { DatasetCandidate } from '../dataset-export.types.js';

const clinicId = '10000000-0000-4000-8000-000000000001';
const at = (value: string) => new Date(value);
const prediction = (id: string, createdAt: string, overrides: Record<string, unknown> = {}) => ({
    id,
    clinicId,
    createdAt: at(createdAt),
    featureSchemaVersion: 'no-show-features-v1',
    ruleVersion: 'starter-rule-v1',
    featureSnapshot: {
        scheduledAt: '2025-03-10T09:00:00.000Z',
        bookedAt: '2025-03-08T21:00:00.000Z',
        patientNoShowCount: 1,
        patientLateArrivalCount: 2,
        patientCompletedAppointmentCount: 4,
        distanceFromClinicKm: 8.5,
        ...overrides,
    },
});
const candidate = (overrides: Partial<DatasetCandidate> = {}): DatasetCandidate => ({
    appointmentId: '20000000-0000-4000-8000-000000000001',
    clinicId,
    scheduledAt: at('2025-03-10T09:00:00.000Z'),
    clinicTimezone: 'Asia/Kolkata',
    outcome: {
        clinicId,
        actualOutcome: 'ATTENDED',
        actualNoShow: false,
        outcomeSource: 'COMPLETED_STATUS',
        evidenceAt: at('2025-03-10T10:00:00.000Z'),
    },
    predictions: [prediction('30000000-0000-4000-8000-000000000001', '2025-03-09T09:00:00.000Z')],
    ...overrides,
});
const prepare = (candidates: DatasetCandidate[]) =>
    prepareDataset({
        candidates,
        clinicId,
        from: at('2025-01-01T00:00:00.000Z'),
        to: at('2026-01-01T00:00:00.000Z'),
        format: 'csv',
        createdAt: at('2026-01-01T00:00:00.000Z'),
    });

describe('privacy-safe dataset preparation', () => {
    it('uses authoritative labels and snapshot-derived features with local timezone and rounded distance', () => {
        const source = candidate({
            outcome: {
                ...candidate().outcome!,
                actualOutcome: 'NO_SHOW',
                actualNoShow: true,
                outcomeSource: 'NO_SHOW_STATUS',
            },
        });
        const { rows } = prepare(
            Array.from({ length: 20 }, (_, i) => ({ ...source, appointmentId: `a-${i}` }))
        );
        expect(rows[0]).toEqual({
            previousNoShows: 1,
            previousLateArrivals: 2,
            previousCompletedVisits: 4,
            distanceFromClinicKm: 9,
            bookingLeadHours: 36,
            appointmentDayOfWeek: 1,
            appointmentTimeBucket: 'AFTERNOON',
            actualNoShow: true,
        });
    });

    it.each([
        ['pending outcome', { actualOutcome: 'PENDING', actualNoShow: null }],
        ['cancelled outcome', { actualOutcome: 'CANCELLED', actualNoShow: null }],
        [
            'conflicting outcome',
            {
                actualOutcome: 'EXCLUDED',
                actualNoShow: null,
                outcomeSource: 'CONFLICTING_EVIDENCE',
            },
        ],
        ['null label', { actualOutcome: 'ATTENDED', actualNoShow: null }],
        ['inconsistent label', { actualOutcome: 'ATTENDED', actualNoShow: true }],
    ])('excludes %s', (_name, value) => {
        const source = candidate({
            outcome: { ...candidate().outcome!, ...value } as DatasetCandidate['outcome'],
        });
        const { report } = prepare([source]);
        expect(report.eligibleAppointments).toBe(0);
    });

    it('rejects missing, unsupported, invalid, future and schedule-mismatched runs', () => {
        const base = candidate();
        const variants = [
            { ...base, predictions: [{ ...base.predictions[0]!, featureSnapshot: null }] },
            { ...base, predictions: [{ ...base.predictions[0]!, featureSchemaVersion: 'legacy' }] },
            {
                ...base,
                predictions: [
                    prediction('bad-count', '2025-03-09T09:00:00Z', { patientNoShowCount: -1 }),
                ],
            },
            {
                ...base,
                predictions: [
                    prediction('booked-after-prediction', '2025-03-09T09:00:00Z', {
                        bookedAt: '2025-03-09T10:00:00Z',
                    }),
                ],
            },
            {
                ...base,
                predictions: [
                    prediction('bad-timestamp', '2025-03-09T09:00:00Z', { bookedAt: 'not-a-date' }),
                ],
            },
            { ...base, predictions: [prediction('future', '2025-03-10T11:00:00Z')] },
            {
                ...base,
                predictions: [
                    prediction('mismatch', '2025-03-09T09:00:00Z', {
                        scheduledAt: '2025-03-11T09:00:00Z',
                    }),
                ],
            },
        ];
        for (const item of variants) expect(prepare([item]).report.eligibleAppointments).toBe(0);
    });

    it('selects the latest eligible run and falls back when the latest run is invalid', () => {
        const base = candidate();
        const rows = Array.from({ length: 20 }, (_, i) => ({
            ...base,
            appointmentId: `a-${i}`,
            predictions: [
                ...base.predictions,
                prediction(`latest-${i}`, '2025-03-09T10:00:00Z', { patientNoShowCount: 5 }),
                prediction(`invalid-${i}`, '2025-03-09T11:00:00Z', { patientNoShowCount: -1 }),
            ],
        }));
        expect(prepare(rows).rows[0]?.previousNoShows).toBe(5);
    });

    it('suppresses cohorts below 20 and exports no identifying fields', () => {
        const result = prepare(
            Array.from({ length: 19 }, (_, i) => ({ ...candidate(), appointmentId: `a-${i}` }))
        );
        expect(result.rows).toEqual([]);
        expect(result.report.exportSuppressed).toBe(true);
        expect(result.report.privacyRelatedExclusions).toBe(19);
    });

    it('allows operators to raise, but never lower, the minimum cohort size', () => {
        const candidates = Array.from({ length: 20 }, (_, i) => ({
            ...candidate(),
            appointmentId: `a-${i}`,
        }));
        const raised = prepareDataset({
            candidates,
            clinicId,
            from: at('2025-01-01T00:00:00.000Z'),
            to: at('2026-01-01T00:00:00.000Z'),
            format: 'csv',
            minimumCohortSize: 25,
        });
        expect(raised.report.minimumCohortSize).toBe(25);
        expect(raised.report.exportSuppressed).toBe(true);
        expect(() =>
            prepareDataset({
                candidates,
                clinicId,
                from: at('2025-01-01T00:00:00.000Z'),
                to: at('2026-01-01T00:00:00.000Z'),
                format: 'csv',
                minimumCohortSize: 19,
            })
        ).toThrow('INVALID_MINIMUM_COHORT_SIZE');
    });

    it('serializes stable CSV and JSONL without source IDs and handles zero rows', () => {
        const rows = prepare(
            Array.from({ length: 20 }, (_, i) => ({ ...candidate(), appointmentId: `secret-${i}` }))
        ).rows;
        const csv = serializeDataset(rows, 'csv');
        const jsonl = serializeDataset(rows, 'jsonl');
        expect(csv.split('\r\n')[0]).toBe(
            'previousNoShows,previousLateArrivals,previousCompletedVisits,distanceFromClinicKm,bookingLeadHours,appointmentDayOfWeek,appointmentTimeBucket,actualNoShow'
        );
        expect(csv).not.toContain('secret');
        expect(jsonl.split('\n')[0]).toContain('"actualNoShow":false');
        expect(serializeDataset([], 'jsonl')).toBe('');
        expect(serializeDataset([], 'csv')).toContain('previousNoShows');
    });
});
