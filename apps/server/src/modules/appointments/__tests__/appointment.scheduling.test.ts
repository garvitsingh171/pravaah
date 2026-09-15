import { describe, expect, it } from 'vitest';
import {
    buildCandidateLocalStartTimes,
    findConflictingSchedulingAppointment,
} from '../appointment.scheduling.js';

describe('appointment scheduling policy', () => {
    it('generates clinic-slot candidates inside doctor weekly availability', () => {
        const slots = buildCandidateLocalStartTimes({
            clinic: {
                openingTime: '09:00',
                closingTime: '12:00',
                slotDurationMinutes: 15,
                bufferMinutes: 5,
            },
            weekday: 'MONDAY',
            availabilityPeriods: [
                {
                    weekday: 'MONDAY',
                    startTime: '09:30',
                    endTime: '10:30',
                },
                {
                    weekday: 'TUESDAY',
                    startTime: '09:00',
                    endTime: '12:00',
                },
            ],
            durationMinutes: 30,
        });

        expect(slots).toEqual(['09:30', '09:45']);
    });

    it('requires duration plus buffer to fit inside the working window', () => {
        const slots = buildCandidateLocalStartTimes({
            clinic: {
                openingTime: '09:00',
                closingTime: '13:00',
                slotDurationMinutes: 15,
                bufferMinutes: 15,
            },
            weekday: 'MONDAY',
            availabilityPeriods: [
                {
                    weekday: 'MONDAY',
                    startTime: '09:00',
                    endTime: '13:00',
                },
            ],
            durationMinutes: 30,
        });

        expect(slots).not.toContain('12:30');
        expect(slots.at(-1)).toBe('12:15');
    });

    it('treats appointment duration plus clinic buffer as the effective interval', () => {
        const conflict = findConflictingSchedulingAppointment(
            {
                scheduledAt: new Date('2026-06-22T09:30:00.000Z'),
                durationMinutes: 30,
            },
            [
                {
                    scheduledAt: new Date('2026-06-22T09:00:00.000Z'),
                    durationMinutes: 30,
                },
            ],
            5
        );

        expect(conflict).not.toBeNull();

        const firstAvailableAfterBuffer = findConflictingSchedulingAppointment(
            {
                scheduledAt: new Date('2026-06-22T09:35:00.000Z'),
                durationMinutes: 30,
            },
            [
                {
                    scheduledAt: new Date('2026-06-22T09:00:00.000Z'),
                    durationMinutes: 30,
                },
            ],
            5
        );

        expect(firstAvailableAfterBuffer).toBeNull();
    });
});
