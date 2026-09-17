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
    history: SamplePatientHistoryDefinition;
};

export type SamplePatientHistoryDefinition = {
    totalAppointments: number;
    totalNoShows: number;
    totalLateArrivals: number;
    distanceFromClinicKm: string;
    notes: string;
};

export const getSampleCompletedVisitCount = (
    history: Pick<SamplePatientHistoryDefinition, 'totalAppointments' | 'totalNoShows'>
): number => {
    // Fictional prior-history baselines model every non-no-show appointment as completed.
    return Math.max(history.totalAppointments - history.totalNoShows, 0);
};

export const sampleDoctorDefinitions: SampleDoctorDefinition[] = [
    {
        id: '10000000-0000-4000-8000-000000000001',
        fullName: 'Dr. Asha Raman',
        specialization: 'General Physician',
        qualification: 'MBBS, DNB Family Medicine',
        registrationNumber: 'PRV-KA-1001',
        phone: '+91 00000 01001',
        email: 'asha.raman@example.test',
        gender: Gender.FEMALE,
        experienceYears: 12,
        displayName: 'Dr. Asha Raman',
        consultationFee: '650.00',
    },
    {
        id: '10000000-0000-4000-8000-000000000002',
        fullName: 'Dr. Nikhil Varma',
        specialization: 'Pediatrician',
        qualification: 'MBBS, MD Pediatrics',
        registrationNumber: 'PRV-KA-1002',
        phone: '+91 00000 01002',
        email: 'nikhil.varma@example.test',
        gender: Gender.MALE,
        experienceYears: 9,
        displayName: 'Dr. Nikhil Varma',
        consultationFee: '700.00',
    },
    {
        id: '10000000-0000-4000-8000-000000000003',
        fullName: 'Dr. Leela Nair',
        specialization: 'Dermatologist',
        qualification: 'MBBS, MD Dermatology',
        registrationNumber: 'PRV-KA-1003',
        phone: '+91 00000 01003',
        email: 'leela.nair@example.test',
        gender: Gender.FEMALE,
        experienceYears: 10,
        displayName: 'Dr. Leela Nair',
        consultationFee: '750.00',
    },
    {
        id: '10000000-0000-4000-8000-000000000004',
        fullName: 'Dr. Arjun Menon',
        specialization: 'Orthopedic Specialist',
        qualification: 'MBBS, MS Orthopedics',
        registrationNumber: 'PRV-KA-1004',
        phone: '+91 00000 01004',
        email: 'arjun.menon@example.test',
        gender: Gender.MALE,
        experienceYears: 14,
        displayName: 'Dr. Arjun Menon',
        consultationFee: '800.00',
    },
    {
        id: '10000000-0000-4000-8000-000000000005',
        fullName: 'Dr. Farah Siddiqui',
        specialization: 'Gynecologist',
        qualification: 'MBBS, MS Obstetrics and Gynecology',
        registrationNumber: 'PRV-KA-1005',
        phone: '+91 00000 01005',
        email: 'farah.siddiqui@example.test',
        gender: Gender.FEMALE,
        experienceYears: 11,
        displayName: 'Dr. Farah Siddiqui',
        consultationFee: '850.00',
    },
    {
        id: '10000000-0000-4000-8000-000000000006',
        fullName: 'Dr. Vivek Bhat',
        specialization: 'ENT Specialist',
        qualification: 'MBBS, MS ENT',
        registrationNumber: 'PRV-KA-1006',
        phone: '+91 00000 01006',
        email: 'vivek.bhat@example.test',
        gender: Gender.MALE,
        experienceYears: 8,
        displayName: 'Dr. Vivek Bhat',
        consultationFee: '700.00',
    },
];

