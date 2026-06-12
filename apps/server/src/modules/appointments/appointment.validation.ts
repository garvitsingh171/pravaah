import { z } from 'zod';

const uuidSchema = z
    .string()
    .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid id'
    );

export const clinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export const createAppointmentSchema = z
    .object({
        doctorId: uuidSchema,
        patientId: uuidSchema,
        scheduledAt: z.string().datetime('Invalid appointment date and time'),
        durationMinutes: z
            .number()
            .int()
            .positive('Duration minutes must be a positive number')
            .default(15),
        reason: z.string().optional(),
        notes: z.string().optional(),
        bookingSource: z.enum(['RECEPTION', 'PHONE', 'WEB', 'WALK_IN']).default('RECEPTION'),
    })
    .strict();

export type ClinicIdParamsSchemaInput = z.infer<typeof clinicIdParamsSchema>;
export type CreateAppointmentSchemaInput = z.infer<typeof createAppointmentSchema>;
