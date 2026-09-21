import type { UserRole, UserStatus } from '../../types';

export const StaffInvitationStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REVOKED: 'REVOKED',
    EXPIRED: 'EXPIRED',
} as const;

export type StaffInvitationStatus =
    (typeof StaffInvitationStatus)[keyof typeof StaffInvitationStatus];

export type ClinicTeamMember = {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
};

export type StaffInvitation = {
    id: string;
    email: string;
    status: StaffInvitationStatus;
    expiresAt: string;
    acceptedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
    invitedBy: {
        id: string;
        fullName: string;
    };
};

export type StaffInvitationPreview = {
    id: string;
    clinic: {
        name: string;
    };
    email: string;
    status: StaffInvitationStatus;
    expiresAt: string;
};

export type AcceptStaffInvitationResult = {
    outcome: 'ACCEPTED' | 'ALREADY_ACCEPTED';
    user: ClinicTeamMember;
    clinic: {
        id: string;
        name: string;
    };
};
