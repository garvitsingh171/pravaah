import { describe, expect, it } from 'vitest';
import { toDistanceKm, toTravelTimeMinutes } from './routing.constants.js';
import { createRoutingSourceHash } from './routing.location.js';

const coordinates = {
    patientLatitude: 26.912434,
    patientLongitude: 75.787271,
    clinicLatitude: 26.85305,
    clinicLongitude: 75.80573,
};

describe('routing coordinate fingerprint and conversion', () => {
    it('normalizes equivalent coordinates to the same source hash', () => {
        expect(
            createRoutingSourceHash({
                ...coordinates,
                patientLatitude: 26.9124340001,
            })
        ).toBe(createRoutingSourceHash(coordinates));
    });

    it('changes the source hash when a routing input changes', () => {
        expect(
            createRoutingSourceHash({
                ...coordinates,
                clinicLongitude: coordinates.clinicLongitude + 0.01,
            })
        ).not.toBe(createRoutingSourceHash(coordinates));
    });

    it('converts provider units deterministically', () => {
        expect(toDistanceKm(8437)).toBe('8.44');
        expect(toTravelTimeMinutes(601)).toBe(11);
        expect(toTravelTimeMinutes(0)).toBe(0);
    });
});
