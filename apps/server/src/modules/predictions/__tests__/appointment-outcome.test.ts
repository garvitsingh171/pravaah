import { describe, expect, it } from 'vitest';
import {
    AppointmentActualOutcome,
    AppointmentActivityType,
    AppointmentOutcomeSource,
    AppointmentStatus,
} from '../../../generated/prisma/client.js';
import {
    deriveAppointmentOutcome,
    isPredictionEligibleForOutcome,
} from '../appointment-outcome.js';

const observedAt = new Date('2026-10-20T10:00:00.000Z');
const arrivedAt = new Date('2026-10-20T09:55:00.000Z');

describe('deriveAppointmentOutcome', () => {
    it.each([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED])(
        '%s remains unlabeled',
        (status) => {
            expect(
                deriveAppointmentOutcome({ status, arrivedAt: null, activities: [], observedAt })
            ).toMatchObject({
                actualOutcome: AppointmentActualOutcome.PENDING,
                actualNoShow: null,
                evidenceAt: null,
            });
        }
    );

    it.each([AppointmentStatus.ARRIVED, AppointmentStatus.IN_QUEUE, AppointmentStatus.CALLED])(
        '%s with recorded arrival is attended',
        (status) => {
            expect(
                deriveAppointmentOutcome({ status, arrivedAt, activities: [], observedAt })
            ).toMatchObject({
                actualOutcome: AppointmentActualOutcome.ATTENDED,
                actualNoShow: false,
                evidenceAt: arrivedAt,
            });
        }
    );

    it('labels explicit no-show without attendance evidence as 1', () => {
        expect(
            deriveAppointmentOutcome({
                status: AppointmentStatus.NO_SHOW,
                arrivedAt: null,
                activities: [],
                observedAt,
            })
        ).toMatchObject({
            actualOutcome: AppointmentActualOutcome.NO_SHOW,
            actualNoShow: true,
        });
    });

    it('keeps the original no-show activity timestamp on a later retry', () => {
        const noShowAt = new Date('2026-10-20T09:40:00.000Z');
        const retriedAt = new Date('2026-10-20T10:30:00.000Z');
        const outcome = deriveAppointmentOutcome({
            status: AppointmentStatus.NO_SHOW,
            arrivedAt: null,
            activities: [
                { type: AppointmentActivityType.APPOINTMENT_NO_SHOW, occurredAt: noShowAt },
            ],
            observedAt: retriedAt,
        });

        expect(outcome.evidenceAt).toEqual(noShowAt);
        expect(
            isPredictionEligibleForOutcome({
                prediction: {
                    createdAt: new Date('2026-10-20T09:50:00.000Z'),
                    featureSchemaVersion: 'no-show-v1',
                    featureSnapshot: { scheduledAt: '2026-10-20T10:00:00.000Z' },
                    ruleVersion: 'starter-rule-v1',
                },
                outcome,
                currentScheduledAt: new Date('2026-10-20T10:00:00.000Z'),
            })
        ).toBe(false);
    });

    it('keeps cancellation before attendance unlabeled', () => {
        expect(
            deriveAppointmentOutcome({
                status: AppointmentStatus.CANCELLED,
                arrivedAt: null,
                activities: [],
                observedAt,
            })
        ).toMatchObject({
            actualOutcome: AppointmentActualOutcome.CANCELLED,
            actualNoShow: null,
        });
    });

    it('preserves arrival evidence if later cancelled', () => {
        expect(
            deriveAppointmentOutcome({
                status: AppointmentStatus.CANCELLED,
                arrivedAt,
                activities: [],
                observedAt,
            })
        ).toMatchObject({
            actualOutcome: AppointmentActualOutcome.ATTENDED,
            actualNoShow: false,
            evidenceAt: arrivedAt,
        });
    });

    it('excludes a no-show that conflicts with arrival evidence', () => {
        expect(
            deriveAppointmentOutcome({
                status: AppointmentStatus.NO_SHOW,
                arrivedAt,
                activities: [],
                observedAt,
            })
        ).toMatchObject({
            actualOutcome: AppointmentActualOutcome.EXCLUDED,
            actualNoShow: null,
            outcomeSource: AppointmentOutcomeSource.CONFLICTING_EVIDENCE,
            exclusionReason: 'ATTENDANCE_EVIDENCE_CONFLICTS_WITH_NO_SHOW',
        });
    });

    it('uses activity history when arrival columns are absent', () => {
        expect(
            deriveAppointmentOutcome({
                status: AppointmentStatus.CANCELLED,
                arrivedAt: null,
                activities: [
                    { type: AppointmentActivityType.PATIENT_ARRIVED, occurredAt: arrivedAt },
                ],
                observedAt,
            })
        ).toMatchObject({
            actualOutcome: AppointmentActualOutcome.ATTENDED,
            actualNoShow: false,
            evidenceAt: arrivedAt,
        });
    });

    it('treats a completed lifecycle status as attendance', () => {
        expect(
            deriveAppointmentOutcome({
                status: AppointmentStatus.COMPLETED,
                arrivedAt: null,
                activities: [],
                observedAt,
            })
        ).toMatchObject({
            actualOutcome: AppointmentActualOutcome.ATTENDED,
            actualNoShow: false,
            evidenceAt: observedAt,
        });
    });
});

describe('isPredictionEligibleForOutcome', () => {
    const outcome = deriveAppointmentOutcome({
        status: AppointmentStatus.ARRIVED,
        arrivedAt,
        activities: [],
        observedAt,
    });
    const prediction = {
        createdAt: new Date('2026-10-20T09:00:00.000Z'),
        featureSchemaVersion: 'no-show-v1',
        featureSnapshot: { scheduledAt: '2026-10-20T10:00:00.000Z' },
        ruleVersion: 'starter-rule-v1',
    };

    it('accepts a complete prediction made before the evidence for this visit', () => {
        expect(
            isPredictionEligibleForOutcome({
                prediction,
                outcome,
                currentScheduledAt: new Date('2026-10-20T10:00:00.000Z'),
            })
        ).toBe(true);
    });

    it('rejects post-outcome, legacy, and stale-reschedule runs', () => {
        expect(
            isPredictionEligibleForOutcome({
                prediction: { ...prediction, createdAt: arrivedAt },
                outcome,
                currentScheduledAt: new Date('2026-10-20T10:00:00.000Z'),
            })
        ).toBe(false);
        expect(
            isPredictionEligibleForOutcome({
                prediction: { ...prediction, createdAt: new Date('2026-10-20T10:05:00.000Z') },
                outcome,
                currentScheduledAt: new Date('2026-10-20T10:00:00.000Z'),
            })
        ).toBe(false);
        expect(
            isPredictionEligibleForOutcome({
                prediction: { ...prediction, featureSnapshot: null },
                outcome,
                currentScheduledAt: new Date('2026-10-20T10:00:00.000Z'),
            })
        ).toBe(false);
        expect(
            isPredictionEligibleForOutcome({
                prediction,
                outcome,
                currentScheduledAt: new Date('2026-10-21T10:00:00.000Z'),
            })
        ).toBe(false);
    });
});
