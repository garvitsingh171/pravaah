import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (name: string): string => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is not defined`);
    }

    return value;
};

const parsePort = (value: string | undefined): number => {
    const port = Number(value ?? 5000);

    if (!Number.isInteger(port) || port <= 0) {
        throw new Error('PORT must be a positive integer');
    }

    return port;
};

const nodeEnv = process.env.NODE_ENV ?? 'development';
const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
const localClientUrl = process.env.LOCAL_CLIENT_URL ?? 'http://localhost:5173';
const allowedClientOrigins = Array.from(new Set([clientUrl, localClientUrl].filter(Boolean)));

export const env = {
    nodeEnv,
    port: parsePort(process.env.PORT),
    databaseUrl: requireEnv('DATABASE_URL'),
    clerkSecretKey: requireEnv('CLERK_SECRET_KEY'),
    clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET,
    clientUrl,
    localClientUrl,
    allowedClientOrigins,
};
