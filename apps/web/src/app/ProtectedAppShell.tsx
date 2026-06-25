import { RedirectToSignIn, useAuth } from '@clerk/react';
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

    if (!isLoaded) {
        return <FullPageLoadingState />;
    }

    if (!isSignedIn) {
        return <RedirectToSignIn />;
    }

    return (
        <ActiveClinicProvider>
            <AppLayout />
        </ActiveClinicProvider>
    );
}

export default ProtectedAppShell;
