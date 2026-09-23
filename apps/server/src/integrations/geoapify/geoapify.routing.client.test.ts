import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    createGeoapifyRoutingClient,
    GEOAPIFY_ROUTING_TIMEOUT_MS,
} from './geoapify.routing.client.js';

const coordinates = {
    patientLatitude: 26.912434,
    patientLongitude: 75.787271,
    clinicLatitude: 26.85305,
    clinicLongitude: 75.80573,
};

describe('Geoapify routing client', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('requests patient-to-clinic driving directions and maps distance/time', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    type: 'FeatureCollection',
                    features: [{ properties: { distance: 8437, time: 601 } }],
                }),
                { status: 200 }
            )
        );
        const client = createGeoapifyRoutingClient({ apiKey: 'test', fetchImpl });

        await expect(client.routePatientToClinic(coordinates)).resolves.toEqual({
            distanceMeters: 8437,
            travelTimeSeconds: 601,
            provider: 'GEOAPIFY',
        });

        const requestUrl = new URL(fetchImpl.mock.calls[0]?.[0] as string);
        expect(requestUrl.searchParams.get('waypoints')).toBe(
            '26.912434,75.787271|26.85305,75.80573'
        );
        expect(requestUrl.searchParams.get('mode')).toBe('drive');
        expect(requestUrl.searchParams.get('type')).toBe('balanced');
        expect(requestUrl.searchParams.get('traffic')).toBe('free_flow');
        expect(requestUrl.searchParams.get('units')).toBe('metric');
        expect(requestUrl.searchParams.get('format')).toBe('json');
    });

    it.each([
        [{ features: [] }, 'NO_RESULTS'],
        [{ features: [{ properties: { distance: '8437', time: 601 } }] }, 'INVALID_RESPONSE'],
        [{ features: [{ properties: { distance: -1, time: 601 } }] }, 'INVALID_RESPONSE'],
        [{ features: [{ properties: { distance: 8437, time: -1 } }] }, 'INVALID_RESPONSE'],
        [{ features: [{ properties: { distance: Number.NaN, time: 601 } }] }, 'INVALID_RESPONSE'],
        [{ features: [{ properties: { distance: 8437 } }] }, 'INVALID_RESPONSE'],
    ] as const)('rejects unusable provider output', async (payload, category) => {
        const client = createGeoapifyRoutingClient({
            apiKey: 'test',
            fetchImpl: vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))),
        });

        await expect(client.routePatientToClinic(coordinates)).rejects.toMatchObject({ category });
    });

    it('accepts a valid zero-distance, zero-time route', async () => {
        const client = createGeoapifyRoutingClient({
            apiKey: 'test',
            fetchImpl: vi
                .fn()
                .mockResolvedValue(
                    new Response(
                        JSON.stringify({ features: [{ properties: { distance: 0, time: 0 } }] })
                    )
                ),
        });

        await expect(client.routePatientToClinic(coordinates)).resolves.toMatchObject({
            distanceMeters: 0,
            travelTimeSeconds: 0,
        });
    });

    it('classifies rate limits and upstream failures', async () => {
        const rateLimited = createGeoapifyRoutingClient({
            apiKey: 'test',
            fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 429 })),
        });
        const upstreamFailure = createGeoapifyRoutingClient({
            apiKey: 'test',
            fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
        });

        await expect(rateLimited.routePatientToClinic(coordinates)).rejects.toMatchObject({
            category: 'RATE_LIMITED',
        });
        await expect(upstreamFailure.routePatientToClinic(coordinates)).rejects.toMatchObject({
            category: 'UPSTREAM_ERROR',
        });
    });

    it('converts an aborted request into a bounded timeout', async () => {
        vi.useFakeTimers();
        const fetchImpl = vi.fn(
            (_url: string, options: RequestInit) =>
                new Promise<Response>((_resolve, reject) => {
                    options.signal?.addEventListener('abort', () => {
                        reject(new DOMException('Request aborted', 'AbortError'));
                    });
                })
        ) as unknown as typeof fetch;
        const client = createGeoapifyRoutingClient({ apiKey: 'test', fetchImpl });
        const request = client.routePatientToClinic(coordinates);
        const expectedTimeout = expect(request).rejects.toMatchObject({ category: 'TIMEOUT' });

        await vi.advanceTimersByTimeAsync(GEOAPIFY_ROUTING_TIMEOUT_MS);

        await expectedTimeout;
    });
});
