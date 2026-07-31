import { describe, expect, it } from 'vitest';
import { listAppointmentsQuerySchema } from '../appointment.validation.js';

describe('listAppointmentsQuerySchema', () => {
    it('rejects invalid calendar dates', () => {
        for (const date of ['2026-02-30', '2026-13-01', '2026-00-10']) {
            expect(listAppointmentsQuerySchema.safeParse({ date }).success).toBe(false);
        }
    });

    it('accepts valid YYYY-MM-DD calendar dates', () => {
        expect(listAppointmentsQuerySchema.safeParse({ date: '2026-02-28' }).success).toBe(true);
        expect(listAppointmentsQuerySchema.safeParse({ date: '2026-02-29' }).success).toBe(false);
        expect(listAppointmentsQuerySchema.safeParse({ date: '2028-02-29' }).success).toBe(true);
    });
});
