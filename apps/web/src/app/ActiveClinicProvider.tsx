import { useAuth } from '@clerk/react';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { ErrorMessage, LoadingState } from '../components/feedback';
import {
    ACTIVE_CLINIC_MISSING_ERROR_CODE,
    ACTIVE_CLINIC_MISSING_MESSAGE,
    ACTIVE_CLINIC_STORAGE_KEY,
    isApiClientError,
    type ActiveClinicContext,
    type ActiveClinicResolution,
    resolveActiveClinicContext,
} from '../lib';
import { getCurrentUserProfile } from '../features/auth/authApi';
import { ActiveClinicReactContext } from './activeClinicContext';

type ActiveClinicProviderState =
    | {
          status: 'loading';
          activeClinic: null;
          error: null;
      }
    | {
          status: 'ready';
          activeClinic: ActiveClinicContext;
          error: null;
      }
    | {
          status: 'missing';
          activeClinic: null;
          error: {
              details: string[];
          };
      }
    | {
          status: 'unprovisioned';
          activeClinic: null;
          error: null;
      }
    | {
          status: 'error';
          activeClinic: null;
          error: {
              message: string;
              code?: string;
          };
      };

const loadingState: ActiveClinicProviderState = {
    status: 'loading',
    activeClinic: null,
    error: null,
};

const buildMissingClinicDetails = (resolution: ActiveClinicResolution): string[] => {
    const details = [
        'Seed a local demo clinic and an ACTIVE internal ADMIN or STAFF user linked to that clinic.',
        'Set VITE_DEFAULT_CLINIC_ID in apps/web/.env for MVP/demo usage. It should match an active clinic ID.',
        `Or choose an active clinic by storing its ID in localStorage using ${ACTIVE_CLINIC_STORAGE_KEY}.`,
    ];

    const { authenticatedUser, localStorage, environment } = resolution.sources;

    if (!authenticatedUser.present) {
        details.unshift('The authenticated Pravaah user profile loaded, but it has no clinicId.');
    } else if (!authenticatedUser.valid) {
        if (!authenticatedUser.hasClinicSummary) {
            details.unshift(
                'The authenticated Pravaah user has a clinicId, but the related clinic was not returned by the backend.'
            );
        } else if (!authenticatedUser.clinicMatchesUser) {
            details.unshift(
                'The authenticated Pravaah user clinicId does not match the related clinic returned by the backend.'
            );
        } else if (!authenticatedUser.clinicIsActive) {
            details.unshift('The authenticated Pravaah user clinic exists, but it is inactive.');
        } else {
            details.unshift('The authenticated Pravaah user clinicId is not a valid UUID.');
        }
    }

    if (localStorage.clearedInvalidValue) {
        details.push(
            `An invalid ${ACTIVE_CLINIC_STORAGE_KEY} value was removed from localStorage.`
        );
    }

    if (environment.present && !environment.valid) {
        details.push('VITE_DEFAULT_CLINIC_ID is set, but it is not a valid clinic UUID.');
    }

    return details;
};

const warnAboutMissingClinicInDevelopment = (resolution: ActiveClinicResolution): void => {
    if (!import.meta.env.DEV) {
        return;
    }

    console.warn('[active-clinic] No active clinic context resolved.', {
        authenticatedUser: {
            hasClinicId: resolution.sources.authenticatedUser.present,
            clinicIdAccepted: resolution.sources.authenticatedUser.valid,
            hasClinicSummary: resolution.sources.authenticatedUser.hasClinicSummary,
            clinicIsActive: resolution.sources.authenticatedUser.clinicIsActive,
        },
        localStorage: {
            hasValue: resolution.sources.localStorage.present,
            valueAccepted: resolution.sources.localStorage.valid,
            clearedInvalidValue: resolution.sources.localStorage.clearedInvalidValue,
        },
        environment: {
            hasValue: resolution.sources.environment.present,
            valueAccepted: resolution.sources.environment.valid,
        },
    });
};

