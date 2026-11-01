import express from 'express';
import type { Server } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/prisma.js', () => ({ prisma: {} }));

import {
    applyPolicyOverrides,
    createRateLimiter,
    policies,
    type CounterStore,
    type Policy,
    type PolicyName,
} from './rateLimit.js';

const policy = (rules: Policy['rules']): Record<PolicyName, Policy> => ({
    general: { storage: 'local', rules },
    identityRead: { storage: 'local', rules },
    collection: { storage: 'shared', rules },
    queueRead: { storage: 'shared', rules },
    dashboard: { storage: 'shared', rules },
    mutation: { storage: 'shared', rules },
    onboarding: { storage: 'shared', rules },
    invitationWrite: { storage: 'shared', rules },
    invitationRead: { storage: 'shared', rules },
    invitationAccept: { storage: 'shared', rules },
    provider: { storage: 'shared', rules },
    provisioning: { storage: 'shared', rules },
});

function memoryStore(clock: { now: number }): CounterStore {
    const counters = new Map<string, { hits: number; expiresAt: Date }>();
    return {
        async increment(key, seconds) {
            const previous = counters.get(key);
            const counter =
                previous && previous.expiresAt.getTime() > clock.now
                    ? { ...previous, hits: previous.hits + 1 }
                    : { hits: 1, expiresAt: new Date(clock.now + seconds * 1000) };
            counters.set(key, counter);
            return counter;
        },
    };
}

const servers: Server[] = [];
afterEach(async () => {
    await Promise.all(
        servers
            .splice(0)
            .map((server) => new Promise<void>((resolve) => server.close(() => resolve())))
    );
});

async function start(name: PolicyName, rules: Policy['rules'], store: CounterStore) {
    const app = express();
    let reached = 0;
    app.use(express.json());
    app.use((req, _res, next) => {
        const user = req.header('x-test-user') ?? 'a';
        req.authIdentity = { clerkUserId: user };
        req.user = {
            id: user,
            clerkUserId: user,
            clinicId: req.header('x-test-clinic') ?? 'clinic-a',
            role: 'STAFF',
            status: 'ACTIVE',
        };
        next();
    });
    app.post('/operation', createRateLimiter(store, store, policy(rules))(name), (_req, res) => {
        reached += 1;
        res.json({ success: true });
    });
    const server = app.listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Listener unavailable');
    const url = `http://127.0.0.1:${address.port}/operation`;
    return {
        get reached() {
            return reached;
        },
        async send(headers: Record<string, string> = {}) {
            const response = await fetch(url, { method: 'POST', headers });
            return {
                status: response.status,
                retry: response.headers.get('retry-after'),
                body: await response.json(),
            };
        },
    };
}

describe('rate limit HTTP behavior', () => {
    it('validates operator overrides and changes only the selected maximum', () => {
        const configured = applyPolicyOverrides(policies, 'provider.user=30,provider.clinic=500');
        expect(configured.provider.rules.map((rule) => rule.max)).toEqual([30, 500]);
        expect(configured.invitationWrite).toBe(policies.invitationWrite);
        expect(() => applyPolicyOverrides(policies, 'provider.user=0')).toThrow();
        expect(() => applyPolicyOverrides(policies, 'unknown.user=5')).toThrow();
        expect(() => applyPolicyOverrides(policies, 'provider.user=5,provider.user=6')).toThrow();
    });
    it('returns the standard 429 before the handler and recovers after expiry', async () => {
        const clock = { now: Date.now() };
        const service = await start(
            'onboarding',
            [{ scope: 'identity', max: 2, windowSeconds: 10 }],
            memoryStore(clock)
        );
        expect((await service.send()).status).toBe(200);
        expect((await service.send()).status).toBe(200);
        const rejected = await service.send();
        expect(rejected.status).toBe(429);
        expect(rejected.retry).toBe('10');
        expect(rejected.body).toEqual({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
            },
        });
        expect(service.reached).toBe(2);
        clock.now += 10_000;
        expect((await service.send()).status).toBe(200);
    });

    it('isolates users and shares a clinic budget across staff and handler instances', async () => {
        const store = memoryStore({ now: Date.now() });
        const rules = [
            { scope: 'user', max: 5, windowSeconds: 60 },
            { scope: 'clinic', max: 2, windowSeconds: 60 },
        ] as const;
        const first = await start('provider', rules, store);
        const second = await start('provider', rules, store);
        expect((await first.send({ 'x-test-user': 'a' })).status).toBe(200);
        expect((await second.send({ 'x-test-user': 'b' })).status).toBe(200);
        expect(
            (
                await first.send({
                    'x-test-user': 'c',
                    'x-test-clinic': 'clinic-a',
                    'x-forwarded-for': '203.0.113.9',
                })
            ).status
        ).toBe(429);
        expect(
            (await second.send({ 'x-test-user': 'd', 'x-test-clinic': 'clinic-b' })).status
        ).toBe(200);
        expect(first.reached + second.reached).toBe(3);
    });

    it('keeps ordinary user quotas independent within one clinic', async () => {
        const service = await start(
            'collection',
            [{ scope: 'user', max: 1, windowSeconds: 60 }],
            memoryStore({ now: Date.now() })
        );
        expect((await service.send({ 'x-test-user': 'a' })).status).toBe(200);
        expect((await service.send({ 'x-test-user': 'a' })).status).toBe(429);
        expect((await service.send({ 'x-test-user': 'b' })).status).toBe(200);
    });

    it('does not use spoofed forwarding headers or client body identifiers for identity', async () => {
        const store = memoryStore({ now: Date.now() });
        const service = await start(
            'invitationRead',
            [
                { scope: 'identity', max: 1, windowSeconds: 60 },
                { scope: 'ip', max: 2, windowSeconds: 60 },
            ],
            store
        );
        expect((await service.send({ 'x-forwarded-for': '203.0.113.1' })).status).toBe(200);
        expect((await service.send({ 'x-forwarded-for': '203.0.113.2' })).status).toBe(429);
        expect(
            (await service.send({ 'x-test-user': 'b', 'x-forwarded-for': '203.0.113.3' })).status
        ).toBe(200);
        expect(
            (await service.send({ 'x-test-user': 'c', 'x-forwarded-for': '203.0.113.4' })).status
        ).toBe(429);
    });

    it('admits only the configured number of concurrent requests', async () => {
        const service = await start(
            'mutation',
            [{ scope: 'user', max: 3, windowSeconds: 60 }],
            memoryStore({ now: Date.now() })
        );
        const results = await Promise.all(Array.from({ length: 12 }, () => service.send()));
        expect(results.filter((result) => result.status === 200)).toHaveLength(3);
        expect(service.reached).toBe(3);
    });

    it('returns 503 on a shared counter failure without calling the handler', async () => {
        const failingStore: CounterStore = {
            async increment() {
                throw new Error('unavailable');
            },
        };
        const service = await start(
            'provider',
            [{ scope: 'user', max: 1, windowSeconds: 60 }],
            failingStore
        );
        const result = await service.send();
        expect(result.status).toBe(503);
        expect(result.body.error.code).toBe('RATE_LIMIT_UNAVAILABLE');
        expect(service.reached).toBe(0);
    });

    it('keeps low-cost requests available if the local counter fails', async () => {
        const failingStore: CounterStore = {
            async increment() {
                throw new Error('unavailable');
            },
        };
        const service = await start(
            'general',
            [{ scope: 'user', max: 1, windowSeconds: 60 }],
            failingStore
        );
        expect((await service.send()).status).toBe(200);
        expect(service.reached).toBe(1);
    });
});
