import { describe, expect, it } from 'vitest';
import { AppointmentStatus } from '../../../generated/prisma/client.js';
import {
    getAllowedAppointmentCurrentStatusesForRequest,
    getAllowedAppointmentNextStatuses,
    isAppointmentReschedulable,
    isAppointmentStatusTransitionAllowed,
    isFinalAppointmentStatus,
} from '../appointment.lifecycle.js';

describe('appointment lifecycle policy', () => {
    it('allows the approved appointment status transitions', () => {
        expect(getAllowedAppointmentNextStatuses(AppointmentStatus.SCHEDULED)).toEqual([
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.ARRIVED,
            AppointmentStatus.IN_QUEUE,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
        ]);
        expect(getAllowedAppointmentNextStatuses(AppointmentStatus.CONFIRMED)).toEqual([
            AppointmentStatus.ARRIVED,
            AppointmentStatus.IN_QUEUE,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
        ]);
        expect(getAllowedAppointmentNextStatuses(AppointmentStatus.ARRIVED)).toEqual([
            AppointmentStatus.IN_QUEUE,
            AppointmentStatus.CALLED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
        ]);
        expect(getAllowedAppointmentNextStatuses(AppointmentStatus.IN_QUEUE)).toEqual([
            AppointmentStatus.CALLED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
        ]);
        expect(getAllowedAppointmentNextStatuses(AppointmentStatus.CALLED)).toEqual([
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
        ]);
    });

    it('allows intentionally skipped-forward workflow transitions', () => {
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.ARRIVED
            )
        ).toBe(true);
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.IN_QUEUE
            )
        ).toBe(true);
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.IN_QUEUE
            )
        ).toBe(true);
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.ARRIVED,
                AppointmentStatus.CALLED
            )
        ).toBe(true);
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.IN_QUEUE,
                AppointmentStatus.COMPLETED
            )
        ).toBe(true);
    });

    it('rejects unsupported reversals and skips', () => {
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.ARRIVED,
                AppointmentStatus.CONFIRMED
            )
        ).toBe(false);
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.IN_QUEUE,
                AppointmentStatus.ARRIVED
            )
        ).toBe(false);
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.CALLED,
                AppointmentStatus.IN_QUEUE
            )
        ).toBe(false);
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.COMPLETED
            )
        ).toBe(false);
    });

    it('keeps same-status requests idempotent while terminal statuses remain final', () => {
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.COMPLETED,
                AppointmentStatus.COMPLETED
            )
        ).toBe(true);
        expect(
            isAppointmentStatusTransitionAllowed(
                AppointmentStatus.CANCELLED,
                AppointmentStatus.CONFIRMED
            )
        ).toBe(false);
        expect(isFinalAppointmentStatus(AppointmentStatus.COMPLETED)).toBe(true);
        expect(isFinalAppointmentStatus(AppointmentStatus.NO_SHOW)).toBe(true);
        expect(isFinalAppointmentStatus(AppointmentStatus.IN_QUEUE)).toBe(false);
    });

    it('derives persisted current-status guards for concurrent updates', () => {
        expect(getAllowedAppointmentCurrentStatusesForRequest(AppointmentStatus.ARRIVED)).toEqual([
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.ARRIVED,
        ]);
        expect(getAllowedAppointmentCurrentStatusesForRequest(AppointmentStatus.COMPLETED)).toEqual([
            AppointmentStatus.IN_QUEUE,
            AppointmentStatus.CALLED,
            AppointmentStatus.COMPLETED,
        ]);
    });

    it('centralizes rescheduling eligibility before the active visit begins', () => {
        expect(isAppointmentReschedulable(AppointmentStatus.SCHEDULED)).toBe(true);
        expect(isAppointmentReschedulable(AppointmentStatus.CONFIRMED)).toBe(true);

        for (const status of [
            AppointmentStatus.ARRIVED,
            AppointmentStatus.IN_QUEUE,
            AppointmentStatus.CALLED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
        ]) {
            expect(isAppointmentReschedulable(status)).toBe(false);
        }
    });
});
