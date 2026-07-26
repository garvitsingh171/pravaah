import { useAuth } from '@clerk/react';
import { Link } from 'react-router-dom';
import { defaultDashboardPath } from '../../routes/dashboardRoutes';

const publicNavigationItems = [
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Risk support', href: '#risk-support' },
];

const capabilityItems = [
    {
        title: 'Doctor management',
        description:
            'Keep doctor records available for appointment booking and daily queue planning.',
        marker: 'D',
    },
    {
        title: 'Patient management',
        description:
            'Maintain clinic-side patient records with the context staff need for repeat visits.',
        marker: 'P',
    },
    {
        title: 'Appointment management',
        description:
            'Book appointments, filter the schedule, update statuses, and keep visit details visible.',
        marker: 'A',
    },
    {
        title: 'Live queue management',
        description:
            'Track arrivals, calls, completed visits, cancellations, and no-shows through the clinic day.',
        marker: 'Q',
    },
    {
        title: 'Explainable no-show risk',
        description:
            'Show LOW, MEDIUM, or HIGH advisory risk with reasons staff can understand and review.',
        marker: 'R',
    },
];

const workflowSteps = [
    {
        title: 'Clinic',
        description: 'Resolve the active clinic workspace for an Admin or Staff user.',
    },
    {
        title: 'Doctor and Patient',
        description: 'Create the operational records that anchor the clinic schedule.',
    },
    {
        title: 'Appointment',
        description: 'Book the visit and capture timing, source, reason, and notes.',
    },
    {
        title: 'Queue',
        description: 'Move the appointment into the daily queue for staff-controlled follow-up.',
    },
    {
        title: 'Starter Prediction',
        description: 'Review rule-based no-show risk and suggested staff actions.',
    },
];

