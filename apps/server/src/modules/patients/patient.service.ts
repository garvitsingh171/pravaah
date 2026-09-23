import { AppError } from '../../utils/AppError.js';
import {
    buildCanonicalAddress,
    createGeocodingAttemptId,
    createGeocodingSourceHash,
    hasGeocodableAddress,
    type StructuredAddress,
} from '../../utils/location.js';
import { getIndiaPincodeValidationMessage } from '../../utils/locationValidation.js';
import { geocodingService, type GeocodingAttempt } from '../geocoding/geocoding.service.js';
import { routingService } from '../routing/routing.service.js';
import { haveCoordinatesChanged } from '../routing/routing.location.js';
import { routingRepository } from '../routing/routing.repository.js';
import { patientRepository } from './patient.repository.js';
import type {
    CreatePatientInput,
    ListPatientsQueryInput,
    UpdatePatientInput,
} from './patient.types.js';

const toPatientAddress = (patient: StructuredAddress): StructuredAddress => ({
    addressLine1: patient.addressLine1,
    addressLine2: patient.addressLine2,
    city: patient.city,
    state: patient.state,
    country: patient.country,
    pincode: patient.pincode,
});

const applyPatientGeocodingAttempt = async (
    patientId: string,
    sourceHash: string,
    attemptId: string,
    attempt: GeocodingAttempt
): Promise<void> => {
    if (attempt.outcome === 'SUCCESS') {
        await patientRepository.saveGeocodingResultIfCurrent(
            patientId,
            sourceHash,
            attemptId,
            attempt.result
        );
        return;
    }

    if (attempt.outcome === 'FAILED') {
        await patientRepository.markGeocodingFailedIfCurrent(patientId, sourceHash, attemptId);
    }
};

const hasCurrentCoordinates = (entity: {
    latitude?: number | null;
    longitude?: number | null;
    geocodingStatus?: string;
}): boolean => {
    return (
        entity.geocodingStatus === 'GEOCODED' &&
        entity.latitude !== null &&
        entity.latitude !== undefined &&
        entity.longitude !== null &&
        entity.longitude !== undefined
    );
};

const calculateRouteForCurrentClinic = async (
    clinicId: string,
    patientId: string,
    clinic: { latitude?: number | null; longitude?: number | null; geocodingStatus?: string },
    patient: { latitude?: number | null; longitude?: number | null; geocodingStatus?: string }
): Promise<void> => {
    if (!hasCurrentCoordinates(clinic) || !hasCurrentCoordinates(patient)) {
        return;
    }

    try {
        await routingService.calculatePatientClinicRoute({ clinicId, patientId });
    } catch (error) {
        // The Patient/PatientClinic write and geocoding write have already
        // committed. Routing is derived enrichment and must not turn a
        // successful core workflow into a 500 response.
        console.warn(
            `[routing] entityType=PATIENT_CLINIC patientId=${patientId} clinicId=${clinicId} outcome=PERSISTENCE_FAILED`,
            error
        );
    }
};

