import type { Prisma } from '../generated/prisma/client.js';

const transientDatabaseErrorCodes = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND',
    'ETIMEDOUT',
    'P2024',
    'P2028',
    'P1001',
    'P1002',
    'P1017',
    'P2034',
]);

const isObject = (value: unknown): value is Record<PropertyKey, unknown> => {
    return typeof value === 'object' && value !== null;
};

export const isTransientDatabaseError = (error: unknown): boolean => {
    if (!isObject(error)) {
        return false;
    }

    const errorCode =
        typeof error.code === 'string'
            ? error.code
            : typeof error.errorCode === 'string'
              ? error.errorCode
              : undefined;

    if (errorCode && transientDatabaseErrorCodes.has(errorCode)) {
        return true;
    }

    // Some database adapters wrap DNS/socket failures without preserving the
    // original Node.js error code. Keep those failures in the database
    // unavailable path instead of exposing them as a generic 500 response.
    if (
        typeof error.message === 'string' &&
        /getaddrinfo\s+enotfound|econnrefused|econnreset|etimedout|enetunreach|ehostunreach/i.test(
            error.message
        )
    ) {
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

/**
 * Retry only failures that happen before Prisma invokes the transaction
 * callback. Once the callback starts, application writes may already have
 * happened and retrying could duplicate a successful commit whose response
 * was lost.
 */
export const withTransientDatabaseTransactionRetry = async <Result>(
    transaction: (callback: (tx: Prisma.TransactionClient) => Promise<unknown>) => Promise<unknown>,
    operation: (tx: Prisma.TransactionClient) => Promise<Result>
): Promise<Result> => {
    let transactionStarted = false;

    return withTransientDatabaseRetry(
        () => {
            transactionStarted = false;

            return transaction(async (tx) => {
                transactionStarted = true;
                return operation(tx);
            }) as Promise<Result>;
        },
        {
            shouldRetry: () => !transactionStarted,
        }
    );
};
