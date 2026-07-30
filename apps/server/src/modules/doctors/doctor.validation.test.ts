import { describe, expect, it } from 'vitest';
import { updateDoctorSchema } from './doctor.validation.js';

describe('doctor update validation', () => {
    it('accepts nulls for optional doctor fields so existing values can be cleared', () => {
        const result = updateDoctorSchema.safeParse({
            specialization: null,
            qualification: null,
            registrationNumber: null,
            phone: null,
            email: null,
            gender: null,
            experienceYears: null,
        });

        expect(result.success).toBe(true);
    });

    it('still rejects invalid non-null doctor update values', () => {
        const result = updateDoctorSchema.safeParse({
            email: 'not-an-email',
            experienceYears: -1,
        });

        expect(result.success).toBe(false);
    });
});
