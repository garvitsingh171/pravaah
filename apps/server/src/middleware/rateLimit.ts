import { createHash } from 'node:crypto';
import ipaddr from 'ipaddr.js';
import type { Request, RequestHandler } from 'express';
import { prisma } from '../config/prisma.js';
import type { PrismaClient } from '../generated/prisma/client.js';

type Scope = 'user' | 'clinic' | 'identity' | 'ip';
type Rule = { scope: Scope; max: number; windowSeconds: number };
export type Policy = { rules: readonly Rule[]; storage: 'shared' | 'local' };

// Initial operational defaults. They are deliberately generous for live reception work.
export const policies = {
    general: { storage: 'local', rules: [{ scope: 'user', max: 1800, windowSeconds: 300 }] },
    identityRead: { storage: 'local', rules: [{ scope: 'identity', max: 120, windowSeconds: 60 }] },
    collection: { storage: 'shared', rules: [{ scope: 'user', max: 120, windowSeconds: 60 }] },
    queueRead: { storage: 'shared', rules: [{ scope: 'user', max: 300, windowSeconds: 60 }] },
    dashboard: { storage: 'shared', rules: [{ scope: 'user', max: 90, windowSeconds: 60 }] },
    mutation: { storage: 'shared', rules: [{ scope: 'user', max: 180, windowSeconds: 60 }] },
    onboarding: {
        storage: 'shared',
        rules: [
            { scope: 'identity', max: 6, windowSeconds: 3600 },
            { scope: 'ip', max: 600, windowSeconds: 3600 },
        ],
    },
    invitationWrite: {
        storage: 'shared',
        rules: [
            { scope: 'user', max: 12, windowSeconds: 3600 },
            { scope: 'clinic', max: 30, windowSeconds: 3600 },
        ],
    },
    invitationRead: {
        storage: 'shared',
        rules: [
            { scope: 'identity', max: 30, windowSeconds: 300 },
            { scope: 'ip', max: 600, windowSeconds: 300 },
        ],
    },
    invitationAccept: {
        storage: 'shared',
        rules: [
            { scope: 'identity', max: 10, windowSeconds: 3600 },
            { scope: 'ip', max: 600, windowSeconds: 3600 },
        ],
    },
    provider: {
        storage: 'shared',
        rules: [
            { scope: 'user', max: 20, windowSeconds: 60 },
            { scope: 'clinic', max: 300, windowSeconds: 3600 },
        ],
    },
    provisioning: {
        storage: 'shared',
        rules: [
            { scope: 'user', max: 3, windowSeconds: 3600 },
            { scope: 'clinic', max: 5, windowSeconds: 3600 },
        ],
    },
} as const satisfies Record<string, Policy>;

export type PolicyName = keyof typeof policies;
export function applyPolicyOverrides(
    definitions: Record<PolicyName, Policy>,
    input: string | undefined
): Record<PolicyName, Policy> {
    if (!input?.trim()) return definitions;
    const result = { ...definitions };
    const seen = new Set<string>();
    for (const entry of input.split(',')) {
        const match = /^([A-Za-z]+)\.(user|clinic|identity|ip)=([0-9]+)$/.exec(entry.trim());
        if (!match)
            throw new Error('RATE_LIMIT_LIMITS must use policy.scope=positiveInteger entries');
        const [, name, scope, rawMax] = match;
        const max = Number(rawMax);
        if (
            !Number.isSafeInteger(max) ||
            max < 1 ||
            max > 1_000_000 ||
            seen.has(`${name}.${scope}`)
        ) {
            throw new Error('RATE_LIMIT_LIMITS contains an invalid or duplicate limit');
        }
        seen.add(`${name}.${scope}`);
        const current = result[name as PolicyName];
        if (!current || !current.rules.some((rule) => rule.scope === scope)) {
            throw new Error('RATE_LIMIT_LIMITS contains an unknown policy or scope');
        }
        result[name as PolicyName] = {
            ...current,
            rules: current.rules.map((rule) => (rule.scope === scope ? { ...rule, max } : rule)),
        };
    }
    return result;
}

const activePolicies = applyPolicyOverrides(policies, process.env.RATE_LIMIT_LIMITS);
type CounterResult = { hits: number; expiresAt: Date; retrySeconds?: number };
export type CounterStore = {
    increment(key: string, windowSeconds: number): Promise<CounterResult>;
};

