import { describe, expect, it } from 'vitest';
import { formatClinicDateTime, getClinicDateInputValue } from './clinicDateTime';

describe('clinic date and time', () => {
    it('uses the clinic date when the browser and clinic are on different days', () => {
        const instant = new Date('2026-10-16T20:00:00.000Z');

        expect(getClinicDateInputValue('Asia/Kolkata', instant)).toBe('2026-10-17');
        expect(getClinicDateInputValue('America/Los_Angeles', instant)).toBe('2026-10-16');
    });

    it('formats an appointment in the clinic timezone', () => {
        expect(formatClinicDateTime('2026-10-16T20:00:00.000Z', 'Asia/Kolkata')).toContain(
            '17 Oct 2026'
        );
    });
});
