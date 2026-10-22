import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { EmptyState, ErrorMessage, LoadingState, useToast } from '../../components/feedback';
import {
    Button,
    FilterBar,
    PageHeader,
    RiskBadge as RiskLevelBadge,
    NoShowRiskDetailsDialog,
    StatusBadge,
    fieldControlClassName,
    getAppointmentStatusLabel,
} from '../../components/ui';
import { isApiClientError } from '../../lib';
import { formatClinicDateTime, getClinicDateInputValue } from '../../lib/clinicDateTime';
import useModalFocus from '../../components/ui/useModalFocus';
import { AppointmentStatus, BookingSource } from '../../types';
import type { DoctorSummary, PatientSummary, RiskLevel } from '../../types';
import { listDoctors } from '../doctors/doctorApi';
import { listPatients } from '../patients/patientApi';
import AppointmentBookingDialog from './AppointmentBookingDialog';
import AppointmentBookingForm, {
    type AppointmentBookingFormFieldErrors,
    type AppointmentBookingFormValues,
} from './AppointmentBookingForm';
import AppointmentActivityDialog from './AppointmentActivityDialog';
import TerminalAppointmentReasonDialog, {
    type TerminalAppointmentReasonSubmission,
} from './TerminalAppointmentReasonDialog';
import { getTerminalReasonDisplay } from './terminalAppointmentReasons';
import {
    createAppointment,
    listAvailableAppointmentSlots,
    listAppointments,
    updateAppointmentStatus,
    type AvailableAppointmentSlot,
    type AppointmentListFilters,
    type AppointmentListItem,
    type CreateAppointmentRequest,
    listAppointmentRescheduleSlots,
    rescheduleAppointment,
    type RescheduleAppointmentSlotsResponseData,
    type UpdateAppointmentStatusRequest,
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

type AvailableSlotsState =
    | {
          status: 'idle';
          slots: AvailableAppointmentSlot[];
          error: null;
      }
    | {
          status: 'loading';
          slots: AvailableAppointmentSlot[];
          error: null;
      }
    | {
          status: 'success';
          slots: AvailableAppointmentSlot[];
          error: null;
      }
    | {
          status: 'error';
          slots: AvailableAppointmentSlot[];
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

type RescheduleFlowState = {
    appointment: AppointmentListItem;
    destinationDate: string;
    selectedScheduledAt: string;
    availability: RescheduleAppointmentSlotsResponseData['availability'] | null;
    slotsState: AvailableSlotsState;
    error: {
        message: string;
        code?: string;
    } | null;
    isSaving: boolean;
};

type TerminalReasonFlowState = {
    appointment: AppointmentListItem;
    mode: 'cancellation' | 'no-show';
    error: string | null;
    isSubmitting: boolean;
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
    appointmentDate: '',
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

const emptyAvailableSlotsState: AvailableSlotsState = {
    status: 'idle',
    slots: [],
    error: null,
};

const validationFieldMap: Partial<Record<string, keyof AppointmentBookingFormValues>> = {
    'body.doctorId': 'doctorId',
    'body.patientId': 'patientId',
    'body.appointmentDate': 'appointmentDate',
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

const reschedulableAppointmentStatuses: AppointmentStatus[] = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
];

const appointmentLifecycleSteps = [
    { id: AppointmentStatus.SCHEDULED, label: 'Scheduled', description: 'Booked appointment' },
    { id: AppointmentStatus.CONFIRMED, label: 'Confirmed', description: 'Staff confirmed' },
    { id: AppointmentStatus.ARRIVED, label: 'Arrived', description: 'Patient present' },
    { id: AppointmentStatus.IN_QUEUE, label: 'In queue', description: 'Visible in queue' },
    { id: AppointmentStatus.CALLED, label: 'Called', description: 'Staff called patient' },
    { id: AppointmentStatus.COMPLETED, label: 'Completed', description: 'Visit closed' },
];

const isFinalAppointmentStatus = (status: AppointmentStatus): boolean => {
    return finalAppointmentStatuses.includes(status);
};

const isAppointmentReschedulable = (status: AppointmentStatus): boolean => {
    return reschedulableAppointmentStatuses.includes(status);
};

const isActiveDoctor = (doctor: DoctorSummary): boolean => {
    return doctor.isActive && doctor.clinicLinkIsActive !== false;
};

const isActivePatient = (patient: PatientSummary): boolean => {
    return patient.isActive && patient.clinicLinkIsActive !== false;
};

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateInputValue = (value: string): boolean => {
    if (!dateInputPattern.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);

    return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
};

const toOptionalString = (value: string): string | undefined => {
    const trimmedValue = value.trim();

    return trimmedValue || undefined;
};

const getPositiveIntegerValue = (value: string): number | null => {
    const parsedValue = Number(value);

    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
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

    if (!values.appointmentDate) {
        errors.appointmentDate = 'Appointment date is required.';
    } else if (!isValidDateInputValue(values.appointmentDate)) {
        errors.appointmentDate = 'Enter a valid appointment date.';
    }

    if (!values.scheduledAt) {
        errors.scheduledAt = 'Select an available appointment slot.';
    } else if (Number.isNaN(new Date(values.scheduledAt).getTime())) {
        errors.scheduledAt = 'Select a valid appointment slot.';
    }

    if (!values.durationMinutes.trim()) {
        errors.durationMinutes = 'Appointment duration is required.';
    } else {
        const durationMinutes = getPositiveIntegerValue(values.durationMinutes);

        if (durationMinutes === null) {
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

const formatAppointmentTime = (
    value: string | null | undefined,
    timezone?: string | null
): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
        timeStyle: 'short',
        timeZone: timezone ?? undefined,
    }).format(date);
};

const formatDuration = (durationMinutes: number): string => {
    return `${durationMinutes} min`;
};

const getSlotLabel = (slot: AvailableAppointmentSlot): string => {
    return `${slot.localStartTime}-${slot.localEndTime}`;
};

const getOptionalText = (value: string | null | undefined): string => {
    return value?.trim() || 'Not added';
};

const getArrivalClassificationLabel = (
    appointment: Pick<AppointmentListItem, 'arrivedAt' | 'arrivalOffsetMinutes' | 'isLateArrival'>
): string | null => {
    if (!appointment.arrivedAt) {
        return null;
    }

    if (appointment.isLateArrival === true) {
        const offset = appointment.arrivalOffsetMinutes;

        return typeof offset === 'number' ? `Late - ${offset} min` : 'Late';
    }

    if (appointment.isLateArrival === false) {
        const offset = appointment.arrivalOffsetMinutes;

        if (typeof offset === 'number' && offset > 0) {
            return 'Within grace';
        }

        return 'On time';
    }

    return 'Arrival recorded';
};

function AppointmentArrivalSummary({
    appointment,
    timezone,
}: {
    appointment: AppointmentListItem;
    timezone?: string | null;
}) {
    const arrivedAt = formatAppointmentTime(appointment.arrivedAt, timezone);
    const classification = getArrivalClassificationLabel(appointment);

    if (!arrivedAt || !classification) {
        return null;
    }

    return (
        <p className="mt-2 text-xs font-medium text-slate-600">
            Arrived {arrivedAt} · {classification}
        </p>
    );
}

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

function AppointmentRiskSummary({
    appointment,
    onOpen,
}: {
    appointment: AppointmentListItem;
    onOpen: () => void;
}) {
    const prediction = appointment.noShowPrediction;
    return (
        <div className="flex min-w-36 flex-col items-start gap-1">
            <div className="flex flex-wrap items-center gap-2">
                <RiskLevelBadge riskLevel={prediction?.riskLevel ?? null} />
                {prediction ? (
                    <span className="text-xs font-medium text-slate-600">
                        {typeof prediction.riskScore === 'number'
                            ? `${prediction.riskScore}/100`
                            : typeof prediction.score === 'number'
                              ? `${prediction.score}/100`
                              : 'Score unavailable'}
                    </span>
                ) : null}
            </div>
            <button
                type="button"
                className="inline-flex min-h-10 items-center text-xs font-semibold text-brand-foreground underline decoration-brand-soft underline-offset-2 hover:text-brand-hover"
                onClick={onOpen}
                aria-label={`View risk details for ${appointment.patient.fullName}`}
            >
                View risk details
            </button>
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

function RescheduleAppointmentDialog({
    state,
    timezone,
    onDateChange,
    onSlotChange,
    onConfirm,
    onCancel,
}: {
    state: RescheduleFlowState;
    timezone?: string | null;
    onDateChange: (value: string) => void;
    onSlotChange: (value: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const selectedSlot =
        state.availability?.slots.find((slot) => slot.scheduledAt === state.selectedScheduledAt) ??
        null;
    const canConfirm = Boolean(selectedSlot) && !state.isSaving;
    const dialogRef = useModalFocus(onCancel, state.isSaving);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="appointment-reschedule-title"
                tabIndex={-1}
                className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg border border-app-border bg-white p-6 shadow-xl"
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                            Reschedule
                        </p>
                        <h2
                            id="appointment-reschedule-title"
                            className="mt-1 text-lg font-semibold text-app-text"
                        >
                            {state.appointment.patient.fullName}
                        </h2>
                        <p className="mt-2 text-sm text-app-muted">
                            {state.appointment.doctor.fullName} ·{' '}
                            {formatDuration(state.appointment.durationMinutes)}
                        </p>
                    </div>

                    <StatusBadge kind="appointment" status={state.appointment.status} />
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Patient
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">
                            {state.appointment.patient.fullName}
                        </dd>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Doctor
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">
                            {state.appointment.doctor.fullName}
                        </dd>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Current
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">
                            {formatClinicDateTime(state.appointment.scheduledAt, timezone)}
                        </dd>
                    </div>
                </dl>

                <div className="mt-5 grid gap-5">
                    <label className="block text-sm font-medium text-slate-700">
                        New date
                        <input
                            className={fieldControlClassName}
                            type="date"
                            value={state.destinationDate}
                            onChange={(event) => onDateChange(event.target.value)}
                            disabled={state.isSaving}
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Available destination slot
                        <select
                            className={fieldControlClassName}
                            value={state.selectedScheduledAt}
                            onChange={(event) => onSlotChange(event.target.value)}
                            disabled={
                                state.isSaving ||
                                state.slotsState.status === 'loading' ||
                                state.slotsState.status === 'error' ||
                                state.slotsState.slots.length === 0
                            }
                        >
                            <option value="">
                                {state.slotsState.status === 'loading'
                                    ? 'Loading slots...'
                                    : state.slotsState.slots.length > 0
                                      ? 'Select destination slot'
                                      : 'No slots available'}
                            </option>
                            {state.slotsState.slots.map((slot) => (
                                <option key={slot.scheduledAt} value={slot.scheduledAt}>
                                    {getSlotLabel(slot)}
                                </option>
                            ))}
                        </select>
                        {state.availability?.timezone ? (
                            <span className="mt-1 block text-xs text-slate-500">
                                Clinic timezone: {state.availability.timezone}
                            </span>
                        ) : null}
                    </label>
                </div>

                {state.slotsState.status === 'error' ? (
                    <p
                        role="alert"
                        className="mt-4 rounded-md border border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-bg)] px-3 py-2 text-sm text-[var(--color-status-danger-text)]"
                    >
                        {state.slotsState.error.message}
                    </p>
                ) : null}

                {state.slotsState.status === 'success' && state.slotsState.slots.length === 0 ? (
                    <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        No available slots for this doctor on this date.
                    </p>
                ) : null}

                {state.error ? (
                    <p
                        role="alert"
                        className="mt-4 rounded-md border border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-bg)] px-3 py-2 text-sm text-[var(--color-status-danger-text)]"
                    >
                        {state.error.message}
                    </p>
                ) : null}

                {selectedSlot ? (
                    <div className="mt-5 rounded-lg border border-brand-soft bg-brand-subtle p-4">
                        <h3 className="text-sm font-semibold text-slate-900">
                            Reschedule appointment?
                        </h3>
                        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    From
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-slate-900">
                                    {formatClinicDateTime(state.appointment.scheduledAt, timezone)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    To
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-slate-900">
                                    {selectedSlot.localDate} · {getSlotLabel(selectedSlot)}
                                </dd>
                            </div>
                        </dl>
                    </div>
                ) : null}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={onCancel} disabled={state.isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!canConfirm}
                        isLoading={state.isSaving}
                        loadingText="Rescheduling..."
                    >
                        Confirm reschedule
                    </Button>
                </div>
            </div>
        </div>
    );
}

function AppointmentsPage() {
    const activeClinic = useActiveClinic();
    const location = useLocation();
    const navigate = useNavigate();
    const bookingReturnState = location.state as {
        bookingDraft?: AppointmentBookingFormValues;
        patientId?: string;
        appointmentId?: string;
        appointmentDate?: string;
    } | null;
    const { clinicId } = activeClinic;
    const clinicTimezone = activeClinic.clinic?.timezone;
    const { showErrorToast, showSuccessToast } = useToast();
    const [selectedDate, setSelectedDate] = useState(() => getClinicDateInputValue(clinicTimezone));
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [patientSearch, setPatientSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | ''>('');
    const [navigationAppointmentId, setNavigationAppointmentId] = useState<string | null>(
        bookingReturnState?.appointmentId ?? null
    );
    const [appointmentListState, setAppointmentListState] =
        useState<AppointmentListState>(emptyAppointmentListState);
    useEffect(
        () => setCurrentPage(1),
        [selectedDate, selectedDoctorId, selectedPatientId, selectedStatus]
    );
    useEffect(() => {
        if (!bookingReturnState?.appointmentId || !bookingReturnState.appointmentDate) return;
        setNavigationAppointmentId(bookingReturnState.appointmentId);
        setSelectedDate(bookingReturnState.appointmentDate.slice(0, 10));
        setSelectedDoctorId('');
        setSelectedPatientId('');
        setSelectedStatus('');
        setPatientSearch('');
    }, [bookingReturnState?.appointmentId, bookingReturnState?.appointmentDate]);
    const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
    const [statusUpdateError, setStatusUpdateError] = useState<{
        message: string;
        code?: string;
    } | null>(null);
    const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);
    const [riskDetailsAppointment, setRiskDetailsAppointment] =
        useState<AppointmentListItem | null>(null);
    const [values, setValues] = useState<AppointmentBookingFormValues>(() => ({
        ...emptyFormValues,
        ...(bookingReturnState?.bookingDraft ?? {}),
        patientId:
            bookingReturnState?.patientId ?? bookingReturnState?.bookingDraft?.patientId ?? '',
    }));
    const [fieldErrors, setFieldErrors] = useState<AppointmentBookingFormFieldErrors>({});
    const [referenceState, setReferenceState] =
        useState<AppointmentReferenceState>(emptyReferenceState);
    const [availableSlotsState, setAvailableSlotsState] =
        useState<AvailableSlotsState>(emptyAvailableSlotsState);
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrorTitle, setFormErrorTitle] = useState('Appointment was not booked');
    const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
    const [formErrorDetails, setFormErrorDetails] = useState<BackendValidationDetail[]>([]);
    const [successState, setSuccessState] = useState<SuccessState | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(() =>
        Boolean(
            location.hash === '#book-appointment' ||
            bookingReturnState?.bookingDraft ||
            bookingReturnState?.patientId
        )
    );
    const [rescheduleFlow, setRescheduleFlow] = useState<RescheduleFlowState | null>(null);

    useEffect(() => {
        const hasBookingReturn = Boolean(
            bookingReturnState?.bookingDraft || bookingReturnState?.patientId
        );
        if (location.hash !== '#book-appointment' && !hasBookingReturn) return;
        const nextState = hasBookingReturn
            ? bookingReturnState?.appointmentId || bookingReturnState?.appointmentDate
                ? {
                      appointmentId: bookingReturnState.appointmentId,
                      appointmentDate: bookingReturnState.appointmentDate,
                  }
                : null
            : location.state;
        navigate(`${location.pathname}${location.search}`, {
            replace: true,
            state: nextState,
        });
    }, [
        bookingReturnState?.appointmentDate,
        bookingReturnState?.appointmentId,
        bookingReturnState?.bookingDraft,
        bookingReturnState?.patientId,
        location.hash,
        location.pathname,
        location.search,
        location.state,
        navigate,
    ]);

    const closeBookingDialog = () => setIsBookingDialogOpen(false);
    const [activityAppointment, setActivityAppointment] = useState<AppointmentListItem | null>(
        null
    );
    const [terminalReasonFlow, setTerminalReasonFlow] = useState<TerminalReasonFlowState | null>(
        null
    );
    const [rescheduleSlotsRefreshKey, setRescheduleSlotsRefreshKey] = useState(0);
    const activeRescheduleAppointmentId = rescheduleFlow?.appointment.id ?? null;
    const activeRescheduleDestinationDate = rescheduleFlow?.destinationDate ?? '';

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
        setRiskDetailsAppointment(null);
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
        setSelectedDate(getClinicDateInputValue(clinicTimezone));
    };

    const handleClearAppointmentFilters = () => {
        prepareAppointmentFilterChange();
        setSelectedDate('');
        setSelectedDoctorId('');
        setSelectedPatientId('');
        setSelectedStatus('');
        setPatientSearch('');
        setCurrentPage(1);
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

    useEffect(() => {
        const durationMinutes = getPositiveIntegerValue(values.durationMinutes);
        const canLoadSlots =
            referenceState.status === 'success' &&
            Boolean(values.doctorId) &&
            Boolean(values.appointmentDate) &&
            isValidDateInputValue(values.appointmentDate) &&
            durationMinutes !== null;

        if (!canLoadSlots || durationMinutes === null) {
            setAvailableSlotsState(emptyAvailableSlotsState);
            return;
        }

        const abortController = new AbortController();

        setAvailableSlotsState((currentState) => ({
            status: 'loading',
            slots: currentState.slots,
            error: null,
        }));

        void listAvailableAppointmentSlots(
            clinicId,
            {
                doctorId: values.doctorId,
                date: values.appointmentDate,
                durationMinutes,
            },
            abortController.signal
        )
            .then((data) => {
                setAvailableSlotsState({
                    status: 'success',
                    slots: data.slots,
                    error: null,
                });
                setValues((currentValues) => {
                    if (
                        !currentValues.scheduledAt ||
                        data.slots.some((slot) => slot.scheduledAt === currentValues.scheduledAt)
                    ) {
                        return currentValues;
                    }

                    return {
                        ...currentValues,
                        scheduledAt: '',
                    };
                });
            })
            .catch((error: unknown) => {
                if (abortController.signal.aborted) {
                    return;
                }

                if (isApiClientError(error)) {
                    setAvailableSlotsState({
                        status: 'error',
                        slots: [],
                        error: {
                            message: error.message,
                            code: error.code,
                        },
                    });
                    return;
                }

                setAvailableSlotsState({
                    status: 'error',
                    slots: [],
                    error: {
                        message: 'Available appointment slots could not be loaded.',
                        code: 'APPOINTMENT_SLOTS_LOAD_FAILED',
                    },
                });
            });

        return () => {
            abortController.abort();
        };
    }, [
        clinicId,
        referenceState.status,
        values.appointmentDate,
        values.doctorId,
        values.durationMinutes,
    ]);

    useEffect(() => {
        if (!activeRescheduleAppointmentId) {
            return undefined;
        }

        const canLoadSlots =
            Boolean(activeRescheduleDestinationDate) &&
            isValidDateInputValue(activeRescheduleDestinationDate);

        if (!canLoadSlots) {
            setRescheduleFlow((currentState) =>
                currentState
                    ? {
                          ...currentState,
                          availability: null,
                          selectedScheduledAt: '',
                          slotsState: emptyAvailableSlotsState,
                      }
                    : currentState
            );
            return undefined;
        }

        const abortController = new AbortController();
        const appointmentId = activeRescheduleAppointmentId;
        const destinationDate = activeRescheduleDestinationDate;

        setRescheduleFlow((currentState) =>
            currentState && currentState.appointment.id === appointmentId
                ? {
                      ...currentState,
                      slotsState: {
                          status: 'loading',
                          slots: currentState.slotsState.slots,
                          error: null,
                      },
                      error: null,
                  }
                : currentState
        );

        void listAppointmentRescheduleSlots(appointmentId, destinationDate, abortController.signal)
            .then((data) => {
                const slots = data.availability.slots.filter(
                    (slot) => slot.scheduledAt !== data.availability.currentScheduledAt
                );

                setRescheduleFlow((currentState) => {
                    if (
                        !currentState ||
                        currentState.appointment.id !== appointmentId ||
                        currentState.destinationDate !== destinationDate
                    ) {
                        return currentState;
                    }

                    return {
                        ...currentState,
                        availability: {
                            ...data.availability,
                            slots,
                        },
                        selectedScheduledAt: slots.some(
                            (slot) => slot.scheduledAt === currentState.selectedScheduledAt
                        )
                            ? currentState.selectedScheduledAt
                            : '',
                        slotsState: {
                            status: 'success',
                            slots,
                            error: null,
                        },
                    };
                });
            })
            .catch((error: unknown) => {
                if (abortController.signal.aborted) {
                    return;
                }

                setRescheduleFlow((currentState) => {
                    if (
                        !currentState ||
                        currentState.appointment.id !== appointmentId ||
                        currentState.destinationDate !== destinationDate
                    ) {
                        return currentState;
                    }

                    if (isApiClientError(error)) {
                        return {
                            ...currentState,
                            availability: null,
                            selectedScheduledAt: '',
                            slotsState: {
                                status: 'error',
                                slots: [],
                                error: {
                                    message: error.message,
                                    code: error.code,
                                },
                            },
                        };
                    }

                    return {
                        ...currentState,
                        availability: null,
                        selectedScheduledAt: '',
                        slotsState: {
                            status: 'error',
                            slots: [],
                            error: {
                                message: 'Reschedule slots could not be loaded.',
                                code: 'APPOINTMENT_RESCHEDULE_SLOTS_LOAD_FAILED',
                            },
                        },
                    };
                });
            });

        return () => {
            abortController.abort();
        };
    }, [activeRescheduleAppointmentId, activeRescheduleDestinationDate, rescheduleSlotsRefreshKey]);

    const handleChange = (field: keyof AppointmentBookingFormValues, value: string) => {
        const shouldClearSelectedSlot =
            field === 'doctorId' || field === 'appointmentDate' || field === 'durationMinutes';

        setValues((currentValues) => ({
            ...currentValues,
            [field]: value,
            scheduledAt:
                field === 'scheduledAt'
                    ? value
                    : shouldClearSelectedSlot
                      ? ''
                      : currentValues.scheduledAt,
        }));
        setFieldErrors((currentErrors) => ({
            ...currentErrors,
            [field]: undefined,
            scheduledAt:
                field === 'scheduledAt' || shouldClearSelectedSlot
                    ? undefined
                    : currentErrors.scheduledAt,
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
                        ? 'Doctor already has an overlapping appointment'
                        : error.code === 'APPOINTMENT_SLOT_UNAVAILABLE'
                          ? 'Selected slot is no longer available'
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

        if (
            nextStatus === AppointmentStatus.CANCELLED ||
            nextStatus === AppointmentStatus.NO_SHOW
        ) {
            setTerminalReasonFlow({
                appointment,
                mode: nextStatus === AppointmentStatus.CANCELLED ? 'cancellation' : 'no-show',
                error: null,
                isSubmitting: false,
            });
            return;
        }

        await persistStatusUpdate(appointment, { status: nextStatus });
    };

    const persistStatusUpdate = async (
        appointment: AppointmentListItem,
        payload: UpdateAppointmentStatusRequest
    ): Promise<string | null> => {
        setUpdatingAppointmentId(appointment.id);
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);

        try {
            const data = await updateAppointmentStatus(appointment.id, payload);

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
            return null;
        } catch (error) {
            if (isApiClientError(error)) {
                setStatusUpdateError({
                    message: error.message,
                    code: error.code,
                });
                showErrorToast(error.message);
                return error.message;
            }

            const fallbackMessage = 'Appointment status could not be updated. Please try again.';

            setStatusUpdateError({
                message: fallbackMessage,
                code: 'APPOINTMENT_STATUS_UPDATE_FAILED',
            });
            showErrorToast(fallbackMessage);
            return fallbackMessage;
        } finally {
            setUpdatingAppointmentId(null);
        }
    };

    const handleTerminalReasonSubmit = async (submission: TerminalAppointmentReasonSubmission) => {
        if (!terminalReasonFlow) {
            return;
        }

        const { appointment } = terminalReasonFlow;
        const payload: UpdateAppointmentStatusRequest =
            submission.mode === 'cancellation'
                ? {
                      status: AppointmentStatus.CANCELLED,
                      cancellationReason: submission.cancellationReason,
                      cancellationNote: submission.cancellationNote,
                  }
                : {
                      status: AppointmentStatus.NO_SHOW,
                      noShowReason: submission.noShowReason,
                      noShowNote: submission.noShowNote,
                  };

        setTerminalReasonFlow((current) =>
            current ? { ...current, error: null, isSubmitting: true } : current
        );

        const errorMessage = await persistStatusUpdate(appointment, payload);

        if (!errorMessage) {
            setTerminalReasonFlow(null);
        } else {
            setTerminalReasonFlow((current) =>
                current ? { ...current, error: errorMessage, isSubmitting: false } : current
            );
        }
    };

    const handleOpenReschedule = (appointment: AppointmentListItem) => {
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);
        setRescheduleFlow({
            appointment,
            destinationDate: isValidDateInputValue(selectedDate) ? selectedDate : '',
            selectedScheduledAt: '',
            availability: null,
            slotsState: emptyAvailableSlotsState,
            error: null,
            isSaving: false,
        });
    };

    const handleRescheduleDateChange = (value: string) => {
        setRescheduleFlow((currentState) =>
            currentState
                ? {
                      ...currentState,
                      destinationDate: value,
                      selectedScheduledAt: '',
                      availability: null,
                      slotsState: emptyAvailableSlotsState,
                      error: null,
                  }
                : currentState
        );
    };

    const handleRescheduleSlotChange = (value: string) => {
        setRescheduleFlow((currentState) =>
            currentState
                ? {
                      ...currentState,
                      selectedScheduledAt: value,
                      error: null,
                  }
                : currentState
        );
    };

    const refreshAppointmentsAfterReschedule = () => {
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
                }
            });
    };

    const handleConfirmReschedule = async () => {
        if (!rescheduleFlow?.selectedScheduledAt || !rescheduleFlow.availability) {
            return;
        }

        const appointmentId = rescheduleFlow.appointment.id;
        const selectedScheduledAt = rescheduleFlow.selectedScheduledAt;
        const currentScheduledAt = rescheduleFlow.availability.currentScheduledAt;

        setRescheduleFlow((currentState) =>
            currentState && currentState.appointment.id === appointmentId
                ? {
                      ...currentState,
                      error: null,
                      isSaving: true,
                  }
                : currentState
        );

        try {
            const data = await rescheduleAppointment(appointmentId, {
                scheduledAt: selectedScheduledAt,
                currentScheduledAt,
            });

            setAppointmentListState((currentState) => {
                const appointments = currentState.appointments.map((currentAppointment) =>
                    currentAppointment.id === data.appointment.id
                        ? data.appointment
                        : currentAppointment
                );

                return {
                    ...currentState,
                    appointments,
                };
            });
            setRescheduleFlow(null);
            setStatusUpdateMessage('Appointment rescheduled successfully.');
            showSuccessToast('Appointment rescheduled successfully.');
            refreshAppointmentsAfterReschedule();
        } catch (error) {
            if (isApiClientError(error)) {
                if (
                    error.code === 'APPOINTMENT_SLOT_CONFLICT' ||
                    error.code === 'APPOINTMENT_SLOT_UNAVAILABLE'
                ) {
                    setRescheduleFlow((currentState) =>
                        currentState && currentState.appointment.id === appointmentId
                            ? {
                                  ...currentState,
                                  selectedScheduledAt: '',
                                  error: {
                                      message: error.message,
                                      code: error.code,
                                  },
                                  isSaving: false,
                              }
                            : currentState
                    );
                    setRescheduleSlotsRefreshKey((currentValue) => currentValue + 1);
                    showErrorToast(error.message);
                    return;
                }

                if (error.code === 'APPOINTMENT_RESCHEDULE_NOT_ALLOWED') {
                    setRescheduleFlow(null);
                    setStatusUpdateError({
                        message: error.message,
                        code: error.code,
                    });
                    showErrorToast(error.message);
                    refreshAppointmentsAfterReschedule();
                    return;
                }

                setRescheduleFlow((currentState) =>
                    currentState && currentState.appointment.id === appointmentId
                        ? {
                              ...currentState,
                              error: {
                                  message: error.message,
                                  code: error.code,
                              },
                              isSaving: false,
                          }
                        : currentState
                );
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Appointment could not be rescheduled. Please try again.';

            setRescheduleFlow((currentState) =>
                currentState && currentState.appointment.id === appointmentId
                    ? {
                          ...currentState,
                          error: {
                              message: fallbackMessage,
                              code: 'APPOINTMENT_RESCHEDULE_FAILED',
                          },
                          isSaving: false,
                      }
                    : currentState
            );
            showErrorToast(fallbackMessage);
        }
    };

    const canUseForm =
        referenceState.status === 'success' &&
        referenceState.doctors.length > 0 &&
        referenceState.patients.length > 0;
    const hasAppointmentFilters = Boolean(
        (selectedDate && selectedDate !== getClinicDateInputValue(clinicTimezone)) ||
        selectedDoctorId ||
        selectedPatientId ||
        selectedStatus ||
        patientSearch
    );
    const onlyTodaySelected =
        selectedDate === getClinicDateInputValue(clinicTimezone) &&
        !selectedDoctorId &&
        !selectedPatientId &&
        !selectedStatus &&
        !patientSearch;
    const filteredAppointments = useMemo(() => {
        const searchTerm = patientSearch.trim().toLocaleLowerCase();
        return appointmentListState.appointments.filter(
            (appointment) =>
                !searchTerm ||
                appointment.patient.fullName.toLocaleLowerCase().includes(searchTerm) ||
                (appointment.patient.phone ?? '').includes(searchTerm)
        );
    }, [appointmentListState.appointments, patientSearch]);
    const pageSize = 15;
    const pageCount = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
    const safePage = Math.min(currentPage, pageCount);
    const visibleAppointments = filteredAppointments.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    );
    useEffect(() => {
        if (!navigationAppointmentId) return;
        const index = filteredAppointments.findIndex(
            (appointment) => appointment.id === navigationAppointmentId
        );
        if (index < 0) return;
        const targetPage = Math.floor(index / pageSize) + 1;
        if (targetPage !== currentPage) {
            setCurrentPage(targetPage);
            return;
        }
        const frame = window.requestAnimationFrame(() => {
            const row = document.getElementById(`appointment-${navigationAppointmentId}`);
            row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            row?.focus({ preventScroll: true });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [navigationAppointmentId, filteredAppointments, currentPage]);
    const hasAppointments =
        appointmentListState.status === 'success' && filteredAppointments.length > 0;
    const appointmentInsights = useMemo(
        () =>
            appointmentListState.status === 'success'
                ? buildAppointmentListInsights(filteredAppointments)
                : null,
        [appointmentListState.status, filteredAppointments]
    );

    return (
        <section className="space-y-5">
            <PageHeader
                actions={
                    <Button onClick={() => setIsBookingDialogOpen(true)}>Book appointment</Button>
                }
            />

            <FilterBar>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto_auto] xl:items-end">
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
                        Search patient
                        <input
                            type="search"
                            className={fieldControlClassName}
                            placeholder="Name or phone"
                            value={patientSearch}
                            onChange={(event) => {
                                setPatientSearch(event.target.value);
                                setCurrentPage(1);
                            }}
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
                            Clear filters
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

            {appointmentListState.status === 'success' && filteredAppointments.length === 0 ? (
                <EmptyState
                    title={
                        onlyTodaySelected
                            ? 'No appointments scheduled for today.'
                            : hasAppointmentFilters
                              ? 'No appointments match these filters.'
                              : 'No appointments scheduled yet.'
                    }
                    message={
                        onlyTodaySelected
                            ? 'Book an appointment to start today’s clinic schedule.'
                            : hasAppointmentFilters
                              ? 'Try a different date, patient search, doctor, patient, or status to find matching appointments.'
                              : 'Book the first appointment to start the schedule and queue.'
                    }
                    action={
                        <Button onClick={() => setIsBookingDialogOpen(true)}>
                            Book appointment
                        </Button>
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
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
                    <div
                        className="overflow-x-auto"
                        tabIndex={0}
                        aria-label="Appointments table, horizontally scrollable on small screens"
                    >
                        <table className="operational-table min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
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
                                {visibleAppointments.map((appointment) => {
                                    const statusActions =
                                        statusActionsByCurrentStatus[appointment.status];
                                    const isUpdating = updatingAppointmentId === appointment.id;
                                    const canReschedule = isAppointmentReschedulable(
                                        appointment.status
                                    );
                                    const terminalReason = getTerminalReasonDisplay(appointment);

                                    return (
                                        <tr
                                            id={`appointment-${appointment.id}`}
                                            key={appointment.id}
                                            tabIndex={
                                                navigationAppointmentId === appointment.id
                                                    ? -1
                                                    : undefined
                                            }
                                            className={`align-top transition hover:bg-slate-50/70 ${navigationAppointmentId === appointment.id ? 'bg-amber-50 ring-2 ring-inset ring-amber-400' : ''}`}
                                        >
                                            <td
                                                data-label="Time"
                                                className="min-w-36 px-3 py-3 text-slate-700"
                                            >
                                                <p className="font-semibold text-slate-900">
                                                    {formatClinicDateTime(
                                                        appointment.scheduledAt,
                                                        clinicTimezone
                                                    )}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatDuration(appointment.durationMinutes)}
                                                </p>
                                            </td>
                                            <td data-label="Patient" className="min-w-40 px-3 py-3">
                                                <p className="font-semibold text-slate-900">
                                                    {appointment.patient.fullName}
                                                </p>
                                                <p className="mt-1 text-slate-600">
                                                    {getOptionalText(appointment.patient.phone)}
                                                </p>
                                            </td>
                                            <td data-label="Doctor" className="min-w-40 px-3 py-3">
                                                <p className="font-semibold text-slate-900">
                                                    {appointment.doctor.fullName}
                                                </p>
                                                <p className="mt-1 text-slate-600">
                                                    {getOptionalText(
                                                        appointment.doctor.specialization
                                                    )}
                                                </p>
                                            </td>
                                            <td data-label="Status" className="min-w-28 px-3 py-3">
                                                <StatusBadge
                                                    kind="appointment"
                                                    status={appointment.status}
                                                />
                                                {appointment.queueEntry ? (
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Queue #{appointment.queueEntry.position}
                                                    </p>
                                                ) : null}
                                                <AppointmentArrivalSummary
                                                    appointment={appointment}
                                                    timezone={clinicTimezone}
                                                />
                                            </td>
                                            <td
                                                data-label="Notes"
                                                className="min-w-40 px-3 py-3 text-slate-700"
                                            >
                                                <p
                                                    className="max-w-48 truncate font-medium text-slate-900"
                                                    title={
                                                        appointment.reason?.trim() ||
                                                        'No reason added'
                                                    }
                                                >
                                                    {getOptionalText(appointment.reason)}
                                                </p>
                                                {appointment.notes ? (
                                                    <p
                                                        className="mt-1 max-w-48 truncate text-xs leading-5 text-slate-500"
                                                        title={appointment.notes}
                                                    >
                                                        Note: {appointment.notes}
                                                    </p>
                                                ) : null}
                                                {terminalReason ? (
                                                    <div className="mt-1 max-w-48">
                                                        <p
                                                            className="truncate text-xs font-semibold text-slate-700"
                                                            title={terminalReason.label}
                                                        >
                                                            {terminalReason.label}
                                                        </p>
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td data-label="Risk" className="min-w-40 px-3 py-3">
                                                <AppointmentRiskSummary
                                                    appointment={appointment}
                                                    onOpen={() =>
                                                        setRiskDetailsAppointment(appointment)
                                                    }
                                                />
                                            </td>
                                            <td data-label="Actions" className="min-w-60 px-3 py-3">
                                                <div className="flex max-w-64 flex-wrap items-center gap-2">
                                                    {statusActions[0] ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                void handleStatusUpdate(
                                                                    appointment,
                                                                    statusActions[0].status
                                                                )
                                                            }
                                                            disabled={isUpdating}
                                                            isLoading={isUpdating}
                                                            loadingText="Updating..."
                                                        >
                                                            {statusActions[0].label}
                                                        </Button>
                                                    ) : null}
                                                    <select
                                                        className={`${fieldControlClassName} min-h-10 w-36 text-xs`}
                                                        value=""
                                                        onChange={(event) => {
                                                            const action = event.target.value;
                                                            if (action === 'activity') {
                                                                setActivityAppointment(appointment);
                                                            } else if (action === 'reschedule') {
                                                                handleOpenReschedule(appointment);
                                                            } else if (action) {
                                                                void handleStatusUpdate(
                                                                    appointment,
                                                                    action as AppointmentStatus
                                                                );
                                                            }
                                                        }}
                                                        disabled={isUpdating}
                                                        aria-label={`More actions for ${appointment.patient.fullName}`}
                                                    >
                                                        <option value="">More actions</option>
                                                        <optgroup label="Appointment">
                                                            <option value="activity">
                                                                View activity
                                                            </option>
                                                            {canReschedule ? (
                                                                <option value="reschedule">
                                                                    Reschedule
                                                                </option>
                                                            ) : null}
                                                        </optgroup>
                                                        {statusActions.length > 1 ? (
                                                            <optgroup label="Update status">
                                                                {statusActions
                                                                    .slice(1)
                                                                    .map((action) => (
                                                                        <option
                                                                            key={action.status}
                                                                            value={action.status}
                                                                        >
                                                                            {action.label}
                                                                        </option>
                                                                    ))}
                                                            </optgroup>
                                                        ) : null}
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {pageCount > 1 ? (
                        <nav
                            className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-4 py-3 text-sm"
                            aria-label="Appointment pages"
                        >
                            <p className="text-app-muted">
                                Showing {(safePage - 1) * pageSize + 1}–
                                {Math.min(safePage * pageSize, filteredAppointments.length)} of{' '}
                                {filteredAppointments.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={safePage === 1}
                                    onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                                >
                                    Previous
                                </Button>
                                <span aria-current="page" className="px-2 font-semibold">
                                    {safePage} of {pageCount}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={safePage === pageCount}
                                    onClick={() =>
                                        setCurrentPage(Math.min(pageCount, safePage + 1))
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </nav>
                    ) : null}
                </div>
            ) : null}

            {isBookingDialogOpen ? (
                <AppointmentBookingDialog onClose={closeBookingDialog} isBusy={isSubmitting}>
                    <div id="book-appointment" className="space-y-5">
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

                        {referenceState.status === 'success' &&
                        referenceState.doctors.length === 0 ? (
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

                        {referenceState.status === 'success' &&
                        referenceState.patients.length === 0 ? (
                            <EmptyState
                                title="No active patients available."
                                message="Add a patient record before booking appointments for this clinic."
                                action={
                                    <Link
                                        to="/patients/new"
                                        state={{ returnToBooking: true, bookingDraft: values }}
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
                                    Scheduled for{' '}
                                    {formatClinicDateTime(successState.scheduledAt, clinicTimezone)}
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
                            availableSlots={availableSlotsState.slots}
                            isLoadingSlots={availableSlotsState.status === 'loading'}
                            slotsError={availableSlotsState.error?.message ?? null}
                            isSubmitting={isSubmitting}
                            isDisabled={!canUseForm}
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                            onAddPatient={() =>
                                navigate('/patients/new', {
                                    state: { returnToBooking: true, bookingDraft: values },
                                })
                            }
                        />
                    </div>
                </AppointmentBookingDialog>
            ) : null}

            {rescheduleFlow ? (
                <RescheduleAppointmentDialog
                    state={rescheduleFlow}
                    timezone={clinicTimezone}
                    onDateChange={handleRescheduleDateChange}
                    onSlotChange={handleRescheduleSlotChange}
                    onConfirm={handleConfirmReschedule}
                    onCancel={() => setRescheduleFlow(null)}
                />
            ) : null}

            {activityAppointment ? (
                <AppointmentActivityDialog
                    appointment={activityAppointment}
                    timezone={clinicTimezone}
                    onClose={() => setActivityAppointment(null)}
                />
            ) : null}

            {riskDetailsAppointment?.clinicId === clinicId ? (
                <NoShowRiskDetailsDialog
                    subject={{
                        id: riskDetailsAppointment.id,
                        patientName: riskDetailsAppointment.patient.fullName,
                        patientContact: [
                            riskDetailsAppointment.patient.phone,
                            riskDetailsAppointment.patient.email,
                        ]
                            .filter((value): value is string => Boolean(value?.trim()))
                            .join(' / '),
                        doctorName: riskDetailsAppointment.doctor.fullName,
                        doctorSpecialty: riskDetailsAppointment.doctor.specialization,
                        scheduledAt: riskDetailsAppointment.scheduledAt,
                        durationMinutes: riskDetailsAppointment.durationMinutes,
                        status: riskDetailsAppointment.status,
                        reason: riskDetailsAppointment.reason,
                        notes: riskDetailsAppointment.notes,
                        outcomeReasonLabel: getTerminalReasonDisplay(riskDetailsAppointment)?.label,
                        outcomeNote: getTerminalReasonDisplay(riskDetailsAppointment)?.note,
                        prediction: riskDetailsAppointment.noShowPrediction,
                        lifecycleSteps: appointmentLifecycleSteps,
                        currentLifecycleStepId:
                            riskDetailsAppointment.status === AppointmentStatus.CANCELLED ||
                            riskDetailsAppointment.status === AppointmentStatus.NO_SHOW
                                ? undefined
                                : riskDetailsAppointment.status === AppointmentStatus.SCHEDULED ||
                                    riskDetailsAppointment.status === AppointmentStatus.CONFIRMED ||
                                    riskDetailsAppointment.status === AppointmentStatus.ARRIVED ||
                                    riskDetailsAppointment.status === AppointmentStatus.IN_QUEUE ||
                                    riskDetailsAppointment.status === AppointmentStatus.CALLED ||
                                    riskDetailsAppointment.status === AppointmentStatus.COMPLETED
                                  ? riskDetailsAppointment.status
                                  : undefined,
                        lifecycleNote:
                            riskDetailsAppointment.status === AppointmentStatus.CANCELLED
                                ? 'Cancelled is a final appointment state.'
                                : riskDetailsAppointment.status === AppointmentStatus.NO_SHOW
                                  ? 'No Show is a final appointment state. Risk assistance never marks this automatically.'
                                  : undefined,
                    }}
                    timezone={clinicTimezone}
                    onClose={() => setRiskDetailsAppointment(null)}
                />
            ) : null}

            {terminalReasonFlow ? (
                <TerminalAppointmentReasonDialog
                    mode={terminalReasonFlow.mode}
                    patientName={terminalReasonFlow.appointment.patient.fullName}
                    doctorName={terminalReasonFlow.appointment.doctor.fullName}
                    scheduledAtLabel={formatClinicDateTime(
                        terminalReasonFlow.appointment.scheduledAt,
                        clinicTimezone
                    )}
                    isSubmitting={terminalReasonFlow.isSubmitting}
                    error={terminalReasonFlow.error}
                    onClose={() => setTerminalReasonFlow(null)}
                    onSubmit={(submission) => void handleTerminalReasonSubmit(submission)}
                />
            ) : null}
        </section>
    );
}

export default AppointmentsPage;
