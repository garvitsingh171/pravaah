import { SignOutButton, useAuth } from '@clerk/react';
import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ErrorMessage, FieldError, LoadingState, useToast } from '../../components/feedback';
import { isApiClientError } from '../../lib';
import { defaultDashboardPath } from '../../routes/dashboardRoutes';
import {
    createClinicOnboarding,
    getOnboardingStatus,
    OnboardingStatus,
    type CreateClinicOnboardingRequest,
    type OnboardingStatusResponseData,
} from './onboardingApi';

type ClinicOnboardingFormValues = {
    name: string;
    slug: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    timezone: string;
    openingTime: string;
    closingTime: string;
    slotDurationMinutes: string;
    bufferMinutes: string;
};

type ClinicOnboardingFieldErrors = Partial<Record<keyof ClinicOnboardingFormValues, string>>;

type BackendValidationDetail = {
    field: string;
    message: string;
};

type StatusState =
    | {
          status: 'loading';
          data: null;
          error: null;
      }
    | {
          status: 'ready';
          data: OnboardingStatusResponseData;
          error: null;
      }
    | {
          status: 'error';
          data: null;
          error: {
              message: string;
              code?: string;
          };
      };

const redirectParamName = 'redirect_url';

const emptyFormValues: ClinicOnboardingFormValues = {
    name: '',
    slug: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    timezone: 'Asia/Kolkata',
    openingTime: '09:00',
    closingTime: '18:00',
    slotDurationMinutes: '15',
    bufferMinutes: '0',
};

const validationFieldMap: Partial<Record<string, keyof ClinicOnboardingFormValues>> = {
    'body.name': 'name',
    'body.slug': 'slug',
    'body.phone': 'phone',
    'body.email': 'email',
    'body.addressLine1': 'addressLine1',
    'body.addressLine2': 'addressLine2',
    'body.city': 'city',
    'body.state': 'state',
    'body.country': 'country',
    'body.pincode': 'pincode',
    'body.timezone': 'timezone',
    'body.openingTime': 'openingTime',
    'body.closingTime': 'closingTime',
    'body.slotDurationMinutes': 'slotDurationMinutes',
    'body.bufferMinutes': 'bufferMinutes',
};

const fieldBaseClass =
    'mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const timeShape = /^([01]\d|2[0-3]):[0-5]\d$/;
const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getFieldClassName = (hasError: boolean): string => {
    return `${fieldBaseClass} ${
        hasError ? 'border-red-300' : 'border-slate-300'
    } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`;
};

const getFieldErrorId = (field: keyof ClinicOnboardingFormValues): string => {
    return `clinic-onboarding-${field}-error`;
};

const getFieldErrorDescriptionId = (
    field: keyof ClinicOnboardingFormValues,
    fieldErrors: ClinicOnboardingFieldErrors
): string | undefined => {
    return fieldErrors[field] ? getFieldErrorId(field) : undefined;
};

const toSlugValue = (value: string): string => {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
};

const toOptionalString = (value: string): string | undefined => {
    const trimmedValue = value.trim();

    return trimmedValue || undefined;
};

const toOptionalInteger = (value: string): number | undefined => {
    return value.trim() ? Number(value) : undefined;
};

const hasPositiveIntegerShape = (value: string): boolean => {
    const numberValue = Number(value);

    return Number.isInteger(numberValue) && numberValue > 0;
};

const hasNonNegativeIntegerShape = (value: string): boolean => {
    const numberValue = Number(value);

    return Number.isInteger(numberValue) && numberValue >= 0;
};

const getBackendValidationDetails = (details: unknown): BackendValidationDetail[] => {
    if (!Array.isArray(details)) {
        return [];
    }

    return details.reduce<BackendValidationDetail[]>((validationDetails, detail) => {
        if (
            typeof detail !== 'object' ||
            detail === null ||
            !('field' in detail) ||
            !('message' in detail) ||
            typeof detail.field !== 'string' ||
            typeof detail.message !== 'string'
        ) {
            return validationDetails;
        }

        validationDetails.push({
            field: detail.field,
            message: detail.message,
        });

        return validationDetails;
    }, []);
};

