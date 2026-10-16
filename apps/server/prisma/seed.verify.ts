import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import ws from 'ws';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { validateSeedEnvironment } from './seed.config.js';
import { generateFixtures, SEED_NAMESPACE } from './seed.fixtures.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
const config = validateSeedEnvironment(process.env);
const fixtures = generateFixtures(config.profile, config.anchorDate);
const connectionString = process.env.DATABASE_URL!;
const databaseHost = new URL(connectionString).hostname.toLowerCase();
const useNeonWebSocketAdapter = process.env.PRISMA_DATABASE_ADAPTER?.trim().toLowerCase() === 'neon';
const adapter = useNeonWebSocketAdapter && databaseHost.endsWith('.neon.tech')
    ? (() => { neonConfig.webSocketConstructor = ws; return new PrismaNeon({ connectionString }); })()
    : new PrismaPg({ connectionString, max: 5, connectionTimeoutMillis: 30_000, idleTimeoutMillis: 300_000, keepAlive: true });
const prisma = new PrismaClient({
    adapter,
    transactionOptions: { maxWait: 30_000, timeout: 30_000 },
});

try {
    const ids = fixtures.appointments.map((row) => row.id);
    const [appointments, queueEntries, predictions, activities, invalidScopes] = await Promise.all([
        prisma.appointment.count({ where: { id: { in: ids } } }),
        prisma.queueEntry.count({ where: { appointmentId: { in: ids } } }),
        prisma.noShowPrediction.count({ where: { appointmentId: { in: ids }, runKey: { startsWith: `${SEED_NAMESPACE}:` } } }),
        prisma.appointmentActivity.count({ where: { appointmentId: { in: ids } } }),
        prisma.appointment.count({ where: { id: { in: ids }, OR: [{ clinicId: { notIn: fixtures.clinics.map((row) => row.id) } }, { doctorId: { notIn: fixtures.doctors.map((row) => row.id) } }, { patientId: { notIn: fixtures.patients.map((row) => row.id) } }] } }),
    ]);
    if (appointments !== ids.length || invalidScopes !== 0) throw new Error('Seed verification failed: appointment coverage or ownership is invalid.');
    console.log(JSON.stringify({ profile: config.profile, database: config.databaseName, appointments, queueEntries, predictions, activities, invalidScopes }, null, 2));
} finally {
    await prisma.$disconnect();
}

