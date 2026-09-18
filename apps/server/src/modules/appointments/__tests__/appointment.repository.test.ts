import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatus } from '../../../generated/prisma/client.js';

const mockTransaction = vi.hoisted(() => vi.fn());
const mockAppointmentFindFirst = vi.hoisted(() => vi.fn());
const mockAppointmentUpdateMany = vi.hoisted(() => vi.fn());
const mockQueueEntryUpdateMany = vi.hoisted(() => vi.fn());
const mockEstablishAppointmentArrivalIfNeeded = vi.hoisted(() => vi.fn());
const mockApplyPatientAppointmentOutcome = vi.hoisted(() => vi.fn());
const mockRecordAppointmentTransitionActivities = vi.hoisted(() => vi.fn());

vi.mock('../../../config/prisma.js', () => ({
    prisma: {
        $transaction: mockTransaction,
    },
}));

vi.mock('../appointment.arrival.repository.js', () => ({
    establishAppointmentArrivalIfNeeded: mockEstablishAppointmentArrivalIfNeeded,
}));

vi.mock('../../patients/patient.statistics.repository.js', () => ({
    applyPatientAppointmentOutcome: mockApplyPatientAppointmentOutcome,
}));

vi.mock('../appointment.activity.repository.js', () => ({
    appointmentActivityRepository: {
        recordAppointmentTransitionActivities: mockRecordAppointmentTransitionActivities,
    },
}));

import { appointmentRepository } from '../appointment.repository.js';

const transactionClient = {
    appointment: {
        findFirst: mockAppointmentFindFirst,
        updateMany: mockAppointmentUpdateMany,
    },
    queueEntry: {
        updateMany: mockQueueEntryUpdateMany,
    },
};

