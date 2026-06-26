import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { ErrorMessage, LoadingState } from '../../components/feedback';
import { isApiClientError } from '../../lib';
import { AppointmentStatus, BookingSource } from '../../types';
import type { DoctorSummary, PatientSummary, RiskLevel } from '../../types';
import { listDoctors } from '../doctors/doctorApi';
import { listPatients } from '../patients/patientApi';
import AppointmentBookingForm, {
    type AppointmentBookingFormFieldErrors,
    type AppointmentBookingFormValues,
} from './AppointmentBookingForm';
import {
    createAppointment,
    listAppointments,
    updateAppointmentStatus,
    type AppointmentNoShowPrediction,
    type AppointmentListFilters,
    type AppointmentListItem,
    type CreateAppointmentRequest,
} from './appointmentApi';

type BackendValidationDetail = {
    field: string;
    message: string;
};

type AppointmentReferenceState =
    | {
          status: 'loading';
          doctors: DoctorSummary[];
          patients: PatientSummary[];
          error: null;
      }
    | {
          status: 'success';
          doctors: DoctorSummary[];
          patients: PatientSummary[];
          error: null;
      }
    | {
          status: 'error';
          doctors: DoctorSummary[];
          patients: PatientSummary[];
          error: {
              title: string;
              message: string;
              code?: string;
          };
      };

type AppointmentListState =
    | {
          status: 'loading';
          appointments: AppointmentListItem[];
          error: null;
      }
    | {
          status: 'success';
          appointments: AppointmentListItem[];
          error: null;
      }
    | {
          status: 'error';
          appointments: AppointmentListItem[];
          error: {
              message: string;
              code?: string;
          };
      };

type SuccessState = {
    message: string;
    scheduledAt: string;
    riskLevel?: RiskLevel;
};

type StatusAction = {
    status: AppointmentStatus;
    label: string;
};

const emptyFormValues: AppointmentBookingFormValues = {
    doctorId: '',
    patientId: '',
    scheduledAt: '',
    durationMinutes: '15',
    reason: '',
    notes: '',
};

const emptyReferenceState: AppointmentReferenceState = {
    status: 'loading',
    doctors: [],
    patients: [],
    error: null,
};

const emptyAppointmentListState: AppointmentListState = {
    status: 'loading',
    appointments: [],
    error: null,
};

const requiredText = 'This field is required.';

const validationFieldMap: Partial<Record<string, keyof AppointmentBookingFormValues>> = {
    'body.doctorId': 'doctorId',
    'body.patientId': 'patientId',
    'body.scheduledAt': 'scheduledAt',
    'body.durationMinutes': 'durationMinutes',
    'body.reason': 'reason',
    'body.notes': 'notes',
};

