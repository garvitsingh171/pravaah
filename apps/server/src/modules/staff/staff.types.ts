import type { StaffInvitationStatus, UserRole, UserStatus } from '../../generated/prisma/client.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

export const STAFF_INVITATION_EXPIRY_DAYS = 7;
export const STAFF_INVITATION_TOKEN_BYTES = 32;

export const EffectiveStaffInvitationStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REVOKED: 'REVOKED',
    EXPIRED: 'EXPIRED',
} as const;

export type EffectiveStaffInvitationStatus =
    (typeof EffectiveStaffInvitationStatus)[keyof typeof EffectiveStaffInvitationStatus];

export type CreateStaffInvitationInput = {
    clinicId: string;
    email: string;
    invitedBy: AuthenticatedUser;
};

export type ManageableStaffStatus = Extract<UserStatus, 'ACTIVE' | 'SUSPENDED'>;

export type UpdateStaffStatusInput = {
    clinicId: string;
    userId: string;
    status: ManageableStaffStatus;
};

export type StaffMemberResponse = {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
};

export type StaffInvitationRecord = {
    id: string;
    clinicId: string;
    email: string;
    status: StaffInvitationStatus;
    expiresAt: Date;
    acceptedAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
    invitedBy: {
        id: string;
        fullName: string;
    };
};

export type StaffInvitationResponse = Omit<StaffInvitationRecord, 'clinicId' | 'status'> & {
    status: EffectiveStaffInvitationStatus;
};

export type AcceptStaffInvitationResponse = {
    outcome: 'ACCEPTED' | 'ALREADY_ACCEPTED';
    user: StaffMemberResponse;
    clinic: {
        id: string;
        name: string;
    };
};
