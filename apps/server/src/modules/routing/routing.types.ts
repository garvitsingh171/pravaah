import type { RoutingResult } from '../../integrations/geoapify/geoapify.routing.types.js';

export type RoutingCoordinates = {
    patientLatitude: number;
    patientLongitude: number;
    clinicLatitude: number;
    clinicLongitude: number;
};

export type RoutingAttemptOutcome =
    | { outcome: 'CALCULATED'; distanceKm: string; estimatedTravelTimeMinutes: number }
    | { outcome: 'NOT_CALCULATED'; reason: 'NOT_CONFIGURED' | 'COORDINATES_UNAVAILABLE' }
    | { outcome: 'FAILED'; category: string };

export type PersistableRoutingResult = RoutingResult & {
    distanceKm: string;
    estimatedTravelTimeMinutes: number;
};
