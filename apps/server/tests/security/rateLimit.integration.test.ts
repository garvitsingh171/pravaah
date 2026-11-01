import { describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { assertSecurityTestDatabase } from './testDatabaseGuard.js';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { createPostgresCounterStore } from '../../src/middleware/rateLimit.js';

describe('shared PostgreSQL rate-limit counter', () => {
    it('counts concurrent requests atomically across separate clients and resets expired windows', async () => {
        const connectionString = assertSecurityTestDatabase();
        const first = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
        const second = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
        const key = `pravaah:rl:test:${crypto.randomUUID()}`;
        try {
            const stores = [createPostgresCounterStore(first), createPostgresCounterStore(second)];
            const results = await Promise.all(
                Array.from({ length: 24 }, (_, index) => stores[index % 2]!.increment(key, 60))
            );
            expect(results.map((result) => result.hits).sort((a, b) => a - b)).toEqual(
                Array.from({ length: 24 }, (_, index) => index + 1)
            );
            await first.$executeRaw`UPDATE "ApiRateLimitCounter" SET "expiresAt" = now() - interval '1 second' WHERE "key" = ${key}`;
            const reset = await stores[1]!.increment(key, 60);
            expect(reset.hits).toBe(1);
            expect(reset.expiresAt.getTime()).toBeGreaterThan(Date.now());
        } finally {
            await first.$executeRaw`DELETE FROM "ApiRateLimitCounter" WHERE "key" = ${key}`;
            await Promise.all([first.$disconnect(), second.$disconnect()]);
        }
    });
});
