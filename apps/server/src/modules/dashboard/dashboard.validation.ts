import { z } from 'zod';

const uuidSchema = z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i, 'Invalid id');

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

export const dashboardClinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export const dashboardSummaryQuerySchema = z
    .object({
        date: dateSchema.optional(),
    })
    .strict();

export type DashboardClinicIdParamsSchemaInput = z.infer<typeof dashboardClinicIdParamsSchema>;
export type DashboardSummaryQuerySchemaInput = z.infer<typeof dashboardSummaryQuerySchema>;
