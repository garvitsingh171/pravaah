import { createHash, randomBytes } from 'node:crypto';
import { StaffInvitationStatus, UserRole, UserStatus } from '../../generated/prisma/client.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { normalizeEmail } from '../../utils/emailNormalization.js';
import { clerkIdentityService } from '../auth/clerkIdentity.service.js';
import { staffRepository } from './staff.repository.js';
import {
    EffectiveStaffInvitationStatus,
    STAFF_INVITATION_EXPIRY_DAYS,
    STAFF_INVITATION_TOKEN_BYTES,
    type AcceptStaffInvitationResponse,
    type CreateStaffInvitationInput,
    type StaffInvitationRecord,
    type StaffInvitationResponse,
    type UpdateStaffStatusInput,
} from './staff.types.js';

export const hashStaffInvitationToken = (rawToken: string): string => {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
};

export const getEffectiveInvitationStatus = (
    status: StaffInvitationStatus,
    expiresAt: Date,
    now = new Date()
): EffectiveStaffInvitationStatus => {
    if (status === StaffInvitationStatus.PENDING && expiresAt <= now) {
        return EffectiveStaffInvitationStatus.EXPIRED;
    }

    if (status === StaffInvitationStatus.ACCEPTED) {
        return EffectiveStaffInvitationStatus.ACCEPTED;
    }

    if (status === StaffInvitationStatus.REVOKED) {
        return EffectiveStaffInvitationStatus.REVOKED;
    }

    return EffectiveStaffInvitationStatus.PENDING;
};

const toInvitationResponse = (
    invitation: StaffInvitationRecord,
    now = new Date()
): StaffInvitationResponse => ({
    id: invitation.id,
    email: invitation.email,
    status: getEffectiveInvitationStatus(invitation.status, invitation.expiresAt, now),
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    revokedAt: invitation.revokedAt,
    createdAt: invitation.createdAt,
    invitedBy: invitation.invitedBy,
});

const invalidInvitationError = () =>
    new AppError(404, 'STAFF_INVITATION_NOT_FOUND', 'Staff invitation is invalid');

const invitationOutcomeError = (outcome: string): AppError => {
    switch (outcome) {
        case 'IDENTITY_MISMATCH':
            return new AppError(
                403,
                'INVITATION_IDENTITY_MISMATCH',
                'Sign in with the email address that received this invitation'
            );
        case 'EXPIRED':
            return new AppError(410, 'STAFF_INVITATION_EXPIRED', 'Staff invitation has expired');
        case 'REVOKED':
            return new AppError(409, 'STAFF_INVITATION_REVOKED', 'Staff invitation was revoked');
        case 'ALREADY_ACCEPTED_BY_ANOTHER_IDENTITY':
            return new AppError(
                409,
                'STAFF_INVITATION_ALREADY_ACCEPTED',
                'Staff invitation has already been accepted'
            );
        case 'IDENTITY_CONFLICT':
            return new AppError(
                409,
                'STAFF_INVITATION_IDENTITY_CONFLICT',
                'This identity conflicts with an existing Pravaah user'
            );
        case 'ADMIN_CONFLICT':
            return new AppError(
                409,
                'STAFF_ALREADY_MEMBER',
                'An Admin account cannot accept a Staff invitation'
            );
        case 'OTHER_CLINIC':
            return new AppError(
                409,
                'USER_ALREADY_BELONGS_TO_ANOTHER_CLINIC',
                'This user already belongs to another clinic'
            );
        case 'SUSPENDED':
            return new AppError(
                409,
                'STAFF_REACTIVATION_REQUIRED',
                'A suspended Staff member must be reactivated by an Admin'
            );
        default:
            return invalidInvitationError();
    }
};

