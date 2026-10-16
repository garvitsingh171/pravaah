import { useAuth } from '@clerk/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PravaahLogo, PravaahLogoLink } from '../../components/brand';
import { Badge } from '../../components/ui';
import ProductShowcase from './components/ProductShowcase';

const publicNavigationItems = [
    { label: 'Product', href: '#product' },
    { label: 'Benefits', href: '#benefits' },
    { label: 'Workflow', href: '#workflow-tour' },
    { label: 'No-show assistance', href: '#risk-support' },
    { label: 'Roadmap', href: '#roadmap' },
    { label: 'FAQ', href: '#faq' },
];

const onboardingClinicPath = '/onboarding/clinic';
const dashboardPath = '/dashboard';

const connectedFlowItems = [
    'Appointment',
    'Expected arrival',
    'Arrival',
    'Waiting',
    'Queue',
    'Consultation',
    'Completion',
];

const problemItems = [
    {
        title: 'Scattered appointment context',
        description:
            'When appointment details live across calls, registers, messages, and memory, staff spend more time finding the state of the day.',
    },
    {
        title: 'Unclear arrival and waiting status',
        description:
            'Reception needs to know who has arrived, who is still expected, who is waiting, and what changed since the last update.',
    },
    {
        title: 'Manual queue coordination',
        description:
            'Busy front desks can lose time repeatedly confirming queue order and communicating what should happen next.',
    },
    {
        title: 'No-shows affect more than one slot',
        description:
            'A missed appointment can affect doctor utilization, patient waiting, reception workload, and the rhythm of the clinic day.',
    },
];

const outcomeItems = [
    {
        title: 'Save staff time',
        description:
            'Reduce repetitive coordination around appointments, patient arrival status, queue movement, and daily operational checks.',
        capability: 'Appointments, patient records, live queue, dashboard',
    },
    {
        title: 'Protect appointment capacity',
        description:
            'Give staff earlier visibility into appointments that may deserve attention before they become operational gaps.',
        capability: 'Explainable no-show assistance and high-risk appointment views',
    },
    {
        title: 'Keep the queue moving',
        description:
            'Help reception teams track who has arrived, who is waiting, who has been called, and which visits are complete.',
        capability: 'Human-controlled queue status and reorder workflow',
    },
    {
        title: 'Improve operational visibility',
        description:
            'Give Admin and Staff users a shared picture of what has happened, what is happening, and what needs attention next.',
        capability: 'Clinic-day dashboard and activity summary',
    },
];

const productivityItems = [
    {
        role: 'Reception and Staff',
        description:
            "See today's appointments, update arrival and appointment status, manage queue movement, and spend less time reconstructing the clinic day.",
    },
    {
        role: 'Clinic Admin and Owner',
        description:
            'Maintain structured clinic records, understand daily operations, and reduce dependency on ad-hoc coordination.',
    },
    {
        role: 'Doctors',
        description:
            'Benefit indirectly when the staff workflow around scheduled consultation time, patient order, and queue progression is clearer.',
    },
    {
        role: 'Patients',
        description:
            'Experience a clearer arrival and waiting process when reception can see and update the queue in one place.',
    },
];

