import { Gender } from '../../generated/prisma/client.js';

export const SAMPLE_DATA_NOTE_MARKER = '[Pravaah fictional sample data]';
export const SAMPLE_DOCTOR_REGISTRATION_PREFIX = 'PRAVAAH-SAMPLE';

export type ClinicDateParts = {
    year: number;
    month: number;
    day: number;
};

export type SampleDoctorDefinition = {
    id: string;
    fullName: string;
    specialization: string;
    qualification: string;
    registrationNumber: string;
    phone: string;
    email: string;
    gender: Gender;
    experienceYears: number;
    displayName: string;
    consultationFee: string;
};

export type SamplePatientDefinition = {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    gender: Gender;
    age: number;
    address: string;
    city: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    history: {
        totalAppointments: number;
        totalNoShows: number;
        totalLateArrivals: number;
        distanceFromClinicKm: string;
        notes: string;
    };
};

export const sampleDoctorDefinitions: SampleDoctorDefinition[] = [
    {
        id: '10000000-0000-4000-8000-000000000001',
        fullName: 'Dr. Asha Raman',
        specialization: 'Family Medicine',
        qualification: 'MBBS, DNB Family Medicine',
        registrationNumber: 'DEMO-KMC-1001',
        phone: '+91 00000 01001',
        email: 'asha.raman@example.test',
        gender: Gender.FEMALE,
        experienceYears: 12,
        displayName: 'Dr. Asha',
        consultationFee: '650.00',
    },
    {
        id: '10000000-0000-4000-8000-000000000002',
        fullName: 'Dr. Nikhil Varma',
        specialization: 'Pediatrics',
        qualification: 'MBBS, MD Pediatrics',
        registrationNumber: 'DEMO-KMC-1002',
        phone: '+91 00000 01002',
        email: 'nikhil.varma@example.test',
        gender: Gender.MALE,
        experienceYears: 9,
        displayName: 'Dr. Nikhil',
        consultationFee: '700.00',
    },
    {
        id: '10000000-0000-4000-8000-000000000003',
        fullName: 'Dr. Leela Nair',
        specialization: 'General Physician',
        qualification: 'MBBS',
        registrationNumber: 'DEMO-KMC-1003',
        phone: '+91 00000 01003',
        email: 'leela.nair@example.test',
        gender: Gender.FEMALE,
        experienceYears: 7,
        displayName: 'Dr. Leela',
        consultationFee: '550.00',
    },
];

