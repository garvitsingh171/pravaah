import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from './App';
import { renderWithProviders } from './test/renderWithProviders';
import { setClerkSignedOut } from './test/mocks/clerk';

const mockGetOnboardingStatus = vi.hoisted(() => vi.fn());

vi.mock('./features/onboarding/onboardingApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./features/onboarding/onboardingApi')>();

    return {
        ...actual,
        getOnboardingStatus: mockGetOnboardingStatus,
    };
});

describe('App routes', () => {
    it('renders the public landing page for signed-out visitors without requesting onboarding status', () => {
        setClerkSignedOut();

        renderWithProviders(<AppRoutes />, {
            route: '/',
        });

        expect(
            screen.getByRole('heading', {
                name: /pravaah helps clinics manage appointments, queues, and explainable no-show risk/i,
            })
        ).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /^sign in$/i })[0]).toHaveAttribute(
            'href',
            '/login'
        );
        expect(screen.getAllByRole('link', { name: /^start onboarding$/i })[0]).toHaveAttribute(
            'href',
            '/sign-up'
        );
        expect(mockGetOnboardingStatus).not.toHaveBeenCalled();
    });
});