const statusOptions: Array<{ value: AppointmentStatus; label: string }> = [
    { value: AppointmentStatus.SCHEDULED, label: 'Scheduled' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' },
    { value: AppointmentStatus.ARRIVED, label: 'Arrived' },
    { value: AppointmentStatus.IN_QUEUE, label: 'In queue' },
    { value: AppointmentStatus.CALLED, label: 'Called' },
    { value: AppointmentStatus.COMPLETED, label: 'Completed' },
    { value: AppointmentStatus.CANCELLED, label: 'Cancelled' },
    { value: AppointmentStatus.NO_SHOW, label: 'No-show' },
];

const statusLabels = statusOptions.reduce<Record<AppointmentStatus, string>>(
    (labels, option) => ({
        ...labels,
        [option.value]: option.label,
    }),
    {
        SCHEDULED: 'Scheduled',
        CONFIRMED: 'Confirmed',
        ARRIVED: 'Arrived',
        IN_QUEUE: 'In queue',
        CALLED: 'Called',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
        NO_SHOW: 'No-show',
    }
);

const statusActionLabels: Record<AppointmentStatus, string> = {
    SCHEDULED: 'Mark scheduled',
    CONFIRMED: 'Confirm',
    ARRIVED: 'Mark arrived',
    IN_QUEUE: 'Move to queue',
    CALLED: 'Mark called',
    COMPLETED: 'Complete',
    CANCELLED: 'Cancel',
    NO_SHOW: 'Mark no-show',
};

const statusActionsByCurrentStatus: Record<AppointmentStatus, StatusAction[]> = {
    SCHEDULED: [
        { status: AppointmentStatus.CONFIRMED, label: statusActionLabels.CONFIRMED },
        { status: AppointmentStatus.ARRIVED, label: statusActionLabels.ARRIVED },
        { status: AppointmentStatus.IN_QUEUE, label: statusActionLabels.IN_QUEUE },
        { status: AppointmentStatus.CANCELLED, label: statusActionLabels.CANCELLED },
        { status: AppointmentStatus.NO_SHOW, label: statusActionLabels.NO_SHOW },
    ],
    CONFIRMED: [
        { status: AppointmentStatus.ARRIVED, label: statusActionLabels.ARRIVED },
        { status: AppointmentStatus.IN_QUEUE, label: statusActionLabels.IN_QUEUE },
        { status: AppointmentStatus.CANCELLED, label: statusActionLabels.CANCELLED },
        { status: AppointmentStatus.NO_SHOW, label: statusActionLabels.NO_SHOW },
    ],
    ARRIVED: [
        { status: AppointmentStatus.IN_QUEUE, label: statusActionLabels.IN_QUEUE },
        { status: AppointmentStatus.CALLED, label: statusActionLabels.CALLED },
        { status: AppointmentStatus.CANCELLED, label: statusActionLabels.CANCELLED },
        { status: AppointmentStatus.NO_SHOW, label: statusActionLabels.NO_SHOW },
    ],
    IN_QUEUE: [
        { status: AppointmentStatus.CALLED, label: statusActionLabels.CALLED },
        { status: AppointmentStatus.COMPLETED, label: statusActionLabels.COMPLETED },
        { status: AppointmentStatus.CANCELLED, label: statusActionLabels.CANCELLED },
        { status: AppointmentStatus.NO_SHOW, label: statusActionLabels.NO_SHOW },
    ],
    CALLED: [
        { status: AppointmentStatus.COMPLETED, label: statusActionLabels.COMPLETED },
        { status: AppointmentStatus.CANCELLED, label: statusActionLabels.CANCELLED },
        { status: AppointmentStatus.NO_SHOW, label: statusActionLabels.NO_SHOW },
    ],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
};

const isActiveDoctor = (doctor: DoctorSummary): boolean => {
    return doctor.isActive && doctor.clinicLinkIsActive !== false;
};

const isActivePatient = (patient: PatientSummary): boolean => {
    return patient.isActive && patient.clinicLinkIsActive !== false;
};

const getTodayDateInputValue = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const toOptionalString = (value: string): string | undefined => {
    const trimmedValue = value.trim();

    return trimmedValue || undefined;
};

const validateAppointmentForm = (
    values: AppointmentBookingFormValues
): AppointmentBookingFormFieldErrors => {
    const errors: AppointmentBookingFormFieldErrors = {};

    if (!values.doctorId) {
        errors.doctorId = requiredText;
    }

    if (!values.patientId) {
        errors.patientId = requiredText;
    }

    if (!values.scheduledAt) {
        errors.scheduledAt = requiredText;
    } else if (Number.isNaN(new Date(values.scheduledAt).getTime())) {
        errors.scheduledAt = 'Enter a valid appointment date and time.';
    }

    if (!values.durationMinutes.trim()) {
        errors.durationMinutes = requiredText;
    } else {
        const durationMinutes = Number(values.durationMinutes);

        if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
            errors.durationMinutes = 'Duration minutes must be a positive whole number.';
        }
    }

    return errors;
};

