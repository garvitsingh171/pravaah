import { useAuth } from '@clerk/react';
import { Link } from 'react-router-dom';
import { defaultDashboardPath } from './dashboardRoutes';

function NotFoundPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const ctaLabel = isLoaded && isSignedIn ? 'Open dashboard' : 'Sign in';
    const ctaPath = isLoaded && isSignedIn ? defaultDashboardPath : '/login';

    return (
        <main className="flex min-h-screen items-center bg-slate-50 px-4 py-10 text-slate-900">
            <section className="mx-auto w-full max-w-2xl rounded-lg border border-dashed border-slate-300 bg-white p-6 md:p-8">
                <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                    Not Found
                </p>

                <h1 className="mt-3 text-3xl font-bold text-slate-900">Page Not Found</h1>

                <p className="mt-4 max-w-2xl text-slate-600">
                    The page you requested could not be found.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                        to="/"
                        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Go to homepage
                    </Link>
                    <Link
                        to={ctaPath}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        {ctaLabel}
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default NotFoundPage;