// One UPSERT is atomic across application instances. The database clock owns expiry.
export const createPostgresCounterStore = (
    client: Pick<PrismaClient, '$queryRaw'>
): CounterStore => ({
    async increment(key, windowSeconds) {
        const rows = await client.$queryRaw<Array<CounterResult>>`
            INSERT INTO "ApiRateLimitCounter" ("key", "hits", "expiresAt")
            VALUES (${key}, 1, now() + (${windowSeconds} * interval '1 second'))
            ON CONFLICT ("key") DO UPDATE SET
                "hits" = CASE WHEN "ApiRateLimitCounter"."expiresAt" <= now()
                    THEN 1 ELSE "ApiRateLimitCounter"."hits" + 1 END,
                "expiresAt" = CASE WHEN "ApiRateLimitCounter"."expiresAt" <= now()
                    THEN now() + (${windowSeconds} * interval '1 second')
                    ELSE "ApiRateLimitCounter"."expiresAt" END
            RETURNING "hits", "expiresAt",
                GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("expiresAt" - clock_timestamp()))))::int AS "retrySeconds"
        `;
        return rows[0]!;
    },
});
export const postgresCounterStore = createPostgresCounterStore(prisma);

const localCounters = new Map<string, CounterResult>();
export const localCounterStore: CounterStore = {
    async increment(key, windowSeconds) {
        const now = Date.now();
        const previous = localCounters.get(key);
        const result =
            previous && previous.expiresAt.getTime() > now
                ? { hits: previous.hits + 1, expiresAt: previous.expiresAt }
                : { hits: 1, expiresAt: new Date(now + windowSeconds * 1000) };
        localCounters.set(key, result);
        // Bound local fallback memory even under rotating identities.
        if (localCounters.size > 10_000) {
            for (const [candidate, counter] of localCounters) {
                if (counter.expiresAt.getTime() <= now) localCounters.delete(candidate);
            }
            if (localCounters.size > 10_000)
                localCounters.delete(localCounters.keys().next().value!);
        }
        return result;
    },
};

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

export function clientIp(req: Request): string {
    // Express req.ip respects the explicitly configured trust proxy setting.
    const address = ipaddr.process(req.ip || req.socket.remoteAddress || '0.0.0.0');
    if (address.kind() === 'ipv4') return address.toString();
    const parts = (address as ipaddr.IPv6).parts.slice(0, 4);
    return `${parts.map((part) => part.toString(16)).join(':')}::/64`;
}

function identity(req: Request, scope: Scope): string {
    if (scope === 'ip') return clientIp(req);
    if (scope === 'identity') {
        if (!req.authIdentity) throw new Error('Verified Clerk identity is required');
        return req.authIdentity.clerkUserId;
    }
    if (!req.user) throw new Error('Authenticated internal user is required');
    if (scope === 'user') return req.user.id;
    if (!req.user.clinicId) throw new Error('Authenticated clinic is required');
    return req.user.clinicId;
}

export function createRateLimiter(
    sharedStore: CounterStore = postgresCounterStore,
    localStore: CounterStore = localCounterStore,
    definitions: Record<PolicyName, Policy> = activePolicies
) {
    return (name: PolicyName): RequestHandler =>
        async function rateLimitRequest(req, res, next) {
            if (req.method === 'OPTIONS') return next();
            const policy = definitions[name];
            const store =
                policy.storage === 'local' ||
                (process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_TEST_SHARED !== '1')
                    ? localStore
                    : sharedStore;
            try {
                for (const rule of policy.rules) {
                    const key = `pravaah:rl:v1:${name}:${rule.scope}:${rule.windowSeconds}:${hash(identity(req, rule.scope))}`;
                    const counter = await store.increment(key, rule.windowSeconds);
                    if (counter.hits > rule.max) {
                        const retry =
                            counter.retrySeconds ??
                            Math.max(
                                1,
                                Math.ceil((counter.expiresAt.getTime() - Date.now()) / 1000)
                            );
                        res.setHeader('Retry-After', String(retry));
                        console.warn(
                            JSON.stringify({
                                event: 'rate_limit.rejected',
                                policy: name,
                                scope: rule.scope,
                            })
                        );
                        res.status(429).json({
                            success: false,
                            error: {
                                code: 'RATE_LIMIT_EXCEEDED',
                                message: 'Too many requests. Please try again later.',
                            },
                        });
                        return;
                    }
                }
                next();
            } catch (error) {
                // Sensitive policies fail closed. Routine traffic uses bounded local counters.
                console.error(JSON.stringify({ event: 'rate_limit.store_error', policy: name }));
                if (policy.storage === 'local') return next();
                res.status(503).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_UNAVAILABLE',
                        message:
                            'This operation is temporarily unavailable. Please try again later.',
                    },
                });
            }
        };
}

export const rateLimit = createRateLimiter();

export async function deleteExpiredRateLimitCounters(): Promise<void> {
    await prisma.$executeRaw`DELETE FROM "ApiRateLimitCounter" WHERE "expiresAt" < now()`;
}
