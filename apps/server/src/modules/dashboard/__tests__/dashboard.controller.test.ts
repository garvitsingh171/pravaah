import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDashboardService = vi.hoisted(() => ({
    getDashboardSummary: vi.fn(),
    getHighRiskAppointments: vi.fn(),
    getTodayActivity: vi.fn(),
}));

vi.mock('../dashboard.service.js', () => ({
    dashboardService: mockDashboardService,
}));

import {
    getDashboardSummaryController,
    getHighRiskAppointmentsController,
    getTodayActivityController,
} from '../dashboard.controller.js';

describe('getDashboardSummaryController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns the dashboard summary response shape', async () => {
        const dashboardSummary = {
            clinicId: 'clinic-id',
            date: '2026-06-19',
            appointmentSummary: {
                total: 4,
                scheduled: 1,
                confirmed: 1,
                arrived: 0,
                inQueue: 1,
                called: 0,
                completed: 1,
                cancelled: 0,
                noShow: 0,
            },
            queueSummary: {
                total: 3,
                waiting: 1,
                arrived: 0,
                called: 1,
                completed: 1,
                cancelled: 0,
                noShow: 0,
            },
            noShowRiskSummary: {
                low: 1,
                medium: 2,
                high: 0,
            },
        };

        const req = {
            params: {
                clinicId: 'clinic-id',
            },
            user: {
                id: 'user-id',
                clerkUserId: 'clerk-user-id',
                role: 'ADMIN',
                status: 'ACTIVE',
                clinicId: 'clinic-id',
            },
        } as unknown as Request;

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            locals: {
                validatedQuery: {
                    date: '2026-06-19',
                },
            },
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockDashboardService.getDashboardSummary.mockResolvedValue(dashboardSummary);

        await getDashboardSummaryController(req, res, next);

        expect(mockDashboardService.getDashboardSummary).toHaveBeenCalledWith(
            req.user,
            'clinic-id',
            '2026-06-19'
        );

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Dashboard summary fetched successfully',
            data: {
                dashboardSummary,
            },
        });
        expect(dashboardSummary).not.toHaveProperty('appointments');
        expect(dashboardSummary).not.toHaveProperty('queueEntries');
    });
});

describe('getHighRiskAppointmentsController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns high-risk appointments with public prediction score details', async () => {
        const result = {
            clinicId: 'clinic-id',
            date: '2026-06-19',
            highRiskAppointments: [
                {
                    appointment: {
                        id: 'appointment-id',
                        scheduledAt: new Date('2026-06-19T05:00:00.000Z'),
                        durationMinutes: 15,
                        status: 'SCHEDULED',
                        bookingSource: 'RECEPTION',
                        reason: 'Fever',
                    },
                    doctor: {
                        id: 'doctor-id',
                        fullName: 'Dr. Asha Rao',
                        specialization: 'General Medicine',
                        qualification: 'MBBS',
                    },
                    patient: {
                        id: 'patient-id',
                        fullName: 'Rohan Mehta',
                        phone: '9999999999',
                        email: null,
                        gender: null,
                        age: 34,
                    },
                    noShowPrediction: {
                        id: 'no-show-prediction-id',
                        riskLevel: 'HIGH' as const,
                        score: 60,
                        reasons: [
                            {
                                code: 'PREVIOUS_NO_SHOW_HISTORY',
                                message: 'Patient has multiple previous no-show appointments.',
                                scoreImpact: 40,
                            },
                        ],
                        createdAt: new Date('2026-06-18T10:00:01.000Z'),
                        updatedAt: new Date('2026-06-18T10:00:01.000Z'),
                    },
                },
            ],
        };

        const req = {
            params: {
                clinicId: 'clinic-id',
            },
            user: {
                id: 'user-id',
                clerkUserId: 'clerk-user-id',
                role: 'ADMIN',
                status: 'ACTIVE',
                clinicId: 'clinic-id',
            },
        } as unknown as Request;

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            locals: {
                validatedQuery: {
                    date: '2026-06-19',
                },
            },
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockDashboardService.getHighRiskAppointments.mockResolvedValue(result);

        await getHighRiskAppointmentsController(req, res, next);

        expect(mockDashboardService.getHighRiskAppointments).toHaveBeenCalledWith(
            req.user,
            'clinic-id',
            '2026-06-19'
        );

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'High-risk appointments fetched successfully',
            data: result,
        });
        expect(result.highRiskAppointments).toEqual([
            expect.objectContaining({
                noShowPrediction: expect.objectContaining({
                    score: 60,
                }),
            }),
        ]);
    });
});

describe('getTodayActivityController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns today activity response shape', async () => {
        const result = {
            clinicId: 'clinic-id',
            date: '2026-06-19',
            activityItems: [
                {
                    id: 'queue:queue-id:called',
                    type: 'PATIENT_CALLED',
                    timestamp: new Date('2026-06-19T06:00:00.000Z'),
                    appointment: {
                        id: 'appointment-id',
                        scheduledAt: new Date('2026-06-19T05:00:00.000Z'),
                        durationMinutes: 15,
                        status: 'CALLED',
                        bookingSource: 'RECEPTION',
                        reason: 'Fever',
                    },
                    doctor: {
                        id: 'doctor-id',
                        fullName: 'Dr. Asha Rao',
                        specialization: 'General Medicine',
                        qualification: 'MBBS',
                    },
                    patient: {
                        id: 'patient-id',
                        fullName: 'Rohan Mehta',
                        phone: '9999999999',
                        email: null,
                        gender: null,
                        age: 34,
                    },
                },
            ],
        };

        const req = {
            params: {
                clinicId: 'clinic-id',
            },
            user: {
                id: 'user-id',
                clerkUserId: 'clerk-user-id',
                role: 'ADMIN',
                status: 'ACTIVE',
                clinicId: 'clinic-id',
            },
        } as unknown as Request;

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockDashboardService.getTodayActivity.mockResolvedValue(result);

        await getTodayActivityController(req, res, next);

        expect(mockDashboardService.getTodayActivity).toHaveBeenCalledWith(req.user, 'clinic-id');

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: "Today's clinic activity fetched successfully",
            data: result,
        });
    });
});
