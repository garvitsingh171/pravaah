import { SignIn, useAuth } from '@clerk/react';
import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingState, useToast } from '../../components/feedback';
import { getSafeInternalRedirectPath } from '../../lib';
import { defaultDashboardPath } from '../../routes/dashboardRoutes';
import AuthPageLayout from './components/AuthPageLayout';

const redirectParamName = 'redirect_url';

function LoginPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showSuccessToast } = useToast();
    const safeRedirectPath = getSafeInternalRedirectPath(
        searchParams.get(redirectParamName),
        defaultDashboardPath
    );
    const redirectPath = safeRedirectPath.startsWith('/login')
        ? defaultDashboardPath
        : safeRedirectPath;
    const signUpUrl = `/sign-up?${redirectParamName}=${encodeURIComponent(redirectPath)}`;
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
                signUpUrl={signUpUrl}
                withSignUp
            />
        </AuthPageLayout>
    );
}

export default LoginPage;
