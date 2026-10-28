import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../types';
import { adminActiveClinic, renderWithProviders } from '../../test/renderWithProviders';
import StaffManagementPage from './StaffManagementPage';

const api = vi.hoisted(() => ({
    listClinicTeam: vi.fn(),
    listStaffInvitations: vi.fn(),
    createStaffInvitation: vi.fn(),
    resendStaffInvitation: vi.fn(),
    getStaffMember: vi.fn(),
    updateStaffProfile: vi.fn(),
    removeStaffMember: vi.fn(),
    restoreStaffMember: vi.fn(),
}));

vi.mock('./staffApi', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./staffApi')>()),
    ...api,
}));

const staff = {
    id: '10000000-0000-4000-8000-000000000001',
    fullName: 'Asha Staff',
    email: 'asha@example.test',
    phone: null,
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    createdAt: '2026-01-01T00:00:00.000Z',
};

describe('StaffManagementPage lifecycle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.listClinicTeam.mockResolvedValue({ members: [staff] });
        api.listStaffInvitations.mockResolvedValue({ invitations: [] });
        api.getStaffMember.mockResolvedValue({ member: staff });
    });

    it('focuses the invitation email and associates a validation error', async () => {
        const user = userEvent.setup();
        renderWithProviders(<StaffManagementPage />, { activeClinic: adminActiveClinic });
        await user.click(await screen.findByRole('button', { name: 'Send invitation' }));
        const email = screen.getByRole('textbox', { name: 'Email address' });
        expect(email).toHaveFocus();
        expect(email).toHaveAccessibleName('Email address');
        expect(email).toHaveAttribute('aria-invalid', 'true');
        expect(email).toHaveAccessibleDescription('Enter a valid staff email address.');
        expect(api.createStaffInvitation).not.toHaveBeenCalled();
    });

    it('loads details and saves only editable profile fields', async () => {
        const user = userEvent.setup();
        api.updateStaffProfile.mockResolvedValue({
            member: { ...staff, fullName: 'Asha Raman', phone: '1234567890' },
        });
        renderWithProviders(<StaffManagementPage />, { activeClinic: adminActiveClinic });

        await user.click(await screen.findByRole('button', { name: 'Details / Edit' }));
        expect(api.getStaffMember).toHaveBeenCalledWith(adminActiveClinic.clinicId, staff.id);
        await user.clear(screen.getByLabelText('Full name'));
        await user.type(screen.getByLabelText('Full name'), 'Asha Raman');
        await user.type(screen.getByLabelText('Phone'), '1234567890');
        await user.click(screen.getByRole('button', { name: 'Save changes' }));

        await waitFor(() =>
            expect(api.updateStaffProfile).toHaveBeenCalledWith(
                adminActiveClinic.clinicId,
                staff.id,
                {
                    fullName: 'Asha Raman',
                    phone: '1234567890',
                }
            )
        );
    });

    it('requires confirmation before removing clinic access', async () => {
        const user = userEvent.setup();
        api.removeStaffMember.mockResolvedValue({
            member: { ...staff, status: UserStatus.REMOVED },
        });
        renderWithProviders(<StaffManagementPage />, { activeClinic: adminActiveClinic });

        await user.click(await screen.findByRole('button', { name: 'Remove' }));
        expect(api.removeStaffMember).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Remove staff' }));

        await waitFor(() =>
            expect(api.removeStaffMember).toHaveBeenCalledWith(adminActiveClinic.clinicId, staff.id)
        );
        expect(await screen.findByRole('button', { name: 'Restore' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Restore' })).toBeVisible();
    });

    it('filters members by name and status', async () => {
        const user = userEvent.setup();
        api.listClinicTeam.mockResolvedValue({
            members: [
                staff,
                { ...staff, id: 'other', fullName: 'Bela Staff', status: UserStatus.REMOVED },
            ],
        });
        renderWithProviders(<StaffManagementPage />, { activeClinic: adminActiveClinic });

        expect(await screen.findByText('Asha Staff')).toBeVisible();
        await user.type(screen.getByRole('textbox', { name: 'Search team' }), 'Bela');
        expect(screen.queryByText('Asha Staff')).not.toBeInTheDocument();
        expect(screen.getByText('Bela Staff')).toBeVisible();
        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Filter team by status' }),
            'ACTIVE'
        );
        expect(screen.queryByText('Bela Staff')).not.toBeInTheDocument();
        expect(screen.getByText('No team members match these filters.')).toBeVisible();
    });

    it('sends an invitation and displays the provider submission state', async () => {
        const user = userEvent.setup();
        const submittedInvitation = {
            id: 'invite-id',
            email: 'new.staff@example.test',
            status: 'PENDING',
            expiresAt: '2026-10-26T00:00:00.000Z',
            acceptedAt: null,
            revokedAt: null,
            createdAt: '2026-10-19T00:00:00.000Z',
            invitedBy: { id: 'admin-id', fullName: 'Clinic Admin' },
            emailStatus: 'SUBMITTED',
            emailSubmittedAt: '2026-10-19T00:00:00.000Z',
            emailProviderMessageId: 'resend-message-id',
            emailSending: false,
        };
        api.listStaffInvitations
            .mockResolvedValueOnce({ invitations: [] })
            .mockResolvedValueOnce({ invitations: [submittedInvitation] });
        api.createStaffInvitation.mockResolvedValue({ invitation: submittedInvitation });
        api.resendStaffInvitation.mockResolvedValue({
            invitation: submittedInvitation,
            emailStatus: 'SUBMITTED',
        });
        renderWithProviders(<StaffManagementPage />, { activeClinic: adminActiveClinic });
        await user.type(await screen.findByLabelText('Email address'), 'New.Staff@example.test');
        await user.click(screen.getByRole('button', { name: 'Send invitation' }));
        await waitFor(() =>
            expect(api.createStaffInvitation).toHaveBeenCalledWith(
                adminActiveClinic.clinicId,
                'new.staff@example.test'
            )
        );
        expect(api.listStaffInvitations).toHaveBeenCalledTimes(2);
        expect(await screen.findByText('new.staff@example.test')).toBeVisible();
        expect(screen.getByText('Email submitted')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Resend email' }));
        await waitFor(() =>
            expect(api.resendStaffInvitation).toHaveBeenCalledWith(
                adminActiveClinic.clinicId,
                'invite-id'
            )
        );
    });
});
