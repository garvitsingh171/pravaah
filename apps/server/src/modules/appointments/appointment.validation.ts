import { z } from 'zod';
import { calendarDateRegex, isValidCalendarDate } from '../../utils/dateValidation.js';

const uuidSchema = z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id');

const dateSchema = z
    .string()
    .regex(calendarDateRegex, 'Date must be in YYYY-MM-DD format')
    .refine(isValidCalendarDate, 'Invalid calendar date');

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

export const rescheduleAppointmentSlotsQuerySchema = z
    .object({
        date: dateSchema,
    })
    .strict();

export const rescheduleAppointmentSchema = z
    .object({
        scheduledAt: z.string().datetime('Invalid appointment date and time'),
        currentScheduledAt: z.string().datetime('Invalid current appointment date and time'),
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

export const availableAppointmentSlotsQuerySchema = z
    .object({
        doctorId: uuidSchema,
        date: dateSchema,
        durationMinutes: z.coerce
            .number()
            .int()
            .positive('Duration minutes must be a positive number'),
    })
    .strict();

export type ClinicIdParamsSchemaInput = z.infer<typeof clinicIdParamsSchema>;
export type CreateAppointmentSchemaInput = z.infer<typeof createAppointmentSchema>;
export type ListAppointmentsQuerySchemaInput = z.infer<typeof listAppointmentsQuerySchema>;
export type AvailableAppointmentSlotsQuerySchemaInput = z.infer<
    typeof availableAppointmentSlotsQuerySchema
>;
export type AppointmentIdParamsSchemaInput = z.infer<typeof appointmentIdParamsSchema>;
export type UpdateAppointmentStatusSchemaInput = z.infer<typeof updateAppointmentStatusSchema>;
export type RescheduleAppointmentSlotsQuerySchemaInput = z.infer<
    typeof rescheduleAppointmentSlotsQuerySchema
>;
export type RescheduleAppointmentSchemaInput = z.infer<typeof rescheduleAppointmentSchema>;
