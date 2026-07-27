import { describe, expect, it } from 'vitest';
import { createClinicSchema, updateClinicSchema } from './clinic.validation.js';

const minimumClinicInput = {
    name: 'Pravaah Family Clinic',
    slug: 'pravaah-family-clinic',
};

describe('clinic validation timezone rules', () => {
    it('accepts valid IANA time zones during clinic creation', () => {
        const result = createClinicSchema.safeParse({
            ...minimumClinicInput,
            timezone: 'Asia/Kolkata',
        });

        expect(result.success).toBe(true);
    });

    it('rejects invalid time zones during clinic creation', () => {
        const result = createClinicSchema.safeParse({
            ...minimumClinicInput,
            timezone: 'Mars/Olympus',
        });

        expect(result.success).toBe(false);
    });

    it('rejects invalid time zones during clinic update', () => {
        const result = updateClinicSchema.safeParse({
            timezone: 'Mars/Olympus',
        });

        expect(result.success).toBe(false);
    });
});
