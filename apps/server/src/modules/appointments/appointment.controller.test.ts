import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAppointmentService = vi.hoisted(() => ({
    createAppointment: vi.fn(),
    listAppointments: vi.fn(),
}));

vi.mock('./appointment.service.js', () => ({
    appointmentService: mockAppointmentService,
}));

import {
    createAppointmentController,
    listAppointmentsController,
} from './appointment.controller.js';

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
            appointmentId: appointment.id,
            clinicId: appointment.clinicId,
            patientId: appointment.patientId,
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
            appointment,
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
                appointment,
                queueEntry,
                noShowPrediction,
            },
        });
        expect(noShowPrediction.score).toBe(35);
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
