import { z } from 'zod';

export const createClinicSchema = z.object({
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

    timezone: z.string().default('Asia/Kolkata'),

    openingTime: z.string().default('09:00'),
    closingTime: z.string().default('18:00'),

    slotDurationMinutes: z
        .number()
        .int()
        .positive('Slot duration must be a positive number')
        .default(15),

    bufferMinutes: z.number().int().min(0, 'Buffer minutes cannot be negative').default(0),
});

export type CreateClinicSchemaInput = z.infer<typeof createClinicSchema>;

export const updateClinicSchema = z
    .object({
        name: z.string().min(2, 'Clinic name must be at least 2 characters long').optional(),

        slug: z
            .string()
            .min(2, 'Clinic slug must be at least 2 characters long')
            .regex(
                /^[a-z0-9-]+$/,
                'Clinic slug can only contain lowercase letters, numbers, and hyphens'
            )
            .optional(),

        phone: z.string().optional(),
        email: z.string().email('Invalid clinic email').optional(),

        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),

        timezone: z.string().optional(),

        openingTime: z.string().optional(),
        closingTime: z.string().optional(),

        slotDurationMinutes: z
            .number()
            .int()
            .positive('Slot duration must be a positive number')
            .optional(),

        bufferMinutes: z.number().int().min(0, 'Buffer minutes cannot be negative').optional(),

        isActive: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one clinic field is required for update',
    });

export type UpdateClinicSchemaInput = z.infer<typeof updateClinicSchema>;

export const clinicIdParamsSchema = z.object({
    clinicId: z
        .string()
        .regex(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            'Invalid clinic id'
        ),
});

export type ClinicIdParamsInput = z.infer<typeof clinicIdParamsSchema>;