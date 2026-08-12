import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { EmptyState, ErrorMessage, LoadingState, useToast } from '../../components/feedback';
import {
    Button,
    FilterBar,
    LifecycleRail,
    PageHeader,
    RiskBadge as RiskLevelBadge,
    StatusBadge,
    fieldControlClassName,
    getAppointmentStatusLabel,
    getQueueStatusLabel,
} from '../../components/ui';
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

type AppointmentListInsights = {
    total: number;
    active: number;
    final: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    unavailableRisk: number;
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

const validationFieldMap: Partial<Record<string, keyof AppointmentBookingFormValues>> = {
    'body.doctorId': 'doctorId',
    'body.patientId': 'patientId',
    'body.scheduledAt': 'scheduledAt',
    'body.durationMinutes': 'durationMinutes',
    'body.reason': 'reason',
    'body.notes': 'notes',
};

const statusOptions: Array<{ value: AppointmentStatus; label: string }> = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_QUEUE,
    AppointmentStatus.CALLED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
].map((status) => ({
    value: status,
    label: getAppointmentStatusLabel(status),
}));

const getAppointmentStatusLabelLower = (status: AppointmentStatus): string => {
    return getAppointmentStatusLabel(status).toLowerCase();
};

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

const finalAppointmentStatuses: AppointmentStatus[] = [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
];

const appointmentLifecycleSteps = [
    {
        id: AppointmentStatus.SCHEDULED,
        label: 'Scheduled',
        description: 'Booked appointment',
    },
    {
        id: AppointmentStatus.CONFIRMED,
        label: 'Confirmed',
        description: 'Staff confirmed',
    },
    {
        id: AppointmentStatus.ARRIVED,
        label: 'Arrived',
        description: 'Patient present',
    },
    {
        id: AppointmentStatus.IN_QUEUE,
        label: 'In queue',
        description: 'Visible in queue',
    },
    {
        id: AppointmentStatus.CALLED,
        label: 'Called',
        description: 'Staff called patient',
    },
    {
        id: AppointmentStatus.COMPLETED,
        label: 'Completed',
        description: 'Visit closed',
    },
];

