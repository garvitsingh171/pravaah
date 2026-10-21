import { z } from 'zod';
import { calendarDateRegex, isValidCalendarDate } from '../../utils/dateValidation.js';

const uuidSchema = z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id');

const dateSchema = z
    .string()
    .regex(calendarDateRegex, 'Date must be in YYYY-MM-DD format')
    .refine(isValidCalendarDate, 'Invalid calendar date');

const noShowIntelligenceQuerySchema = z
    .object({
        from: dateSchema,
        to: dateSchema,
    })
    .strict()
    .refine(({ from, to }) => {
        const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
        return days >= 0 && days <= 30;
    }, 'Date range must be ordered and cannot exceed 31 calendar days');

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
export { noShowIntelligenceQuerySchema };

export type DashboardClinicIdParamsSchemaInput = z.infer<typeof dashboardClinicIdParamsSchema>;
export type DashboardSummaryQuerySchemaInput = z.infer<typeof dashboardSummaryQuerySchema>;
export type HighRiskAppointmentsQuerySchemaInput = z.infer<typeof highRiskAppointmentsQuerySchema>;
export type NoShowIntelligenceQuerySchemaInput = z.infer<typeof noShowIntelligenceQuerySchema>;
