import { useAuth, useClerk } from '@clerk/react';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PravaahLogoLink } from '../../components/brand';
import { ErrorMessage, LoadingState } from '../../components/feedback';
import { Badge, Button, Card } from '../../components/ui';
import { isApiClientError } from '../../lib';
import { acceptStaffInvitation, previewStaffInvitation } from './staffApi';
import { StaffInvitationStatus, type StaffInvitationPreview } from './staffTypes';

type InvitationPageState =
    | { status: 'loading'; invitation: null; error: null }
    | { status: 'valid'; invitation: StaffInvitationPreview; error: null }
    | { status: 'accepting'; invitation: StaffInvitationPreview; error: null }
    | { status: 'accepted'; invitation: StaffInvitationPreview; error: null }
    | {
          status: 'mismatch' | 'expired' | 'revoked' | 'alreadyAccepted' | 'invalid' | 'error';
          invitation: StaffInvitationPreview | null;
          error: { message: string; code?: string };
      };

const initialState: InvitationPageState = {
    status: 'loading',
    invitation: null,
    error: null,
};

const formatDate = (value: string): string => {
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
};

const getFailureStatus = (
    code: string | undefined
): Extract<InvitationPageState, { error: { message: string; code?: string } }>['status'] => {
    if (code === 'INVITATION_IDENTITY_MISMATCH') return 'mismatch';
    if (code === 'STAFF_INVITATION_EXPIRED') return 'expired';
    if (code === 'STAFF_INVITATION_REVOKED') return 'revoked';
    if (code === 'STAFF_INVITATION_ALREADY_ACCEPTED') return 'alreadyAccepted';
    if (code === 'STAFF_INVITATION_NOT_FOUND' || code === 'VALIDATION_ERROR') return 'invalid';
    return 'error';
};

function InvitationShell({ children }: { children: ReactNode }) {
    return (
        <main className="min-h-screen bg-app-background px-4 py-8 text-app-text">
            <div className="mx-auto w-full max-w-2xl">
                <PravaahLogoLink layout="horizontal" surface="light" size="md" />
                <div className="mt-8">{children}</div>
            </div>
        </main>
    );
}

