import { describe, expect, it } from 'vitest';
import {
    buildCanonicalAddress,
    createGeocodingSourceHash,
    hasGeocodableAddress,
} from './location.js';

describe('structured address utilities', () => {
    it('builds a deterministic canonical address in field order', () => {
        expect(
            buildCanonicalAddress({
                addressLine1: ' B-42, Malviya Nagar ',
                addressLine2: 'Near Gaurav Tower',
                city: 'Jaipur',
                state: 'Rajasthan',
                pincode: '302017',
                country: 'India',
            })
        ).toBe('B-42, Malviya Nagar, Near Gaurav Tower, Jaipur, Rajasthan, 302017, India');
    });

    it('omits null, undefined, and blank components for partial addresses', () => {
        expect(
            buildCanonicalAddress({
                addressLine1: 'B-42, Malviya Nagar',
                addressLine2: null,
                city: ' Jaipur ',
                country: 'India',
            })
        ).toBe('B-42, Malviya Nagar, Jaipur, India');
    });

    it('only reports the minimum future-geocoding attempt shape', () => {
        expect(
            hasGeocodableAddress({
                addressLine1: 'B-42, Malviya Nagar',
                city: 'Jaipur',
                state: 'Rajasthan',
                country: 'India',
            })
        ).toBe(true);
        expect(
            hasGeocodableAddress({
                addressLine1: 'B-42, Malviya Nagar',
                city: 'Jaipur',
                state: null,
                country: 'India',
            })
        ).toBe(false);
    });

    it('creates a stable SHA-256 fingerprint from the normalized canonical address', () => {
        expect(
            createGeocodingSourceHash({
                addressLine1: ' B-42, Malviya Nagar ',
                city: ' Jaipur ',
                state: ' Rajasthan ',
                country: ' India ',
            })
        ).toBe(
            createGeocodingSourceHash({
                addressLine1: 'B-42, Malviya Nagar',
                city: 'Jaipur',
                state: 'Rajasthan',
                country: 'India',
            })
        );
    });
});
