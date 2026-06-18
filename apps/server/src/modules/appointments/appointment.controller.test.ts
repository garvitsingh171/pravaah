import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAppointmentService = vi.hoisted(() => ({
    createAppointment: vi.fn(),
}));

vi.mock('./appointment.service.js', () => ({
    appointmentService: mockAppointmentService,
}));

import { createAppointmentController } from './appointment.controller.js';

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
            riskLevel: 'MEDIUM' as const,
            reasons: ['Patient has no previous appointment history.'],
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
                noShowPrediction,
            },
        });
        expect(noShowPrediction).not.toHaveProperty('score');
        expect(noShowPrediction.reasons).toEqual(['Patient has no previous appointment history.']);
    });
});
