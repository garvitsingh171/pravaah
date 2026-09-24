import { useAuth, useClerk } from '@clerk/react';
import { motion } from 'motion/react';
import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PravaahLogoLink } from '../../components/brand';
import { ErrorMessage, FieldError, LoadingState, useToast } from '../../components/feedback';
import { fieldControlClassName } from '../../components/ui';
import { isApiClientError } from '../../lib';
import { dashboardRoutes, defaultDashboardPath } from '../../routes/dashboardRoutes';
import {
    createClinicOnboarding,
    getOnboardingStatus,
    OnboardingStatus,
    provisionSampleData,
    type CreateClinicOnboardingRequest,
    type OnboardingStatusResponseData,
    type ProvisionSampleDataResponseData,
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

const onboardingProgressItems = ['Identity', 'Clinic profile', 'Workspace'];

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

type SampleDataDecisionState = {
    clinic: NonNullable<OnboardingStatusResponseData['clinic']>;
    status: 'idle' | 'provisioning' | 'error';
    error: {
        message: string;
        code?: string;
    } | null;
    summary: ProvisionSampleDataResponseData['summary'] | null;
};

const redirectParamName = 'redirect_url';
const protectedApplicationPaths = new Set(dashboardRoutes.map((route) => route.path));

const normalizeApplicationPath = (path: string): string => {
    return path.replace(/\/+$/, '') || defaultDashboardPath;
};

const getSafeApplicationRedirectPath = (redirectUrl: string | null): string => {
    if (!redirectUrl) {
        return defaultDashboardPath;
    }

    try {
        const parsedUrl = new URL(redirectUrl, window.location.origin);
        const normalizedPath = normalizeApplicationPath(parsedUrl.pathname);

        if (
            parsedUrl.origin !== window.location.origin ||
            !protectedApplicationPaths.has(normalizedPath)
        ) {
            return defaultDashboardPath;
        }

        return `${normalizedPath}${parsedUrl.search}${parsedUrl.hash}`;
    } catch {
        return defaultDashboardPath;
    }
};

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

const fieldBaseClass = fieldControlClassName;

const timeShape = /^([01]\d|2[0-3]):[0-5]\d$/;
const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getFieldClassName = (hasError: boolean): string => {
    return `${fieldBaseClass} ${
        hasError ? 'border-[var(--color-status-danger-border)]' : ''
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
    return <span className="text-[var(--color-status-danger-text)]">*</span>;
}

function FormSection({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="space-y-4 rounded-xl border border-slate-200/80 bg-white/70 p-5 shadow-[0_4px_18px_rgba(15,23,42,0.03)] last:border-b-0 last:pb-5 sm:p-6"
        >
            <div>
                <h2 className="text-base font-semibold text-slate-950">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">{children}</div>
        </motion.section>
    );
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
    helperText,
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
    helperText?: string;
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
            {helperText ? (
                <span className="mt-1 block text-xs text-slate-500">{helperText}</span>
            ) : null}
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
    const { signOut } = useClerk();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut({ redirectUrl: '/' });
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_36%),linear-gradient(135deg,_#eff8f7_0%,_#f8fafc_52%,_#e9f0f5_100%)] px-4 py-5 text-slate-900 sm:py-8"
        >
            <div
                className="pointer-events-none absolute -left-24 top-32 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl"
                aria-hidden="true"
            />
            <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
                <motion.header
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                    className="flex flex-col gap-4 rounded-2xl border border-white/80 bg-white/90 px-4 py-4 shadow-[var(--shadow-soft)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                    <PravaahLogoLink layout="horizontal" surface="light" size="sm">
                        <span className="hidden text-base font-bold text-slate-950 sm:inline">
                            {eyebrow}
                        </span>
                    </PravaahLogoLink>

                    <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-soft hover:bg-brand-subtle hover:text-brand-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:cursor-wait disabled:opacity-70 sm:w-auto"
                        disabled={isSigningOut}
                        onClick={() => void handleSignOut()}
                    >
                        {isSigningOut ? 'Signing out...' : 'Sign out'}
                    </motion.button>
                </motion.header>

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.12 }}
                    className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[var(--shadow-soft)] backdrop-blur sm:p-5"
                    aria-labelledby="onboarding-progress-title"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p
                                id="onboarding-progress-title"
                                className="text-xs font-bold uppercase tracking-[0.18em] text-brand-foreground"
                            >
                                Setup path
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                                Build a workspace ready for the clinic day
                            </p>
                        </div>
                        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-subtle px-3 py-1.5 text-xs font-bold text-brand-foreground ring-1 ring-brand-soft">
                            <span
                                className="h-1.5 w-1.5 rounded-full bg-brand"
                                aria-hidden="true"
                            />
                            Step 2 of 3
                        </span>
                    </div>
                    <ol
                        className="mt-5 grid gap-3 sm:grid-cols-3"
                        aria-label="Clinic setup progress"
                    >
                        {onboardingProgressItems.map((item, index) => (
                            <li key={item} aria-current={index === 1 ? 'step' : undefined}>
                                <div
                                    className={
                                        index === 1
                                            ? 'flex items-center gap-3 rounded-xl border border-brand-soft bg-brand-subtle px-3 py-3 transition'
                                            : index < 1
                                              ? 'flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 transition'
                                              : 'flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition'
                                    }
                                >
                                    <span
                                        className={
                                            index === 1
                                                ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-slate-950 shadow-sm'
                                                : index < 1
                                                  ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white'
                                                  : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-400 ring-1 ring-slate-200'
                                        }
                                    >
                                        {index < 1 ? '✓' : index + 1}
                                    </span>
                                    <span
                                        className={
                                            index === 1
                                                ? 'text-sm font-semibold text-brand-foreground'
                                                : index < 1
                                                  ? 'text-sm font-semibold text-emerald-800'
                                                  : 'text-sm font-semibold text-slate-500'
                                        }
                                    >
                                        {item}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ol>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-app-muted">
                        Pravaah keeps identity, clinic creation, and workspace access separate so
                        recovery states can be handled without guessing operational roles in the
                        browser.
                    </p>
                </motion.section>

                {children}
            </div>
        </motion.main>
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
            <FormSection
                title="Clinic Identity"
                description="Name the workspace and choose the unique slug used to identify this clinic in Pravaah."
            >
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
                    <span className="mt-1 block text-xs text-slate-500">
                        Use lowercase letters, numbers, and hyphens. The backend enforces
                        uniqueness.
                    </span>
                    <FieldError id={getFieldErrorId('slug')} message={fieldErrors.slug} />
                </label>
            </FormSection>

            <FormSection
                title="Contact Information"
                description="Add front-desk contact details that staff can recognize later in clinic settings."
            >
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
            </FormSection>

            <FormSection
                title="Address"
                description="Keep the location simple and editable. These fields do not grant clinic access."
            >
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
            </FormSection>

            <FormSection
                title="Regional Settings"
                description="These settings drive appointment time display and daily reporting for the clinic."
            >
                <FormField
                    field="timezone"
                    label="Timezone"
                    values={values}
                    fieldErrors={fieldErrors}
                    disabled={isSubmitting}
                    placeholder="Asia/Kolkata"
                    helperText="Use an IANA timezone such as Asia/Kolkata."
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
                    helperText="How long a normal appointment slot lasts."
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
                    helperText="Additional time kept between appointments."
                    onChange={onChange}
                />
            </FormSection>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-slate-500">
                    Your Pravaah Admin role and active status are assigned by the backend after the
                    clinic is created.
                </p>

                <motion.button
                    type="submit"
                    whileHover={isSubmitting ? undefined : { y: -1 }}
                    whileTap={isSubmitting ? undefined : { scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="rounded-lg bg-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-action-hover disabled:cursor-not-allowed disabled:bg-action-soft"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating clinic...' : 'Create clinic workspace'}
                </motion.button>
            </div>
        </form>
    );
}

function SampleDataDecisionPanel({
    state,
    onAddSampleData,
    onSkipSampleData,
}: {
    state: SampleDataDecisionState;
    onAddSampleData: () => void;
    onSkipSampleData: () => void;
}) {
    const isProvisioning = state.status === 'provisioning';

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start"
        >
            <div className="space-y-5">
                <div>
                    <p className="text-sm font-semibold uppercase text-brand-foreground">
                        Workspace created
                    </p>
                    <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
                        Add fictional sample data?
                    </h1>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                        {state.clinic.name} is ready. You can add demonstration records now, or open
                        Pravaah with an empty clinic and build the workflow yourself.
                    </p>
                </div>

                <div className="rounded-lg border border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-bg)] p-5 text-sm leading-6 text-[var(--color-status-warning-text)]">
                    All generated records are fictional demonstration content. They are created only
                    inside this clinic and are not based on real patient data.
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.12 }}
                className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-[var(--shadow-raised)] ring-1 ring-slate-200/50 md:p-7"
            >
                {state.status === 'error' && state.error ? (
                    <div className="mb-5">
                        <ErrorMessage
                            title="Sample data was not added"
                            message={state.error.message}
                            code={state.error.code}
                            details={[
                                'You can retry provisioning sample data.',
                                'You can also continue with an empty clinic and add records manually.',
                            ]}
                        />
                    </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-4">
                        <p className="text-2xl font-bold text-slate-950">3</p>
                        <p className="mt-1 text-sm text-slate-600">sample doctors</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                        <p className="text-2xl font-bold text-slate-950">6</p>
                        <p className="mt-1 text-sm text-slate-600">sample patients</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                        <p className="text-2xl font-bold text-slate-950">9</p>
                        <p className="mt-1 text-sm text-slate-600">appointments and predictions</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                        <p className="text-2xl font-bold text-slate-950">6</p>
                        <p className="mt-1 text-sm text-slate-600">today queue entries</p>
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-soft hover:bg-brand-subtle hover:text-brand-foreground disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        disabled={isProvisioning}
                        onClick={onSkipSampleData}
                    >
                        Continue with an empty clinic
                    </button>
                    <button
                        type="button"
                        className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-white transition hover:bg-action-hover disabled:cursor-not-allowed disabled:bg-action-soft"
                        disabled={isProvisioning}
                        onClick={onAddSampleData}
                    >
                        {isProvisioning ? 'Adding sample data...' : 'Add fictional sample data'}
                    </button>
                </div>
            </motion.div>
        </motion.section>
    );
}

function ClinicOnboardingPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showErrorToast, showSuccessToast } = useToast();
    const applicationRedirectPath = getSafeApplicationRedirectPath(
        searchParams.get(redirectParamName)
    );
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
    const [sampleDataDecision, setSampleDataDecision] = useState<SampleDataDecisionState | null>(
        null
    );

    const navigateToApplication = useCallback(
        (statusMessage: string) => {
            navigate(applicationRedirectPath, {
                replace: true,
                state: {
                    statusMessage,
                },
            });
        },
        [applicationRedirectPath, navigate]
    );

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
                        navigateToApplication('Clinic onboarding is already complete.');
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
        [navigateToApplication]
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
            const onboardingResult = await createClinicOnboarding(
                toCreateClinicOnboardingRequest(values)
            );

            if (!onboardingResult.clinic) {
                throw new Error('Clinic onboarding response did not include a clinic.');
            }

            showSuccessToast('Clinic workspace created successfully.');
            setStatusState({
                status: 'ready',
                data: onboardingResult,
                error: null,
            });
            setSampleDataDecision({
                clinic: onboardingResult.clinic,
                status: 'idle',
                error: null,
                summary: null,
            });
        } catch (error) {
            if (isApiClientError(error)) {
                if (error.code === 'API_NETWORK_ERROR') {
                    try {
                        const reconciledStatus = await getOnboardingStatus();

                        if (reconciledStatus.onboarding.status === OnboardingStatus.COMPLETED) {
                            if (!reconciledStatus.clinic) {
                                navigateToApplication('Clinic workspace created successfully.');
                                return;
                            }

                            showSuccessToast('Clinic workspace created successfully.');
                            setStatusState({
                                status: 'ready',
                                data: reconciledStatus,
                                error: null,
                            });
                            setSampleDataDecision({
                                clinic: reconciledStatus.clinic,
                                status: 'idle',
                                error: null,
                                summary: null,
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
                        if (statusError instanceof Error && statusError.name === 'AbortError') {
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

    const handleAddSampleData = async () => {
        if (!sampleDataDecision || sampleDataDecision.status === 'provisioning') {
            return;
        }

        setSampleDataDecision({
            ...sampleDataDecision,
            status: 'provisioning',
            error: null,
        });

        try {
            const result = await provisionSampleData(sampleDataDecision.clinic.id);
            const statusMessage =
                result.outcome === 'ALREADY_PROVISIONED'
                    ? 'Sample data was already available.'
                    : 'Fictional sample data added successfully.';

            showSuccessToast(statusMessage);
            navigateToApplication(statusMessage);
        } catch (error) {
            if (isApiClientError(error)) {
                if (error.code === 'SAMPLE_DATA_ALREADY_PROVISIONED') {
                    showSuccessToast('Sample data was already available.');
                    navigateToApplication('Sample data was already available.');
                    return;
                }

                setSampleDataDecision((currentDecision) =>
                    currentDecision
                        ? {
                              ...currentDecision,
                              status: 'error',
                              error: {
                                  message: error.message,
                                  code: error.code,
                              },
                          }
                        : currentDecision
                );
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Sample data could not be added. Please try again.';

            setSampleDataDecision((currentDecision) =>
                currentDecision
                    ? {
                          ...currentDecision,
                          status: 'error',
                          error: {
                              message: fallbackMessage,
                              code: 'SAMPLE_DATA_PROVISIONING_FAILED',
                          },
                      }
                    : currentDecision
            );
            showErrorToast(fallbackMessage);
        }
    };

    const handleSkipSampleData = () => {
        navigateToApplication('Clinic workspace created successfully.');
    };

    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <LoadingState message="Preparing clinic onboarding..." />
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
                    <LoadingState message="Checking clinic workspace status..." />
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
                </div>
            </OnboardingPageShell>
        );
    }

    if (sampleDataDecision) {
        return (
            <OnboardingPageShell eyebrow="Sample data choice">
                <SampleDataDecisionPanel
                    state={sampleDataDecision}
                    onAddSampleData={handleAddSampleData}
                    onSkipSampleData={handleSkipSampleData}
                />
            </OnboardingPageShell>
        );
    }

    return (
        <OnboardingPageShell>
            <section className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
                <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.16 }}
                    className="space-y-6"
                >
                    <div>
                        <p className="text-sm font-semibold uppercase text-brand-foreground">
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

                    <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[var(--shadow-soft)] backdrop-blur">
                        <h2 className="text-base font-bold text-slate-950">What happens next</h2>
                        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                            <li className="flex items-start gap-3">
                                <span
                                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700"
                                    aria-hidden="true"
                                >
                                    ✓
                                </span>
                                <span>
                                    Pravaah uses your current Clerk identity as the trusted account.
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span
                                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700"
                                    aria-hidden="true"
                                >
                                    ✓
                                </span>
                                <span>
                                    The backend creates the clinic and first Admin together.
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span
                                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700"
                                    aria-hidden="true"
                                >
                                    ✓
                                </span>
                                <span>
                                    Role, status, user ID, and clinic ownership are never chosen
                                    here.
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-5 text-sm leading-6 text-emerald-800 shadow-[var(--shadow-soft)]">
                        Entered values stay on the page if validation or a recoverable server error
                        occurs, so you can correct only the fields that need attention.
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.22 }}
                    className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-[var(--shadow-raised)] ring-1 ring-slate-200/50 md:p-7 lg:sticky lg:top-6"
                >
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
                </motion.div>
            </section>
        </OnboardingPageShell>
    );
}

export default ClinicOnboardingPage;
