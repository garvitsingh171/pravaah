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
    .refine((value) => {
        const [yearText, monthText, dayText] = value.split('-');

        if (yearText === undefined || monthText === undefined || dayText === undefined) {
            return false;
        }

        const year = Number(yearText);
        const month = Number(monthText);
        const day = Number(dayText);

        const parsedDate = new Date(Date.UTC(year, month - 1, day));

        return (
            parsedDate.getUTCFullYear() === year &&
            parsedDate.getUTCMonth() === month - 1 &&
            parsedDate.getUTCDate() === day
        );
    }, 'Invalid calendar date');

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
