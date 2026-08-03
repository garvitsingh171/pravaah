import { useAuth } from '@clerk/react';
import { Link } from 'react-router-dom';
import { PravaahLogo } from '../../components/brand';

const publicNavigationItems = [
    { label: 'Problem', href: '#problem' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'Risk support', href: '#risk-support' },
];

const onboardingClinicPath = '/onboarding/clinic';
const dashboardPath = '/dashboard';

const workflowSteps = [
    {
        title: 'Clinic setup',
        description: 'Create the clinic workspace and keep the operating context clear.',
    },
    {
        title: 'Doctor and patient management',
        description: 'Maintain records for the people involved in each clinic visit.',
    },
    {
        title: 'Appointment booking',
        description: 'Schedule visits with timing, source, reason, and status context.',
    },
    {
        title: 'No-show risk assistance',
        description: 'Review rule-based risk level and reasons before staff follow-up.',
    },
    {
        title: 'Arrival and live queue operations',
        description: 'Move arrived patients through waiting, called, and active queue states.',
    },
    {
        title: 'Completion or no-show handling',
        description: 'Close the visit manually as completed, cancelled, or No Show.',
    },
];

const capabilityItems = [
    {
        title: 'Clinic operations',
        description:
            'Give Admin and Staff users one protected workspace for daily clinic flow.',
    },
    {
        title: 'Doctor and patient records',
        description:
            'Keep clinic-side doctor and patient records available for scheduling and follow-up.',
    },
    {
        title: 'Appointment management',
        description:
            'Book appointments, review schedule status, and preserve visit context for the team.',
    },
    {
        title: 'Live queue management',
        description:
            'Track arrivals, calls, completed visits, cancellations, and No Show outcomes.',
    },
    {
        title: 'Explainable risk assistance',
        description:
            'Show Low, Medium, or High no-show risk with understandable reasons for staff review.',
    },
];

const problemItems = [
    'Appointment changes live across notebooks, calls, and memory.',
    'Doctor and patient details are repeated instead of shared.',
    'Arrival order and queue status are hard to keep visible during busy hours.',
    'No-show follow-up depends on guesswork unless staff can see the reasons.',
];

const roleItems = [
    {
        title: 'Clinic Admin',
        description:
            'Sets up the clinic workspace, manages settings, and keeps operational records ready.',
    },
    {
        title: 'Clinic Staff',
        description:
            'Books appointments, records arrivals, manages the queue, and reviews risk context.',
    },
];

