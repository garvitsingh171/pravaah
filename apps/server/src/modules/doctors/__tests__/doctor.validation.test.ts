import { describe, expect, it } from 'vitest';
import { replaceDoctorAvailabilitySchema, updateDoctorSchema } from '../doctor.validation.js';

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

const emptyWeek = [
    { weekday: 'MONDAY', periods: [] },
    { weekday: 'TUESDAY', periods: [] },
    { weekday: 'WEDNESDAY', periods: [] },
    { weekday: 'THURSDAY', periods: [] },
    { weekday: 'FRIDAY', periods: [] },
    { weekday: 'SATURDAY', periods: [] },
    { weekday: 'SUNDAY', periods: [] },
];

describe('doctor availability validation', () => {
    it('accepts an empty full-week schedule', () => {
        const result = replaceDoctorAvailabilitySchema.safeParse({
            days: emptyWeek,
        });

        expect(result.success).toBe(true);
    });

    it('accepts split and adjacent periods', () => {
        const result = replaceDoctorAvailabilitySchema.safeParse({
            days: [
                {
                    weekday: 'MONDAY',
                    periods: [
                        { startTime: '09:00', endTime: '12:00' },
                        { startTime: '12:00', endTime: '13:00' },
                        { startTime: '15:00', endTime: '18:00' },
                    ],
                },
                ...emptyWeek.slice(1),
            ],
        });

        expect(result.success).toBe(true);
    });

    it('rejects missing weekdays', () => {
        const result = replaceDoctorAvailabilitySchema.safeParse({
            days: emptyWeek.slice(0, 6),
        });

        expect(result.success).toBe(false);
    });

    it('rejects duplicate weekdays', () => {
        const result = replaceDoctorAvailabilitySchema.safeParse({
            days: [
                ...emptyWeek.slice(0, 6),
                {
                    weekday: 'MONDAY',
                    periods: [],
                },
            ],
        });

        expect(result.success).toBe(false);
    });

    it('rejects invalid time shapes and zero-length periods', () => {
        const result = replaceDoctorAvailabilitySchema.safeParse({
            days: [
                {
                    weekday: 'MONDAY',
                    periods: [
                        { startTime: '9:00', endTime: '13:00' },
                        { startTime: '14:00', endTime: '14:00' },
                    ],
                },
                ...emptyWeek.slice(1),
            ],
        });

        expect(result.success).toBe(false);
    });

    it('rejects overlapping and duplicate periods while allowing gaps', () => {
        const overlapResult = replaceDoctorAvailabilitySchema.safeParse({
            days: [
                {
                    weekday: 'MONDAY',
                    periods: [
                        { startTime: '09:00', endTime: '13:00' },
                        { startTime: '12:30', endTime: '15:00' },
                    ],
                },
                ...emptyWeek.slice(1),
            ],
        });

        const duplicateResult = replaceDoctorAvailabilitySchema.safeParse({
            days: [
                {
                    weekday: 'MONDAY',
                    periods: [
                        { startTime: '09:00', endTime: '13:00' },
                        { startTime: '09:00', endTime: '13:00' },
                    ],
                },
                ...emptyWeek.slice(1),
            ],
        });

        const gapResult = replaceDoctorAvailabilitySchema.safeParse({
            days: [
                {
                    weekday: 'MONDAY',
                    periods: [
                        { startTime: '09:00', endTime: '12:00' },
                        { startTime: '14:00', endTime: '18:00' },
                    ],
                },
                ...emptyWeek.slice(1),
            ],
        });

        expect(overlapResult.success).toBe(false);
        expect(duplicateResult.success).toBe(false);
        expect(gapResult.success).toBe(true);
    });

    it('rejects later periods contained by a longer earlier period', () => {
        const result = replaceDoctorAvailabilitySchema.safeParse({
            days: [
                {
                    weekday: 'MONDAY',
                    periods: [
                        { startTime: '09:00', endTime: '17:00' },
                        { startTime: '10:00', endTime: '11:00' },
                        { startTime: '12:00', endTime: '13:00' },
                    ],
                },
                ...emptyWeek.slice(1),
            ],
        });

        expect(result.success).toBe(false);
    });
});
