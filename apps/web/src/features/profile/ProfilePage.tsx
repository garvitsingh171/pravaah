import { useActiveClinic } from '../../app/activeClinicContext';
import { Badge, Card, PageHeader } from '../../components/ui';
import { UserRole, UserStatus } from '../../types';

const getInitials = (name: string): string => {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return initials || 'P';
};

const getRoleLabel = (role?: UserRole): string => {
    if (role === UserRole.ADMIN) return 'Admin';
    if (role === UserRole.STAFF) return 'Staff';
    return 'Clinic member';
};

const getStatusLabel = (status?: UserStatus): string => {
    if (status === UserStatus.SUSPENDED) return 'Suspended';
    if (status === UserStatus.INVITED) return 'Invited';
    return 'Active';
};

const getStatusTone = (status?: UserStatus) => {
    if (status === UserStatus.SUSPENDED) return 'danger' as const;
    if (status === UserStatus.INVITED) return 'warning' as const;
    return 'success' as const;
};

function ProfilePage() {
    const { clinic, clinicId, currentUser } = useActiveClinic();
    const fullName = currentUser?.fullName?.trim() || getRoleLabel(currentUser?.role);
    const roleLabel = getRoleLabel(currentUser?.role);
    const statusLabel = getStatusLabel(currentUser?.status);

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Account"
                description="Review your Pravaah account details and clinic access."
            />

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
                <Card
                    title="Personal details"
                    description="The account information used for your workspace access."
                >
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-bold text-white shadow-[var(--shadow-soft)]">
                            {getInitials(fullName)}
                        </div>
                        <div className="min-w-0">
                            <h2 className="break-words text-xl font-bold text-app-text">
                                {fullName}
                            </h2>
                            <p className="mt-1 break-all text-sm text-app-muted">
                                {currentUser?.email || 'Email not available'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Badge tone="brand">{roleLabel}</Badge>
                                <Badge tone={getStatusTone(currentUser?.status)}>
                                    {statusLabel}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <dl className="mt-6 grid gap-4 border-t border-app-border pt-5 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-app-subtle">
                                Role
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-app-text">
                                {roleLabel}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-app-subtle">
                                Account status
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-app-text">
                                {statusLabel}
                            </dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-app-subtle">
                                Email address
                            </dt>
                            <dd className="mt-1 break-all text-sm font-semibold text-app-text">
                                {currentUser?.email || 'Email not available'}
                            </dd>
                        </div>
                    </dl>
                </Card>

                <Card title="Clinic access" description="Your current Pravaah workspace context.">
                    <dl className="grid gap-5">
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-app-subtle">
                                Clinic
                            </dt>
                            <dd className="mt-1 break-words text-sm font-semibold text-app-text">
                                {clinic?.name || 'Active clinic'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-app-subtle">
                                Workspace
                            </dt>
                            <dd className="mt-1 break-words text-sm font-medium text-app-muted">
                                {clinic?.slug ? `/${clinic.slug}` : 'Assigned workspace'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-app-subtle">
                                Clinic ID
                            </dt>
                            <dd className="mt-1 break-all font-mono text-xs font-medium text-app-muted">
                                {clinicId}
                            </dd>
                        </div>
                        {clinic?.timezone ? (
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-app-subtle">
                                    Timezone
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-app-muted">
                                    {clinic.timezone}
                                </dd>
                            </div>
                        ) : null}
                    </dl>
                </Card>
            </section>

            <Card
                title="Account security"
                description="Authentication is managed through your organisation's secure sign-in provider."
            >
                <p className="text-sm leading-6 text-app-muted">
                    To change your sign-in credentials or recover access, use the account recovery
                    flow from the sign-in page or contact a Pravaah administrator.
                </p>
            </Card>
        </div>
    );
}

export default ProfilePage;
