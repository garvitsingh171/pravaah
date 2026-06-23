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

export const clinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export const appointmentIdParamsSchema = z.object({
    appointmentId: uuidSchema,
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

export const updateAppointmentStatusSchema = z
    .object({
        status: z.enum([
            'SCHEDULED',
            'CONFIRMED',
            'ARRIVED',
            'IN_QUEUE',
            'CALLED',
            'COMPLETED',
            'CANCELLED',
            'NO_SHOW',
        ]),
    })
    .strict();

export const listAppointmentsQuerySchema = z
    .object({
        date: dateSchema.optional(),
        doctorId: uuidSchema.optional(),
        patientId: uuidSchema.optional(),
        status: z
            .enum([
                'SCHEDULED',
                'CONFIRMED',
                'ARRIVED',
                'IN_QUEUE',
                'CALLED',
                'COMPLETED',
                'CANCELLED',
                'NO_SHOW',
            ])
            .optional(),
    })
    .strict();

export type ClinicIdParamsSchemaInput = z.infer<typeof clinicIdParamsSchema>;
export type CreateAppointmentSchemaInput = z.infer<typeof createAppointmentSchema>;
export type ListAppointmentsQuerySchemaInput = z.infer<typeof listAppointmentsQuerySchema>;
export type AppointmentIdParamsSchemaInput = z.infer<typeof appointmentIdParamsSchema>;
export type UpdateAppointmentStatusSchemaInput = z.infer<typeof updateAppointmentStatusSchema>;