const isFinalAppointmentStatus = (status: AppointmentStatus): boolean => {
    return finalAppointmentStatuses.includes(status);
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
        errors.doctorId = 'Select a doctor before booking an appointment.';
    }

    if (!values.patientId) {
        errors.patientId = 'Select a patient before booking an appointment.';
    }

    if (!values.scheduledAt) {
        errors.scheduledAt = 'Appointment date and time are required.';
    } else if (Number.isNaN(new Date(values.scheduledAt).getTime())) {
        errors.scheduledAt = 'Enter a valid appointment date and time.';
    }

    if (!values.durationMinutes.trim()) {
        errors.durationMinutes = 'Appointment duration is required.';
    } else {
        const durationMinutes = Number(values.durationMinutes);

        if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
            errors.durationMinutes = 'Duration minutes must be a positive whole number.';
        }
    }

    if (values.reason.trim().length > 500) {
        errors.reason = 'Reason must be shorter than 500 characters.';
    }

    if (values.notes.trim().length > 500) {
        errors.notes = 'Notes must be shorter than 500 characters.';
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

const getBookingSourceLabel = (source: BookingSource): string => {
    const labels: Record<BookingSource, string> = {
        RECEPTION: 'Reception',
        PHONE: 'Phone',
        WEB: 'Web',
        WALK_IN: 'Walk-in',
    };

    return labels[source];
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

const getBackendSuggestedActions = (actions: unknown): string[] => {
    if (!Array.isArray(actions)) {
        return [];
    }

    return actions.filter((action): action is string => {
        return typeof action === 'string' && action.trim().length > 0;
    });
};

const getSuggestedActions = (prediction: AppointmentNoShowPrediction): string[] => {
    const backendSuggestedActions = getBackendSuggestedActions(prediction.suggestedActions);

    if (backendSuggestedActions.length > 0) {
        return backendSuggestedActions;
    }

    const reasonCodes = new Set(getPredictionReasonCodes(prediction.reasons));
    const suggestions: string[] = [];

    if (prediction.riskLevel === 'HIGH') {
        suggestions.push('Review this appointment during front-desk preparation.');
        suggestions.push('Consider a manual confirmation call before the appointment time.');
        suggestions.push(
            'Keep the slot visible so staff can decide what to do if the patient is late.'
        );
    } else if (prediction.riskLevel === 'MEDIUM') {
        suggestions.push('Consider a manual confirmation if staff have capacity.');
        suggestions.push('Check the appointment during normal queue preparation.');
    } else {
        suggestions.push('Use the normal reception workflow for this appointment.');
        suggestions.push(
            'Keep the appointment in the regular queue plan unless staff decide otherwise.'
        );
    }

    if (reasonCodes.has('PREVIOUS_NO_SHOW_HISTORY')) {
        suggestions.push('Review the patient attendance history before choosing any follow-up.');
    }

    if (reasonCodes.has('LATE_ARRIVAL_HISTORY')) {
        suggestions.push('Ask staff to watch arrival status and update it manually if needed.');
    }

    if (reasonCodes.has('LONG_DISTANCE_FROM_CLINIC')) {
        suggestions.push('If staff speak with the patient, clearly confirm the visit time.');
    }

    if (reasonCodes.has('SHORT_NOTICE_BOOKING')) {
        suggestions.push('Confirm that the patient understood the appointment time.');
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
    selectedDoctorId: string,
    selectedPatientId: string,
    selectedStatus: AppointmentStatus | ''
): AppointmentListFilters => {
    return {
        date: selectedDate || undefined,
        doctorId: selectedDoctorId || undefined,
        patientId: selectedPatientId || undefined,
        status: selectedStatus || undefined,
    };
};

const buildAppointmentListInsights = (
    appointments: AppointmentListItem[]
): AppointmentListInsights => {
    return appointments.reduce<AppointmentListInsights>(
        (insights, appointment) => {
            const riskLevel = appointment.noShowPrediction?.riskLevel;

            insights.total += 1;

            if (isFinalAppointmentStatus(appointment.status)) {
                insights.final += 1;
            } else {
                insights.active += 1;
            }

            if (riskLevel === 'HIGH') {
                insights.highRisk += 1;
            } else if (riskLevel === 'MEDIUM') {
                insights.mediumRisk += 1;
            } else if (riskLevel === 'LOW') {
                insights.lowRisk += 1;
            } else {
                insights.unavailableRisk += 1;
            }

            return insights;
        },
        {
            total: 0,
            active: 0,
            final: 0,
            highRisk: 0,
            mediumRisk: 0,
            lowRisk: 0,
            unavailableRisk: 0,
        }
    );
};

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
                    className="mt-2 block text-xs font-semibold text-brand-foreground underline decoration-brand-soft underline-offset-2 hover:text-brand-hover"
                    onClick={onToggle}
                >
                    {isExpanded ? 'Hide details' : 'View risk and details'}
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
                className="mt-2 text-xs font-semibold text-brand-foreground underline decoration-brand-soft underline-offset-2 hover:text-brand-hover"
                onClick={onToggle}
            >
                {isExpanded ? 'Hide details' : 'View risk and details'}
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
        <div className="rounded-lg border border-brand-soft bg-brand-subtle p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
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

function AppointmentLifecyclePanel({ appointment }: { appointment: AppointmentListItem }) {
    const terminalLabel =
        appointment.status === AppointmentStatus.CANCELLED
            ? 'Cancelled is a final appointment state. Queue sync remains backend-authoritative where a queue entry exists.'
            : appointment.status === AppointmentStatus.NO_SHOW
              ? 'No Show is a final appointment state. Risk assistance remains advisory and does not mark this automatically.'
              : 'Final statuses are locked. Non-final updates remain manual Admin/Staff actions in the current product.';

    return (
        <LifecycleRail
            steps={appointmentLifecycleSteps}
            currentStepId={
                appointment.status === AppointmentStatus.CANCELLED ||
                appointment.status === AppointmentStatus.NO_SHOW
                    ? undefined
                    : appointment.status
            }
            terminalLabel={terminalLabel}
            ariaLabel={`Appointment lifecycle for ${appointment.patient.fullName}`}
        />
    );
}

function AppointmentDetailPanel({ appointment }: { appointment: AppointmentListItem }) {
    const queueEntry = appointment.queueEntry;
    const patientContact = [appointment.patient.phone, appointment.patient.email]
        .filter((value): value is string => Boolean(value?.trim()))
        .join(' / ');

    return (
        <div className="space-y-4">
            <AppointmentLifecyclePanel appointment={appointment} />

            <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                            Appointment details
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">
                            {appointment.patient.fullName} with {appointment.doctor.fullName}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                            {formatAppointmentDateTime(appointment.scheduledAt)} for{' '}
                            {formatDuration(appointment.durationMinutes)}
                        </p>
                    </div>

                    <StatusBadge kind="appointment" status={appointment.status} />
                </div>

                <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Patient contact
                        </dt>
                        <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                            {patientContact || 'Not added'}
                        </dd>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Doctor
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">
                            {getOptionalText(appointment.doctor.specialization)}
                        </dd>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Booking source
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">
                            {getBookingSourceLabel(appointment.bookingSource)}
                        </dd>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Queue
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">
                            {queueEntry
                                ? `#${queueEntry.position} - ${getQueueStatusLabel(
                                      queueEntry.status
                                  )}`
                                : 'Not in queue'}
                        </dd>
                    </div>
                </dl>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Reason</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            {getOptionalText(appointment.reason)}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Staff notes</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            {getOptionalText(appointment.notes)}
                        </p>
                    </div>
                </div>
            </div>

            <PredictionDetailPanel appointment={appointment} />
        </div>
    );
}

function AppointmentListInsightsStrip({ insights }: { insights: AppointmentListInsights }) {
    const items = [
        { label: 'Matching appointments', value: insights.total },
        { label: 'Active workflow', value: insights.active },
        { label: 'Final status', value: insights.final },
        { label: 'High risk', value: insights.highRisk },
        { label: 'Medium risk', value: insights.mediumRisk },
        { label: 'Low risk', value: insights.lowRisk },
        { label: 'Risk unavailable', value: insights.unavailableRisk },
    ];

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {items.map((item) => (
                    <div key={item.label}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {item.label}
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AppointmentsPage() {
    const { clinicId } = useActiveClinic();
    const { showErrorToast, showSuccessToast } = useToast();
    const [selectedDate, setSelectedDate] = useState(getTodayDateInputValue);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState('');
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
            const filters = getAppointmentListFilters(
                selectedDate,
                selectedDoctorId,
                selectedPatientId,
                selectedStatus
            );
            const data = await listAppointments(clinicId, filters, signal);

            return data.appointments;
        },
        [clinicId, selectedDate, selectedDoctorId, selectedPatientId, selectedStatus]
    );

    const loadAppointmentReferences = useCallback(
        async (signal?: AbortSignal) => {
            const [doctorData, patientData] = await Promise.all([
                listDoctors(clinicId, signal),
                listPatients(clinicId, {}, signal),
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

    const handleDoctorFilterChange = (value: string) => {
        prepareAppointmentFilterChange();
        setSelectedDoctorId(value);
    };

    const handlePatientFilterChange = (value: string) => {
        prepareAppointmentFilterChange();
        setSelectedPatientId(value);
    };

    const handleTodayFilterClick = () => {
        prepareAppointmentFilterChange();
        setSelectedDate(getTodayDateInputValue());
    };

    const handleClearAppointmentFilters = () => {
        prepareAppointmentFilterChange();
        setSelectedDate('');
        setSelectedDoctorId('');
        setSelectedPatientId('');
        setSelectedStatus('');
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
            showSuccessToast('Appointment booked successfully.');

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

                    if (errorState?.status === 'error') {
                        setAppointmentListState(errorState);
                        showErrorToast(errorState.error.message);
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
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Appointment could not be booked. Please try again.';

            setFormError(fallbackMessage);
            setFormErrorCode('APPOINTMENT_CREATE_FAILED');
            showErrorToast(fallbackMessage);
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
                `Status updated to ${getAppointmentStatusLabelLower(data.appointment.status)}.`
            );
            showSuccessToast(
                `Appointment status updated to ${getAppointmentStatusLabelLower(
                    data.appointment.status
                )}.`
            );
        } catch (error) {
            if (isApiClientError(error)) {
                setStatusUpdateError({
                    message: error.message,
                    code: error.code,
                });
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Appointment status could not be updated. Please try again.';

            setStatusUpdateError({
                message: fallbackMessage,
                code: 'APPOINTMENT_STATUS_UPDATE_FAILED',
            });
            showErrorToast(fallbackMessage);
        } finally {
            setUpdatingAppointmentId(null);
        }
    };

    const canUseForm =
        referenceState.status === 'success' &&
        referenceState.doctors.length > 0 &&
        referenceState.patients.length > 0;
    const hasAppointmentFilters = Boolean(
        selectedDate || selectedDoctorId || selectedPatientId || selectedStatus
    );
    const hasAppointments =
        appointmentListState.status === 'success' && appointmentListState.appointments.length > 0;
    const appointmentInsights =
        appointmentListState.status === 'success'
            ? buildAppointmentListInsights(appointmentListState.appointments)
            : null;

    return (
        <section className="space-y-6">
            <PageHeader
                actions={
                    <a
                        href="#book-appointment"
                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-action px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                    >
                        Book appointment
                    </a>
                }
            />

            <FilterBar>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:items-end">
                    <label className="block text-sm font-medium text-slate-700">
                        Appointment date
                        <input
                            type="date"
                            className={fieldControlClassName}
                            value={selectedDate}
                            onChange={(event) => handleDateFilterChange(event.target.value)}
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Doctor
                        <select
                            className={fieldControlClassName}
                            value={selectedDoctorId}
                            onChange={(event) => handleDoctorFilterChange(event.target.value)}
                        >
                            <option value="">All doctors</option>
                            {referenceState.doctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.fullName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Patient
                        <select
                            className={fieldControlClassName}
                            value={selectedPatientId}
                            onChange={(event) => handlePatientFilterChange(event.target.value)}
                        >
                            <option value="">All patients</option>
                            {referenceState.patients.map((patient) => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.fullName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Status
                        <select
                            className={fieldControlClassName}
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

                    <Button variant="outline" onClick={handleTodayFilterClick}>
                        Today
                    </Button>

                    {hasAppointmentFilters ? (
                        <Button variant="outline" onClick={handleClearAppointmentFilters}>
                            Clear
                        </Button>
                    ) : null}
                </div>
            </FilterBar>

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
                    className="rounded-lg border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] px-4 py-3 text-sm font-medium text-[var(--color-status-success-text)]"
                    role="status"
                >
                    {statusUpdateMessage}
                    <button
                        type="button"
                        className="ml-3 text-[var(--color-status-success-text)] underline decoration-[var(--color-status-success-border)] underline-offset-2"
                        onClick={() => setStatusUpdateMessage(null)}
                    >
                        Dismiss
                    </button>
                </div>
            ) : null}

            {appointmentListState.status === 'success' &&
            appointmentListState.appointments.length === 0 ? (
                <EmptyState
                    title={
                        hasAppointmentFilters
                            ? 'No appointments match these filters.'
                            : 'No appointments scheduled yet.'
                    }
                    message={
                        hasAppointmentFilters
                            ? 'Try a different date, doctor, patient, or status to find matching appointments.'
                            : 'Book the first appointment to start the schedule and queue.'
                    }
                    action={
                        <a
                            href="#book-appointment"
                            className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-action px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                        >
                            Book appointment
                        </a>
                    }
                    secondaryAction={
                        hasAppointmentFilters ? (
                            <Button variant="outline" onClick={handleClearAppointmentFilters}>
                                Clear filters
                            </Button>
                        ) : undefined
                    }
                />
            ) : null}

            {appointmentInsights && appointmentInsights.total > 0 ? (
                <AppointmentListInsightsStrip insights={appointmentInsights} />
            ) : null}

            {hasAppointments ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div
                        className="overflow-x-auto"
                        tabIndex={0}
                        aria-label="Appointments table, horizontally scrollable on small screens"
                    >
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
                                            <tr className="align-top transition hover:bg-slate-50/70">
                                                <td className="min-w-44 px-4 py-5 text-slate-700">
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
                                                <td className="min-w-44 px-4 py-5">
                                                    <p className="font-semibold text-slate-900">
                                                        {appointment.patient.fullName}
                                                    </p>
                                                    <p className="mt-1 text-slate-600">
                                                        {getOptionalText(appointment.patient.phone)}
                                                    </p>
                                                    {appointment.patient.email ? (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {appointment.patient.email}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="min-w-44 px-4 py-5">
                                                    <p className="font-semibold text-slate-900">
                                                        {appointment.doctor.fullName}
                                                    </p>
                                                    <p className="mt-1 text-slate-600">
                                                        {getOptionalText(
                                                            appointment.doctor.specialization
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="min-w-32 px-4 py-5">
                                                    <StatusBadge
                                                        kind="appointment"
                                                        status={appointment.status}
                                                    />
                                                    {appointment.queueEntry ? (
                                                        <p className="mt-2 text-xs text-slate-500">
                                                            Queue #{appointment.queueEntry.position}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="min-w-56 px-4 py-5 text-slate-700">
                                                    <p className="font-medium text-slate-900">
                                                        {getOptionalText(appointment.reason)}
                                                    </p>
                                                    {appointment.notes ? (
                                                        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                                                            {appointment.notes}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="min-w-48 px-4 py-5">
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
                                                <td className="min-w-44 px-4 py-5">
                                                    {statusActions.length > 0 ? (
                                                        <select
                                                            className={`${fieldControlClassName} w-40`}
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
                                                        <AppointmentDetailPanel
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
                    <p className="text-sm font-medium uppercase tracking-wide text-brand-foreground">
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
                    <EmptyState
                        title="No active doctors available."
                        message="Add or activate a doctor before booking appointments for this clinic."
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

                {referenceState.status === 'success' && referenceState.patients.length === 0 ? (
                    <EmptyState
                        title="No active patients available."
                        message="Add a patient record before booking appointments for this clinic."
                        action={
                            <Link
                                to="/patients/new"
                                className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-action px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                            >
                                Add patient
                            </Link>
                        }
                    />
                ) : null}

                {successState ? (
                    <div
                        className="mb-6 rounded-lg border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] px-4 py-3 text-sm text-[var(--color-status-success-text)]"
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
