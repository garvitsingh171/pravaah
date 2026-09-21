import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { setClerkSignedIn, setClerkSignedOut } from '../../test/mocks/clerk';
import { ApiClientError } from '../../lib';
import StaffInvitationPage from './StaffInvitationPage';
import { StaffInvitationStatus } from './staffTypes';

const mockPreviewStaffInvitation = vi.hoisted(() => vi.fn());
const mockAcceptStaffInvitation = vi.hoisted(() => vi.fn());

vi.mock('./staffApi', () => ({
    previewStaffInvitation: mockPreviewStaffInvitation,
    acceptStaffInvitation: mockAcceptStaffInvitation,
}));

const preview = {
    id: 'invite-id',
    clinic: { name: 'Pravaah Family Clinic' },
    email: 'staff@example.com',
    status: StaffInvitationStatus.PENDING,
    expiresAt: '2099-01-08T00:00:00.000Z',
};

const renderPage = () =>
    renderWithProviders(
        <Routes>
            <Route path="/invite/:token" element={<StaffInvitationPage />} />
            <Route path="/dashboard" element={<div>Dashboard opened</div>} />
        </Routes>,
        { route: '/invite/secure-token-value-that-is-long-enough' }
    );

describe('StaffInvitationPage', () => {
    beforeEach(() => {
        mockPreviewStaffInvitation.mockResolvedValue({ invitation: preview });
        mockAcceptStaffInvitation.mockResolvedValue({
            outcome: 'ACCEPTED',
            user: {},
            clinic: { id: 'clinic-id', name: preview.clinic.name },
        });
    });

    it('keeps the invitation path through sign-in and sign-up while signed out', async () => {
        setClerkSignedOut();
        renderPage();

        const returnPath = encodeURIComponent('/invite/secure-token-value-that-is-long-enough');
        expect(await screen.findByRole('link', { name: /sign in to continue/i })).toHaveAttribute(
            'href',
            `/login?redirect_url=${returnPath}`
        );
        expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute(
            'href',
            `/sign-up?redirect_url=${returnPath}`
        );
        expect(mockPreviewStaffInvitation).not.toHaveBeenCalled();
    });

    it('shows a deliberate acceptance step and enters the normal application after success', async () => {
        setClerkSignedIn();
        const user = userEvent.setup();
        renderPage();

        expect(
            await screen.findByRole('heading', { name: /join pravaah family clinic as staff/i })
        ).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /join clinic/i }));

        await waitFor(() => expect(mockAcceptStaffInvitation).toHaveBeenCalledTimes(1));
        expect(await screen.findByText('Dashboard opened')).toBeInTheDocument();
    });

    it('shows the identity mismatch state without accepting', async () => {
        setClerkSignedIn();
        mockPreviewStaffInvitation.mockRejectedValue(
            new ApiClientError({
                code: 'INVITATION_IDENTITY_MISMATCH',
                message: 'Sign in with the invited email address',
                status: 403,
            })
        );
        renderPage();

        expect(await screen.findByText(/use the invited account/i)).toBeInTheDocument();
        expect(screen.getByText('INVITATION_IDENTITY_MISMATCH')).toBeInTheDocument();
        expect(mockAcceptStaffInvitation).not.toHaveBeenCalled();
    });
});
