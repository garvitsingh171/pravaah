import { SignIn, useAuth } from '@clerk/react';
import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingState, useToast } from '../../components/feedback';
import { defaultDashboardPath } from '../../routes/dashboardRoutes';
import AuthPageLayout from './components/AuthPageLayout';

const redirectParamName = 'redirect_url';

const getSafeRedirectPath = (redirectUrl: string | null): string => {
    if (!redirectUrl) {
        return defaultDashboardPath;
    }

    try {
        const parsedUrl = new URL(redirectUrl, window.location.origin);

        if (
            parsedUrl.origin !== window.location.origin ||
            parsedUrl.pathname.startsWith('/login')
        ) {
            return defaultDashboardPath;
        }

        return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    } catch {
        return defaultDashboardPath;
    }
};

function LoginPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showSuccessToast } = useToast();
    const redirectPath = getSafeRedirectPath(searchParams.get(redirectParamName));
    const hasShownSignOutToast = useRef(false);

    useEffect(() => {
        if (searchParams.get('signout') === 'success' && !hasShownSignOutToast.current) {
            hasShownSignOutToast.current = true;
            showSuccessToast('Signed out successfully.');
            navigate('/login', { replace: true });
        }
    }, [navigate, searchParams, showSuccessToast]);

    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <LoadingState message="Preparing sign-in..." />
            </div>
        );
    }

    if (isSignedIn) {
        return <Navigate to={redirectPath} replace />;
    }

    return (
        <AuthPageLayout
            eyebrow="Clinic Admin/Staff"
            title="Sign in to Pravaah"
            description="Access the protected clinic workspace for appointment booking, risk review, arrivals, queue operations, and visit closure."
        >
            <SignIn
                path="/login"
                routing="path"
                fallbackRedirectUrl={redirectPath}
                signUpUrl="/sign-up"
                withSignUp
            />
        </AuthPageLayout>
    );
}

export default LoginPage;
