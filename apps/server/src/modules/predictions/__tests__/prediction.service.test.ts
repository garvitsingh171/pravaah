import { describe, expect, it } from 'vitest';
import {
    createNoShowPredictionRun,
    normalizeNoShowPredictionFeatures,
    predictNoShowRisk,
    toNoShowPredictionResponse,
} from '../prediction.service.js';

describe('predictNoShowRisk', () => {
    it('returns LOW risk for a patient with strong attendance history', () => {
        const result = predictNoShowRisk({
            bookedAt: new Date('2026-06-18T10:00:00.000Z'),
            scheduledAt: new Date('2026-06-20T10:00:00.000Z'),
            patientNoShowCount: 0,
            patientCompletedAppointmentCount: 5,
        });

        expect(result.riskLevel).toBe('LOW');
        expect(result.score).toBe(0);
        expect(result.reasons).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'STRONG_ATTENDANCE_HISTORY',
                }),
            ])
        );
        expect(result.suggestedActions).toEqual(
            expect.arrayContaining(['Use the normal reception workflow for this appointment.'])
        );
    });

    it('returns MEDIUM risk for a new patient with short notice booking and moderate distance', () => {
        const result = predictNoShowRisk({
            bookedAt: new Date('2026-06-18T10:00:00.000Z'),
            scheduledAt: new Date('2026-06-18T18:00:00.000Z'),
            patientNoShowCount: 0,
            patientCompletedAppointmentCount: 0,
            distanceFromClinicKm: 9,
        });

        expect(result.riskLevel).toBe('MEDIUM');
        expect(result.score).toBe(33);
        expect(result.reasons).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'SHORT_NOTICE_BOOKING',
                }),
                expect.objectContaining({
                    code: 'NEW_PATIENT',
                }),
                expect.objectContaining({
                    code: 'LONG_DISTANCE_FROM_CLINIC',
                }),
            ])
        );
        expect(result.suggestedActions).toEqual(
            expect.arrayContaining(['Consider a manual confirmation if staff have capacity.'])
        );
    });

    it('returns HIGH risk for a patient with repeated no-show and late arrival history', () => {
        const result = predictNoShowRisk({
            bookedAt: new Date('2026-06-18T10:00:00.000Z'),
            scheduledAt: new Date('2026-06-18T18:00:00.000Z'),
            patientNoShowCount: 2,
            patientLateArrivalCount: 2,
            patientCompletedAppointmentCount: 0,
            distanceFromClinicKm: 18,
        });

        expect(result.riskLevel).toBe('HIGH');
        expect(result.score).toBe(85);
        expect(result.reasons).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'PREVIOUS_NO_SHOW_HISTORY',
                }),
                expect.objectContaining({
                    code: 'SHORT_NOTICE_BOOKING',
                }),
                expect.objectContaining({
                    code: 'LATE_ARRIVAL_HISTORY',
                }),
            ])
        );
        expect(result.suggestedActions).toEqual(
            expect.arrayContaining([
                'Review this appointment during front-desk preparation.',
                'Ask staff to watch arrival status and update it manually if needed.',
            ])
        );
    });

    it('returns MEDIUM risk for one previous no-show and long advance booking', () => {
        const result = predictNoShowRisk({
            bookedAt: new Date('2026-06-18T10:00:00.000Z'),
            scheduledAt: new Date('2026-07-05T10:00:00.000Z'),
            patientNoShowCount: 1,
            patientCompletedAppointmentCount: 2,
        });

        expect(result.riskLevel).toBe('MEDIUM');
        expect(result.score).toBe(35);
        expect(result.reasons).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'PREVIOUS_NO_SHOW_HISTORY',
                }),
                expect.objectContaining({
                    code: 'LONG_ADVANCE_BOOKING',
                }),
            ])
        );
    });
});

describe('versioned prediction runs', () => {
    const input = {
        bookedAt: new Date('2026-09-20T08:30:00.000Z'),
        scheduledAt: new Date('2026-09-25T10:00:00.000Z'),
        distanceFromClinicKm: 0,
    };

    it('normalizes optional values into the complete JSON-safe V1 shape', () => {
        expect(normalizeNoShowPredictionFeatures(input)).toEqual({
            scheduledAt: '2026-09-25T10:00:00.000Z',
            bookedAt: '2026-09-20T08:30:00.000Z',
            patientNoShowCount: 0,
            patientLateArrivalCount: 0,
            patientCompletedAppointmentCount: 0,
            distanceFromClinicKm: 0,
        });

        expect(
            normalizeNoShowPredictionFeatures({ ...input, distanceFromClinicKm: null })
                .distanceFromClinicKm
        ).toBeNull();
    });

    it('evaluates and persists the exact same normalized snapshot', () => {
        const run = createNoShowPredictionRun({
            input,
            generationSource: 'APPOINTMENT_CREATION',
        });

        expect(run.featureSnapshot).toEqual(normalizeNoShowPredictionFeatures(input));
        expect(run.featureSchemaVersion).toBe('no-show-features-v1');
        expect(run.ruleVersion).toBe('starter-rule-v1');
        expect(Object.keys(run.featureSnapshot)).toEqual([
            'scheduledAt',
            'bookedAt',
            'patientNoShowCount',
            'patientLateArrivalCount',
            'patientCompletedAppointmentCount',
            'distanceFromClinicKm',
        ]);
        expect(predictNoShowRisk(input).score).toBe(run.score);
    });

    it('maps the stored historical rule version rather than the current constant', () => {
        const response = toNoShowPredictionResponse({
            id: 'prediction-id',
            riskLevel: 'LOW',
            score: 0,
            reasons: [],
            featureSchemaVersion: 'no-show-features-v1',
            featureSnapshot: null,
            ruleVersion: 'historical-rule-v0',
            generationSource: 'APPOINTMENT_CREATION',
            createdAt: new Date('2026-09-25T10:00:00.000Z'),
            updatedAt: new Date('2026-09-25T10:00:00.000Z'),
        });

        expect(response?.ruleVersion).toBe('historical-rule-v0');
        expect(response?.modelVersion).toBe('historical-rule-v0');
    });

    it('keeps legacy unknown metadata null', () => {
        const response = toNoShowPredictionResponse({
            id: 'legacy-id',
            riskLevel: 'LOW',
            score: 0,
            reasons: [],
            featureSchemaVersion: null,
            featureSnapshot: null,
            ruleVersion: null,
            generationSource: 'LEGACY_EXISTING',
            createdAt: new Date('2026-09-25T10:00:00.000Z'),
            updatedAt: new Date('2026-09-25T10:00:00.000Z'),
        });

        expect(response?.ruleVersion).toBeNull();
        expect(response?.modelVersion).toBeNull();
    });
});
