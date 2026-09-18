import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAppointmentService = vi.hoisted(() => ({
    createAppointment: vi.fn(),
    listAvailableSlots: vi.fn(),
    listAppointments: vi.fn(),
    listAppointmentActivities: vi.fn(),
    listRescheduleSlots: vi.fn(),
    rescheduleAppointment: vi.fn(),
    updateAppointmentStatus: vi.fn(),
}));

vi.mock('../appointment.service.js', () => ({
    appointmentService: mockAppointmentService,
}));

import {
    createAppointmentController,
    listAppointmentActivitiesController,
    listAppointmentRescheduleSlotsController,
    listAvailableAppointmentSlotsController,
    listAppointmentsController,
    rescheduleAppointmentController,
    updateAppointmentStatusController,
} from '../appointment.controller.js';

describe('listAppointmentActivitiesController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns the read-only activity collection for the authenticated user', async () => {
        const user = { id: 'user-id' };
        const activities = [
            {
                id: 'activity-id',
                type: 'APPOINTMENT_CREATED',
                occurredAt: new Date('2026-09-18T10:00:00.000Z'),
                actor: { id: 'user-id', fullName: 'Clinic Admin', role: 'ADMIN' },
                metadata: { scheduledAt: '2026-09-19T10:00:00.000Z' },
            },
        ];
        const req = {
            params: { appointmentId: 'appointment-id' },
            user,
        } as unknown as Request;
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = { status } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockAppointmentService.listAppointmentActivities.mockResolvedValue(activities);

        await listAppointmentActivitiesController(req, res, next);

        expect(mockAppointmentService.listAppointmentActivities).toHaveBeenCalledWith(
            user,
            'appointment-id'
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Appointment activities fetched successfully',
            data: { activities },
        });
    });
});

describe('createAppointmentController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns appointment booking response with public no-show prediction data', async () => {
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            doctorId: 'doctor-id',
            patientId: 'patient-id',
            createdByUserId: 'user-id',
            scheduledAt: new Date('2026-06-20T10:00:00.000Z'),
            durationMinutes: 15,
            status: 'SCHEDULED',
            bookingSource: 'RECEPTION',
            reason: 'Fever',
            notes: null,
            createdAt: new Date('2026-06-18T10:00:00.000Z'),
            updatedAt: new Date('2026-06-18T10:00:00.000Z'),
        };

        const noShowPrediction = {
            id: 'no-show-prediction-id',
            riskLevel: 'MEDIUM' as const,
            score: 35,
            reasons: [
                {
                    code: 'NEW_PATIENT' as const,
                    message: 'Patient has no previous appointment history.',
                    scoreImpact: 15,
                },
            ],
            createdAt: new Date('2026-06-18T10:00:01.000Z'),
            updatedAt: new Date('2026-06-18T10:00:01.000Z'),
        };
        const appointmentResponse = {
            ...appointment,
            noShowPrediction,
        };
        const queueEntry = {
            id: 'queue-entry-id',
            clinicId: appointment.clinicId,
            appointmentId: appointment.id,
            doctorId: appointment.doctorId,
            patientId: appointment.patientId,
            position: 1,
            status: 'WAITING',
            queuedAt: new Date('2026-06-18T10:00:00.000Z'),
            calledAt: null,
            completedAt: null,
            createdAt: new Date('2026-06-18T10:00:00.000Z'),
            updatedAt: new Date('2026-06-18T10:00:00.000Z'),
        };

        const body = {
            doctorId: 'doctor-id',
            patientId: 'patient-id',
            scheduledAt: '2026-06-20T10:00:00.000Z',
            durationMinutes: 15,
            reason: 'Fever',
            bookingSource: 'RECEPTION',
        };

        const req = {
            params: {
                clinicId: 'clinic-id',
            },
            body,
            user: {
                id: 'user-id',
            },
        } as unknown as Request;

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockAppointmentService.createAppointment.mockResolvedValue({
            appointment: appointmentResponse,
            queueEntry,
            noShowPrediction,
        });

        await createAppointmentController(req, res, next);

        expect(mockAppointmentService.createAppointment).toHaveBeenCalledWith(
            'clinic-id',
            'user-id',
            body
        );

        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Appointment created successfully',
            data: {
                appointment: appointmentResponse,
                queueEntry,
                noShowPrediction,
            },
        });
        expect(noShowPrediction).toHaveProperty('score', 35);
        expect(noShowPrediction).not.toHaveProperty('appointmentId');
        expect(noShowPrediction).not.toHaveProperty('clinicId');
        expect(noShowPrediction).not.toHaveProperty('patientId');
        expect(noShowPrediction.reasons).toEqual([
            {
                code: 'NEW_PATIENT',
                message: 'Patient has no previous appointment history.',
                scoreImpact: 15,
            },
        ]);
    });
});

describe('listAppointmentsController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses the validated appointment query from res.locals', async () => {
        const validatedQuery = {
            date: '2026-06-20',
            doctorId: 'doctor-id',
        };
        const rawQuery = {
            date: '2026-02-30',
            doctorId: 'doctor-id',
        };
        const appointments = [
            {
                id: 'appointment-id',
                clinicId: 'clinic-id',
                doctorId: 'doctor-id',
                patientId: 'patient-id',
                scheduledAt: new Date('2026-06-20T10:00:00.000Z'),
                durationMinutes: 15,
                status: 'SCHEDULED',
                bookingSource: 'RECEPTION',
                reason: 'Fever',
                notes: null,
                createdAt: new Date('2026-06-18T10:00:00.000Z'),
                updatedAt: new Date('2026-06-18T10:00:00.000Z'),
            },
        ];

        const req = {
            params: {
                clinicId: 'clinic-id',
            },
            query: rawQuery,
        } as unknown as Request;

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            locals: {
                validatedQuery,
            },
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockAppointmentService.listAppointments.mockResolvedValue(appointments);

        await listAppointmentsController(req, res, next);

        expect(mockAppointmentService.listAppointments).toHaveBeenCalledWith(
            'clinic-id',
            validatedQuery
        );
        expect(mockAppointmentService.listAppointments).not.toHaveBeenCalledWith(
            'clinic-id',
            rawQuery
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Appointments fetched successfully',
            data: {
                appointments,
            },
        });
    });
});

