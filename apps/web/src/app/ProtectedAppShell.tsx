import { SignOutButton, useAuth } from '@clerk/react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ErrorMessage, LoadingState } from '../components/feedback';
import ActiveClinicProvider from './ActiveClinicProvider';
import AppLayout from './AppLayout';
import {
    getOnboardingStatus,
    OnboardingStatus,
    type OnboardingStatusResponseData,
} from '../features/onboarding/onboardingApi';
import { isApiClientError } from '../lib';
import { UserRole, UserStatus } from '../types';

type ProtectedAppShellState =
    | {
          status: 'loading';
          error: null;
      }
    | {
          status: 'ready';
          error: null;
      }
    | {
          status: 'onboardingRequired';
          error: null;
      }
    | {
          status: 'recoveryRequired';
          error: null;
      }
    | {
          status: 'error';
          error: {
              message: string;
              code?: string;
          };
      };

const protectedAppShellLoadingState: ProtectedAppShellState = {
    status: 'loading',
    error: null,
};

const isCompletedActiveApplicationUser = (data: OnboardingStatusResponseData): boolean => {
    return (
        data.onboarding.status === OnboardingStatus.COMPLETED &&
        data.user !== null &&
        data.clinic !== null &&
        data.user.status === UserStatus.ACTIVE &&
        (data.user.role === UserRole.ADMIN || data.user.role === UserRole.STAFF)
    );
};

function FullPageLoadingState() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <LoadingState message="Preparing Pravaah..." />
        </div>
    );
}

function RecoveryRequiredState() {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
                <ErrorMessage
                    title="Account needs recovery"
                    message="This Clerk identity has an internal Pravaah account state that cannot open the clinic application."
                    code="RECOVERY_REQUIRED"
                    details={[
                        'This account was not granted operational clinic access.',
                        'The protected clinic application was not loaded.',
                        'Ask a project administrator to repair the internal user and clinic assignment.',
                    ]}
                />
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <SignOutButton>
                        <button
                            type="button"
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Sign out
                        </button>
                    </SignOutButton>
                </div>
            </div>
        </div>
    );
}

function OnboardingStatusErrorState({
    message,
    code,
    onRetry,
}: {
    message: string;
    code?: string;
    onRetry: () => void;
}) {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
            <div className="mx-auto max-w-2xl">
                <ErrorMessage
                    title="Application access could not be checked"
                    message={message}
                    code={code}
                    details={[
                        'Confirm the backend server is running and VITE_API_BASE_URL points to the backend /api URL.',
                        'Confirm your Clerk session is active before retrying.',
                    ]}
                    onRetry={onRetry}
                />
            </div>
        </div>
    );
}

function ProtectedAppShell() {
    const { isLoaded, isSignedIn } = useAuth();
    const location = useLocation();
    const [state, setState] = useState<ProtectedAppShellState>(protectedAppShellLoadingState);

    const loadOnboardingStatus = useCallback((signal?: AbortSignal) => {
        setState(protectedAppShellLoadingState);

        void getOnboardingStatus(signal)
            .then((data) => {
                if (isCompletedActiveApplicationUser(data)) {
                    setState({
                        status: 'ready',
                        error: null,
                    });
                    return;
                }

                if (data.onboarding.status === OnboardingStatus.NOT_STARTED) {
                    setState({
                        status: 'onboardingRequired',
                        error: null,
                    });
                    return;
                }

                setState({
                    status: 'recoveryRequired',
                    error: null,
                });
            })
            .catch((error: unknown) => {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }

                if (isApiClientError(error) && error.code === 'API_REQUEST_ABORTED') {
                    return;
                }

                if (isApiClientError(error)) {
                    setState({
                        status: 'error',
                        error: {
                            message: error.message,
                            code: error.code,
                        },
                    });
                    return;
                }

                setState({
                    status: 'error',
                    error: {
                        message: 'Application access could not be checked. Please try again.',
                        code: 'ONBOARDING_STATUS_FAILED',
                    },
                });
            });
    }, []);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) {
            return;
        }

        const abortController = new AbortController();

        loadOnboardingStatus(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [isLoaded, isSignedIn, loadOnboardingStatus]);

    if (!isLoaded) {
        return <FullPageLoadingState />;
    }

    if (!isSignedIn) {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        const loginPath = `/login?redirect_url=${encodeURIComponent(returnTo)}`;

        return <Navigate to={loginPath} replace />;
    }

    if (state.status === 'loading') {
        return <FullPageLoadingState />;
    }

    if (state.status === 'onboardingRequired') {
        return <Navigate to="/onboarding/clinic" replace />;
    }

    if (state.status === 'recoveryRequired') {
        return <RecoveryRequiredState />;
    }

    if (state.status === 'error') {
        return (
            <OnboardingStatusErrorState
                message={state.error.message}
                code={state.error.code}
                onRetry={() => loadOnboardingStatus()}
            />
        );
    }

    return (
        <ActiveClinicProvider>
            <AppLayout />
        </ActiveClinicProvider>
    );
}

export default ProtectedAppShell;
