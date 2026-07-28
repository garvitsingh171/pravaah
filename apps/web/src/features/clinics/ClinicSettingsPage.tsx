import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useActiveClinic } from '../../app/activeClinicContext';
import { ErrorMessage, FieldError, LoadingState, useToast } from '../../components/feedback';
import { isApiClientError } from '../../lib';
import {
    getClinicSettings,
    updateClinicSettings,
    type ClinicSettings,
    type UpdateClinicSettingsRequest,
} from './clinicApi';

type ClinicSettingsFormValues = {
    name: string;
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

type ClinicSettingsFieldErrors = Partial<Record<keyof ClinicSettingsFormValues, string>>;

type BackendValidationDetail = {
    field: string;
    message: string;
};

type SettingsPageState =
    | {
          status: 'loading';
          clinic: null;
          error: null;
      }
    | {
          status: 'ready';
          clinic: ClinicSettings;
          error: null;
      }
    | {
          status: 'error';
          clinic: null;
          error: {
              message: string;
              code?: string;
          };
      };

const fieldBaseClass =
    'mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const timeShape = /^([01]\d|2[0-3]):[0-5]\d$/;
const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validationFieldMap: Partial<Record<string, keyof ClinicSettingsFormValues>> = {
    'body.name': 'name',
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

const toFormValues = (clinic: ClinicSettings): ClinicSettingsFormValues => ({
    name: clinic.name,
    phone: clinic.phone ?? '',
    email: clinic.email ?? '',
    addressLine1: clinic.addressLine1 ?? '',
    addressLine2: clinic.addressLine2 ?? '',
    city: clinic.city ?? '',
    state: clinic.state ?? '',
    country: clinic.country,
    pincode: clinic.pincode ?? '',
    timezone: clinic.timezone,
    openingTime: clinic.openingTime,
    closingTime: clinic.closingTime,
    slotDurationMinutes: String(clinic.slotDurationMinutes),
    bufferMinutes: String(clinic.bufferMinutes),
});

const getFieldClassName = (hasError: boolean): string => {
    return `${fieldBaseClass} ${
        hasError ? 'border-red-300' : 'border-slate-300'
    } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`;
};

const getFieldErrorId = (field: keyof ClinicSettingsFormValues): string => {
    return `clinic-settings-${field}-error`;
};

const getFieldErrorDescriptionId = (
    field: keyof ClinicSettingsFormValues,
    fieldErrors: ClinicSettingsFieldErrors
): string | undefined => {
    return fieldErrors[field] ? getFieldErrorId(field) : undefined;
};

const toNullableString = (value: string): string | null => {
    const trimmedValue = value.trim();

    return trimmedValue || null;
};

const hasPositiveIntegerShape = (value: string): boolean => {
    const numberValue = Number(value);

    return Number.isInteger(numberValue) && numberValue > 0;
};

const hasNonNegativeIntegerShape = (value: string): boolean => {
    const numberValue = Number(value);

    return Number.isInteger(numberValue) && numberValue >= 0;
};

const isSupportedTimezone = (timezone: string): boolean => {
    const trimmedTimezone = timezone.trim();

    if (!trimmedTimezone) {
        return false;
    }

    try {
        new Intl.DateTimeFormat('en-US', {
            timeZone: trimmedTimezone,
        }).format(new Date());

        return true;
    } catch {
        return false;
    }
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

const getBackendFieldErrors = (details: unknown): ClinicSettingsFieldErrors => {
    return getBackendValidationDetails(details).reduce<ClinicSettingsFieldErrors>(
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

const validateClinicSettingsForm = (
    values: ClinicSettingsFormValues
): ClinicSettingsFieldErrors => {
    const errors: ClinicSettingsFieldErrors = {};
    const name = values.name.trim();
    const country = values.country.trim();
    const timezone = values.timezone.trim();

    if (!name) {
        errors.name = 'Clinic name is required.';
    } else if (name.length < 2) {
        errors.name = 'Clinic name must be at least 2 characters long.';
    }

    if (values.email.trim() && !emailShape.test(values.email.trim())) {
        errors.email = 'Enter a valid clinic email address.';
    }

    if (!country) {
        errors.country = 'Country is required.';
    }

    if (!isSupportedTimezone(timezone)) {
        errors.timezone = 'Enter a valid IANA timezone such as Asia/Kolkata.';
    }

    if (!timeShape.test(values.openingTime.trim())) {
        errors.openingTime = 'Use a 24-hour time such as 09:00.';
    }

    if (!timeShape.test(values.closingTime.trim())) {
        errors.closingTime = 'Use a 24-hour time such as 18:00.';
    }

    if (!hasPositiveIntegerShape(values.slotDurationMinutes.trim())) {
        errors.slotDurationMinutes = 'Slot duration must be a whole number greater than 0.';
    }

    if (!hasNonNegativeIntegerShape(values.bufferMinutes.trim())) {
        errors.bufferMinutes = 'Buffer minutes must be a whole number greater than or equal to 0.';
    }

    return errors;
};

const toComparableValues = (values: ClinicSettingsFormValues) => ({
    name: values.name.trim(),
    phone: toNullableString(values.phone),
    email: toNullableString(values.email),
    addressLine1: toNullableString(values.addressLine1),
    addressLine2: toNullableString(values.addressLine2),
    city: toNullableString(values.city),
    state: toNullableString(values.state),
    country: values.country.trim(),
    pincode: toNullableString(values.pincode),
    timezone: values.timezone.trim(),
    openingTime: values.openingTime.trim(),
    closingTime: values.closingTime.trim(),
    slotDurationMinutes: Number(values.slotDurationMinutes.trim()),
    bufferMinutes: Number(values.bufferMinutes.trim()),
});

const buildChangedSettingsPayload = (
    currentValues: ClinicSettingsFormValues,
    initialValues: ClinicSettingsFormValues
): UpdateClinicSettingsRequest => {
    const current = toComparableValues(currentValues);
    const initial = toComparableValues(initialValues);
    const payload: UpdateClinicSettingsRequest = {};

    if (current.name !== initial.name) payload.name = current.name;
    if (current.phone !== initial.phone) payload.phone = current.phone;
    if (current.email !== initial.email) payload.email = current.email;
    if (current.addressLine1 !== initial.addressLine1) payload.addressLine1 = current.addressLine1;
    if (current.addressLine2 !== initial.addressLine2) payload.addressLine2 = current.addressLine2;
    if (current.city !== initial.city) payload.city = current.city;
    if (current.state !== initial.state) payload.state = current.state;
    if (current.country !== initial.country) payload.country = current.country;
    if (current.pincode !== initial.pincode) payload.pincode = current.pincode;
    if (current.timezone !== initial.timezone) payload.timezone = current.timezone;
    if (current.openingTime !== initial.openingTime) payload.openingTime = current.openingTime;
    if (current.closingTime !== initial.closingTime) payload.closingTime = current.closingTime;

    if (current.slotDurationMinutes !== initial.slotDurationMinutes) {
        payload.slotDurationMinutes = current.slotDurationMinutes;
    }

    if (current.bufferMinutes !== initial.bufferMinutes) {
        payload.bufferMinutes = current.bufferMinutes;
    }

    return payload;
};

function RequiredMark() {
    return <span className="text-red-600">*</span>;
}

function TextField({
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
    field: keyof ClinicSettingsFormValues;
    label: string;
    values: ClinicSettingsFormValues;
    fieldErrors: ClinicSettingsFieldErrors;
    disabled: boolean;
    required?: boolean;
    autoComplete?: string;
    inputMode?: 'email' | 'numeric' | 'tel';
    type?: string;
    placeholder?: string;
    onChange: (field: keyof ClinicSettingsFormValues, value: string) => void;
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

function ClinicSettingsPage() {
    const { clinicId } = useActiveClinic();
    const { showErrorToast, showSuccessToast } = useToast();
    const [state, setState] = useState<SettingsPageState>({
        status: 'loading',
        clinic: null,
        error: null,
    });
    const [initialValues, setInitialValues] = useState<ClinicSettingsFormValues | null>(null);
    const [values, setValues] = useState<ClinicSettingsFormValues | null>(null);
    const [fieldErrors, setFieldErrors] = useState<ClinicSettingsFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
    const [formErrorDetails, setFormErrorDetails] = useState<BackendValidationDetail[]>([]);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadSettings = useCallback(
        (signal?: AbortSignal) => {
            setState({
                status: 'loading',
                clinic: null,
                error: null,
            });

            void getClinicSettings(clinicId, signal)
                .then(({ clinic }) => {
                    const nextValues = toFormValues(clinic);

                    setState({
                        status: 'ready',
                        clinic,
                        error: null,
                    });
                    setInitialValues(nextValues);
                    setValues(nextValues);
                    setFieldErrors({});
                    setFormError(null);
                    setFormErrorCode(undefined);
                    setFormErrorDetails([]);
                    setStatusMessage(null);
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
                            clinic: null,
                            error: {
                                message: error.message,
                                code: error.code,
                            },
                        });
                        return;
                    }

                    setState({
                        status: 'error',
                        clinic: null,
                        error: {
                            message: 'Clinic settings could not be loaded. Please try again.',
                            code: 'CLINIC_SETTINGS_LOAD_FAILED',
                        },
                    });
                });
        },
        [clinicId]
    );

    useEffect(() => {
        const abortController = new AbortController();

        loadSettings(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [loadSettings]);

    const changedPayload = useMemo(() => {
        if (!values || !initialValues) {
            return {};
        }

        return buildChangedSettingsPayload(values, initialValues);
    }, [initialValues, values]);

    const hasChanges = Object.keys(changedPayload).length > 0;

    const clearErrorsForChange = (field: keyof ClinicSettingsFormValues) => {
        setFieldErrors((currentErrors) => ({
            ...currentErrors,
            [field]: undefined,
        }));
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);
        setStatusMessage(null);
    };

    const handleChange = (field: keyof ClinicSettingsFormValues, value: string) => {
        setValues((currentValues) =>
            currentValues
                ? {
                      ...currentValues,
                      [field]: value,
                  }
                : currentValues
        );
        clearErrorsForChange(field);
    };

    const handleReset = () => {
        if (!initialValues || isSubmitting) {
            return;
        }

        setValues(initialValues);
        setFieldErrors({});
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);
        setStatusMessage(null);
    };

    const handleSubmit = async () => {
        if (!values || !initialValues || isSubmitting) {
            return;
        }

        const nextFieldErrors = validateClinicSettingsForm(values);

        setFieldErrors(nextFieldErrors);
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);
        setStatusMessage(null);

        if (Object.keys(nextFieldErrors).length > 0) {
            return;
        }

        const payload = buildChangedSettingsPayload(values, initialValues);

        if (Object.keys(payload).length === 0) {
            setStatusMessage('No changes to save.');
            return;
        }

        setIsSubmitting(true);

        try {
            const { clinic } = await updateClinicSettings(clinicId, payload);
            const nextValues = toFormValues(clinic);

            setState({
                status: 'ready',
                clinic,
                error: null,
            });
            setInitialValues(nextValues);
            setValues(nextValues);
            setStatusMessage('Clinic settings saved successfully.');
            showSuccessToast('Clinic settings saved successfully.');
        } catch (error) {
            if (isApiClientError(error)) {
                const backendFieldErrors = getBackendFieldErrors(error.details);

                setFieldErrors(backendFieldErrors);
                setFormError(error.message);
                setFormErrorCode(error.code);
                setFormErrorDetails(getBackendValidationDetails(error.details));
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Clinic settings could not be saved. Please try again.';

            setFormError(fallbackMessage);
            setFormErrorCode('CLINIC_SETTINGS_SAVE_FAILED');
            showErrorToast(fallbackMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void handleSubmit();
    };

    if (state.status === 'loading') {
        return (
            <section className="flex min-h-[28rem] items-center justify-center rounded-lg border border-slate-200 bg-white p-6">
                <LoadingState message="Loading clinic settings..." />
            </section>
        );
    }

    if (state.status === 'error') {
        return (
            <section className="mx-auto max-w-2xl">
                <ErrorMessage
                    title="Clinic settings could not be loaded"
                    message={state.error.message}
                    code={state.error.code}
                    details={[
                        'Confirm your account is an active Admin for this clinic.',
                        'Confirm the backend server is running and Clerk tokens are being sent.',
                    ]}
                    onRetry={() => loadSettings()}
                />
            </section>
        );
    }

    if (!values || !initialValues) {
        return null;
    }

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Clinic Settings
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900">
                        {state.clinic.name}
                    </h1>
                    <p className="mt-3 text-sm text-slate-500">Slug: {state.clinic.slug}</p>
                </div>

                <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => loadSettings()}
                    disabled={isSubmitting}
                >
                    Reload
                </button>
            </div>

            {formError ? (
                <ErrorMessage
                    title="Clinic settings were not saved"
                    message={formError}
                    code={formErrorCode}
                    details={formErrorDetails}
                />
            ) : null}

            {statusMessage ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
                    {statusMessage}
                </div>
            ) : null}

            <form
                className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 md:p-8"
                noValidate
                onSubmit={handleFormSubmit}
            >
                <div className="grid gap-5 md:grid-cols-2">
                    <TextField
                        field="name"
                        label="Clinic name"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        required
                        autoComplete="organization"
                        onChange={handleChange}
                    />

                    <label className="block text-sm font-medium text-slate-700">
                        Clinic slug
                        <input
                            className={`${fieldBaseClass} border-slate-200 bg-slate-100 text-slate-500`}
                            value={state.clinic.slug}
                            readOnly
                        />
                    </label>

                    <TextField
                        field="phone"
                        label="Phone"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        autoComplete="tel"
                        inputMode="tel"
                        onChange={handleChange}
                    />

                    <TextField
                        field="email"
                        label="Email"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        autoComplete="email"
                        inputMode="email"
                        placeholder="frontdesk@example.com"
                        onChange={handleChange}
                    />

                    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                        Address line 1
                        <textarea
                            className={getFieldClassName(Boolean(fieldErrors.addressLine1))}
                            value={values.addressLine1}
                            onChange={(event) => handleChange('addressLine1', event.target.value)}
                            disabled={isSubmitting}
                            rows={2}
                            autoComplete="address-line1"
                            aria-invalid={Boolean(fieldErrors.addressLine1)}
                            aria-describedby={getFieldErrorDescriptionId(
                                'addressLine1',
                                fieldErrors
                            )}
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
                            onChange={(event) => handleChange('addressLine2', event.target.value)}
                            disabled={isSubmitting}
                            rows={2}
                            autoComplete="address-line2"
                            aria-invalid={Boolean(fieldErrors.addressLine2)}
                            aria-describedby={getFieldErrorDescriptionId(
                                'addressLine2',
                                fieldErrors
                            )}
                        />
                        <FieldError
                            id={getFieldErrorId('addressLine2')}
                            message={fieldErrors.addressLine2}
                        />
                    </label>

                    <TextField
                        field="city"
                        label="City"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        autoComplete="address-level2"
                        onChange={handleChange}
                    />

                    <TextField
                        field="state"
                        label="State"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        autoComplete="address-level1"
                        onChange={handleChange}
                    />

                    <TextField
                        field="country"
                        label="Country"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        required
                        autoComplete="country-name"
                        onChange={handleChange}
                    />

                    <TextField
                        field="pincode"
                        label="Pincode"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        autoComplete="postal-code"
                        onChange={handleChange}
                    />

                    <TextField
                        field="timezone"
                        label="Timezone"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        required
                        placeholder="Asia/Kolkata"
                        onChange={handleChange}
                    />

                    <TextField
                        field="openingTime"
                        label="Opening time"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        required
                        type="time"
                        onChange={handleChange}
                    />

                    <TextField
                        field="closingTime"
                        label="Closing time"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        required
                        type="time"
                        onChange={handleChange}
                    />

                    <TextField
                        field="slotDurationMinutes"
                        label="Appointment slot duration"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        required
                        inputMode="numeric"
                        onChange={handleChange}
                    />

                    <TextField
                        field="bufferMinutes"
                        label="Buffer minutes"
                        values={values}
                        fieldErrors={fieldErrors}
                        disabled={isSubmitting}
                        required
                        inputMode="numeric"
                        onChange={handleChange}
                    />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={handleReset}
                        disabled={isSubmitting || !hasChanges}
                    >
                        Reset changes
                    </button>

                    <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        disabled={isSubmitting || !hasChanges}
                    >
                        {isSubmitting ? 'Saving settings...' : 'Save settings'}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default ClinicSettingsPage;
