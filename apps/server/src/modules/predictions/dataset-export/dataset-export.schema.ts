import { z } from 'zod';

export const featureSnapshotV1Schema = z
    .object({
        scheduledAt: z.string().datetime({ offset: true }),
        bookedAt: z.string().datetime({ offset: true }),
        patientNoShowCount: z.number().safe().int().nonnegative(),
        patientLateArrivalCount: z.number().safe().int().nonnegative(),
        patientCompletedAppointmentCount: z.number().safe().int().nonnegative(),
        distanceFromClinicKm: z.number().finite().nonnegative().max(20_000).nullable(),
    })
    .strict();

export const datasetRowSchema = z
    .object({
        previousNoShows: z.number().int().nonnegative().finite(),
        previousLateArrivals: z.number().int().nonnegative().finite(),
        previousCompletedVisits: z.number().int().nonnegative().finite(),
        distanceFromClinicKm: z.number().nonnegative().finite().nullable(),
        bookingLeadHours: z.number().nonnegative().finite(),
        appointmentDayOfWeek: z.number().int().min(1).max(7),
        appointmentTimeBucket: z.enum(['MORNING', 'AFTERNOON', 'EVENING']),
        actualNoShow: z.boolean(),
    })
    .strict();
