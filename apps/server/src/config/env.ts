import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (name: string): string => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is not defined`);
    }

    return value;
};

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 5000),
    clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
    clerkPublishableKey: requireEnv('CLERK_PUBLISHABLE_KEY'),
    clerkSecretKey: requireEnv('CLERK_SECRET_KEY'),
};
