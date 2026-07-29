import type { ReactElement, PropsWithChildren } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActiveClinicReactContext } from '../app/activeClinicContext';
import { ToastProvider } from '../components/feedback';
import type { ActiveClinicContext } from '../lib';
import { UserRole } from '../types';
import { testClinicId } from './fixtures/onboarding';

export const adminActiveClinic: ActiveClinicContext = {
    clinicId: testClinicId,
    source: 'authenticatedUser',
    currentUser: {
        role: UserRole.ADMIN,
    },
};

export const staffActiveClinic: ActiveClinicContext = {
    ...adminActiveClinic,
    currentUser: {
        role: UserRole.STAFF,
    },
};

type RenderOptions = {
    route?: string;
    activeClinic?: ActiveClinicContext;
};

function TestProviders({
    children,
    route = '/',
    activeClinic,
}: PropsWithChildren<RenderOptions>) {
    const content = activeClinic ? (
        <ActiveClinicReactContext.Provider value={activeClinic}>
            {children}
        </ActiveClinicReactContext.Provider>
    ) : (
        children
    );

    return (
        <MemoryRouter initialEntries={[route]}>
            <ToastProvider>{content}</ToastProvider>
        </MemoryRouter>
    );
}

export const renderWithProviders = (ui: ReactElement, options: RenderOptions = {}) => {
    return render(<TestProviders {...options}>{ui}</TestProviders>);
};
