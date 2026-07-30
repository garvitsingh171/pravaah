import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import FirstRunSetupChecklist from './FirstRunSetupChecklist';
import {
    setupAllComplete,
    setupNoneComplete,
    setupPartiallyComplete,
} from '../../../test/fixtures/onboarding';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('FirstRunSetupChecklist', () => {
    it('shows no completed steps and all incomplete actions', () => {
        renderWithProviders(<FirstRunSetupChecklist setup={setupNoneComplete} />);

        expect(screen.getByText('0 of 4 steps completed')).toBeInTheDocument();
        expect(screen.getByText('0% complete')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /complete clinic settings/i })).toHaveAttribute(
            'href',
            '/clinic-settings'
        );
        expect(screen.getByRole('link', { name: /add doctor/i })).toHaveAttribute(
            'href',
            '/doctors'
        );
        expect(screen.getByRole('link', { name: /add patient/i })).toHaveAttribute(
            'href',
            '/patients'
        );
        expect(screen.getByRole('link', { name: /book appointment/i })).toHaveAttribute(
            'href',
            '/appointments'
        );
    });

    it('shows partial completion with actions only for incomplete items', () => {
        renderWithProviders(<FirstRunSetupChecklist setup={setupPartiallyComplete} />);

        expect(screen.getByText('2 of 4 steps completed')).toBeInTheDocument();
        expect(screen.getByText('50% complete')).toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /complete clinic settings/i })
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /add doctor/i })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /add patient/i })).toHaveAttribute(
            'href',
            '/patients'
        );
        expect(screen.getByRole('link', { name: /book appointment/i })).toHaveAttribute(
            'href',
            '/appointments'
        );
    });

    it('shows full completion and dismisses only for the component lifetime', async () => {
        const user = userEvent.setup();

        renderWithProviders(<FirstRunSetupChecklist setup={setupAllComplete} />);

        expect(screen.getByText('4 of 4 steps completed')).toBeInTheDocument();
        expect(screen.getByText('100% complete')).toBeInTheDocument();
        expect(screen.getByText('Initial setup is complete.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /dismiss/i }));

        expect(screen.queryByText('First-run setup')).not.toBeInTheDocument();
    });

    it('exposes accessible progress metadata', () => {
        renderWithProviders(<FirstRunSetupChecklist setup={setupPartiallyComplete} />);

        const progressbar = screen.getByRole('progressbar', {
            name: /first-run clinic setup progress/i,
        });

        expect(progressbar).toHaveAttribute('aria-valuenow', '2');
        expect(progressbar).toHaveAttribute('aria-valuemin', '0');
        expect(progressbar).toHaveAttribute('aria-valuemax', '4');
        expect(progressbar).toHaveAttribute('aria-valuetext', '2 of 4 steps completed');
    });
});
