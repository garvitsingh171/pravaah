import { z } from 'zod';

const uuidSchema = z
    .string()
    .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid id'
    );

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
        message: 'Invalid date',
    });

export const queueClinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export const listQueueQuerySchema = z
    .object({
        date: dateSchema,
    })
    .strict();

export type QueueClinicIdParamsSchemaInput = z.infer<typeof queueClinicIdParamsSchema>;
export type ListQueueQuerySchemaInput = z.infer<typeof listQueueQuerySchema>;
