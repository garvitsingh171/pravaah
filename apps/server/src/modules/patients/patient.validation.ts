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

export const createPatientSchema = z
    .object({
        fullName: z.string().min(2, 'Patient name must be at least 2 characters long'),

        phone: z.string().min(5, 'Patient phone must be at least 5 characters long'),

        email: z.string().email('Invalid patient email').optional(),

        gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),

        dateOfBirth: z.coerce.date().optional(),

        age: z.number().int().nonnegative('Age cannot be negative').optional(),

        address: z.string().optional(),

        city: z.string().optional(),

        emergencyContactName: z.string().optional(),

        emergencyContactPhone: z.string().optional(),

        distanceFromClinicKm: z
            .number()
            .nonnegative('Distance from clinic cannot be negative')
            .optional(),

        notes: z.string().optional(),
    })
    .strict();

export type ClinicIdParamsSchemaInput = z.infer<typeof clinicIdParamsSchema>;

export type CreatePatientSchemaInput = z.infer<typeof createPatientSchema>;