describe('listAvailableAppointmentSlotsController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses the validated slot query and returns available slots', async () => {
        const validatedQuery = {
            doctorId: 'doctor-id',
            date: '2026-06-22',
            durationMinutes: 30,
        };
        const availability = {
            clinicId: 'clinic-id',
            doctorId: 'doctor-id',
            date: '2026-06-22',
            timezone: 'Asia/Kolkata',
            durationMinutes: 30,
            slotDurationMinutes: 15,
            bufferMinutes: 5,
            slots: [
                {
                    scheduledAt: '2026-06-22T04:00:00.000Z',
                    endsAt: '2026-06-22T04:30:00.000Z',
                    localDate: '2026-06-22',
                    localStartTime: '09:30',
                    localEndTime: '10:00',
                },
            ],
        };

        const req = {
            params: {
                clinicId: 'clinic-id',
            },
            query: {
                doctorId: 'raw-doctor-id',
                date: '2026-02-30',
                durationMinutes: '0',
            },
        } as unknown as Request;

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            locals: {
                validatedQuery,
            },
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockAppointmentService.listAvailableSlots.mockResolvedValue(availability);

        await listAvailableAppointmentSlotsController(req, res, next);

        expect(mockAppointmentService.listAvailableSlots).toHaveBeenCalledWith(
            'clinic-id',
            validatedQuery
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Available appointment slots fetched successfully',
            data: availability,
        });
    });
});

describe('listAppointmentRescheduleSlotsController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses appointment access context and returns reschedule availability', async () => {
        const user = {
            id: 'user-id',
        };
        const validatedQuery = {
            date: '2026-09-17',
        };
        const availability = {
            appointmentId: 'appointment-id',
            clinicId: 'clinic-id',
            doctorId: 'doctor-id',
            date: '2026-09-17',
            timezone: 'Asia/Kolkata',
            durationMinutes: 30,
            slotDurationMinutes: 15,
            bufferMinutes: 5,
            currentScheduledAt: '2026-09-15T04:30:00.000Z',
            slots: [],
        };
        const req = {
            params: {
                appointmentId: 'appointment-id',
            },
            user,
        } as unknown as Request;
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            locals: {
                validatedQuery,
            },
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockAppointmentService.listRescheduleSlots.mockResolvedValue(availability);

        await listAppointmentRescheduleSlotsController(req, res, next);

        expect(mockAppointmentService.listRescheduleSlots).toHaveBeenCalledWith(
            user,
            'appointment-id',
            validatedQuery
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Appointment reschedule slots fetched successfully',
            data: {
                availability,
            },
        });
    });
});

describe('rescheduleAppointmentController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('submits only the destination timestamp and returns the updated appointment', async () => {
        const user = {
            id: 'user-id',
        };
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            status: 'CONFIRMED',
            scheduledAt: '2026-09-17T09:00:00.000Z',
        };
        const req = {
            params: {
                appointmentId: 'appointment-id',
            },
            body: {
                scheduledAt: '2026-09-17T09:00:00.000Z',
                currentScheduledAt: '2026-09-15T09:00:00.000Z',
            },
            user,
        } as unknown as Request;
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockAppointmentService.rescheduleAppointment.mockResolvedValue(appointment);

        await rescheduleAppointmentController(req, res, next);

        expect(mockAppointmentService.rescheduleAppointment).toHaveBeenCalledWith(
            user,
            'appointment-id',
            '2026-09-17T09:00:00.000Z',
            '2026-09-15T09:00:00.000Z'
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Appointment rescheduled successfully',
            data: {
                appointment,
            },
        });
    });
});

describe('updateAppointmentStatusController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('updates appointment status through the service and returns the appointment', async () => {
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            status: 'ARRIVED',
            noShowPrediction: null,
        };
        const user = {
            id: 'user-id',
        };
        const req = {
            params: {
                appointmentId: 'appointment-id',
            },
            body: {
                status: 'ARRIVED',
            },
            user,
        } as unknown as Request;

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockAppointmentService.updateAppointmentStatus.mockResolvedValue(appointment);

        await updateAppointmentStatusController(req, res, next);

        expect(mockAppointmentService.updateAppointmentStatus).toHaveBeenCalledWith(
            user,
            'appointment-id',
            { status: 'ARRIVED' }
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Appointment status updated successfully',
            data: {
                appointment,
            },
        });
    });

    it('passes invalid transition errors to error middleware', async () => {
        const error = new Error('Requested appointment status transition is not allowed');
        const req = {
            params: {
                appointmentId: 'appointment-id',
            },
            body: {
                status: 'CONFIRMED',
            },
            user: {
                id: 'user-id',
            },
        } as unknown as Request;

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockAppointmentService.updateAppointmentStatus.mockRejectedValue(error);

        await updateAppointmentStatusController(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(status).not.toHaveBeenCalled();
    });
});
