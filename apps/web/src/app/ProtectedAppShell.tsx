import { useAuth } from '@clerk/react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from '../components/feedback';
import ActiveClinicProvider from './ActiveClinicProvider';
import AppLayout from './AppLayout';

function FullPageLoadingState() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <LoadingState message="Preparing Pravaah..." />
        </div>
    );
}

function ProtectedAppShell() {
    const { isLoaded, isSignedIn } = useAuth();
    const location = useLocation();

    if (!isLoaded) {
        return <FullPageLoadingState />;
    }

    if (!isSignedIn) {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        const loginPath = `/login?redirect_url=${encodeURIComponent(returnTo)}`;

        return <Navigate to={loginPath} replace />;
    }

    return (
        <ActiveClinicProvider>
            <AppLayout />
        </ActiveClinicProvider>
    );
}

export default ProtectedAppShell;
