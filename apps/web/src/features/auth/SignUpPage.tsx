import { SignUp, useAuth } from '@clerk/react';
import { Link, Navigate } from 'react-router-dom';
import { LoadingState } from '../../components/feedback';

const signUpFallbackRedirectPath = '/';

function SignUpPage() {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <LoadingState message="Loading sign-up..." />
            </div>
        );
    }

    if (isSignedIn) {
        return <Navigate to={signUpFallbackRedirectPath} replace />;
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center gap-8 md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(320px,1fr)] md:items-center">
                <section className="max-w-xl">
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                        Pravaah identity
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">
                        Create your Pravaah account
                    </h1>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                        Sign up with Clerk to create your external identity. Clinic setup and
                        Pravaah role assignment happen separately in the application backend.
                    </p>
                    <p className="mt-5 text-sm leading-6 text-slate-600">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Sign in
                        </Link>
                    </p>
                </section>

                <section
                    className="flex justify-center md:justify-end"
                    aria-label="Pravaah sign-up"
                >
                    <SignUp
                        path="/sign-up"
                        routing="path"
                        signInUrl="/login"
                        fallbackRedirectUrl={signUpFallbackRedirectPath}
                    />
                </section>
            </div>
        </main>
    );
}

export default SignUpPage;
