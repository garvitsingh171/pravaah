import type {
    ClinicIdParamsSchemaInput,
    CreateAppointmentSchemaInput,
    ListAppointmentsQuerySchemaInput,
    AppointmentIdParamsSchemaInput,
    UpdateAppointmentStatusSchemaInput,
} from './appointment.validation.js';

export type ClinicIdParams = ClinicIdParamsSchemaInput;

export type CreateAppointmentInput = CreateAppointmentSchemaInput;

export type ListAppointmentsQueryInput = ListAppointmentsQuerySchemaInput;

export type AppointmentIdParamsInput = AppointmentIdParamsSchemaInput;

export type UpdateAppointmentStatusInput = UpdateAppointmentStatusSchemaInput;
