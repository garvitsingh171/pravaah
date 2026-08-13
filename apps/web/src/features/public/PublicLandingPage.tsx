import { useAuth } from '@clerk/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PravaahLogo, PravaahLogoLink } from '../../components/brand';
import { Badge } from '../../components/ui';
import ProductShowcase from './components/ProductShowcase';

const publicNavigationItems = [
    { label: 'Problem', href: '#problem' },
    { label: 'Product', href: '#product' },
    { label: 'Workflow', href: '#workflow-tour' },
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'Risk support', href: '#risk-support' },
    { label: 'Engineering', href: '#engineering' },
];

const onboardingClinicPath = '/onboarding/clinic';
const dashboardPath = '/dashboard';

const workflowSteps = [
    {
        title: 'Schedule',
        status: 'Appointment created',
        description:
            'Staff choose an active doctor, an active patient, time, duration, source, reason, and notes.',
        validates: 'Backend creates appointment, queue entry, and no-show assistance together.',
        humanControl: 'Staff decides when and why to book.',
        previewTitle: 'Booking form',
        previewItems: ['Active doctor', 'Active patient', 'Scheduled time', 'Reception source'],
    },
    {
        title: 'Confirm',
        status: 'Confirmed',
        description:
            'The appointment can be manually confirmed when staff have completed their normal follow-up.',
        validates: 'Status stays attached to the clinic-scoped appointment.',
        humanControl: 'No automatic confirmation or patient contact is implied.',
        previewTitle: 'Status action',
        previewItems: ['Confirm', 'Mark arrived', 'Cancel', 'Mark no-show'],
    },
    {
        title: 'Arrive',
        status: 'Arrived',
        description:
            'Staff record arrival so the front desk and queue screen show that the patient is present.',
        validates: 'Queue status can sync with appointment status where a queue entry exists.',
        humanControl: 'Arrival is recorded by clinic staff.',
        previewTitle: 'Reception update',
        previewItems: ['Patient present', 'Doctor context', 'Time visible', 'Queue ready'],
    },
    {
        title: 'Queue',
        status: 'Waiting',
        description:
            'The patient appears in the doctor-scoped active queue with a visible position number.',
        validates: 'Manual reorder requests send authoritative queue-entry IDs to the backend.',
        humanControl: 'Only staff move the queue order.',
        previewTitle: 'Queue board',
        previewItems: ['#01 position', 'Waiting status', 'Move up/down', 'Server confirmed'],
    },
    {
        title: 'Call',
        status: 'Called',
        description:
            'Staff call the next patient and keep the waiting board current during the clinic day.',
        validates: 'Called timestamps stay on the queue entry when available.',
        humanControl: 'Calling a patient is a deliberate staff action.',
        previewTitle: 'Queue status',
        previewItems: ['Call patient', 'Called time', 'Appointment status', 'Risk visible'],
    },
    {
        title: 'Close',
        status: 'Completed / No Show',
        description:
            'The visit is closed as completed, cancelled, or no-show. Final entries remain visible for review.',
        validates: 'Final states are not shown as reorderable.',
        humanControl: 'Final operational decisions remain with Admin or Staff.',
        previewTitle: 'Visit outcome',
        previewItems: ['Completed', 'Cancelled', 'No Show', 'Reorder locked'],
    },
];

