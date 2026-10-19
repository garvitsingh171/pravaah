import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { StaffInvitationStatus, UserRole, UserStatus } from '../../generated/prisma/client.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { normalizeEmail } from '../../utils/emailNormalization.js';
import { clerkIdentityService } from '../auth/clerkIdentity.service.js';
import { staffRepository } from './staff.repository.js';
import { emailService } from '../../services/email/email.service.js';
import {
    EffectiveStaffInvitationStatus,
    STAFF_INVITATION_EXPIRY_DAYS,
    STAFF_INVITATION_EMAIL_ATTEMPT_LEASE_MS,
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
): StaffInvitationResponse => {
    const emailSending = Boolean(
        invitation.emailAttemptId &&
        invitation.emailAttemptStartedAt &&
        invitation.emailAttemptStartedAt.getTime() >
            now.getTime() - STAFF_INVITATION_EMAIL_ATTEMPT_LEASE_MS
    );
    return {
        id: invitation.id,
        email: invitation.email,
        status: getEffectiveInvitationStatus(invitation.status, invitation.expiresAt, now),
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt,
        revokedAt: invitation.revokedAt,
        createdAt: invitation.createdAt,
        invitedBy: invitation.invitedBy,
        emailStatus:
            !emailSending && invitation.emailAttemptId && invitation.emailStatus === 'NOT_SENT'
                ? 'FAILED'
                : invitation.emailStatus,
        emailSubmittedAt: invitation.emailSubmittedAt,
        emailProviderMessageId: invitation.emailProviderMessageId,
        emailSending,
    };
};

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
        case 'REMOVED':
            return new AppError(
                409,
                'STAFF_RESTORATION_REQUIRED',
                'A removed Staff member must be restored by an Admin'
            );
        case 'CLINIC_INACTIVE':
            return new AppError(
                409,
                'CLINIC_INACTIVE',
                'This clinic is inactive. Ask an Admin to restore it before accepting the invitation.'
            );
        default:
            return invalidInvitationError();
    }
};

