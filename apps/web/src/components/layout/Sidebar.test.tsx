import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import Sidebar from './Sidebar';
import { renderWithProviders } from '../../test/renderWithProviders';
import { getNavigationRoutesForRole } from '../../routes/dashboardRoutes';
import { UserRole } from '../../types';

const renderSidebar = () =>
    renderWithProviders(
        <Sidebar
            navigationItems={getNavigationRoutesForRole(UserRole.STAFF)}
            clinicName="Demo Clinic"
            clinicMeta="Clinic workspace"
        />,
        { route: '/queue' }
    );
describe('Compact sidebar', () => {
    beforeEach(() => localStorage.clear());
    it('retains accessible navigation and the active route when collapsed, and persists the preference', async () => {
        const user = userEvent.setup();
        const view = renderSidebar();
        await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
        expect(localStorage.getItem('pravaah.sidebar.compact')).toBe('true');
        expect(screen.getByRole('link', { name: 'Queue' })).toHaveAttribute('aria-current', 'page');
        expect(within(screen.getByRole('navigation')).getAllByRole('link')).toHaveLength(5);
        view.unmount();
        renderSidebar();
        expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
            'aria-expanded',
            'false'
        );
        await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
        expect(localStorage.getItem('pravaah.sidebar.compact')).toBe('false');
    });
});
