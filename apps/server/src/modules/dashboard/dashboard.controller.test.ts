import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDashboardService = vi.hoisted(() => ({
    getDashboardSummary: vi.fn(),
}));

vi.mock('./dashboard.service.js', () => ({
    dashboardService: mockDashboardService,
}));

import { getDashboardSummaryController } from './dashboard.controller.js';

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
            'user-id',
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
