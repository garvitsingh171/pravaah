import { describe, expect, it } from 'vitest';
import { assertSecurityTestDatabase } from './testDatabaseGuard.js';

const safe = {
    NODE_ENV: 'test',
    SECURITY_TEST_MODE: '1',
    TEST_DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:55432/pravaah_security_test',
};

describe('security test database guard', () => {
    it('accepts only an explicitly enabled dedicated local database', () => {
        expect(assertSecurityTestDatabase(safe)).toBe(safe.TEST_DATABASE_URL);
    });

    it.each([
        { NODE_ENV: 'production' },
        { SECURITY_TEST_MODE: undefined },
        { TEST_DATABASE_URL: undefined },
        {
            TEST_DATABASE_URL:
                'postgresql://synthetic:synthetic@db.neon.tech/pravaah_security_test',
        },
        { TEST_DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:55432/pravaah_dev' },
        {
            TEST_DATABASE_URL:
                'postgresql://synthetic:synthetic@127.0.0.1:55432/pravaah_security_test?host=remote',
        },
        { DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:5432/pravaah_dev' },
    ])('fails closed for unsafe configuration %#', (change) => {
        expect(() => assertSecurityTestDatabase({ ...safe, ...change })).toThrow();
    });
});
