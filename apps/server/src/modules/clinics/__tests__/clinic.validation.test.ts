import { describe, expect, it } from 'vitest';
import { createClinicSchema, updateClinicSchema } from '../clinic.validation.js';

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

    it('rejects invalid opening and closing times during clinic update', () => {
        const result = updateClinicSchema.safeParse({
            openingTime: '9am',
            closingTime: '18:99',
        });

        expect(result.success).toBe(false);
    });
});

describe('clinic update validation settings surface', () => {
    it('accepts nullable optional text fields so Admins can clear profile values', () => {
        const result = updateClinicSchema.safeParse({
            phone: null,
            email: null,
            addressLine2: null,
            pincode: null,
        });

        expect(result.success).toBe(true);
    });

    it('rejects clinic slug and activation fields from settings updates', () => {
        const result = updateClinicSchema.safeParse({
            name: 'Updated Clinic',
            slug: 'updated-clinic',
            isActive: false,
        });

        expect(result.success).toBe(false);
    });
});
