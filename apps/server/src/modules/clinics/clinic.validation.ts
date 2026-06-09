import { z } from 'zod';

export const createClinicSchema = z.object({
    name: z.string().trim().min(2, 'Clinic name must be at least 2 characters long'),
    slug: z
        .string()
        .trim()
        .min(2, 'Clinic slug must be at least 2 characters long')
        .regex(
            /^[a-z0-9-]+$/,
            'Clinic slug can only contain lowercase letters, numbers, and hyphens'
        ),

    phone: z.string().trim().optional(),
    email: z.string().trim().email('Invalid clinic email').optional(),

    addressLine1: z.string().trim().optional(),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().default('India'),
    pincode: z.string().trim().optional(),

    timezone: z.string().trim().default('Asia/Kolkata'),

    openingTime: z.string().trim().optional(),
    closingTime: z.string().trim().optional(),

    slotDurationMinutes: z
        .number()
        .int()
        .positive('Slot duration must be a positive number')
        .default(15),

    bufferMinutes: z.number().int().min(0, 'Buffer minutes cannot be negative').default(0),
});

export type CreateClinicSchemaInput = z.infer<typeof createClinicSchema>;
