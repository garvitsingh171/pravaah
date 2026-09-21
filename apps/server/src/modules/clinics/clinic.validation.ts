import { z } from 'zod';
import {
    countryWithDefaultIndia,
    nullableNormalizedText,
    normalizedText,
    optionalNormalizedText,
    refineIndiaPincode,
} from '../../utils/locationValidation.js';
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

const nullableClinicAddressLine1 = nullableNormalizedText(250, 'Address line 1');
const nullableClinicAddressLine2 = nullableNormalizedText(250, 'Address line 2');
const nullableClinicCity = nullableNormalizedText(100, 'City');
const nullableClinicState = nullableNormalizedText(100, 'State');
const nullableClinicPincode = nullableNormalizedText(20, 'Pincode');

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

        phone: optionalNormalizedText(40, 'Clinic phone'),
        email: z.string().email('Invalid clinic email').optional(),

        addressLine1: optionalNormalizedText(250, 'Address line 1'),
        addressLine2: optionalNormalizedText(250, 'Address line 2'),
        city: optionalNormalizedText(100, 'City'),
        state: optionalNormalizedText(100, 'State'),
        country: countryWithDefaultIndia,
        pincode: optionalNormalizedText(20, 'Pincode'),

        timezone: timezoneSchema.default('Asia/Kolkata'),

        openingTime: timeSchema.default('09:00'),
        closingTime: timeSchema.default('18:00'),

        slotDurationMinutes: z
            .number()
            .int()
            .positive('Slot duration must be a positive number')
            .default(15),

        bufferMinutes: z.number().int().min(0, 'Buffer minutes cannot be negative').default(0),

        lateArrivalGraceMinutes: z
            .number()
            .int()
            .min(0, 'Late arrival grace period cannot be negative')
            .default(15),
    })
    .strict()
    .superRefine(refineIndiaPincode);

export type CreateClinicSchemaInput = z.infer<typeof createClinicSchema>;

export const updateClinicSchema = z
    .object({
        name: z.string().min(2, 'Clinic name must be at least 2 characters long').optional(),

        phone: nullableNormalizedText(40, 'Clinic phone'),
        email: z.string().email('Invalid clinic email').nullable().optional(),

        addressLine1: nullableClinicAddressLine1,
        addressLine2: nullableClinicAddressLine2,
        city: nullableClinicCity,
        state: nullableClinicState,
        country: normalizedText(100, 'Country').optional(),
        pincode: nullableClinicPincode,

        timezone: timezoneSchema.optional(),

        openingTime: timeSchema.optional(),
        closingTime: timeSchema.optional(),

        slotDurationMinutes: z
            .number()
            .int()
            .positive('Slot duration must be a positive number')
            .optional(),

        bufferMinutes: z.number().int().min(0, 'Buffer minutes cannot be negative').optional(),

        lateArrivalGraceMinutes: z
            .number()
            .int()
            .min(0, 'Late arrival grace period cannot be negative')
            .optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one clinic field is required for update',
    })
    .superRefine(refineIndiaPincode);

export type UpdateClinicSchemaInput = z.infer<typeof updateClinicSchema>;

export const clinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export type ClinicIdParamsInput = z.infer<typeof clinicIdParamsSchema>;

export const provisionSampleDataBodySchema = z.object({}).strict().default({});

export const retryClinicGeocodingBodySchema = z.object({}).strict().default({});

export type ProvisionSampleDataBodySchemaInput = z.infer<typeof provisionSampleDataBodySchema>;

export type RetryClinicGeocodingBodySchemaInput = z.infer<typeof retryClinicGeocodingBodySchema>;
