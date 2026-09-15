import type {
    ClinicIdParamsSchemaInput,
    CreateAppointmentSchemaInput,
    ListAppointmentsQuerySchemaInput,
    AppointmentIdParamsSchemaInput,
    AvailableAppointmentSlotsQuerySchemaInput,
    UpdateAppointmentStatusSchemaInput,
} from './appointment.validation.js';

export type ClinicIdParams = ClinicIdParamsSchemaInput;

export type CreateAppointmentInput = CreateAppointmentSchemaInput;

export type ListAppointmentsQueryInput = ListAppointmentsQuerySchemaInput;

export type AvailableAppointmentSlotsQueryInput = AvailableAppointmentSlotsQuerySchemaInput;

export type AppointmentIdParamsInput = AppointmentIdParamsSchemaInput;

export type UpdateAppointmentStatusInput = UpdateAppointmentStatusSchemaInput;
