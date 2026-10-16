import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../types';
import { adminActiveClinic, renderWithProviders } from '../../test/renderWithProviders';
import StaffManagementPage from './StaffManagementPage';

const api = vi.hoisted(() => ({
    listClinicTeam: vi.fn(),
    listStaffInvitations: vi.fn(),
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
});
