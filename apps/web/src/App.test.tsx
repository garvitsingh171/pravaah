import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    it('loads the protected route boundary and sends signed-out users to sign-in', async () => {
        setClerkSignedOut();
        renderWithProviders(<AppRoutes />, { route: '/dashboard' });

        expect(
            await screen.findByRole('heading', { name: 'Sign in to Pravaah' }, { timeout: 5000 })
        ).toBeInTheDocument();
        expect(mockGetOnboardingStatus).not.toHaveBeenCalled();
    });

    it('opens and closes the public menu with keyboard access', async () => {
        setClerkSignedOut();
        const user = userEvent.setup();
        renderWithProviders(<AppRoutes />, { route: '/' });

        const menu = await screen.findByRole('button', { name: 'Menu' }, { timeout: 5000 });
        await user.click(menu);
        const productLink = screen.getByRole('link', { name: 'Product' });
        productLink.focus();
        expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute(
            'aria-expanded',
            'true'
        );
        await user.keyboard('{Escape}');
        expect(menu).toHaveFocus();
        expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
            'aria-expanded',
            'false'
        );
    });

    it('renders the public landing page for signed-out visitors without requesting onboarding status', async () => {
        setClerkSignedOut();

        renderWithProviders(<AppRoutes />, {
            route: '/',
        });

        expect(
            await screen.findByRole('heading', {
                name: /from appointment to consultation. keep your clinic moving/i,
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
                name: /from appointment to consultation. keep your clinic moving/i,
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
                name: /from appointment to consultation. keep your clinic moving/i,
            })
        ).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /pravaah home/i })[0]).toHaveAttribute(
            'href',
            '/dashboard'
        );
    });
});
