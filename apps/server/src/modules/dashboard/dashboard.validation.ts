import { z } from 'zod';
import { calendarDateRegex, isValidCalendarDate } from '../../utils/dateValidation.js';

const uuidSchema = z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id');

const dateSchema = z
    .string()
    .regex(calendarDateRegex, 'Date must be in YYYY-MM-DD format')
    .refine(isValidCalendarDate, 'Invalid calendar date');

export const dashboardClinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export const dashboardSummaryQuerySchema = z
    .object({
        date: dateSchema.optional(),
    })
    .strict();

export const highRiskAppointmentsQuerySchema = z
    .object({
        date: dateSchema.optional(),
    })
    .strict();

export type DashboardClinicIdParamsSchemaInput = z.infer<typeof dashboardClinicIdParamsSchema>;
export type DashboardSummaryQuerySchemaInput = z.infer<typeof dashboardSummaryQuerySchema>;
export type HighRiskAppointmentsQuerySchemaInput = z.infer<typeof highRiskAppointmentsQuerySchema>;
