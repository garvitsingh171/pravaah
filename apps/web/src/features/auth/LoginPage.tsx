import { SignIn, useAuth } from '@clerk/react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { LoadingState } from '../../components/feedback';
import { defaultDashboardPath } from '../../routes/dashboardRoutes';

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
    const redirectPath = getSafeRedirectPath(searchParams.get(redirectParamName));

    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <LoadingState message="Loading sign-in..." />
            </div>
        );
    }

    if (isSignedIn) {
        return <Navigate to={redirectPath} replace />;
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center gap-8 md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(320px,1fr)] md:items-center">
                <section className="max-w-xl">
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                        Clinic Admin/Staff
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">
                        Sign in to Pravaah
                    </h1>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                        Access the clinic workspace for Pravaah Admin and Staff users.
                    </p>
                </section>

                <section
                    className="flex justify-center md:justify-end"
                    aria-label="Pravaah sign-in"
                >
                    <SignIn
                        path="/login"
                        routing="path"
                        fallbackRedirectUrl={redirectPath}
                        withSignUp={false}
                    />
                </section>
            </div>
        </main>
    );
}

export default LoginPage;