function StaffInvitationPage() {
    const { token = '' } = useParams<{ token: string }>();
    const { isLoaded, isSignedIn } = useAuth();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const [state, setState] = useState<InvitationPageState>(initialState);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const returnPath = `/invite/${encodeURIComponent(token)}`;
    const authQuery = `redirect_url=${encodeURIComponent(returnPath)}`;

    const loadInvitation = useCallback(
        async (signal?: AbortSignal) => {
            setState(initialState);

            try {
                const { invitation } = await previewStaffInvitation(token, signal);

                if (invitation.status === StaffInvitationStatus.EXPIRED) {
                    setState({
                        status: 'expired',
                        invitation,
                        error: {
                            code: 'STAFF_INVITATION_EXPIRED',
                            message:
                                'This invitation has expired. Ask the clinic Admin to invite you again.',
                        },
                    });
                    return;
                }

                if (invitation.status === StaffInvitationStatus.REVOKED) {
                    setState({
                        status: 'revoked',
                        invitation,
                        error: {
                            code: 'STAFF_INVITATION_REVOKED',
                            message: 'This invitation was revoked by the clinic Admin.',
                        },
                    });
                    return;
                }

                if (invitation.status === StaffInvitationStatus.ACCEPTED) {
                    setState({
                        status: 'alreadyAccepted',
                        invitation,
                        error: {
                            code: 'STAFF_INVITATION_ALREADY_ACCEPTED',
                            message: 'This invitation has already been accepted.',
                        },
                    });
                    return;
                }

                setState({ status: 'valid', invitation, error: null });
            } catch (error: unknown) {
                if (isApiClientError(error) && error.code === 'API_REQUEST_ABORTED') return;

                const code = isApiClientError(error) ? error.code : undefined;
                setState({
                    status: getFailureStatus(code),
                    invitation: null,
                    error: {
                        message: isApiClientError(error)
                            ? error.message
                            : 'The invitation could not be checked. Please try again.',
                        ...(code ? { code } : {}),
                    },
                });
            }
        },
        [token]
    );

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return undefined;

        const abortController = new AbortController();
        void Promise.resolve().then(() => {
            void loadInvitation(abortController.signal);
        });

        return () => abortController.abort();
    }, [isLoaded, isSignedIn, loadInvitation]);

    const handleAccept = async () => {
        if (state.status !== 'valid') return;

        setState({ status: 'accepting', invitation: state.invitation, error: null });

        try {
            await acceptStaffInvitation(token);
            setState({ status: 'accepted', invitation: state.invitation, error: null });
            navigate('/dashboard', { replace: true });
        } catch (error: unknown) {
            const code = isApiClientError(error) ? error.code : undefined;
            setState({
                status: getFailureStatus(code),
                invitation: state.invitation,
                error: {
                    message: isApiClientError(error)
                        ? error.message
                        : 'The invitation could not be accepted. Please try again.',
                    ...(code ? { code } : {}),
                },
            });
        }
    };

    const handleSwitchAccount = async () => {
        setIsSigningOut(true);
        try {
            await signOut({ redirectUrl: `/login?${authQuery}` });
        } finally {
            setIsSigningOut(false);
        }
    };

    if (!isLoaded) {
        return (
            <InvitationShell>
                <LoadingState message="Preparing invitation..." />
            </InvitationShell>
        );
    }

    if (!isSignedIn) {
        return (
            <InvitationShell>
                <Card>
                    <Badge tone="brand">Staff invitation</Badge>
                    <h1 className="mt-4 text-2xl font-bold text-app-text">
                        You&apos;ve been invited to join a clinic workspace
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-app-muted">
                        Sign in or create an account using the invited email address. Pravaah will
                        return you here to review the invitation before anything is accepted.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                            className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover"
                            to={`/login?${authQuery}`}
                        >
                            Sign in to continue
                        </Link>
                        <Link
                            className="inline-flex min-h-10 items-center justify-center rounded-md border border-app-border-strong bg-white px-4 py-2 text-sm font-semibold text-app-muted hover:bg-app-surface-muted"
                            to={`/sign-up?${authQuery}`}
                        >
                            Create account
                        </Link>
                    </div>
                </Card>
            </InvitationShell>
        );
    }

    if (state.status === 'loading') {
        return (
            <InvitationShell>
                <LoadingState message="Checking invitation..." />
            </InvitationShell>
        );
    }

    if (state.error) {
        return (
            <InvitationShell>
                <ErrorMessage
                    title={
                        state.status === 'mismatch'
                            ? 'Use the invited account'
                            : 'Invitation unavailable'
                    }
                    message={state.error.message}
                    code={state.error.code}
                    onRetry={state.status === 'error' ? () => void loadInvitation() : undefined}
                />
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    {state.status === 'mismatch' ? (
                        <Button
                            variant="outline"
                            isLoading={isSigningOut}
                            loadingText="Signing out..."
                            onClick={() => void handleSwitchAccount()}
                        >
                            Sign out and switch account
                        </Button>
                    ) : null}
                    {state.status === 'alreadyAccepted' ? (
                        <Button onClick={() => navigate('/dashboard', { replace: true })}>
                            Open Pravaah
                        </Button>
                    ) : null}
                </div>
            </InvitationShell>
        );
    }

    const invitation = state.invitation;

    return (
        <InvitationShell>
            <Card>
                <Badge tone={state.status === 'accepted' ? 'success' : 'brand'}>
                    {state.status === 'accepted' ? 'Accepted' : 'Staff invitation'}
                </Badge>
                <h1 className="mt-4 text-2xl font-bold text-app-text">
                    Join {invitation.clinic.name} as Staff
                </h1>
                <dl className="mt-5 grid gap-4 rounded-lg bg-app-surface-muted p-4 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="text-app-subtle">Invited email</dt>
                        <dd className="mt-1 font-semibold text-app-text">{invitation.email}</dd>
                    </div>
                    <div>
                        <dt className="text-app-subtle">Expires</dt>
                        <dd className="mt-1 font-semibold text-app-text">
                            {formatDate(invitation.expiresAt)}
                        </dd>
                    </div>
                </dl>
                <p className="mt-5 text-sm leading-6 text-app-muted">
                    Accepting grants Staff access to this clinic. It does not create a new clinic or
                    grant Admin permissions.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => void handleSwitchAccount()}>
                        Use another account
                    </Button>
                    <Button
                        isLoading={state.status === 'accepting'}
                        loadingText="Joining clinic..."
                        onClick={() => void handleAccept()}
                    >
                        Join clinic
                    </Button>
                </div>
            </Card>
        </InvitationShell>
    );
}

export default StaffInvitationPage;