const workflowSteps = [
    {
        title: 'Set up the clinic',
        status: 'Clinic workspace',
        description:
            'Create the clinic workspace, operating details, and first Admin account during onboarding.',
        validates: 'Clinic and first Admin are created through the protected onboarding flow.',
        humanControl:
            'The clinic controls setup details and remains responsible for operational use.',
        previewTitle: 'Clinic setup',
        previewItems: ['Clinic profile', 'Operating hours', 'Admin user', 'Sample data option'],
    },
    {
        title: 'Add doctors and patients',
        status: 'Operational records',
        description:
            'Maintain clinic-side doctor and patient records so scheduling does not depend on repeated manual entry.',
        validates: 'Appointments require active doctor and patient links for the clinic.',
        humanControl: 'Doctors and patients are records today, not authenticated portals.',
        previewTitle: 'Records ready',
        previewItems: ['Doctor profile', 'Patient details', 'Clinic history', 'Active status'],
    },
    {
        title: 'Schedule appointments',
        status: 'Appointment booked',
        description:
            'Book appointments with doctor, patient, time, source, duration, reason, and notes in one structured workflow.',
        validates: 'Appointment creation also creates queue context and stored no-show assistance.',
        humanControl: 'Staff decides when and why to book, confirm, cancel, or mark no-show.',
        previewTitle: 'Appointment view',
        previewItems: ['Scheduled time', 'Doctor context', 'Patient context', 'Status actions'],
    },
    {
        title: 'Review risk context',
        status: 'Risk assistance',
        description:
            'See Low, Medium, or High no-show risk with reasons that staff can inspect before choosing a follow-up action.',
        validates:
            'Risk is deterministic, stored, and shown in appointment, queue, and dashboard views.',
        humanControl: 'Decision support, not decision replacement.',
        previewTitle: 'Reasons visible',
        previewItems: ['Risk level', 'Score', 'Reasons', 'Suggested staff actions'],
    },
    {
        title: 'Record arrival',
        status: 'Patient arrived',
        description:
            'Mark patient arrival so the clinic team can see who is present and ready to move through the day.',
        validates: 'Appointment and queue state remain connected where a queue entry exists.',
        humanControl: 'Arrival is recorded by authorized clinic users.',
        previewTitle: 'Reception update',
        previewItems: ['Arrived status', 'Queue entry', 'Doctor context', 'Time visible'],
    },
    {
        title: 'Manage the live queue',
        status: 'Waiting, called, completed',
        description:
            'Track patient progression, manually reorder active queue entries where supported, and close visits cleanly.',
        validates:
            'Queue reorder requests are checked by the backend for clinic, doctor, date, and active entries.',
        humanControl: 'The system does not silently reorder the queue.',
        previewTitle: 'Queue board',
        previewItems: ['Waiting', 'Called', 'Completed', 'Manual reorder'],
    },
    {
        title: 'Review the clinic day',
        status: 'Dashboard overview',
        description:
            'Start or review the day with appointments, queue status, completed visits, cancellations, no-shows, and risk priorities.',
        validates: 'Dashboard data is scoped to clinic and selected clinic-local date.',
        humanControl: 'The dashboard gives visibility; staff still choose what to do next.',
        previewTitle: 'Operational summary',
        previewItems: ['Appointments', 'Queue status', 'High risk list', 'Activity feed'],
    },
];

const capabilityItems = [
    {
        title: 'Appointment management',
        description:
            'Plan and track the clinic schedule so staff can see appointment context, status, doctor, patient, and timing in one workflow.',
    },
    {
        title: 'Patient management',
        description:
            'Keep operational patient information and clinic-specific history organized for scheduling and follow-up.',
    },
    {
        title: 'Doctor management',
        description:
            'Maintain the doctors connected to clinic operations so appointment and queue work has the right provider context.',
    },
    {
        title: 'Live queue management',
        description:
            'Track patient progress through arrival, waiting, called, completed, cancelled, and no-show states during the clinic day.',
    },
    {
        title: 'Explainable no-show assistance',
        description:
            'Highlight appointments that may need attention and show understandable reasons where supported by available records.',
    },
    {
        title: 'Operational dashboard',
        description:
            "Give clinic teams a quick view of appointments, queue activity, risk priorities, and the current day's operational status.",
    },
];

const differentiatorItems = [
    {
        title: 'Appointment-to-queue continuity',
        description:
            'Appointments are not isolated calendar entries. They connect into arrival tracking, queue status, and dashboard visibility.',
    },
    {
        title: 'Explainable assistance',
        description:
            'Risk levels are paired with reasons, so staff can understand why an appointment was flagged.',
    },
    {
        title: 'Human-controlled decisions',
        description:
            'Pravaah supports clinic judgment instead of automatically cancelling appointments or making hidden queue decisions.',
    },
    {
        title: 'Clinic-flow-first scope',
        description:
            'The product focuses on small and medium clinic operations rather than trying to become a hospital ERP or clinical record system.',
    },
];

const riskFactorItems = [
    'Prior no-show or late-arrival history in the clinic record',
    'Appointment timing and booking context',
    'Patient distance or visit-pattern context when available',
];

const riskGuardrailItems = [
    'No attendance guarantees',
    'No automatic cancellation',
    'No silent queue reordering',
    'No medical diagnosis or treatment decision',
    'Final action remains with authorized clinic staff',
];