export const patientService = {
    async createPatient(clinicId: string, input: CreatePatientInput) {
        const existingClinic = await patientRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const address = toPatientAddress(input);
        const sourceHash = createGeocodingSourceHash(address);
        const attemptId = createGeocodingAttemptId();
        const patient = await patientRepository.createPatientWithClinicLink(clinicId, input, {
            sourceHash,
            attemptId,
        });

        if (!hasGeocodableAddress(address)) {
            return patient;
        }

        try {
            const attempt = await geocodingService.geocodeAddress(address);
            await applyPatientGeocodingAttempt(patient.id, sourceHash, attemptId, attempt);

            if (attempt.outcome === 'SUCCESS') {
                const currentPatient =
                    (await patientRepository.findPatientById(patient.id)) ?? patient;
                await calculateRouteForCurrentClinic(
                    clinicId,
                    patient.id,
                    existingClinic,
                    currentPatient
                );
            }

            return (await patientRepository.findPatientById(patient.id)) ?? patient;
        } catch {
            // The Patient and PatientClinic transaction already committed.
            console.warn(
                `[geocoding] entityType=PATIENT entityId=${patient.id} outcome=PERSISTENCE_FAILED`
            );
            return patient;
        }
    },

    async updatePatient(clinicId: string, patientId: string, input: UpdatePatientInput) {
        const existingClinic = await patientRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const existingPatient = await patientRepository.findPatientById(patientId);

        if (!existingPatient) {
            throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
        }

        const patientClinicLink = await patientRepository.findPatientClinicLink(
            patientId,
            clinicId
        );

        if (!patientClinicLink) {
            throw new AppError(
                403,
                'PATIENT_NOT_LINKED_TO_CLINIC',
                'Patient is not linked to this clinic'
            );
        }

        const pincodeError = getIndiaPincodeValidationMessage(
            input.country !== undefined ? input.country : existingPatient.country,
            input.pincode !== undefined ? input.pincode : existingPatient.pincode
        );

        if (pincodeError) {
            throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request data.', [
                {
                    field: 'body.pincode',
                    message: pincodeError,
                },
            ]);
        }

        const existingAddress = toPatientAddress(existingPatient);
        const nextAddress = toPatientAddress({
            ...existingAddress,
            ...input,
        });
        const addressChanged =
            buildCanonicalAddress(existingAddress) !== buildCanonicalAddress(nextAddress);
        const sourceHash = addressChanged ? createGeocodingSourceHash(nextAddress) : undefined;
        const attemptId = sourceHash ? createGeocodingAttemptId() : undefined;
        const patient = sourceHash
            ? await patientRepository.updatePatientWithClinicDetails(clinicId, patientId, input, {
                  sourceHash,
                  attemptId: attemptId!,
              })
            : await patientRepository.updatePatientWithClinicDetails(clinicId, patientId, input);

        if (!addressChanged || !sourceHash) {
            return patient;
        }

        if (!hasGeocodableAddress(nextAddress)) {
            try {
                await routingRepository.invalidateCalculatedRoutesForPatient(patientId);
            } catch {
                // The patient update already committed; stale route data must not turn it into a 500.
                console.warn(
                    `[routing] entityType=PATIENT entityId=${patientId} outcome=INVALIDATION_FAILED`
                );
            }
            return patient;
        }

        try {
            const attempt = await geocodingService.geocodeAddress(nextAddress);
            await applyPatientGeocodingAttempt(patientId, sourceHash, attemptId!, attempt);

            const currentPatient = await patientRepository.findPatientById(patientId);

            if (!currentPatient) {
                return patient;
            }

            if (attempt.outcome === 'SUCCESS') {
                if (
                    haveCoordinatesChanged(
                        {
                            latitude: existingPatient.latitude ?? null,
                            longitude: existingPatient.longitude ?? null,
                        },
                        {
                            latitude: currentPatient.latitude ?? null,
                            longitude: currentPatient.longitude ?? null,
                        }
                    )
                ) {
                    await routingRepository.invalidateCalculatedRoutesForPatient(patientId);
                }

                await calculateRouteForCurrentClinic(
                    clinicId,
                    patientId,
                    existingClinic,
                    currentPatient
                );
            } else {
                await routingRepository.invalidateCalculatedRoutesForPatient(patientId);
            }

            return currentPatient;
        } catch {
            // The Patient update transaction already committed.
            console.warn(
                `[geocoding] entityType=PATIENT entityId=${patientId} outcome=PERSISTENCE_FAILED`
            );
            return patient;
        }
    },

    async retryGeocoding(clinicId: string, patientId: string) {
        const existingClinic = await patientRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const patient = await patientRepository.findPatientById(patientId);

        if (!patient) {
            throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
        }

        const patientClinicLink = await patientRepository.findPatientClinicLink(
            patientId,
            clinicId
        );

        if (!patientClinicLink) {
            throw new AppError(
                403,
                'PATIENT_NOT_LINKED_TO_CLINIC',
                'Patient is not linked to this clinic'
            );
        }

        const address = toPatientAddress(patient);

        if (!hasGeocodableAddress(address)) {
            throw new AppError(
                422,
                'LOCATION_ADDRESS_INCOMPLETE',
                'A complete address line, city, state, and country are required for location lookup.'
            );
        }

        if (!geocodingService.isConfigured()) {
            throw new AppError(
                503,
                'GEOAPIFY_NOT_CONFIGURED',
                'Location lookup is not configured. Please contact an administrator.'
            );
        }

        const sourceHash = createGeocodingSourceHash(address);
        const attemptId = createGeocodingAttemptId();
        await patientRepository.prepareGeocoding(patientId, sourceHash, attemptId);

        const attempt = await geocodingService.geocodeAddress(address);

        if (attempt.outcome === 'NOT_CONFIGURED') {
            throw new AppError(
                503,
                'GEOAPIFY_NOT_CONFIGURED',
                'Location lookup is not configured. Please contact an administrator.'
            );
        }

        await applyPatientGeocodingAttempt(patientId, sourceHash, attemptId, attempt);

        if (attempt.outcome === 'FAILED') {
            await routingRepository.invalidateCalculatedRoutesForPatient(patientId);
            throw new AppError(
                502,
                'GEOAPIFY_GEOCODING_FAILED',
                'Location lookup failed. Please try again later.'
            );
        }

        if (attempt.outcome === 'SUCCESS') {
            const currentPatient = (await patientRepository.findPatientById(patientId)) ?? patient;
            if (
                haveCoordinatesChanged(
                    {
                        latitude: patient.latitude ?? null,
                        longitude: patient.longitude ?? null,
                    },
                    {
                        latitude: currentPatient.latitude ?? null,
                        longitude: currentPatient.longitude ?? null,
                    }
                )
            ) {
                await routingRepository.invalidateCalculatedRoutesForPatient(patientId);
            }
            await calculateRouteForCurrentClinic(
                clinicId,
                patientId,
                existingClinic,
                currentPatient
            );

            if (patientRepository.findPatientByIdWithClinic) {
                return patientRepository.findPatientByIdWithClinic(patientId, clinicId);
            }
        }

        return patientRepository.findPatientById(patientId);
    },

    async retryRouting(clinicId: string, patientId: string) {
        const existingClinic = await patientRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const patient = await patientRepository.findPatientById(patientId);

        if (!patient) {
            throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
        }

        const patientClinicLink = await patientRepository.findPatientClinicLink(
            patientId,
            clinicId
        );

        if (!patientClinicLink) {
            throw new AppError(
                403,
                'PATIENT_NOT_LINKED_TO_CLINIC',
                'Patient is not linked to this clinic'
            );
        }

        await routingService.calculatePatientClinicRoute({
            clinicId,
            patientId,
            force: true,
            explicit: true,
        });

        if (patientRepository.findPatientByIdWithClinic) {
            return patientRepository.findPatientByIdWithClinic(patientId, clinicId);
        }

        return patientRepository.findPatientById(patientId);
    },

    async listPatientsByClinic(clinicId: string, query: ListPatientsQueryInput) {
        const existingClinic = await patientRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        return patientRepository.listPatientsByClinic(clinicId, query);
    },
};