const getBackendFieldErrors = (details: unknown): ClinicOnboardingFieldErrors => {
    return getBackendValidationDetails(details).reduce<ClinicOnboardingFieldErrors>(
        (errors, detail) => {
            const field = validationFieldMap[detail.field];

            if (field) {
                errors[field] = detail.message;
            }

            return errors;
        },
        {}
    );
};

const getApiErrorFieldErrors = (code: string, message: string, details: unknown) => {
    const backendFieldErrors = getBackendFieldErrors(details);

    if (code === 'CLINIC_SLUG_ALREADY_EXISTS') {
        return {
            ...backendFieldErrors,
            slug: message,
        };
    }

    return backendFieldErrors;
};

const validateClinicOnboardingForm = (
    values: ClinicOnboardingFormValues
): ClinicOnboardingFieldErrors => {
    const errors: ClinicOnboardingFieldErrors = {};
    const trimmedName = values.name.trim();
    const trimmedSlug = values.slug.trim();

    if (!trimmedName) {
        errors.name = 'Clinic name is required.';
    } else if (trimmedName.length < 2) {
        errors.name = 'Clinic name must be at least 2 characters long.';
    }

    if (!trimmedSlug) {
        errors.slug = 'Clinic slug is required.';
    } else if (trimmedSlug.length < 2) {
        errors.slug = 'Clinic slug must be at least 2 characters long.';
    } else if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
        errors.slug = 'Use lowercase letters, numbers, and hyphens only.';
    }

    if (values.email.trim() && !emailShape.test(values.email.trim())) {
        errors.email = 'Enter a valid clinic email address.';
    }

    if (values.openingTime.trim() && !timeShape.test(values.openingTime.trim())) {
        errors.openingTime = 'Use a 24-hour time such as 09:00.';
    }

    if (values.closingTime.trim() && !timeShape.test(values.closingTime.trim())) {
        errors.closingTime = 'Use a 24-hour time such as 18:00.';
    }

    if (values.slotDurationMinutes.trim() && !hasPositiveIntegerShape(values.slotDurationMinutes)) {
        errors.slotDurationMinutes = 'Slot duration must be a whole number greater than 0.';
    }

    if (values.bufferMinutes.trim() && !hasNonNegativeIntegerShape(values.bufferMinutes)) {
        errors.bufferMinutes = 'Buffer minutes must be a whole number greater than or equal to 0.';
    }

    return errors;
};

const toCreateClinicOnboardingRequest = (
    values: ClinicOnboardingFormValues
): CreateClinicOnboardingRequest => {
    return {
        name: values.name.trim(),
        slug: values.slug.trim(),
        phone: toOptionalString(values.phone),
        email: toOptionalString(values.email),
        addressLine1: toOptionalString(values.addressLine1),
        addressLine2: toOptionalString(values.addressLine2),
        city: toOptionalString(values.city),
        state: toOptionalString(values.state),
        country: toOptionalString(values.country),
        pincode: toOptionalString(values.pincode),
        timezone: toOptionalString(values.timezone),
        openingTime: toOptionalString(values.openingTime),
        closingTime: toOptionalString(values.closingTime),
        slotDurationMinutes: toOptionalInteger(values.slotDurationMinutes),
        bufferMinutes: toOptionalInteger(values.bufferMinutes),
    };
};

function RequiredMark() {
    return <span className="text-red-600">*</span>;
}

function FormField({
    field,
    label,
    values,
    fieldErrors,
    disabled,
    required = false,
    autoComplete,
    inputMode,
    type = 'text',
    placeholder,
    onChange,
}: {
    field: keyof ClinicOnboardingFormValues;
    label: string;
    values: ClinicOnboardingFormValues;
    fieldErrors: ClinicOnboardingFieldErrors;
    disabled: boolean;
    required?: boolean;
    autoComplete?: string;
    inputMode?: 'email' | 'numeric' | 'decimal' | 'tel';
    type?: string;
    placeholder?: string;
    onChange: (field: keyof ClinicOnboardingFormValues, value: string) => void;
}) {
    return (
        <label className="block text-sm font-medium text-slate-700">
            {label} {required ? <RequiredMark /> : null}
            <input
                className={getFieldClassName(Boolean(fieldErrors[field]))}
                value={values[field]}
                onChange={(event) => onChange(field, event.target.value)}
                disabled={disabled}
                autoComplete={autoComplete}
                inputMode={inputMode}
                type={type}
                placeholder={placeholder}
                aria-invalid={Boolean(fieldErrors[field])}
                aria-describedby={getFieldErrorDescriptionId(field, fieldErrors)}
                required={required}
            />
            <FieldError id={getFieldErrorId(field)} message={fieldErrors[field]} />
        </label>
    );
}

