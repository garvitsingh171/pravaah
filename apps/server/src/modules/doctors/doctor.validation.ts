import { z } from 'zod';
import { getAvailabilityValidationIssues, weekdays } from './doctorAvailability.js';

const uuidSchema = z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id');

export const createDoctorSchema = z
    .object({
        fullName: z.string().min(2, 'Doctor name must be at least 2 characters long'),

        specialization: z.string().nullable().optional(),
        qualification: z.string().nullable().optional(),
        registrationNumber: z.string().nullable().optional(),

        phone: z.string().nullable().optional(),

        email: z.string().email('Invalid doctor email').nullable().optional(),

        gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),

        experienceYears: z
            .number()
            .int()
            .nonnegative('Experience years cannot be negative')
            .nullable()
            .optional(),
    })
    .strict();

export type CreateDoctorSchemaInput = z.infer<typeof createDoctorSchema>;

export const updateDoctorSchema = z
    .object({
        fullName: z.string().min(2, 'Doctor name must be at least 2 characters long').optional(),

        specialization: z.string().nullable().optional(),
        qualification: z.string().nullable().optional(),
        registrationNumber: z.string().nullable().optional(),

        phone: z.string().nullable().optional(),

        email: z.string().email('Invalid doctor email').nullable().optional(),

        gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),

        experienceYears: z
            .number()
            .int()
            .nonnegative('Experience years cannot be negative')
            .nullable()
            .optional(),

        isActive: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one doctor field is required for update',
    });

export type UpdateDoctorSchemaInput = z.infer<typeof updateDoctorSchema>;

export const clinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export type ClinicIdParamsInput = z.infer<typeof clinicIdParamsSchema>;

export const doctorClinicParamsSchema = z.object({
    clinicId: uuidSchema,
    doctorId: uuidSchema,
});

export type DoctorClinicParamsInput = z.infer<typeof doctorClinicParamsSchema>;

const timeSchema = z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time such as 09:00');

const doctorAvailabilityWeekdaySchema = z.enum(weekdays);

const doctorAvailabilityPeriodSchema = z
    .object({
        startTime: timeSchema,
        endTime: timeSchema,
    })
    .strict();

const doctorAvailabilityDaySchema = z
    .object({
        weekday: doctorAvailabilityWeekdaySchema,
        periods: z.array(doctorAvailabilityPeriodSchema),
    })
    .strict();

export const replaceDoctorAvailabilitySchema = z
    .object({
        days: z
            .array(doctorAvailabilityDaySchema)
            .length(weekdays.length, 'Weekly availability must include all seven weekdays.'),
    })
    .strict()
    .superRefine((value, context) => {
        for (const issue of getAvailabilityValidationIssues(value.days)) {
            context.addIssue({
                code: 'custom',
                path: issue.path,
                message: issue.message,
            });
        }
    });

export type ReplaceDoctorAvailabilitySchemaInput = z.infer<typeof replaceDoctorAvailabilitySchema>;
