import { describe, expect, it } from 'vitest';
import {
    formatGenerationSource,
    formatPredictionDistance,
    formatScoreImpact,
    normalizePredictionReasons,
    normalizeSuggestedActions,
} from './riskExplanationModel';

describe('risk explanation presentation model', () => {
    it('normalizes structured and legacy factors without inventing impacts', () => {
        expect(
            normalizePredictionReasons([
                { code: 'PREVIOUS_NO_SHOW_HISTORY', message: 'Past no-shows.', scoreImpact: 40 },
                {
                    code: 'STRONG_ATTENDANCE_HISTORY',
                    message: 'Consistent visits.',
                    scoreImpact: -20,
                },
                { code: 'NEW_PATIENT', message: 'New patient.', scoreImpact: 0 },
                { code: 'FUTURE_FACTOR', message: 'Future explanation.', scoreImpact: Number.NaN },
                'Legacy explanation',
                { code: 'MISSING_MESSAGE', scoreImpact: 12 },
                {
                    code: 'INVALID_IMPACT',
                    message: 'No numeric contribution.',
                    scoreImpact: Infinity,
                },
                null,
            ])
        ).toEqual([
            expect.objectContaining({
                title: 'Previous No-Shows',
                message: 'Past no-shows.',
                scoreImpact: 40,
            }),
            expect.objectContaining({ title: 'Strong Attendance History', scoreImpact: -20 }),
            expect.objectContaining({ title: 'New Patient', scoreImpact: 0 }),
            expect.objectContaining({ title: 'FUTURE FACTOR', scoreImpact: null }),
            expect.objectContaining({
                title: 'Prediction factor',
                message: 'Legacy explanation',
                scoreImpact: null,
            }),
            expect.objectContaining({ title: 'MISSING MESSAGE', scoreImpact: 12, message: null }),
            expect.objectContaining({ scoreImpact: null }),
        ]);
        expect(normalizePredictionReasons(null)).toEqual([]);
        expect(normalizePredictionReasons([])).toEqual([]);
    });

    it('formats positive, negative, zero, and unavailable impacts accessibly', () => {
        expect(formatScoreImpact(40)).toEqual({ value: '+40 points', direction: 'Increases risk' });
        expect(formatScoreImpact(-20)).toEqual({ value: '-20 points', direction: 'Reduces risk' });
        expect(formatScoreImpact(0)).toEqual({ value: '0 points', direction: 'No score change' });
        expect(formatScoreImpact(null).value).toBe('Impact not available');
    });

    it('formats historical distance and safely handles absent or invalid values', () => {
        expect(formatPredictionDistance(18.42)).toBe('18.4 km');
        expect(formatPredictionDistance(0)).toBe('0 km');
        expect(formatPredictionDistance(null)).toBe('Not available');
        expect(formatPredictionDistance(undefined)).toBe('Not available');
        expect(formatPredictionDistance(-1)).toBe('Not available');
        expect(formatPredictionDistance(Number.NaN)).toBe('Not available');
    });

    it('keeps backend action ordering, removes duplicates, and labels provenance', () => {
        expect(
            normalizeSuggestedActions(['Call patient', ' Call patient ', 'Review history', 2])
        ).toEqual(['Call patient', 'Review history']);
        expect(normalizeSuggestedActions([])).toEqual([]);
        expect(formatGenerationSource('APPOINTMENT_RESCHEDULED')).toBe('Appointment Rescheduled');
        expect(formatGenerationSource('NEW_FUTURE_SOURCE')).toBe('NEW_FUTURE_SOURCE');
        expect(formatGenerationSource(undefined)).toBe('Not available');
    });
});
