import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, adminActiveClinic } from '../../test/renderWithProviders';
import { UserRole, UserStatus } from '../../types';
import StaffManagementPage from './StaffManagementPage';
import { StaffInvitationStatus } from './staffTypes';

const mockListClinicTeam = vi.hoisted(() => vi.fn());
const mockListStaffInvitations = vi.hoisted(() => vi.fn());
const mockCreateStaffInvitation = vi.hoisted(() => vi.fn());
const mockRevokeStaffInvitation = vi.hoisted(() => vi.fn());
const mockUpdateStaffStatus = vi.hoisted(() => vi.fn());

vi.mock('./staffApi', () => ({
    listClinicTeam: mockListClinicTeam,
    listStaffInvitations: mockListStaffInvitations,
    createStaffInvitation: mockCreateStaffInvitation,
    revokeStaffInvitation: mockRevokeStaffInvitation,
    updateStaffStatus: mockUpdateStaffStatus,
}));

const admin = {
    id: 'admin-id',
    fullName: 'Clinic Admin',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: '2026-01-01T00:00:00.000Z',
};

const staff = {
    id: 'staff-id',
    fullName: 'Front Desk Staff',
    email: 'staff@example.com',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    createdAt: '2026-02-01T00:00:00.000Z',
};

describe('StaffManagementPage', () => {
    beforeEach(() => {
        mockListClinicTeam.mockResolvedValue({ members: [admin, staff] });
        mockListStaffInvitations.mockResolvedValue({ invitations: [] });
    });

    it('shows the protected Admin row and confirms before suspending Staff', async () => {
        const user = userEvent.setup();
        mockUpdateStaffStatus.mockResolvedValue({
            member: { ...staff, status: UserStatus.SUSPENDED },
        });
        renderWithProviders(<StaffManagementPage />, { activeClinic: adminActiveClinic });

        expect(await screen.findByText('Clinic Admin')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Suspend' })).toHaveLength(1);
        await user.click(screen.getByRole('button', { name: 'Suspend' }));
        expect(screen.getByRole('dialog')).toHaveTextContent(
            'They will lose access to this clinic immediately'
        );
        await user.click(screen.getByRole('button', { name: /suspend staff/i }));

        await waitFor(() =>
            expect(mockUpdateStaffStatus).toHaveBeenCalledWith(
                adminActiveClinic.clinicId,
                staff.id,
                UserStatus.SUSPENDED
            )
        );
        expect(screen.getByRole('button', { name: 'Reactivate' })).toBeInTheDocument();
    });

    it('creates an invitation and shows its one-time copy link without claiming email delivery', async () => {
        const user = userEvent.setup();
        const createdInvitation = {
            id: 'invite-id',
            email: 'newstaff@example.com',
            status: StaffInvitationStatus.PENDING,
            expiresAt: '2099-01-08T00:00:00.000Z',
            acceptedAt: null,
            revokedAt: null,
            createdAt: '2099-01-01T00:00:00.000Z',
            invitedBy: { id: admin.id, fullName: admin.fullName },
        };
        mockCreateStaffInvitation.mockResolvedValue({
            invitation: createdInvitation,
            inviteUrl: 'https://app.example/invite/secret',
        });
        renderWithProviders(<StaffManagementPage />, { activeClinic: adminActiveClinic });

        await screen.findByText('Clinic Admin');
        await user.type(screen.getByLabelText(/email address/i), ' NewStaff@Example.com ');
        await user.click(screen.getByRole('button', { name: /create invitation/i }));

        await waitFor(() =>
            expect(mockCreateStaffInvitation).toHaveBeenCalledWith(
                adminActiveClinic.clinicId,
                'newstaff@example.com'
            )
        );
        expect(screen.getByText('Invitation created')).toBeInTheDocument();
        expect(screen.getByLabelText('Invitation link')).toHaveValue(
            'https://app.example/invite/secret'
        );
        expect(screen.queryByText(/invitation sent/i)).not.toBeInTheDocument();
    });
});