function OnboardingPageShell({
    children,
    eyebrow = 'First-time clinic setup',
}: {
    children: ReactNode;
    eyebrow?: string;
}) {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        to="/"
                        className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                        aria-label="Pravaah home"
                    >
                        <img
                            src="/pravaah-logo.png"
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-md"
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold uppercase text-blue-600">
                                Pravaah
                            </p>
                            <p className="text-base font-bold text-slate-950">{eyebrow}</p>
                        </div>
                    </Link>

                    <SignOutButton>
                        <button
                            type="button"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
                        >
                            Sign out
                        </button>
                    </SignOutButton>
                </header>

                {children}
            </div>
        </main>
    );
}

function ClinicOnboardingForm({
    values,
    fieldErrors,
    isSubmitting,
    onChange,
    onSubmit,
}: {
    values: ClinicOnboardingFormValues;
    fieldErrors: ClinicOnboardingFieldErrors;
    isSubmitting: boolean;
    onChange: (field: keyof ClinicOnboardingFormValues, value: string) => void;
    onSubmit: () => void;
}) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <form className="space-y-6" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Clinic name <RequiredMark />
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.name))}
                        value={values.name}
                        onChange={(event) => onChange('name', event.target.value)}
                        disabled={isSubmitting}
                        autoComplete="organization"
                        placeholder="Pravaah Family Clinic"
                        aria-invalid={Boolean(fieldErrors.name)}
                        aria-describedby={getFieldErrorDescriptionId('name', fieldErrors)}
                        required
                    />
                    <FieldError id={getFieldErrorId('name')} message={fieldErrors.name} />
                </label>

                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Clinic slug <RequiredMark />
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.slug))}
                        value={values.slug}
                        onChange={(event) => onChange('slug', event.target.value)}
                        disabled={isSubmitting}
                        autoComplete="off"
                        placeholder="pravaah-family-clinic"
                        aria-invalid={Boolean(fieldErrors.slug)}
                        aria-describedby={getFieldErrorDescriptionId('slug', fieldErrors)}
                        required
                    />
                    <FieldError id={getFieldErrorId('slug')} message={fieldErrors.slug} />
                </label>

                <FormField
                    field="phone"
                    label="Clinic phone"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    autoComplete="tel"
                    inputMode="tel"
                    onChange={onChange}
                />

                <FormField
                    field="email"
                    label="Clinic email"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="frontdesk@example.com"
                    onChange={onChange}
                />

                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Address line 1
                    <textarea
                        className={getFieldClassName(Boolean(fieldErrors.addressLine1))}
                        value={values.addressLine1}
                        onChange={(event) => onChange('addressLine1', event.target.value)}
                        disabled={isSubmitting}
                        rows={2}
                        autoComplete="address-line1"
                        aria-invalid={Boolean(fieldErrors.addressLine1)}
                        aria-describedby={getFieldErrorDescriptionId('addressLine1', fieldErrors)}
                    />
                    <FieldError
                        id={getFieldErrorId('addressLine1')}
                        message={fieldErrors.addressLine1}
                    />
                </label>

                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Address line 2
                    <textarea
                        className={getFieldClassName(Boolean(fieldErrors.addressLine2))}
                        value={values.addressLine2}
                        onChange={(event) => onChange('addressLine2', event.target.value)}
                        disabled={isSubmitting}
                        rows={2}
                        autoComplete="address-line2"
                        aria-invalid={Boolean(fieldErrors.addressLine2)}
                        aria-describedby={getFieldErrorDescriptionId('addressLine2', fieldErrors)}
                    />
                    <FieldError
                        id={getFieldErrorId('addressLine2')}
                        message={fieldErrors.addressLine2}
                    />
                </label>

                <FormField
                    field="city"
                    label="City"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    autoComplete="address-level2"
                    onChange={onChange}
                />

                <FormField
                    field="state"
                    label="State"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    autoComplete="address-level1"
                    onChange={onChange}
                />

                <FormField
                    field="country"
                    label="Country"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    autoComplete="country-name"
                    onChange={onChange}
                />

                <FormField
                    field="pincode"
                    label="Pincode"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    autoComplete="postal-code"
                    onChange={onChange}
                />

                <FormField
                    field="timezone"
                    label="Timezone"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    placeholder="Asia/Kolkata"
                    onChange={onChange}
                />

                <FormField
                    field="openingTime"
                    label="Opening time"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    type="time"
                    onChange={onChange}
                />

                <FormField
                    field="closingTime"
                    label="Closing time"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    type="time"
                    onChange={onChange}
                />

                <FormField
                    field="slotDurationMinutes"
                    label="Slot duration minutes"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    inputMode="numeric"
                    type="number"
                    onChange={onChange}
                />

                <FormField
                    field="bufferMinutes"
                    label="Buffer minutes"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    inputMode="numeric"
                    type="number"
                    onChange={onChange}
                />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-slate-500">
                    Your Pravaah Admin role and active status are assigned by the backend after the
                    clinic is created.
                </p>

                <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating clinic...' : 'Create clinic workspace'}
                </button>
            </div>
        </form>
    );
}

function ClinicOnboardingPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { showErrorToast, showSuccessToast } = useToast();
    const [statusState, setStatusState] = useState<StatusState>({
        status: 'loading',
        data: null,
        error: null,
    });
    const [values, setValues] = useState<ClinicOnboardingFormValues>(emptyFormValues);
    const [fieldErrors, setFieldErrors] = useState<ClinicOnboardingFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
    const [formErrorDetails, setFormErrorDetails] = useState<BackendValidationDetail[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasEditedSlug, setHasEditedSlug] = useState(false);

    const loadOnboardingStatus = useCallback(
        (signal?: AbortSignal) => {
            setStatusState({
                status: 'loading',
                data: null,
                error: null,
            });

            void getOnboardingStatus(signal)
                .then((data) => {
                    if (data.onboarding.status === OnboardingStatus.COMPLETED) {
                        navigate(defaultDashboardPath, {
                            replace: true,
                            state: {
                                statusMessage: 'Clinic onboarding is already complete.',
                            },
                        });
                        return;
                    }

                    setStatusState({
                        status: 'ready',
                        data,
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
                        setStatusState({
                            status: 'error',
                            data: null,
                            error: {
                                message: error.message,
                                code: error.code,
                            },
                        });
                        return;
                    }

                    setStatusState({
                        status: 'error',
                        data: null,
                        error: {
                            message: 'Onboarding status could not be loaded. Please try again.',
                            code: 'ONBOARDING_STATUS_FAILED',
                        },
                    });
                });
        },
        [navigate]
    );

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

    const clearErrorsForChange = (field: keyof ClinicOnboardingFormValues) => {
        setFieldErrors((currentErrors) => ({
            ...currentErrors,
            [field]: undefined,
        }));
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);
    };

    const handleChange = (field: keyof ClinicOnboardingFormValues, value: string) => {
        if (field === 'slug') {
            setHasEditedSlug(true);
        }

        setValues((currentValues) => {
            if (field === 'name' && !hasEditedSlug) {
                return {
                    ...currentValues,
                    name: value,
                    slug: toSlugValue(value),
                };
            }

            return {
                ...currentValues,
                [field]: field === 'slug' ? toSlugValue(value) : value,
            };
        });

        clearErrorsForChange(field);

        if (field === 'name' && !hasEditedSlug) {
            clearErrorsForChange('slug');
        }
    };

    const handleSubmit = async () => {
        const nextFieldErrors = validateClinicOnboardingForm(values);

        setFieldErrors(nextFieldErrors);
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);

        if (Object.keys(nextFieldErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);

        try {
            await createClinicOnboarding(toCreateClinicOnboardingRequest(values));

            showSuccessToast('Clinic workspace created successfully.');
            navigate(defaultDashboardPath, {
                replace: true,
                state: {
                    statusMessage: 'Clinic workspace created successfully.',
                },
            });
        } catch (error) {
            if (isApiClientError(error)) {
                if (error.code === 'API_NETWORK_ERROR') {
                    try {
                        const reconciledStatus = await getOnboardingStatus();

                        if (reconciledStatus.onboarding.status === OnboardingStatus.COMPLETED) {
                            showSuccessToast('Clinic workspace created successfully.');
                            navigate(defaultDashboardPath, {
                                replace: true,
                                state: {
                                    statusMessage: 'Clinic workspace created successfully.',
                                },
                            });
                            return;
                        }

                        if (
                            reconciledStatus.onboarding.status ===
                            OnboardingStatus.RECOVERY_REQUIRED
                        ) {
                            setStatusState({
                                status: 'ready',
                                data: reconciledStatus,
                                error: null,
                            });
                            setFieldErrors({});
                            setFormError(null);
                            setFormErrorCode(undefined);
                            setFormErrorDetails([]);
                            return;
                        }

                        setStatusState({
                            status: 'ready',
                            data: reconciledStatus,
                            error: null,
                        });
                    } catch (statusError) {
                        if (
                            statusError instanceof Error &&
                            statusError.name === 'AbortError'
                        ) {
                            return;
                        }
                    }
                }

                setFieldErrors(getApiErrorFieldErrors(error.code, error.message, error.details));
                setFormError(error.message);
                setFormErrorCode(error.code);
                setFormErrorDetails(getBackendValidationDetails(error.details));
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Clinic workspace could not be created. Please try again.';

            setFormError(fallbackMessage);
            setFormErrorCode('CLINIC_ONBOARDING_FAILED');
            showErrorToast(fallbackMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <LoadingState message="Loading clinic onboarding..." />
            </div>
        );
    }

    if (!isSignedIn) {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        const loginPath = `/login?${redirectParamName}=${encodeURIComponent(returnTo)}`;

        return <Navigate to={loginPath} replace />;
    }

    if (statusState.status === 'loading') {
        return (
            <OnboardingPageShell>
                <div className="flex min-h-[22rem] items-center justify-center">
                    <LoadingState message="Checking onboarding status..." />
                </div>
            </OnboardingPageShell>
        );
    }

    if (statusState.status === 'error') {
        return (
            <OnboardingPageShell>
                <div className="mx-auto w-full max-w-2xl">
                    <ErrorMessage
                        title="Onboarding could not be loaded"
                        message={statusState.error.message}
                        code={statusState.error.code}
                        details={[
                            'Confirm the backend server is running and VITE_API_BASE_URL points to the backend /api URL.',
                            'Confirm your Clerk session is active before retrying.',
                        ]}
                        onRetry={() => loadOnboardingStatus()}
                    />
                </div>
            </OnboardingPageShell>
        );
    }

    if (statusState.data.onboarding.status === OnboardingStatus.RECOVERY_REQUIRED) {
        return (
            <OnboardingPageShell eyebrow="Account recovery required">
                <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                    <ErrorMessage
                        title="Account needs recovery"
                        message="This Clerk identity has an internal Pravaah account state that cannot continue clinic onboarding."
                        code="RECOVERY_REQUIRED"
                        details={[
                            'This account was not granted operational clinic access.',
                            'Recovery handling is outside this onboarding UI issue.',
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
            </OnboardingPageShell>
        );
    }

    return (
        <OnboardingPageShell>
            <section className="grid gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-semibold uppercase text-blue-600">
                            Clinic bootstrap
                        </p>
                        <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
                            Create your clinic workspace.
                        </h1>
                        <p className="mt-4 text-base leading-7 text-slate-600">
                            Add the clinic profile Pravaah needs to provision the first active Admin
                            account and open the operational workspace.
                        </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <h2 className="text-base font-bold text-slate-950">What happens next</h2>
                        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                            <li>Pravaah uses your current Clerk identity as the trusted account.</li>
                            <li>The backend creates the clinic and first Admin together.</li>
                            <li>Role, status, user ID, and clinic ownership are never chosen here.</li>
                        </ul>
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
                        Entered values stay on the page if validation or a recoverable server error
                        occurs, so you can correct only the fields that need attention.
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    {formError ? (
                        <div className="mb-6">
                            <ErrorMessage
                                title="Clinic was not created"
                                message={formError}
                                code={formErrorCode}
                                details={formErrorDetails}
                            />
                        </div>
                    ) : null}

                    <ClinicOnboardingForm
                        values={values}
                        fieldErrors={fieldErrors}
                        isSubmitting={isSubmitting}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                    />
                </div>
            </section>
        </OnboardingPageShell>
    );
}

export default ClinicOnboardingPage;
