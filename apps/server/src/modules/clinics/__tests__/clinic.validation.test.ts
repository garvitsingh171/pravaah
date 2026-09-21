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

    it('accepts zero late arrival grace minutes during clinic update', () => {
        const result = updateClinicSchema.safeParse({
            lateArrivalGraceMinutes: 0,
        });

        expect(result.success).toBe(true);
    });

    it('rejects negative late arrival grace minutes during clinic update', () => {
        const result = updateClinicSchema.safeParse({
            lateArrivalGraceMinutes: -1,
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

describe('clinic structured location normalization', () => {
    it('trims location fields and keeps India as the create default', () => {
        const result = createClinicSchema.safeParse({
            ...minimumClinicInput,
            addressLine1: '  12 Wellness Road  ',
            city: ' Mumbai ',
            state: ' Maharashtra ',
            pincode: '400001',
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.addressLine1).toBe('12 Wellness Road');
            expect(result.data.city).toBe('Mumbai');
            expect(result.data.state).toBe('Maharashtra');
            expect(result.data.country).toBe('India');
        }
    });

    it('normalizes empty optional update fields to null and rejects whitespace country', () => {
        const clearResult = updateClinicSchema.safeParse({
            addressLine1: '   ',
            addressLine2: null,
            pincode: '   ',
        });
        const whitespaceCountryResult = updateClinicSchema.safeParse({
            country: '   ',
        });

        expect(clearResult.success).toBe(true);
        expect(whitespaceCountryResult.success).toBe(false);

        if (clearResult.success) {
            expect(clearResult.data.addressLine1).toBeNull();
            expect(clearResult.data.addressLine2).toBeNull();
            expect(clearResult.data.pincode).toBeNull();
        }
    });

    it('applies the Indian six-digit pincode rule without restricting international postcodes', () => {
        const invalidIndiaResult = createClinicSchema.safeParse({
            ...minimumClinicInput,
            country: 'India',
            pincode: 'ABCDEF',
        });
        const internationalResult = createClinicSchema.safeParse({
            ...minimumClinicInput,
            country: 'United Kingdom',
            pincode: 'SW1A 1AA',
        });

        expect(invalidIndiaResult.success).toBe(false);
        expect(internationalResult.success).toBe(true);
    });
});
