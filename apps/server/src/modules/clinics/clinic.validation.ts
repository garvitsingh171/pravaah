import { z } from 'zod';
import { isSupportedClinicTimezone } from './clinicTimezone.js';

const uuidSchema = z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id');

const timezoneSchema = z
    .string()
    .trim()
    .min(1, 'Clinic timezone is required')
    .refine(
        isSupportedClinicTimezone,
        'Clinic timezone must be a valid IANA time zone, such as Asia/Kolkata'
    );

const timeSchema = z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time such as 09:00');

const optionalNullableTextSchema = z.string().nullable().optional();

export const createClinicSchema = z
    .object({
        name: z.string().min(2, 'Clinic name must be at least 2 characters long'),

        slug: z
            .string()
            .min(2, 'Clinic slug must be at least 2 characters long')
            .regex(
                /^[a-z0-9-]+$/,
                'Clinic slug can only contain lowercase letters, numbers, and hyphens'
            ),

        phone: z.string().optional(),
        email: z.string().email('Invalid clinic email').optional(),

        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().default('India'),
        pincode: z.string().optional(),

        timezone: timezoneSchema.default('Asia/Kolkata'),

        openingTime: timeSchema.default('09:00'),
        closingTime: timeSchema.default('18:00'),

        slotDurationMinutes: z
            .number()
            .int()
            .positive('Slot duration must be a positive number')
            .default(15),

        bufferMinutes: z.number().int().min(0, 'Buffer minutes cannot be negative').default(0),
    })
    .strict();

export type CreateClinicSchemaInput = z.infer<typeof createClinicSchema>;

export const updateClinicSchema = z
    .object({
        name: z.string().min(2, 'Clinic name must be at least 2 characters long').optional(),

        phone: optionalNullableTextSchema,
        email: z.string().email('Invalid clinic email').nullable().optional(),

        addressLine1: optionalNullableTextSchema,
        addressLine2: optionalNullableTextSchema,
        city: optionalNullableTextSchema,
        state: optionalNullableTextSchema,
        country: z.string().min(1, 'Country is required').optional(),
        pincode: optionalNullableTextSchema,

        timezone: timezoneSchema.optional(),

        openingTime: timeSchema.optional(),
        closingTime: timeSchema.optional(),

        slotDurationMinutes: z
            .number()
            .int()
            .positive('Slot duration must be a positive number')
            .optional(),

        bufferMinutes: z.number().int().min(0, 'Buffer minutes cannot be negative').optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one clinic field is required for update',
    });

export type UpdateClinicSchemaInput = z.infer<typeof updateClinicSchema>;

export const clinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export type ClinicIdParamsInput = z.infer<typeof clinicIdParamsSchema>;

export const provisionSampleDataBodySchema = z.object({}).strict().default({});

export type ProvisionSampleDataBodySchemaInput = z.infer<typeof provisionSampleDataBodySchema>;
