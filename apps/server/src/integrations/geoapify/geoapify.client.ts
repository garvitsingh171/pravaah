import { GeoapifyError, type GeocodingResult } from './geoapify.types.js';

const GEOAPIFY_FORWARD_GEOCODING_URL = 'https://api.geoapify.com/v1/geocode/search';
export const GEOAPIFY_TIMEOUT_MS = 5_000;

type GeoapifyClientOptions = {
    apiKey?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
};

type GeocodeAddressInput = {
    canonicalAddress: string;
    country?: string | null | undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
};

const optionalString = (value: unknown): string | null => {
    return typeof value === 'string' ? value : null;
};

const optionalFiniteNumber = (value: unknown): number | null => {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const isIndia = (country: string | null | undefined): boolean => {
    return country?.trim().toLowerCase() === 'india';
};

const isAbortError = (error: unknown): boolean => {
    return error instanceof Error && error.name === 'AbortError';
};

const parseResponse = (payload: unknown): GeocodingResult => {
    if (!isRecord(payload) || !Array.isArray(payload.results)) {
        throw new GeoapifyError('INVALID_RESPONSE');
    }

    const firstResult = payload.results[0];

    if (!firstResult) {
        throw new GeoapifyError('NO_RESULTS');
    }

    if (!isRecord(firstResult)) {
        throw new GeoapifyError('INVALID_RESPONSE');
    }

    const latitude = optionalFiniteNumber(firstResult.lat);
    const longitude = optionalFiniteNumber(firstResult.lon);

    if (
        latitude === null ||
        longitude === null ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        throw new GeoapifyError('INVALID_RESPONSE');
    }

    const rank = isRecord(firstResult.rank) ? firstResult.rank : {};

    return {
        latitude,
        longitude,
        provider: 'GEOAPIFY',
        confidence: optionalFiniteNumber(rank.confidence),
        resultType: optionalString(firstResult.result_type),
        matchType: optionalString(rank.match_type),
        placeId: optionalString(firstResult.place_id),
        formattedAddress: optionalString(firstResult.formatted),
    };
};

export const createGeoapifyClient = ({
    apiKey,
    fetchImpl = fetch,
    timeoutMs = GEOAPIFY_TIMEOUT_MS,
}: GeoapifyClientOptions) => {
    const geocodeAddress = async ({ canonicalAddress, country }: GeocodeAddressInput) => {
        if (!apiKey) {
            throw new GeoapifyError('NOT_CONFIGURED');
        }

        const query = new URLSearchParams({
            text: canonicalAddress,
            format: 'json',
            limit: '1',
            lang: 'en',
            apiKey,
        });

        if (isIndia(country)) {
            query.set('filter', 'countrycode:in');
        }

        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), timeoutMs);

        try {
            const response = await fetchImpl(`${GEOAPIFY_FORWARD_GEOCODING_URL}?${query}`, {
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

    return { geocodeAddress };
};
