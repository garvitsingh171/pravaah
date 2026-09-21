import { SignUp, useAuth } from '@clerk/react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { LoadingState } from '../../components/feedback';
import { getSafeInternalRedirectPath } from '../../lib';
import AuthPageLayout from './components/AuthPageLayout';

const signUpFallbackRedirectPath = '/onboarding/clinic';
const redirectParamName = 'redirect_url';

function SignUpPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const [searchParams] = useSearchParams();
    const redirectPath = getSafeInternalRedirectPath(
        searchParams.get(redirectParamName),
        signUpFallbackRedirectPath
    );
    const signInUrl = `/login?${redirectParamName}=${encodeURIComponent(redirectPath)}`;

    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <LoadingState message="Preparing sign-up..." />
            </div>
        );
    }

    if (isSignedIn) {
        return <Navigate to={redirectPath} replace />;
    }

    return (
        <AuthPageLayout
            eyebrow="Pravaah identity"
            title="Create your Pravaah account"
            description="Sign up with Clerk to create your external identity. Clinic setup and Pravaah role assignment happen separately in the application backend."
            footer={
                <p className="text-sm leading-6 text-app-muted">
                    Already have an account?{' '}
                    <Link
                        to={signInUrl}
                        className="font-semibold text-brand-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                    >
                        Sign in
                    </Link>
                </p>
            }
        >
            <SignUp
                path="/sign-up"
                routing="path"
                signInUrl={signInUrl}
                fallbackRedirectUrl={redirectPath}
            />
        </AuthPageLayout>
    );
}

export default SignUpPage;
