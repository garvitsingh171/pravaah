import { env } from '../../config/env.js';
import {
    createGeoapifyClient,
} from '../../integrations/geoapify/geoapify.client.js';
import {
    GeoapifyError,
    type GeocodingResult,
    type GeoapifyFailureCategory,
} from '../../integrations/geoapify/geoapify.types.js';
import { buildCanonicalAddress, hasGeocodableAddress, type StructuredAddress } from '../../utils/location.js';

export type GeocodingAttempt =
    | { outcome: 'SUCCESS'; result: GeocodingResult }
    | { outcome: 'NOT_CONFIGURED' }
    | { outcome: 'FAILED'; category: Exclude<GeoapifyFailureCategory, 'NOT_CONFIGURED'> };

export const geocodingService = {
    isConfigured(): boolean {
        return Boolean(env.geoapifyApiKey);
    },

    async geocodeAddress(address: StructuredAddress): Promise<GeocodingAttempt> {
        if (!hasGeocodableAddress(address)) {
            throw new Error('Geocoding requires a complete address');
        }

        const apiKey = env.geoapifyApiKey;
        if (!apiKey) {
            return { outcome: 'NOT_CONFIGURED' };
        }

        try {
            const result = await createGeoapifyClient({
                apiKey,
            }).geocodeAddress({
                canonicalAddress: buildCanonicalAddress(address),
                country: address.country,
            });

            return { outcome: 'SUCCESS', result };
        } catch (error) {
            if (error instanceof GeoapifyError) {
                if (error.category === 'NOT_CONFIGURED') {
                    return { outcome: 'NOT_CONFIGURED' };
                }

                return { outcome: 'FAILED', category: error.category };
            }

            return { outcome: 'FAILED', category: 'NETWORK_ERROR' };
        }
    },
};
