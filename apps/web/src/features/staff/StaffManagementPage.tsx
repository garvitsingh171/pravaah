import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { EmptyState, ErrorMessage, LoadingState, useToast } from '../../components/feedback';
import {
    Badge,
    Button,
    Card,
    ConfirmationDialog,
    FormField,
    Input,
    PageHeader,
} from '../../components/ui';
import { useActiveClinic } from '../../app/activeClinicContext';
import { isApiClientError } from '../../lib';
import { UserRole, UserStatus } from '../../types';
import {
    createStaffInvitation,
    getStaffMember,
    listClinicTeam,
    listStaffInvitations,
    removeStaffMember,
    restoreStaffMember,
    revokeStaffInvitation,
    resendStaffInvitation,
    updateStaffProfile,
    updateStaffStatus,
} from './staffApi';
import { StaffInvitationStatus, type ClinicTeamMember, type StaffInvitation } from './staffTypes';

type PageState =
    | {
          status: 'loading';
          members: ClinicTeamMember[];
          invitations: StaffInvitation[];
          error: null;
      }
    | { status: 'ready'; members: ClinicTeamMember[]; invitations: StaffInvitation[]; error: null }
    | {
          status: 'error';
          members: ClinicTeamMember[];
          invitations: StaffInvitation[];
          error: { message: string; code?: string };
      };

type ConfirmationTarget =
    | { kind: 'status'; member: ClinicTeamMember; nextStatus: 'ACTIVE' | 'SUSPENDED' }
    | { kind: 'revoke'; invitation: StaffInvitation }
    | { kind: 'remove'; member: ClinicTeamMember }
    | { kind: 'restore'; member: ClinicTeamMember }
    | null;

const initialState: PageState = { status: 'loading', members: [], invitations: [], error: null };

const formatDate = (value: string): string =>
    new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));

const invitationTone = (status: StaffInvitation['status']) => {
    if (status === StaffInvitationStatus.PENDING) return 'warning' as const;
    if (status === StaffInvitationStatus.ACCEPTED) return 'success' as const;
    if (status === StaffInvitationStatus.REVOKED) return 'danger' as const;
    return 'neutral' as const;
};

function MemberCard({
    member,
    onManage,
    onDetails,
    onLifecycle,
}: {
    member: ClinicTeamMember;
    onManage: (member: ClinicTeamMember, status: 'ACTIVE' | 'SUSPENDED') => void;
    onDetails: (member: ClinicTeamMember) => void;
    onLifecycle: (member: ClinicTeamMember, kind: 'remove' | 'restore') => void;
}) {
    const isStaff = member.role === UserRole.STAFF;
    const isActive = member.status === UserStatus.ACTIVE;

    return (
        <article className="rounded-lg border border-app-border bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h3 className="truncate font-semibold text-app-text">{member.fullName}</h3>
                    <p className="mt-1 break-all text-sm text-app-muted">{member.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone={member.role === UserRole.ADMIN ? 'brand' : 'neutral'}>
                            {member.role === UserRole.ADMIN ? 'Admin' : 'Staff'}
                        </Badge>
                        <Badge
                            tone={
                                isActive
                                    ? 'success'
                                    : member.status === UserStatus.SUSPENDED
                                      ? 'danger'
                                      : 'warning'
                            }
                        >
                            {member.status === UserStatus.ACTIVE
                                ? 'Active'
                                : member.status === UserStatus.SUSPENDED
                                  ? 'Suspended'
                                  : member.status === UserStatus.REMOVED
                                    ? 'Removed'
                                    : 'Invited'}
                        </Badge>
                    </div>
                    <p className="mt-3 text-xs text-app-subtle">
                        Joined {formatDate(member.createdAt)}
                    </p>
                </div>
                {isStaff ? (
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => onDetails(member)}>
                            Details / Edit
                        </Button>
                        {member.status === UserStatus.REMOVED ? (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onLifecycle(member, 'restore')}
                            >
                                Restore
                            </Button>
                        ) : (
                            <>
                                {member.status !== UserStatus.INVITED ? (
                                    <Button
                                        size="sm"
                                        variant={isActive ? 'danger' : 'outline'}
                                        onClick={() =>
                                            onManage(member, isActive ? 'SUSPENDED' : 'ACTIVE')
                                        }
                                    >
                                        {isActive ? 'Suspend' : 'Reactivate'}
                                    </Button>
                                ) : null}
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => onLifecycle(member, 'remove')}
                                >
                                    Remove
                                </Button>
                            </>
                        )}
                    </div>
                ) : null}
            </div>
        </article>
    );
}

