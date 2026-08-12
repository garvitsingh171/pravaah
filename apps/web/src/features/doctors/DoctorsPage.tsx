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
import { Gender, type DoctorSummary, type Gender as GenderType } from '../../types';
import { listDoctors, updateDoctor, type UpdateDoctorRequest } from './doctorApi';

type DoctorsLocationState = {
    statusMessage?: string;
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
};

type StatusFilter = 'all' | 'active' | 'inactive';

type DoctorStatusAction = {
    doctor: DoctorSummary;
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

    return initials || 'DR';
};

const isDoctorActiveInClinic = (doctor: DoctorSummary): boolean => {
    return doctor.isActive && doctor.clinicLinkIsActive !== false;
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

    return [
        doctor.fullName,
        doctor.specialization,
        doctor.qualification,
        doctor.registrationNumber,
        doctor.phone,
        doctor.email,
    ].some((value) => value?.toLowerCase().includes(normalizedSearchTerm));
};

const doctorMatchesStatus = (doctor: DoctorSummary, statusFilter: StatusFilter): boolean => {
    if (statusFilter === 'all') {
        return true;
    }

    const isActive = isDoctorActiveInClinic(doctor);

    return statusFilter === 'active' ? isActive : !isActive;
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

    return payload;
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
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

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

    const handleCancel = () => {
        if (hasChanges) {
            setShowDiscardDialog(true);
            return;
        }

        onCancel();
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
                setFieldErrors(
                    getBackendFieldErrors<keyof DoctorEditFormValues>(
                        error.details,
                        doctorValidationFieldMap
                    )
                );
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
        <div className="rounded-lg border border-brand-soft bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-brand-foreground">
                        Edit doctor
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-app-text">
                        Edit {doctor.fullName}
                    </h2>
                </div>
                <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
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
                <FormSection
                    title="Identity"
                    description="These are the supported doctor profile fields for this record."
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
                        Specialization
                        <input
                            className={fieldControlClassName}
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
                            className={fieldControlClassName}
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
                            className={fieldControlClassName}
                            value={values.registrationNumber}
                            onChange={(event) =>
                                handleFieldChange('registrationNumber', event.target.value)
                            }
                            disabled={isSubmitting}
                        />
                        <FieldError message={fieldErrors.registrationNumber} />
                    </label>
                </FormSection>

                <FormSection title="Contact and Profile">
                    <label className="block text-sm font-medium text-slate-700">
                        Phone
                        <input
                            className={fieldControlClassName}
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
                        </select>
                        <FieldError message={fieldErrors.gender} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Experience years
                        <input
                            className={fieldControlClassName}
                            value={values.experienceYears}
                            onChange={(event) =>
                                handleFieldChange('experienceYears', event.target.value)
                            }
                            disabled={isSubmitting}
                            inputMode="numeric"
                        />
                        <FieldError message={fieldErrors.experienceYears} />
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
                        loadingText="Saving doctor..."
                    >
                        Save doctor
                    </Button>
                </div>
            </form>
            <ConfirmationDialog
                open={showDiscardDialog}
                title="Discard doctor changes?"
                description="The doctor profile has unsaved edits."
                confirmLabel="Discard changes"
                cancelLabel="Continue editing"
                onConfirm={onCancel}
                onCancel={() => setShowDiscardDialog(false)}
            />
        </div>
    );
}

function DoctorListSummary({
    doctors,
    displayedCount,
}: {
    doctors: DoctorSummary[];
    displayedCount: number;
}) {
    const activeCount = doctors.filter(isDoctorActiveInClinic).length;
    const inactiveCount = doctors.length - activeCount;

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        {displayedCount} doctors visible
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge tone="success">{activeCount} active</Badge>
                    <Badge tone="neutral">{inactiveCount} inactive</Badge>
                    <Badge tone="brand">{doctors.length} total</Badge>
                </div>
            </div>
        </div>
    );
}

function DoctorsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { clinicId } = useActiveClinic();
    const { showErrorToast, showSuccessToast } = useToast();
    const locationState = location.state as DoctorsLocationState | null;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [doctorListState, setDoctorListState] = useState<DoctorListState>(emptyDoctorListState);
    const [editingDoctor, setEditingDoctor] = useState<DoctorSummary | null>(null);
    const [expandedDoctorId, setExpandedDoctorId] = useState<string | null>(null);
    const [statusAction, setStatusAction] = useState<DoctorStatusAction | null>(null);
    const [statusActionError, setStatusActionError] = useState<string | null>(null);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);

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

    const refreshDoctorsAfterStatusChange = async () => {
        const data = await loadDoctors();

        setDoctorListState({
            status: 'success',
            doctors: data.doctors,
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
            await updateDoctor(clinicId, statusAction.doctor.id, {
                isActive: statusAction.nextIsActive,
            });
            await refreshDoctorsAfterStatusChange();
            showSuccessToast(
                statusAction.nextIsActive
                    ? 'Doctor reactivated successfully.'
                    : 'Doctor deactivated successfully.'
            );
            setStatusAction(null);
        } catch (error) {
            const message = isApiClientError(error)
                ? error.message
                : 'Doctor status could not be updated. Please try again.';

            setStatusActionError(message);
            showErrorToast(message);
        } finally {
            setIsStatusUpdating(false);
        }
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

        return doctorListState.doctors.filter(
            (doctor) =>
                doctorMatchesSearch(doctor, searchTerm) && doctorMatchesStatus(doctor, statusFilter)
        );
    }, [doctorListState, searchTerm, statusFilter]);
    const hasSearch = searchTerm.trim().length > 0;
    const hasFilters = hasSearch || statusFilter !== 'all';
    const hasDoctors = doctorListState.status === 'success' && displayedDoctors.length > 0;

    return (
        <section className="space-y-6">
            <PageHeader
                actions={
                    <Link
                        to="/doctors/new"
                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-action px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                    >
                        Add doctor
                    </Link>
                }
            />

            <FilterBar>
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <label className="block flex-1 text-sm font-medium text-slate-700">
                        Search doctors
                        <input
                            className={fieldControlClassName}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Name, specialty, registration, phone, or email"
                            type="search"
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700 md:w-56">
                        Status
                        <select
                            className={fieldControlClassName}
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value as StatusFilter)
                            }
                        >
                            <option value="all">All doctor records</option>
                            <option value="active">Active for booking</option>
                            <option value="inactive">Inactive or unavailable</option>
                        </select>
                    </label>

                    {hasFilters ? (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                            }}
                        >
                            Clear
                        </Button>
                    ) : null}
                </div>
            </FilterBar>

            {doctorListState.status === 'success' && doctorListState.doctors.length > 0 ? (
                <DoctorListSummary
                    doctors={doctorListState.doctors}
                    displayedCount={displayedDoctors.length}
                />
            ) : null}

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
                            className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-action px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
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
                    title="No doctors match these filters."
                    message="Try another supported doctor identity field or status filter."
                />
            ) : null}

            {hasDoctors ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div
                        className="overflow-x-auto"
                        tabIndex={0}
                        aria-label="Doctors table, horizontally scrollable on small screens"
                    >
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
                                {displayedDoctors.map((doctor) => {
                                    const isActive = isDoctorActiveInClinic(doctor);
                                    const isExpanded = expandedDoctorId === doctor.id;

                                    return (
                                        <Fragment key={doctor.id}>
                                            <tr className="align-top transition hover:bg-slate-50/70">
                                                <td className="min-w-52 px-4 py-5">
                                                    <div className="flex items-start gap-3">
                                                        <span
                                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-sm font-bold text-brand-foreground ring-1 ring-brand-soft"
                                                            aria-hidden="true"
                                                        >
                                                            {getInitials(doctor.fullName)}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-900">
                                                                {doctor.fullName}
                                                            </p>
                                                            <p className="mt-1 text-slate-600">
                                                                {getOptionalText(
                                                                    doctor.specialization
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="min-w-52 px-4 py-5 text-slate-700">
                                                    <p className="font-medium text-slate-900">
                                                        {getOptionalText(doctor.qualification)}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Reg.{' '}
                                                        {getOptionalText(doctor.registrationNumber)}
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
                                                <td className="min-w-36 px-4 py-5">
                                                    <div className="space-y-2">
                                                        <StatusBadge
                                                            kind="active"
                                                            status={isActive}
                                                        />
                                                        {!doctor.isActive ? (
                                                            <p className="text-xs text-slate-500">
                                                                Doctor profile inactive
                                                            </p>
                                                        ) : doctor.clinicLinkIsActive === false ? (
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
                                                                setExpandedDoctorId((currentId) =>
                                                                    currentId === doctor.id
                                                                        ? null
                                                                        : doctor.id
                                                                )
                                                            }
                                                            aria-expanded={isExpanded}
                                                            aria-label={`${
                                                                isExpanded ? 'Hide' : 'View'
                                                            } details for ${doctor.fullName}`}
                                                        >
                                                            {isExpanded
                                                                ? 'Hide details'
                                                                : 'Details'}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEditingDoctor(doctor)}
                                                            aria-label={`Edit ${doctor.fullName}`}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant={
                                                                doctor.isActive
                                                                    ? 'danger'
                                                                    : 'secondary'
                                                            }
                                                            size="sm"
                                                            onClick={() => {
                                                                setStatusAction({
                                                                    doctor,
                                                                    nextIsActive: !doctor.isActive,
                                                                });
                                                                setStatusActionError(null);
                                                            }}
                                                            aria-label={`${
                                                                doctor.isActive
                                                                    ? 'Deactivate'
                                                                    : 'Reactivate'
                                                            } ${doctor.fullName}`}
                                                        >
                                                            {doctor.isActive
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
                                                                    Profile status
                                                                </dt>
                                                                <dd className="mt-1 text-slate-900">
                                                                    {doctor.isActive
                                                                        ? 'Active'
                                                                        : 'Inactive'}
                                                                </dd>
                                                            </div>
                                                            <div>
                                                                <dt className="font-medium text-slate-500">
                                                                    Clinic link status
                                                                </dt>
                                                                <dd className="mt-1 text-slate-900">
                                                                    {doctor.clinicLinkIsActive ===
                                                                    false
                                                                        ? 'Inactive'
                                                                        : 'Active'}
                                                                </dd>
                                                            </div>
                                                            <div>
                                                                <dt className="font-medium text-slate-500">
                                                                    Gender
                                                                </dt>
                                                                <dd className="mt-1 text-slate-900">
                                                                    {doctor.gender ?? 'Not added'}
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
                        ? 'Reactivate doctor record?'
                        : 'Deactivate doctor record?'
                }
                description={
                    statusAction?.nextIsActive
                        ? `Reactivate ${statusAction.doctor.fullName} for supported clinic workflows.`
                        : `Deactivate ${statusAction?.doctor.fullName ?? 'this doctor'} without deleting the record or appointment history.`
                }
                confirmLabel={
                    statusAction?.nextIsActive ? 'Reactivate doctor' : 'Deactivate doctor'
                }
                cancelLabel="Keep current status"
                confirmVariant={statusAction?.nextIsActive ? 'primary' : 'danger'}
                isConfirming={isStatusUpdating}
                confirmLoadingText={
                    statusAction?.nextIsActive ? 'Reactivating doctor...' : 'Deactivating doctor...'
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

export default DoctorsPage;