const roadmapItems = [
    {
        title: 'Smarter patient communication',
        label: 'Planned',
        description:
            'Reminder logs, confirmations, rescheduling or cancellation flows, and communication integrations may extend staff follow-up workflows.',
    },
    {
        title: 'Deeper operational intelligence',
        label: 'Roadmap',
        description:
            'Richer analytics, better risk history, and smarter recommendations can build on the current clinic-day data model.',
    },
    {
        title: 'Doctor and patient experiences',
        label: 'Future',
        description:
            'Future portals may extend visibility and self-service beyond reception staff. These are not part of the current released product surface.',
    },
    {
        title: 'Growing with clinics',
        label: 'Planned',
        description:
            'Multi-clinic membership, expanded staff permissions, auditability, and organization-level workflows are later SaaS maturity work.',
    },
    {
        title: 'Context-aware operations',
        label: 'Explored later',
        description:
            'Traffic, weather, location-aware arrival estimates, and advanced prediction belong after stronger operational data and validation.',
    },
];

const faqItems = [
    {
        question: 'Is Pravaah only appointment booking software?',
        answer: 'No. Appointment booking is part of the workflow, but Pravaah is positioned around clinic flow: appointments, arrival status, live queue work, dashboard visibility, and explainable no-show assistance.',
    },
    {
        question: 'Does Pravaah replace doctors or clinical judgment?',
        answer: 'No. Pravaah handles clinic operations. It does not diagnose patients, make treatment decisions, or replace medical judgment.',
    },
    {
        question: 'Does Pravaah automatically predict and cancel no-shows?',
        answer: 'No. Current no-show assistance is deterministic and explainable. It shows risk context and reasons so staff can prioritize follow-up while keeping the final decision with the clinic.',
    },
    {
        question: 'Who can use the current product?',
        answer: 'The current product is for authenticated Admin and Staff users. Doctors and patients are managed as records today and do not have their own portals in the current product.',
    },
];

