import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, createApiClient } from './apiClient';

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
        status: init.status ?? 200,
        headers: {
            'content-type': 'application/json',
            ...init.headers,
        },
    });

describe('apiClient onboarding boundaries', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    it('adds the configured Authorization header and normalizes onboarding endpoint paths', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            jsonResponse({
                success: true,
                data: {
                    onboarding: {
                        status: 'NOT_STARTED',
                        nextStep: 'CREATE_CLINIC',
                        isComplete: false,
                    },
                    user: null,
                    clinic: null,
                    setup: null,
                },
            })
        );
        vi.stubGlobal('fetch', fetchMock);

        const client = createApiClient({
            baseUrl: 'http://localhost:5000/api/',
            getAuthToken: async () => 'mock-clerk-token',
        });

        await client.get('/api/auth/onboarding-status');

        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:5000/api/auth/onboarding-status',
            expect.objectContaining({
                method: 'GET',
                headers: expect.any(Headers),
            })
        );
        const headers = fetchMock.mock.calls[0][1].headers as Headers;
        expect(headers.get('Authorization')).toBe('Bearer mock-clerk-token');
        expect(headers.get('Accept')).toBe('application/json');
    });

    it('serializes clinic onboarding bodies without adding authority fields', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            jsonResponse({
                success: true,
                data: {
                    onboarding: {
                        status: 'COMPLETED',
                        nextStep: 'OPEN_APPLICATION',
                        isComplete: true,
                    },
                    user: null,
                    clinic: null,
                    setup: null,
                },
            })
        );
        vi.stubGlobal('fetch', fetchMock);
        const client = createApiClient({
            baseUrl: 'http://localhost:5000/api',
        });

        await client.post('/auth/onboarding/clinic', {
            name: 'Pravaah Family Clinic',
            slug: 'pravaah-family-clinic',
        });

        const request = fetchMock.mock.calls[0][1];
        const body = JSON.parse(request.body as string);

        expect(body).toEqual({
            name: 'Pravaah Family Clinic',
            slug: 'pravaah-family-clinic',
        });
        expect(body).not.toHaveProperty('role');
        expect(body).not.toHaveProperty('status');
        expect(body).not.toHaveProperty('clerkUserId');
        expect((request.headers as Headers).get('Content-Type')).toBe('application/json');
    });

    it('converts structured backend validation errors into ApiClientError details', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                jsonResponse(
                    {
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Request validation failed',
                            details: [
                                {
                                    field: 'body.name',
                                    message: 'Clinic name is required',
                                },
                            ],
                        },
                    },
                    {
                        status: 400,
                    }
                )
            )
        );
        const client = createApiClient({
            baseUrl: 'http://localhost:5000/api',
        });

        await expect(client.post('/auth/onboarding/clinic', {})).rejects.toMatchObject({
            name: 'ApiClientError',
            code: 'VALIDATION_ERROR',
            status: 400,
            details: [
                {
                    field: 'body.name',
                    message: 'Clinic name is required',
                },
            ],
        });
    });

    it('converts aborts, network failures, and invalid base URLs to typed client errors', async () => {
        const clientWithoutBaseUrl = createApiClient({
            baseUrl: '',
        });

        await expect(clientWithoutBaseUrl.get('/auth/onboarding-status')).rejects.toMatchObject({
            code: 'API_BASE_URL_MISSING',
        });

        vi.stubGlobal(
            'fetch',
            vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'))
        );

        await expect(
            createApiClient({ baseUrl: 'http://localhost:5000/api' }).get(
                '/auth/onboarding-status'
            )
        ).rejects.toMatchObject({
            code: 'API_REQUEST_ABORTED',
        });

        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

        await expect(
            createApiClient({ baseUrl: 'http://localhost:5000/api' }).get(
                '/auth/onboarding-status'
            )
        ).rejects.toBeInstanceOf(ApiClientError);
        await expect(
            createApiClient({ baseUrl: 'http://localhost:5000/api' }).get(
                '/auth/onboarding-status'
            )
        ).rejects.toMatchObject({
            code: 'API_NETWORK_ERROR',
        });
    });
});
