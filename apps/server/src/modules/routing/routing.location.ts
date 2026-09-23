import { createHash, randomUUID } from 'node:crypto';
import {
    normalizeCoordinate,
    ROUTING_MODE,
    ROUTING_TRAFFIC_MODEL,
    ROUTING_TYPE,
} from './routing.constants.js';
import type { RoutingCoordinates } from './routing.types.js';

export const createRoutingSourceHash = (coordinates: RoutingCoordinates): string => {
    const fingerprint = [
        `patient:${normalizeCoordinate(coordinates.patientLatitude)},${normalizeCoordinate(coordinates.patientLongitude)}`,
        `clinic:${normalizeCoordinate(coordinates.clinicLatitude)},${normalizeCoordinate(coordinates.clinicLongitude)}`,
        `mode:${ROUTING_MODE}`,
        `type:${ROUTING_TYPE}`,
        `traffic:${ROUTING_TRAFFIC_MODEL}`,
    ].join('|');

    return createHash('sha256').update(fingerprint).digest('hex');
};

export const createRoutingAttemptId = (): string => randomUUID();

export const haveCoordinatesChanged = (
    previous: { latitude: number | null; longitude: number | null },
    next: { latitude: number | null; longitude: number | null }
): boolean => {
    if (previous.latitude === null || previous.longitude === null) {
        return next.latitude !== null || next.longitude !== null;
    }

    if (next.latitude === null || next.longitude === null) {
        return true;
    }

    return (
        normalizeCoordinate(previous.latitude) !== normalizeCoordinate(next.latitude) ||
        normalizeCoordinate(previous.longitude) !== normalizeCoordinate(next.longitude)
    );
};
