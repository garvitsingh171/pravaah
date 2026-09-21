import { describe, expect, it } from 'vitest';
import {
    acceptStaffInvitationBodySchema,
    createStaffInvitationSchema,
    staffInvitationTokenParamsSchema,
    updateStaffStatusSchema,
} from '../staff.validation.js';

describe('staff validation', () => {
    it('normalizes a valid invitation email and rejects authority fields', () => {
        expect(createStaffInvitationSchema.parse({ email: ' Staff@Example.com ' })).toEqual({
            email: 'staff@example.com',
        });
        expect(
            createStaffInvitationSchema.safeParse({
                email: 'staff@example.com',
                role: 'ADMIN',
            }).success
        ).toBe(false);
    });

    it('allows only ACTIVE and SUSPENDED staff status requests', () => {
        expect(updateStaffStatusSchema.safeParse({ status: 'ACTIVE' }).success).toBe(true);
        expect(updateStaffStatusSchema.safeParse({ status: 'SUSPENDED' }).success).toBe(true);
        expect(updateStaffStatusSchema.safeParse({ status: 'INVITED' }).success).toBe(false);
    });

    it('requires a URL-safe invitation token and an empty acceptance body', () => {
        expect(staffInvitationTokenParamsSchema.safeParse({ token: 'a'.repeat(43) }).success).toBe(
            true
        );
        expect(staffInvitationTokenParamsSchema.safeParse({ token: 'short' }).success).toBe(false);
        expect(acceptStaffInvitationBodySchema.safeParse({}).success).toBe(true);
        expect(acceptStaffInvitationBodySchema.safeParse({ role: 'ADMIN' }).success).toBe(false);
    });
});
