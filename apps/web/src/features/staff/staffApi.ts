import { apiClient } from '../../lib';
import type {
    AcceptStaffInvitationResult,
    ClinicTeamMember,
    StaffInvitation,
    StaffInvitationPreview,
} from './staffTypes';

export const listClinicTeam = (clinicId: string, signal?: AbortSignal) => {
    return apiClient.get<{ members: ClinicTeamMember[] }>(
        `/clinics/${encodeURIComponent(clinicId)}/staff`,
        { signal }
    );
};

export const listStaffInvitations = (clinicId: string, signal?: AbortSignal) => {
    return apiClient.get<{ invitations: StaffInvitation[] }>(
        `/clinics/${encodeURIComponent(clinicId)}/staff/invitations`,
        { signal }
    );
};

export const createStaffInvitation = (clinicId: string, email: string) => {
    return apiClient.post<{ invitation: StaffInvitation; inviteUrl: string }>(
        `/clinics/${encodeURIComponent(clinicId)}/staff/invitations`,
        { email }
    );
};

export const revokeStaffInvitation = (clinicId: string, invitationId: string) => {
    return apiClient.patch<{ invitation: StaffInvitation }>(
        `/clinics/${encodeURIComponent(clinicId)}/staff/invitations/${encodeURIComponent(
            invitationId
        )}/revoke`,
        {}
    );
};

export const updateStaffStatus = (
    clinicId: string,
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED'
) => {
    return apiClient.patch<{ member: ClinicTeamMember }>(
        `/clinics/${encodeURIComponent(clinicId)}/staff/${encodeURIComponent(userId)}/status`,
        { status }
    );
};

export const previewStaffInvitation = (token: string, signal?: AbortSignal) => {
    return apiClient.get<{ invitation: StaffInvitationPreview }>(
        `/staff/invitations/${encodeURIComponent(token)}`,
        { signal }
    );
};

export const acceptStaffInvitation = (token: string) => {
    return apiClient.post<AcceptStaffInvitationResult>(
        `/staff/invitations/${encodeURIComponent(token)}/accept`,
        {}
    );
};
