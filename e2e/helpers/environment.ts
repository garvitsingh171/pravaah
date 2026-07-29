const productionUrlMarkers = ['prod', 'production'];

const requiredSecretNames = [
    'CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'E2E_DATABASE_URL',
    'E2E_ALLOW_TEST_DATABASE_WRITES',
] as const;

const redactDatabaseUrl = (value: string): string => {
    try {
        const url = new URL(value);

        return `${url.protocol}//${url.hostname}${url.pathname}`;
    } catch {
        return '[invalid database url]';
    }
};

export const assertE2EEnvironmentIsSafe = () => {
    const missing = requiredSecretNames.filter((name) => !process.env[name]?.trim());

    if (missing.length > 0) {
        throw new Error(`Missing required E2E environment variables: ${missing.join(', ')}`);
    }

    if (process.env.E2E_ALLOW_TEST_DATABASE_WRITES !== 'true') {
        throw new Error('E2E_ALLOW_TEST_DATABASE_WRITES must be exactly "true".');
    }

    const databaseUrl = process.env.E2E_DATABASE_URL!.trim();

    if (process.env.DATABASE_URL && process.env.DATABASE_URL === databaseUrl) {
        throw new Error('E2E_DATABASE_URL must not be the same value as DATABASE_URL.');
    }

    const redactedDatabaseUrl = redactDatabaseUrl(databaseUrl).toLowerCase();
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();

    if (
        nodeEnv === 'production' ||
        productionUrlMarkers.some((marker) => redactedDatabaseUrl.includes(marker))
    ) {
        throw new Error(
            'Refusing to run E2E tests against a database URL that looks production-like.'
        );
    }
};

export const uniqueRunSuffix = () => {
    const worker = process.env.TEST_WORKER_INDEX ?? '0';

    return `${Date.now()}-${worker}-${Math.random().toString(36).slice(2, 8)}`;
};
