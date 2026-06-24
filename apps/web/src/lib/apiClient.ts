import type { ApiErrorResponse, ApiResponse } from '../types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type AuthTokenProvider =
    | string
    | (() => string | null | undefined | Promise<string | null | undefined>);

type DefaultAuthTokenProvider = ApiClientOptions['getAuthToken'];

export type ApiRequestOptions = {
    body?: unknown;
    query?: QueryParams;
    headers?: HeadersInit;
    authToken?: AuthTokenProvider;
    signal?: AbortSignal;
};

export type ApiClientOptions = {
    baseUrl?: string;
    getAuthToken?: () => string | null | undefined | Promise<string | null | undefined>;
};

type RequestOptions = ApiRequestOptions & {
    method: HttpMethod;
};

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const JSON_CONTENT_TYPE = 'application/json';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const trimLeadingSlash = (value: string): string => value.replace(/^\/+/, '');

const resolveBaseUrl = (baseUrl?: string): string => {
    const resolvedBaseUrl = baseUrl ?? DEFAULT_API_BASE_URL;

    if (!resolvedBaseUrl) {
        throw new ApiClientError({
            code: 'API_BASE_URL_MISSING',
            message: 'Frontend API base URL is not configured.',
        });
    }

    return trimTrailingSlash(resolvedBaseUrl);
};

const buildUrl = (baseUrl: string, path: string, query?: QueryParams): string => {
    let url: URL;

    try {
        url = new URL(`${baseUrl}/${trimLeadingSlash(path)}`);
    } catch {
        throw new ApiClientError({
            code: 'API_BASE_URL_INVALID',
            message: 'Frontend API base URL is invalid.',
        });
    }

    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        });
    }

    return url.toString();
};

const isJsonResponse = (response: Response): boolean => {
    return response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE) ?? false;
};

const parseJsonResponse = async (response: Response): Promise<unknown> => {
    if (response.status === 204 || !isJsonResponse(response)) {
        return null;
    }

    return response.json();
};

const isApiErrorResponse = (payload: unknown): payload is ApiErrorResponse => {
    if (
        typeof payload !== 'object' ||
        payload === null ||
        !('success' in payload) ||
        payload.success !== false ||
        !('error' in payload) ||
        typeof payload.error !== 'object' ||
        payload.error === null
    ) {
        return false;
    }

    const error = payload.error;

    return (
        'code' in error &&
        typeof error.code === 'string' &&
        'message' in error &&
        typeof error.message === 'string'
    );
};

const resolveAuthToken = async (
    requestAuthToken?: AuthTokenProvider,
    defaultAuthToken?: ApiClientOptions['getAuthToken']
): Promise<string | null | undefined> => {
    const tokenProvider = requestAuthToken ?? defaultAuthToken;

    if (typeof tokenProvider === 'function') {
        return tokenProvider();
    }

    return tokenProvider;
};

const createNetworkError = (error: unknown): ApiClientError => {
    if (error instanceof DOMException && error.name === 'AbortError') {
        return new ApiClientError({
            code: 'API_REQUEST_ABORTED',
            message: 'The request was cancelled.',
        });
    }

    if (error instanceof TypeError) {
        return new ApiClientError({
            code: 'API_NETWORK_ERROR',
            message:
                'Could not reach the Pravaah API. Check that the backend server is running and VITE_API_BASE_URL is correct.',
            details: error.message,
        });
    }

    return new ApiClientError({
        code: 'API_NETWORK_ERROR',
        message: 'Could not reach the Pravaah API.',
    });
};

export type ApiClientErrorOptions = {
    code: string;
    message: string;
    status?: number;
    details?: unknown;
};

export class ApiClientError extends Error {
    readonly code: string;
    readonly status?: number;
    readonly details?: unknown;

    constructor({ code, message, status, details }: ApiClientErrorOptions) {
        super(message);

        this.name = 'ApiClientError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export const isApiClientError = (error: unknown): error is ApiClientError => {
    return error instanceof ApiClientError;
};

export const createApiClient = (clientOptions: ApiClientOptions = {}) => {
    const request = async <TData>(
        path: string,
        { method, body, query, headers, authToken, signal }: RequestOptions
    ): Promise<TData> => {
        const baseUrl = resolveBaseUrl(clientOptions.baseUrl);
        const token = await resolveAuthToken(authToken, clientOptions.getAuthToken);
        const requestHeaders = new Headers(headers);

        requestHeaders.set('Accept', JSON_CONTENT_TYPE);

        if (body !== undefined) {
            requestHeaders.set('Content-Type', JSON_CONTENT_TYPE);
        }

        if (token) {
            requestHeaders.set('Authorization', `Bearer ${token}`);
        }

        let response: Response;

        try {
            response = await fetch(buildUrl(baseUrl, path, query), {
                method,
                headers: requestHeaders,
                body: body === undefined ? undefined : JSON.stringify(body),
                signal,
            });
        } catch (error) {
            if (isApiClientError(error)) {
                throw error;
            }

            throw createNetworkError(error);
        }

        const payload = await parseJsonResponse(response);

        if (!response.ok) {
            if (isApiErrorResponse(payload)) {
                throw new ApiClientError({
                    code: payload.error.code,
                    message: payload.error.message,
                    status: response.status,
                    details: payload.error.details,
                });
            }

            throw new ApiClientError({
                code: 'API_REQUEST_FAILED',
                message: `Request failed with status ${response.status}.`,
                status: response.status,
            });
        }

        const apiResponse = payload as ApiResponse<TData>;

        if (!apiResponse || apiResponse.success !== true) {
            throw new ApiClientError({
                code: 'INVALID_API_RESPONSE',
                message: 'Backend response did not match the Pravaah API format.',
                status: response.status,
            });
        }

        return apiResponse.data;
    };

    return {
        request,
        get: <TData>(path: string, options: ApiRequestOptions = {}) =>
            request<TData>(path, { ...options, method: 'GET' }),
        post: <TData>(path: string, body?: unknown, options: ApiRequestOptions = {}) =>
            request<TData>(path, { ...options, method: 'POST', body }),
        put: <TData>(path: string, body?: unknown, options: ApiRequestOptions = {}) =>
            request<TData>(path, { ...options, method: 'PUT', body }),
        patch: <TData>(path: string, body?: unknown, options: ApiRequestOptions = {}) =>
            request<TData>(path, { ...options, method: 'PATCH', body }),
        delete: <TData>(path: string, options: ApiRequestOptions = {}) =>
            request<TData>(path, { ...options, method: 'DELETE' }),
    };
};

let apiClientAuthTokenProvider: DefaultAuthTokenProvider;

export const setApiClientAuthTokenProvider = (provider: DefaultAuthTokenProvider): void => {
    apiClientAuthTokenProvider = provider;
};

export const apiClient = createApiClient({
    getAuthToken: () => apiClientAuthTokenProvider?.(),
});