const addDays = (date: Date, days: number): Date => {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

const logStaffEvent = (event: string, details: Record<string, string>): void => {
    const suffix = Object.entries(details)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');

    console.info(`[staff] event=${event}${suffix ? ` ${suffix}` : ''}`);
};

export const staffService = {
    async createInvitation(input: CreateStaffInvitationInput) {
        const email = normalizeEmail(input.email);
        const now = new Date();
        const rawToken = randomBytes(STAFF_INVITATION_TOKEN_BYTES).toString('base64url');
        const tokenHash = hashStaffInvitationToken(rawToken);
        const expiresAt = addDays(now, STAFF_INVITATION_EXPIRY_DAYS);
        const result = await staffRepository.createInvitation({
            clinicId: input.clinicId,
            email,
            tokenHash,
            invitedByUserId: input.invitedBy.id,
            expiresAt,
            now,
        });

        if (result.outcome === 'INVITATION_PENDING') {
            throw new AppError(
                409,
                'STAFF_INVITATION_ALREADY_PENDING',
                'An unexpired Staff invitation is already pending for this email'
            );
        }

        if (result.outcome === 'MEMBER_EXISTS') {
            if (result.user.clinicId !== input.clinicId) {
                throw new AppError(
                    409,
                    'USER_ALREADY_BELONGS_TO_ANOTHER_CLINIC',
                    'This user already belongs to another clinic'
                );
            }

            if (
                result.user.role === UserRole.STAFF &&
                result.user.status === UserStatus.SUSPENDED
            ) {
                throw new AppError(
                    409,
                    'STAFF_REACTIVATION_REQUIRED',
                    'This Staff member is suspended; use Reactivate instead'
                );
            }

            throw new AppError(
                409,
                'STAFF_ALREADY_MEMBER',
                'A clinic member already uses this email'
            );
        }

        const inviteUrl = new URL(`/invite/${rawToken}`, env.clientUrl).toString();
        const invitation = toInvitationResponse(result.invitation, now);

        logStaffEvent('staff.invitation.created', {
            invitationId: invitation.id,
            clinicId: input.clinicId,
        });

        return { invitation, inviteUrl };
    },

    async listMembers(clinicId: string) {
        return staffRepository.listClinicMembers(clinicId);
    },

    async listInvitations(clinicId: string) {
        const now = new Date();
        const invitations = await staffRepository.listClinicInvitations(clinicId);

        return invitations.map((invitation) => toInvitationResponse(invitation, now));
    },

    async previewInvitation(rawToken: string, clerkUserId: string) {
        const identity = await clerkIdentityService.getTrustedUserIdentity(clerkUserId);
        const normalizedEmail = normalizeEmail(identity.email);
        const invitation = await staffRepository.findInvitationByTokenHash(
            hashStaffInvitationToken(rawToken)
        );

        if (!invitation) {
            throw invalidInvitationError();
        }

        if (invitation.email !== normalizedEmail) {
            throw invitationOutcomeError('IDENTITY_MISMATCH');
        }

        return {
            id: invitation.id,
            clinic: { name: invitation.clinic.name },
            email: invitation.email,
            status: getEffectiveInvitationStatus(invitation.status, invitation.expiresAt),
            expiresAt: invitation.expiresAt,
        };
    },

    async acceptInvitation(
        rawToken: string,
        clerkUserId: string
    ): Promise<AcceptStaffInvitationResponse> {
        const identity = await clerkIdentityService.getTrustedUserIdentity(clerkUserId);
        const normalizedEmail = normalizeEmail(identity.email);
        const now = new Date();
        const result = await staffRepository.acceptInvitation({
            tokenHash: hashStaffInvitationToken(rawToken),
            identity: { ...identity, email: normalizedEmail },
            normalizedEmail,
            now,
        });

        if (result.outcome !== 'ACCEPTED' && result.outcome !== 'ALREADY_ACCEPTED') {
            throw invitationOutcomeError(result.outcome);
        }

        if (result.outcome === 'ACCEPTED') {
            logStaffEvent('staff.invitation.accepted', {
                userId: result.user.id,
                clinicId: result.clinic.id,
            });
        }

        return {
            outcome: result.outcome,
            user: {
                id: result.user.id,
                fullName: result.user.fullName,
                email: result.user.email,
                role: result.user.role,
                status: result.user.status,
                createdAt: result.user.createdAt,
            },
            clinic: result.clinic,
        };
    },

    async revokeInvitation(clinicId: string, invitationId: string) {
        const now = new Date();
        const result = await staffRepository.revokeInvitation({ clinicId, invitationId, now });

        if (result.outcome === 'NOT_FOUND') {
            throw new AppError(404, 'STAFF_INVITATION_NOT_FOUND', 'Staff invitation not found');
        }

        if (result.outcome === 'EXPIRED') {
            throw invitationOutcomeError('EXPIRED');
        }

        if (result.outcome === 'ALREADY_REVOKED') {
            throw new AppError(
                409,
                'STAFF_INVITATION_ALREADY_REVOKED',
                'Staff invitation is already revoked'
            );
        }

        if (result.outcome === 'ALREADY_ACCEPTED') {
            throw invitationOutcomeError('ALREADY_ACCEPTED_BY_ANOTHER_IDENTITY');
        }

        logStaffEvent('staff.invitation.revoked', { invitationId, clinicId });

        return toInvitationResponse(result.invitation, now);
    },

    async updateStaffStatus(input: UpdateStaffStatusInput) {
        const result = await staffRepository.updateStaffStatus(input);

        if (result.outcome === 'NOT_FOUND') {
            throw new AppError(404, 'STAFF_MEMBER_NOT_FOUND', 'Staff member not found');
        }

        if (result.outcome === 'STAFF_REQUIRED') {
            throw new AppError(
                409,
                'STAFF_MEMBER_REQUIRED',
                'Only Staff accounts can be managed through this endpoint'
            );
        }

        if (result.outcome === 'INVALID_TRANSITION') {
            throw new AppError(
                409,
                'STAFF_STATUS_TRANSITION_INVALID',
                'Staff status transition is not allowed'
            );
        }

        logStaffEvent(
            input.status === UserStatus.SUSPENDED ? 'staff.suspended' : 'staff.reactivated',
            { userId: result.user.id, clinicId: input.clinicId }
        );

        return result.user;
    },
};
