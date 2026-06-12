import type {
    CreatePatientSchemaInput,
    ListPatientsQuerySchemaInput,
    UpdatePatientSchemaInput,
} from './patient.validation.js';

export type CreatePatientInput = CreatePatientSchemaInput;

export type UpdatePatientInput = UpdatePatientSchemaInput;

export type ListPatientsQueryInput = ListPatientsQuerySchemaInput;
