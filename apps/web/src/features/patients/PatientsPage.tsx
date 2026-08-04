import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
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
import { Gender, type Gender as GenderType, type PatientSummary } from '../../types';
import {
    listPatients,
    updatePatient,
    type PatientListFilters,
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
    address: string;
    city: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    distanceFromClinicKm: string;
    notes: string;
};

type PatientEditComparableValues = {
    fullName: string;
    phone: string;
    email: string | null;
    gender: GenderType | null;
    dateOfBirth: string | null;
    age: number | null;
    address: string | null;
    city: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    distanceFromClinicKm: number | null;
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
    'body.address': 'address',
    'body.city': 'city',
    'body.emergencyContactName': 'emergencyContactName',
    'body.emergencyContactPhone': 'emergencyContactPhone',
    'body.distanceFromClinicKm': 'distanceFromClinicKm',
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

const getAgeOrDateOfBirthLabel = (patient: PatientSummary): string => {
    if (patient.age !== undefined && patient.age !== null) {
        return `${patient.age} years`;
    }

    if (patient.dateOfBirth) {
        return formatDate(patient.dateOfBirth);
    }

    return 'Not added';
};

const isPatientActiveInClinic = (patient: PatientSummary): boolean => {
    return patient.isActive && patient.clinicLinkIsActive !== false;
};

const getVisitSummary = (patient: PatientSummary): string => {
    const totalAppointments = patient.totalAppointments ?? 0;
    const totalNoShows = patient.totalNoShows ?? 0;
    const totalLateArrivals = patient.totalLateArrivals ?? 0;

    return `${totalAppointments} appointments, ${totalNoShows} no-shows, ${totalLateArrivals} late`;
};

const getPatientListFilters = (
    searchTerm: string,
    statusFilter: StatusFilter
): PatientListFilters => {
    const search = searchTerm.trim();

    return {
        search: search || undefined,
        isActive:
            statusFilter === 'all' ? undefined : statusFilter === 'active',
    };
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
        address: patient.address ?? '',
        city: patient.city ?? '',
        emergencyContactName: patient.emergencyContactName ?? '',
        emergencyContactPhone: patient.emergencyContactPhone ?? '',
        distanceFromClinicKm:
            patient.distanceFromClinicKm === undefined || patient.distanceFromClinicKm === null
                ? ''
                : String(patient.distanceFromClinicKm),
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
        address: toNullableText(values.address),
        city: toNullableText(values.city),
        emergencyContactName: toNullableText(values.emergencyContactName),
        emergencyContactPhone: toNullableText(values.emergencyContactPhone),
        distanceFromClinicKm: toNullableNumber(values.distanceFromClinicKm),
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

    if (values.age.trim()) {
        const age = Number(values.age);

        if (!Number.isInteger(age) || age < 0) {
            errors.age = 'Age must be a whole number greater than or equal to 0.';
        }
    }

    if (values.distanceFromClinicKm.trim()) {
        const distanceFromClinicKm = Number(values.distanceFromClinicKm);

        if (!Number.isFinite(distanceFromClinicKm) || distanceFromClinicKm < 0) {
            errors.distanceFromClinicKm =
                'Distance from clinic must be a number greater than or equal to 0.';
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
    if (nextValues.address !== initialValues.address) payload.address = nextValues.address;
    if (nextValues.city !== initialValues.city) payload.city = nextValues.city;
    if (nextValues.emergencyContactName !== initialValues.emergencyContactName) {
        payload.emergencyContactName = nextValues.emergencyContactName;
    }
    if (nextValues.emergencyContactPhone !== initialValues.emergencyContactPhone) {
        payload.emergencyContactPhone = nextValues.emergencyContactPhone;
    }
    if (nextValues.distanceFromClinicKm !== initialValues.distanceFromClinicKm) {
        payload.distanceFromClinicKm = nextValues.distanceFromClinicKm;
    }
    if (nextValues.notes !== initialValues.notes) payload.notes = nextValues.notes;

    return payload;
};

type PatientEditPanelProps = {
    clinicId: string;
    patient: PatientSummary;
    onCancel: () => void;
    onSaved: () => Promise<void>;
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
            await onSaved();
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
                    title="Clinic Details"
                    description="Notes and distance are scoped to this clinic only."
                >
                    <label className="block text-sm font-medium text-slate-700">
                        City
                        <input
                            className={fieldControlClassName}
                            value={values.city}
                            onChange={(event) => handleFieldChange('city', event.target.value)}
                            disabled={isSubmitting}
                        />
                        <FieldError message={fieldErrors.city} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Distance from clinic (km)
                        <input
                            className={fieldControlClassName}
                            value={values.distanceFromClinicKm}
                            onChange={(event) =>
                                handleFieldChange('distanceFromClinicKm', event.target.value)
                            }
                            disabled={isSubmitting}
                            inputMode="decimal"
                        />
                        <FieldError message={fieldErrors.distanceFromClinicKm} />
                    </label>
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

                <FormSection title="Address and Notes">
                    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                        Address
                        <textarea
                            className={fieldControlClassName}
                            value={values.address}
                            onChange={(event) => handleFieldChange('address', event.target.value)}
                            disabled={isSubmitting}
                            rows={3}
                        />
                        <FieldError message={fieldErrors.address} />
                    </label>

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

function PatientsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { clinicId } = useActiveClinic();
    const { showErrorToast, showSuccessToast } = useToast();
    const locationState = location.state as PatientsLocationState | null;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [patientListState, setPatientListState] =
        useState<PatientListState>(emptyPatientListState);
    const [editingPatient, setEditingPatient] = useState<PatientSummary | null>(null);
    const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
    const [statusAction, setStatusAction] = useState<PatientStatusAction | null>(null);
    const [statusActionError, setStatusActionError] = useState<string | null>(null);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);

    const loadPatients = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const data = await listPatients(
                    clinicId,
                    getPatientListFilters(searchTerm, statusFilter),
                    signal
                );

                setPatientListState({
                    status: 'success',
                    patients: data.patients,
                    error: null,
                });
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
        [clinicId, searchTerm, statusFilter]
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
        setPatientListState((currentState) => ({
            status: 'loading',
            patients: currentState.patients,
            error: null,
        }));
        setSearchTerm(value);
    };

    const handleStatusFilterChange = (value: StatusFilter) => {
        setPatientListState((currentState) => ({
            status: 'loading',
            patients: currentState.patients,
            error: null,
        }));
        setStatusFilter(value);
    };

    const refreshPatientsAfterSave = async () => {
        const data = await listPatients(clinicId, getPatientListFilters(searchTerm, statusFilter));

        setPatientListState({
            status: 'success',
            patients: data.patients,
            error: null,
        });
        setEditingPatient(null);
    };

    const refreshPatientsAfterStatusChange = async () => {
        const data = await listPatients(clinicId, getPatientListFilters(searchTerm, statusFilter));

        setPatientListState({
            status: 'success',
            patients: data.patients,
            error: null,
        });
    };

    const handleStatusActionConfirm = async () => {
        if (!statusAction) {
            return;
        }

        setIsStatusUpdating(true);
        setStatusActionError(null);

        try {
            await updatePatient(clinicId, statusAction.patient.id, {
                isActive: statusAction.nextIsActive,
            });
            await refreshPatientsAfterStatusChange();
            showSuccessToast(
                statusAction.nextIsActive
                    ? 'Patient reactivated successfully.'
                    : 'Patient deactivated successfully.'
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

    useEffect(() => {
        const abortController = new AbortController();

        listPatients(
            clinicId,
            getPatientListFilters(searchTerm, statusFilter),
            abortController.signal
        )
            .then((data) => {
                setPatientListState({
                    status: 'success',
                    patients: data.patients,
                    error: null,
                });
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
    }, [clinicId, searchTerm, statusFilter]);

    useEffect(() => {
        if (locationState?.statusMessage) {
            showSuccessToast(locationState.statusMessage);
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, locationState?.statusMessage, navigate, showSuccessToast]);

    const hasPatients =
        patientListState.status === 'success' && patientListState.patients.length > 0;
    const hasSearch = searchTerm.trim().length > 0;
    const hasFilters = hasSearch || statusFilter !== 'all';

    return (
        <section className="space-y-6">
            <PageHeader
                eyebrow="Patients"
                title="Patients"
                description="Find or create patient records before booking appointments and managing the clinic queue."
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
                                handleStatusFilterChange('all');
                            }}
                        >
                            Clear
                        </Button>
                    ) : null}
                </div>
            </FilterBar>

            {editingPatient ? (
                <PatientEditPanel
                    key={editingPatient.id}
                    clinicId={clinicId}
                    patient={editingPatient}
                    onCancel={() => setEditingPatient(null)}
                    onSaved={refreshPatientsAfterSave}
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

            {patientListState.status === 'success' && patientListState.patients.length === 0 ? (
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
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Patient</th>
                                    <th className="px-4 py-3 font-semibold">Contact</th>
                                    <th className="px-4 py-3 font-semibold">Details</th>
                                    <th className="px-4 py-3 font-semibold">Clinic history</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {patientListState.patients.map((patient) => {
                                    const isActive = isPatientActiveInClinic(patient);
                                    const isExpanded = expandedPatientId === patient.id;

                                    return (
                                        <Fragment key={patient.id}>
                                            <tr className="align-top transition hover:bg-slate-50/70">
                                                <td className="min-w-48 px-4 py-5">
                                                    <p className="font-semibold text-slate-900">
                                                        {patient.fullName}
                                                    </p>
                                                    <p className="mt-1 text-slate-600">
                                                        {getGenderLabel(patient.gender)}
                                                    </p>
                                                </td>
                                                <td className="min-w-56 px-4 py-5 text-slate-700">
                                                    <p className="font-medium text-slate-900">
                                                        {patient.phone}
                                                    </p>
                                                    <p className="mt-1 text-slate-500">
                                                        {getOptionalText(patient.email)}
                                                    </p>
                                                </td>
                                                <td className="min-w-40 px-4 py-5 text-slate-700">
                                                    <p className="font-medium text-slate-900">
                                                        {getAgeOrDateOfBirthLabel(patient)}
                                                    </p>
                                                    <p className="mt-1 text-slate-500">
                                                        {getOptionalText(patient.city)}
                                                    </p>
                                                </td>
                                                <td className="min-w-60 px-4 py-5 text-slate-700">
                                                    <p className="font-medium text-slate-900">
                                                        This clinic: {getVisitSummary(patient)}
                                                    </p>
                                                    <p className="mt-1 text-slate-500">
                                                        Last visit at this clinic:{' '}
                                                        {patient.lastVisitAt
                                                            ? formatDate(patient.lastVisitAt)
                                                            : 'Not added'}
                                                    </p>
                                                </td>
                                                <td className="min-w-36 px-4 py-5">
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
                                                <td className="min-w-56 px-4 py-5">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setExpandedPatientId((currentId) =>
                                                                    currentId === patient.id
                                                                        ? null
                                                                        : patient.id
                                                                )
                                                            }
                                                            aria-expanded={isExpanded}
                                                            aria-label={`${
                                                                isExpanded ? 'Hide' : 'View'
                                                            } details for ${patient.fullName}`}
                                                        >
                                                            {isExpanded ? 'Hide details' : 'Details'}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEditingPatient(patient)}
                                                            aria-label={`Edit ${patient.fullName}`}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant={
                                                                patient.isActive
                                                                    ? 'danger'
                                                                    : 'secondary'
                                                            }
                                                            size="sm"
                                                            onClick={() => {
                                                                setStatusAction({
                                                                    patient,
                                                                    nextIsActive:
                                                                        !patient.isActive,
                                                                });
                                                                setStatusActionError(null);
                                                            }}
                                                            aria-label={`${
                                                                patient.isActive
                                                                    ? 'Deactivate'
                                                                    : 'Reactivate'
                                                            } ${patient.fullName}`}
                                                        >
                                                            {patient.isActive
                                                                ? 'Deactivate'
                                                                : 'Reactivate'}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded ? (
                                                <tr className="bg-slate-50/70">
                                                    <td colSpan={6} className="px-4 py-4">
                                                        <dl className="grid gap-4 text-sm md:grid-cols-3">
                                                            <div>
                                                                <dt className="font-medium text-slate-500">
                                                                    Address
                                                                </dt>
                                                                <dd className="mt-1 text-slate-900">
                                                                    {getOptionalText(
                                                                        patient.address
                                                                    )}
                                                                </dd>
                                                            </div>
                                                            <div>
                                                                <dt className="font-medium text-slate-500">
                                                                    Emergency contact
                                                                </dt>
                                                                <dd className="mt-1 text-slate-900">
                                                                    {getOptionalText(
                                                                        patient.emergencyContactName
                                                                    )}
                                                                    {' / '}
                                                                    {getOptionalText(
                                                                        patient.emergencyContactPhone
                                                                    )}
                                                                </dd>
                                                            </div>
                                                            <div>
                                                                <dt className="font-medium text-slate-500">
                                                                    Distance from this clinic
                                                                </dt>
                                                                <dd className="mt-1 text-slate-900">
                                                                    {patient.distanceFromClinicKm ??
                                                                        'Not added'}
                                                                </dd>
                                                            </div>
                                                            <div className="md:col-span-3">
                                                                <dt className="font-medium text-slate-500">
                                                                    Notes for this clinic
                                                                </dt>
                                                                <dd className="mt-1 text-slate-900">
                                                                    {getOptionalText(patient.notes)}
                                                                </dd>
                                                            </div>
                                                        </dl>
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
            <ConfirmationDialog
                open={Boolean(statusAction)}
                title={
                    statusAction?.nextIsActive
                        ? 'Reactivate patient record?'
                        : 'Deactivate patient record?'
                }
                description={
                    statusAction?.nextIsActive
                        ? `Reactivate ${statusAction.patient.fullName} for supported clinic workflows.`
                        : `Deactivate ${statusAction?.patient.fullName ?? 'this patient'} without deleting the record, queue entries, or appointment history.`
                }
                confirmLabel={
                    statusAction?.nextIsActive ? 'Reactivate patient' : 'Deactivate patient'
                }
                cancelLabel="Keep current status"
                confirmVariant={statusAction?.nextIsActive ? 'primary' : 'danger'}
                isConfirming={isStatusUpdating}
                confirmLoadingText={
                    statusAction?.nextIsActive
                        ? 'Reactivating patient...'
                        : 'Deactivating patient...'
                }
                error={statusActionError}
                onConfirm={handleStatusActionConfirm}
                onCancel={() => {
                    setStatusAction(null);
                    setStatusActionError(null);
                }}
            />
        </section>
    );
}

export default PatientsPage;