function PublicHeader() {
    const { isLoaded, isSignedIn } = useAuth();

    return (
        <header className="border-b border-slate-200 bg-white/95">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <Link
                        to="/"
                        className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                        aria-label="Pravaah home"
                    >
                        <img
                            src="/pravaah-logo.png"
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-md"
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                                Pravaah
                            </p>
                            <p className="text-base font-bold text-slate-950">Clinic Flow</p>
                        </div>
                    </Link>

                    <div className="flex shrink-0 items-center gap-2">
                        {isLoaded && isSignedIn ? (
                            <Link
                                to={defaultDashboardPath}
                                className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                Open dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/sign-up"
                                    className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                >
                                    Create account
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Public navigation">
                    {publicNavigationItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>
            </div>
        </header>
    );
}

function PublicCtaLink({
    action = 'primary',
    variant = 'primary',
}: {
    action?: 'primary' | 'sign-in' | 'sign-up';
    variant?: 'primary' | 'secondary';
}) {
    const { isLoaded, isSignedIn } = useAuth();
    const label =
        isLoaded && isSignedIn
            ? 'Open dashboard'
            : action === 'sign-up'
              ? 'Create clinic account'
              : 'Sign in';
    const path =
        isLoaded && isSignedIn
            ? defaultDashboardPath
            : action === 'sign-up'
              ? '/sign-up'
              : '/login';
    const className =
        variant === 'primary'
            ? 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600'
            : 'border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-blue-600';

    return (
        <Link
            to={path}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
        >
            {label}
        </Link>
    );
}

function PublicCtaActions() {
    const { isLoaded, isSignedIn } = useAuth();

    if (isLoaded && isSignedIn) {
        return <PublicCtaLink />;
    }

    return (
        <>
            <PublicCtaLink action="sign-up" />
            <PublicCtaLink action="sign-in" variant="secondary" />
        </>
    );
}

function PublicLandingPage() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <PublicHeader />

            <main>
                <section className="bg-white">
                    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] md:items-center md:py-20 lg:px-8">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                                Clinic-side appointment and queue management
                            </p>
                            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
                                One operational workspace for small and medium clinic teams.
                            </h1>
                            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                                Pravaah helps Admin and Staff users manage doctors, patients,
                                appointments, live queues, and explainable no-show risk without
                                turning clinic decisions over to automation.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <PublicCtaActions />
                                <a
                                    href="#capabilities"
                                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                >
                                    Explore features
                                </a>
                            </div>

                            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                                Clerk account creation is now available. Clinic setup, internal
                                Pravaah role assignment, and clinic access remain separate backend
                                provisioning steps.
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Today workspace
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-slate-950">
                                        Clinic flow overview
                                    </p>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                    Human controlled
                                </span>
                            </div>

                            <dl className="mt-2 divide-y divide-slate-200">
                                {[
                                    ['Appointments', 'Schedule and status'],
                                    ['Queue', 'Arrivals and calls'],
                                    ['Risk', 'Reasons and level'],
                                    ['Activity', 'Daily summary'],
                                ].map(([label, helper]) => (
                                    <div
                                        key={label}
                                        className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <dt className="text-sm font-semibold text-slate-950">
                                            {label}
                                        </dt>
                                        <dd className="text-sm text-slate-500">{helper}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </section>

                <section className="border-y border-slate-200 bg-slate-50">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[0.8fr_1.2fr] lg:px-8">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                                Operational value
                            </p>
                            <h2 className="mt-3 text-3xl font-bold text-slate-950">
                                Built for the work reception teams repeat every day.
                            </h2>
                        </div>
                        <p className="text-base leading-8 text-slate-600">
                            Small clinics often juggle records, appointment changes, arrivals, and
                            follow-up decisions across disconnected tools. Pravaah keeps the current
                            clinic day visible so staff can work from shared records instead of
                            manual guessing.
                        </p>
                    </div>
                </section>

                <section id="capabilities" className="bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="max-w-3xl">
                            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                                Capabilities
                            </p>
                            <h2 className="mt-3 text-3xl font-bold text-slate-950">
                                The implemented clinic workflow, presented plainly.
                            </h2>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {capabilityItems.map((item) => (
                                <article
                                    key={item.title}
                                    className="rounded-lg border border-slate-200 bg-white p-5"
                                >
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700"
                                        aria-hidden="true"
                                    >
                                        {item.marker}
                                    </div>
                                    <h3 className="mt-4 text-lg font-bold text-slate-950">
                                        {item.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        {item.description}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="workflow" className="border-y border-slate-200 bg-slate-50">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="max-w-3xl">
                            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                                Workflow
                            </p>
                            <h2 className="mt-3 text-3xl font-bold text-slate-950">
                                From clinic context to staff-controlled queue work.
                            </h2>
                        </div>

                        <ol className="mt-8 grid gap-4 md:grid-cols-5">
                            {workflowSteps.map((step, index) => (
                                <li
                                    key={step.title}
                                    className="rounded-lg border border-slate-200 bg-white p-5"
                                >
                                    <p className="text-sm font-bold text-blue-600">
                                        Step {index + 1}
                                    </p>
                                    <h3 className="mt-3 text-base font-bold text-slate-950">
                                        {step.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        {step.description}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section id="risk-support" className="bg-white">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[0.9fr_1.1fr] lg:px-8">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                                Explainable risk support
                            </p>
                            <h2 className="mt-3 text-3xl font-bold text-slate-950">
                                Advisory no-show context, not automatic decision-making.
                            </h2>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                            <ul className="space-y-4 text-sm leading-6 text-slate-700">
                                <li>
                                    Uses known appointment and patient-history factors to produce
                                    LOW, MEDIUM, or HIGH risk.
                                </li>
                                <li>
                                    Provides understandable reasons and suggested staff actions for
                                    review.
                                </li>
                                <li>
                                    Does not diagnose, guarantee attendance, cancel appointments, or
                                    automatically reorder the queue.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="border-t border-slate-200 bg-slate-950">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 text-white sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl font-bold">Ready to open Pravaah?</h2>
                            <p className="mt-3 text-base leading-7 text-slate-300">
                                Create a Clerk identity or sign in with a provisioned Admin or Staff
                                account to continue toward the clinic workspace.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <PublicCtaActions />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
                    <p className="font-semibold text-slate-900">Pravaah</p>
                    <p>Clinic-side appointment, queue, and explainable risk workspace.</p>
                    <p>&copy; {currentYear} Pravaah.</p>
                </div>
            </footer>
        </div>
    );
}

export default PublicLandingPage;