function PublicHeader() {
    const { isLoaded, isSignedIn } = useAuth();

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <Link
                        to="/"
                        className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
                        aria-label="Pravaah home"
                    >
                        <PravaahLogo layout="horizontal" surface="light" size="sm" />
                        <span className="hidden text-sm font-semibold text-slate-500 sm:inline">
                            Clinic operations
                        </span>
                    </Link>

                    <div className="flex shrink-0 items-center gap-2">
                        {isLoaded && isSignedIn ? (
                            <Link
                                to={dashboardPath}
                                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                            >
                                Open workspace
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/sign-up"
                                    className="hidden min-h-10 items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:inline-flex"
                                >
                                    Start onboarding
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
                            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>
            </div>
        </header>
    );
}

function PublicCtaActions() {
    const { isLoaded, isSignedIn } = useAuth();

    if (isLoaded && isSignedIn) {
        return (
            <>
                <Link
                    to={dashboardPath}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
                >
                    Open workspace
                </Link>
                <Link
                    to={onboardingClinicPath}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                    Continue setup
                </Link>
            </>
        );
    }

    return (
        <>
            <Link
                to="/sign-up"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
            >
                Start onboarding
            </Link>
            <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
                Sign in
            </Link>
        </>
    );
}

function SectionHeading({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description?: string;
}) {
    return (
        <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                {eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-950">{title}</h2>
            {description ? (
                <p className="mt-4 text-base leading-8 text-slate-600">{description}</p>
            ) : null}
        </div>
    );
}

function PublicLandingPage() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
            <PublicHeader />

            <main>
                <section className="relative overflow-hidden bg-slate-950">
                    <div
                        className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] hidden opacity-10 lg:block"
                        aria-hidden="true"
                    >
                        <PravaahLogo
                            layout="mark"
                            surface="dark"
                            size="xl"
                            className="scale-[3.8]"
                        />
                    </div>
                    <div className="relative mx-auto max-w-7xl px-4 py-16 text-white sm:px-6 md:py-20 lg:px-8">
                        <div className="max-w-3xl">
                            <PravaahLogo
                                layout="horizontal"
                                surface="dark"
                                size="lg"
                                className="mb-8"
                            />
                            <p className="text-sm font-semibold uppercase tracking-wide text-teal-300">
                                Clinic appointment and queue-management platform
                            </p>
                            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                                Pravaah helps clinics manage appointments, queues, and explainable
                                no-show risk.
                            </h1>
                            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                                Built for small and medium clinic teams, Pravaah gives Admin and
                                Staff users a focused workspace for the day: setup, records,
                                appointment booking, risk review, arrivals, and queue decisions.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <PublicCtaActions />
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="problem"
                    className="scroll-mt-36 border-b border-slate-200 bg-white md:scroll-mt-32"
                >
                    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                        <SectionHeading
                            eyebrow="The clinic problem"
                            title="Daily flow gets fragile when the system is a notebook, a call log, and memory."
                            description="Pravaah is designed around the practical coordination work clinic teams already do, without pretending to replace staff judgment."
                        />

                        <div className="grid gap-3 sm:grid-cols-2">
                            {problemItems.map((item) => (
                                <div
                                    key={item}
                                    className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4"
                                >
                                    <span
                                        className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-sm font-bold text-teal-800 ring-1 ring-teal-200"
                                        aria-hidden="true"
                                    >
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m5 12 4 4L19 6" />
                                        </svg>
                                    </span>
                                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-b border-slate-200 bg-[#F8FAFC]">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
                        <SectionHeading
                            eyebrow="MVP users"
                            title="Clinic-side access for Admin and Staff."
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            {roleItems.map((role) => (
                                <article
                                    key={role.title}
                                    className="rounded-lg border border-slate-200 bg-white p-5"
                                >
                                    <h3 className="text-lg font-bold text-slate-950">
                                        {role.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        {role.description}
                                    </p>
                                </article>
                            ))}
                        </div>

                        <p className="rounded-lg border border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-bg)] p-4 text-sm leading-6 text-[var(--color-status-warning-text)] lg:col-start-2">
                            Doctors and patients are managed as records in the current product.
                            Pravaah does not currently provide authenticated doctor or patient
                            portals.
                        </p>
                    </div>
                </section>

                <section
                    id="workflow"
                    className="scroll-mt-36 border-b border-slate-200 bg-white md:scroll-mt-32"
                >
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="Core workflow"
                            title="A clear path from setup to final visit handling."
                            description="The application keeps each operational step visible while final appointment and queue decisions remain under Admin or Staff control."
                        />

                        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {workflowSteps.map((step, index) => (
                                <li
                                    key={step.title}
                                    className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5"
                                >
                                    <p className="text-sm font-bold text-teal-700">
                                        Step {index + 1}
                                    </p>
                                    <h3 className="mt-3 text-lg font-bold text-slate-950">
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

                <section
                    id="capabilities"
                    className="scroll-mt-36 border-b border-slate-200 bg-[#F8FAFC] md:scroll-mt-32"
                >
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="Capabilities"
                            title="The implemented clinic workspace, presented plainly."
                            description="Each capability supports the same clinic-side flow instead of adding separate portals or automated operational decisions."
                        />

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {capabilityItems.map((item) => (
                                <article
                                    key={item.title}
                                    className="rounded-lg border border-slate-200 bg-white p-5"
                                >
                                    <div
                                        className="mb-4 h-1.5 w-12 rounded-full bg-teal-500"
                                        aria-hidden="true"
                                    />
                                    <h3 className="text-lg font-bold text-slate-950">
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

                <section id="risk-support" className="scroll-mt-36 bg-white md:scroll-mt-32">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                        <SectionHeading
                            eyebrow="Explainable risk support"
                            title="Risk assistance is advisory, rule-based, and human-controlled."
                            description="Pravaah can surface no-show risk level and reasons during appointment work, but it does not diagnose, guarantee attendance, cancel appointments, or automatically reorder the queue."
                        />

                        <div className="grid gap-4 sm:grid-cols-3">
                            {['Low', 'Medium', 'High'].map((level) => (
                                <div
                                    key={level}
                                    className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5"
                                >
                                    <p className="text-sm font-semibold text-slate-500">
                                        No-show risk
                                    </p>
                                    <p className="mt-2 text-2xl font-bold text-slate-950">
                                        {level}
                                    </p>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        Reasons stay visible so staff can choose the right follow-up.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-y border-slate-200 bg-slate-950">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl font-bold">Open the clinic workspace.</h2>
                            <p className="mt-3 text-base leading-7 text-slate-300">
                                Sign in with a provisioned Admin or Staff account, or start
                                onboarding to create the first clinic workspace.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <PublicCtaActions />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
                    <PravaahLogo layout="horizontal" surface="light" size="sm" />
                    <p>Clinic-side appointment, queue, and explainable risk workspace.</p>
                    <p>&copy; {currentYear} Pravaah.</p>
                </div>
            </footer>
        </div>
    );
}

export default PublicLandingPage;
