/** Keep every migration, fixture write and cleanup confined to the disposable database. */
export function assertSecurityTestDatabase(environment: NodeJS.ProcessEnv = process.env): string {
    if (environment.NODE_ENV !== 'test' || environment.SECURITY_TEST_MODE !== '1') {
        throw new Error(
            'Security database operations require NODE_ENV=test and SECURITY_TEST_MODE=1'
        );
    }
    const connection = environment.TEST_DATABASE_URL;
    if (!connection) throw new Error('TEST_DATABASE_URL is required');

    let url: URL;
    try {
        url = new URL(connection);
    } catch {
        throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL URL');
    }
    const database = decodeURIComponent(url.pathname.slice(1));
    if (
        !['postgres:', 'postgresql:'].includes(url.protocol) ||
        !['127.0.0.1', 'localhost', 'postgres'].includes(url.hostname.toLowerCase()) ||
        database !== 'pravaah_security_test' ||
        !url.username ||
        !url.password ||
        url.searchParams.has('host')
    ) {
        throw new Error('Security tests require the dedicated local/container PostgreSQL database');
    }
    if (environment.DATABASE_URL && environment.DATABASE_URL !== connection) {
        throw new Error('DATABASE_URL and TEST_DATABASE_URL must point to the same test database');
    }
    return connection;
}
