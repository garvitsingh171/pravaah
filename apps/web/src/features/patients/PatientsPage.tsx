import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import {
    EmptyState,
    ErrorMessage,
    FieldError,
    LoadingState,
    useToast,
} from '../../components/feedback';
import {
    Button,
    Badge,
    ConfirmationDialog,
    FilterBar,
    FormSection,
    PageHeader,
    StatusBadge,
    fieldControlClassName,
} from '../../components/ui';
import {
    getBackendFieldErrors,
    getBackendValidationDetails,
    isApiClientError,
    type BackendValidationDetail,
} from '../../lib';
import { Gender, UserRole, type Gender as GenderType, type PatientSummary } from '../../types';
import PatientProfileDialog from './PatientProfileDialog';
import {
    archivePatient,
    getPatient,
    getPatientLifecycleImpact,
    listPatients,
    restorePatient,
    retryPatientGeocoding,
    retryPatientRouting,
    updatePatient,
    type PatientListFilters,
    type PatientLifecycleImpact,
    type UpdatePatientRequest,
} from './patientApi';

type PatientsLocationState = {
    statusMessage?: string;
};

type PatientListState =
    | {
          status: 'loading';
          patients: PatientSummary[];
          error: null;
      }
    | {
          status: 'success';
          patients: PatientSummary[];
          error: null;
      }
    | {
          status: 'error';
          patients: PatientSummary[];
          error: {
              message: string;
              code?: string;
          };
      };

const emptyPatientListState: PatientListState = {
    status: 'loading',
    patients: [],
    error: null,
};

type PatientEditFormValues = {
    fullName: string;
    phone: string;
    email: string;
    gender: '' | GenderType;
    dateOfBirth: string;
    age: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    notes: string;
};

type PatientEditComparableValues = {
    fullName: string;
    phone: string;
    email: string | null;
    gender: GenderType | null;
    dateOfBirth: string | null;
    age: number | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    notes: string | null;
};

type PatientEditFieldErrors = Partial<Record<keyof PatientEditFormValues, string>>;

const patientValidationFieldMap: Partial<Record<string, keyof PatientEditFormValues>> = {
    'body.fullName': 'fullName',
    'body.phone': 'phone',
    'body.email': 'email',
    'body.gender': 'gender',
    'body.dateOfBirth': 'dateOfBirth',
    'body.age': 'age',
    'body.addressLine1': 'addressLine1',
    'body.addressLine2': 'addressLine2',
    'body.city': 'city',
    'body.state': 'state',
    'body.country': 'country',
    'body.pincode': 'pincode',
    'body.emergencyContactName': 'emergencyContactName',
    'body.emergencyContactPhone': 'emergencyContactPhone',
    'body.notes': 'notes',
};

type StatusFilter = 'all' | 'active' | 'inactive';

type PatientStatusAction = {
    patient: PatientSummary;
    nextIsActive: boolean;
};

const getOptionalText = (value: string | null | undefined): string => {
    return value?.trim() || 'Not added';
};

const getInitials = (name: string): string => {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return initials || 'P';
};

const getGenderLabel = (gender: Gender | null | undefined): string => {
    if (!gender) {
        return 'Not added';
    }

    const labels: Record<Gender, string> = {
        MALE: 'Male',
        FEMALE: 'Female',
        OTHER: 'Other',
        PREFER_NOT_TO_SAY: 'Prefer not to say',
    };

    return labels[gender];
};

const formatDate = (value: string): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Not added';
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

const isPatientActiveInClinic = (patient: PatientSummary): boolean => {
    return patient.isActive && patient.clinicLinkIsActive !== false;
};

const getVisitSummary = (patient: PatientSummary): string => {
    const totalAppointments = patient.totalAppointments ?? 0;
    const totalCompletedVisits = patient.totalCompletedVisits ?? 0;
    const totalNoShows = patient.totalNoShows ?? 0;
    const totalLateArrivals = patient.totalLateArrivals ?? 0;

    return [
        `${totalAppointments} appointments`,
        `${totalCompletedVisits} completed`,
        `${totalNoShows} no-shows`,
        `${totalLateArrivals} late arrivals`,
    ].join(', ');
};

const getPatientListFilters = (
    searchTerm: string,
    statusFilter: StatusFilter,
    page = 1
): PatientListFilters => {
    const search = searchTerm.trim();

    return {
        search: search || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        page,
    };
};

const patientMatchesStatus = (patient: PatientSummary, statusFilter: StatusFilter): boolean => {
    if (statusFilter === 'all') {
        return true;
    }

    const isActive = isPatientActiveInClinic(patient);

    return statusFilter === 'active' ? isActive : !isActive;
};

const hasEmailShape = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const toDateInputValue = (value: string | null | undefined): string => {
    return value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '';
};

