import { describe, expect, it } from 'vitest';
import {
    availableAppointmentSlotsQuerySchema,
    listAppointmentsQuerySchema,
    rescheduleAppointmentSchema,
    rescheduleAppointmentSlotsQuerySchema,
    updateAppointmentStatusSchema,
} from '../appointment.validation.js';

describe('updateAppointmentStatusSchema', () => {
    it('keeps normal status requests status-only', () => {
        expect(updateAppointmentStatusSchema.safeParse({ status: 'CONFIRMED' }).success).toBe(true);
    });

    it('accepts cancellation and no-show payloads with their matching structured reasons', () => {
        expect(
            updateAppointmentStatusSchema.safeParse({
                status: 'CANCELLED',
                cancellationReason: 'PATIENT_REQUEST',
                cancellationNote: '  Patient called reception.  ',
            })
        ).toMatchObject({
            success: true,
            data: { cancellationNote: 'Patient called reception.' },
        });
        expect(
            updateAppointmentStatusSchema.safeParse({
                status: 'NO_SHOW',
                noShowReason: 'UNKNOWN',
                noShowNote: '   ',
            })
        ).toMatchObject({ success: true, data: { noShowNote: undefined } });
    });

    it.each([
        { status: 'CANCELLED' },
        { status: 'CANCELLED', noShowReason: 'UNKNOWN' },
        { status: 'NO_SHOW' },
        { status: 'NO_SHOW', cancellationReason: 'PATIENT_REQUEST' },
        { status: 'COMPLETED', cancellationReason: 'PATIENT_REQUEST' },
    ])('rejects invalid conditional status payload %#', (payload) => {
        expect(updateAppointmentStatusSchema.safeParse(payload).success).toBe(false);
    });

    it('rejects terminal notes longer than 500 characters', () => {
        expect(
            updateAppointmentStatusSchema.safeParse({
                status: 'NO_SHOW',
                noShowReason: 'UNKNOWN',
                noShowNote: 'x'.repeat(501),
            }).success
        ).toBe(false);
    });
});

describe('listAppointmentsQuerySchema', () => {
    it('rejects invalid calendar dates', () => {
        for (const date of ['2026-02-30', '2026-13-01', '2026-00-10']) {
            expect(listAppointmentsQuerySchema.safeParse({ date }).success).toBe(false);
        }
    });

    it('accepts valid YYYY-MM-DD calendar dates', () => {
        expect(listAppointmentsQuerySchema.safeParse({ date: '2026-02-28' }).success).toBe(true);
        expect(listAppointmentsQuerySchema.safeParse({ date: '2026-02-29' }).success).toBe(false);
        expect(listAppointmentsQuerySchema.safeParse({ date: '2028-02-29' }).success).toBe(true);
    });
});

describe('availableAppointmentSlotsQuerySchema', () => {
    it('coerces valid duration query strings', () => {
        const result = availableAppointmentSlotsQuerySchema.safeParse({
            doctorId: '11111111-1111-4111-8111-111111111111',
            date: '2026-06-22',
            durationMinutes: '30',
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.durationMinutes).toBe(30);
        }
    });

    it('rejects invalid dates and non-positive durations', () => {
        expect(
            availableAppointmentSlotsQuerySchema.safeParse({
                doctorId: '11111111-1111-4111-8111-111111111111',
                date: '2026-02-30',
                durationMinutes: '30',
            }).success
        ).toBe(false);
        expect(
            availableAppointmentSlotsQuerySchema.safeParse({
                doctorId: '11111111-1111-4111-8111-111111111111',
                date: '2026-06-22',
                durationMinutes: '0',
            }).success
        ).toBe(false);
    });
});

describe('reschedule appointment validation', () => {
    it('accepts only canonical destination dates for reschedule slot lookup', () => {
        expect(
            rescheduleAppointmentSlotsQuerySchema.safeParse({ date: '2026-09-17' }).success
        ).toBe(true);
        expect(
            rescheduleAppointmentSlotsQuerySchema.safeParse({ date: '17/09/2026' }).success
        ).toBe(false);
        expect(
            rescheduleAppointmentSlotsQuerySchema.safeParse({ date: '2026-02-30' }).success
        ).toBe(false);
    });

    it('accepts only scheduledAt in the reschedule mutation body', () => {
        expect(
            rescheduleAppointmentSchema.safeParse({
                scheduledAt: '2026-09-17T09:00:00.000Z',
                currentScheduledAt: '2026-09-15T09:00:00.000Z',
            }).success
        ).toBe(true);
        expect(
            rescheduleAppointmentSchema.safeParse({
                scheduledAt: '2026-09-17T09:00:00.000Z',
                currentScheduledAt: '2026-09-15T09:00:00.000Z',
                doctorId: '11111111-1111-4111-8111-111111111111',
            }).success
        ).toBe(false);
        expect(
            rescheduleAppointmentSchema.safeParse({
                scheduledAt: '2026-09-17T09:00:00.000Z',
            }).success
        ).toBe(false);
    });
});
