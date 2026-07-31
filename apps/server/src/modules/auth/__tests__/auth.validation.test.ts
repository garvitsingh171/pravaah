import { describe, expect, it } from 'vitest';
import { onboardingClinicSchema } from '../auth.validation.js';

const minimumClinicInput = {
    name: 'Pravaah Family Clinic',
    slug: 'pravaah-family-clinic',
};

describe('onboardingClinicSchema', () => {
    it('accepts valid minimum clinic input and applies clinic defaults', () => {
        const result = onboardingClinicSchema.safeParse(minimumClinicInput);

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
            ...minimumClinicInput,
            country: 'India',
            timezone: 'Asia/Kolkata',
            openingTime: '09:00',
            closingTime: '18:00',
            slotDurationMinutes: 15,
            bufferMinutes: 0,
        });
    });

    it('accepts valid complete clinic input', () => {
        const input = {
            ...minimumClinicInput,
            phone: '+91 9876543210',
            email: 'frontdesk@example.com',
            addressLine1: '12 Flow Street',
            addressLine2: 'Second Floor',
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India',
            pincode: '411001',
            timezone: 'Asia/Kolkata',
            openingTime: '08:30',
            closingTime: '17:30',
            slotDurationMinutes: 20,
            bufferMinutes: 5,
        };

        expect(onboardingClinicSchema.safeParse(input).success).toBe(true);
    });

    it('rejects invalid clinic names', () => {
        const result = onboardingClinicSchema.safeParse({
            ...minimumClinicInput,
            name: 'A',
        });

        expect(result.success).toBe(false);
    });

    it('rejects slugs outside the lowercase letters numbers and hyphens convention', () => {
        const result = onboardingClinicSchema.safeParse({
            ...minimumClinicInput,
            slug: 'Pravaah Clinic',
        });

        expect(result.success).toBe(false);
    });

    it('rejects an empty request body', () => {
        const result = onboardingClinicSchema.safeParse({});

        expect(result.success).toBe(false);
    });

    it('rejects missing required clinic fields', () => {
        const missingName = onboardingClinicSchema.safeParse({
            slug: minimumClinicInput.slug,
        });
        const missingSlug = onboardingClinicSchema.safeParse({
            name: minimumClinicInput.name,
        });

        expect(missingName.success).toBe(false);
        expect(missingSlug.success).toBe(false);
    });

    it('rejects invalid field types', () => {
        const result = onboardingClinicSchema.safeParse({
            ...minimumClinicInput,
            slotDurationMinutes: '15',
        });

        expect(result.success).toBe(false);
    });

    it('rejects unknown body fields', () => {
        const result = onboardingClinicSchema.safeParse({
            ...minimumClinicInput,
            unexpected: true,
        });

        expect(result.success).toBe(false);
    });

    it('rejects invalid clinic email separately from admin identity email', () => {
        const result = onboardingClinicSchema.safeParse({
            ...minimumClinicInput,
            email: 'not-an-email',
        });

        expect(result.success).toBe(false);
    });

    it('rejects invalid slot duration values', () => {
        const result = onboardingClinicSchema.safeParse({
            ...minimumClinicInput,
            slotDurationMinutes: 0,
        });

        expect(result.success).toBe(false);
    });

    it('rejects negative buffer minutes', () => {
        const result = onboardingClinicSchema.safeParse({
            ...minimumClinicInput,
            bufferMinutes: -1,
        });

        expect(result.success).toBe(false);
    });

    it.each([
        'clerkUserId',
        'userId',
        'internalUserId',
        'adminUserId',
        'role',
        'status',
        'clinicId',
        'ownerId',
        'ownership',
        'createdBy',
        'createdByUserId',
    ])('rejects client-supplied authority field %s', (field) => {
        const result = onboardingClinicSchema.safeParse({
            ...minimumClinicInput,
            [field]: 'client-controlled-value',
        });

        expect(result.success).toBe(false);
    });

    it('rejects combined role and Clerk id injection attempts', () => {
        const result = onboardingClinicSchema.safeParse({
            ...minimumClinicInput,
            role: 'ADMIN',
            clerkUserId: 'another-clerk-user',
        });

        expect(result.success).toBe(false);
    });

    it('rejects combined internal user and existing clinic injection attempts', () => {
        const result = onboardingClinicSchema.safeParse({
            ...minimumClinicInput,
            userId: 'another-internal-user',
            clinicId: 'existing-clinic-id',
        });

        expect(result.success).toBe(false);
    });
});