const toPatientEditValues = (patient: PatientSummary): PatientEditFormValues => {
    return {
        fullName: patient.fullName,
        phone: patient.phone,
        email: patient.email ?? '',
        gender: patient.gender ?? '',
        dateOfBirth: toDateInputValue(patient.dateOfBirth),
        age: patient.age === undefined || patient.age === null ? '' : String(patient.age),
        // Transitional fallback keeps pre-migration records editable.
        addressLine1: patient.addressLine1 ?? patient.address ?? '',
        addressLine2: patient.addressLine2 ?? '',
        city: patient.city ?? '',
        state: patient.state ?? '',
        country: patient.country ?? '',
        pincode: patient.pincode ?? '',
        emergencyContactName: patient.emergencyContactName ?? '',
        emergencyContactPhone: patient.emergencyContactPhone ?? '',
        notes: patient.notes ?? '',
    };
};

const toNullableText = (value: string): string | null => {
    const trimmedValue = value.trim();

    return trimmedValue || null;
};

const toNullableNumber = (value: string): number | null => {
    return value.trim() ? Number(value) : null;
};

const toComparablePatientValues = (values: PatientEditFormValues): PatientEditComparableValues => {
    return {
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        email: toNullableText(values.email),
        gender: values.gender || null,
        dateOfBirth: toNullableText(values.dateOfBirth),
        age: toNullableNumber(values.age),
        addressLine1: toNullableText(values.addressLine1),
        addressLine2: toNullableText(values.addressLine2),
        city: toNullableText(values.city),
        state: toNullableText(values.state),
        country: toNullableText(values.country),
        pincode: toNullableText(values.pincode),
        emergencyContactName: toNullableText(values.emergencyContactName),
        emergencyContactPhone: toNullableText(values.emergencyContactPhone),
        notes: toNullableText(values.notes),
    };
};

const validatePatientEditForm = (values: PatientEditFormValues): PatientEditFieldErrors => {
    const errors: PatientEditFieldErrors = {};

    if (!values.fullName.trim()) {
        errors.fullName = 'Patient name is required.';
    } else if (values.fullName.trim().length < 2) {
        errors.fullName = 'Patient name must be at least 2 characters long.';
    }

    if (!values.phone.trim()) {
        errors.phone = 'Patient phone number is required.';
    } else if (values.phone.trim().length < 5) {
        errors.phone = 'Patient phone must be at least 5 characters long.';
    }

    if (values.email.trim() && !hasEmailShape(values.email.trim())) {
        errors.email = 'Enter a valid email address.';
    }

    const locationFields: Array<{
        field: keyof PatientEditFormValues;
        label: string;
        maxLength: number;
    }> = [
        { field: 'addressLine1', label: 'Address line 1', maxLength: 250 },
        { field: 'addressLine2', label: 'Address line 2', maxLength: 250 },
        { field: 'city', label: 'City', maxLength: 100 },
        { field: 'state', label: 'State', maxLength: 100 },
        { field: 'country', label: 'Country', maxLength: 100 },
        { field: 'pincode', label: 'Pincode', maxLength: 20 },
    ];

    for (const locationField of locationFields) {
        if (values[locationField.field].trim().length > locationField.maxLength) {
            errors[locationField.field] =
                `${locationField.label} must be ${locationField.maxLength} characters or fewer.`;
        }
    }

    if (values.country.trim().toLowerCase() === 'india' && values.pincode.trim()) {
        if (!/^\d{6}$/.test(values.pincode.trim())) {
            errors.pincode = 'Indian pincodes must contain exactly 6 digits.';
        }
    }

    if (values.age.trim()) {
        const age = Number(values.age);

        if (!Number.isInteger(age) || age < 0) {
            errors.age = 'Age must be a whole number greater than or equal to 0.';
        }
    }

    if (values.notes.trim().length > 500) {
        errors.notes = 'Notes must be shorter than 500 characters.';
    }

    return errors;
};

const buildPatientUpdatePayload = (
    initialValues: PatientEditComparableValues,
    nextValues: PatientEditComparableValues
): UpdatePatientRequest => {
    const payload: UpdatePatientRequest = {};

    if (nextValues.fullName !== initialValues.fullName) payload.fullName = nextValues.fullName;
    if (nextValues.phone !== initialValues.phone) payload.phone = nextValues.phone;
    if (nextValues.email !== initialValues.email) payload.email = nextValues.email;
    if (nextValues.gender !== initialValues.gender) payload.gender = nextValues.gender;
    if (nextValues.dateOfBirth !== initialValues.dateOfBirth) {
        payload.dateOfBirth = nextValues.dateOfBirth;
    }
    if (nextValues.age !== initialValues.age) payload.age = nextValues.age;
    if (nextValues.addressLine1 !== initialValues.addressLine1) {
        payload.addressLine1 = nextValues.addressLine1;
    }
    if (nextValues.addressLine2 !== initialValues.addressLine2) {
        payload.addressLine2 = nextValues.addressLine2;
    }
    if (nextValues.city !== initialValues.city) payload.city = nextValues.city;
    if (nextValues.state !== initialValues.state) payload.state = nextValues.state;
    if (nextValues.country !== initialValues.country) payload.country = nextValues.country;
    if (nextValues.pincode !== initialValues.pincode) payload.pincode = nextValues.pincode;
    if (nextValues.emergencyContactName !== initialValues.emergencyContactName) {
        payload.emergencyContactName = nextValues.emergencyContactName;
    }
    if (nextValues.emergencyContactPhone !== initialValues.emergencyContactPhone) {
        payload.emergencyContactPhone = nextValues.emergencyContactPhone;
    }
    if (nextValues.notes !== initialValues.notes) payload.notes = nextValues.notes;

    return payload;
};

