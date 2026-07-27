import type { CreateClinicSchemaInput, UpdateClinicSchemaInput } from './clinic.validation.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

export type CreateClinicInput = CreateClinicSchemaInput;

export type UpdateClinicInput = UpdateClinicSchemaInput;

export type SampleDataProvisioningSummary = {
    doctors: number;
    patients: number;
    appointments: number;
    noShowPredictions: number;
    queueEntries: number;
    todayQueueEntries: number;
    today: string;
};

export type SampleDataProvisioningRecordCounts = Omit<SampleDataProvisioningSummary, 'today'>;

export type SampleDataProvisioningOutcome = 'CREATED' | 'ALREADY_PROVISIONED';

export type SampleDataProvisioningResult = {
    outcome: SampleDataProvisioningOutcome;
    summary: SampleDataProvisioningSummary;
};

export type ProvisionSampleDataInput = {
    clinicId: string;
    createdByUserId: string;
};

export type ProvisionSampleDataServiceInput = {
    clinicId: string;
    user: AuthenticatedUser | undefined;
};