export const samplePatientDefinitions: SamplePatientDefinition[] = [
    {
        id: '20000000-0000-4000-8000-000000000001',
        fullName: 'Riya Malhotra',
        phone: '+91 00000 02001',
        email: 'riya.malhotra@example.test',
        gender: Gender.FEMALE,
        age: 31,
        address: 'Flat 2A, Demo Residency',
        city: 'Bengaluru',
        emergencyContactName: 'Arun Malhotra',
        emergencyContactPhone: '+91 00000 02901',
        history: {
            totalAppointments: 8,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '2.40',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Low-risk patient with consistent attendance.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000002',
        fullName: 'Kabir Sen',
        phone: '+91 00000 02002',
        email: 'kabir.sen@example.test',
        gender: Gender.MALE,
        age: 44,
        address: '18 Demo Cross Road',
        city: 'Bengaluru',
        emergencyContactName: 'Mira Sen',
        emergencyContactPhone: '+91 00000 02902',
        history: {
            totalAppointments: 1,
            totalNoShows: 0,
            totalLateArrivals: 1,
            distanceFromClinicKm: '9.00',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Medium-risk patient with one late arrival and moderate travel distance.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000003',
        fullName: 'Anika Iyer',
        phone: '+91 00000 02003',
        email: 'anika.iyer@example.test',
        gender: Gender.FEMALE,
        age: 27,
        address: '42 Fictional Layout',
        city: 'Bengaluru',
        emergencyContactName: 'Dev Iyer',
        emergencyContactPhone: '+91 00000 02903',
        history: {
            totalAppointments: 5,
            totalNoShows: 2,
            totalLateArrivals: 3,
            distanceFromClinicKm: '18.00',
            notes: `${SAMPLE_DATA_NOTE_MARKER} High-risk patient with repeated no-shows and late arrivals.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000004',
        fullName: 'Meera Kapoor',
        phone: '+91 00000 02004',
        email: 'meera.kapoor@example.test',
        gender: Gender.FEMALE,
        age: 38,
        address: '7 Sample Street',
        city: 'Bengaluru',
        emergencyContactName: 'Naveen Kapoor',
        emergencyContactPhone: '+91 00000 02904',
        history: {
            totalAppointments: 4,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '3.10',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Low-risk returning patient.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000005',
        fullName: 'Omar Khan',
        phone: '+91 00000 02005',
        email: 'omar.khan@example.test',
        gender: Gender.MALE,
        age: 52,
        address: '12 Placeholder Avenue',
        city: 'Bengaluru',
        emergencyContactName: 'Sara Khan',
        emergencyContactPhone: '+91 00000 02905',
        history: {
            totalAppointments: 2,
            totalNoShows: 1,
            totalLateArrivals: 1,
            distanceFromClinicKm: '11.50',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Medium-risk patient with some attendance concerns.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000006',
        fullName: 'Tara Dsouza',
        phone: '+91 00000 02006',
        email: 'tara.dsouza@example.test',
        gender: Gender.FEMALE,
        age: 24,
        address: '5 Training Clinic Lane',
        city: 'Bengaluru',
        emergencyContactName: 'Joel Dsouza',
        emergencyContactPhone: '+91 00000 02906',
        history: {
            totalAppointments: 0,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '5.80',
            notes: `${SAMPLE_DATA_NOTE_MARKER} New patient with no prior clinic history.`,
        },
    },
];

const getNumberPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) => {
    return Number(parts.find((part) => part.type === type)?.value);
};

export const getClinicTodayParts = (timeZone: string, now = new Date()): ClinicDateParts => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);

    return {
        year: getNumberPart(parts, 'year'),
        month: getNumberPart(parts, 'month'),
        day: getNumberPart(parts, 'day'),
    };
};

export const addClinicDays = (dateParts: ClinicDateParts, dayOffset: number): ClinicDateParts => {
    const utcDate = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day));
    utcDate.setUTCDate(utcDate.getUTCDate() + dayOffset);

    return {
        year: utcDate.getUTCFullYear(),
        month: utcDate.getUTCMonth() + 1,
        day: utcDate.getUTCDate(),
    };
};

const padDatePart = (value: number): string => String(value).padStart(2, '0');

export const getClinicDateLabel = (dateParts: ClinicDateParts): string => {
    return `${dateParts.year}-${padDatePart(dateParts.month)}-${padDatePart(dateParts.day)}`;
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    const equivalentUtcMs = Date.UTC(
        getNumberPart(parts, 'year'),
        getNumberPart(parts, 'month') - 1,
        getNumberPart(parts, 'day'),
        getNumberPart(parts, 'hour'),
        getNumberPart(parts, 'minute'),
        getNumberPart(parts, 'second')
    );

    return equivalentUtcMs - date.getTime();
};

export const getClinicDateTime = (
    dateParts: ClinicDateParts,
    time: string,
    timeZone: string
): Date => {
    const [hour = 0, minute = 0] = time.split(':').map(Number);
    const localWallClockMs = Date.UTC(
        dateParts.year,
        dateParts.month - 1,
        dateParts.day,
        hour,
        minute
    );
    const firstGuess = new Date(localWallClockMs);
    const firstOffset = getTimeZoneOffsetMs(firstGuess, timeZone);
    const adjustedGuess = new Date(localWallClockMs - firstOffset);
    const adjustedOffset = getTimeZoneOffsetMs(adjustedGuess, timeZone);

    return new Date(localWallClockMs - adjustedOffset);
};

export const addMinutes = (date: Date, minutes: number): Date => {
    return new Date(date.getTime() + minutes * 60 * 1000);
};
