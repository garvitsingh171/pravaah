import {
    GEOAPIFY_ROUTING_MODE,
    GEOAPIFY_ROUTING_TRAFFIC,
    GEOAPIFY_ROUTING_TYPE,
    GEOAPIFY_ROUTING_UNITS,
} from '../../integrations/geoapify/geoapify.routing.client.js';

export const ROUTING_MODE = GEOAPIFY_ROUTING_MODE;
export const ROUTING_TYPE = GEOAPIFY_ROUTING_TYPE;
export const ROUTING_TRAFFIC_MODEL = GEOAPIFY_ROUTING_TRAFFIC;
export const ROUTING_UNITS = GEOAPIFY_ROUTING_UNITS;

export const normalizeCoordinate = (value: number): string => value.toFixed(6);

export const isValidLatitude = (value: number | null | undefined): value is number => {
    return (
        value !== null &&
        value !== undefined &&
        Number.isFinite(value) &&
        value >= -90 &&
        value <= 90
    );
};

export const isValidLongitude = (value: number | null | undefined): value is number => {
    return (
        value !== null &&
        value !== undefined &&
        Number.isFinite(value) &&
        value >= -180 &&
        value <= 180
    );
};

export const toDistanceKm = (distanceMeters: number): string => {
    return (distanceMeters / 1000).toFixed(2);
};

export const toTravelTimeMinutes = (travelTimeSeconds: number): number => {
    return Math.ceil(travelTimeSeconds / 60);
};
