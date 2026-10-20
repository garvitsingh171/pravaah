import { describe, expect, it } from 'vitest';
import { predictionFeedbackBodySchema, predictionFeedbackParamsSchema } from '../prediction-feedback.validation.js';

const valid = { usefulness: 'USEFUL', actionTaken: 'CONTACTED_PATIENT' };

describe('prediction feedback validation', () => {
    it.each(['USEFUL', 'NOT_USEFUL', 'UNSURE'])('accepts usefulness %s', (usefulness) => {
        expect(predictionFeedbackBodySchema.safeParse({ ...valid, usefulness }).success).toBe(true);
    });

    it.each(['CONTACTED_PATIENT', 'REMINDER_SENT', 'ATTENDANCE_CONFIRMED', 'RESCHEDULED_APPOINTMENT', 'MONITORED_APPOINTMENT', 'NO_ACTION', 'OTHER'])('accepts action %s', (actionTaken) => {
        expect(predictionFeedbackBodySchema.safeParse({ ...valid, actionTaken }).success).toBe(true);
    });

    it('trims optional notes, accepts 500 characters, and rejects longer notes', () => {
        expect(predictionFeedbackBodySchema.safeParse({ ...valid, note: '  helpful  ' })).toMatchObject({ success: true, data: { note: 'helpful' } });
        expect(predictionFeedbackBodySchema.safeParse({ ...valid, note: 'x'.repeat(500) }).success).toBe(true);
        expect(predictionFeedbackBodySchema.safeParse({ ...valid, note: 'x'.repeat(501) }).success).toBe(false);
        expect(predictionFeedbackBodySchema.safeParse(valid).success).toBe(true);
    });

    it('rejects unsupported values, missing fields, extra ownership fields, and malformed IDs', () => {
        expect(predictionFeedbackBodySchema.safeParse({ ...valid, usefulness: 'MAYBE' }).success).toBe(false);
        expect(predictionFeedbackBodySchema.safeParse({ ...valid, actionTaken: 'CALLED_PATIENT' }).success).toBe(false);
        expect(predictionFeedbackBodySchema.safeParse({ usefulness: 'USEFUL' }).success).toBe(false);
        expect(predictionFeedbackBodySchema.safeParse({ ...valid, clinicId: 'client-controlled' }).success).toBe(false);
        expect(predictionFeedbackParamsSchema.safeParse({ predictionId: 'not-a-uuid' }).success).toBe(false);
    });
});
