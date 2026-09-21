export type GeocodingResult = {
    latitude: number;
    longitude: number;
    provider: 'GEOAPIFY';
    confidence: number | null;
    resultType: string | null;
    matchType: string | null;
    placeId: string | null;
    formattedAddress: string | null;
};

export type GeoapifyFailureCategory =
    | 'NOT_CONFIGURED'
    | 'TIMEOUT'
    | 'RATE_LIMITED'
    | 'UPSTREAM_ERROR'
    | 'NO_RESULTS'
    | 'INVALID_RESPONSE'
    | 'NETWORK_ERROR';

export class GeoapifyError extends Error {
    public readonly category: GeoapifyFailureCategory;

    constructor(category: GeoapifyFailureCategory) {
        super(category);
        this.name = 'GeoapifyError';
        this.category = category;
        Object.setPrototypeOf(this, GeoapifyError.prototype);
    }
}
