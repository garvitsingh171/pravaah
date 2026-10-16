import {
    AppointmentStatus,
    BookingSource,
    Gender,
    QueueStatus,
    RiskLevel,
    UserRole,
    UserStatus,
    Weekday,
    type AppointmentCancellationReason,
    type AppointmentNoShowReason,
} from '../src/generated/prisma/client.js';
import { calculateArrivalOutcome } from '../src/modules/appointments/appointment.arrival.js';
import { predictNoShowRisk } from '../src/modules/predictions/prediction.service.js';
import type { SeedProfile } from './seed.config.js';

export const SEED_NAMESPACE = 'pravaah-local-seed-v1';
const clinics = [
    ['10000000-0000-4000-8000-000000000001', 'Aarohan Family Clinic', 'aarohan-family-clinic', 'Bengaluru', 'Karnataka', '560038', '101 Care Circle'],
    ['10000000-0000-4000-8000-000000000002', 'Niramaya Specialty Centre', 'niramaya-specialty-centre', 'Pune', 'Maharashtra', '411014', '22 Wellness Avenue'],
    ['10000000-0000-4000-8000-000000000003', 'Sukoon Community Clinic', 'sukoon-community-clinic', 'Jaipur', 'Rajasthan', '302017', '7 Shanti Marg'],
] as const;

const profileCounts: Record<SeedProfile, { clinics: number; doctors: number; patients: number; appointments: number }> = {
    small: { clinics: 2, doctors: 6, patients: 24, appointments: 72 },
    demo: { clinics: 3, doctors: 15, patients: 150, appointments: 480 },
    stress: { clinics: 3, doctors: 24, patients: 420, appointments: 1200 },
};

const firstNames = ['Aarav', 'Anaya', 'Ishaan', 'Meera', 'Kabir', 'Tara', 'Rohan', 'Diya', 'Vivaan', 'Nisha', 'Arjun', 'Kavya'];
const lastNames = ['Mehta', 'Iyer', 'Kapoor', 'Nair', 'Bose', 'Shah', 'Rao', 'Joshi', 'Menon', 'Patil', 'Sethi', 'Desai'];
const specialties = ['General Medicine', 'Pediatrics', 'Dermatology', 'Orthopedics', 'ENT', 'Cardiology', 'Gynecology'];
const weekdays = [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY, Weekday.SATURDAY];
const activeAppointmentStatuses = [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED, AppointmentStatus.IN_QUEUE, AppointmentStatus.CALLED];

export type Fixture = ReturnType<typeof generateFixtures>;

const uuid = (prefix: string, number: number): string => `${prefix}${String(number).padStart(7, '0')}-0000-4000-8000-000000000001`;

const dateAt = (anchorDate: string, dayOffset: number, time: string): Date => {
    const [year, month, day] = anchorDate.split('-').map(Number) as [number, number, number];
    const base = new Date(Date.UTC(year, month - 1, day + dayOffset, 0, 0, 0));
    const [hours, minutes] = time.split(':').map(Number) as [number, number];
    // Asia/Kolkata is UTC+05:30 and is the configured application timezone.
    return new Date(base.getTime() + (hours * 60 + minutes - 330) * 60_000);
};

const addMinutes = (value: Date, minutes: number): Date => new Date(value.getTime() + minutes * 60_000);

const seededRandom = (seed: number) => {
    let state = seed >>> 0;
    return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 0x100000000;
    };
};

