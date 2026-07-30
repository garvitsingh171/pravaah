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
import { isApiClientError } from '../../lib';
import { Gender, type DoctorSummary, type Gender as GenderType } from '../../types';
import { listDoctors, updateDoctor, type UpdateDoctorRequest } from './doctorApi';

type DoctorsLocationState = {
    statusMessage?: string;
};

type BackendValidationDetail = {
    field: string;
    message: string;
};

type DoctorListState =
    | {
          status: 'loading';
          doctors: DoctorSummary[];
          error: null;
      }
    | {
          status: 'success';
          doctors: DoctorSummary[];
          error: null;
      }
    | {
          status: 'error';
          doctors: DoctorSummary[];
          error: {
              message: string;
              code?: string;
          };
      };

const emptyDoctorListState: DoctorListState = {
    status: 'loading',
    doctors: [],
    error: null,
};

type DoctorEditFormValues = {
    fullName: string;
    specialization: string;
    qualification: string;
    registrationNumber: string;
    phone: string;
    email: string;
    gender: '' | GenderType;
    experienceYears: string;
    isActive: boolean;
};

type DoctorEditComparableValues = {
    fullName: string;
    specialization: string | null;
    qualification: string | null;
    registrationNumber: string | null;
    phone: string | null;
    email: string | null;
    gender: GenderType | null;
    experienceYears: number | null;
    isActive: boolean;
};

type DoctorEditFieldErrors = Partial<Record<keyof DoctorEditFormValues, string>>;

const doctorValidationFieldMap: Partial<Record<string, keyof DoctorEditFormValues>> = {
    'body.fullName': 'fullName',
    'body.specialization': 'specialization',
    'body.qualification': 'qualification',
    'body.registrationNumber': 'registrationNumber',
    'body.phone': 'phone',
    'body.email': 'email',
    'body.gender': 'gender',
    'body.experienceYears': 'experienceYears',
    'body.isActive': 'isActive',
};

const getOptionalText = (value: string | null | undefined): string => {
    return value?.trim() || 'Not added';
};

const getDoctorStatusLabel = (doctor: DoctorSummary): string => {
    return doctor.isActive && doctor.clinicLinkIsActive !== false ? 'Active' : 'Inactive';
};

const getDoctorStatusClassName = (doctor: DoctorSummary): string => {
    return doctor.isActive && doctor.clinicLinkIsActive !== false
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-slate-100 text-slate-600 ring-slate-200';
};

const getDoctorListErrorState = (error: unknown): DoctorListState | null => {
    if (error instanceof Error && error.name === 'AbortError') {
        return null;
    }

    if (isApiClientError(error)) {
        if (error.code === 'API_REQUEST_ABORTED') {
            return null;
        }

        return {
            status: 'error',
            doctors: [],
            error: {
                message: error.message,
                code: error.code,
            },
        };
    }

    return {
        status: 'error',
        doctors: [],
        error: {
            message: 'Doctors could not be loaded. Please try again.',
            code: 'DOCTOR_LIST_FAILED',
        },
    };
};

const doctorMatchesSearch = (doctor: DoctorSummary, searchTerm: string): boolean => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
        return true;
    }

    return [doctor.fullName, doctor.specialization, doctor.phone, doctor.email].some((value) =>
        value?.toLowerCase().includes(normalizedSearchTerm)
    );
};

const hasEmailShape = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const toDoctorEditValues = (doctor: DoctorSummary): DoctorEditFormValues => {
    return {
        fullName: doctor.fullName,
        specialization: doctor.specialization ?? '',
        qualification: doctor.qualification ?? '',
        registrationNumber: doctor.registrationNumber ?? '',
        phone: doctor.phone ?? '',
        email: doctor.email ?? '',
        gender: doctor.gender ?? '',
        experienceYears:
            doctor.experienceYears === undefined || doctor.experienceYears === null
                ? ''
                : String(doctor.experienceYears),
        isActive: doctor.isActive,
    };
};

const toNullableText = (value: string): string | null => {
    const trimmedValue = value.trim();

    return trimmedValue || null;
};

