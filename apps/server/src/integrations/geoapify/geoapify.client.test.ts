import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGeoapifyClient, GEOAPIFY_TIMEOUT_MS } from './geoapify.client.js';

const successResponse = {
    results: [
        {
            lat: 26.8467,
            lon: 75.7894,
            formatted: 'B-42, Malviya Nagar, Jaipur, Rajasthan, India',
            result_type: 'amenity',
            place_id: 'geoapify-place-id',
            rank: {
                confidence: 0.92,
                match_type: 'full_match',
            },
        },
    ],
};

describe('Geoapify forward geocoding client', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('uses free-form text mode and maps a valid provider response', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(
            new Response(JSON.stringify(successResponse), { status: 200 })
        );
        const client = createGeoapifyClient({ apiKey: 'test', fetchImpl });

        await expect(
            client.geocodeAddress({
                canonicalAddress: 'B-42, Malviya Nagar, Jaipur, Rajasthan, 302017, India',
                country: 'India',
            })
        ).resolves.toEqual({
            latitude: 26.8467,
            longitude: 75.7894,
            provider: 'GEOAPIFY',
            confidence: 0.92,
            resultType: 'amenity',
            matchType: 'full_match',
            placeId: 'geoapify-place-id',
            formattedAddress: 'B-42, Malviya Nagar, Jaipur, Rajasthan, India',
        });

        const requestUrl = new URL(fetchImpl.mock.calls[0]?.[0] as string);
        expect(requestUrl.searchParams.get('text')).toBe(
            'B-42, Malviya Nagar, Jaipur, Rajasthan, 302017, India'
        );
        expect(requestUrl.searchParams.get('filter')).toBe('countrycode:in');
        expect(requestUrl.searchParams.has('street')).toBe(false);
    });

    it.each([
        [{ results: [] }, 'NO_RESULTS'],
        [{ results: [{ lat: 'not-a-number', lon: 75 }] }, 'INVALID_RESPONSE'],
        [{ results: [{ lat: 91, lon: 75 }] }, 'INVALID_RESPONSE'],
        [{ results: {} }, 'INVALID_RESPONSE'],
    ] as const)('rejects malformed or unusable results as %s', async (payload, category) => {
        const client = createGeoapifyClient({
            apiKey: 'test',
            fetchImpl: vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))),
        });

        await expect(
            client.geocodeAddress({ canonicalAddress: '12 Demo Road, Jaipur, Rajasthan, India' })
        ).rejects.toMatchObject({ category });
    });

    it('classifies rate limiting and other non-success HTTP responses safely', async () => {
        const rateLimitedClient = createGeoapifyClient({
            apiKey: 'test',
            fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 429 })),
        });
        const unavailableClient = createGeoapifyClient({
            apiKey: 'test',
            fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
        });

        await expect(
            rateLimitedClient.geocodeAddress({ canonicalAddress: '12 Demo Road, Jaipur, Rajasthan, India' })
        ).rejects.toMatchObject({ category: 'RATE_LIMITED' });
        await expect(
            unavailableClient.geocodeAddress({ canonicalAddress: '12 Demo Road, Jaipur, Rajasthan, India' })
        ).rejects.toMatchObject({ category: 'UPSTREAM_ERROR' });
    });

    it('converts an aborted request into a controlled timeout', async () => {
        vi.useFakeTimers();
        const fetchImpl = vi.fn(
            (_url: string, options: RequestInit) =>
                new Promise<Response>((_resolve, reject) => {
                    options.signal?.addEventListener('abort', () => {
                        reject(new DOMException('Request aborted', 'AbortError'));
                    });
                })
        ) as unknown as typeof fetch;
        const client = createGeoapifyClient({ apiKey: 'test', fetchImpl });
        const request = client.geocodeAddress({
            canonicalAddress: '12 Demo Road, Jaipur, Rajasthan, India',
        });
        const expectedTimeout = expect(request).rejects.toMatchObject({
            category: 'TIMEOUT',
        });

        await vi.advanceTimersByTimeAsync(GEOAPIFY_TIMEOUT_MS);

        await expectedTimeout;
    });
});