export function generateFixtures(profile: SeedProfile, anchorDate: string) {
    const counts = profileCounts[profile];
    const random = seededRandom(20261016);
    const clinicRows = clinics.slice(0, counts.clinics).map(([clinicId, name, slug, city, state, pincode, addressLine1], index) => ({
        id: clinicId, name, slug, city, state, pincode, addressLine1,
        phone: `+91 00000 03${String(index + 1).padStart(3, '0')}`,
        email: `frontdesk-${slug}@example.test`,
        openingTime: '09:00', closingTime: '18:00', slotDurationMinutes: 15, bufferMinutes: 5, lateArrivalGraceMinutes: 15,
    }));
    const userRows = clinicRows.flatMap((clinic, clinicIndex) => [
        { id: uuid('3', clinicIndex * 10 + 1), clerkUserId: clinicIndex === 0 ? 'BOUND_ADMIN' : `seed-admin-${clinicIndex + 1}`, fullName: `${clinic.name} Admin`, email: `admin-${clinic.slug}@example.test`, role: UserRole.ADMIN, status: UserStatus.ACTIVE, clinicId: clinic.id },
        { id: uuid('3', clinicIndex * 10 + 2), clerkUserId: clinicIndex === 0 ? 'BOUND_STAFF' : `seed-staff-${clinicIndex + 1}`, fullName: `${clinic.name} Reception`, email: `staff-${clinic.slug}@example.test`, role: UserRole.STAFF, status: UserStatus.INVITED, clinicId: clinic.id },
    ]);
    const doctorRows = Array.from({ length: counts.doctors }, (_, index) => ({
        id: uuid('4', index + 1), fullName: `Dr. ${firstNames[index % firstNames.length]} ${lastNames[(index + 3) % lastNames.length]}`,
        specialization: specialties[index % specialties.length], qualification: 'MBBS, MD', registrationNumber: `PRV-SAMPLE-${String(index + 1).padStart(4, '0')}`,
        phone: `+91 00000 ${String(1000 + index).slice(-4)}`, email: `doctor-${index + 1}@example.test`, gender: index % 2 ? Gender.MALE : Gender.FEMALE, experienceYears: 5 + (index % 16), isActive: true,
    }));
    const doctorClinicRows = doctorRows.flatMap((doctor, index) => clinicRows.filter((_, clinicIndex) => index % counts.clinics === clinicIndex || (index % 5 === 0 && clinicIndex === 0)).map((clinic) => ({ id: uuid('5', index * 3 + clinicRows.indexOf(clinic) + 1), doctorId: doctor.id, clinicId: clinic.id, displayName: doctor.fullName, consultationFee: `${500 + (index % 6) * 100}.00` })));
    const availabilityRows = doctorClinicRows.flatMap((link, linkIndex) => weekdays.slice(0, linkIndex % 4 === 0 ? 6 : 5).map((weekday, weekdayIndex) => ({ id: uuid('6', linkIndex * 10 + weekdayIndex + 1), doctorClinicId: link.id, weekday, startTime: weekdayIndex % 2 ? '10:00' : '09:00', endTime: weekdayIndex % 2 ? '18:00' : '17:00' })));
    const patientRows = Array.from({ length: counts.patients }, (_, index) => ({
        id: uuid('7', index + 1), fullName: `${firstNames[index % firstNames.length]} ${lastNames[(index * 7) % lastNames.length]}`,
        phone: `+91 70000 ${String(10000 + index).slice(-5)}`, email: `patient-${index + 1}@example.test`, gender: [Gender.FEMALE, Gender.MALE, Gender.OTHER][index % 3], age: 6 + (index * 7) % 72,
        addressLine1: `${10 + index} Fictional Residency`, city: clinicRows[index % clinicRows.length]!.city, state: clinicRows[index % clinicRows.length]!.state, country: 'India', pincode: clinicRows[index % clinicRows.length]!.pincode,
        emergencyContactName: `Emergency Contact ${index + 1}`, emergencyContactPhone: `+91 80000 ${String(10000 + index).slice(-5)}`,
    }));
    const patientClinicRows = patientRows.flatMap((patient, index) => clinicRows.filter((_, clinicIndex) => index % counts.clinics === clinicIndex || (index % 11 === 0 && clinicIndex === 0)).map((clinic, clinicIndex) => ({ patientId: patient.id, clinicId: clinic.id, distanceFromClinicKm: `${(2 + ((index * 13 + clinicIndex) % 190) / 10).toFixed(2)}` })));

    const appointmentRows: Array<{
        id: string; clinicId: string; doctorId: string; patientId: string; createdByUserId: string; scheduledAt: Date; createdAt: Date; status: AppointmentStatus; bookingSource: BookingSource; reason: string; durationMinutes: number; cancellationReason?: AppointmentCancellationReason; cancellationNote?: string; noShowReason?: AppointmentNoShowReason; noShowNote?: string; arrivedAt?: Date; arrivalOffsetMinutes?: number; isLateArrival?: boolean; lateArrivalGraceMinutes?: number; queueStatus: QueueStatus | null; position: number | null;
    }> = [];
    const positionByScope = new Map<string, number>();
    for (let index = 0; index < counts.appointments; index += 1) {
        const clinic = clinicRows[Math.min(Math.floor(index / Math.ceil(counts.appointments / clinicRows.length)), clinicRows.length - 1)]!;
        const links = doctorClinicRows.filter((link) => link.clinicId === clinic.id);
        const link = links[index % links.length]!;
        const patientLinks = patientClinicRows.filter((linkRow) => linkRow.clinicId === clinic.id);
        const patientLink = patientLinks[(index % 10 <= 1 ? index % 5 : index * 7) % patientLinks.length]!;
        const cycle = index % 10;
        const dayOffset = index < counts.appointments * 0.6 ? -60 + (index % 61) : index < counts.appointments * 0.8 ? 0 : 1 + (index % 29);
        const status = cycle === 0 ? AppointmentStatus.CANCELLED : cycle === 1 ? AppointmentStatus.NO_SHOW : cycle === 2 ? AppointmentStatus.COMPLETED : cycle === 3 ? AppointmentStatus.CALLED : cycle === 4 ? AppointmentStatus.IN_QUEUE : cycle === 5 ? AppointmentStatus.ARRIVED : cycle < 8 ? AppointmentStatus.CONFIRMED : AppointmentStatus.SCHEDULED;
        const scheduledAt = dateAt(anchorDate, dayOffset, `${String(9 + (index % 9)).padStart(2, '0')}:${String((index * 15) % 60).padStart(2, '0')}`);
        const createdAt = addMinutes(scheduledAt, -(status === AppointmentStatus.SCHEDULED ? 48 * 60 : 3 * 24 * 60));
        const arrivalOffset = [AppointmentStatus.ARRIVED, AppointmentStatus.IN_QUEUE, AppointmentStatus.CALLED, AppointmentStatus.COMPLETED].includes(status) ? (index % 7 === 0 ? 22 : index % 5) : undefined;
        const arrival = arrivalOffset === undefined ? undefined : calculateArrivalOutcome({ scheduledAt, arrivedAt: addMinutes(scheduledAt, arrivalOffset), graceMinutes: 15 });
        const queueStatus = status === AppointmentStatus.SCHEDULED || status === AppointmentStatus.CONFIRMED ? null : status === AppointmentStatus.IN_QUEUE ? QueueStatus.WAITING : status === AppointmentStatus.ARRIVED ? QueueStatus.ARRIVED : status === AppointmentStatus.CALLED ? QueueStatus.CALLED : status === AppointmentStatus.COMPLETED ? QueueStatus.COMPLETED : status === AppointmentStatus.CANCELLED ? QueueStatus.CANCELLED : QueueStatus.NO_SHOW;
        const scope = `${clinic.id}:${link.doctorId}:${anchorDate}:${dayOffset}`;
        const position = queueStatus === null ? null : (positionByScope.set(scope, (positionByScope.get(scope) ?? 0) + 1), positionByScope.get(scope)!);
        appointmentRows.push({ id: uuid('8', index + 1), clinicId: clinic.id, doctorId: link.doctorId, patientId: patientLink.patientId, createdByUserId: userRows.find((user) => user.clinicId === clinic.id && user.role === UserRole.ADMIN)!.id, scheduledAt, createdAt, status, bookingSource: [BookingSource.RECEPTION, BookingSource.PHONE, BookingSource.WEB, BookingSource.WALK_IN][index % 4]!, reason: ['Routine follow-up', 'New patient consultation', 'Medication review', 'Preventive care'][index % 4]!, durationMinutes: 15, ...(status === AppointmentStatus.CANCELLED ? { cancellationReason: 'PATIENT_REQUEST' as AppointmentCancellationReason, cancellationNote: 'Fictional patient requested a different date.' } : {}), ...(status === AppointmentStatus.NO_SHOW ? { noShowReason: 'UNKNOWN' as AppointmentNoShowReason, noShowNote: 'Fictional reception follow-up recorded.' } : {}), ...(arrival ? { arrivedAt: addMinutes(scheduledAt, arrivalOffset!), arrivalOffsetMinutes: arrival.arrivalOffsetMinutes, isLateArrival: arrival.isLateArrival, lateArrivalGraceMinutes: arrival.lateArrivalGraceMinutes } : {}), queueStatus, position });
    }
    // Make the generated fixture consume its PRNG so future additions do not accidentally change the seed contract.
    random();
    return { counts, clinics: clinicRows, users: userRows, doctors: doctorRows, doctorClinics: doctorClinicRows, availability: availabilityRows, patients: patientRows, patientClinics: patientClinicRows, appointments: appointmentRows, activeAppointmentStatuses, predictNoShowRisk, RiskLevel };
}