const capabilityItems = [
    {
        title: 'Clinic operations',
        description: 'Give Admin and Staff users one protected workspace for daily clinic flow.',
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

const riskFactorItems = [
    'Previous no-show or late-arrival history stored in the clinic record.',
    'Booking source and timing context captured during appointment creation.',
    'Patient distance or visit-pattern context when available on the record.',
];

const riskGuardrailItems = [
    'No attendance guarantees or medical conclusions.',
    'No automatic cancellation, queue reorder, or patient contact.',
    'Staff can review the reasons and decide the next follow-up step.',
];

const architectureItems = [
    'React, TypeScript, Vite, and Tailwind on the frontend.',
    'Express, Prisma, PostgreSQL, and Zod on the backend.',
    'Clerk identity mapped to backend-owned Pravaah users, roles, and clinic access.',
    'Backend-enforced clinic isolation for protected workflow APIs.',
    'Transactional appointment creation with queue entry and deterministic risk assistance.',
    'Human-controlled queue reorder with backend validation.',
];

function PublicHeader() {
    const { isLoaded, isSignedIn } = useAuth();

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <PravaahLogoLink layout="horizontal" surface="light" size="sm">
                        <span className="hidden text-sm font-semibold text-slate-500 sm:inline">
                            Clinic operations
                        </span>
                    </PravaahLogoLink>

                    <div className="flex shrink-0 items-center gap-2">
                        {isLoaded && isSignedIn ? (
                            <Link
                                to={dashboardPath}
                                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                            >
                                Open workspace
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-soft hover:bg-brand-subtle hover:text-brand-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/sign-up"
                                    className="hidden min-h-10 items-center justify-center rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action sm:inline-flex"
                                >
                                    Start onboarding
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <nav className="flex flex-wrap gap-2 pb-1" aria-label="Public navigation">
                    {publicNavigationItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
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
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-foreground">
                {eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-950">{title}</h2>
            {description ? (
                <p className="mt-4 text-base leading-8 text-slate-600">{description}</p>
            ) : null}
        </div>
    );
}

function HeroFlowPreview() {
    const heroSteps = [
        { label: 'Appointment', detail: '10:10 with Dr. Rao' },
        { label: 'Arrival', detail: 'Reception marks present' },
        { label: 'Queue', detail: '#02 waiting' },
        { label: 'Called', detail: 'Room 2' },
        { label: 'Completed', detail: 'Visit closed' },
    ];

    return (
        <div className="relative rounded-lg border border-white/15 bg-white/5 p-4 shadow-2xl shadow-slate-950/30 sm:p-5">
            <svg
                className="absolute inset-x-4 top-24 h-48 w-[calc(100%-2rem)] text-brand opacity-80"
                viewBox="0 0 520 190"
                fill="none"
                aria-hidden="true"
            >
                <path
                    className="flow-path"
                    d="M34 134 C112 42 170 46 244 112 C310 170 378 162 486 58"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>

            <div className="relative grid gap-3">
                <div className="rounded-lg border border-white/15 bg-slate-950/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                                Today flow
                            </p>
                            <h2 className="mt-1 text-lg font-bold text-white">
                                Pravaah Family Clinic
                            </h2>
                        </div>
                        <Badge
                            tone="brand"
                            className="bg-brand-subtle text-brand-foreground ring-brand-soft"
                        >
                            Staff controlled
                        </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                            <p className="text-2xl font-bold text-white">12</p>
                            <p className="text-xs text-slate-300">appointments</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">5</p>
                            <p className="text-xs text-slate-300">active queue</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">2</p>
                            <p className="text-xs text-slate-300">need review</p>
                        </div>
                    </div>
                </div>

                <ol className="relative mt-2 grid gap-3">
                    {heroSteps.map((step, index) => (
                        <li
                            key={step.label}
                            className={`rounded-lg border border-white/15 bg-white p-4 text-slate-950 shadow-lg shadow-slate-950/10 ${
                                index % 2 === 0 ? 'mr-10' : 'ml-10'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-sm font-bold text-brand-foreground ring-1 ring-brand-soft">
                                    {index + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold">{step.label}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">{step.detail}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

function CompactFlowStrip() {
    const labels = ['Appointment', 'Arrival', 'Queue', 'Called', 'Completed'];

    return (
        <ol className="mt-6 flex flex-wrap gap-2" aria-label="Clinic flow summary">
            {labels.map((label, index) => (
                <li key={label} className="flex items-center gap-2">
                    <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-100">
                        {label}
                    </span>
                    {index < labels.length - 1 ? (
                        <span className="text-brand" aria-hidden="true">
                            -&gt;
                        </span>
                    ) : null}
                </li>
            ))}
        </ol>
    );
}

function WorkflowTour() {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeStep = workflowSteps[activeIndex] ?? workflowSteps[0]!;

    return (
        <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <ol className="grid gap-3">
                {workflowSteps.map((step, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <li key={step.title}>
                            <button
                                type="button"
                                className={`w-full rounded-lg border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${
                                    isActive
                                        ? 'border-brand-soft bg-brand-subtle shadow-sm'
                                        : 'border-slate-200 bg-white hover:border-brand-soft hover:bg-slate-50'
                                }`}
                                onMouseEnter={() => setActiveIndex(index)}
                                onFocus={() => setActiveIndex(index)}
                                onClick={() => setActiveIndex(index)}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                <span className="flex items-start gap-3">
                                    <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold ring-1 ${
                                            isActive
                                                ? 'bg-white text-brand-foreground ring-brand-soft'
                                                : 'bg-slate-50 text-slate-600 ring-slate-200'
                                        }`}
                                    >
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-base font-bold text-slate-950">
                                            {step.title}
                                        </span>
                                        <span className="mt-1 block text-sm leading-6 text-slate-600">
                                            {step.description}
                                        </span>
                                    </span>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                            {activeStep.status}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-950">
                            {activeStep.previewTitle}
                        </h3>
                    </div>
                    <Badge tone="brand">Interactive model</Badge>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {activeStep.previewItems.map((item) => (
                        <div
                            key={item}
                            className="rounded-md border border-slate-200 bg-slate-50 p-3"
                        >
                            <p className="text-sm font-semibold text-slate-900">{item}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-950">
                            What the system validates
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            {activeStep.validates}
                        </p>
                    </div>
                    <div className="rounded-md border border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-bg)] p-4">
                        <p className="text-sm font-bold text-[var(--color-status-warning-text)]">
                            Human decision boundary
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-status-warning-text)]">
                            {activeStep.humanControl}
                        </p>
                    </div>
                </div>
            </article>
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
                    <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 text-white sm:px-6 md:py-14 lg:min-h-[calc(100vh-6.5rem)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
                        <div className="max-w-3xl">
                            <PravaahLogo
                                layout="horizontal"
                                surface="dark"
                                size="lg"
                                className="mb-8"
                            />
                            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
                                Clinic-side operations for appointments, arrivals, and queues
                            </p>
                            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                                Pravaah turns a clinic day into one controlled patient-flow
                                workspace.
                            </h1>
                            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                                Admin and Staff users can create the clinic, maintain records, book
                                appointments, review deterministic no-show reasons, manage arrivals,
                                and manually operate the queue without pretending the software makes
                                the final decision.
                            </p>

                            <CompactFlowStrip />

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <PublicCtaActions />
                                <a
                                    href="#workflow-tour"
                                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    Explore the workflow
                                </a>
                            </div>
                        </div>

                        <HeroFlowPreview />

                        <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3 lg:col-span-2">
                            <p className="rounded-md border border-white/10 bg-white/5 p-3">
                                No patient or doctor login implied.
                            </p>
                            <p className="rounded-md border border-white/10 bg-white/5 p-3">
                                No trained ML or automatic queue decisions.
                            </p>
                            <p className="rounded-md border border-white/10 bg-white/5 p-3">
                                Backend remains authoritative.
                            </p>
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
                                        className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-brand-subtle text-sm font-bold text-brand-foreground ring-1 ring-brand-soft"
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

                <section
                    id="product"
                    className="scroll-mt-36 border-b border-slate-200 bg-[#F8FAFC] md:scroll-mt-32"
                >
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="space-y-8">
                            <SectionHeading
                                eyebrow="Product showcase"
                                title="A faithful preview of the clinic-side workspace."
                                description="These are product-focused React previews using fictional demo data. They mirror the implemented workflow surfaces: appointments, queue status, and explainable no-show risk context."
                            />
                            <ProductShowcase />
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
                    id="workflow-tour"
                    className="scroll-mt-36 border-b border-slate-200 bg-white md:scroll-mt-32"
                >
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="Interactive workflow"
                            title="Click through the appointment-to-queue lifecycle."
                            description="Each stage reflects implemented product behavior: staff actions, backend validation, queue visibility, and the boundary between assistance and final human decisions."
                        />

                        <WorkflowTour />
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
                                        className="mb-4 h-1.5 w-12 rounded-full bg-brand"
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

                        <div className="grid gap-4">
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
                                            Reasons stay visible so staff can choose the right
                                            follow-up.
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <article className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5">
                                    <h3 className="text-base font-bold text-slate-950">
                                        Factors staff can inspect
                                    </h3>
                                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                                        {riskFactorItems.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </article>
                                <article className="rounded-lg border border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-bg)] p-5">
                                    <h3 className="text-base font-bold text-[var(--color-status-warning-text)]">
                                        Guardrails
                                    </h3>
                                    <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-status-warning-text)]">
                                        {riskGuardrailItems.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </article>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="engineering"
                    className="scroll-mt-36 border-y border-slate-200 bg-[#F8FAFC] md:scroll-mt-32"
                >
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                        <SectionHeading
                            eyebrow="Engineering credibility"
                            title="The product surface reflects the system design."
                            description="Pravaah exposes enough workflow truth in the UI for a reviewer to understand why the architecture matters, without turning the landing page into a resume."
                        />

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {architectureItems.map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-md border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <p className="text-sm leading-6 text-slate-700">{item}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-5 rounded-md border border-brand-soft bg-brand-subtle p-4 text-sm leading-6 text-app-text">
                                The important boundary is deliberate: Clerk proves identity, but
                                Pravaah's backend owns role, clinic access, appointment writes,
                                queue ordering, and deterministic risk calculation.
                            </p>
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
                    <PravaahLogoLink layout="horizontal" surface="light" size="sm" />
                    <p>Clinic-side appointment, queue, and explainable risk workspace.</p>
                    <p>&copy; {currentYear} Pravaah.</p>
                </div>
            </footer>
        </div>
    );
}

export default PublicLandingPage;
