import { z } from 'zod';

const uuidSchema = z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id');

export const createDoctorSchema = z
    .object({
        fullName: z.string().min(2, 'Doctor name must be at least 2 characters long'),

        specialization: z.string().optional(),
        qualification: z.string().optional(),
        registrationNumber: z.string().optional(),

        phone: z.string().optional(),

        email: z.string().email('Invalid doctor email').optional(),

        gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),

        experienceYears: z
            .number()
            .int()
            .nonnegative('Experience years cannot be negative')
            .optional(),
    })
    .strict();

export type CreateDoctorSchemaInput = z.infer<typeof createDoctorSchema>;

export const updateDoctorSchema = z
    .object({
        fullName: z.string().min(2, 'Doctor name must be at least 2 characters long').optional(),

        specialization: z.string().optional(),
        qualification: z.string().optional(),
        registrationNumber: z.string().optional(),

        phone: z.string().optional(),

        email: z.string().email('Invalid doctor email').optional(),

        gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),

        experienceYears: z
            .number()
            .int()
            .nonnegative('Experience years cannot be negative')
            .optional(),

        isActive: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one doctor field is required for update',
    });

export type UpdateDoctorSchemaInput = z.infer<typeof updateDoctorSchema>;

export const clinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export type ClinicIdParamsInput = z.infer<typeof clinicIdParamsSchema>;

export const doctorClinicParamsSchema = z.object({
    clinicId: uuidSchema,
    doctorId: uuidSchema,
});

export type DoctorClinicParamsInput = z.infer<typeof doctorClinicParamsSchema>;