const addDays = (date: Date, days: number): Date => {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

const logStaffEvent = (event: string, details: Record<string, string>): void => {
    console.info(JSON.stringify({ event, timestamp: new Date().toISOString(), ...details }));
};

export const staffService = {
    async createInvitation(input: CreateStaffInvitationInput) {
        const email = normalizeEmail(input.email);
        const now = new Date();
        const rawToken = randomBytes(STAFF_INVITATION_TOKEN_BYTES).toString('base64url');
        const tokenHash = hashStaffInvitationToken(rawToken);
        const emailAttemptId = randomUUID();
        const expiresAt = addDays(now, STAFF_INVITATION_EXPIRY_DAYS);
        logStaffEvent('staff.invitation.create.started', {
            clinicId: input.clinicId,
            actorUserId: input.invitedBy.id,
        });
        let result: Awaited<ReturnType<typeof staffRepository.createInvitation>>;
        try {
            result = await staffRepository.createInvitation({
                clinicId: input.clinicId,
                email,
                tokenHash,
                invitedByUserId: input.invitedBy.id,
                expiresAt,
                now,
                emailAttemptId,
                emailAttemptStartedAt: now,
            });
        } catch (error) {
            logStaffEvent('staff.invitation.create.failed', {
                clinicId: input.clinicId,
                stage: 'database',
                errorName: error instanceof Error ? error.name : 'UnknownError',
            });
            throw error;
        }

        if (result.outcome === 'INVITATION_PENDING') {
            throw new AppError(
                409,
                'STAFF_INVITATION_ALREADY_PENDING',
                'An unexpired Staff invitation is already pending for this email'
            );
        }

        if (result.outcome === 'RATE_LIMITED') {
            throw new AppError(
                429,
                'STAFF_INVITATION_RATE_LIMITED',
                'Invitation limit reached. Try again later.'
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

            if (result.user.role === UserRole.STAFF && result.user.status === UserStatus.REMOVED) {
                throw new AppError(
                    409,
                    'STAFF_RESTORATION_REQUIRED',
                    'This Staff member was removed; use Restore instead'
                );
            }

            throw new AppError(
                409,
                'STAFF_ALREADY_MEMBER',
                'A clinic member already uses this email'
            );
        }

        logStaffEvent('staff.invitation.create.succeeded', {
            invitationId: result.invitation.id,
            clinicId: input.clinicId,
        });
        const inviteUrl = new URL(`/invite/${rawToken}`, env.clientUrl).toString();
        const emailResult = await emailService.sendStaffInvitation({
            invitationId: result.invitation.id,
            email,
            clinicName: result.invitation.clinic.name,
            expiresAt,
            inviteUrl,
        });
        const savedInvitation = await staffRepository.updateInvitationEmailResult({
            invitationId: result.invitation.id,
            emailAttemptId,
            actorUserId: input.invitedBy.id,
            emailStatus: emailResult.status,
            submittedAt: emailResult.submittedAt,
            providerMessageId: emailResult.providerMessageId,
        });
        const invitation = toInvitationResponse(savedInvitation.invitation, now);

        logStaffEvent('staff.invitation.created', {
            invitationId: invitation.id,
            clinicId: input.clinicId,
        });

        return { invitation };
    },

    async resendInvitation(clinicId: string, invitationId: string, actorUserId: string) {
        const rawToken = randomBytes(STAFF_INVITATION_TOKEN_BYTES).toString('base64url');
        const emailAttemptId = randomUUID();
        const result = await staffRepository.prepareInvitationResend({
            clinicId,
            invitationId,
            actorUserId,
            tokenHash: hashStaffInvitationToken(rawToken),
            emailAttemptId,
            now: new Date(),
        });
        if (result.outcome === 'NOT_FOUND') {
            throw new AppError(404, 'STAFF_INVITATION_NOT_FOUND', 'Staff invitation not found');
        }
        if (result.outcome === 'RATE_LIMITED') {
            throw new AppError(
                429,
                'STAFF_INVITATION_RATE_LIMITED',
                'Invitation email limit reached. Try again later.'
            );
        }
        if (result.outcome === 'EXPIRED') throw invitationOutcomeError('EXPIRED');
        if (result.outcome === 'NOT_PENDING') {
            throw new AppError(
                409,
                'STAFF_INVITATION_NOT_PENDING',
                'Only pending invitations can be resent'
            );
        }
        if (result.outcome === 'IN_PROGRESS') {
            throw new AppError(
                409,
                'STAFF_INVITATION_EMAIL_IN_PROGRESS',
                'An invitation email is already being submitted. Please wait before retrying.'
            );
        }
        const inviteUrl = new URL(`/invite/${rawToken}`, env.clientUrl).toString();
        const emailResult = await emailService.sendStaffInvitation({
            invitationId,
            email: result.invitation.email,
            clinicName: result.invitation.clinic.name,
            expiresAt: result.invitation.expiresAt,
            inviteUrl,
        });
        const savedInvitation = await staffRepository.updateInvitationEmailResult({
            invitationId,
            emailAttemptId,
            actorUserId,
            emailStatus: emailResult.status,
            submittedAt: emailResult.submittedAt,
            providerMessageId: emailResult.providerMessageId,
        });
        const invitation = toInvitationResponse(savedInvitation.invitation);
        logStaffEvent('staff.invitation.resent', {
            invitationId,
            clinicId,
            emailStatus: invitation.emailStatus,
        });
        return {
            invitation,
            emailStatus: invitation.emailStatus,
        };
    },

    async listMembers(clinicId: string) {
        return staffRepository.listClinicMembers(clinicId);
    },

    async getMember(clinicId: string, userId: string) {
        const member = await staffRepository.findClinicMember(clinicId, userId);
        if (!member) throw new AppError(404, 'STAFF_MEMBER_NOT_FOUND', 'Team member not found');
        return member;
    },

    async updateMemberProfile(input: {
        clinicId: string;
        userId: string;
        actorUserId: string;
        fullName?: string;
        phone?: string | null;
    }) {
        const result = await staffRepository.updateStaffProfile(input);
        if (result.outcome === 'NOT_FOUND')
            throw new AppError(404, 'STAFF_MEMBER_NOT_FOUND', 'Team member not found');
        if (result.outcome === 'STAFF_REQUIRED')
            throw new AppError(
                403,
                'STAFF_MEMBER_REQUIRED',
                'Admin profiles cannot be changed here'
            );
        if (result.outcome === 'REMOVED')
            throw new AppError(
                409,
                'STAFF_MEMBER_REMOVED',
                'Restore this Staff member before editing'
            );
        return result.user;
    },

    async setMemberRemoved(input: {
        clinicId: string;
        userId: string;
        actorUserId: string;
        restore: boolean;
    }) {
        const result = await staffRepository.setStaffRemoved(input);
        if (result.outcome === 'NOT_FOUND')
            throw new AppError(404, 'STAFF_MEMBER_NOT_FOUND', 'Team member not found');
        if (result.outcome === 'STAFF_REQUIRED')
            throw new AppError(
                403,
                'STAFF_MEMBER_REQUIRED',
                'Admin accounts cannot be removed here'
            );
        if (result.outcome === 'INVALID_TRANSITION')
            throw new AppError(
                409,
                'STAFF_STATUS_TRANSITION_INVALID',
                'Staff access has already changed. Refresh the list.'
            );
        return result.user;
    },

    async listInvitations(clinicId: string) {
        const now = new Date();
        const invitations = await staffRepository.listClinicInvitations(clinicId);

        return invitations.map((invitation) => toInvitationResponse(invitation, now));
    },

    async previewInvitation(rawToken: string, clerkUserId: string) {
        const identity = await clerkIdentityService.getVerifiedUserIdentity(clerkUserId);
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
        const identity = await clerkIdentityService.getVerifiedUserIdentity(clerkUserId);
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
            clinic: { id: result.clinic.id, name: result.clinic.name },
        };
    },

    async revokeInvitation(clinicId: string, invitationId: string, actorUserId: string) {
        const now = new Date();
        const result = await staffRepository.revokeInvitation({
            clinicId,
            invitationId,
            actorUserId,
            now,
        });

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
