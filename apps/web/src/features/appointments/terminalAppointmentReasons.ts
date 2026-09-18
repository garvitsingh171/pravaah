import {
    AppointmentCancellationReason,
    AppointmentNoShowReason,
    AppointmentStatus,
    type AppointmentCancellationReason as AppointmentCancellationReasonType,
    type AppointmentNoShowReason as AppointmentNoShowReasonType,
    type AppointmentStatus as AppointmentStatusType,
} from '../../types';

export const cancellationReasonLabels: Record<AppointmentCancellationReasonType, string> = {
    PATIENT_REQUEST: 'Patient requested cancellation',
    PATIENT_ILLNESS: 'Patient illness',
    PATIENT_EMERGENCY: 'Patient emergency',
    DOCTOR_UNAVAILABLE: 'Doctor unavailable',
    CLINIC_REQUEST: 'Clinic requested cancellation',
    SCHEDULING_CONFLICT: 'Scheduling conflict',
    TRANSPORTATION_ISSUE: 'Transportation issue',
    DUPLICATE_BOOKING: 'Duplicate booking',
    RESCHEDULED_ELSEWHERE: 'Rescheduled elsewhere',
    OTHER: 'Other',
};

export const noShowReasonLabels: Record<AppointmentNoShowReasonType, string> = {
    FORGOT_APPOINTMENT: 'Patient forgot appointment',
    UNREACHABLE: 'Patient unreachable',
    TRANSPORTATION_ISSUE: 'Transportation issue',
    PATIENT_EMERGENCY: 'Patient emergency',
    SCHEDULING_MISUNDERSTANDING: 'Scheduling misunderstanding',
    NO_CONFIRMATION: 'No confirmation / confirmation issue',
    OTHER: 'Other',
    UNKNOWN: 'Reason unknown',
};

export const cancellationReasonOptions = Object.values(AppointmentCancellationReason).map(
    (value) => ({ value, label: cancellationReasonLabels[value] })
);

export const noShowReasonOptions = Object.values(AppointmentNoShowReason).map((value) => ({
    value,
    label: noShowReasonLabels[value],
}));

export const getTerminalReasonDisplay = (appointment: {
    status: AppointmentStatusType;
    cancellationReason?: AppointmentCancellationReasonType | null;
    cancellationNote?: string | null;
    noShowReason?: AppointmentNoShowReasonType | null;
    noShowNote?: string | null;
}): { label: string; note: string | null } | null => {
    if (appointment.status === AppointmentStatus.CANCELLED) {
        return {
            label: appointment.cancellationReason
                ? cancellationReasonLabels[appointment.cancellationReason]
                : 'Reason not recorded',
            note: appointment.cancellationNote?.trim() || null,
        };
    }

    if (appointment.status === AppointmentStatus.NO_SHOW) {
        return {
            label: appointment.noShowReason
                ? noShowReasonLabels[appointment.noShowReason]
                : 'Reason not recorded',
            note: appointment.noShowNote?.trim() || null,
        };
    }

    return null;
};
