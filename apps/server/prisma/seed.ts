import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import {
    AppointmentStatus,
    BookingSource,
    PrismaClient,
    QueueStatus,
    UserRole,
    UserStatus,
} from '../src/generated/prisma/client.js';
import {
    addClinicDays,
    addMinutes,
    getClinicDateTime,
    getClinicTodayParts,
    sampleDoctorDefinitions,
    samplePatientDefinitions,
} from '../src/modules/clinics/sampleData.definitions.js';
import { predictNoShowRisk } from '../src/modules/predictions/prediction.service.js';

const DEFAULT_DEMO_CLINIC_ID = '00000000-0000-4000-8000-000000000000';
const DEFAULT_DEMO_CLINIC_SLUG = 'pravaah-demo-family-clinic';
const DEFAULT_ADMIN_CLERK_USER_ID = 'user_replace_with_local_admin_clerk_id';
const DEFAULT_STAFF_CLERK_USER_ID = 'user_replace_with_local_staff_clerk_id';
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

const getSeedClerkUserId = (
    primaryEnvName: string,
    fallbackEnvName: string | null,
    placeholder: string
): { clerkUserId: string; usesPlaceholder: boolean } => {
    const envValue = process.env[primaryEnvName]?.trim();
    const fallbackValue = fallbackEnvName ? process.env[fallbackEnvName]?.trim() : undefined;
    const clerkUserId = envValue || fallbackValue || placeholder;

    return {
        clerkUserId,
        usesPlaceholder: clerkUserId === placeholder,
    };
};

const buildFallbackEmail = (clerkUserId: string): string => {
    const safeUserId = clerkUserId.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return `dev-${safeUserId}@pravaah.local`;
};

const assertEmailIsAvailableForClerkUser = async (email: string, clerkUserId: string) => {
    const existingUserWithEmail = await prisma.user.findUnique({
        where: {
            email,
        },
        select: {
            clerkUserId: true,
        },
    });

    if (existingUserWithEmail && existingUserWithEmail.clerkUserId !== clerkUserId) {
        throw new Error(
            [
                `${email} is already used by a different Clerk user in Pravaah.`,
                'Use a unique seed email or update the existing local user intentionally.',
            ].join(' ')
        );
    }
};

const getAsiaKolkataDateTime = (
    dateParts: { year: number; month: number; day: number },
    time: string
): Date => {
    return getClinicDateTime(dateParts, time, 'Asia/Kolkata');
};

const doctors = sampleDoctorDefinitions;
const patients = samplePatientDefinitions;