const toCreateAppointmentRequest = (
    values: AppointmentBookingFormValues
): CreateAppointmentRequest => {
    return {
        doctorId: values.doctorId,
        patientId: values.patientId,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        durationMinutes: Number(values.durationMinutes),
        reason: toOptionalString(values.reason),
        notes: toOptionalString(values.notes),
        bookingSource: BookingSource.RECEPTION,
    };
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

const getBackendFieldErrors = (details: unknown): AppointmentBookingFormFieldErrors => {
    return getBackendValidationDetails(details).reduce<AppointmentBookingFormFieldErrors>(
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

const getReferenceLoadErrorState = (error: unknown): AppointmentReferenceState | null => {
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
            patients: [],
            error: {
                title: 'Appointment data could not be loaded',
                message: error.message,
                code: error.code,
            },
        };
    }

    return {
        status: 'error',
        doctors: [],
        patients: [],
        error: {
            title: 'Appointment data could not be loaded',
            message: 'Doctors and patients could not be loaded. Please try again.',
            code: 'APPOINTMENT_REFERENCE_LOAD_FAILED',
        },
    };
};

const getAppointmentListErrorState = (
    error: unknown,
    appointments: AppointmentListItem[] = []
): AppointmentListState | null => {
    if (error instanceof Error && error.name === 'AbortError') {
        return null;
    }

    if (isApiClientError(error)) {
        if (error.code === 'API_REQUEST_ABORTED') {
            return null;
        }

        return {
            status: 'error',
            appointments,
            error: {
                message: error.message,
                code: error.code,
            },
        };
    }

    return {
        status: 'error',
        appointments,
        error: {
            message: 'Appointments could not be loaded. Please try again.',
            code: 'APPOINTMENT_LIST_FAILED',
        },
    };
};

const formatAppointmentDateTime = (value: string): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const formatDuration = (durationMinutes: number): string => {
    return `${durationMinutes} min`;
};

const getOptionalText = (value: string | null | undefined): string => {
    return value?.trim() || 'Not added';
};

const getStatusBadgeClassName = (status: AppointmentStatus): string => {
    const classNames: Record<AppointmentStatus, string> = {
        SCHEDULED: 'bg-sky-50 text-sky-700 ring-sky-200',
        CONFIRMED: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
        ARRIVED: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
        IN_QUEUE: 'bg-amber-50 text-amber-700 ring-amber-200',
        CALLED: 'bg-violet-50 text-violet-700 ring-violet-200',
        COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-200',
        NO_SHOW: 'bg-red-50 text-red-700 ring-red-200',
    };

    return classNames[status];
};

const getRiskBadgeClassName = (riskLevel: RiskLevel): string => {
    const classNames: Record<RiskLevel, string> = {
        LOW: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
        HIGH: 'bg-red-50 text-red-700 ring-red-200',
    };

    return classNames[riskLevel];
};

const getPredictionReasonMessages = (reasons: unknown[] | null | undefined): string[] => {
    if (!Array.isArray(reasons)) {
        return [];
    }

    return reasons.reduce<string[]>((messages, reason) => {
        if (
            typeof reason === 'object' &&
            reason !== null &&
            'message' in reason &&
            typeof reason.message === 'string'
        ) {
            messages.push(reason.message);
            return messages;
        }

        if (typeof reason === 'string') {
            messages.push(reason);
        }

        return messages;
    }, []);
};

const getPredictionReasonCodes = (reasons: unknown[] | null | undefined): string[] => {
    if (!Array.isArray(reasons)) {
        return [];
    }

    return reasons.reduce<string[]>((codes, reason) => {
        if (
            typeof reason === 'object' &&
            reason !== null &&
            'code' in reason &&
            typeof reason.code === 'string'
        ) {
            codes.push(reason.code);
        }

        return codes;
    }, []);
};

const getPredictionScore = (prediction: AppointmentNoShowPrediction): number | null => {
    const score = prediction.riskScore ?? prediction.score;

    return typeof score === 'number' && Number.isFinite(score) ? score : null;
};

const getSuggestedActions = (prediction: AppointmentNoShowPrediction): string[] => {
    const reasonCodes = new Set(getPredictionReasonCodes(prediction.reasons));
    const suggestions: string[] = [];

    if (prediction.riskLevel === 'HIGH') {
        suggestions.push('Consider a manual confirmation call before the appointment time.');
        suggestions.push('Keep this appointment visible during staff review of the day.');
    } else if (prediction.riskLevel === 'MEDIUM') {
        suggestions.push('Consider a manual check-in or confirmation if staff capacity allows.');
        suggestions.push('Watch the appointment during normal queue preparation.');
    } else {
        suggestions.push('Standard reception follow-up is likely enough for this appointment.');
    }

    if (reasonCodes.has('PREVIOUS_NO_SHOW_HISTORY')) {
        suggestions.push('Review patient attendance history before deciding any follow-up.');
    }

    if (reasonCodes.has('SHORT_NOTICE_BOOKING')) {
        suggestions.push('Confirm the appointment time clearly if staff speak with the patient.');
    }

    if (reasonCodes.has('LONG_ADVANCE_BOOKING')) {
        suggestions.push(
            'Consider a closer-to-date manual confirmation if clinic workload allows.'
        );
    }

    if (reasonCodes.has('NEW_PATIENT')) {
        suggestions.push('Verify contact details during normal reception workflow.');
    }

    if (reasonCodes.has('STRONG_ATTENDANCE_HISTORY')) {
        suggestions.push('Treat the lower risk as supportive context, not a final decision.');
    }

    return [...new Set(suggestions)];
};

const getAppointmentListFilters = (
    selectedDate: string,
    selectedStatus: AppointmentStatus | ''
): AppointmentListFilters => {
    return {
        date: selectedDate || undefined,
        status: selectedStatus || undefined,
    };
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClassName(
                status
            )}`}
        >
            {statusLabels[status]}
        </span>
    );
}

function RiskLevelBadge({ riskLevel }: { riskLevel: RiskLevel }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getRiskBadgeClassName(
                riskLevel
            )}`}
        >
            {riskLevel.toLowerCase()} risk
        </span>
    );
}