function PublicHeader() {
    const { isLoaded, isSignedIn } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!menuOpen) return undefined;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
                menuButtonRef.current?.focus();
            }
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [menuOpen]);

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex min-w-0 flex-1 items-center justify-between gap-4 lg:flex-none">
                    <PravaahLogoLink layout="horizontal" surface="light" size="sm">
                        <span className="sr-only">Clinic operations</span>
                    </PravaahLogoLink>
                    <button
                        ref={menuButtonRef}
                        type="button"
                        className="inline-flex min-h-11 items-center rounded-md border border-app-border px-3 text-sm font-semibold text-app-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action lg:hidden"
                        aria-expanded={menuOpen}
                        aria-controls="public-navigation"
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        {menuOpen ? 'Close' : 'Menu'}
                    </button>
                </div>
                <nav
                    id="public-navigation"
                    className={`${menuOpen ? 'flex' : 'hidden'} order-3 w-full flex-col gap-1 border-t border-app-border pt-3 lg:order-none lg:flex lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:border-0 lg:pt-0`}
                    aria-label="Public navigation"
                >
                    {publicNavigationItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                        >
                            {item.label}
                        </a>
                    ))}
                    <Link
                        to={isLoaded && isSignedIn ? dashboardPath : '/login'}
                        onClick={() => setMenuOpen(false)}
                        className="mt-2 rounded-md border border-app-border px-3 py-2 text-sm font-semibold text-action lg:hidden"
                    >
                        {isLoaded && isSignedIn ? 'Open workspace' : 'Sign in'}
                    </Link>
                </nav>
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
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
                                Explore Pravaah
                            </Link>
                        </>
                    )}
                </div>
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
                Explore Pravaah
            </Link>
            <a
                href="#workflow-tour"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
                See how it works
            </a>
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
        { label: 'Expected arrival', detail: 'Staff can see what is due' },
        { label: 'Arrival', detail: 'Reception marks present' },
        { label: 'Queue', detail: '#02 waiting' },
        { label: 'Completion', detail: 'Visit closed' },
    ];

    return (
        <div className="relative rounded-lg border border-white/15 bg-white/5 p-4 shadow-2xl shadow-slate-950/30 sm:p-5">
            <div className="rounded-lg border border-white/15 bg-slate-950/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                            Today at Pravaah Family Clinic
                        </p>
                        <h2 className="mt-1 text-lg font-bold text-white">Clinic flow dashboard</h2>
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
                        <p className="text-sm font-semibold text-white">Appointments</p>
                        <p className="mt-1 text-xs text-slate-300">See what is due today</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Live queue</p>
                        <p className="mt-1 text-xs text-slate-300">Track arrival and order</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Staff attention</p>
                        <p className="mt-1 text-xs text-slate-300">Review risk with context</p>
                    </div>
                </div>
            </div>

            <ol className="mt-4 grid gap-3">
                {heroSteps.map((step, index) => (
                    <li
                        key={step.label}
                        className="rounded-lg border border-white/15 bg-white p-4 text-slate-950 shadow-lg shadow-slate-950/10"
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
    );
}

function ConnectedFlowStrip() {
    return (
        <ol className="mt-8 flex flex-wrap items-center gap-2" aria-label="Clinic day flow">
            {connectedFlowItems.map((label, index) => (
                <li key={label} className="flex items-center gap-2">
                    <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm">
                        {label}
                    </span>
                    {index < connectedFlowItems.length - 1 ? (
                        <span className="text-brand-foreground" aria-hidden="true">
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
                    <Badge tone="brand">Workflow view</Badge>
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
                        <p className="text-sm font-bold text-slate-950">What stays connected</p>
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
                    <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 text-white sm:px-6 md:py-16 xl:grid-cols-[0.9fr_1.1fr] xl:items-center lg:px-8">
                        <div className="max-w-3xl">
                            <PravaahLogo
                                layout="horizontal"
                                surface="dark"
                                size="lg"
                                className="mb-8"
                            />
                            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
                                Clinic flow and operations for small and growing clinics
                            </p>
                            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                                From appointment to consultation. Keep your clinic moving.
                            </h1>
                            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                                Pravaah brings appointments, patient arrival, live queues,
                                operational visibility, and explainable no-show assistance into one
                                clinic workflow, helping teams spend less time coordinating and more
                                time running the clinic.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <PublicCtaActions />
                            </div>

                            <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                                <p className="rounded-md border border-white/10 bg-white/5 p-3">
                                    Built around appointments, arrivals, and queues.
                                </p>
                                <p className="rounded-md border border-white/10 bg-white/5 p-3">
                                    Designed for Admin and Staff workflows.
                                </p>
                                <p className="rounded-md border border-white/10 bg-white/5 p-3">
                                    Decision support, not decision replacement.
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                                Illustrative clinic workflow
                            </p>
                            <HeroFlowPreview />
                        </div>
                    </div>
                </section>

                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="The clinic day is connected"
                            title="Your clinic does not run as separate screens."
                            description="An appointment is not just a calendar entry. It affects expected arrival, waiting, queue order, doctor time, and completion. When one stage changes, the rest of the clinic day changes with it."
                        />
                        <ConnectedFlowStrip />
                        <p className="mt-8 max-w-3xl text-base leading-8 text-slate-600">
                            Pravaah is built around that flow, so staff can understand what is
                            happening now instead of reconstructing the clinic day from disconnected
                            notes, calls, spreadsheets, and conversations.
                        </p>
                    </div>
                </section>

                <section
                    id="product"
                    className="scroll-mt-36 border-b border-slate-200 bg-[#F8FAFC] md:scroll-mt-32"
                >
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="space-y-8">
                            <SectionHeading
                                eyebrow="Product"
                                title="A clinic-side workspace for the rhythm of the day."
                                description="The preview uses fictional demo data, but it reflects the implemented product surfaces: appointments, queue status, dashboard-like operational context, and explainable no-show risk reasons."
                            />
                            <ProductShowcase />
                        </div>
                    </div>
                </section>

                <section
                    id="problem"
                    className="scroll-mt-36 border-b border-slate-200 bg-white md:scroll-mt-32"
                >
                    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                        <SectionHeading
                            eyebrow="Why it matters"
                            title="When clinic operations are fragmented, small delays become daily friction."
                            description="Pravaah does not assume every clinic is broken. It focuses on a common operational pattern: appointments, arrivals, queues, and follow-up often become harder to manage when they are coordinated separately."
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            {problemItems.map((item) => (
                                <article
                                    key={item.title}
                                    className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5"
                                >
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

                <section
                    id="benefits"
                    className="scroll-mt-36 border-b border-slate-200 bg-[#F8FAFC] md:scroll-mt-32"
                >
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="Business outcomes"
                            title="Built to make the clinic day more productive."
                            description="Pravaah connects capabilities to operational value: less coordination, clearer capacity, better queue visibility, and a shared view of daily priorities."
                        />

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {outcomeItems.map((item) => (
                                <article
                                    key={item.title}
                                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <h3 className="text-lg font-bold text-slate-950">
                                        {item.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        {item.description}
                                    </p>
                                    <p className="mt-4 text-xs font-semibold uppercase leading-5 tracking-wide text-brand-foreground">
                                        {item.capability}
                                    </p>
                                </article>
                            ))}
                        </div>
                        <div className="mt-12 border-t border-slate-200 pt-8">
                            <h3 className="text-lg font-semibold text-slate-950">
                                One clearer day for everyone in the clinic
                            </h3>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {productivityItems.map((item) => (
                                    <article
                                        key={item.role}
                                        className="rounded-lg border border-slate-200 bg-white p-4"
                                    >
                                        <h4 className="font-semibold text-slate-950">
                                            {item.role}
                                        </h4>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {item.description}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="workflow-tour"
                    className="scroll-mt-36 border-b border-slate-200 bg-white md:scroll-mt-32"
                >
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="How Pravaah works"
                            title="From clinic setup to completed visits."
                            description="The workflow is intentionally non-technical: set up the clinic, keep records ready, schedule appointments, review risk context, record arrivals, manage the live queue, and review the clinic day from the dashboard."
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
                            title="Product capabilities that support one clinic-day flow."
                            description="Individual features matter because they reduce fragmentation. Pravaah keeps the core appointment-to-queue workflow visible to clinic-side Admin and Staff users."
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

                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="What makes Pravaah different"
                            title="Built around the clinic day, not just the appointment calendar."
                            description="Pravaah's differentiation comes from how its product pieces work together: appointment continuity, explainable assistance, human control, and a clear clinic-flow-first scope."
                        />

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {differentiatorItems.map((item) => (
                                <article
                                    key={item.title}
                                    className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5"
                                >
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

                <section
                    id="risk-support"
                    className="scroll-mt-36 border-b border-slate-200 bg-[#F8FAFC] md:scroll-mt-32"
                >
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                        <SectionHeading
                            eyebrow="No-show assistance"
                            title="No-show risk that staff can actually understand."
                            description="Pravaah evaluates relevant available appointment and patient-history signals, presents a risk level, and shows reasons where supported. Staff can use that context to prioritize attention while the clinic stays in control."
                        />

                        <div className="grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                {['Low', 'Medium', 'High'].map((level) => (
                                    <div
                                        key={level}
                                        className="rounded-lg border border-slate-200 bg-white p-5"
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

                            <div className="rounded-lg border border-brand-soft bg-brand-subtle p-5">
                                <p className="text-lg font-bold text-app-text">
                                    Decision support, not decision replacement.
                                </p>
                                <p className="mt-3 text-sm leading-6 text-app-text">
                                    Pravaah does not know who will arrive. It surfaces operational
                                    risk context so staff can decide whether an appointment deserves
                                    confirmation, follow-up, or closer attention.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <article className="rounded-lg border border-slate-200 bg-white p-5">
                                    <h3 className="text-base font-bold text-slate-950">
                                        Signals staff can inspect
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
                    id="roadmap"
                    className="scroll-mt-36 border-b border-slate-200 bg-white md:scroll-mt-32"
                >
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="Where Pravaah is going"
                            title="Being built beyond today's clinic workflow."
                            description="Pravaah is a developing SaaS clinic-operations product. The current product focuses on clinic-side Admin and Staff workflows; the areas below are future direction and should not be read as currently available features."
                        />

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {roadmapItems.map((item) => (
                                <article
                                    key={item.title}
                                    className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5"
                                >
                                    <Badge tone="neutral">{item.label}</Badge>
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

                <section
                    id="faq"
                    className="scroll-mt-36 border-b border-slate-200 bg-[#F8FAFC] md:scroll-mt-32"
                >
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="FAQ"
                            title="Clear product boundaries for a serious clinic-operations product."
                            description="Pravaah is being developed as a SaaS product, but the page stays honest about what exists today and what remains planned."
                        />

                        <div className="mt-10 grid gap-4 md:grid-cols-2">
                            {faqItems.map((item) => (
                                <article
                                    key={item.question}
                                    className="rounded-lg border border-slate-200 bg-white p-5"
                                >
                                    <h3 className="text-base font-bold text-slate-950">
                                        {item.question}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        {item.answer}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-y border-slate-200 bg-slate-950">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl font-bold">
                                Explore the Pravaah clinic workspace.
                            </h2>
                            <p className="mt-3 text-base leading-7 text-slate-300">
                                Start onboarding to create a clinic workspace, or sign in with a
                                provisioned Admin or Staff account to open the protected product.
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
                    <p>Clinic flow, appointments, queues, and explainable no-show assistance.</p>
                    <p>&copy; {currentYear} Pravaah.</p>
                </div>
            </footer>
        </div>
    );
}

export default PublicLandingPage;
