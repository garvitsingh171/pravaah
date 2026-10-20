import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const predictionFeedbackParamsSchema = z.object({ predictionId: uuidSchema }).strict();

export const predictionFeedbackBodySchema = z.object({
    usefulness: z.enum(['USEFUL', 'NOT_USEFUL', 'UNSURE']),
    actionTaken: z.enum([
        'CONTACTED_PATIENT',
        'REMINDER_SENT',
        'ATTENDANCE_CONFIRMED',
        'RESCHEDULED_APPOINTMENT',
        'MONITORED_APPOINTMENT',
        'NO_ACTION',
        'OTHER',
    ]),
    note: z.string().trim().max(500).transform((value) => value || null).optional(),
}).strict();

export type PredictionFeedbackBody = z.infer<typeof predictionFeedbackBodySchema>;
