import { describe, expect, it } from 'vitest';
import { predictNoShowRisk } from './prediction.service.js';

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
    });

    it('returns MEDIUM risk for a new patient with short notice booking', () => {
        const result = predictNoShowRisk({
            bookedAt: new Date('2026-06-18T10:00:00.000Z'),
            scheduledAt: new Date('2026-06-18T18:00:00.000Z'),
            patientNoShowCount: 0,
            patientCompletedAppointmentCount: 0,
        });

        expect(result.riskLevel).toBe('MEDIUM');
        expect(result.score).toBe(35);
        expect(result.reasons).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'SHORT_NOTICE_BOOKING',
                }),
                expect.objectContaining({
                    code: 'NEW_PATIENT',
                }),
            ])
        );
    });

    it('returns HIGH risk for a patient with repeated no-show history and short notice booking', () => {
        const result = predictNoShowRisk({
            bookedAt: new Date('2026-06-18T10:00:00.000Z'),
            scheduledAt: new Date('2026-06-18T18:00:00.000Z'),
            patientNoShowCount: 2,
            patientCompletedAppointmentCount: 0,
        });

        expect(result.riskLevel).toBe('HIGH');
        expect(result.score).toBe(60);
        expect(result.reasons).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'PREVIOUS_NO_SHOW_HISTORY',
                }),
                expect.objectContaining({
                    code: 'SHORT_NOTICE_BOOKING',
                }),
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
        expect(result.score).toBe(40);
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
