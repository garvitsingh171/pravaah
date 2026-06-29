import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../utils/AppError.js';

const mockDashboardRepository = vi.hoisted(() => ({
    countAppointmentsByStatus: vi.fn(),
    countQueueEntriesByStatus: vi.fn(),
    countNoShowPredictionsByRiskLevel: vi.fn(),
    findAppointmentsMissingNoShowPrediction: vi.fn(),
    countPatientAppointmentsByStatuses: vi.fn(),
    createNoShowPredictions: vi.fn(),
    findHighRiskAppointmentCandidates: vi.fn(),
    getClinicDateRange: vi.fn(),
    findAppointmentActivityCandidates: vi.fn(),
    findQueueActivityCandidates: vi.fn(),
}));

const mockAccessService = vi.hoisted(() => ({
    verifyClinicAccess: vi.fn(),
}));

vi.mock('./dashboard.repository.js', () => ({
    dashboardRepository: mockDashboardRepository,
}));

vi.mock('../auth/access.service.js', () => ({
    accessService: mockAccessService,
}));

import { dashboardService } from './dashboard.service.js';

const authenticatedUser = {
    id: 'user-id',
    clerkUserId: 'clerk-user-id',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    clinicId: 'clinic-id',
};

describe('dashboardService.getDashboardSummary', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockDashboardRepository.findAppointmentsMissingNoShowPrediction.mockResolvedValue([]);
        mockDashboardRepository.createNoShowPredictions.mockResolvedValue({
            count: 0,
        });
    });

    it('returns clinic-scoped appointment, queue, and no-show risk counts', async () => {
        mockAccessService.verifyClinicAccess.mockResolvedValue({
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

        mockDashboardRepository.countNoShowPredictionsByRiskLevel.mockResolvedValue([
            {
                riskLevel: 'HIGH',
                _count: {
                    riskLevel: 1,
                },
            },
            {
                riskLevel: 'LOW',
                _count: {
                    riskLevel: 1,
                },
            },
        ]);

        const result = await dashboardService.getDashboardSummary(
            authenticatedUser,
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
        expect(mockDashboardRepository.countNoShowPredictionsByRiskLevel).toHaveBeenCalledWith(
            'clinic-id',
            '2026-06-19',
            'Asia/Kolkata'
        );
        expect(mockDashboardRepository.createNoShowPredictions).not.toHaveBeenCalled();

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
        mockAccessService.verifyClinicAccess.mockRejectedValue(
            new AppError(403, 'CLINIC_ACCESS_DENIED', 'You do not have access to this clinic')
        );

        await expect(
            dashboardService.getDashboardSummary(authenticatedUser, 'clinic-id', '2026-06-19')
        ).rejects.toMatchObject(
            new AppError(403, 'CLINIC_ACCESS_DENIED', 'You do not have access to this clinic')
        );

        expect(mockDashboardRepository.countAppointmentsByStatus).not.toHaveBeenCalled();
    });

    it('backfills missing stored predictions before reading risk summary counts', async () => {
        const scheduledAt = new Date('2026-06-19T05:00:00.000Z');
        const createdAt = new Date('2026-06-18T05:00:00.000Z');

        mockAccessService.verifyClinicAccess.mockResolvedValue({
            id: 'clinic-id',
            isActive: true,
            timezone: 'Asia/Kolkata',
        });

        mockDashboardRepository.findAppointmentsMissingNoShowPrediction.mockResolvedValue([
            {
                id: 'legacy-appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-1',
                scheduledAt,
                createdAt,
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
        ]);

        mockDashboardRepository.countAppointmentsByStatus.mockResolvedValue([]);
        mockDashboardRepository.countQueueEntriesByStatus.mockResolvedValue([]);
        mockDashboardRepository.countNoShowPredictionsByRiskLevel.mockResolvedValue([
            {
                riskLevel: 'HIGH',
                _count: {
                    riskLevel: 1,
                },
            },
        ]);

        const result = await dashboardService.getDashboardSummary(
            authenticatedUser,
            'clinic-id',
            '2026-06-19'
        );

        expect(
            mockDashboardRepository.findAppointmentsMissingNoShowPrediction
        ).toHaveBeenCalledWith('clinic-id', '2026-06-19', 'Asia/Kolkata');
        expect(mockDashboardRepository.countPatientAppointmentsByStatuses).toHaveBeenCalledWith(
            'clinic-id',
            ['patient-1'],
            ['NO_SHOW', 'COMPLETED']
        );
        expect(mockDashboardRepository.createNoShowPredictions).toHaveBeenCalledWith([
            expect.objectContaining({
                appointmentId: 'legacy-appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-1',
                riskLevel: 'MEDIUM',
                score: 55,
                reasons: expect.arrayContaining([
                    expect.objectContaining({
                        code: 'PREVIOUS_NO_SHOW_HISTORY',
                    }),
                    expect.objectContaining({
                        code: 'SHORT_NOTICE_BOOKING',
                    }),
                ]),
            }),
        ]);
        expect(mockDashboardRepository.countNoShowPredictionsByRiskLevel).toHaveBeenCalledWith(
            'clinic-id',
            '2026-06-19',
            'Asia/Kolkata'
        );
        expect(result.noShowRiskSummary).toEqual({
            low: 0,
            medium: 0,
            high: 1,
        });
    });
});

describe('dashboardService.getHighRiskAppointments', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockDashboardRepository.findAppointmentsMissingNoShowPrediction.mockResolvedValue([]);
        mockDashboardRepository.createNoShowPredictions.mockResolvedValue({
            count: 0,
        });
    });

    it('returns only HIGH risk appointments for the requested clinic', async () => {
        mockAccessService.verifyClinicAccess.mockResolvedValue({
            id: 'clinic-id',
            isActive: true,
            timezone: 'Asia/Kolkata',
        });

        mockDashboardRepository.findHighRiskAppointmentCandidates.mockResolvedValue([
            {
                id: 'high-risk-appointment-id',
                patientId: 'patient-1',
                scheduledAt: new Date('2026-06-19T05:00:00.000Z'),
                createdAt: new Date('2026-06-19T01:00:00.000Z'),
                durationMinutes: 15,
                status: 'SCHEDULED',
                bookingSource: 'RECEPTION',
                reason: 'Fever',
                doctor: {
                    id: 'doctor-id',
                    fullName: 'Dr. Asha Rao',
                    specialization: 'General Medicine',
                    qualification: 'MBBS',
                },
                patient: {
                    id: 'patient-1',
                    fullName: 'Rohan Mehta',
                    phone: '9999999999',
                    email: null,
                    gender: null,
                    age: 34,
                },
                noShowPrediction: {
                    id: 'high-risk-prediction-id',
                    riskLevel: 'HIGH',
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
            {
                id: 'medium-risk-appointment-id',
                patientId: 'patient-2',
                scheduledAt: new Date('2026-06-19T07:00:00.000Z'),
                createdAt: new Date('2026-06-18T07:00:00.000Z'),
                durationMinutes: 15,
                status: 'CONFIRMED',
                bookingSource: 'PHONE',
                reason: 'Follow up',
                doctor: {
                    id: 'doctor-id',
                    fullName: 'Dr. Asha Rao',
                    specialization: 'General Medicine',
                    qualification: 'MBBS',
                },
                patient: {
                    id: 'patient-2',
                    fullName: 'Nisha Shah',
                    phone: '8888888888',
                    email: 'nisha@example.com',
                    gender: 'FEMALE',
                    age: 29,
                },
                noShowPrediction: {
                    id: 'medium-risk-prediction-id',
                    riskLevel: 'MEDIUM',
                    score: 35,
                    reasons: [
                        {
                            code: 'SHORT_NOTICE_BOOKING',
                            message: 'Appointment was booked with less than 24 hours notice.',
                            scoreImpact: 20,
                        },
                    ],
                    createdAt: new Date('2026-06-18T10:00:01.000Z'),
                    updatedAt: new Date('2026-06-18T10:00:01.000Z'),
                },
            },
        ]);

        const result = await dashboardService.getHighRiskAppointments(
            authenticatedUser,
            'clinic-id',
            '2026-06-19'
        );

        expect(mockDashboardRepository.findHighRiskAppointmentCandidates).toHaveBeenCalledWith(
            'clinic-id',
            '2026-06-19',
            'Asia/Kolkata'
        );

        expect(result).toEqual({
            clinicId: 'clinic-id',
            date: '2026-06-19',
            highRiskAppointments: [
                {
                    appointment: {
                        id: 'high-risk-appointment-id',
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
                        id: 'patient-1',
                        fullName: 'Rohan Mehta',
                        phone: '9999999999',
                        email: null,
                        gender: null,
                        age: 34,
                    },
                    noShowPrediction: {
                        id: 'high-risk-prediction-id',
                        riskLevel: 'HIGH',
                        score: 60,
                        reasons: [
                            {
                                code: 'PREVIOUS_NO_SHOW_HISTORY',
                                message: 'Patient has multiple previous no-show appointments.',
                                scoreImpact: 40,
                            },
                        ],
                        suggestedActions: expect.arrayContaining([
                            'Review this appointment during front-desk preparation.',
                        ]),
                        modelVersion: 'starter-rule-v1',
                        generatedAt: new Date('2026-06-18T10:00:01.000Z'),
                        createdAt: new Date('2026-06-18T10:00:01.000Z'),
                        updatedAt: new Date('2026-06-18T10:00:01.000Z'),
                    },
                },
            ],
        });
        expect(result.highRiskAppointments).toEqual([
            expect.objectContaining({
                noShowPrediction: expect.objectContaining({
                    score: 60,
                }),
            }),
        ]);
    });

    it('rejects users outside the requested clinic', async () => {
        mockAccessService.verifyClinicAccess.mockRejectedValue(
            new AppError(403, 'CLINIC_ACCESS_DENIED', 'You do not have access to this clinic')
        );

        await expect(
            dashboardService.getHighRiskAppointments(authenticatedUser, 'clinic-id', '2026-06-19')
        ).rejects.toMatchObject(
            new AppError(403, 'CLINIC_ACCESS_DENIED', 'You do not have access to this clinic')
        );

        expect(mockDashboardRepository.findHighRiskAppointmentCandidates).not.toHaveBeenCalled();
    });
});

describe('dashboardService.getTodayActivity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns clinic activity ordered by most recent first', async () => {
        const dateRange = {
            start: new Date('2026-06-18T18:30:00.000Z'),
            end: new Date('2026-06-19T18:30:00.000Z'),
        };

        const appointment = {
            id: 'appointment-id',
            scheduledAt: new Date('2026-06-19T05:00:00.000Z'),
            durationMinutes: 15,
            status: 'SCHEDULED',
            bookingSource: 'RECEPTION',
            reason: 'Fever',
        };

        const doctor = {
            id: 'doctor-id',
            fullName: 'Dr. Asha Rao',
            specialization: 'General Medicine',
            qualification: 'MBBS',
        };

        const patient = {
            id: 'patient-id',
            fullName: 'Rohan Mehta',
            phone: '9999999999',
            email: null,
            gender: null,
            age: 34,
        };

        mockAccessService.verifyClinicAccess.mockResolvedValue({
            id: 'clinic-id',
            isActive: true,
            timezone: 'Asia/Kolkata',
        });

        mockDashboardRepository.getClinicDateRange.mockResolvedValue(dateRange);
        mockDashboardRepository.findAppointmentActivityCandidates.mockResolvedValue([
            {
                ...appointment,
                createdAt: new Date('2026-06-19T02:00:00.000Z'),
                updatedAt: new Date('2026-06-19T02:00:00.000Z'),
                doctor,
                patient,
            },
        ]);
        mockDashboardRepository.findQueueActivityCandidates.mockResolvedValue([
            {
                id: 'queue-id',
                position: 1,
                status: 'CALLED',
                queuedAt: new Date('2026-06-19T03:00:00.000Z'),
                calledAt: new Date('2026-06-19T04:00:00.000Z'),
                completedAt: null,
                updatedAt: new Date('2026-06-19T04:00:00.000Z'),
                appointment,
                doctor,
                patient,
            },
        ]);

        const result = await dashboardService.getTodayActivity(authenticatedUser, 'clinic-id');

        expect(mockDashboardRepository.getClinicDateRange).toHaveBeenCalledWith(
            expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            'Asia/Kolkata'
        );
        expect(mockDashboardRepository.findAppointmentActivityCandidates).toHaveBeenCalledWith(
            'clinic-id',
            dateRange
        );
        expect(mockDashboardRepository.findQueueActivityCandidates).toHaveBeenCalledWith(
            'clinic-id',
            dateRange
        );

        expect(result.clinicId).toBe('clinic-id');
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(result.activityItems.map((activityItem) => activityItem.type)).toEqual([
            'PATIENT_CALLED',
            'QUEUE_JOINED',
            'APPOINTMENT_BOOKED',
        ]);
        expect(result.activityItems[0]).toMatchObject({
            id: 'queue:queue-id:called',
            appointment,
            doctor,
            patient,
        });
    });

    it('does not derive queue arrival activity from updatedAt', async () => {
        const dateRange = {
            start: new Date('2026-06-18T18:30:00.000Z'),
            end: new Date('2026-06-19T18:30:00.000Z'),
        };

        const appointment = {
            id: 'appointment-id',
            scheduledAt: new Date('2026-06-19T05:00:00.000Z'),
            durationMinutes: 15,
            status: 'ARRIVED',
            bookingSource: 'RECEPTION',
            reason: 'Fever',
        };

        const doctor = {
            id: 'doctor-id',
            fullName: 'Dr. Asha Rao',
            specialization: 'General Medicine',
            qualification: 'MBBS',
        };

        const patient = {
            id: 'patient-id',
            fullName: 'Rohan Mehta',
            phone: '9999999999',
            email: null,
            gender: null,
            age: 34,
        };

        mockAccessService.verifyClinicAccess.mockResolvedValue({
            id: 'clinic-id',
            isActive: true,
            timezone: 'Asia/Kolkata',
        });

        mockDashboardRepository.getClinicDateRange.mockResolvedValue(dateRange);
        mockDashboardRepository.findAppointmentActivityCandidates.mockResolvedValue([]);
        mockDashboardRepository.findQueueActivityCandidates.mockResolvedValue([
            {
                id: 'queue-id',
                position: 2,
                status: 'ARRIVED',
                queuedAt: new Date('2026-06-19T03:00:00.000Z'),
                calledAt: null,
                completedAt: null,
                updatedAt: new Date('2026-06-19T06:00:00.000Z'),
                appointment,
                doctor,
                patient,
            },
        ]);

        const result = await dashboardService.getTodayActivity(authenticatedUser, 'clinic-id');

        expect(result.activityItems.map((activityItem) => activityItem.type)).toEqual([
            'QUEUE_JOINED',
        ]);
        expect(result.activityItems).not.toEqual([
            expect.objectContaining({
                type: 'QUEUE_ARRIVED',
            }),
        ]);
    });

    it('rejects users outside the requested clinic', async () => {
        mockAccessService.verifyClinicAccess.mockRejectedValue(
            new AppError(403, 'CLINIC_ACCESS_DENIED', 'You do not have access to this clinic')
        );

        await expect(
            dashboardService.getTodayActivity(authenticatedUser, 'clinic-id')
        ).rejects.toMatchObject(
            new AppError(403, 'CLINIC_ACCESS_DENIED', 'You do not have access to this clinic')
        );

        expect(mockDashboardRepository.findAppointmentActivityCandidates).not.toHaveBeenCalled();
    });
});
