import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../utils/AppError.js';

const mockDashboardRepository = vi.hoisted(() => ({
    findUserById: vi.fn(),
    findClinicById: vi.fn(),
    countAppointmentsByStatus: vi.fn(),
    countQueueEntriesByStatus: vi.fn(),
    findAppointmentsForRiskSummary: vi.fn(),
    countPatientAppointmentsByStatuses: vi.fn(),
}));

const mockPredictNoShowRisk = vi.hoisted(() => vi.fn());

vi.mock('./dashboard.repository.js', () => ({
    dashboardRepository: mockDashboardRepository,
}));

vi.mock('../predictions/prediction.service.js', () => ({
    predictNoShowRisk: mockPredictNoShowRisk,
}));

import { dashboardService } from './dashboard.service.js';

describe('dashboardService.getDashboardSummary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns clinic-scoped appointment, queue, and no-show risk counts', async () => {
        mockDashboardRepository.findUserById.mockResolvedValue({
            id: 'user-id',
            clinicId: 'clinic-id',
            status: 'ACTIVE',
        });

        mockDashboardRepository.findClinicById.mockResolvedValue({
            id: 'clinic-id',
            isActive: true,
            timezone: 'Asia/Kolkata',
        });

        mockDashboardRepository.countAppointmentsByStatus.mockResolvedValue([
            {
                status: 'SCHEDULED',
                _count: {
                    status: 2,
                },
            },
            {
                status: 'COMPLETED',
                _count: {
                    status: 1,
                },
            },
        ]);

        mockDashboardRepository.countQueueEntriesByStatus.mockResolvedValue([
            {
                status: 'WAITING',
                _count: {
                    status: 1,
                },
            },
            {
                status: 'CALLED',
                _count: {
                    status: 1,
                },
            },
        ]);

        mockDashboardRepository.findAppointmentsForRiskSummary.mockResolvedValue([
            {
                patientId: 'patient-1',
                scheduledAt: new Date('2026-06-19T05:00:00.000Z'),
                createdAt: new Date('2026-06-19T01:00:00.000Z'),
            },
            {
                patientId: 'patient-2',
                scheduledAt: new Date('2026-06-19T07:00:00.000Z'),
                createdAt: new Date('2026-06-18T07:00:00.000Z'),
            },
        ]);

        mockDashboardRepository.countPatientAppointmentsByStatuses.mockResolvedValue([
            {
                patientId: 'patient-1',
                status: 'NO_SHOW',
                _count: {
                    status: 2,
                },
            },
            {
                patientId: 'patient-2',
                status: 'COMPLETED',
                _count: {
                    status: 3,
                },
            },
        ]);

        mockPredictNoShowRisk
            .mockReturnValueOnce({
                riskLevel: 'HIGH',
                score: 60,
                reasons: [],
            })
            .mockReturnValueOnce({
                riskLevel: 'LOW',
                score: 0,
                reasons: [],
            });

        const result = await dashboardService.getDashboardSummary(
            'user-id',
            'clinic-id',
            '2026-06-19'
        );

        expect(mockDashboardRepository.countAppointmentsByStatus).toHaveBeenCalledWith(
            'clinic-id',
            '2026-06-19',
            'Asia/Kolkata'
        );
        expect(mockDashboardRepository.countQueueEntriesByStatus).toHaveBeenCalledWith(
            'clinic-id',
            '2026-06-19',
            'Asia/Kolkata'
        );
        expect(mockDashboardRepository.countPatientAppointmentsByStatuses).toHaveBeenCalledWith(
            'clinic-id',
            ['patient-1', 'patient-2'],
            ['NO_SHOW', 'COMPLETED']
        );

        expect(mockPredictNoShowRisk).toHaveBeenCalledWith({
            scheduledAt: new Date('2026-06-19T05:00:00.000Z'),
            bookedAt: new Date('2026-06-19T01:00:00.000Z'),
            patientNoShowCount: 2,
            patientCompletedAppointmentCount: 0,
        });
        expect(mockPredictNoShowRisk).toHaveBeenCalledWith({
            scheduledAt: new Date('2026-06-19T07:00:00.000Z'),
            bookedAt: new Date('2026-06-18T07:00:00.000Z'),
            patientNoShowCount: 0,
            patientCompletedAppointmentCount: 3,
        });

        expect(result).toEqual({
            clinicId: 'clinic-id',
            date: '2026-06-19',
            appointmentSummary: {
                total: 3,
                scheduled: 2,
                confirmed: 0,
                arrived: 0,
                inQueue: 0,
                called: 0,
                completed: 1,
                cancelled: 0,
                noShow: 0,
            },
            queueSummary: {
                total: 2,
                waiting: 1,
                arrived: 0,
                called: 1,
                completed: 0,
                cancelled: 0,
                noShow: 0,
            },
            noShowRiskSummary: {
                low: 1,
                medium: 0,
                high: 1,
            },
        });
    });

    it('rejects users outside the requested clinic', async () => {
        mockDashboardRepository.findUserById.mockResolvedValue({
            id: 'user-id',
            clinicId: 'other-clinic-id',
            status: 'ACTIVE',
        });

        await expect(
            dashboardService.getDashboardSummary('user-id', 'clinic-id', '2026-06-19')
        ).rejects.toMatchObject(
            new AppError(403, 'CLINIC_ACCESS_DENIED', 'You do not have access to this clinic')
        );

        expect(mockDashboardRepository.findClinicById).not.toHaveBeenCalled();
    });
});