describe('appointmentRepository.updateAppointmentStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTransaction.mockImplementation(async (operation) => operation(transactionClient));
    });

    it('rejects invalid persisted appointment lifecycle transitions before writing', async () => {
        mockAppointmentFindFirst.mockResolvedValueOnce({
            id: 'appointment-id',
            clinicId: 'clinic-id',
            status: AppointmentStatus.ARRIVED,
            queueEntry: {
                id: 'queue-entry-id',
            },
        });

        const result = await appointmentRepository.updateAppointmentStatus(
            'appointment-id',
            'clinic-id',
            'actor-id',
            { status: AppointmentStatus.CONFIRMED }
        );

        expect(result).toEqual({
            appointment: null,
            failureReason: 'INVALID_STATUS_TRANSITION',
        });
        expect(mockAppointmentUpdateMany).not.toHaveBeenCalled();
        expect(mockQueueEntryUpdateMany).not.toHaveBeenCalled();
    });

    it('allows skip-forward transitions and guards writes by the exact current status', async () => {
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            status: AppointmentStatus.IN_QUEUE,
            noShowPrediction: null,
        };

        mockAppointmentFindFirst
            .mockResolvedValueOnce({
                id: 'appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                scheduledAt: new Date('2026-09-15T10:00:00.000Z'),
                status: AppointmentStatus.SCHEDULED,
                arrivedAt: null,
                queueEntry: {
                    id: 'queue-entry-id',
                },
            })
            .mockResolvedValueOnce(appointment);
        mockAppointmentUpdateMany.mockResolvedValue({
            count: 1,
        });
        mockEstablishAppointmentArrivalIfNeeded.mockResolvedValue({
            wasEstablished: true,
            outcome: {
                arrivalOffsetMinutes: 20,
                isLateArrival: true,
                lateArrivalGraceMinutes: 15,
            },
        });
        mockQueueEntryUpdateMany.mockResolvedValue({
            count: 1,
        });

        const result = await appointmentRepository.updateAppointmentStatus(
            'appointment-id',
            'clinic-id',
            'actor-id',
            { status: AppointmentStatus.IN_QUEUE }
        );

        expect(mockAppointmentUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: 'appointment-id',
                    clinicId: 'clinic-id',
                    status: AppointmentStatus.SCHEDULED,
                }),
                data: {
                    status: AppointmentStatus.IN_QUEUE,
                },
            })
        );
        expect(mockQueueEntryUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    status: 'WAITING',
                },
            })
        );
        expect(mockEstablishAppointmentArrivalIfNeeded).toHaveBeenCalledWith(
            expect.objectContaining({
                appointmentId: 'appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                scheduledAt: new Date('2026-09-15T10:00:00.000Z'),
                targetStatus: AppointmentStatus.IN_QUEUE,
                arrivalTimestamp: expect.any(Date),
            })
        );
        expect(result).toEqual({
            appointment,
            failureReason: null,
        });
        expect(mockApplyPatientAppointmentOutcome).toHaveBeenCalledWith(
            expect.objectContaining({
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                previousStatus: AppointmentStatus.SCHEDULED,
                newStatus: AppointmentStatus.IN_QUEUE,
                eventTimestamp: expect.any(Date),
            })
        );
        expect(mockRecordAppointmentTransitionActivities).toHaveBeenCalledWith(
            expect.objectContaining({
                actorUserId: 'actor-id',
                didTransition: true,
                arrivalResult: {
                    wasEstablished: true,
                    outcome: {
                        arrivalOffsetMinutes: 20,
                        isLateArrival: true,
                        lateArrivalGraceMinutes: 15,
                    },
                },
            })
        );
        expect(mockApplyPatientAppointmentOutcome).toHaveBeenCalledTimes(1);
    });

    it('persists an explicit no-show reason and applies the outcome once', async () => {
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            status: AppointmentStatus.NO_SHOW,
            noShowReason: 'UNKNOWN',
            noShowPrediction: null,
        };

        mockAppointmentFindFirst
            .mockResolvedValueOnce({
                id: 'appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                scheduledAt: new Date('2026-09-18T10:00:00.000Z'),
                status: AppointmentStatus.CONFIRMED,
                arrivedAt: null,
                queueEntry: { id: 'queue-entry-id' },
            })
            .mockResolvedValueOnce(appointment);
        mockAppointmentUpdateMany.mockResolvedValue({ count: 1 });
        mockQueueEntryUpdateMany.mockResolvedValue({ count: 1 });

        await appointmentRepository.updateAppointmentStatus(
            'appointment-id',
            'clinic-id',
            'actor-id',
            { status: AppointmentStatus.NO_SHOW, noShowReason: 'UNKNOWN' }
        );

        expect(mockAppointmentUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    status: AppointmentStatus.NO_SHOW,
                    noShowReason: 'UNKNOWN',
                    noShowNote: null,
                },
            })
        );
        expect(mockApplyPatientAppointmentOutcome).toHaveBeenCalledTimes(1);
        expect(mockRecordAppointmentTransitionActivities).toHaveBeenCalledWith(
            expect.objectContaining({
                didTransition: true,
                terminalReason: { noShowReason: 'UNKNOWN', noShowNote: null },
            })
        );
    });

    it('persists cancellation reason and note in the guarded first-transition write', async () => {
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            status: AppointmentStatus.CANCELLED,
            cancellationReason: 'PATIENT_REQUEST',
            cancellationNote: 'Patient called reception.',
            noShowPrediction: null,
        };

        mockAppointmentFindFirst
            .mockResolvedValueOnce({
                id: 'appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                scheduledAt: new Date('2026-09-18T10:00:00.000Z'),
                status: AppointmentStatus.CONFIRMED,
                arrivedAt: null,
                queueEntry: { id: 'queue-entry-id' },
            })
            .mockResolvedValueOnce(appointment);
        mockAppointmentUpdateMany.mockResolvedValue({ count: 1 });
        mockQueueEntryUpdateMany.mockResolvedValue({ count: 1 });

        await expect(
            appointmentRepository.updateAppointmentStatus(
                'appointment-id',
                'clinic-id',
                'actor-id',
                {
                    status: AppointmentStatus.CANCELLED,
                    cancellationReason: 'PATIENT_REQUEST',
                    cancellationNote: 'Patient called reception.',
                }
            )
        ).resolves.toEqual({ appointment, failureReason: null });

        expect(mockAppointmentUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ status: AppointmentStatus.CONFIRMED }),
                data: {
                    status: AppointmentStatus.CANCELLED,
                    cancellationReason: 'PATIENT_REQUEST',
                    cancellationNote: 'Patient called reception.',
                },
            })
        );
        expect(mockRecordAppointmentTransitionActivities).toHaveBeenCalledWith(
            expect.objectContaining({
                actorUserId: 'actor-id',
                didTransition: true,
                terminalReason: {
                    cancellationReason: 'PATIENT_REQUEST',
                    cancellationNote: 'Patient called reception.',
                },
            })
        );
        expect(mockApplyPatientAppointmentOutcome).toHaveBeenCalledTimes(1);
    });

    it('does not overwrite a cancellation reason on a same-status retry', async () => {
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            status: AppointmentStatus.CANCELLED,
            cancellationReason: 'PATIENT_REQUEST',
            noShowPrediction: null,
        };

        mockAppointmentFindFirst
            .mockResolvedValueOnce({
                id: 'appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                scheduledAt: new Date('2026-09-18T10:00:00.000Z'),
                status: AppointmentStatus.CANCELLED,
                arrivedAt: null,
                queueEntry: { id: 'queue-entry-id' },
            })
            .mockResolvedValueOnce(appointment);
        mockQueueEntryUpdateMany.mockResolvedValue({ count: 1 });

        const result = await appointmentRepository.updateAppointmentStatus(
            'appointment-id',
            'clinic-id',
            'actor-id',
            {
                status: AppointmentStatus.CANCELLED,
                cancellationReason: 'PATIENT_ILLNESS',
            }
        );

        expect(result.appointment?.cancellationReason).toBe('PATIENT_REQUEST');
        expect(mockAppointmentUpdateMany).not.toHaveBeenCalled();
        expect(mockRecordAppointmentTransitionActivities).toHaveBeenCalledWith(
            expect.objectContaining({ didTransition: false })
        );
    });

    it('does not let a losing concurrent cancellation replace the winner reason or activity', async () => {
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            status: AppointmentStatus.CANCELLED,
            cancellationReason: 'PATIENT_REQUEST',
            noShowPrediction: null,
        };

        mockAppointmentFindFirst
            .mockResolvedValueOnce({
                id: 'appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                scheduledAt: new Date('2026-09-18T10:00:00.000Z'),
                status: AppointmentStatus.CONFIRMED,
                arrivedAt: null,
                queueEntry: { id: 'queue-entry-id' },
            })
            .mockResolvedValueOnce({ status: AppointmentStatus.CANCELLED })
            .mockResolvedValueOnce(appointment);
        mockAppointmentUpdateMany.mockResolvedValue({ count: 0 });
        mockQueueEntryUpdateMany.mockResolvedValue({ count: 1 });

        const result = await appointmentRepository.updateAppointmentStatus(
            'appointment-id',
            'clinic-id',
            'actor-id',
            {
                status: AppointmentStatus.CANCELLED,
                cancellationReason: 'PATIENT_ILLNESS',
            }
        );

        expect(result.appointment?.cancellationReason).toBe('PATIENT_REQUEST');
        expect(mockApplyPatientAppointmentOutcome).not.toHaveBeenCalled();
        expect(mockRecordAppointmentTransitionActivities).toHaveBeenCalledWith(
            expect.objectContaining({ didTransition: false })
        );
    });

    it('preserves same-status retry support without overwriting called timestamps', async () => {
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            status: AppointmentStatus.CALLED,
            noShowPrediction: null,
        };

        mockAppointmentFindFirst
            .mockResolvedValueOnce({
                id: 'appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                scheduledAt: new Date('2026-09-15T10:00:00.000Z'),
                status: AppointmentStatus.CALLED,
                arrivedAt: new Date('2026-09-15T10:03:00.000Z'),
                queueEntry: {
                    id: 'queue-entry-id',
                },
            })
            .mockResolvedValueOnce(appointment);
        mockQueueEntryUpdateMany.mockResolvedValue({
            count: 1,
        });

        const result = await appointmentRepository.updateAppointmentStatus(
            'appointment-id',
            'clinic-id',
            'actor-id',
            { status: AppointmentStatus.CALLED }
        );

        expect(mockQueueEntryUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    calledAt: null,
                }),
                data: {
                    calledAt: expect.any(Date),
                },
            })
        );
        expect(result.failureReason).toBeNull();
        expect(mockAppointmentUpdateMany).not.toHaveBeenCalled();
        expect(mockEstablishAppointmentArrivalIfNeeded).not.toHaveBeenCalled();
        expect(mockApplyPatientAppointmentOutcome).not.toHaveBeenCalled();
        expect(mockRecordAppointmentTransitionActivities).toHaveBeenCalledWith(
            expect.objectContaining({
                actorUserId: 'actor-id',
                didTransition: false,
            })
        );
    });

    it('does not apply completion statistics when a concurrent request already reached completed', async () => {
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            status: AppointmentStatus.COMPLETED,
            noShowPrediction: null,
        };

        mockAppointmentFindFirst
            .mockResolvedValueOnce({
                id: 'appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                scheduledAt: new Date('2026-09-17T10:00:00.000Z'),
                status: AppointmentStatus.CALLED,
                arrivedAt: new Date('2026-09-17T10:03:00.000Z'),
                queueEntry: {
                    id: 'queue-entry-id',
                },
            })
            .mockResolvedValueOnce({
                status: AppointmentStatus.COMPLETED,
            })
            .mockResolvedValueOnce(appointment);
        mockAppointmentUpdateMany.mockResolvedValue({ count: 0 });
        mockQueueEntryUpdateMany.mockResolvedValue({ count: 1 });

        const result = await appointmentRepository.updateAppointmentStatus(
            'appointment-id',
            'clinic-id',
            'actor-id',
            { status: AppointmentStatus.COMPLETED }
        );

        expect(result).toEqual({
            appointment,
            failureReason: null,
        });
        expect(mockApplyPatientAppointmentOutcome).not.toHaveBeenCalled();
        expect(mockRecordAppointmentTransitionActivities).toHaveBeenCalledWith(
            expect.objectContaining({
                actorUserId: 'actor-id',
                didTransition: false,
            })
        );
    });
});
