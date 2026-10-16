import { URL } from 'node:url';

export type SeedProfile = 'small' | 'demo' | 'stress';

export type SeedConfig = {
    profile: SeedProfile;
    databaseName: string;
    databaseHost: string;
    databaseTarget: string;
    anchorDate: string;
    adminClerkUserId?: string;
    staffClerkUserId?: string;
    cleanupConfirmed: boolean;
};

const clerkUserIdPattern = /^user_[A-Za-z0-9_-]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const parseDatabaseName = (databaseUrl: string): string => {
    let parsed: URL;
    try {
        parsed = new URL(databaseUrl);
    } catch {
        throw new Error('DATABASE_URL is not a valid URL');
    }

    const name = decodeURIComponent(parsed.pathname.replace(/^\//, '')).split('?')[0]?.trim();
    if (!name) throw new Error('DATABASE_URL must include a database name');
    return name;
};

export const parseDatabaseHost = (databaseUrl: string): string => {
    try {
        return new URL(databaseUrl).hostname.toLowerCase();
    } catch {
        throw new Error('DATABASE_URL is not a valid URL');
    }
};

export const validateSeedEnvironment = (
    env: NodeJS.ProcessEnv,
    databaseUrl = env.DATABASE_URL
): SeedConfig => {
    if (env.NODE_ENV !== 'development') {
        throw new Error('Refusing to seed: NODE_ENV must be exactly development.');
    }
    if (!databaseUrl) throw new Error('Refusing to seed: DATABASE_URL is not defined.');

    const databaseName = parseDatabaseName(databaseUrl);
    const databaseHost = parseDatabaseHost(databaseUrl);
    const allowlist = (env.SEED_DATABASE_ALLOWLIST ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    const databaseTarget = env.SEED_DATABASE_TARGET?.trim();

    if (databaseTarget && /prod|production|staging|stage/i.test(databaseTarget)) {
        throw new Error('Refusing to seed: production-like database identity detected.');
    }
    if (!databaseTarget || !allowlist.includes(databaseTarget)) {
        throw new Error(
            'Refusing to seed: set SEED_DATABASE_TARGET and include the same dedicated development database identity in the allowlisted SEED_DATABASE_ALLOWLIST.'
        );
    }
    const targetMatchesResolvedDatabase = databaseTarget === databaseName || databaseTarget.toLowerCase() === databaseHost;
    const resolvedIdentityIsAllowlisted = allowlist.includes(databaseName) || allowlist.some((value) => value.toLowerCase() === databaseHost);
    if (!targetMatchesResolvedDatabase || !resolvedIdentityIsAllowlisted) {
        throw new Error(
            `Refusing to seed: resolved database '${databaseName}' at '${databaseHost}' is not the explicitly allowlisted target.`
        );
    }

    const profile = (env.SEED_PROFILE ?? 'demo').trim().toLowerCase();
    if (profile !== 'small' && profile !== 'demo' && profile !== 'stress') {
        throw new Error('SEED_PROFILE must be small, demo, or stress.');
    }

    const anchorDate = env.SEED_ANCHOR_DATE?.trim() ?? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
    }).format(new Date());
    if (!datePattern.test(anchorDate) || Number.isNaN(Date.parse(`${anchorDate}T00:00:00Z`))) {
        throw new Error('SEED_ANCHOR_DATE must be a valid YYYY-MM-DD date.');
    }

    const readClerkId = (name: string): string | undefined => {
        const value = env[name]?.trim();
        if (!value) return undefined;
        if (!clerkUserIdPattern.test(value)) throw new Error(`${name} must look like a Clerk user ID.`);
        return value;
    };

    return {
        profile,
        databaseName,
        databaseHost,
        databaseTarget,
        anchorDate,
        adminClerkUserId: readClerkId('SEED_ADMIN_CLERK_USER_ID') ?? readClerkId('SEED_CLERK_USER_ID'),
        staffClerkUserId: readClerkId('SEED_STAFF_CLERK_USER_ID'),
        cleanupConfirmed: env.SEED_CLEANUP_CONFIRMATION === 'I_UNDERSTAND_SEED_OWNED_ROWS_ONLY',
    };
};