type PatientEditPanelProps = {
    clinicId: string;
    patient: PatientSummary;
    onCancel: () => void;
    onSaved: (patientId: string) => Promise<void>;
};

function PatientEditPanel({ clinicId, patient, onCancel, onSaved }: PatientEditPanelProps) {
    const { showErrorToast, showSuccessToast } = useToast();
    const [values, setValues] = useState<PatientEditFormValues>(() => toPatientEditValues(patient));
    const [fieldErrors, setFieldErrors] = useState<PatientEditFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
    const [formErrorDetails, setFormErrorDetails] = useState<BackendValidationDetail[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const initialComparableValues = useMemo(
        () => toComparablePatientValues(toPatientEditValues(patient)),
        [patient]
    );
    const nextComparableValues = useMemo(() => toComparablePatientValues(values), [values]);
    const updatePayload = useMemo(
        () => buildPatientUpdatePayload(initialComparableValues, nextComparableValues),
        [initialComparableValues, nextComparableValues]
    );
    const hasChanges = Object.keys(updatePayload).length > 0;

    const handleFieldChange = (field: keyof PatientEditFormValues, value: string) => {
        setValues((currentValues) => ({
            ...currentValues,
            [field]: value,
        }));
        setFieldErrors((currentErrors) => ({
            ...currentErrors,
            [field]: undefined,
        }));
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);
    };

    const handleCancel = () => {
        if (hasChanges) {
            setShowDiscardDialog(true);
            return;
        }

        onCancel();
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextFieldErrors = validatePatientEditForm(values);

        setFieldErrors(nextFieldErrors);
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);

        if (Object.keys(nextFieldErrors).length > 0) {
            return;
        }

        if (!hasChanges) {
            setFormError('Change at least one supported patient field before saving.');
            setFormErrorCode('PATIENT_UPDATE_UNCHANGED');
            return;
        }

        setIsSubmitting(true);

        try {
            await updatePatient(clinicId, patient.id, updatePayload);
            await onSaved(patient.id);
            showSuccessToast('Patient updated successfully.');
        } catch (error) {
            if (isApiClientError(error)) {
                setFieldErrors(
                    getBackendFieldErrors<keyof PatientEditFormValues>(
                        error.details,
                        patientValidationFieldMap
                    )
                );
                setFormError(error.message);
                setFormErrorCode(error.code);
                setFormErrorDetails(getBackendValidationDetails(error.details));
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Patient could not be updated. Please try again.';

            setFormError(fallbackMessage);
            setFormErrorCode('PATIENT_UPDATE_FAILED');
            showErrorToast(fallbackMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-lg border border-brand-soft bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-brand-foreground">
                        Edit patient
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-app-text">
                        Edit {patient.fullName}
                    </h2>
                </div>
                <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
            </div>

            {formError ? (
                <div className="mb-5">
                    <ErrorMessage
                        title="Patient was not updated"
                        message={formError}
                        code={formErrorCode}
                        details={formErrorDetails}
                    />
                </div>
            ) : null}

            <form className="space-y-6" noValidate onSubmit={handleSubmit}>
                <FormSection
                    title="Identity"
                    description="These are the supported patient profile fields for this record."
                >
                    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                        Full name
                        <input
                            className={fieldControlClassName}
                            value={values.fullName}
                            onChange={(event) => handleFieldChange('fullName', event.target.value)}
                            disabled={isSubmitting}
                            autoComplete="name"
                            aria-invalid={Boolean(fieldErrors.fullName)}
                        />
                        <FieldError message={fieldErrors.fullName} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Phone
                        <input
                            className={fieldControlClassName}
                            value={values.phone}
                            onChange={(event) => handleFieldChange('phone', event.target.value)}
                            disabled={isSubmitting}
                            autoComplete="tel"
                            aria-invalid={Boolean(fieldErrors.phone)}
                        />
                        <FieldError message={fieldErrors.phone} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Email
                        <input
                            className={fieldControlClassName}
                            value={values.email}
                            onChange={(event) => handleFieldChange('email', event.target.value)}
                            disabled={isSubmitting}
                            autoComplete="email"
                            inputMode="email"
                        />
                        <FieldError message={fieldErrors.email} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Gender
                        <select
                            className={fieldControlClassName}
                            value={values.gender}
                            onChange={(event) => handleFieldChange('gender', event.target.value)}
                            disabled={isSubmitting}
                        >
                            <option value="">Not specified</option>
                            <option value={Gender.MALE}>Male</option>
                            <option value={Gender.FEMALE}>Female</option>
                            <option value={Gender.OTHER}>Other</option>
                            <option value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</option>
                        </select>
                        <FieldError message={fieldErrors.gender} />
                    </label>
                </FormSection>

                <FormSection title="Demographics">
                    <label className="block text-sm font-medium text-slate-700">
                        Date of birth
                        <input
                            className={fieldControlClassName}
                            value={values.dateOfBirth}
                            onChange={(event) =>
                                handleFieldChange('dateOfBirth', event.target.value)
                            }
                            disabled={isSubmitting}
                            type="date"
                        />
                        <FieldError message={fieldErrors.dateOfBirth} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Age
                        <input
                            className={fieldControlClassName}
                            value={values.age}
                            onChange={(event) => handleFieldChange('age', event.target.value)}
                            disabled={isSubmitting}
                            inputMode="numeric"
                        />
                        <FieldError message={fieldErrors.age} />
                    </label>
                </FormSection>

                <FormSection
                    title="Location"
                    description="Residential location is optional and can be completed later."
                >
                    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                        Address line 1
                        <textarea
                            className={fieldControlClassName}
                            value={values.addressLine1}
                            onChange={(event) =>
                                handleFieldChange('addressLine1', event.target.value)
                            }
                            disabled={isSubmitting}
                            rows={2}
                            autoComplete="address-line1"
                            aria-invalid={Boolean(fieldErrors.addressLine1)}
                        />
                        <FieldError message={fieldErrors.addressLine1} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                        Address line 2
                        <textarea
                            className={fieldControlClassName}
                            value={values.addressLine2}
                            onChange={(event) =>
                                handleFieldChange('addressLine2', event.target.value)
                            }
                            disabled={isSubmitting}
                            rows={2}
                            autoComplete="address-line2"
                            aria-invalid={Boolean(fieldErrors.addressLine2)}
                        />
                        <FieldError message={fieldErrors.addressLine2} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        City
                        <input
                            className={fieldControlClassName}
                            value={values.city}
                            onChange={(event) => handleFieldChange('city', event.target.value)}
                            disabled={isSubmitting}
                            autoComplete="address-level2"
                        />
                        <FieldError message={fieldErrors.city} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        State
                        <input
                            className={fieldControlClassName}
                            value={values.state}
                            onChange={(event) => handleFieldChange('state', event.target.value)}
                            disabled={isSubmitting}
                            autoComplete="address-level1"
                            aria-invalid={Boolean(fieldErrors.state)}
                        />
                        <FieldError message={fieldErrors.state} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Pincode
                        <input
                            className={fieldControlClassName}
                            value={values.pincode}
                            onChange={(event) => handleFieldChange('pincode', event.target.value)}
                            disabled={isSubmitting}
                            autoComplete="postal-code"
                            inputMode="numeric"
                            aria-invalid={Boolean(fieldErrors.pincode)}
                        />
                        <FieldError message={fieldErrors.pincode} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Country
                        <input
                            className={fieldControlClassName}
                            value={values.country}
                            onChange={(event) => handleFieldChange('country', event.target.value)}
                            disabled={isSubmitting}
                            autoComplete="country-name"
                            aria-invalid={Boolean(fieldErrors.country)}
                        />
                        <FieldError message={fieldErrors.country} />
                    </label>
                </FormSection>

                <FormSection
                    title="Clinic Details"
                    description="Travel estimates are calculated from verified patient and clinic locations."
                >
                    <p className="text-sm text-slate-600">
                        Travel distance and estimated drive time are derived automatically and
                        cannot be edited.
                    </p>
                </FormSection>

                <FormSection title="Emergency Contact">
                    <label className="block text-sm font-medium text-slate-700">
                        Emergency contact name
                        <input
                            className={fieldControlClassName}
                            value={values.emergencyContactName}
                            onChange={(event) =>
                                handleFieldChange('emergencyContactName', event.target.value)
                            }
                            disabled={isSubmitting}
                        />
                        <FieldError message={fieldErrors.emergencyContactName} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Emergency contact phone
                        <input
                            className={fieldControlClassName}
                            value={values.emergencyContactPhone}
                            onChange={(event) =>
                                handleFieldChange('emergencyContactPhone', event.target.value)
                            }
                            disabled={isSubmitting}
                            autoComplete="tel"
                        />
                        <FieldError message={fieldErrors.emergencyContactPhone} />
                    </label>
                </FormSection>

                <FormSection title="Notes">
                    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                        Notes
                        <textarea
                            className={fieldControlClassName}
                            value={values.notes}
                            onChange={(event) => handleFieldChange('notes', event.target.value)}
                            disabled={isSubmitting}
                            rows={3}
                        />
                        <FieldError message={fieldErrors.notes} />
                    </label>
                </FormSection>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500" role="status">
                        {hasChanges
                            ? 'Only changed supported fields will be saved.'
                            : 'Change at least one supported field to save.'}
                    </p>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !hasChanges}
                        isLoading={isSubmitting}
                        loadingText="Saving patient..."
                    >
                        Save patient
                    </Button>
                </div>
            </form>
            <ConfirmationDialog
                open={showDiscardDialog}
                title="Discard patient changes?"
                description="The patient profile has unsaved edits."
                confirmLabel="Discard changes"
                cancelLabel="Continue editing"
                onConfirm={onCancel}
                onCancel={() => setShowDiscardDialog(false)}
            />
        </div>
    );
}

function PatientListSummary({
    displayedCount,
    patients,
}: {
    displayedCount: number;
    patients: PatientSummary[];
}) {
    const activeCount = patients.filter(isPatientActiveInClinic).length;
    const inactiveCount = patients.length - activeCount;
    const appointmentCount = patients.reduce(
        (totalAppointments, patient) => totalAppointments + (patient.totalAppointments ?? 0),
        0
    );
    const completedVisitCount = patients.reduce(
        (totalCompletedVisits, patient) =>
            totalCompletedVisits + (patient.totalCompletedVisits ?? 0),
        0
    );
    const noShowCount = patients.reduce(
        (totalNoShows, patient) => totalNoShows + (patient.totalNoShows ?? 0),
        0
    );

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        {displayedCount} patients on this page
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge tone="success">{activeCount} active</Badge>
                    <Badge tone="neutral">{inactiveCount} inactive</Badge>
                    <Badge tone="brand">{appointmentCount} appointments</Badge>
                    <Badge tone="success">{completedVisitCount} completed</Badge>
                    <Badge tone={noShowCount > 0 ? 'warning' : 'neutral'}>
                        {noShowCount} no-shows
                    </Badge>
                </div>
            </div>
        </div>
    );
}

function PatientsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const activeClinic = useActiveClinic();
    const { clinicId } = activeClinic;
    const canManageLifecycle = activeClinic.currentUser?.role === UserRole.ADMIN;
    const { showErrorToast, showSuccessToast } = useToast();
    const locationState = location.state as PatientsLocationState | null;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [patientListState, setPatientListState] =
        useState<PatientListState>(emptyPatientListState);
    const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
    const [loadingPatientId, setLoadingPatientId] = useState<string | null>(null);
    const [editingPatient, setEditingPatient] = useState<PatientSummary | null>(null);
    const [statusAction, setStatusAction] = useState<PatientStatusAction | null>(null);
    const [statusActionError, setStatusActionError] = useState<string | null>(null);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [statusImpact, setStatusImpact] = useState<PatientLifecycleImpact | null>(null);
    const [isStatusImpactLoading, setIsStatusImpactLoading] = useState(false);
    const [retryingGeocodingPatientId, setRetryingGeocodingPatientId] = useState<string | null>(
        null
    );
    const [retryingRoutingPatientId, setRetryingRoutingPatientId] = useState<string | null>(null);

    const loadPatients = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const data = await listPatients(
                    clinicId,
                    getPatientListFilters(searchTerm, statusFilter, currentPage),
                    signal
                );

                setPatientListState({
                    status: 'success',
                    patients: data.patients,
                    error: null,
                });
                setHasNextPage(data.pagination?.hasNextPage ?? false);
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }

                if (isApiClientError(error)) {
                    if (error.code === 'API_REQUEST_ABORTED') {
                        return;
                    }

                    setPatientListState({
                        status: 'error',
                        patients: [],
                        error: {
                            message: error.message,
                            code: error.code,
                        },
                    });
                    return;
                }

                setPatientListState({
                    status: 'error',
                    patients: [],
                    error: {
                        message: 'Patients could not be loaded. Please try again.',
                        code: 'PATIENT_LIST_FAILED',
                    },
                });
            }
        },
        [clinicId, searchTerm, statusFilter, currentPage]
    );

    const handleRetry = () => {
        setPatientListState((currentState) => ({
            status: 'loading',
            patients: currentState.patients,
            error: null,
        }));

        void loadPatients();
    };

    const handleSearchChange = (value: string) => {
        setCurrentPage(1);
        setPatientListState((currentState) => ({
            status: 'loading',
            patients: currentState.patients,
            error: null,
        }));
        setSearchTerm(value);
    };

    const handleStatusFilterChange = (value: StatusFilter) => {
        setCurrentPage(1);
        setPatientListState((currentState) => ({
            status: 'loading',
            patients: currentState.patients,
            error: null,
        }));
        setStatusFilter(value);
    };

    const refreshPatientsAfterSave = async (patientId: string) => {
        const [data, detail] = await Promise.all([
            listPatients(clinicId, getPatientListFilters(searchTerm, statusFilter, currentPage)),
            getPatient(clinicId, patientId),
        ]);
        setHasNextPage(data.pagination?.hasNextPage ?? false);

        setPatientListState({
            status: 'success',
            patients: data.patients,
            error: null,
        });
        setSelectedPatient((current) => (current?.id === patientId ? detail.patient : current));
        setEditingPatient(null);
    };

    const refreshPatientsAfterStatusChange = async () => {
        const data = await listPatients(
            clinicId,
            getPatientListFilters(searchTerm, statusFilter, currentPage)
        );
        setHasNextPage(data.pagination?.hasNextPage ?? false);

        setPatientListState({
            status: 'success',
            patients: data.patients,
            error: null,
        });
        if (selectedPatient) {
            const refreshedPatient = data.patients.find(
                (patient) => patient.id === selectedPatient.id
            );
            if (refreshedPatient)
                setSelectedPatient((current) =>
                    current ? { ...current, ...refreshedPatient } : null
                );
        }
    };

    const handleStatusActionConfirm = async () => {
        if (!statusAction) {
            return;
        }

        setIsStatusUpdating(true);
        setStatusActionError(null);

        try {
            if (statusAction.nextIsActive) {
                await restorePatient(clinicId, statusAction.patient.id);
            } else {
                await archivePatient(clinicId, statusAction.patient.id);
            }
            await refreshPatientsAfterStatusChange();
            showSuccessToast(
                statusAction.nextIsActive
                    ? 'Patient restored to this clinic.'
                    : 'Patient archived from this clinic.'
            );
            setStatusAction(null);
        } catch (error) {
            const message = isApiClientError(error)
                ? error.message
                : 'Patient status could not be updated. Please try again.';

            setStatusActionError(message);
            showErrorToast(message);
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const openStatusAction = async (patient: PatientSummary) => {
        setStatusAction({ patient, nextIsActive: patient.clinicLinkIsActive === false });
        setStatusActionError(null);
        setStatusImpact(null);
        setIsStatusImpactLoading(true);
        try {
            const data = await getPatientLifecycleImpact(clinicId, patient.id);
            setStatusImpact(data.impact);
        } catch (error) {
            setStatusActionError(
                isApiClientError(error)
                    ? error.message
                    : 'Impact could not be checked. Please try again.'
            );
        } finally {
            setIsStatusImpactLoading(false);
        }
    };

    const handleGeocodingRetry = async (patient: PatientSummary) => {
        if (retryingGeocodingPatientId) {
            return;
        }

        setRetryingGeocodingPatientId(patient.id);

        try {
            await retryPatientGeocoding(clinicId, patient.id);
            await refreshPatientsAfterStatusChange();
            showSuccessToast('Location lookup completed successfully.');
        } catch (error) {
            showErrorToast(
                isApiClientError(error)
                    ? error.message
                    : 'Location lookup could not be completed. Please try again.'
            );
        } finally {
            setRetryingGeocodingPatientId(null);
        }
    };

    const handleRoutingRetry = async (patient: PatientSummary) => {
        if (retryingRoutingPatientId) {
            return;
        }

        setRetryingRoutingPatientId(patient.id);

        try {
            await retryPatientRouting(clinicId, patient.id);
            await refreshPatientsAfterStatusChange();
            showSuccessToast('Travel estimate recalculated successfully.');
        } catch (error) {
            showErrorToast(
                isApiClientError(error)
                    ? error.message
                    : 'Travel estimate could not be calculated. Please try again.'
            );
        } finally {
            setRetryingRoutingPatientId(null);
        }
    };

    useEffect(() => {
        const abortController = new AbortController();

        listPatients(
            clinicId,
            getPatientListFilters(searchTerm, statusFilter, currentPage),
            abortController.signal
        )
            .then((data) => {
                setPatientListState({
                    status: 'success',
                    patients: data.patients,
                    error: null,
                });
                setHasNextPage(data.pagination?.hasNextPage ?? false);
            })
            .catch((error: unknown) => {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }

                if (isApiClientError(error)) {
                    if (error.code === 'API_REQUEST_ABORTED') {
                        return;
                    }

                    setPatientListState({
                        status: 'error',
                        patients: [],
                        error: {
                            message: error.message,
                            code: error.code,
                        },
                    });
                    return;
                }

                setPatientListState({
                    status: 'error',
                    patients: [],
                    error: {
                        message: 'Patients could not be loaded. Please try again.',
                        code: 'PATIENT_LIST_FAILED',
                    },
                });
            });

        return () => {
            abortController.abort();
        };
    }, [clinicId, searchTerm, statusFilter, currentPage]);

    useEffect(() => {
        if (locationState?.statusMessage) {
            showSuccessToast(locationState.statusMessage);
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, locationState?.statusMessage, navigate, showSuccessToast]);

    const displayedPatients = useMemo(() => {
        if (patientListState.status !== 'success') {
            return [];
        }

        return patientListState.patients.filter((patient) =>
            patientMatchesStatus(patient, statusFilter)
        );
    }, [patientListState, statusFilter]);
    const hasPatients = patientListState.status === 'success' && displayedPatients.length > 0;
    const hasSearch = searchTerm.trim().length > 0;
    const hasFilters = hasSearch || statusFilter !== 'active';

    return (
        <section className="space-y-6">
            <PageHeader
                actions={
                    <Link
                        to="/patients/new"
                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-action px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                    >
                        Add patient
                    </Link>
                }
            />

            <FilterBar>
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <label className="block flex-1 text-sm font-medium text-slate-700">
                        Search patients
                        <input
                            className={fieldControlClassName}
                            value={searchTerm}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            placeholder="Name, phone, or email"
                            type="search"
                            maxLength={100}
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700 md:w-56">
                        Status
                        <select
                            className={fieldControlClassName}
                            value={statusFilter}
                            onChange={(event) =>
                                handleStatusFilterChange(event.target.value as StatusFilter)
                            }
                        >
                            <option value="all">All patient records</option>
                            <option value="active">Active for booking</option>
                            <option value="inactive">Inactive or unavailable</option>
                        </select>
                    </label>

                    {hasFilters ? (
                        <Button
                            variant="outline"
                            onClick={() => {
                                handleSearchChange('');
                                handleStatusFilterChange('active');
                            }}
                        >
                            Clear
                        </Button>
                    ) : null}
                </div>
            </FilterBar>

            {patientListState.status === 'success' && patientListState.patients.length > 0 ? (
                <PatientListSummary
                    patients={patientListState.patients}
                    displayedCount={displayedPatients.length}
                />
            ) : null}

            {selectedPatient &&
            displayedPatients.some((patient) => patient.id === selectedPatient.id) ? (
                <PatientProfileDialog
                    patient={selectedPatient}
                    isEditing={Boolean(editingPatient)}
                    isRetryingGeocoding={retryingGeocodingPatientId === selectedPatient.id}
                    isRetryingRouting={retryingRoutingPatientId === selectedPatient.id}
                    onEdit={() => setEditingPatient(selectedPatient)}
                    onClose={() => setSelectedPatient(null)}
                    onRetryGeocoding={() => void handleGeocodingRetry(selectedPatient)}
                    onRetryRouting={() => void handleRoutingRetry(selectedPatient)}
                    editContent={
                        editingPatient ? (
                            <PatientEditPanel
                                key={editingPatient.id}
                                clinicId={clinicId}
                                patient={editingPatient}
                                onCancel={() => setEditingPatient(null)}
                                onSaved={refreshPatientsAfterSave}
                            />
                        ) : null
                    }
                />
            ) : null}

            {patientListState.status === 'loading' ? (
                <LoadingState message="Loading patients..." />
            ) : null}

            {patientListState.status === 'error' ? (
                <ErrorMessage
                    title="Patients could not be loaded"
                    message={patientListState.error.message}
                    code={patientListState.error.code}
                    onRetry={handleRetry}
                />
            ) : null}

            {patientListState.status === 'success' && displayedPatients.length === 0 ? (
                <EmptyState
                    title={
                        hasFilters
                            ? 'No patients match these filters.'
                            : 'No patients found for this clinic.'
                    }
                    message={
                        hasFilters
                            ? 'Try searching by another supported identity field or status filter.'
                            : 'Add the first patient record so staff can book appointments and keep the daily flow moving.'
                    }
                    action={
                        hasFilters ? undefined : (
                            <Link
                                to="/patients/new"
                                className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-action px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                            >
                                Add patient
                            </Link>
                        )
                    }
                />
            ) : null}

            {hasPatients ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
                    <div
                        className="overflow-x-auto"
                        tabIndex={0}
                        aria-label="Patients table, horizontally scrollable on small screens"
                    >
                        <table className="operational-table min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Patient</th>
                                    <th className="px-4 py-3 font-semibold">Contact</th>
                                    <th className="px-4 py-3 font-semibold">Clinic history</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {displayedPatients.map((patient) => {
                                    const isActive = isPatientActiveInClinic(patient);
                                    return (
                                        <tr
                                            key={patient.id}
                                            className="align-top transition hover:bg-slate-50/70"
                                        >
                                            <td
                                                data-label="Patient"
                                                className="min-w-48 px-4 py-3.5"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span
                                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-sm font-bold text-brand-foreground ring-1 ring-brand-soft"
                                                        aria-hidden="true"
                                                    >
                                                        {getInitials(patient.fullName)}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-action underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-action">
                                                            <button
                                                                type="button"
                                                                className="cursor-pointer text-left hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                                                                aria-label={`View profile for ${patient.fullName}`}
                                                                aria-busy={
                                                                    loadingPatientId === patient.id
                                                                }
                                                                disabled={
                                                                    loadingPatientId === patient.id
                                                                }
                                                                onClick={() => {
                                                                    setEditingPatient(null);
                                                                    setLoadingPatientId(patient.id);
                                                                    void getPatient(
                                                                        clinicId,
                                                                        patient.id
                                                                    )
                                                                        .then((data) => {
                                                                            setSelectedPatient(
                                                                                data.patient
                                                                            );
                                                                        })
                                                                        .catch((error: unknown) =>
                                                                            showErrorToast(
                                                                                isApiClientError(
                                                                                    error
                                                                                )
                                                                                    ? error.message
                                                                                    : 'Patient profile could not be loaded.'
                                                                            )
                                                                        )
                                                                        .finally(() =>
                                                                            setLoadingPatientId(
                                                                                null
                                                                            )
                                                                        );
                                                                }}
                                                            >
                                                                {patient.fullName}
                                                            </button>
                                                        </p>
                                                        {loadingPatientId === patient.id ? (
                                                            <span
                                                                role="status"
                                                                className="text-xs text-slate-500"
                                                            >
                                                                Loading profile...
                                                            </span>
                                                        ) : null}
                                                        <p className="mt-1 text-slate-600">
                                                            {getGenderLabel(patient.gender)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                data-label="Contact"
                                                className="min-w-56 px-4 py-3.5 text-slate-700"
                                            >
                                                <p className="font-medium text-slate-900">
                                                    {patient.phone}
                                                </p>
                                                <p className="mt-1 text-slate-500">
                                                    {getOptionalText(patient.email)}
                                                </p>
                                            </td>
                                            <td
                                                data-label="Clinic history"
                                                className="min-w-60 px-4 py-3.5 text-slate-700"
                                            >
                                                <p className="font-medium text-slate-900">
                                                    This clinic: {getVisitSummary(patient)}
                                                </p>
                                                <p className="mt-1 text-slate-500">
                                                    Last completed visit:{' '}
                                                    {patient.lastVisitAt
                                                        ? formatDate(patient.lastVisitAt)
                                                        : 'No completed visits yet'}
                                                </p>
                                            </td>
                                            <td
                                                data-label="Status"
                                                className="min-w-36 px-4 py-3.5"
                                            >
                                                <div className="space-y-2">
                                                    <StatusBadge kind="active" status={isActive} />
                                                    {!patient.isActive ? (
                                                        <p className="text-xs text-slate-500">
                                                            Patient profile inactive
                                                        </p>
                                                    ) : patient.clinicLinkIsActive === false ? (
                                                        <p className="text-xs text-slate-500">
                                                            Clinic link inactive
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td
                                                data-label="Actions"
                                                className="min-w-56 px-4 py-3.5"
                                            >
                                                <div className="flex flex-wrap gap-2">
                                                    {canManageLifecycle && patient.isActive ? (
                                                        <Button
                                                            variant={
                                                                patient.clinicLinkIsActive === false
                                                                    ? 'secondary'
                                                                    : 'danger'
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                void openStatusAction(patient)
                                                            }
                                                            aria-label={`${patient.clinicLinkIsActive === false ? 'Restore' : 'Archive'} ${patient.fullName} ${patient.clinicLinkIsActive === false ? 'to' : 'from'} this clinic`}
                                                        >
                                                            {patient.clinicLinkIsActive === false
                                                                ? 'Restore'
                                                                : 'Archive'}
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <nav
                        aria-label="Patient pages"
                        className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm"
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((page) => page - 1)}
                        >
                            Previous
                        </Button>
                        <span>Page {currentPage}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasNextPage}
                            onClick={() => setCurrentPage((page) => page + 1)}
                        >
                            Next
                        </Button>
                    </nav>
                </div>
            ) : null}
            {patientListState.status === 'success' && !hasPatients && currentPage > 1 ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => page - 1)}
                >
                    Previous patient page
                </Button>
            ) : null}
            <ConfirmationDialog
                open={Boolean(statusAction)}
                title={
                    statusAction?.nextIsActive
                        ? 'Restore patient to this clinic?'
                        : 'Archive patient from this clinic?'
                }
                description={
                    statusAction?.nextIsActive
                        ? `Restore ${statusAction.patient.fullName} for new bookings in this clinic. Other clinic associations are unchanged.`
                        : `${statusAction?.patient.fullName ?? 'This patient'} will no longer be available for new bookings here. History and attendance statistics are preserved. ${isStatusImpactLoading ? 'Checking affected visits…' : statusImpact ? `${statusImpact.futureAppointments} future appointments, ${statusImpact.activeAppointments} unresolved appointments and ${statusImpact.activeQueueEntries} active queue entries. Resolve all active visits first.` : 'Impact could not be checked.'}`
                }
                confirmLabel={statusAction?.nextIsActive ? 'Restore patient' : 'Archive patient'}
                cancelLabel="Keep current status"
                confirmVariant={statusAction?.nextIsActive ? 'primary' : 'danger'}
                isConfirming={isStatusUpdating}
                confirmDisabled={
                    isStatusImpactLoading ||
                    !statusImpact ||
                    (!statusAction?.nextIsActive &&
                        (statusImpact.activeAppointments > 0 ||
                            statusImpact.activeQueueEntries > 0))
                }
                confirmLoadingText={
                    statusAction?.nextIsActive ? 'Restoring patient...' : 'Archiving patient...'
                }
                error={statusActionError}
                onConfirm={handleStatusActionConfirm}
                onCancel={() => {
                    setStatusAction(null);
                    setStatusActionError(null);
                    setStatusImpact(null);
                }}
            />
        </section>
    );
}

export default PatientsPage;
