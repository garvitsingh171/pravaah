const transientDatabaseErrorCodes = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND',
    'ETIMEDOUT',
    'P2024',
    'P2028',
]);

const isObject = (value: unknown): value is Record<PropertyKey, unknown> => {
    return typeof value === 'object' && value !== null;
};

export const isTransientDatabaseError = (error: unknown): boolean => {
    if (!isObject(error)) {
        return false;
    }

    if (typeof error.code === 'string' && transientDatabaseErrorCodes.has(error.code)) {
        return true;
    }

    if (error.constructor?.name === 'ErrorEvent') {
        return true;
    }

    if ('cause' in error && isTransientDatabaseError(error.cause)) {
        return true;
    }

    if ('errors' in error && Array.isArray(error.errors)) {
        return error.errors.some(isTransientDatabaseError);
    }

    return false;
};

const retryDelaysMs = [250, 750, 1_500] as const;

const wait = (delayMs: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
};

export const withTransientDatabaseRetry = async <Result>(
    operation: () => Promise<Result>,
    options: { shouldRetry?: (error: unknown) => boolean } = {}
): Promise<Result> => {
    for (let attempt = 0; ; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            const retryDelay = retryDelaysMs[attempt];

            if (
                retryDelay === undefined ||
                !isTransientDatabaseError(error) ||
                options.shouldRetry?.(error) === false
            ) {
                throw error;
            }

            await wait(retryDelay);
        }
    }
};
