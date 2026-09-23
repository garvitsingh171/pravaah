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
import { predictNoShowRisk } from '../predictions/prediction.service.js';
import { haveCoordinatesChanged } from '../routing/routing.location.js';
import { routingRepository } from '../routing/routing.repository.js';
import { clinicRepository } from './clinic.repository.js';
import type { ProvisionSampleDataServiceInput, UpdateClinicInput } from './clinic.types.js';

const toClinicAddress = (clinic: StructuredAddress): StructuredAddress => ({
    addressLine1: clinic.addressLine1,
    addressLine2: clinic.addressLine2,
    city: clinic.city,
    state: clinic.state,
    country: clinic.country,
    pincode: clinic.pincode,
});

const applyClinicGeocodingAttempt = async (
    clinicId: string,
    sourceHash: string,
    attemptId: string,
    attempt: GeocodingAttempt
): Promise<void> => {
    if (attempt.outcome === 'SUCCESS') {
        await clinicRepository.saveGeocodingResultIfCurrent(
            clinicId,
            sourceHash,
            attemptId,
            attempt.result
        );
        return;
    }

    if (attempt.outcome === 'FAILED') {
        await clinicRepository.markGeocodingFailedIfCurrent(clinicId, sourceHash, attemptId);
    }
};

export const clinicService = {
    async getClinicSettings(clinicId: string) {
        const clinic = await clinicRepository.findSettingsById(clinicId);

        if (!clinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        return clinic;
    },

    async updateClinic(clinicId: string, input: UpdateClinicInput) {
        const existingClinic = await clinicRepository.findById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const pincodeError = getIndiaPincodeValidationMessage(
            input.country !== undefined ? input.country : existingClinic.country,
            input.pincode !== undefined ? input.pincode : existingClinic.pincode
        );

        if (pincodeError) {
            throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request data.', [
                {
                    field: 'body.pincode',
                    message: pincodeError,
                },
            ]);
        }

        const existingAddress = toClinicAddress(existingClinic);
        const nextAddress = toClinicAddress({
            ...existingAddress,
            ...input,
        });
        const addressChanged =
            buildCanonicalAddress(existingAddress) !== buildCanonicalAddress(nextAddress);
        const sourceHash = addressChanged ? createGeocodingSourceHash(nextAddress) : undefined;
        const attemptId = sourceHash ? createGeocodingAttemptId() : undefined;

        const clinic = sourceHash
            ? await clinicRepository.update(clinicId, input, { sourceHash, attemptId: attemptId! })
            : await clinicRepository.update(clinicId, input);

        if (!addressChanged || !sourceHash) {
            return clinic;
        }

        if (!hasGeocodableAddress(nextAddress)) {
            try {
                await routingRepository.invalidateCalculatedRoutesForClinic(clinicId);
            } catch {
                // The clinic update already committed; stale route data must not turn it into a 500.
                console.warn(
                    `[routing] entityType=CLINIC entityId=${clinicId} outcome=INVALIDATION_FAILED`
                );
            }
            return clinic;
        }

        try {
            const attempt = await geocodingService.geocodeAddress(nextAddress);
            await applyClinicGeocodingAttempt(clinicId, sourceHash, attemptId!, attempt);

            const updatedClinic = (await clinicRepository.findSettingsById(clinicId)) ?? clinic;

            if (existingClinic.latitude != null && existingClinic.longitude != null) {
                if (
                    attempt.outcome !== 'SUCCESS' ||
                    haveCoordinatesChanged(
                        {
                            latitude: existingClinic.latitude,
                            longitude: existingClinic.longitude,
                        },
                        {
                            latitude:
                                updatedClinic.latitude ??
                                (attempt.outcome === 'SUCCESS' ? attempt.result.latitude : null),
                            longitude:
                                updatedClinic.longitude ??
                                (attempt.outcome === 'SUCCESS' ? attempt.result.longitude : null),
                        }
                    )
                ) {
                    await routingRepository.invalidateCalculatedRoutesForClinic(clinicId);
                }
            }

            return updatedClinic;
        } catch {
            // The clinic write has committed; derived geocoding must not undo it.
            console.warn(
                `[geocoding] entityType=CLINIC entityId=${clinicId} outcome=PERSISTENCE_FAILED`
            );
            return clinic;
        }
    },

    async retryGeocoding(clinicId: string) {
        const clinic = await clinicRepository.findById(clinicId);

        if (!clinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const address = toClinicAddress(clinic);

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
        const previousCoordinates = {
            latitude: clinic.latitude,
            longitude: clinic.longitude,
        };
        await clinicRepository.prepareGeocoding(clinicId, sourceHash, attemptId);

        const attempt = await geocodingService.geocodeAddress(address);

        if (attempt.outcome === 'NOT_CONFIGURED') {
            throw new AppError(
                503,
                'GEOAPIFY_NOT_CONFIGURED',
                'Location lookup is not configured. Please contact an administrator.'
            );
        }

        await applyClinicGeocodingAttempt(clinicId, sourceHash, attemptId, attempt);

        if (attempt.outcome === 'FAILED') {
            if (previousCoordinates.latitude != null && previousCoordinates.longitude != null) {
                await routingRepository.invalidateCalculatedRoutesForClinic(clinicId);
            }
            throw new AppError(
                502,
                'GEOAPIFY_GEOCODING_FAILED',
                'Location lookup failed. Please try again later.'
            );
        }

        if (
            attempt.outcome === 'SUCCESS' &&
            previousCoordinates.latitude != null &&
            previousCoordinates.longitude != null &&
            haveCoordinatesChanged(previousCoordinates, {
                latitude: attempt.result.latitude,
                longitude: attempt.result.longitude,
            })
        ) {
            await routingRepository.invalidateCalculatedRoutesForClinic(clinicId);
        }

        return clinicRepository.findSettingsById(clinicId);
    },

    async provisionSampleData({ clinicId, user }: ProvisionSampleDataServiceInput) {
        if (!user) {
            throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
        }

        const result = await clinicRepository.provisionSampleData(
            {
                clinicId,
                createdByUserId: user.id,
            },
            predictNoShowRisk
        );

        if (result.outcome === 'CLINIC_NOT_FOUND') {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (result.outcome === 'INVALID_CLINIC_TIMEZONE') {
            throw new AppError(
                422,
                'INVALID_CLINIC_TIMEZONE',
                'Clinic timezone is invalid. Update clinic settings before provisioning sample data.'
            );
        }

        return {
            outcome: result.outcome,
            summary: {
                ...result.summary,
                today: result.today,
            },
        };
    },
};