const toComparableDoctorValues = (values: DoctorEditFormValues): DoctorEditComparableValues => {
    return {
        fullName: values.fullName.trim(),
        specialization: toNullableText(values.specialization),
        qualification: toNullableText(values.qualification),
        registrationNumber: toNullableText(values.registrationNumber),
        phone: toNullableText(values.phone),
        email: toNullableText(values.email),
        gender: values.gender || null,
        experienceYears: values.experienceYears.trim() ? Number(values.experienceYears) : null,
        isActive: values.isActive,
    };
};

const validateDoctorEditForm = (values: DoctorEditFormValues): DoctorEditFieldErrors => {
    const errors: DoctorEditFieldErrors = {};

    if (!values.fullName.trim()) {
        errors.fullName = 'Doctor name is required.';
    } else if (values.fullName.trim().length < 2) {
        errors.fullName = 'Doctor name must be at least 2 characters long.';
    }

    if (values.email.trim() && !hasEmailShape(values.email.trim())) {
        errors.email = 'Enter a valid email address.';
    }

    if (values.experienceYears.trim()) {
        const experienceYears = Number(values.experienceYears);

        if (!Number.isInteger(experienceYears) || experienceYears < 0) {
            errors.experienceYears =
                'Experience years must be a whole number greater than or equal to 0.';
        }
    }

    return errors;
};

