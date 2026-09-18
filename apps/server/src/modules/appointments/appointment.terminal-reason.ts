import type {
    AppointmentCancellationReason,
    AppointmentNoShowReason,
} from '../../generated/prisma/client.js';

export const appointmentCancellationReasonValues = [
    'PATIENT_REQUEST',
    'PATIENT_ILLNESS',
    'PATIENT_EMERGENCY',
    'DOCTOR_UNAVAILABLE',
    'CLINIC_REQUEST',
    'SCHEDULING_CONFLICT',
    'TRANSPORTATION_ISSUE',
    'DUPLICATE_BOOKING',
    'RESCHEDULED_ELSEWHERE',
    'OTHER',
] as const satisfies readonly AppointmentCancellationReason[];

export const appointmentNoShowReasonValues = [
    'FORGOT_APPOINTMENT',
    'UNREACHABLE',
    'TRANSPORTATION_ISSUE',
    'PATIENT_EMERGENCY',
    'SCHEDULING_MISUNDERSTANDING',
    'NO_CONFIRMATION',
    'OTHER',
    'UNKNOWN',
] as const satisfies readonly AppointmentNoShowReason[];

export type AppointmentTerminalReasonContext =
    | {
          cancellationReason: AppointmentCancellationReason;
          cancellationNote: string | null;
      }
    | {
          noShowReason: AppointmentNoShowReason;
          noShowNote: string | null;
      }
    | null;
