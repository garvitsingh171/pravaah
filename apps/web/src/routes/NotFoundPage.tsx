import { useAuth } from '@clerk/react';
import { Link } from 'react-router-dom';
import { PravaahLogo } from '../components/brand';
import { defaultDashboardPath } from './dashboardRoutes';

function NotFoundPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const ctaLabel = isLoaded && isSignedIn ? 'Open dashboard' : 'Sign in';
    const ctaPath = isLoaded && isSignedIn ? defaultDashboardPath : '/login';

    return (
        <main className="flex min-h-screen items-center bg-app-background px-4 py-10 text-app-text">
            <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-lg border border-app-border bg-white p-6 shadow-sm md:grid-cols-[0.85fr_1.15fr] md:p-8">
                <div>
                    <PravaahLogo layout="horizontal" surface="light" size="md" />
                    <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-brand-foreground">
                        Not found
                    </p>

                    <h1 className="mt-3 text-3xl font-bold leading-tight text-app-text">
                        This page is outside the clinic flow.
                    </h1>

                    <p className="mt-4 max-w-2xl text-base leading-7 text-app-muted">
                        The route you opened is not available. You can return to the public product
                        page or continue to the appropriate workspace entry point.
                    </p>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/"
                            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-action px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                        >
                            Go to homepage
                        </Link>
                        <Link
                            to={ctaPath}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-soft hover:bg-brand-subtle hover:text-brand-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                        >
                            {ctaLabel}
                        </Link>
                    </div>
                </div>

                <div className="rounded-lg border border-app-border bg-app-surface-muted p-5">
                    <svg
                        className="h-full min-h-56 w-full text-brand"
                        viewBox="0 0 520 300"
                        fill="none"
                        role="img"
                        aria-labelledby="not-found-illustration-title"
                    >
                        <title id="not-found-illustration-title">
                            Clinic workflow route ending before a missing page
                        </title>
                        <path
                            d="M62 202 C126 118 184 118 246 166 C291 201 336 200 384 144"
                            stroke="currentColor"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        <path
                            d="M384 144 L446 82"
                            stroke="#CBD5E1"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray="18 18"
                        />
                        <g fill="white" stroke="#CBD5E1" strokeWidth="3">
                            <rect x="42" y="178" width="88" height="56" rx="8" />
                            <rect x="202" y="140" width="88" height="56" rx="8" />
                            <rect x="374" y="116" width="88" height="56" rx="8" />
                        </g>
                        <circle cx="456" cy="72" r="28" fill="#FEF2F2" stroke="#FECACA" strokeWidth="3" />
                        <path
                            d="m445 61 22 22M467 61l-22 22"
                            stroke="#B91C1C"
                            strokeWidth="5"
                            strokeLinecap="round"
                        />
                        <g fill="#0F172A" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700">
                            <text x="61" y="211">Home</text>
                            <text x="219" y="174">Flow</text>
                            <text x="397" y="150">404</text>
                        </g>
                    </svg>
                </div>
            </section>
        </main>
    );
}

export default NotFoundPage;
