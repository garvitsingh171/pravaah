import { z } from 'zod';

const uuidSchema = z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id');

export const clinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export const clinicPatientIdParamsSchema = z.object({
    clinicId: uuidSchema,
    patientId: uuidSchema,
});

export const createPatientSchema = z
    .object({
        fullName: z.string().min(2, 'Patient name must be at least 2 characters long'),

        phone: z.string().min(5, 'Patient phone must be at least 5 characters long'),

        email: z.string().email('Invalid patient email').optional(),

        gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),

        dateOfBirth: z.coerce.date().optional(),

        age: z.number().int().nonnegative('Age cannot be negative').optional(),

        address: z.string().optional(),

        city: z.string().optional(),

        emergencyContactName: z.string().optional(),

        emergencyContactPhone: z.string().optional(),

        notes: z.string().optional(),

        distanceFromClinicKm: z
            .number()
            .nonnegative('Distance from clinic cannot be negative')
            .optional(),
    })
    .strict();

export const updatePatientSchema = z
    .object({
        fullName: z.string().min(2, 'Patient name must be at least 2 characters long').optional(),

        phone: z.string().min(5, 'Patient phone must be at least 5 characters long').optional(),

        email: z.string().email('Invalid patient email').nullable().optional(),

        gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).nullable().optional(),

        dateOfBirth: z.coerce.date().nullable().optional(),

        age: z.number().int().nonnegative('Age cannot be negative').nullable().optional(),

        address: z.string().nullable().optional(),

        city: z.string().nullable().optional(),

        emergencyContactName: z.string().nullable().optional(),

        emergencyContactPhone: z.string().nullable().optional(),

        notes: z.string().nullable().optional(),

        distanceFromClinicKm: z
            .number()
            .nonnegative('Distance from clinic cannot be negative')
            .nullable()
            .optional(),

        isActive: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one patient field is required for update',
    });

export const listPatientsQuerySchema = z
    .object({
        search: z.string().trim().min(1, 'Search cannot be empty').optional(),

        isActive: z
            .enum(['true', 'false'])
            .transform((value) => value === 'true')
            .optional(),
    })
    .strict();

export type ListPatientsQuerySchemaInput = z.infer<typeof listPatientsQuerySchema>;

export type ClinicIdParamsSchemaInput = z.infer<typeof clinicIdParamsSchema>;

export type ClinicPatientIdParamsSchemaInput = z.infer<typeof clinicPatientIdParamsSchema>;

export type CreatePatientSchemaInput = z.infer<typeof createPatientSchema>;

export type UpdatePatientSchemaInput = z.infer<typeof updatePatientSchema>;
