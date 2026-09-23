import { env } from '../../config/env.js';
import { createGeoapifyRoutingClient } from '../../integrations/geoapify/geoapify.routing.client.js';
import { GeoapifyError } from '../../integrations/geoapify/geoapify.types.js';
import { AppError } from '../../utils/AppError.js';
import {
    isValidLatitude,
    isValidLongitude,
    toDistanceKm,
    toTravelTimeMinutes,
} from './routing.constants.js';
import { createRoutingAttemptId, createRoutingSourceHash } from './routing.location.js';
import { routingRepository } from './routing.repository.js';
import type { RoutingAttemptOutcome, RoutingCoordinates } from './routing.types.js';

type CalculateRouteOptions = {
    clinicId: string;
    patientId: string;
    force?: boolean;
    explicit?: boolean;
};

const coordinatesFor = (context: {
    patient: { latitude: number | null; longitude: number | null; geocodingStatus: string };
    clinic: { latitude: number | null; longitude: number | null; geocodingStatus: string };
}): RoutingCoordinates | null => {
    if (
        context.patient.geocodingStatus !== 'GEOCODED' ||
        context.clinic.geocodingStatus !== 'GEOCODED' ||
        !isValidLatitude(context.patient.latitude) ||
        !isValidLongitude(context.patient.longitude) ||
        !isValidLatitude(context.clinic.latitude) ||
        !isValidLongitude(context.clinic.longitude)
    ) {
        return null;
    }

    return {
        patientLatitude: context.patient.latitude,
        patientLongitude: context.patient.longitude,
        clinicLatitude: context.clinic.latitude,
        clinicLongitude: context.clinic.longitude,
    };
};

const throwForProviderFailure = (error: GeoapifyError): never => {
    if (error.category === 'NOT_CONFIGURED') {
        throw new AppError(
            503,
            'GEOAPIFY_NOT_CONFIGURED',
            'Travel estimation is not configured. Please contact an administrator.'
        );
    }

    throw new AppError(
        502,
        'ROUTING_PROVIDER_FAILED',
        'Travel estimation is temporarily unavailable. Please try again later.'
    );
};

export const routingService = {
    isConfigured(): boolean {
        return Boolean(env.geoapifyApiKey);
    },

    async calculatePatientClinicRoute({
        clinicId,
        patientId,
        force = false,
        explicit = false,
    }: CalculateRouteOptions): Promise<RoutingAttemptOutcome> {
        const context = await routingRepository.findRoutingContext(patientId, clinicId);

        if (!context) {
            throw new AppError(
                403,
                'PATIENT_NOT_LINKED_TO_CLINIC',
                'Patient is not linked to this clinic'
            );
        }

        const coordinates = coordinatesFor(context);

        if (!coordinates) {
            if (explicit) {
                throw new AppError(
                    422,
                    'ROUTING_COORDINATES_UNAVAILABLE',
                    'Current patient and clinic locations are required before travel can be calculated.'
                );
            }

            return { outcome: 'NOT_CALCULATED', reason: 'COORDINATES_UNAVAILABLE' };
        }

        const sourceHash = createRoutingSourceHash(coordinates);

        if (
            !force &&
            context.routingStatus === 'CALCULATED' &&
            context.routingSourceHash === sourceHash &&
            context.distanceFromClinicKm !== null &&
            context.estimatedTravelTimeMinutes !== null
        ) {
            return {
                outcome: 'CALCULATED',
                distanceKm: String(context.distanceFromClinicKm),
                estimatedTravelTimeMinutes: context.estimatedTravelTimeMinutes,
            };
        }

        if (!env.geoapifyApiKey) {
            if (explicit) {
                throw new AppError(
                    503,
                    'GEOAPIFY_NOT_CONFIGURED',
                    'Travel estimation is not configured. Please contact an administrator.'
                );
            }

            return { outcome: 'NOT_CALCULATED', reason: 'NOT_CONFIGURED' };
        }

        const attemptId = createRoutingAttemptId();
        await routingRepository.beginRoutingAttempt(patientId, clinicId, sourceHash, attemptId);

        try {
            const result = await createGeoapifyRoutingClient({
                apiKey: env.geoapifyApiKey,
            }).routePatientToClinic(coordinates);
            const distanceKm = toDistanceKm(result.distanceMeters);
            const estimatedTravelTimeMinutes = toTravelTimeMinutes(result.travelTimeSeconds);

            // PatientClinic uses Decimal(6, 2) and a PostgreSQL Int. Reject a
            // provider value that cannot be represented before Prisma sees it.
            if (
                Number(distanceKm) > 9999.99 ||
                !Number.isSafeInteger(estimatedTravelTimeMinutes) ||
                estimatedTravelTimeMinutes > 2_147_483_647
            ) {
                throw new GeoapifyError('INVALID_RESPONSE');
            }

            const persisted = await routingRepository.saveRoutingResultIfCurrent(
                patientId,
                clinicId,
                sourceHash,
                attemptId,
                {
                    ...result,
                    distanceKm,
                    estimatedTravelTimeMinutes,
                }
            );

            if (persisted.count === 0) {
                return { outcome: 'FAILED', category: 'STALE_ATTEMPT' };
            }

            return {
                outcome: 'CALCULATED',
                distanceKm,
                estimatedTravelTimeMinutes,
            };
        } catch (error) {
            if (!(error instanceof GeoapifyError)) {
                throw error;
            }

            await routingRepository.markRoutingFailedIfCurrent(
                patientId,
                clinicId,
                sourceHash,
                attemptId
            );

            if (explicit) {
                throwForProviderFailure(error);
            }

            console.warn(
                `[routing] entityType=PATIENT_CLINIC patientId=${patientId} clinicId=${clinicId} outcome=${error.category}`
            );

            return { outcome: 'FAILED', category: error.category };
        }
    },
};
