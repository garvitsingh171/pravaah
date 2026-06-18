import type {
    ClinicIdParamsSchemaInput,
    CreateAppointmentSchemaInput,
    ListAppointmentsQuerySchemaInput,
    AppointmentIdParamsSchemaInput,
    UpdateAppointmentStatusSchemaInput,
} from './appointment.validation.js';
import type { NoShowRiskLevel } from '../predictions/prediction.types.js';

export type ClinicIdParams = ClinicIdParamsSchemaInput;

export type CreateAppointmentInput = CreateAppointmentSchemaInput;

export type ListAppointmentsQueryInput = ListAppointmentsQuerySchemaInput;

export type AppointmentIdParamsInput = AppointmentIdParamsSchemaInput;

export type UpdateAppointmentStatusInput = UpdateAppointmentStatusSchemaInput;

export type AppointmentBookingNoShowPrediction = {
    riskLevel: NoShowRiskLevel;
    reasons: string[];
};
