import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, UserStatus } from '../src/generated/prisma/client.js';

const DEFAULT_DEMO_CLINIC_ID = '00000000-0000-4000-8000-000000000000';
const DEFAULT_DEMO_CLINIC_SLUG = 'demo-clinic';
const postgresUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const seedDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverEnvPath = path.resolve(seedDirectory, '../.env');

dotenv.config({
    path: serverEnvPath,
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString,
    }),
});

const getRequiredSeedClerkUserId = (): string => {
    const clerkUserId = process.env.SEED_CLERK_USER_ID ?? process.env.DEV_CLERK_USER_ID;

    if (!clerkUserId?.trim()) {
        throw new Error(
            [
                'SEED_CLERK_USER_ID is required to seed a local Pravaah admin user.',
                'Sign in to Clerk locally, copy your Clerk user ID from the Clerk dashboard,',
                'then add SEED_CLERK_USER_ID=user_xxx to apps/server/.env before running the seed.',
            ].join(' ')
        );
    }

    return clerkUserId.trim();
};

const buildFallbackEmail = (clerkUserId: string): string => {
    const safeUserId = clerkUserId.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return `dev-${safeUserId}@pravaah.local`;
};

const getDemoClinicId = (): string => {
    const clinicId = process.env.SEED_DEMO_CLINIC_ID?.trim() || DEFAULT_DEMO_CLINIC_ID;

    if (!postgresUuidRegex.test(clinicId)) {
        throw new Error(
            [
                'SEED_DEMO_CLINIC_ID must be a PostgreSQL UUID, for example',
                `${DEFAULT_DEMO_CLINIC_ID}.`,
                'Fix apps/server/.env or remove SEED_DEMO_CLINIC_ID to use the default demo clinic id.',
            ].join(' ')
        );
    }

    return clinicId;
};

async function main() {
    const clerkUserId = getRequiredSeedClerkUserId();
    const clinicId = getDemoClinicId();
    const userEmail = process.env.SEED_USER_EMAIL ?? buildFallbackEmail(clerkUserId);
    const userFullName = process.env.SEED_USER_FULL_NAME ?? 'Local Pravaah Admin';

    const existingUserWithEmail = await prisma.user.findUnique({
        where: {
            email: userEmail,
        },
        select: {
            clerkUserId: true,
        },
    });

    if (existingUserWithEmail && existingUserWithEmail.clerkUserId !== clerkUserId) {
        throw new Error(
            [
                `SEED_USER_EMAIL is already used by a different Clerk user in Pravaah.`,
                'Use a unique SEED_USER_EMAIL for this Clerk user or update the existing local user intentionally.',
            ].join(' ')
        );
    }

    const clinic = await prisma.clinic.upsert({
        where: {
            id: clinicId,
        },
        update: {
            isActive: true,
        },
        create: {
            id: clinicId,
            name: 'Demo Pravaah Clinic',
            slug: DEFAULT_DEMO_CLINIC_SLUG,
            phone: '+91 99999 00000',
            email: 'demo-clinic@pravaah.local',
            addressLine1: 'Local development clinic',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
            timezone: 'Asia/Kolkata',
            openingTime: '09:00',
            closingTime: '18:00',
            slotDurationMinutes: 15,
            bufferMinutes: 0,
            isActive: true,
        },
    });

    const user = await prisma.user.upsert({
        where: {
            clerkUserId,
        },
        update: {
            fullName: userFullName,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            clinicId: clinic.id,
        },
        create: {
            clerkUserId,
            fullName: userFullName,
            email: userEmail,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            clinicId: clinic.id,
        },
    });

    console.log('Seeded local Pravaah access:');
    console.log(`- clinicId: ${clinic.id}`);
    console.log(`- clinicSlug: ${clinic.slug}`);
    console.log(`- userId: ${user.id}`);
    console.log(`- clerkUserId: ${user.clerkUserId}`);
    console.log(`- role: ${user.role}`);
    console.log(`- status: ${user.status}`);
    console.log('');
    console.log('Next local web setup:');
    console.log(
        `- Set VITE_DEFAULT_CLINIC_ID=${clinic.id} in apps/web/.env if you need a demo fallback.`
    );
    console.log('- Restart the Vite dev server after changing apps/web/.env.');
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
