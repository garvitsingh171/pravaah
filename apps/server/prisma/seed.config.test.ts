import { describe, expect, it } from 'vitest';
import { parseDatabaseName, validateSeedEnvironment } from './seed.config.js';

const base = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://user:secret@ep-local.neon.tech/pravaah_dev?sslmode=require',
    SEED_DATABASE_TARGET: 'pravaah_dev',
    SEED_DATABASE_ALLOWLIST: 'pravaah_dev',
} satisfies NodeJS.ProcessEnv;

describe('seed safety configuration', () => {
    it('extracts the database name without exposing credentials', () => {
        expect(parseDatabaseName(base.DATABASE_URL!)).toBe('pravaah_dev');
    });

    it('rejects non-development environments and unallowlisted targets', () => {
        expect(() => validateSeedEnvironment({ ...base, NODE_ENV: 'production' })).toThrow(/NODE_ENV/);
        expect(() => validateSeedEnvironment({ ...base, SEED_DATABASE_ALLOWLIST: 'other_dev' })).toThrow(/allowlisted/);
    });

    it('accepts only an explicitly identified development database', () => {
        expect(validateSeedEnvironment(base).profile).toBe('demo');
        expect(validateSeedEnvironment({ ...base, SEED_DATABASE_TARGET: 'ep-local.neon.tech', SEED_DATABASE_ALLOWLIST: 'ep-local.neon.tech' }).databaseHost).toBe('ep-local.neon.tech');
        expect(() => validateSeedEnvironment({ ...base, SEED_DATABASE_TARGET: 'pravaah_production', SEED_DATABASE_ALLOWLIST: 'pravaah_production' })).toThrow(/production-like/);
    });
});

