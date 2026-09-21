import 'dotenv/config';

import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { PrismaClient } from '../generated/prisma/client.js';
import { withTransientDatabaseRetry } from '../utils/databaseRetry.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({
    connectionString,
});

const basePrisma = new PrismaClient({
    adapter,
    // Allow Neon enough time to wake its compute and start an interactive
    // transaction without hitting Prisma's two-second default acquisition limit.
    transactionOptions: {
        maxWait: 30_000,
        timeout: 30_000,
    },
});

const retryableReadOperations = new Set([
    'aggregate',
    'count',
    'findFirst',
    'findFirstOrThrow',
    'findMany',
    'findUnique',
    'findUniqueOrThrow',
    'groupBy',
]);

const retryingPrisma = basePrisma.$extends({
    query: {
        $allModels: {
            $allOperations({ operation, args, query }) {
                if (!retryableReadOperations.has(operation)) {
                    return query(args);
                }

                return withTransientDatabaseRetry(() => query(args));
            },
        },
    },
});

// The query extension changes retry behavior only and adds no client methods or
// result fields, so retain the generated PrismaClient surface for transaction types.
export const prisma = retryingPrisma as unknown as PrismaClient;