function MissingActiveClinicState({ details }: { details: string[] }) {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
            <div className="mx-auto max-w-2xl">
                <ErrorMessage
                    title="Active clinic is not configured"
                    message={ACTIVE_CLINIC_MISSING_MESSAGE}
                    code={ACTIVE_CLINIC_MISSING_ERROR_CODE}
                    details={details}
                />
            </div>
        </div>
    );
}

function ActiveClinicLoadingState() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <LoadingState message="Resolving clinic access..." />
        </div>
    );
}

function ActiveClinicErrorState({ message, code }: { message: string; code?: string }) {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
            <div className="mx-auto max-w-2xl">
                <ErrorMessage
                    title="Clinic access could not be loaded"
                    message={message}
                    code={code}
                    details={[
                        'Confirm the backend server is running and Clerk tokens are being sent.',
                        'Confirm the signed-in Clerk user has an ACTIVE internal Pravaah User row.',
                        'Confirm the internal User has a clinicId linked to an active Clinic.',
                    ]}
                />
            </div>
        </div>
    );
}

function UnprovisionedIdentityState() {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
            <div className="mx-auto max-w-2xl">
                <ErrorMessage
                    title="Account is not provisioned yet"
                    message="Your Clerk session is valid, but this identity does not have an internal Pravaah user, role, or clinic assignment yet."
                    code="INTERNAL_USER_NOT_FOUND"
                    details={[
                        'This account is authenticated but not an Admin, Staff member, clinic owner, or operational application user.',
                        'Clinic onboarding and internal user provisioning are not implemented in this issue.',
                        'Ask a project administrator to provision an ACTIVE internal Pravaah user for operational access.',
                    ]}
                />
            </div>
        </div>
    );
}

function ActiveClinicProvider({ children }: PropsWithChildren) {
    const { getToken } = useAuth();
    const [state, setState] = useState<ActiveClinicProviderState>(loadingState);

    useEffect(() => {
        const abortController = new AbortController();

        void getCurrentUserProfile({
            authToken: () => getToken(),
            signal: abortController.signal,
        })
            .then(({ user }) => {
                const resolution = resolveActiveClinicContext(user);

                if (!resolution.activeClinic) {
                    warnAboutMissingClinicInDevelopment(resolution);
                    setState({
                        status: 'missing',
                        activeClinic: null,
                        error: {
                            details: buildMissingClinicDetails(resolution),
                        },
                    });
                    return;
                }

                setState({
                    status: 'ready',
                    activeClinic: resolution.activeClinic,
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
                    if (error.code === 'INTERNAL_USER_NOT_FOUND') {
                        setState({
                            status: 'unprovisioned',
                            activeClinic: null,
                            error: null,
                        });
                        return;
                    }

                    setState({
                        status: 'error',
                        activeClinic: null,
                        error: {
                            message: error.message,
                            code: error.code,
                        },
                    });
                    return;
                }

                setState({
                    status: 'error',
                    activeClinic: null,
                    error: {
                        message: 'Active clinic context could not be resolved. Please try again.',
                        code: 'ACTIVE_CLINIC_RESOLUTION_FAILED',
                    },
                });
            });

        return () => {
            abortController.abort();
        };
    }, [getToken]);

    if (state.status === 'loading') {
        return <ActiveClinicLoadingState />;
    }

    if (state.status === 'error') {
        return <ActiveClinicErrorState message={state.error.message} code={state.error.code} />;
    }

    if (state.status === 'missing') {
        return <MissingActiveClinicState details={state.error.details} />;
    }

    if (state.status === 'unprovisioned') {
        return <UnprovisionedIdentityState />;
    }

    return (
        <ActiveClinicReactContext.Provider value={state.activeClinic}>
            {children}
        </ActiveClinicReactContext.Provider>
    );
}

export default ActiveClinicProvider;
