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
    listClinicTeam,
    listStaffInvitations,
    revokeStaffInvitation,
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
}: {
    member: ClinicTeamMember;
    onManage: (member: ClinicTeamMember, status: 'ACTIVE' | 'SUSPENDED') => void;
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
                                  : 'Invited'}
                        </Badge>
                    </div>
                    <p className="mt-3 text-xs text-app-subtle">
                        Joined {formatDate(member.createdAt)}
                    </p>
                </div>
                {isStaff && member.status !== UserStatus.INVITED ? (
                    <Button
                        size="sm"
                        variant={isActive ? 'danger' : 'outline'}
                        onClick={() => onManage(member, isActive ? 'SUSPENDED' : 'ACTIVE')}
                    >
                        {isActive ? 'Suspend' : 'Reactivate'}
                    </Button>
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
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [confirmationTarget, setConfirmationTarget] = useState<ConfirmationTarget>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmationError, setConfirmationError] = useState<string | null>(null);

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

    const handleCreateInvitation = async (event: FormEvent) => {
        event.preventDefault();
        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setEmailError('Enter a valid staff email address.');
            return;
        }

        setEmailError(null);
        setInviteUrl(null);
        setIsCreating(true);

        try {
            const result = await createStaffInvitation(clinicId, normalizedEmail);
            setInviteUrl(result.inviteUrl);
            setEmail('');
            setState((current) => ({
                ...current,
                invitations: [result.invitation, ...current.invitations],
            }));
            showSuccessToast('Invitation created. Copy the link and share it securely.');
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

    const handleCopyLink = async () => {
        if (!inviteUrl) return;

        try {
            await navigator.clipboard.writeText(inviteUrl);
            showSuccessToast('Invitation link copied.');
        } catch {
            showErrorToast('Could not copy automatically. Select and copy the link manually.');
        }
    };

    const openReinvite = (invitation: StaffInvitation) => {
        setEmail(invitation.email);
        setEmailError(null);
        setInviteUrl(null);
        document.getElementById('staff-invite-email')?.focus();
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
        ? confirmationTarget.kind === 'revoke'
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
                description="Pravaah creates a one-time link. No email is sent automatically."
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
                    <Button type="submit" isLoading={isCreating} loadingText="Creating...">
                        Create invitation
                    </Button>
                </form>

                {inviteUrl ? (
                    <div className="mt-5 rounded-lg border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] p-4">
                        <p className="font-semibold text-[var(--color-status-success-text)]">
                            Invitation created
                        </p>
                        <p className="mt-1 text-sm text-app-muted">
                            This secret link is available only in this immediate success state.
                        </p>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                            <input
                                className="min-w-0 flex-1 rounded-md border border-app-border-strong bg-white px-3 py-2 text-sm text-app-text"
                                value={inviteUrl}
                                readOnly
                                aria-label="Invitation link"
                                onFocus={(event) => event.currentTarget.select()}
                            />
                            <Button variant="outline" onClick={() => void handleCopyLink()}>
                                Copy invitation link
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Card>

            <Card
                title="Clinic team"
                description="Admin accounts are shown for context and cannot be changed here."
            >
                {state.members.length === 0 ? (
                    <EmptyState
                        title="No clinic members found"
                        message="The clinic does not currently have any member records."
                    />
                ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                        {state.members.map((member) => (
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
                            />
                        ))}
                    </div>
                )}
                {staffMembers.length === 0 && state.members.length > 0 ? (
                    <p className="mt-4 rounded-lg bg-app-surface-muted p-4 text-sm text-app-muted">
                        No Staff members yet. Create an invitation to add the first Staff member.
                    </p>
                ) : null}
            </Card>

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
                                            <span className="text-xs text-app-subtle">
                                                Created {formatDate(invitation.createdAt)} · Expires{' '}
                                                {formatDate(invitation.expiresAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row">
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
                        confirmationTarget?.kind === 'status' &&
                        confirmationTarget.nextStatus === 'ACTIVE'
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
