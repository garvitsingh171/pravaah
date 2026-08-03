import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PravaahLogo } from '../../../components/brand';
import { Badge } from '../../../components/ui';

type AuthPageLayoutProps = {
    children: ReactNode;
    eyebrow: string;
    title: string;
    description: string;
    footer?: ReactNode;
};

const authWorkflowItems = [
    'Clinic setup',
    'Doctor and patient records',
    'Appointment booking',
    'Risk review',
    'Queue operations',
];

function AuthWorkflowPreview() {
    return (
        <div className="rounded-lg border border-app-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-app-text">Clinic workspace</p>
                    <p className="mt-1 text-xs text-app-subtle">Admin and Staff access</p>
                </div>
                <Badge tone="brand">Protected</Badge>
            </div>

            <ol className="mt-5 space-y-3">
                {authWorkflowItems.map((item, index) => (
                    <li key={item} className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-xs font-bold text-brand-foreground ring-1 ring-brand-soft">
                            {index + 1}
                        </span>
                        <span className="pt-1 text-sm text-app-muted">{item}</span>
                    </li>
                ))}
            </ol>

            <p className="mt-5 border-t border-app-border pt-4 text-xs leading-5 text-app-subtle">
                Doctors and patients are records in this MVP. They do not have authenticated
                portals.
            </p>
        </div>
    );
}

function AuthPageLayout({
    children,
    description,
    eyebrow,
    footer,
    title,
}: AuthPageLayoutProps) {
    return (
        <main className="min-h-screen bg-app-background px-4 py-8 text-app-text">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-8 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1fr)] lg:items-center">
                <section className="max-w-xl">
                    <Link
                        to="/"
                        className="inline-flex rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action"
                        aria-label="Pravaah home"
                    >
                        <PravaahLogo layout="horizontal" surface="light" size="md" />
                    </Link>

                    <p className="mt-8 text-sm font-semibold uppercase text-brand-foreground">
                        {eyebrow}
                    </p>
                    <h1 className="mt-3 text-3xl font-bold leading-tight text-app-text md:text-4xl">
                        {title}
                    </h1>
                    <p className="mt-4 text-base leading-7 text-app-muted">{description}</p>
                    {footer ? <div className="mt-5">{footer}</div> : null}

                    <div className="mt-8">
                        <AuthWorkflowPreview />
                    </div>
                </section>

                <section className="flex justify-center lg:justify-end" aria-label={title}>
                    {children}
                </section>
            </div>
        </main>
    );
}

export default AuthPageLayout;
