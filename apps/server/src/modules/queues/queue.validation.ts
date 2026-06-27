import { z } from 'zod';
import { calendarDateRegex, isValidCalendarDate } from '../../utils/dateValidation.js';

const uuidSchema = z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id');

const dateSchema = z
    .string()
    .regex(calendarDateRegex, 'Date must be in YYYY-MM-DD format')
    .refine(isValidCalendarDate, 'Invalid calendar date');

export const queueClinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export const queueStatusUpdateParamsSchema = z.object({
    clinicId: uuidSchema,
    queueEntryId: uuidSchema,
});

export const listQueueQuerySchema = z
    .object({
        date: dateSchema,
    })
    .strict();

export const updateQueueStatusBodySchema = z
    .object({
        status: z.enum(['ARRIVED', 'WAITING', 'CALLED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
    })
    .strict();

export const reorderQueueBodySchema = z
    .object({
        date: dateSchema,
        queueEntryIds: z
            .array(uuidSchema)
            .min(1, 'At least one queue entry id is required')
            .refine(
                (queueEntryIds) => new Set(queueEntryIds).size === queueEntryIds.length,
                'Queue entry ids must be unique'
            ),
    })
    .strict();

export type QueueClinicIdParamsSchemaInput = z.infer<typeof queueClinicIdParamsSchema>;
export type QueueStatusUpdateParamsSchemaInput = z.infer<typeof queueStatusUpdateParamsSchema>;
export type ListQueueQuerySchemaInput = z.infer<typeof listQueueQuerySchema>;
export type UpdateQueueStatusBodySchemaInput = z.infer<typeof updateQueueStatusBodySchema>;
export type ReorderQueueBodySchemaInput = z.infer<typeof reorderQueueBodySchema>;