async function main() {
    const clinicId = getDemoClinicId();
    const clinicTimezone = 'Asia/Kolkata';
    const today = getClinicTodayParts(clinicTimezone);
    const yesterday = addClinicDays(today, -1);
    const tomorrow = addClinicDays(today, 1);
    const nextWeek = addClinicDays(today, 7);

    const adminSeedUser = getSeedClerkUserId(
        'SEED_CLERK_USER_ID',
        'DEV_CLERK_USER_ID',
        DEFAULT_ADMIN_CLERK_USER_ID
    );
    const staffSeedUser = getSeedClerkUserId(
        'SEED_STAFF_CLERK_USER_ID',
        null,
        DEFAULT_STAFF_CLERK_USER_ID
    );
    const adminEmail =
        process.env.SEED_USER_EMAIL ??
        (adminSeedUser.usesPlaceholder
            ? 'demo-admin@pravaah.local'
            : buildFallbackEmail(adminSeedUser.clerkUserId));
    const staffEmail =
        process.env.SEED_STAFF_USER_EMAIL ??
        (staffSeedUser.usesPlaceholder
            ? 'demo-staff@pravaah.local'
            : buildFallbackEmail(staffSeedUser.clerkUserId));

    await assertEmailIsAvailableForClerkUser(adminEmail, adminSeedUser.clerkUserId);
    await assertEmailIsAvailableForClerkUser(staffEmail, staffSeedUser.clerkUserId);

    const clinic = await prisma.clinic.upsert({
        where: {
            id: clinicId,
        },
        update: {
            name: 'Pravaah Demo Family Clinic',
            slug: DEFAULT_DEMO_CLINIC_SLUG,
            phone: '+91 00000 03000',
            email: 'demo-clinic@pravaah.local',
            addressLine1: '101 Demo Care Street',
            addressLine2: 'Training District',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
            pincode: '560000',
            timezone: clinicTimezone,
            openingTime: '09:00',
            closingTime: '18:00',
            slotDurationMinutes: 15,
            bufferMinutes: 5,
            isActive: true,
        },
        create: {
            id: clinicId,
            name: 'Pravaah Demo Family Clinic',
            slug: DEFAULT_DEMO_CLINIC_SLUG,
            phone: '+91 00000 03000',
            email: 'demo-clinic@pravaah.local',
            addressLine1: '101 Demo Care Street',
            addressLine2: 'Training District',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
            pincode: '560000',
            timezone: clinicTimezone,
            openingTime: '09:00',
            closingTime: '18:00',
            slotDurationMinutes: 15,
            bufferMinutes: 5,
            isActive: true,
        },
    });

    const adminUser = await prisma.user.upsert({
        where: {
            clerkUserId: adminSeedUser.clerkUserId,
        },
        update: {
            fullName: process.env.SEED_USER_FULL_NAME ?? 'Local Pravaah Admin',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            clinicId: clinic.id,
        },
        create: {
            clerkUserId: adminSeedUser.clerkUserId,
            fullName: process.env.SEED_USER_FULL_NAME ?? 'Local Pravaah Admin',
            email: adminEmail,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            clinicId: clinic.id,
        },
    });

    const staffUser = await prisma.user.upsert({
        where: {
            clerkUserId: staffSeedUser.clerkUserId,
        },
        update: {
            fullName: process.env.SEED_STAFF_USER_FULL_NAME ?? 'Demo Front Desk Staff',
            role: UserRole.STAFF,
            status: staffSeedUser.usesPlaceholder ? UserStatus.INVITED : UserStatus.ACTIVE,
            clinicId: clinic.id,
        },
        create: {
            clerkUserId: staffSeedUser.clerkUserId,
            fullName: process.env.SEED_STAFF_USER_FULL_NAME ?? 'Demo Front Desk Staff',
            email: staffEmail,
            role: UserRole.STAFF,
            status: staffSeedUser.usesPlaceholder ? UserStatus.INVITED : UserStatus.ACTIVE,
            clinicId: clinic.id,
        },
    });

    for (const doctor of doctors) {
        await prisma.doctor.upsert({
            where: {
                id: doctor.id,
            },
            update: {
                fullName: doctor.fullName,
                specialization: doctor.specialization,
                qualification: doctor.qualification,
                registrationNumber: doctor.registrationNumber,
                phone: doctor.phone,
                email: doctor.email,
                gender: doctor.gender,
                experienceYears: doctor.experienceYears,
                isActive: true,
            },
            create: {
                id: doctor.id,
                fullName: doctor.fullName,
                specialization: doctor.specialization,
                qualification: doctor.qualification,
                registrationNumber: doctor.registrationNumber,
                phone: doctor.phone,
                email: doctor.email,
                gender: doctor.gender,
                experienceYears: doctor.experienceYears,
                isActive: true,
            },
        });

        await prisma.doctorClinic.upsert({
            where: {
                doctorId_clinicId: {
                    doctorId: doctor.id,
                    clinicId: clinic.id,
                },
            },
            update: {
                isActive: true,
                displayName: doctor.displayName,
                consultationFee: doctor.consultationFee,
            },
            create: {
                doctorId: doctor.id,
                clinicId: clinic.id,
                isActive: true,
                displayName: doctor.displayName,
                consultationFee: doctor.consultationFee,
            },
        });
    }

    for (const patient of patients) {
        await prisma.patient.upsert({
            where: {
                id: patient.id,
            },
            update: {
                fullName: patient.fullName,
                phone: patient.phone,
                email: patient.email,
                gender: patient.gender,
                age: patient.age,
                address: patient.address,
                city: patient.city,
                emergencyContactName: patient.emergencyContactName,
                emergencyContactPhone: patient.emergencyContactPhone,
                isActive: true,
            },
            create: {
                id: patient.id,
                fullName: patient.fullName,
                phone: patient.phone,
                email: patient.email,
                gender: patient.gender,
                age: patient.age,
                address: patient.address,
                city: patient.city,
                emergencyContactName: patient.emergencyContactName,
                emergencyContactPhone: patient.emergencyContactPhone,
                isActive: true,
            },
        });

        await prisma.patientClinic.upsert({
            where: {
                patientId_clinicId: {
                    patientId: patient.id,
                    clinicId: clinic.id,
                },
            },
            update: {
                totalAppointments: patient.history.totalAppointments,
                totalNoShows: patient.history.totalNoShows,
                totalLateArrivals: patient.history.totalLateArrivals,
                distanceFromClinicKm: patient.history.distanceFromClinicKm,
                notes: patient.history.notes,
                isActive: true,
            },
            create: {
                patientId: patient.id,
                clinicId: clinic.id,
                totalAppointments: patient.history.totalAppointments,
                totalNoShows: patient.history.totalNoShows,
                totalLateArrivals: patient.history.totalLateArrivals,
                distanceFromClinicKm: patient.history.distanceFromClinicKm,
                notes: patient.history.notes,
                isActive: true,
            },
        });
    }

    const appointmentSeeds = [
        {
            id: '30000000-0000-4000-8000-000000000001',
            doctorId: doctors[0].id,
            patientId: patients[0].id,
            scheduledAt: getAsiaKolkataDateTime(today, '09:15'),
            status: AppointmentStatus.IN_QUEUE,
            queueStatus: QueueStatus.WAITING,
            position: 1,
            reason: 'Routine follow-up',
            notes: 'Demo low-risk appointment in today queue.',
            bookingSource: BookingSource.RECEPTION,
            bookedAt: addMinutes(getAsiaKolkataDateTime(today, '09:15'), -72 * 60),
        },
        {
            id: '30000000-0000-4000-8000-000000000002',
            doctorId: doctors[1].id,
            patientId: patients[1].id,
            scheduledAt: getAsiaKolkataDateTime(today, '09:45'),
            status: AppointmentStatus.ARRIVED,
            queueStatus: QueueStatus.ARRIVED,
            position: 2,
            reason: 'Child fever review',
            notes: 'Demo medium-risk appointment marked arrived manually.',
            bookingSource: BookingSource.PHONE,
            bookedAt: addMinutes(getAsiaKolkataDateTime(today, '09:45'), -5 * 60),
        },
        {
            id: '30000000-0000-4000-8000-000000000003',
            doctorId: doctors[2].id,
            patientId: patients[2].id,
            scheduledAt: getAsiaKolkataDateTime(today, '10:15'),
            status: AppointmentStatus.CALLED,
            queueStatus: QueueStatus.CALLED,
            position: 3,
            reason: 'Follow-up consultation',
            notes: 'Demo high-risk appointment currently called by staff.',
            bookingSource: BookingSource.RECEPTION,
            bookedAt: addMinutes(getAsiaKolkataDateTime(today, '10:15'), -3 * 60),
        },
        {
            id: '30000000-0000-4000-8000-000000000004',
            doctorId: doctors[0].id,
            patientId: patients[3].id,
            scheduledAt: getAsiaKolkataDateTime(today, '10:45'),
            status: AppointmentStatus.COMPLETED,
            queueStatus: QueueStatus.COMPLETED,
            position: 4,
            reason: 'Review visit',
            notes: 'Demo completed queue entry.',
            bookingSource: BookingSource.RECEPTION,
            bookedAt: addMinutes(getAsiaKolkataDateTime(today, '10:45'), -4 * 24 * 60),
        },
        {
            id: '30000000-0000-4000-8000-000000000005',
            doctorId: doctors[1].id,
            patientId: patients[4].id,
            scheduledAt: getAsiaKolkataDateTime(today, '11:15'),
            status: AppointmentStatus.CANCELLED,
            queueStatus: QueueStatus.CANCELLED,
            position: 5,
            reason: 'General consultation',
            notes: 'Demo cancelled queue entry. Staff made the decision manually.',
            bookingSource: BookingSource.PHONE,
            bookedAt: addMinutes(getAsiaKolkataDateTime(today, '11:15'), -4 * 60),
        },
        {
            id: '30000000-0000-4000-8000-000000000006',
            doctorId: doctors[2].id,
            patientId: patients[2].id,
            scheduledAt: getAsiaKolkataDateTime(today, '11:45'),
            status: AppointmentStatus.NO_SHOW,
            queueStatus: QueueStatus.NO_SHOW,
            position: 6,
            reason: 'Medication review',
            notes: 'Demo no-show queue entry. Staff marked it manually.',
            bookingSource: BookingSource.RECEPTION,
            bookedAt: addMinutes(getAsiaKolkataDateTime(today, '11:45'), -6 * 60),
        },
        {
            id: '30000000-0000-4000-8000-000000000007',
            doctorId: doctors[0].id,
            patientId: patients[5].id,
            scheduledAt: getAsiaKolkataDateTime(tomorrow, '12:00'),
            status: AppointmentStatus.SCHEDULED,
            queueStatus: null,
            position: null,
            reason: 'New patient visit',
            notes: 'Demo tomorrow appointment.',
            bookingSource: BookingSource.WALK_IN,
            bookedAt: addMinutes(getAsiaKolkataDateTime(tomorrow, '12:00'), -30 * 60),
        },
        {
            id: '30000000-0000-4000-8000-000000000008',
            doctorId: doctors[1].id,
            patientId: patients[1].id,
            scheduledAt: getAsiaKolkataDateTime(nextWeek, '15:30'),
            status: AppointmentStatus.CONFIRMED,
            queueStatus: null,
            position: null,
            reason: 'Pediatric follow-up',
            notes: 'Demo future confirmed appointment.',
            bookingSource: BookingSource.PHONE,
            bookedAt: addMinutes(getAsiaKolkataDateTime(nextWeek, '15:30'), -10 * 24 * 60),
        },
        {
            id: '30000000-0000-4000-8000-000000000009',
            doctorId: doctors[0].id,
            patientId: patients[0].id,
            scheduledAt: getAsiaKolkataDateTime(yesterday, '16:00'),
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Past completed demo visit',
            notes: 'Demo history appointment outside today queue.',
            bookingSource: BookingSource.RECEPTION,
            bookedAt: addMinutes(getAsiaKolkataDateTime(yesterday, '16:00'), -7 * 24 * 60),
        },
    ];

    for (const appointmentSeed of appointmentSeeds) {
        const appointment = await prisma.appointment.upsert({
            where: {
                id: appointmentSeed.id,
            },
            update: {
                clinicId: clinic.id,
                doctorId: appointmentSeed.doctorId,
                patientId: appointmentSeed.patientId,
                createdByUserId: adminUser.id,
                scheduledAt: appointmentSeed.scheduledAt,
                durationMinutes: 15,
                status: appointmentSeed.status,
                bookingSource: appointmentSeed.bookingSource,
                reason: appointmentSeed.reason,
                notes: appointmentSeed.notes,
            },
            create: {
                id: appointmentSeed.id,
                clinicId: clinic.id,
                doctorId: appointmentSeed.doctorId,
                patientId: appointmentSeed.patientId,
                createdByUserId: adminUser.id,
                scheduledAt: appointmentSeed.scheduledAt,
                durationMinutes: 15,
                status: appointmentSeed.status,
                bookingSource: appointmentSeed.bookingSource,
                reason: appointmentSeed.reason,
                notes: appointmentSeed.notes,
            },
        });

        const patient = patients.find((demoPatient) => demoPatient.id === appointment.patientId);

        if (!patient) {
            throw new Error(`Seed patient not found for appointment ${appointment.id}`);
        }

        const completedAppointmentCount = Math.max(
            patient.history.totalAppointments - patient.history.totalNoShows,
            0
        );
        const noShowPrediction = predictNoShowRisk({
            scheduledAt: appointment.scheduledAt,
            bookedAt: appointmentSeed.bookedAt,
            patientNoShowCount: patient.history.totalNoShows,
            patientLateArrivalCount: patient.history.totalLateArrivals,
            patientCompletedAppointmentCount: completedAppointmentCount,
            distanceFromClinicKm: Number(patient.history.distanceFromClinicKm),
        });

        await prisma.noShowPrediction.upsert({
            where: {
                appointmentId: appointment.id,
            },
            update: {
                clinicId: clinic.id,
                patientId: appointment.patientId,
                riskLevel: noShowPrediction.riskLevel,
                score: noShowPrediction.score,
                reasons: noShowPrediction.reasons,
            },
            create: {
                appointmentId: appointment.id,
                clinicId: clinic.id,
                patientId: appointment.patientId,
                riskLevel: noShowPrediction.riskLevel,
                score: noShowPrediction.score,
                reasons: noShowPrediction.reasons,
            },
        });

        if (appointmentSeed.queueStatus && appointmentSeed.position) {
            await prisma.queueEntry.upsert({
                where: {
                    appointmentId: appointment.id,
                },
                update: {
                    clinicId: clinic.id,
                    doctorId: appointment.doctorId,
                    patientId: appointment.patientId,
                    position: appointmentSeed.position,
                    status: appointmentSeed.queueStatus,
                    queuedAt: addMinutes(appointment.scheduledAt, -15),
                    calledAt:
                        appointmentSeed.queueStatus === QueueStatus.CALLED ||
                        appointmentSeed.queueStatus === QueueStatus.COMPLETED
                            ? addMinutes(appointment.scheduledAt, 5)
                            : null,
                    completedAt:
                        appointmentSeed.queueStatus === QueueStatus.COMPLETED
                            ? addMinutes(appointment.scheduledAt, 20)
                            : null,
                },
                create: {
                    clinicId: clinic.id,
                    appointmentId: appointment.id,
                    doctorId: appointment.doctorId,
                    patientId: appointment.patientId,
                    position: appointmentSeed.position,
                    status: appointmentSeed.queueStatus,
                    queuedAt: addMinutes(appointment.scheduledAt, -15),
                    calledAt:
                        appointmentSeed.queueStatus === QueueStatus.CALLED ||
                        appointmentSeed.queueStatus === QueueStatus.COMPLETED
                            ? addMinutes(appointment.scheduledAt, 5)
                            : null,
                    completedAt:
                        appointmentSeed.queueStatus === QueueStatus.COMPLETED
                            ? addMinutes(appointment.scheduledAt, 20)
                            : null,
                },
            });
        }
    }

    console.log('Seeded Pravaah demo clinic data:');
    console.log(`- clinicId: ${clinic.id}`);
    console.log(`- clinicSlug: ${clinic.slug}`);
    console.log(`- adminUserId: ${adminUser.id}`);
    console.log(`- adminClerkUserId: ${adminUser.clerkUserId}`);
    console.log(`- staffUserId: ${staffUser.id}`);
    console.log(`- staffClerkUserId: ${staffUser.clerkUserId}`);
    console.log(`- doctors: ${doctors.length}`);
    console.log(`- patients: ${patients.length}`);
    console.log(`- appointments: ${appointmentSeeds.length}`);
    console.log('- todayQueueEntries: 6');
    console.log('');
    console.log('Next local web setup:');
    console.log(
        `- Set VITE_DEFAULT_CLINIC_ID=${clinic.id} in apps/web/.env if you need a demo fallback.`
    );
    console.log('- Restart the Vite dev server after changing apps/web/.env.');

    if (adminSeedUser.usesPlaceholder || staffSeedUser.usesPlaceholder) {
        console.log('');
        console.log('Clerk placeholder note:');
        console.log(
            '- Replace SEED_CLERK_USER_ID and/or SEED_STAFF_CLERK_USER_ID with real development Clerk user IDs when you want those users to sign in.'
        );
        console.log(
            '- Placeholder internal users do not bypass Clerk; protected APIs still require a matching authenticated Clerk user.'
        );
    }
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
