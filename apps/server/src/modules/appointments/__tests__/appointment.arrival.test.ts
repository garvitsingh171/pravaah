import { describe, expect, it } from 'vitest';
import { AppointmentStatus } from '../../../generated/prisma/client.js';
import {
    calculateArrivalOutcome,
    isPresenceEstablishingAppointmentStatus,
} from '../appointment.arrival.js';

describe('appointment arrival policy', () => {
    it('identifies only operational presence-establishing appointment statuses', () => {
        expect(isPresenceEstablishingAppointmentStatus(AppointmentStatus.ARRIVED)).toBe(true);
        expect(isPresenceEstablishingAppointmentStatus(AppointmentStatus.IN_QUEUE)).toBe(true);
        expect(isPresenceEstablishingAppointmentStatus(AppointmentStatus.CALLED)).toBe(true);

        expect(isPresenceEstablishingAppointmentStatus(AppointmentStatus.SCHEDULED)).toBe(false);
        expect(isPresenceEstablishingAppointmentStatus(AppointmentStatus.CONFIRMED)).toBe(false);
        expect(isPresenceEstablishingAppointmentStatus(AppointmentStatus.COMPLETED)).toBe(false);
        expect(isPresenceEstablishingAppointmentStatus(AppointmentStatus.CANCELLED)).toBe(false);
        expect(isPresenceEstablishingAppointmentStatus(AppointmentStatus.NO_SHOW)).toBe(false);
    });

    it('preserves signed completed minutes for early arrivals', () => {
        expect(
            calculateArrivalOutcome({
                scheduledAt: new Date('2026-09-15T10:00:00.000Z'),
                arrivedAt: new Date('2026-09-15T09:48:20.000Z'),
                graceMinutes: 15,
            })
        ).toEqual({
            arrivalOffsetMinutes: -11,
            isLateArrival: false,
            lateArrivalGraceMinutes: 15,
        });
    });

    it('does not mark exact grace-boundary arrivals late', () => {
        expect(
            calculateArrivalOutcome({
                scheduledAt: new Date('2026-09-15T10:00:00.000Z'),
                arrivedAt: new Date('2026-09-15T10:15:59.000Z'),
                graceMinutes: 15,
            })
        ).toEqual({
            arrivalOffsetMinutes: 15,
            isLateArrival: false,
            lateArrivalGraceMinutes: 15,
        });
    });

    it('marks arrivals late only when the signed delay exceeds grace', () => {
        expect(
            calculateArrivalOutcome({
                scheduledAt: new Date('2026-09-15T10:00:00.000Z'),
                arrivedAt: new Date('2026-09-15T10:16:00.000Z'),
                graceMinutes: 15,
            })
        ).toEqual({
            arrivalOffsetMinutes: 16,
            isLateArrival: true,
            lateArrivalGraceMinutes: 15,
        });
    });
});