function StaffManagementPage() {
    const { clinicId } = useActiveClinic();
    const { showErrorToast, showSuccessToast } = useToast();
    const [state, setState] = useState<PageState>(initialState);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [confirmationTarget, setConfirmationTarget] = useState<ConfirmationTarget>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmationError, setConfirmationError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedMember, setSelectedMember] = useState<ClinicTeamMember | null>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editError, setEditError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadPage = useCallback(
        async (signal?: AbortSignal) => {
            setState((current) => ({ ...current, status: 'loading', error: null }));

            try {
                const [team, invitationData] = await Promise.all([
                    listClinicTeam(clinicId, signal),
                    listStaffInvitations(clinicId, signal),
                ]);
                setState({
                    status: 'ready',
                    members: team.members,
                    invitations: invitationData.invitations,
                    error: null,
                });
            } catch (error: unknown) {
                if (isApiClientError(error) && error.code === 'API_REQUEST_ABORTED') return;
                const code = isApiClientError(error) ? error.code : undefined;
                setState((current) => ({
                    ...current,
                    status: 'error',
                    error: {
                        message: isApiClientError(error)
                            ? error.message
                            : 'Clinic team could not be loaded. Please try again.',
                        ...(code ? { code } : {}),
                    },
                }));
            }
        },
        [clinicId]
    );

    useEffect(() => {
        const abortController = new AbortController();
        void loadPage(abortController.signal);
        return () => abortController.abort();
    }, [loadPage]);

    const staffMembers = useMemo(
        () => state.members.filter((member) => member.role === UserRole.STAFF),
        [state.members]
    );
    const visibleMembers = useMemo(
        () =>
            state.members.filter((member) => {
                const matchesSearch = `${member.fullName} ${member.email}`
                    .toLowerCase()
                    .includes(search.trim().toLowerCase());
                return matchesSearch && (statusFilter === 'ALL' || member.status === statusFilter);
            }),
        [state.members, search, statusFilter]
    );

    const openDetails = async (member: ClinicTeamMember) => {
        setEditError(null);
        try {
            const result = await getStaffMember(clinicId, member.id);
            setSelectedMember(result.member);
            setEditName(result.member.fullName);
            setEditPhone(result.member.phone ?? '');
        } catch (error) {
            showErrorToast(
                isApiClientError(error) ? error.message : 'Staff details could not be loaded.'
            );
        }
    };

    const saveProfile = async (event: FormEvent) => {
        event.preventDefault();
        if (!selectedMember) return;
        if (!editName.trim()) {
            setEditError('Enter a staff name.');
            return;
        }
        setIsSaving(true);
        setEditError(null);
        try {
            const result = await updateStaffProfile(clinicId, selectedMember.id, {
                fullName: editName.trim(),
                phone: editPhone.trim() || null,
            });
            setSelectedMember(result.member);
            setState((current) => ({
                ...current,
                members: current.members.map((member) =>
                    member.id === result.member.id ? result.member : member
                ),
            }));
            showSuccessToast('Staff profile updated.');
        } catch (error) {
            setEditError(
                isApiClientError(error) ? error.message : 'Staff profile could not be saved.'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateInvitation = async (event: FormEvent) => {
        event.preventDefault();
        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setEmailError('Enter a valid staff email address.');
            return;
        }

        setEmailError(null);
        setIsCreating(true);

        try {
            const result = await createStaffInvitation(clinicId, normalizedEmail);
            setEmail('');
            setState((current) => ({
                ...current,
                invitations: [result.invitation, ...current.invitations],
            }));
            if (result.invitation.emailStatus === 'SUBMITTED') {
                showSuccessToast(`Invitation email submitted for ${normalizedEmail}.`);
            } else {
                showErrorToast(
                    'Invitation created, but the email could not be sent. Retry from Staff Invitations.'
                );
            }
        } catch (error: unknown) {
            const message = isApiClientError(error)
                ? error.message
                : 'Invitation could not be created.';
            setEmailError(message);
            showErrorToast(message);
        } finally {
            setIsCreating(false);
        }
    };

    const openReinvite = (invitation: StaffInvitation) => {
        setEmail(invitation.email);
        setEmailError(null);
        document.getElementById('staff-invite-email')?.focus();
    };

    const handleResendInvitation = async (invitation: StaffInvitation) => {
        try {
            const result = await resendStaffInvitation(clinicId, invitation.id);
            setState((current) => ({
                ...current,
                invitations: current.invitations.map((item) =>
                    item.id === invitation.id ? result.invitation : item
                ),
            }));
            if (result.emailStatus === 'SUBMITTED')
                showSuccessToast(`Invitation email submitted for ${invitation.email}.`);
            else
                showErrorToast(
                    'Invitation remains active, but the email could not be sent. Retry later.'
                );
        } catch (error) {
            showErrorToast(
                isApiClientError(error) ? error.message : 'Invitation email could not be sent.'
            );
        }
    };

    const handleConfirm = async () => {
        if (!confirmationTarget) return;

        setIsConfirming(true);
        setConfirmationError(null);

        try {
            if (confirmationTarget.kind === 'status') {
                const { member: updatedMember } = await updateStaffStatus(
                    clinicId,
                    confirmationTarget.member.id,
                    confirmationTarget.nextStatus
                );
                setState((current) => ({
                    ...current,
                    members: current.members.map((member) =>
                        member.id === updatedMember.id ? updatedMember : member
                    ),
                }));
                showSuccessToast(
                    confirmationTarget.nextStatus === 'SUSPENDED'
                        ? 'Staff access suspended.'
                        : 'Staff access restored.'
                );
            } else if (
                confirmationTarget.kind === 'remove' ||
                confirmationTarget.kind === 'restore'
            ) {
                const { member } =
                    confirmationTarget.kind === 'remove'
                        ? await removeStaffMember(clinicId, confirmationTarget.member.id)
                        : await restoreStaffMember(clinicId, confirmationTarget.member.id);
                setState((current) => ({
                    ...current,
                    members: current.members.map((item) => (item.id === member.id ? member : item)),
                }));
                if (selectedMember?.id === member.id) setSelectedMember(member);
                showSuccessToast(
                    confirmationTarget.kind === 'remove'
                        ? 'Staff access removed.'
                        : 'Staff access restored.'
                );
            } else {
                const { invitation } = await revokeStaffInvitation(
                    clinicId,
                    confirmationTarget.invitation.id
                );
                setState((current) => ({
                    ...current,
                    invitations: current.invitations.map((item) =>
                        item.id === invitation.id ? invitation : item
                    ),
                }));
                showSuccessToast('Invitation revoked.');
            }

            setConfirmationTarget(null);
        } catch (error: unknown) {
            setConfirmationError(
                isApiClientError(error) ? error.message : 'The change could not be saved.'
            );
        } finally {
            setIsConfirming(false);
        }
    };

    const confirmationCopy = confirmationTarget
        ? confirmationTarget.kind === 'remove'
            ? {
                  title: `Remove ${confirmationTarget.member.fullName}?`,
                  description:
                      'Their clinic access will end immediately. Their historical attribution and Clerk identity will be preserved.',
                  confirmLabel: 'Remove staff',
                  loadingText: 'Removing...',
              }
            : confirmationTarget.kind === 'restore'
              ? {
                    title: `Restore ${confirmationTarget.member.fullName}?`,
                    description:
                        'This restores their clinic access. Confirm that they should have Staff permissions again.',
                    confirmLabel: 'Restore staff',
                    loadingText: 'Restoring...',
                }
              : confirmationTarget.kind === 'revoke'
                ? {
                      title: 'Revoke invitation?',
                      description: `The link for ${confirmationTarget.invitation.email} will stop working immediately.`,
                      confirmLabel: 'Revoke invitation',
                      loadingText: 'Revoking...',
                  }
                : confirmationTarget.nextStatus === 'SUSPENDED'
                  ? {
                        title: `Suspend ${confirmationTarget.member.fullName}?`,
                        description:
                            'They will lose access to this clinic immediately. Historical activity will remain unchanged.',
                        confirmLabel: 'Suspend staff',
                        loadingText: 'Suspending...',
                    }
                  : {
                        title: `Reactivate ${confirmationTarget.member.fullName}?`,
                        description: 'Their access to this clinic workspace will be restored.',
                        confirmLabel: 'Reactivate staff',
                        loadingText: 'Reactivating...',
                    }
        : null;

    if (state.status === 'loading' && state.members.length === 0) {
        return <LoadingState message="Loading clinic team..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Admin workspace"
                description="Invite Staff into this clinic, manage access, and review invitation history."
            />

            {state.error ? (
                <ErrorMessage
                    title="Staff management could not be loaded"
                    message={state.error.message}
                    code={state.error.code}
                    onRetry={() => void loadPage()}
                />
            ) : null}

            <Card
                title="Invite staff"
                description="Invite a team member to your clinic. We'll email them a secure invitation link to join Pravaah."
            >
                <form
                    className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
                    onSubmit={(event) => void handleCreateInvitation(event)}
                >
                    <FormField label="Email address" error={emailError ?? undefined}>
                        <Input
                            id="staff-invite-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="staff@example.com"
                            disabled={isCreating}
                            required
                        />
                    </FormField>
                    <Button type="submit" isLoading={isCreating} loadingText="Sending...">
                        Send invitation
                    </Button>
                </form>
            </Card>

            <Card
                title="Clinic team"
                description="Admin accounts are shown for context and cannot be changed here."
            >
                <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                    <Input
                        aria-label="Search team"
                        placeholder="Search by name or email"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <select
                        aria-label="Filter team by status"
                        className="min-h-11 rounded-md border border-app-border-strong bg-white px-3 text-sm"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        <option value="ALL">All statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="REMOVED">Removed</option>
                        <option value="INVITED">Invited</option>
                    </select>
                </div>
                {state.members.length === 0 ? (
                    <EmptyState
                        title="No clinic members found"
                        message="The clinic does not currently have any member records."
                    />
                ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                        {visibleMembers.map((member) => (
                            <MemberCard
                                key={member.id}
                                member={member}
                                onManage={(target, nextStatus) => {
                                    setConfirmationError(null);
                                    setConfirmationTarget({
                                        kind: 'status',
                                        member: target,
                                        nextStatus,
                                    });
                                }}
                                onDetails={(target) => void openDetails(target)}
                                onLifecycle={(target, kind) => {
                                    setConfirmationError(null);
                                    setConfirmationTarget(
                                        kind === 'remove'
                                            ? { kind: 'remove', member: target }
                                            : { kind: 'restore', member: target }
                                    );
                                }}
                            />
                        ))}
                    </div>
                )}
                {state.members.length > 0 && visibleMembers.length === 0 ? (
                    <p className="mt-4 text-sm text-app-muted">
                        No team members match these filters.
                    </p>
                ) : null}
                {staffMembers.length === 0 && state.members.length > 0 ? (
                    <p className="mt-4 rounded-lg bg-app-surface-muted p-4 text-sm text-app-muted">
                        No Staff members yet. Create an invitation to add the first Staff member.
                    </p>
                ) : null}
            </Card>

            {selectedMember ? (
                <Card
                    title={`${selectedMember.fullName} · Staff details`}
                    description={`Joined ${formatDate(selectedMember.createdAt)} · ${selectedMember.status.toLowerCase()}`}
                >
                    <p className="mb-4 text-sm text-app-muted">
                        {selectedMember.email} · {selectedMember.role}
                    </p>
                    <form
                        className="grid gap-4 sm:grid-cols-2"
                        onSubmit={(event) => void saveProfile(event)}
                    >
                        <FormField label="Full name">
                            <Input
                                value={editName}
                                onChange={(event) => setEditName(event.target.value)}
                                required
                                disabled={isSaving || selectedMember.status === UserStatus.REMOVED}
                            />
                        </FormField>
                        <FormField label="Phone">
                            <Input
                                type="tel"
                                value={editPhone}
                                onChange={(event) => setEditPhone(event.target.value)}
                                disabled={isSaving || selectedMember.status === UserStatus.REMOVED}
                            />
                        </FormField>
                        {editError ? (
                            <p
                                role="alert"
                                className="text-sm text-[var(--color-status-danger-text)] sm:col-span-2"
                            >
                                {editError}
                            </p>
                        ) : null}
                        <div className="flex gap-2 sm:col-span-2">
                            <Button
                                type="submit"
                                isLoading={isSaving}
                                disabled={selectedMember.status === UserStatus.REMOVED}
                            >
                                Save changes
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelectedMember(null)}
                            >
                                Close details
                            </Button>
                        </div>
                    </form>
                </Card>
            ) : null}

            <Card
                title="Staff invitations"
                description="Expired and revoked invitations remain as history. Create a new invitation to invite again."
            >
                {state.invitations.length === 0 ? (
                    <EmptyState
                        title="No staff invitations"
                        message="Create an invitation above when you are ready to add Staff."
                    />
                ) : (
                    <div className="space-y-3">
                        {state.invitations.map((invitation) => (
                            <article
                                key={invitation.id}
                                className="rounded-lg border border-app-border bg-white p-4"
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="break-all font-semibold text-app-text">
                                            {invitation.email}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <Badge tone={invitationTone(invitation.status)}>
                                                {invitation.status[0] +
                                                    invitation.status.slice(1).toLowerCase()}
                                            </Badge>
                                            <Badge
                                                tone={
                                                    invitation.emailStatus === 'SUBMITTED'
                                                        ? 'success'
                                                        : invitation.emailStatus === 'FAILED'
                                                          ? 'danger'
                                                          : 'neutral'
                                                }
                                            >
                                                Email{' '}
                                                {invitation.emailSending
                                                    ? 'sending'
                                                    : invitation.emailStatus === 'SUBMITTED'
                                                      ? 'submitted'
                                                      : invitation.emailStatus === 'FAILED'
                                                        ? 'failed'
                                                        : 'not sent'}
                                            </Badge>
                                            <span className="text-xs text-app-subtle">
                                                Created {formatDate(invitation.createdAt)} · Expires{' '}
                                                {formatDate(invitation.expiresAt)}
                                                {invitation.emailSubmittedAt
                                                    ? ` · Submitted ${formatDate(invitation.emailSubmittedAt)}`
                                                    : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        {invitation.status === StaffInvitationStatus.PENDING &&
                                        !invitation.emailSending ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    void handleResendInvitation(invitation)
                                                }
                                            >
                                                {invitation.emailStatus === 'SUBMITTED'
                                                    ? 'Resend email'
                                                    : 'Retry email'}
                                            </Button>
                                        ) : null}
                                        {invitation.status === StaffInvitationStatus.PENDING ? (
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => {
                                                    setConfirmationError(null);
                                                    setConfirmationTarget({
                                                        kind: 'revoke',
                                                        invitation,
                                                    });
                                                }}
                                            >
                                                Revoke
                                            </Button>
                                        ) : null}
                                        {invitation.status === StaffInvitationStatus.EXPIRED ||
                                        invitation.status === StaffInvitationStatus.REVOKED ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openReinvite(invitation)}
                                            >
                                                Invite again
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </Card>

            {confirmationCopy ? (
                <ConfirmationDialog
                    open
                    title={confirmationCopy.title}
                    description={confirmationCopy.description}
                    confirmLabel={confirmationCopy.confirmLabel}
                    cancelLabel="Cancel"
                    confirmVariant={
                        (confirmationTarget?.kind === 'status' &&
                            confirmationTarget.nextStatus === 'ACTIVE') ||
                        confirmationTarget?.kind === 'restore'
                            ? 'primary'
                            : 'danger'
                    }
                    isConfirming={isConfirming}
                    confirmLoadingText={confirmationCopy.loadingText}
                    error={confirmationError}
                    onConfirm={() => void handleConfirm()}
                    onCancel={() => !isConfirming && setConfirmationTarget(null)}
                />
            ) : null}
        </div>
    );
}

export default StaffManagementPage;
