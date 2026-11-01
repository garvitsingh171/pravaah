import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import CommandPalette from './CommandPalette';
import { getNavigationRoutesForRole } from '../../routes/dashboardRoutes';
import { UserRole } from '../../types';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('CommandPalette', () => {
    it('focuses search, filters commands, and navigates with the keyboard', async () => {
        const user = userEvent.setup();
        const close = vi.fn();
        renderWithProviders(
            <>
                <CommandPalette
                    navigationItems={getNavigationRoutesForRole(UserRole.STAFF)}
                    onClose={close}
                />
                <Routes>
                    <Route path="/queue" element={<h1>Queue destination</h1>} />
                </Routes>
            </>
        );
        const input = screen.getByRole('combobox', { name: 'Search pages and actions' });
        expect(input).toHaveFocus();
        await user.type(input, 'queue');
        expect(screen.getAllByRole('option')).toHaveLength(1);
        await user.keyboard('{ArrowDown}{Enter}');
        expect(close).toHaveBeenCalledOnce();
        expect(screen.getByRole('heading', { name: 'Queue destination' })).toBeVisible();
    });
    it('does not expose administration routes to Staff and announces empty results', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <CommandPalette
                navigationItems={getNavigationRoutesForRole(UserRole.STAFF)}
                onClose={vi.fn()}
            />
        );
        expect(screen.queryByRole('option', { name: /Clinic Settings/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /^Staff/ })).not.toBeInTheDocument();
        await user.type(screen.getByRole('combobox'), 'zzzz');
        expect(screen.queryAllByRole('option')).toHaveLength(0);
        expect(screen.getByRole('status')).toHaveTextContent('No matching pages');
    });
    it('exposes actual Admin destinations and supports Escape', async () => {
        const user = userEvent.setup();
        const close = vi.fn();
        renderWithProviders(
            <CommandPalette
                navigationItems={getNavigationRoutesForRole(UserRole.ADMIN)}
                onClose={close}
            />
        );
        expect(
            within(screen.getByRole('listbox')).getByRole('option', { name: /Clinic Settings/ })
        ).toBeVisible();
        await user.keyboard('{Escape}');
        expect(close).toHaveBeenCalledOnce();
    });
});
