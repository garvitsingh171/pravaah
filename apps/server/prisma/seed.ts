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
    SAMPLE_DATA_NOTE_MARKER,
    addClinicDays,
    addMinutes,
    getClinicDateLabel,
    getClinicDateTime,
    getClinicTodayParts,
    getSampleCompletedVisitCount,
    sampleDoctorDefinitions,
    samplePatientDefinitions,
} from '../src/modules/clinics/sampleData.definitions.js';
import { calculateArrivalOutcome } from '../src/modules/appointments/appointment.arrival.js';
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

const doctors = sampleDoctorDefinitions;
const patients = samplePatientDefinitions;

type AppointmentSeed = {
    id: string;
    doctorIndex: number;
    patientIndex: number;
    dateOffset: number;
    time: string;
    status: AppointmentStatus;
    queueStatus: QueueStatus | null;
    position: number | null;
    reason: string;
    notes: string | null;
    bookingSource: BookingSource;
    bookedMinutesBefore: number;
    arrivalOffsetMinutes?: number;
};

const stripSampleMarker = (notes: string): string => {
    return notes.replace(SAMPLE_DATA_NOTE_MARKER, '').trim();
};

const buildAppointmentId = (sequence: number): string => {
    return `30000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
};

const buildAppointmentSeeds = (
    today: ReturnType<typeof getClinicTodayParts>,
    clinicTimezone: string
) => {
    const appointmentDefinitions: AppointmentSeed[] = [
        {
            id: buildAppointmentId(1),
            doctorIndex: 0,
            patientIndex: 0,
            dateOffset: 0,
            time: '10:05',
            status: AppointmentStatus.ARRIVED,
            queueStatus: QueueStatus.ARRIVED,
            position: 1,
            reason: 'Routine follow-up',
            notes: 'Prefers morning appointments when available.',
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 3 * 24 * 60,
            arrivalOffsetMinutes: -4,
        },
        {
            id: buildAppointmentId(2),
            doctorIndex: 0,
            patientIndex: 6,
            dateOffset: 0,
            time: '10:20',
            status: AppointmentStatus.IN_QUEUE,
            queueStatus: QueueStatus.WAITING,
            position: 2,
            reason: 'Blood pressure review',
            notes: 'Asked to confirm current medication list at reception.',
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 6 * 60,
            arrivalOffsetMinutes: 6,
        },
        {
            id: buildAppointmentId(3),
            doctorIndex: 0,
            patientIndex: 2,
            dateOffset: 0,
            time: '10:35',
            status: AppointmentStatus.IN_QUEUE,
            queueStatus: QueueStatus.WAITING,
            position: 3,
            reason: 'Medication review',
            notes: 'Front desk plans a manual confirmation before future visits.',
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 4 * 60,
            arrivalOffsetMinutes: 22,
        },
        {
            id: buildAppointmentId(4),
            doctorIndex: 0,
            patientIndex: 3,
            dateOffset: 0,
            time: '10:50',
            status: AppointmentStatus.CALLED,
            queueStatus: QueueStatus.CALLED,
            position: 4,
            reason: 'Annual health consultation',
            notes: 'Vitals captured at arrival.',
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 5 * 24 * 60,
            arrivalOffsetMinutes: 15,
        },
        {
            id: buildAppointmentId(5),
            doctorIndex: 1,
            patientIndex: 4,
            dateOffset: 0,
            time: '09:15',
            status: AppointmentStatus.COMPLETED,
            queueStatus: QueueStatus.COMPLETED,
            position: 1,
            reason: 'Pediatric fever review',
            notes: 'Follow-up instructions shared with guardian.',
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 7 * 24 * 60,
            arrivalOffsetMinutes: 3,
        },
        {
            id: buildAppointmentId(6),
            doctorIndex: 1,
            patientIndex: 5,
            dateOffset: 0,
            time: '11:10',
            status: AppointmentStatus.ARRIVED,
            queueStatus: QueueStatus.ARRIVED,
            position: 2,
            reason: 'New patient visit',
            notes: 'Contact details verified during check-in.',
            bookingSource: BookingSource.WALK_IN,
            bookedMinutesBefore: 12 * 60,
            arrivalOffsetMinutes: 8,
        },
        {
            id: buildAppointmentId(7),
            doctorIndex: 2,
            patientIndex: 7,
            dateOffset: 0,
            time: '09:40',
            status: AppointmentStatus.COMPLETED,
            queueStatus: QueueStatus.COMPLETED,
            position: 1,
            reason: 'Skin irritation',
            notes: 'Review advised if symptoms persist.',
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 4 * 24 * 60,
            arrivalOffsetMinutes: 9,
        },
        {
            id: buildAppointmentId(8),
            doctorIndex: 3,
            patientIndex: 8,
            dateOffset: 0,
            time: '10:00',
            status: AppointmentStatus.COMPLETED,
            queueStatus: QueueStatus.COMPLETED,
            position: 1,
            reason: 'Knee pain follow-up',
            notes: 'Exercise plan reviewed.',
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 6 * 24 * 60,
            arrivalOffsetMinutes: 2,
        },
        {
            id: buildAppointmentId(9),
            doctorIndex: 4,
            patientIndex: 16,
            dateOffset: 0,
            time: '09:55',
            status: AppointmentStatus.NO_SHOW,
            queueStatus: QueueStatus.NO_SHOW,
            position: 1,
            reason: 'Routine follow-up',
            notes: 'Marked after front-desk follow-up window.',
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 3 * 60,
        },
        {
            id: buildAppointmentId(10),
            doctorIndex: 3,
            patientIndex: 14,
            dateOffset: 0,
            time: '11:30',
            status: AppointmentStatus.CANCELLED,
            queueStatus: QueueStatus.CANCELLED,
            position: 2,
            reason: 'Back pain assessment',
            notes: 'Patient requested a later date.',
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 2 * 24 * 60,
        },
        {
            id: buildAppointmentId(11),
            doctorIndex: 2,
            patientIndex: 13,
            dateOffset: 0,
            time: '12:20',
            status: AppointmentStatus.SCHEDULED,
            queueStatus: null,
            position: null,
            reason: 'Allergy consultation',
            notes: null,
            bookingSource: BookingSource.WEB,
            bookedMinutesBefore: 2 * 60,
        },
        {
            id: buildAppointmentId(12),
            doctorIndex: 5,
            patientIndex: 20,
            dateOffset: 0,
            time: '12:45',
            status: AppointmentStatus.SCHEDULED,
            queueStatus: null,
            position: null,
            reason: 'Persistent cough',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 5 * 60,
        },
        {
            id: buildAppointmentId(13),
            doctorIndex: 4,
            patientIndex: 17,
            dateOffset: 0,
            time: '13:30',
            status: AppointmentStatus.CONFIRMED,
            queueStatus: null,
            position: null,
            reason: 'Medication review',
            notes: 'Confirmed by phone this morning.',
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 2 * 24 * 60,
        },
        {
            id: buildAppointmentId(14),
            doctorIndex: 1,
            patientIndex: 12,
            dateOffset: 0,
            time: '14:30',
            status: AppointmentStatus.CONFIRMED,
            queueStatus: null,
            position: null,
            reason: 'Pediatric follow-up',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 8 * 24 * 60,
        },
        {
            id: buildAppointmentId(15),
            doctorIndex: 3,
            patientIndex: 15,
            dateOffset: 0,
            time: '15:40',
            status: AppointmentStatus.SCHEDULED,
            queueStatus: null,
            position: null,
            reason: 'Shoulder stiffness',
            notes: null,
            bookingSource: BookingSource.WEB,
            bookedMinutesBefore: 30 * 60,
        },
        {
            id: buildAppointmentId(16),
            doctorIndex: 0,
            patientIndex: 11,
            dateOffset: 0,
            time: '16:10',
            status: AppointmentStatus.CONFIRMED,
            queueStatus: null,
            position: null,
            reason: 'Blood pressure review',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 9 * 24 * 60,
        },
        {
            id: buildAppointmentId(17),
            doctorIndex: 0,
            patientIndex: 0,
            dateOffset: -2,
            time: '09:30',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Routine follow-up',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 5 * 24 * 60,
        },
        {
            id: buildAppointmentId(18),
            doctorIndex: 1,
            patientIndex: 4,
            dateOffset: -2,
            time: '10:15',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Fever and fatigue',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 2 * 24 * 60,
        },
        {
            id: buildAppointmentId(19),
            doctorIndex: 2,
            patientIndex: 7,
            dateOffset: -3,
            time: '12:00',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Skin irritation',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 4 * 24 * 60,
        },
        {
            id: buildAppointmentId(20),
            doctorIndex: 3,
            patientIndex: 8,
            dateOffset: -4,
            time: '11:45',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Knee pain follow-up',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 8 * 24 * 60,
        },
        {
            id: buildAppointmentId(21),
            doctorIndex: 5,
            patientIndex: 19,
            dateOffset: -5,
            time: '16:00',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'ENT review',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 6 * 24 * 60,
        },
        {
            id: buildAppointmentId(22),
            doctorIndex: 0,
            patientIndex: 21,
            dateOffset: -6,
            time: '09:45',
            status: AppointmentStatus.NO_SHOW,
            queueStatus: null,
            position: null,
            reason: 'Medication review',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 3 * 24 * 60,
        },
        {
            id: buildAppointmentId(23),
            doctorIndex: 4,
            patientIndex: 18,
            dateOffset: -7,
            time: '13:15',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Routine follow-up',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 5 * 24 * 60,
        },
        {
            id: buildAppointmentId(24),
            doctorIndex: 1,
            patientIndex: 22,
            dateOffset: -8,
            time: '10:30',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Pediatric fever review',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 2 * 24 * 60,
        },
        {
            id: buildAppointmentId(25),
            doctorIndex: 2,
            patientIndex: 9,
            dateOffset: -9,
            time: '15:00',
            status: AppointmentStatus.CANCELLED,
            queueStatus: null,
            position: null,
            reason: 'Skin follow-up',
            notes: null,
            bookingSource: BookingSource.WEB,
            bookedMinutesBefore: 7 * 24 * 60,
        },
        {
            id: buildAppointmentId(26),
            doctorIndex: 0,
            patientIndex: 10,
            dateOffset: -10,
            time: '11:00',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Annual health consultation',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 14 * 24 * 60,
        },
        {
            id: buildAppointmentId(27),
            doctorIndex: 3,
            patientIndex: 23,
            dateOffset: -11,
            time: '12:30',
            status: AppointmentStatus.NO_SHOW,
            queueStatus: null,
            position: null,
            reason: 'Back pain assessment',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 4 * 24 * 60,
        },
        {
            id: buildAppointmentId(28),
            doctorIndex: 5,
            patientIndex: 20,
            dateOffset: -12,
            time: '10:00',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Allergy consultation',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 6 * 24 * 60,
        },
        {
            id: buildAppointmentId(29),
            doctorIndex: 4,
            patientIndex: 13,
            dateOffset: -13,
            time: '14:15',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Medication review',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 9 * 24 * 60,
        },
        {
            id: buildAppointmentId(30),
            doctorIndex: 0,
            patientIndex: 1,
            dateOffset: -14,
            time: '16:30',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Blood pressure review',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 5 * 24 * 60,
        },
        {
            id: buildAppointmentId(31),
            doctorIndex: 2,
            patientIndex: 2,
            dateOffset: -16,
            time: '09:20',
            status: AppointmentStatus.NO_SHOW,
            queueStatus: null,
            position: null,
            reason: 'Follow-up consultation',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 2 * 24 * 60,
        },
        {
            id: buildAppointmentId(32),
            doctorIndex: 3,
            patientIndex: 14,
            dateOffset: -17,
            time: '11:20',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Shoulder stiffness',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 3 * 24 * 60,
        },
        {
            id: buildAppointmentId(33),
            doctorIndex: 5,
            patientIndex: 5,
            dateOffset: -18,
            time: '12:45',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Persistent cough',
            notes: null,
            bookingSource: BookingSource.WALK_IN,
            bookedMinutesBefore: 8 * 60,
        },
        {
            id: buildAppointmentId(34),
            doctorIndex: 1,
            patientIndex: 12,
            dateOffset: -20,
            time: '10:45',
            status: AppointmentStatus.CANCELLED,
            queueStatus: null,
            position: null,
            reason: 'Pediatric follow-up',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 6 * 24 * 60,
        },
        {
            id: buildAppointmentId(35),
            doctorIndex: 4,
            patientIndex: 17,
            dateOffset: -22,
            time: '15:30',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Routine follow-up',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 10 * 24 * 60,
        },
        {
            id: buildAppointmentId(36),
            doctorIndex: 0,
            patientIndex: 11,
            dateOffset: -24,
            time: '09:50',
            status: AppointmentStatus.COMPLETED,
            queueStatus: null,
            position: null,
            reason: 'Medication review',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 5 * 24 * 60,
        },
        {
            id: buildAppointmentId(37),
            doctorIndex: 0,
            patientIndex: 9,
            dateOffset: 1,
            time: '09:30',
            status: AppointmentStatus.CONFIRMED,
            queueStatus: null,
            position: null,
            reason: 'Routine follow-up',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 4 * 24 * 60,
        },
        {
            id: buildAppointmentId(38),
            doctorIndex: 2,
            patientIndex: 7,
            dateOffset: 1,
            time: '11:00',
            status: AppointmentStatus.SCHEDULED,
            queueStatus: null,
            position: null,
            reason: 'Skin follow-up',
            notes: null,
            bookingSource: BookingSource.WEB,
            bookedMinutesBefore: 2 * 24 * 60,
        },
        {
            id: buildAppointmentId(39),
            doctorIndex: 1,
            patientIndex: 22,
            dateOffset: 2,
            time: '10:15',
            status: AppointmentStatus.CONFIRMED,
            queueStatus: null,
            position: null,
            reason: 'Pediatric review',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 5 * 24 * 60,
        },
        {
            id: buildAppointmentId(40),
            doctorIndex: 3,
            patientIndex: 8,
            dateOffset: 3,
            time: '15:45',
            status: AppointmentStatus.SCHEDULED,
            queueStatus: null,
            position: null,
            reason: 'Knee pain follow-up',
            notes: null,
            bookingSource: BookingSource.RECEPTION,
            bookedMinutesBefore: 6 * 24 * 60,
        },
        {
            id: buildAppointmentId(41),
            doctorIndex: 5,
            patientIndex: 19,
            dateOffset: 4,
            time: '12:00',
            status: AppointmentStatus.CONFIRMED,
            queueStatus: null,
            position: null,
            reason: 'ENT review',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 8 * 24 * 60,
        },
        {
            id: buildAppointmentId(42),
            doctorIndex: 4,
            patientIndex: 18,
            dateOffset: 5,
            time: '13:15',
            status: AppointmentStatus.SCHEDULED,
            queueStatus: null,
            position: null,
            reason: 'Routine follow-up',
            notes: null,
            bookingSource: BookingSource.WEB,
            bookedMinutesBefore: 7 * 24 * 60,
        },
        {
            id: buildAppointmentId(43),
            doctorIndex: 0,
            patientIndex: 21,
            dateOffset: 7,
            time: '16:00',
            status: AppointmentStatus.CONFIRMED,
            queueStatus: null,
            position: null,
            reason: 'Medication review',
            notes: null,
            bookingSource: BookingSource.PHONE,
            bookedMinutesBefore: 16 * 24 * 60,
        },
    ];

    return appointmentDefinitions.map((appointmentDefinition) => {
        const scheduledAt = getClinicDateTime(
            addClinicDays(today, appointmentDefinition.dateOffset),
            appointmentDefinition.time,
            clinicTimezone
        );

        return {
            ...appointmentDefinition,
            scheduledAt,
            bookedAt: addMinutes(scheduledAt, -appointmentDefinition.bookedMinutesBefore),
        };
    });
};

async function main() {
    const configuredDemoClinicId = getDemoClinicId();
    const clinicTimezone = 'Asia/Kolkata';
    const today = getClinicTodayParts(clinicTimezone);

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

    const existingAdminUser = await prisma.user.findUnique({
        where: {
            clerkUserId: adminSeedUser.clerkUserId,
        },
        select: {
            clinicId: true,
        },
    });
    const clinicId = existingAdminUser?.clinicId ?? configuredDemoClinicId;
    const isReusingExistingAdminClinic = Boolean(existingAdminUser?.clinicId);
    const clinicUpdateData = {
        name: 'Pravaah Family Care',
        phone: '+91 00000 03000',
        email: 'frontdesk@pravaah.local',
        addressLine1: '101 Care Circle',
        addressLine2: 'Indiranagar Extension',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        pincode: '560000',
        timezone: clinicTimezone,
        openingTime: '09:00',
        closingTime: '18:00',
        slotDurationMinutes: 15,
        bufferMinutes: 5,
        lateArrivalGraceMinutes: 15,
        isActive: true,
    };

    const clinic = await prisma.clinic.upsert({
        where: {
            id: clinicId,
        },
        update: {
            ...clinicUpdateData,
            ...(clinicId === configuredDemoClinicId ? { slug: DEFAULT_DEMO_CLINIC_SLUG } : {}),
        },
        create: {
            id: clinicId,
            slug: DEFAULT_DEMO_CLINIC_SLUG,
            ...clinicUpdateData,
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
            fullName: process.env.SEED_STAFF_USER_FULL_NAME ?? 'Maya Front Desk',
            role: UserRole.STAFF,
            status: staffSeedUser.usesPlaceholder ? UserStatus.INVITED : UserStatus.ACTIVE,
            clinicId: clinic.id,
        },
        create: {
            clerkUserId: staffSeedUser.clerkUserId,
            fullName: process.env.SEED_STAFF_USER_FULL_NAME ?? 'Maya Front Desk',
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
                totalCompletedVisits: getSampleCompletedVisitCount(patient.history),
                totalNoShows: patient.history.totalNoShows,
                totalLateArrivals: patient.history.totalLateArrivals,
                lastVisitAt: null,
                distanceFromClinicKm: patient.history.distanceFromClinicKm,
                notes: stripSampleMarker(patient.history.notes),
                isActive: true,
            },
            create: {
                patientId: patient.id,
                clinicId: clinic.id,
                totalAppointments: patient.history.totalAppointments,
                totalCompletedVisits: getSampleCompletedVisitCount(patient.history),
                totalNoShows: patient.history.totalNoShows,
                totalLateArrivals: patient.history.totalLateArrivals,
                distanceFromClinicKm: patient.history.distanceFromClinicKm,
                notes: stripSampleMarker(patient.history.notes),
                isActive: true,
            },
        });
    }

    const appointmentSeeds = buildAppointmentSeeds(today, clinic.timezone);
    const appointmentSeedIds = appointmentSeeds.map((appointmentSeed) => appointmentSeed.id);

    const cleanupSummary = await prisma.$transaction(async (tx) => {
        const deletedNoShowPredictions = await tx.noShowPrediction.deleteMany({
            where: {
                appointmentId: {
                    in: appointmentSeedIds,
                },
            },
        });
        const deletedQueueEntries = await tx.queueEntry.deleteMany({
            where: {
                appointmentId: {
                    in: appointmentSeedIds,
                },
            },
        });
        const deletedAppointments = await tx.appointment.deleteMany({
            where: {
                id: {
                    in: appointmentSeedIds,
                },
            },
        });

        return {
            appointments: deletedAppointments.count,
            queueEntries: deletedQueueEntries.count,
            noShowPredictions: deletedNoShowPredictions.count,
        };
    });

    for (const appointmentSeed of appointmentSeeds) {
        const doctor = doctors[appointmentSeed.doctorIndex];
        const patient = patients[appointmentSeed.patientIndex];

        if (!patient) {
            throw new Error(`Seed patient not found for appointment ${appointmentSeed.id}`);
        }

        if (!doctor) {
            throw new Error(`Seed doctor not found for appointment ${appointmentSeed.id}`);
        }

        const completedAppointmentCount = getSampleCompletedVisitCount(patient.history);
        const noShowPrediction = predictNoShowRisk({
            scheduledAt: appointmentSeed.scheduledAt,
            bookedAt: appointmentSeed.bookedAt,
            patientNoShowCount: patient.history.totalNoShows,
            patientLateArrivalCount: patient.history.totalLateArrivals,
            patientCompletedAppointmentCount: completedAppointmentCount,
            distanceFromClinicKm: Number(patient.history.distanceFromClinicKm),
        });
        const arrivedAt =
            appointmentSeed.arrivalOffsetMinutes === undefined
                ? null
                : addMinutes(appointmentSeed.scheduledAt, appointmentSeed.arrivalOffsetMinutes);
        const arrivalOutcome = arrivedAt
            ? calculateArrivalOutcome({
                  scheduledAt: appointmentSeed.scheduledAt,
                  arrivedAt,
                  graceMinutes: clinic.lateArrivalGraceMinutes,
              })
            : null;

        const appointment = await prisma.appointment.create({
            data: {
                id: appointmentSeed.id,
                clinicId: clinic.id,
                doctorId: doctor.id,
                patientId: patient.id,
                createdByUserId: adminUser.id,
                scheduledAt: appointmentSeed.scheduledAt,
                durationMinutes: clinic.slotDurationMinutes,
                status: appointmentSeed.status,
                bookingSource: appointmentSeed.bookingSource,
                reason: appointmentSeed.reason,
                notes: appointmentSeed.notes,
                arrivedAt,
                arrivalOffsetMinutes: arrivalOutcome?.arrivalOffsetMinutes ?? null,
                isLateArrival: arrivalOutcome?.isLateArrival ?? null,
                lateArrivalGraceMinutes: arrivalOutcome?.lateArrivalGraceMinutes ?? null,
                createdAt: appointmentSeed.bookedAt,
            },
        });

        await prisma.noShowPrediction.create({
            data: {
                appointmentId: appointment.id,
                clinicId: clinic.id,
                patientId: appointment.patientId,
                riskLevel: noShowPrediction.riskLevel,
                score: noShowPrediction.score,
                reasons: noShowPrediction.reasons,
                createdAt: appointmentSeed.bookedAt,
            },
        });

        await prisma.patientClinic.update({
            where: {
                patientId_clinicId: {
                    patientId: patient.id,
                    clinicId: clinic.id,
                },
            },
            data: {
                totalAppointments: {
                    increment: 1,
                },
                ...(arrivalOutcome?.isLateArrival
                    ? {
                          totalLateArrivals: {
                              increment: 1,
                          },
                      }
                    : {}),
                ...(appointmentSeed.status === AppointmentStatus.COMPLETED
                    ? {
                          totalCompletedVisits: {
                              increment: 1,
                          },
                      }
                    : {}),
                ...(appointmentSeed.status === AppointmentStatus.NO_SHOW
                    ? {
                          totalNoShows: {
                              increment: 1,
                          },
                      }
                    : {}),
            },
        });

        const completedAt =
            appointmentSeed.status === AppointmentStatus.COMPLETED
                ? addMinutes(appointment.scheduledAt, 20)
                : null;

        if (appointmentSeed.queueStatus !== null && appointmentSeed.position !== null) {
            await prisma.queueEntry.create({
                data: {
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
                        appointmentSeed.queueStatus === QueueStatus.COMPLETED ? completedAt : null,
                },
            });
        }

        if (completedAt) {
            await prisma.patientClinic.updateMany({
                where: {
                    clinicId: clinic.id,
                    patientId: patient.id,
                    OR: [
                        {
                            lastVisitAt: null,
                        },
                        {
                            lastVisitAt: {
                                lt: completedAt,
                            },
                        },
                    ],
                },
                data: {
                    lastVisitAt: completedAt,
                },
            });
        }
    }

    const todayAppointmentCount = appointmentSeeds.filter(
        (appointmentSeed) => appointmentSeed.dateOffset === 0
    ).length;
    const historicalAppointmentCount = appointmentSeeds.filter(
        (appointmentSeed) => appointmentSeed.dateOffset < 0
    ).length;
    const futureAppointmentCount = appointmentSeeds.filter(
        (appointmentSeed) => appointmentSeed.dateOffset > 0
    ).length;
    const todayQueueEntryCount = appointmentSeeds.filter(
        (appointmentSeed) =>
            appointmentSeed.dateOffset === 0 && appointmentSeed.queueStatus !== null
    ).length;

    console.log('Seeded Pravaah localhost demo data:');
    console.log(`- clinicId: ${clinic.id}`);
    console.log(`- clinicSlug: ${clinic.slug}`);
    console.log(
        `- clinicSource: ${
            isReusingExistingAdminClinic
                ? 'reused configured Admin clinic'
                : 'used configured demo clinic'
        }`
    );
    console.log(`- adminUserId: ${adminUser.id}`);
    console.log(`- staffUserId: ${staffUser.id}`);
    console.log(`- doctors: ${doctors.length}`);
    console.log(`- patients: ${patients.length}`);
    console.log(`- appointments: ${appointmentSeeds.length}`);
    console.log(`- today: ${getClinicDateLabel(today)}`);
    console.log(`- todayAppointments: ${todayAppointmentCount}`);
    console.log(`- historicalAppointments: ${historicalAppointmentCount}`);
    console.log(`- futureAppointments: ${futureAppointmentCount}`);
    console.log(`- todayQueueEntries: ${todayQueueEntryCount}`);
    console.log(
        `- refreshedOldSeedRows: ${cleanupSummary.appointments} appointments, ${cleanupSummary.queueEntries} queue entries, ${cleanupSummary.noShowPredictions} predictions`
    );
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