export const samplePatientDefinitions: SamplePatientDefinition[] = [
    {
        id: '20000000-0000-4000-8000-000000000001',
        fullName: 'Ishita Rao',
        phone: '+91 00000 02001',
        email: 'ishita.rao@example.test',
        gender: Gender.FEMALE,
        age: 34,
        address: '12 Lotus Avenue',
        city: 'Bengaluru',
        emergencyContactName: 'Rohan Rao',
        emergencyContactPhone: '+91 00000 02901',
        history: {
            totalAppointments: 10,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '2.10',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Reliable returning patient with consistent attendance.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000002',
        fullName: 'Rajiv Balan',
        phone: '+91 00000 02002',
        email: 'rajiv.balan@example.test',
        gender: Gender.MALE,
        age: 46,
        address: '18 Palm Cross Road',
        city: 'Bengaluru',
        emergencyContactName: 'Mira Balan',
        emergencyContactPhone: '+91 00000 02902',
        history: {
            totalAppointments: 2,
            totalNoShows: 0,
            totalLateArrivals: 2,
            distanceFromClinicKm: '10.20',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Usually attends, with a couple of late arrivals.`,
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
            totalAppointments: 7,
            totalNoShows: 2,
            totalLateArrivals: 3,
            distanceFromClinicKm: '18.00',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Higher-risk attendance history for assistance review.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000004',
        fullName: 'Meera Kapoor',
        phone: '+91 00000 02004',
        email: 'meera.kapoor@example.test',
        gender: Gender.FEMALE,
        age: 38,
        address: '7 Orchid Street',
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
        fullName: 'Aarav Shah',
        phone: '+91 00000 02005',
        email: 'aarav.shah@example.test',
        gender: Gender.MALE,
        age: 8,
        address: '22 Maple Enclave',
        city: 'Bengaluru',
        emergencyContactName: 'Neha Shah',
        emergencyContactPhone: '+91 00000 02905',
        history: {
            totalAppointments: 4,
            totalNoShows: 0,
            totalLateArrivals: 1,
            distanceFromClinicKm: '4.20',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Pediatric returning patient with regular follow-up visits.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000006',
        fullName: 'Kiara Thomas',
        phone: '+91 00000 02006',
        email: 'kiara.thomas@example.test',
        gender: Gender.FEMALE,
        age: 26,
        address: '5 Cedar Clinic Road',
        city: 'Bengaluru',
        emergencyContactName: 'Joel Thomas',
        emergencyContactPhone: '+91 00000 02906',
        history: {
            totalAppointments: 0,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '7.50',
            notes: `${SAMPLE_DATA_NOTE_MARKER} New patient with no prior clinic history.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000007',
        fullName: 'Kabir Sen',
        phone: '+91 00000 02007',
        email: 'kabir.sen@example.test',
        gender: Gender.MALE,
        age: 44,
        address: '31 Banyan Main Road',
        city: 'Bengaluru',
        emergencyContactName: 'Mira Sen',
        emergencyContactPhone: '+91 00000 02907',
        history: {
            totalAppointments: 2,
            totalNoShows: 1,
            totalLateArrivals: 1,
            distanceFromClinicKm: '11.50',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Returning patient with one missed visit.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000008',
        fullName: 'Sahana Kulkarni',
        phone: '+91 00000 02008',
        email: 'sahana.kulkarni@example.test',
        gender: Gender.FEMALE,
        age: 29,
        address: '4 Rain Tree Lane',
        city: 'Bengaluru',
        emergencyContactName: 'Vikram Kulkarni',
        emergencyContactPhone: '+91 00000 02908',
        history: {
            totalAppointments: 6,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '3.40',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Reliable returning patient.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000009',
        fullName: 'Manav Reddy',
        phone: '+91 00000 02009',
        email: 'manav.reddy@example.test',
        gender: Gender.MALE,
        age: 57,
        address: '16 Jasmine Residency',
        city: 'Bengaluru',
        emergencyContactName: 'Lakshmi Reddy',
        emergencyContactPhone: '+91 00000 02909',
        history: {
            totalAppointments: 9,
            totalNoShows: 0,
            totalLateArrivals: 1,
            distanceFromClinicKm: '6.80',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Long-term patient with stable attendance.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000010',
        fullName: 'Zoya Khan',
        phone: '+91 00000 02010',
        email: 'zoya.khan@example.test',
        gender: Gender.FEMALE,
        age: 33,
        address: '27 Silver Oak Street',
        city: 'Bengaluru',
        emergencyContactName: 'Imran Khan',
        emergencyContactPhone: '+91 00000 02910',
        history: {
            totalAppointments: 3,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '2.90',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Returning patient with steady follow-up.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000011',
        fullName: 'Rehan Dsouza',
        phone: '+91 00000 02011',
        email: 'rehan.dsouza@example.test',
        gender: Gender.MALE,
        age: 16,
        address: '9 Fern Layout',
        city: 'Bengaluru',
        emergencyContactName: 'Tara Dsouza',
        emergencyContactPhone: '+91 00000 02911',
        history: {
            totalAppointments: 1,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '5.60',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Recent patient with limited clinic history.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000012',
        fullName: 'Devika Pillai',
        phone: '+91 00000 02012',
        email: 'devika.pillai@example.test',
        gender: Gender.FEMALE,
        age: 62,
        address: '14 Neem Avenue',
        city: 'Bengaluru',
        emergencyContactName: 'Anil Pillai',
        emergencyContactPhone: '+91 00000 02912',
        history: {
            totalAppointments: 12,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '3.00',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Senior returning patient with strong attendance.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000013',
        fullName: 'Vihaan Mehta',
        phone: '+91 00000 02013',
        email: 'vihaan.mehta@example.test',
        gender: Gender.MALE,
        age: 6,
        address: '3 Ashoka Court',
        city: 'Bengaluru',
        emergencyContactName: 'Priya Mehta',
        emergencyContactPhone: '+91 00000 02913',
        history: {
            totalAppointments: 2,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '4.70',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Pediatric patient with recent follow-ups.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000014',
        fullName: 'Naina Chatterjee',
        phone: '+91 00000 02014',
        email: 'naina.chatterjee@example.test',
        gender: Gender.FEMALE,
        age: 41,
        address: '20 Garden View Road',
        city: 'Bengaluru',
        emergencyContactName: 'Samar Chatterjee',
        emergencyContactPhone: '+91 00000 02914',
        history: {
            totalAppointments: 3,
            totalNoShows: 1,
            totalLateArrivals: 1,
            distanceFromClinicKm: '13.20',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Attendance history suggests a confirmation call may help.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000015',
        fullName: 'Armaan Gill',
        phone: '+91 00000 02015',
        email: 'armaan.gill@example.test',
        gender: Gender.MALE,
        age: 39,
        address: '8 Frangipani Street',
        city: 'Bengaluru',
        emergencyContactName: 'Simran Gill',
        emergencyContactPhone: '+91 00000 02915',
        history: {
            totalAppointments: 5,
            totalNoShows: 0,
            totalLateArrivals: 2,
            distanceFromClinicKm: '8.40',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Returning patient who is occasionally late.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000016',
        fullName: 'Ritika Narang',
        phone: '+91 00000 02016',
        email: 'ritika.narang@example.test',
        gender: Gender.FEMALE,
        age: 48,
        address: '11 Copper Leaf Drive',
        city: 'Bengaluru',
        emergencyContactName: 'Amit Narang',
        emergencyContactPhone: '+91 00000 02916',
        history: {
            totalAppointments: 7,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '1.90',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Reliable patient for regular reviews.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000017',
        fullName: 'Pranav Joshi',
        phone: '+91 00000 02017',
        email: 'pranav.joshi@example.test',
        gender: Gender.MALE,
        age: 52,
        address: '24 Gulmohar Road',
        city: 'Bengaluru',
        emergencyContactName: 'Sonal Joshi',
        emergencyContactPhone: '+91 00000 02917',
        history: {
            totalAppointments: 1,
            totalNoShows: 1,
            totalLateArrivals: 2,
            distanceFromClinicKm: '16.40',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Higher-risk profile used for assistance review.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000018',
        fullName: 'Aaliya Sheikh',
        phone: '+91 00000 02018',
        email: 'aaliya.sheikh@example.test',
        gender: Gender.FEMALE,
        age: 30,
        address: '6 Magnolia Court',
        city: 'Bengaluru',
        emergencyContactName: 'Sameer Sheikh',
        emergencyContactPhone: '+91 00000 02918',
        history: {
            totalAppointments: 6,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '3.80',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Regular patient with strong attendance.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000019',
        fullName: 'Harini Subramanian',
        phone: '+91 00000 02019',
        email: 'harini.subramanian@example.test',
        gender: Gender.FEMALE,
        age: 36,
        address: '2 Rain Lily Square',
        city: 'Bengaluru',
        emergencyContactName: 'Karthik Subramanian',
        emergencyContactPhone: '+91 00000 02919',
        history: {
            totalAppointments: 4,
            totalNoShows: 0,
            totalLateArrivals: 1,
            distanceFromClinicKm: '5.10',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Returning patient with one late arrival.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000020',
        fullName: 'Naveen Patil',
        phone: '+91 00000 02020',
        email: 'naveen.patil@example.test',
        gender: Gender.MALE,
        age: 67,
        address: '17 Hibiscus Lane',
        city: 'Bengaluru',
        emergencyContactName: 'Kavita Patil',
        emergencyContactPhone: '+91 00000 02920',
        history: {
            totalAppointments: 8,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '2.60',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Senior patient with dependable attendance.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000021',
        fullName: 'Maya Nambiar',
        phone: '+91 00000 02021',
        email: 'maya.nambiar@example.test',
        gender: Gender.FEMALE,
        age: 23,
        address: '10 Peepal Street',
        city: 'Bengaluru',
        emergencyContactName: 'Ravi Nambiar',
        emergencyContactPhone: '+91 00000 02921',
        history: {
            totalAppointments: 0,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '9.40',
            notes: `${SAMPLE_DATA_NOTE_MARKER} New patient with moderate travel distance.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000022',
        fullName: 'Siddharth Bose',
        phone: '+91 00000 02022',
        email: 'siddharth.bose@example.test',
        gender: Gender.MALE,
        age: 45,
        address: '19 Laurel Park',
        city: 'Bengaluru',
        emergencyContactName: 'Rhea Bose',
        emergencyContactPhone: '+91 00000 02922',
        history: {
            totalAppointments: 5,
            totalNoShows: 1,
            totalLateArrivals: 0,
            distanceFromClinicKm: '12.30',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Returning patient with one previous no-show.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000023',
        fullName: 'Avni Deshpande',
        phone: '+91 00000 02023',
        email: 'avni.deshpande@example.test',
        gender: Gender.FEMALE,
        age: 12,
        address: '1 Coral Apartments',
        city: 'Bengaluru',
        emergencyContactName: 'Madhav Deshpande',
        emergencyContactPhone: '+91 00000 02923',
        history: {
            totalAppointments: 3,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: '4.10',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Pediatric patient with regular visits.`,
        },
    },
    {
        id: '20000000-0000-4000-8000-000000000024',
        fullName: 'Omar Khan',
        phone: '+91 00000 02024',
        email: 'omar.khan@example.test',
        gender: Gender.MALE,
        age: 54,
        address: '12 Sandalwood Avenue',
        city: 'Bengaluru',
        emergencyContactName: 'Sara Khan',
        emergencyContactPhone: '+91 00000 02924',
        history: {
            totalAppointments: 2,
            totalNoShows: 1,
            totalLateArrivals: 1,
            distanceFromClinicKm: '11.50',
            notes: `${SAMPLE_DATA_NOTE_MARKER} Medium-risk returning patient.`,
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
