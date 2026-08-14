import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from './App';
import { renderWithProviders } from './test/renderWithProviders';
import { setClerkSignedIn, setClerkSignedOut } from './test/mocks/clerk';

const mockGetOnboardingStatus = vi.hoisted(() => vi.fn());

vi.mock('./features/onboarding/onboardingApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./features/onboarding/onboardingApi')>();

    return {
        ...actual,
        getOnboardingStatus: mockGetOnboardingStatus,
    };
});

describe('App routes', () => {
    it('renders the public landing page for signed-out visitors without requesting onboarding status', async () => {
        setClerkSignedOut();

        renderWithProviders(<AppRoutes />, {
            route: '/',
        });

        expect(
            await screen.findByRole('heading', {
                name: /keep your clinic day moving/i,
            })
        ).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /^sign in$/i })[0]).toHaveAttribute(
            'href',
            '/login'
        );
        expect(screen.getAllByRole('link', { name: /^explore pravaah$/i })[0]).toHaveAttribute(
            'href',
            '/sign-up'
        );
        expect(mockGetOnboardingStatus).not.toHaveBeenCalled();
    });

    it('routes the public logo home for signed-out visitors', async () => {
        setClerkSignedOut();

        renderWithProviders(<AppRoutes />, {
            route: '/',
        });

        expect(
            await screen.findByRole('heading', {
                name: /keep your clinic day moving/i,
            })
        ).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /pravaah home/i })[0]).toHaveAttribute(
            'href',
            '/'
        );
    });

    it('routes the public logo to the dashboard for signed-in users', async () => {
        setClerkSignedIn();

        renderWithProviders(<AppRoutes />, {
            route: '/',
        });

        expect(
            await screen.findByRole('heading', {
                name: /keep your clinic day moving/i,
            })
        ).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /pravaah home/i })[0]).toHaveAttribute(
            'href',
            '/dashboard'
        );
    });
});
