import { useCallback, useEffect, useState } from 'react';
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
import { isApiClientError } from '../../lib';
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

type BackendValidationDetail = {
    field: string;
    message: string;
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
    isActive: boolean;
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
    isActive: boolean;
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
    'body.isActive': 'isActive',
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

const getPatientStatusLabel = (patient: PatientSummary): string => {
    return patient.isActive && patient.clinicLinkIsActive !== false ? 'Active' : 'Inactive';
};

const getPatientStatusClassName = (patient: PatientSummary): string => {
    return patient.isActive && patient.clinicLinkIsActive !== false
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-slate-100 text-slate-600 ring-slate-200';
};

const getVisitSummary = (patient: PatientSummary): string => {
    const totalAppointments = patient.totalAppointments ?? 0;
    const totalNoShows = patient.totalNoShows ?? 0;
    const totalLateArrivals = patient.totalLateArrivals ?? 0;

    return `${totalAppointments} appointments, ${totalNoShows} no-shows, ${totalLateArrivals} late`;
};

const getPatientListFilters = (searchTerm: string): PatientListFilters => {
    const search = searchTerm.trim();

    return {
        search: search || undefined,
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
        isActive: patient.isActive,
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
        isActive: values.isActive,
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
    if (nextValues.isActive !== initialValues.isActive) payload.isActive = nextValues.isActive;

    return payload;
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

const getBackendFieldErrors = (details: unknown): PatientEditFieldErrors => {
    return getBackendValidationDetails(details).reduce<PatientEditFieldErrors>((errors, detail) => {
        const field = patientValidationFieldMap[detail.field];

        if (field) {
            errors[field] = detail.message;
        }

        return errors;
    }, {});
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

    const initialComparableValues = toComparablePatientValues(toPatientEditValues(patient));
    const nextComparableValues = toComparablePatientValues(values);
    const updatePayload = buildPatientUpdatePayload(initialComparableValues, nextComparableValues);
    const hasChanges = Object.keys(updatePayload).length > 0;

    const handleFieldChange = (field: keyof PatientEditFormValues, value: string | boolean) => {
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
                setFieldErrors(getBackendFieldErrors(error.details));
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
        <div className="rounded-lg border border-blue-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Edit patient
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                        Edit {patient.fullName}
                    </h2>
                </div>
                <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
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
                <div className="grid gap-5 md:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                        Full name
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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

                    <label className="block text-sm font-medium text-slate-700">
                        Date of birth
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={values.age}
                            onChange={(event) => handleFieldChange('age', event.target.value)}
                            disabled={isSubmitting}
                            inputMode="numeric"
                        />
                        <FieldError message={fieldErrors.age} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        City
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={values.city}
                            onChange={(event) => handleFieldChange('city', event.target.value)}
                            disabled={isSubmitting}
                        />
                        <FieldError message={fieldErrors.city} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Distance from clinic (km)
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={values.distanceFromClinicKm}
                            onChange={(event) =>
                                handleFieldChange('distanceFromClinicKm', event.target.value)
                            }
                            disabled={isSubmitting}
                            inputMode="decimal"
                        />
                        <FieldError message={fieldErrors.distanceFromClinicKm} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Emergency contact name
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={values.emergencyContactPhone}
                            onChange={(event) =>
                                handleFieldChange('emergencyContactPhone', event.target.value)
                            }
                            disabled={isSubmitting}
                            autoComplete="tel"
                        />
                        <FieldError message={fieldErrors.emergencyContactPhone} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                        Address
                        <textarea
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={values.notes}
                            onChange={(event) => handleFieldChange('notes', event.target.value)}
                            disabled={isSubmitting}
                            rows={3}
                        />
                        <FieldError message={fieldErrors.notes} />
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 md:col-span-2">
                        <input
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                            type="checkbox"
                            checked={values.isActive}
                            onChange={(event) =>
                                handleFieldChange('isActive', event.target.checked)
                            }
                            disabled={isSubmitting}
                        />
                        <span>
                            Active patient record
                            <span className="mt-1 block text-xs font-normal text-slate-500">
                                Deactivation keeps appointment, queue, and history records.
                            </span>
                        </span>
                    </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500" role="status">
                        {hasChanges
                            ? 'Only changed supported fields will be saved.'
                            : 'Change at least one supported field to save.'}
                    </p>
                    <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        disabled={isSubmitting || !hasChanges}
                    >
                        {isSubmitting ? 'Saving patient...' : 'Save patient'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function PatientsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { clinicId } = useActiveClinic();
    const { showSuccessToast } = useToast();
    const locationState = location.state as PatientsLocationState | null;
    const [searchTerm, setSearchTerm] = useState('');
    const [patientListState, setPatientListState] =
        useState<PatientListState>(emptyPatientListState);
    const [editingPatient, setEditingPatient] = useState<PatientSummary | null>(null);

    const loadPatients = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const data = await listPatients(
                    clinicId,
                    getPatientListFilters(searchTerm),
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
        [clinicId, searchTerm]
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

    const refreshPatientsAfterSave = async () => {
        const data = await listPatients(clinicId, getPatientListFilters(searchTerm));

        setPatientListState({
            status: 'success',
            patients: data.patients,
            error: null,
        });
        setEditingPatient(null);
    };

    useEffect(() => {
        const abortController = new AbortController();

        listPatients(clinicId, getPatientListFilters(searchTerm), abortController.signal)
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
    }, [clinicId, searchTerm]);

    useEffect(() => {
        if (locationState?.statusMessage) {
            showSuccessToast(locationState.statusMessage);
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, locationState?.statusMessage, navigate, showSuccessToast]);

    const hasPatients =
        patientListState.status === 'success' && patientListState.patients.length > 0;
    const hasSearch = searchTerm.trim().length > 0;

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Patients
                    </p>

                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Patients</h1>

                    <p className="mt-4 max-w-2xl text-slate-600">
                        Find or create patient records before booking appointments and managing the
                        clinic queue.
                    </p>
                </div>

                <Link
                    to="/patients/new"
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    Add patient
                </Link>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <label className="block flex-1 text-sm font-medium text-slate-700">
                        Search patients
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            value={searchTerm}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            placeholder="Name, phone, or email"
                            type="search"
                        />
                    </label>

                    {hasSearch ? (
                        <button
                            type="button"
                            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            onClick={() => handleSearchChange('')}
                        >
                            Clear
                        </button>
                    ) : null}
                </div>
            </div>

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
                        hasSearch
                            ? 'No patients match this search.'
                            : 'No patients found for this clinic.'
                    }
                    message={
                        hasSearch
                            ? 'Try searching by another name, phone number, or email.'
                            : 'Add the first patient record so staff can book appointments and keep the daily flow moving.'
                    }
                    action={
                        hasSearch ? undefined : (
                            <Link
                                to="/patients/new"
                                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
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
                                {patientListState.patients.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        className="align-top transition hover:bg-slate-50/70"
                                    >
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
                                        <td className="min-w-56 px-4 py-5 text-slate-700">
                                            <p className="font-medium text-slate-900">
                                                {getVisitSummary(patient)}
                                            </p>
                                            <p className="mt-1 text-slate-500">
                                                Last visit:{' '}
                                                {patient.lastVisitAt
                                                    ? formatDate(patient.lastVisitAt)
                                                    : 'Not added'}
                                            </p>
                                        </td>
                                        <td className="min-w-28 px-4 py-5">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getPatientStatusClassName(
                                                    patient
                                                )}`}
                                            >
                                                {getPatientStatusLabel(patient)}
                                            </span>
                                        </td>
                                        <td className="min-w-32 px-4 py-5">
                                            <button
                                                type="button"
                                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                onClick={() => setEditingPatient(patient)}
                                                aria-label={`Edit ${patient.fullName}`}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

export default PatientsPage;
