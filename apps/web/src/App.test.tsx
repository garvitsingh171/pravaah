import { screen, within } from '@testing-library/react';
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

        await screen.findByRole('heading', { name: /better patient flow/i }, { timeout: 10000 });
        const menu = document.querySelector<HTMLButtonElement>('.m-menu-button')!;
        await user.click(menu);
        const productLink = within(
            screen.getByRole('navigation', { name: 'Main navigation' })
        ).getByRole('link', { name: 'Product' });
        productLink.focus();
        expect(menu).toHaveAttribute('aria-expanded', 'true');
        await user.keyboard('{Escape}');
        expect(menu).toHaveFocus();
        expect(menu).toHaveAttribute('aria-expanded', 'false');
    }, 15000);

    it('renders the public landing page for signed-out visitors without requesting onboarding status', async () => {
        setClerkSignedOut();

        renderWithProviders(<AppRoutes />, {
            route: '/',
        });

        expect(
            await screen.findByRole('heading', {
                name: /better patient flow/i,
            })
        ).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /^sign in$/i })[0]).toHaveAttribute(
            'href',
            '/login'
        );
        expect(screen.getByRole('link', { name: /explore pravaah/i })).toHaveAttribute(
            'href',
            '/product'
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
                name: /better patient flow/i,
            })
        ).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /pravaah home/i })[0]).toHaveAttribute(
            'href',
            '/'
        );
    });

    it('keeps marketing navigation available for signed-in users', async () => {
        setClerkSignedIn();

        renderWithProviders(<AppRoutes />, {
            route: '/',
        });

        expect(
            await screen.findByRole('heading', {
                name: /better patient flow/i,
            })
        ).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /pravaah home/i })[0]).toHaveAttribute(
            'href',
            '/'
        );
        expect(screen.getAllByRole('link', { name: /workspace/i })[0]).toHaveAttribute(
            'href',
            '/dashboard'
        );
    });

    it('opens a feature page directly without requesting onboarding status', async () => {
        setClerkSignedOut();
        renderWithProviders(<AppRoutes />, { route: '/features/live-queue' });
        expect(
            await screen.findByRole('heading', { name: 'Clarity for every patient waiting.' })
        ).toBeInTheDocument();
        expect(mockGetOnboardingStatus).not.toHaveBeenCalled();
    });

    it('filters FAQ questions by search term', async () => {
        setClerkSignedOut();
        const user = userEvent.setup();
        renderWithProviders(<AppRoutes />, { route: '/faq' });

        const search = await screen.findByRole('searchbox', { name: 'Search questions' });
        await user.type(search, 'reorder');
        expect(screen.getByText('How does the live queue work?')).toBeInTheDocument();
        expect(screen.queryByText('What is Pravaah?')).not.toBeInTheDocument();
    });
});
