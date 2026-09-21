import { z } from 'zod';
import { normalizeEmail } from '../../utils/emailNormalization.js';

const uuidSchema = z.string().uuid('Invalid id');

export const createStaffInvitationSchema = z
    .object({
        email: z
            .string()
            .trim()
            .email('Enter a valid staff email address')
            .transform(normalizeEmail),
    })
    .strict();

export const clinicIdParamsSchema = z.object({ clinicId: uuidSchema }).strict();

export const staffInvitationManagementParamsSchema = z
    .object({
        clinicId: uuidSchema,
        invitationId: uuidSchema,
    })
    .strict();

export const staffMemberParamsSchema = z
    .object({
        clinicId: uuidSchema,
        userId: uuidSchema,
    })
    .strict();

export const staffInvitationTokenParamsSchema = z
    .object({
        token: z
            .string()
            .min(32, 'Invitation token is invalid')
            .max(256, 'Invitation token is invalid')
            .regex(/^[A-Za-z0-9_-]+$/, 'Invitation token is invalid'),
    })
    .strict();

export const updateStaffStatusSchema = z
    .object({
        status: z.enum(['ACTIVE', 'SUSPENDED']),
    })
    .strict();

export const acceptStaffInvitationBodySchema = z.object({}).strict().default({});

export type CreateStaffInvitationRequest = z.infer<typeof createStaffInvitationSchema>;
export type UpdateStaffStatusRequest = z.infer<typeof updateStaffStatusSchema>;
