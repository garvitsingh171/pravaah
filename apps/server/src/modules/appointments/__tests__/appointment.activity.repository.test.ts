import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentActivityType, AppointmentStatus } from '../../../generated/prisma/client.js';

vi.mock('../../../config/prisma.js', () => ({ prisma: {} }));

import { appointmentActivityRepository } from '../appointment.activity.repository.js';

const createActivity = vi.fn();
const tx = {
    appointmentActivity: {
        create: createActivity,
    },
} as never;

describe('appointmentActivityRepository.recordAppointmentTransitionActivities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createActivity.mockResolvedValue({});
    });

    it('creates no activity for a same-status or concurrently-owned retry', async () => {
        await appointmentActivityRepository.recordAppointmentTransitionActivities({
            tx,
            appointmentId: 'appointment-id',
            clinicId: 'clinic-id',
            actorUserId: 'actor-id',
            previousStatus: AppointmentStatus.COMPLETED,
            newStatus: AppointmentStatus.COMPLETED,
            eventTimestamp: new Date('2026-09-18T10:00:00.000Z'),
            didTransition: false,
            arrivalResult: { wasEstablished: false, outcome: null },
        });

        expect(createActivity).not.toHaveBeenCalled();
    });

    it('records first arrival before entered-queue for a controlled lifecycle skip', async () => {
        const eventTimestamp = new Date('2026-09-18T10:18:00.000Z');

        await appointmentActivityRepository.recordAppointmentTransitionActivities({
            tx,
            appointmentId: 'appointment-id',
            clinicId: 'clinic-id',
            actorUserId: 'actor-id',
            previousStatus: AppointmentStatus.CONFIRMED,
            newStatus: AppointmentStatus.IN_QUEUE,
            eventTimestamp,
            didTransition: true,
            arrivalResult: {
                wasEstablished: true,
                outcome: {
                    arrivalOffsetMinutes: 18,
                    isLateArrival: true,
                    lateArrivalGraceMinutes: 15,
                },
            },
        });

        expect(createActivity).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                data: expect.objectContaining({
                    actorUserId: 'actor-id',
                    type: AppointmentActivityType.PATIENT_ARRIVED,
                    occurredAt: eventTimestamp,
                    metadata: {
                        fromStatus: AppointmentStatus.CONFIRMED,
                        toStatus: AppointmentStatus.IN_QUEUE,
                        arrivalOffsetMinutes: 18,
                        isLateArrival: true,
                        lateArrivalGraceMinutes: 15,
                    },
                }),
            })
        );
        expect(createActivity).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                data: expect.objectContaining({
                    type: AppointmentActivityType.ENTERED_QUEUE,
                    occurredAt: eventTimestamp,
                }),
            })
        );
    });

    it('records explicit arrival only when the shared arrival writer owns it', async () => {
        await appointmentActivityRepository.recordAppointmentTransitionActivities({
            tx,
            appointmentId: 'appointment-id',
            clinicId: 'clinic-id',
            actorUserId: 'actor-id',
            previousStatus: AppointmentStatus.CONFIRMED,
            newStatus: AppointmentStatus.ARRIVED,
            eventTimestamp: new Date('2026-09-18T10:00:00.000Z'),
            didTransition: true,
            arrivalResult: { wasEstablished: false, outcome: null },
        });

        expect(createActivity).not.toHaveBeenCalled();
    });
});