function RiskBadge({
    appointment,
    isExpanded,
    onToggle,
}: {
    appointment: AppointmentListItem;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const prediction = appointment.noShowPrediction;

    if (!prediction) {
        return (
            <div>
                <span className="text-slate-500">Not available</span>
                <button
                    type="button"
                    className="mt-2 block text-xs font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-800"
                    onClick={onToggle}
                >
                    {isExpanded ? 'Hide details' : 'View details'}
                </button>
            </div>
        );
    }

    const reasonMessages = getPredictionReasonMessages(prediction.reasons);

    return (
        <div>
            <RiskLevelBadge riskLevel={prediction.riskLevel} />
            {reasonMessages[0] ? (
                <p className="mt-2 max-w-xs text-xs text-slate-500">{reasonMessages[0]}</p>
            ) : null}
            <button
                type="button"
                className="mt-2 text-xs font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-800"
                onClick={onToggle}
            >
                {isExpanded ? 'Hide details' : 'View details'}
            </button>
        </div>
    );
}

function PredictionDetailPanel({ appointment }: { appointment: AppointmentListItem }) {
    const prediction = appointment.noShowPrediction;

    if (!prediction) {
        return (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-slate-900">
                    No no-show prediction available
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    This appointment does not include prediction data from the backend yet. Staff
                    can continue managing the appointment manually.
                </p>
            </div>
        );
    }

    const score = getPredictionScore(prediction);
    const reasonMessages = getPredictionReasonMessages(prediction.reasons);
    const suggestedActions = getSuggestedActions(prediction);
    const generatedAt = prediction.generatedAt ?? prediction.createdAt;

    return (
        <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        Starter no-show risk
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">
                        Explainable prediction for {appointment.patient.fullName}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                        These suggestions are recommendations for Admin/Staff review. They do not
                        change appointment status, cancel visits, or reorder the queue.
                    </p>
                </div>

                <RiskLevelBadge riskLevel={prediction.riskLevel} />
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-slate-200 bg-white p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Risk score
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                        {score === null ? 'Not available' : `${score}/100`}
                    </dd>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Rule version
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                        {prediction.modelVersion?.trim() || 'Not available'}
                    </dd>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Generated
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                        {generatedAt ? formatAppointmentDateTime(generatedAt) : 'Not available'}
                    </dd>
                </div>
            </dl>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                    <h4 className="text-sm font-semibold text-slate-900">Prediction reasons</h4>
                    {reasonMessages.length > 0 ? (
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                            {reasonMessages.map((reason) => (
                                <li key={reason}>{reason}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-3 text-sm text-slate-600">
                            The backend did not return explanation reasons for this prediction.
                        </p>
                    )}
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-slate-900">Suggested actions</h4>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                        {suggestedActions.map((action) => (
                            <li key={action}>{action}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function AppointmentsPage() {
    const { clinicId } = useActiveClinic();
    const [selectedDate, setSelectedDate] = useState(getTodayDateInputValue);
    const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | ''>('');
    const [appointmentListState, setAppointmentListState] =
        useState<AppointmentListState>(emptyAppointmentListState);
    const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
    const [statusUpdateError, setStatusUpdateError] = useState<{
        message: string;
        code?: string;
    } | null>(null);
    const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);
    const [expandedPredictionAppointmentId, setExpandedPredictionAppointmentId] = useState<
        string | null
    >(null);
    const [values, setValues] = useState<AppointmentBookingFormValues>(emptyFormValues);
    const [fieldErrors, setFieldErrors] = useState<AppointmentBookingFormFieldErrors>({});
    const [referenceState, setReferenceState] =
        useState<AppointmentReferenceState>(emptyReferenceState);
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrorTitle, setFormErrorTitle] = useState('Appointment was not booked');
    const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
    const [formErrorDetails, setFormErrorDetails] = useState<BackendValidationDetail[]>([]);
    const [successState, setSuccessState] = useState<SuccessState | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadAppointments = useCallback(
        async (signal?: AbortSignal) => {
            const filters = getAppointmentListFilters(selectedDate, selectedStatus);
            const data = await listAppointments(clinicId, filters, signal);

            return data.appointments;
        },
        [clinicId, selectedDate, selectedStatus]
    );

    const loadAppointmentReferences = useCallback(
        async (signal?: AbortSignal) => {
            const [doctorData, patientData] = await Promise.all([
                listDoctors(clinicId, signal),
                listPatients(clinicId, signal),
            ]);

            return {
                doctors: doctorData.doctors.filter(isActiveDoctor),
                patients: patientData.patients.filter(isActivePatient),
            };
        },
        [clinicId]
    );

    const handleRetryAppointments = () => {
        setStatusUpdateError(null);
        setAppointmentListState((currentState) => ({
            status: 'loading',
            appointments: currentState.appointments,
            error: null,
        }));

        void loadAppointments()
            .then((appointments) => {
                setAppointmentListState({
                    status: 'success',
                    appointments,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getAppointmentListErrorState(
                    error,
                    appointmentListState.appointments
                );

                if (errorState) {
                    setAppointmentListState(errorState);
                }
            });
    };

    const handleRetryReferences = () => {
        setReferenceState((currentState) => ({
            status: 'loading',
            doctors: currentState.doctors,
            patients: currentState.patients,
            error: null,
        }));

        void loadAppointmentReferences()
            .then((data) => {
                setReferenceState({
                    status: 'success',
                    doctors: data.doctors,
                    patients: data.patients,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getReferenceLoadErrorState(error);

                if (errorState) {
                    setReferenceState(errorState);
                }
            });
    };

    const prepareAppointmentFilterChange = () => {
        setAppointmentListState((currentState) => ({
            status: 'loading',
            appointments: currentState.appointments,
            error: null,
        }));
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);
        setExpandedPredictionAppointmentId(null);
    };

    const handleDateFilterChange = (value: string) => {
        prepareAppointmentFilterChange();
        setSelectedDate(value);
    };

    const handleStatusFilterChange = (value: AppointmentStatus | '') => {
        prepareAppointmentFilterChange();
        setSelectedStatus(value);
    };

    const handleTodayFilterClick = () => {
        prepareAppointmentFilterChange();
        setSelectedDate(getTodayDateInputValue());
    };

    useEffect(() => {
        const abortController = new AbortController();

        void loadAppointments(abortController.signal)
            .then((appointments) => {
                setAppointmentListState({
                    status: 'success',
                    appointments,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getAppointmentListErrorState(error);

                if (errorState) {
                    setAppointmentListState(errorState);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [loadAppointments]);

    useEffect(() => {
        const abortController = new AbortController();

        void loadAppointmentReferences(abortController.signal)
            .then((data) => {
                setReferenceState({
                    status: 'success',
                    doctors: data.doctors,
                    patients: data.patients,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getReferenceLoadErrorState(error);

                if (errorState) {
                    setReferenceState(errorState);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [loadAppointmentReferences]);

    const handleChange = (field: keyof AppointmentBookingFormValues, value: string) => {
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
        setSuccessState(null);
    };

    const handleSubmit = async () => {
        const nextFieldErrors = validateAppointmentForm(values);

        setFieldErrors(nextFieldErrors);
        setFormError(null);
        setFormErrorTitle('Appointment was not booked');
        setFormErrorCode(undefined);
        setFormErrorDetails([]);
        setSuccessState(null);

        if (Object.keys(nextFieldErrors).length > 0 || referenceState.status !== 'success') {
            return;
        }

        setIsSubmitting(true);

        try {
            const data = await createAppointment(clinicId, toCreateAppointmentRequest(values));

            setValues(emptyFormValues);
            setFieldErrors({});
            setSuccessState({
                message: 'Appointment booked successfully.',
                scheduledAt: data.appointment.scheduledAt,
                riskLevel: data.noShowPrediction?.riskLevel,
            });

            void loadAppointments()
                .then((appointments) => {
                    setAppointmentListState({
                        status: 'success',
                        appointments,
                        error: null,
                    });
                })
                .catch((error: unknown) => {
                    const errorState = getAppointmentListErrorState(error);

                    if (errorState) {
                        setAppointmentListState(errorState);
                    }
                });
        } catch (error) {
            if (isApiClientError(error)) {
                setFieldErrors(getBackendFieldErrors(error.details));
                setFormError(error.message);
                setFormErrorTitle(
                    error.code === 'APPOINTMENT_SLOT_CONFLICT'
                        ? 'Doctor already has an appointment at this time'
                        : 'Appointment was not booked'
                );
                setFormErrorCode(error.code);
                setFormErrorDetails(getBackendValidationDetails(error.details));
                return;
            }

            setFormError('Appointment could not be booked. Please try again.');
            setFormErrorCode('APPOINTMENT_CREATE_FAILED');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async (
        appointment: AppointmentListItem,
        nextStatus: AppointmentStatus
    ) => {
        if (nextStatus === appointment.status) {
            return;
        }

        setUpdatingAppointmentId(appointment.id);
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);

        try {
            const data = await updateAppointmentStatus(appointment.id, nextStatus);

            setAppointmentListState((currentState) => {
                const shouldKeepAppointment =
                    !selectedStatus || selectedStatus === data.appointment.status;
                const appointments = shouldKeepAppointment
                    ? currentState.appointments.map((currentAppointment) =>
                          currentAppointment.id === data.appointment.id
                              ? data.appointment
                              : currentAppointment
                      )
                    : currentState.appointments.filter(
                          (currentAppointment) => currentAppointment.id !== data.appointment.id
                      );

                return {
                    ...currentState,
                    appointments,
                };
            });
            setStatusUpdateMessage(
                `Status updated to ${statusLabels[data.appointment.status].toLowerCase()}.`
            );
        } catch (error) {
            if (isApiClientError(error)) {
                setStatusUpdateError({
                    message: error.message,
                    code: error.code,
                });
                return;
            }

            setStatusUpdateError({
                message: 'Appointment status could not be updated. Please try again.',
                code: 'APPOINTMENT_STATUS_UPDATE_FAILED',
            });
        } finally {
            setUpdatingAppointmentId(null);
        }
    };

    const canUseForm =
        referenceState.status === 'success' &&
        referenceState.doctors.length > 0 &&
        referenceState.patients.length > 0;
    const hasAppointments =
        appointmentListState.status === 'success' && appointmentListState.appointments.length > 0;

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Appointments
                    </p>

                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Appointments</h1>

                    <p className="mt-4 max-w-2xl text-slate-600">
                        View clinic appointments, filter by date and status, and update appointment
                        status during daily operations.
                    </p>
                </div>

                <a
                    href="#book-appointment"
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    Book appointment
                </a>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                    <label className="block text-sm font-medium text-slate-700">
                        Appointment date
                        <input
                            type="date"
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            value={selectedDate}
                            onChange={(event) => handleDateFilterChange(event.target.value)}
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Status
                        <select
                            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            value={selectedStatus}
                            onChange={(event) =>
                                handleStatusFilterChange(
                                    event.target.value as AppointmentStatus | ''
                                )
                            }
                        >
                            <option value="">All statuses</option>
                            {statusOptions.map((statusOption) => (
                                <option key={statusOption.value} value={statusOption.value}>
                                    {statusOption.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="button"
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={handleTodayFilterClick}
                    >
                        Today
                    </button>
                </div>
            </div>

            {appointmentListState.status === 'loading' ? (
                <LoadingState message="Loading appointments..." />
            ) : null}

            {appointmentListState.status === 'error' ? (
                <ErrorMessage
                    title="Appointments could not be loaded"
                    message={appointmentListState.error.message}
                    code={appointmentListState.error.code}
                    onRetry={handleRetryAppointments}
                />
            ) : null}

            {statusUpdateError ? (
                <ErrorMessage
                    title="Appointment status was not updated"
                    message={statusUpdateError.message}
                    code={statusUpdateError.code}
                />
            ) : null}

            {statusUpdateMessage ? (
                <div
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                    role="status"
                >
                    {statusUpdateMessage}
                    <button
                        type="button"
                        className="ml-3 text-emerald-700 underline decoration-emerald-300 underline-offset-2"
                        onClick={() => setStatusUpdateMessage(null)}
                    >
                        Dismiss
                    </button>
                </div>
            ) : null}

            {appointmentListState.status === 'success' &&
            appointmentListState.appointments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <h2 className="text-lg font-semibold text-slate-900">No appointments found</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                        No appointments match the selected date and status filters.
                    </p>
                </div>
            ) : null}

            {hasAppointments ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Time</th>
                                    <th className="px-4 py-3 font-semibold">Patient</th>
                                    <th className="px-4 py-3 font-semibold">Doctor</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Notes</th>
                                    <th className="px-4 py-3 font-semibold">Risk</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {appointmentListState.appointments.map((appointment) => {
                                    const statusActions =
                                        statusActionsByCurrentStatus[appointment.status];
                                    const isUpdating = updatingAppointmentId === appointment.id;
                                    const isRiskExpanded =
                                        expandedPredictionAppointmentId === appointment.id;

                                    return (
                                        <Fragment key={appointment.id}>
                                            <tr className="align-top">
                                                <td className="px-4 py-4 text-slate-700">
                                                    <p className="font-semibold text-slate-900">
                                                        {formatAppointmentDateTime(
                                                            appointment.scheduledAt
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {formatDuration(
                                                            appointment.durationMinutes
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-slate-900">
                                                        {appointment.patient.fullName}
                                                    </p>
                                                    <p className="mt-1 text-slate-600">
                                                        {getOptionalText(appointment.patient.phone)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-slate-900">
                                                        {appointment.doctor.fullName}
                                                    </p>
                                                    <p className="mt-1 text-slate-600">
                                                        {getOptionalText(
                                                            appointment.doctor.specialization
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={appointment.status} />
                                                    {appointment.queueEntry ? (
                                                        <p className="mt-2 text-xs text-slate-500">
                                                            Queue #{appointment.queueEntry.position}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-4 text-slate-700">
                                                    <p>{getOptionalText(appointment.reason)}</p>
                                                    {appointment.notes ? (
                                                        <p className="mt-2 max-w-xs text-xs text-slate-500">
                                                            {appointment.notes}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <RiskBadge
                                                        appointment={appointment}
                                                        isExpanded={isRiskExpanded}
                                                        onToggle={() =>
                                                            setExpandedPredictionAppointmentId(
                                                                isRiskExpanded
                                                                    ? null
                                                                    : appointment.id
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    {statusActions.length > 0 ? (
                                                        <select
                                                            className="w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                                                            value=""
                                                            onChange={(event) => {
                                                                const nextStatus = event.target
                                                                    .value as AppointmentStatus;

                                                                if (nextStatus) {
                                                                    void handleStatusUpdate(
                                                                        appointment,
                                                                        nextStatus
                                                                    );
                                                                }
                                                            }}
                                                            disabled={isUpdating}
                                                            aria-label={`Update status for ${appointment.patient.fullName}`}
                                                        >
                                                            <option value="">
                                                                {isUpdating
                                                                    ? 'Updating...'
                                                                    : 'Update status'}
                                                            </option>
                                                            {statusActions.map((action) => (
                                                                <option
                                                                    key={action.status}
                                                                    value={action.status}
                                                                >
                                                                    {action.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="text-sm text-slate-500">
                                                            Final status
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>

                                            {isRiskExpanded ? (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="bg-slate-50 px-4 py-4"
                                                    >
                                                        <PredictionDetailPanel
                                                            appointment={appointment}
                                                        />
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

            <div
                id="book-appointment"
                className="rounded-lg border border-slate-200 bg-white p-6 md:p-8"
            >
                <div className="mb-6">
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Booking
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Book appointment</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                        Select an active doctor and patient, choose the appointment time, and book
                        it into the clinic flow.
                    </p>
                </div>

                {referenceState.status === 'loading' ? (
                    <LoadingState message="Loading doctors and patients..." />
                ) : null}

                {referenceState.status === 'error' ? (
                    <ErrorMessage
                        title={referenceState.error.title}
                        message={referenceState.error.message}
                        code={referenceState.error.code}
                        onRetry={handleRetryReferences}
                    />
                ) : null}

                {referenceState.status === 'success' && referenceState.doctors.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                        <h3 className="text-lg font-semibold text-slate-900">
                            No active doctors available
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                            Add or activate a doctor before booking appointments for this clinic.
                        </p>
                        <Link
                            to="/doctors/new"
                            className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Add doctor
                        </Link>
                    </div>
                ) : null}

                {referenceState.status === 'success' && referenceState.patients.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                        <h3 className="text-lg font-semibold text-slate-900">
                            No active patients available
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                            Add a patient record before booking appointments for this clinic.
                        </p>
                        <Link
                            to="/patients/new"
                            className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Add patient
                        </Link>
                    </div>
                ) : null}

                {successState ? (
                    <div
                        className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                        role="status"
                    >
                        <p className="font-semibold">{successState.message}</p>
                        <p className="mt-1">
                            Scheduled for {formatAppointmentDateTime(successState.scheduledAt)}
                            {successState.riskLevel
                                ? ` with ${successState.riskLevel.toLowerCase()} no-show risk.`
                                : '.'}
                        </p>
                    </div>
                ) : null}

                {formError ? (
                    <div className="mb-6">
                        <ErrorMessage
                            title={formErrorTitle}
                            message={formError}
                            code={formErrorCode}
                            details={formErrorDetails}
                        />
                    </div>
                ) : null}

                <AppointmentBookingForm
                    values={values}
                    fieldErrors={fieldErrors}
                    doctors={referenceState.doctors}
                    patients={referenceState.patients}
                    isSubmitting={isSubmitting}
                    isDisabled={!canUseForm}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                />
            </div>
        </section>
    );
}

export default AppointmentsPage;