const buildDoctorUpdatePayload = (
    initialValues: DoctorEditComparableValues,
    nextValues: DoctorEditComparableValues
): UpdateDoctorRequest => {
    const payload: UpdateDoctorRequest = {};

    if (nextValues.fullName !== initialValues.fullName) payload.fullName = nextValues.fullName;
    if (nextValues.specialization !== initialValues.specialization) {
        payload.specialization = nextValues.specialization;
    }
    if (nextValues.qualification !== initialValues.qualification) {
        payload.qualification = nextValues.qualification;
    }
    if (nextValues.registrationNumber !== initialValues.registrationNumber) {
        payload.registrationNumber = nextValues.registrationNumber;
    }
    if (nextValues.phone !== initialValues.phone) payload.phone = nextValues.phone;
    if (nextValues.email !== initialValues.email) payload.email = nextValues.email;
    if (nextValues.gender !== initialValues.gender) payload.gender = nextValues.gender;
    if (nextValues.experienceYears !== initialValues.experienceYears) {
        payload.experienceYears = nextValues.experienceYears;
    }
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

const getBackendFieldErrors = (details: unknown): DoctorEditFieldErrors => {
    return getBackendValidationDetails(details).reduce<DoctorEditFieldErrors>((errors, detail) => {
        const field = doctorValidationFieldMap[detail.field];

        if (field) {
            errors[field] = detail.message;
        }

        return errors;
    }, {});
};

type DoctorEditPanelProps = {
    clinicId: string;
    doctor: DoctorSummary;
    onCancel: () => void;
    onSaved: () => Promise<void>;
};

function DoctorEditPanel({ clinicId, doctor, onCancel, onSaved }: DoctorEditPanelProps) {
    const { showErrorToast, showSuccessToast } = useToast();
    const [values, setValues] = useState<DoctorEditFormValues>(() => toDoctorEditValues(doctor));
    const [fieldErrors, setFieldErrors] = useState<DoctorEditFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
    const [formErrorDetails, setFormErrorDetails] = useState<BackendValidationDetail[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialComparableValues = useMemo(
        () => toComparableDoctorValues(toDoctorEditValues(doctor)),
        [doctor]
    );
    const nextComparableValues = useMemo(() => toComparableDoctorValues(values), [values]);
    const updatePayload = useMemo(
        () => buildDoctorUpdatePayload(initialComparableValues, nextComparableValues),
        [initialComparableValues, nextComparableValues]
    );
    const hasChanges = Object.keys(updatePayload).length > 0;

    const handleFieldChange = (field: keyof DoctorEditFormValues, value: string | boolean) => {
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

        const nextFieldErrors = validateDoctorEditForm(values);

        setFieldErrors(nextFieldErrors);
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);

        if (Object.keys(nextFieldErrors).length > 0) {
            return;
        }

        if (!hasChanges) {
            setFormError('Change at least one supported doctor field before saving.');
            setFormErrorCode('DOCTOR_UPDATE_UNCHANGED');
            return;
        }

        setIsSubmitting(true);

        try {
            await updateDoctor(clinicId, doctor.id, updatePayload);
            await onSaved();
            showSuccessToast('Doctor updated successfully.');
        } catch (error) {
            if (isApiClientError(error)) {
                setFieldErrors(getBackendFieldErrors(error.details));
                setFormError(error.message);
                setFormErrorCode(error.code);
                setFormErrorDetails(getBackendValidationDetails(error.details));
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Doctor could not be updated. Please try again.';

            setFormError(fallbackMessage);
            setFormErrorCode('DOCTOR_UPDATE_FAILED');
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
                        Edit doctor
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                        Edit {doctor.fullName}
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
                        title="Doctor was not updated"
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
                        Specialization
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={values.specialization}
                            onChange={(event) =>
                                handleFieldChange('specialization', event.target.value)
                            }
                            disabled={isSubmitting}
                        />
                        <FieldError message={fieldErrors.specialization} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Qualification
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={values.qualification}
                            onChange={(event) =>
                                handleFieldChange('qualification', event.target.value)
                            }
                            disabled={isSubmitting}
                        />
                        <FieldError message={fieldErrors.qualification} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Registration number
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={values.registrationNumber}
                            onChange={(event) =>
                                handleFieldChange('registrationNumber', event.target.value)
                            }
                            disabled={isSubmitting}
                        />
                        <FieldError message={fieldErrors.registrationNumber} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Phone
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={values.phone}
                            onChange={(event) => handleFieldChange('phone', event.target.value)}
                            disabled={isSubmitting}
                            autoComplete="tel"
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
                        </select>
                        <FieldError message={fieldErrors.gender} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Experience years
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={values.experienceYears}
                            onChange={(event) =>
                                handleFieldChange('experienceYears', event.target.value)
                            }
                            disabled={isSubmitting}
                            inputMode="numeric"
                        />
                        <FieldError message={fieldErrors.experienceYears} />
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
                            Active doctor record
                            <span className="mt-1 block text-xs font-normal text-slate-500">
                                Deactivation keeps the doctor record and appointment history.
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
                        {isSubmitting ? 'Saving doctor...' : 'Save doctor'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function DoctorsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { clinicId } = useActiveClinic();
    const { showSuccessToast } = useToast();
    const locationState = location.state as DoctorsLocationState | null;
    const [searchTerm, setSearchTerm] = useState('');
    const [doctorListState, setDoctorListState] = useState<DoctorListState>(emptyDoctorListState);
    const [editingDoctor, setEditingDoctor] = useState<DoctorSummary | null>(null);

    const loadDoctors = useCallback(
        (signal?: AbortSignal) => listDoctors(clinicId, signal),
        [clinicId]
    );

    const handleRetry = () => {
        setDoctorListState((currentState) => ({
            status: 'loading',
            doctors: currentState.doctors,
            error: null,
        }));

        void loadDoctors()
            .then((data) => {
                setDoctorListState({
                    status: 'success',
                    doctors: data.doctors,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getDoctorListErrorState(error);

                if (errorState) {
                    setDoctorListState(errorState);
                }
            });
    };

    const refreshDoctorsAfterSave = async () => {
        const data = await loadDoctors();

        setDoctorListState({
            status: 'success',
            doctors: data.doctors,
            error: null,
        });
        setEditingDoctor(null);
    };

    useEffect(() => {
        const abortController = new AbortController();

        void loadDoctors(abortController.signal)
            .then((data) => {
                setDoctorListState({
                    status: 'success',
                    doctors: data.doctors,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getDoctorListErrorState(error);

                if (errorState) {
                    setDoctorListState(errorState);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [loadDoctors]);

    useEffect(() => {
        if (locationState?.statusMessage) {
            showSuccessToast(locationState.statusMessage);
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, locationState?.statusMessage, navigate, showSuccessToast]);

    const displayedDoctors = useMemo(() => {
        if (doctorListState.status !== 'success') {
            return [];
        }

        return doctorListState.doctors.filter((doctor) => doctorMatchesSearch(doctor, searchTerm));
    }, [doctorListState, searchTerm]);
    const hasSearch = searchTerm.trim().length > 0;
    const hasDoctors = doctorListState.status === 'success' && displayedDoctors.length > 0;

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Doctors
                    </p>

                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Doctors</h1>

                    <p className="mt-4 max-w-2xl text-slate-600">
                        View clinic doctor records before booking appointments or managing the daily
                        clinic flow.
                    </p>
                </div>

                <Link
                    to="/doctors/new"
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    Add doctor
                </Link>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <label className="block flex-1 text-sm font-medium text-slate-700">
                        Search doctors
                        <input
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Name, specialization, phone, or email"
                            type="search"
                        />
                    </label>

                    {hasSearch ? (
                        <button
                            type="button"
                            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            onClick={() => setSearchTerm('')}
                        >
                            Clear
                        </button>
                    ) : null}
                </div>
            </div>

            {editingDoctor ? (
                <DoctorEditPanel
                    key={editingDoctor.id}
                    clinicId={clinicId}
                    doctor={editingDoctor}
                    onCancel={() => setEditingDoctor(null)}
                    onSaved={refreshDoctorsAfterSave}
                />
            ) : null}

            {doctorListState.status === 'loading' ? (
                <LoadingState message="Loading doctors..." />
            ) : null}

            {doctorListState.status === 'error' ? (
                <ErrorMessage
                    title="Doctors could not be loaded"
                    message={doctorListState.error.message}
                    code={doctorListState.error.code}
                    onRetry={handleRetry}
                />
            ) : null}

            {doctorListState.status === 'success' && doctorListState.doctors.length === 0 ? (
                <EmptyState
                    title="No doctors added yet."
                    message="Add the first doctor record for this clinic so staff can use it during appointment booking and queue workflows."
                    action={
                        <Link
                            to="/doctors/new"
                            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Add doctor
                        </Link>
                    }
                />
            ) : null}

            {doctorListState.status === 'success' &&
            doctorListState.doctors.length > 0 &&
            displayedDoctors.length === 0 ? (
                <EmptyState
                    title="No doctors match this search."
                    message="Try searching by another doctor name, specialization, phone number, or email."
                />
            ) : null}

            {hasDoctors ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Doctor</th>
                                    <th className="px-4 py-3 font-semibold">Qualification</th>
                                    <th className="px-4 py-3 font-semibold">Contact</th>
                                    <th className="px-4 py-3 font-semibold">Experience</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {displayedDoctors.map((doctor) => (
                                    <tr
                                        key={doctor.id}
                                        className="align-top transition hover:bg-slate-50/70"
                                    >
                                        <td className="min-w-52 px-4 py-5">
                                            <p className="font-semibold text-slate-900">
                                                {doctor.fullName}
                                            </p>
                                            <p className="mt-1 text-slate-600">
                                                {getOptionalText(doctor.specialization)}
                                            </p>
                                        </td>
                                        <td className="min-w-52 px-4 py-5 text-slate-700">
                                            <p className="font-medium text-slate-900">
                                                {getOptionalText(doctor.qualification)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Reg. {getOptionalText(doctor.registrationNumber)}
                                            </p>
                                        </td>
                                        <td className="min-w-56 px-4 py-5 text-slate-700">
                                            <p className="font-medium text-slate-900">
                                                {getOptionalText(doctor.phone)}
                                            </p>
                                            <p className="mt-1 text-slate-500">
                                                {getOptionalText(doctor.email)}
                                            </p>
                                        </td>
                                        <td className="min-w-32 px-4 py-5 text-slate-700">
                                            <span className="font-medium text-slate-900">
                                                {doctor.experienceYears ?? 'Not added'}
                                            </span>
                                        </td>
                                        <td className="min-w-28 px-4 py-5">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getDoctorStatusClassName(
                                                    doctor
                                                )}`}
                                            >
                                                {getDoctorStatusLabel(doctor)}
                                            </span>
                                        </td>
                                        <td className="min-w-32 px-4 py-5">
                                            <button
                                                type="button"
                                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                onClick={() => setEditingDoctor(doctor)}
                                                aria-label={`Edit ${doctor.fullName}`}
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

export default DoctorsPage;
