import { GeoapifyError } from './geoapify.types.js';
import type { RoutingResult } from './geoapify.routing.types.js';

export const GEOAPIFY_ROUTING_URL = 'https://api.geoapify.com/v1/routing';
export const GEOAPIFY_ROUTING_TIMEOUT_MS = 5_000;
export const GEOAPIFY_ROUTING_MODE = 'drive';
export const GEOAPIFY_ROUTING_TYPE = 'balanced';
export const GEOAPIFY_ROUTING_TRAFFIC = 'free_flow';
export const GEOAPIFY_ROUTING_UNITS = 'metric';

type GeoapifyRoutingClientOptions = {
    apiKey?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
};

type RoutingCoordinates = {
    patientLatitude: number;
    patientLongitude: number;
    clinicLatitude: number;
    clinicLongitude: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
};

const isFiniteNonNegativeNumber = (value: unknown): value is number => {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
};

const isAbortError = (error: unknown): boolean => {
    return error instanceof Error && error.name === 'AbortError';
};

const parseResponse = (payload: unknown): RoutingResult => {
    if (!isRecord(payload) || !Array.isArray(payload.features)) {
        throw new GeoapifyError('INVALID_RESPONSE');
    }

    const firstFeature = payload.features[0];

    if (!isRecord(firstFeature) || !isRecord(firstFeature.properties)) {
        throw new GeoapifyError('NO_RESULTS');
    }

    const properties = firstFeature.properties;
    const distanceMeters = properties.distance;
    const travelTimeSeconds = properties.time;

    if (
        !isFiniteNonNegativeNumber(distanceMeters) ||
        !isFiniteNonNegativeNumber(travelTimeSeconds)
    ) {
        throw new GeoapifyError('INVALID_RESPONSE');
    }

    return {
        distanceMeters,
        travelTimeSeconds,
        provider: 'GEOAPIFY',
    };
};

const validateCoordinate = (value: number, minimum: number, maximum: number): void => {
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
        throw new GeoapifyError('INVALID_RESPONSE');
    }
};

export const createGeoapifyRoutingClient = ({
    apiKey,
    fetchImpl = fetch,
    timeoutMs = GEOAPIFY_ROUTING_TIMEOUT_MS,
}: GeoapifyRoutingClientOptions) => {
    const routePatientToClinic = async (
        coordinates: RoutingCoordinates
    ): Promise<RoutingResult> => {
        if (!apiKey) {
            throw new GeoapifyError('NOT_CONFIGURED');
        }

        validateCoordinate(coordinates.patientLatitude, -90, 90);
        validateCoordinate(coordinates.clinicLatitude, -90, 90);
        validateCoordinate(coordinates.patientLongitude, -180, 180);
        validateCoordinate(coordinates.clinicLongitude, -180, 180);

        const query = new URLSearchParams({
            waypoints: `${coordinates.patientLatitude},${coordinates.patientLongitude}|${coordinates.clinicLatitude},${coordinates.clinicLongitude}`,
            mode: GEOAPIFY_ROUTING_MODE,
            type: GEOAPIFY_ROUTING_TYPE,
            units: GEOAPIFY_ROUTING_UNITS,
            traffic: GEOAPIFY_ROUTING_TRAFFIC,
            format: 'json',
            apiKey,
        });
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), timeoutMs);

        try {
            const response = await fetchImpl(`${GEOAPIFY_ROUTING_URL}?${query}`, {
                method: 'GET',
                signal: abortController.signal,
            });

            if (response.status === 429) {
                throw new GeoapifyError('RATE_LIMITED');
            }

            if (!response.ok) {
                throw new GeoapifyError('UPSTREAM_ERROR');
            }

            let payload: unknown;

            try {
                payload = await response.json();
            } catch {
                throw new GeoapifyError('INVALID_RESPONSE');
            }

            return parseResponse(payload);
        } catch (error) {
            if (error instanceof GeoapifyError) {
                throw error;
            }

            if (isAbortError(error)) {
                throw new GeoapifyError('TIMEOUT');
            }

            throw new GeoapifyError('NETWORK_ERROR');
        } finally {
            clearTimeout(timeout);
        }
    };

    return { routePatientToClinic };
};
