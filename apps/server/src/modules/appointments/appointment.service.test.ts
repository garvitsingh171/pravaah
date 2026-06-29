import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatus, UserRole, UserStatus } from '../../generated/prisma/client.js';

const mockTx = {};

const mockAppointmentRepository = vi.hoisted(() => ({
    findClinicById: vi.fn(),
    findDoctorById: vi.fn(),
    findPatientById: vi.fn(),
    findActiveDoctorClinicLink: vi.fn(),
    findActivePatientClinicLink: vi.fn(),
    acquireAppointmentSlotLock: vi.fn(),
    findDoctorAppointmentAtTime: vi.fn(),
    countPatientAppointmentsByStatus: vi.fn(),
    runInTransaction: vi.fn(),
    createAppointment: vi.fn(),
    createNoShowPrediction: vi.fn(),
    updateAppointmentStatus: vi.fn(),
}));

const mockQueueRepository = vi.hoisted(() => ({
    findHighestQueuePosition: vi.fn(),
    createQueueEntry: vi.fn(),
}));

const mockQueueService = vi.hoisted(() => ({
    calculateNextQueuePosition: vi.fn(),
}));

const mockAccessService = vi.hoisted(() => ({
    verifyAppointmentClinicAccess: vi.fn(),
}));

const mockPredictNoShowRisk = vi.hoisted(() => vi.fn());
const mockToNoShowPredictionResponse = vi.hoisted(() =>
    vi.fn((prediction) => {
        if (!prediction) {
            return null;
        }

        return {
            id: prediction.id,
            riskLevel: prediction.riskLevel,
            score: prediction.score,
            reasons: Array.isArray(prediction.reasons) ? prediction.reasons : [],
            createdAt: prediction.createdAt,
            updatedAt: prediction.updatedAt,
        };
    })
);

vi.mock('./appointment.repository.js', () => ({
    appointmentRepository: mockAppointmentRepository,
}));

vi.mock('../queues/queue.repository.js', () => ({
    queueRepository: mockQueueRepository,
}));

vi.mock('../queues/queue.service.js', () => ({
    queueService: mockQueueService,
}));

vi.mock('../auth/access.service.js', () => ({
    accessService: mockAccessService,
}));

vi.mock('../predictions/prediction.service.js', () => ({
    predictNoShowRisk: mockPredictNoShowRisk,
    toNoShowPredictionResponse: mockToNoShowPredictionResponse,
}));

import { appointmentService } from './appointment.service.js';

const authenticatedUser = {
    id: 'user-id',
    clerkUserId: 'clerk-user-id',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    clinicId: 'clinic-id',
};

describe('appointmentService.createAppointment', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockAppointmentRepository.runInTransaction.mockImplementation(async (operation) => {
            return operation(mockTx);
        });
    });

    it('generates no-show prediction during appointment booking', async () => {
        const clinicId = 'clinic-id';
        const createdByUserId = 'user-id';

        const appointmentScheduledAt = new Date('2026-06-20T10:00:00.000Z');
        const appointmentCreatedAt = new Date('2026-06-18T10:00:00.000Z');

        const input = {
            doctorId: 'doctor-id',
            patientId: 'patient-id',
            scheduledAt: appointmentScheduledAt.toISOString(),
            durationMinutes: 15,
            reason: 'Fever',
            notes: 'Patient has mild fever',
            bookingSource: 'RECEPTION' as const,
        };

        const appointment = {
            id: 'appointment-id',
            clinicId,
            doctorId: input.doctorId,
            patientId: input.patientId,
            scheduledAt: appointmentScheduledAt,
            createdAt: appointmentCreatedAt,
        };

        const noShowPrediction = {
            riskLevel: 'MEDIUM' as const,
            score: 35,
            reasons: [
                {
                    code: 'NEW_PATIENT' as const,
                    message: 'Patient has no previous appointment history.',
                    scoreImpact: 15,
                },
            ],
        };
        const storedNoShowPrediction = {
            id: 'no-show-prediction-id',
            riskLevel: noShowPrediction.riskLevel,
            score: noShowPrediction.score,
            reasons: noShowPrediction.reasons,
            createdAt: new Date('2026-06-18T10:00:01.000Z'),
            updatedAt: new Date('2026-06-18T10:00:01.000Z'),
        };
        const queueEntry = {
            id: 'queue-entry-id',
            clinicId,
            appointmentId: appointment.id,
            doctorId: input.doctorId,
            patientId: input.patientId,
            position: 1,
            status: 'WAITING',
        };

        mockAppointmentRepository.findClinicById.mockResolvedValue({
            id: clinicId,
            isActive: true,
            timezone: 'Asia/Kolkata',
        });

        mockAppointmentRepository.findDoctorById.mockResolvedValue({
            id: input.doctorId,
        });

        mockAppointmentRepository.findPatientById.mockResolvedValue({
            id: input.patientId,
        });

        mockAppointmentRepository.findActiveDoctorClinicLink.mockResolvedValue({
            clinicId,
            doctorId: input.doctorId,
            isActive: true,
        });

        mockAppointmentRepository.findActivePatientClinicLink.mockResolvedValue({
            clinicId,
            patientId: input.patientId,
            isActive: true,
            totalAppointments: 0,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: null,
        });

        mockAppointmentRepository.acquireAppointmentSlotLock.mockResolvedValue(undefined);
        mockAppointmentRepository.findDoctorAppointmentAtTime.mockResolvedValue(null);

        mockQueueRepository.findHighestQueuePosition.mockResolvedValue(null);
        mockQueueService.calculateNextQueuePosition.mockReturnValue(1);

        mockAppointmentRepository.createAppointment.mockResolvedValue(appointment);
        mockQueueRepository.createQueueEntry.mockResolvedValue(queueEntry);
        mockAppointmentRepository.createNoShowPrediction.mockResolvedValue(storedNoShowPrediction);

        mockPredictNoShowRisk.mockReturnValue(noShowPrediction);

        const result = await appointmentService.createAppointment(clinicId, createdByUserId, input);

        expect(mockPredictNoShowRisk).toHaveBeenCalledWith({
            scheduledAt: appointmentScheduledAt,
            bookedAt: appointmentCreatedAt,
            patientNoShowCount: 0,
            patientLateArrivalCount: 0,
            patientCompletedAppointmentCount: 0,
            distanceFromClinicKm: null,
        });

        expect(mockAppointmentRepository.acquireAppointmentSlotLock).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            input.doctorId,
            appointmentScheduledAt
        );

        expect(mockAppointmentRepository.findDoctorAppointmentAtTime).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            input.doctorId,
            appointmentScheduledAt,
            ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_QUEUE', 'CALLED']
        );

        expect(mockAppointmentRepository.createNoShowPrediction).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            appointment.id,
            input.patientId,
            noShowPrediction
        );

        expect(result).toEqual({
            appointment: {
                ...appointment,
                noShowPrediction: storedNoShowPrediction,
            },
            queueEntry,
            noShowPrediction: storedNoShowPrediction,
        });

        expect(result.noShowPrediction).toHaveProperty('score', 35);
        expect(result.noShowPrediction).not.toHaveProperty('appointmentId');
        expect(result.noShowPrediction).not.toHaveProperty('clinicId');
        expect(result.noShowPrediction).not.toHaveProperty('patientId');
        expect(result.appointment.noShowPrediction).toEqual(storedNoShowPrediction);
        expect(result.noShowPrediction.reasons[0]).toEqual({
            code: 'NEW_PATIENT',
            message: 'Patient has no previous appointment history.',
            scoreImpact: 15,
        });
    });

    it('uses maintained appointment history while generating no-show prediction', async () => {
        const clinicId = 'clinic-id';
        const createdByUserId = 'user-id';

        const appointmentScheduledAt = new Date('2026-06-20T10:00:00.000Z');
        const appointmentCreatedAt = new Date('2026-06-18T10:00:00.000Z');

        const input = {
            doctorId: 'doctor-id',
            patientId: 'patient-id',
            scheduledAt: appointmentScheduledAt.toISOString(),
            durationMinutes: 15,
            reason: 'Follow up',
            notes: 'Regular follow up',
            bookingSource: 'RECEPTION' as const,
        };

        const appointment = {
            id: 'appointment-id',
            clinicId,
            doctorId: input.doctorId,
            patientId: input.patientId,
            scheduledAt: appointmentScheduledAt,
            createdAt: appointmentCreatedAt,
        };

        const noShowPrediction = {
            riskLevel: 'HIGH' as const,
            score: 60,
            reasons: [
                {
                    code: 'PREVIOUS_NO_SHOW_HISTORY' as const,
                    message: 'Patient has multiple previous no-show appointments.',
                    scoreImpact: 40,
                },
            ],
        };
        const storedNoShowPrediction = {
            id: 'no-show-prediction-id',
            riskLevel: noShowPrediction.riskLevel,
            score: noShowPrediction.score,
            reasons: noShowPrediction.reasons,
            createdAt: new Date('2026-06-18T10:00:01.000Z'),
            updatedAt: new Date('2026-06-18T10:00:01.000Z'),
        };
        const queueEntry = {
            id: 'queue-entry-id',
            clinicId,
            appointmentId: appointment.id,
            doctorId: input.doctorId,
            patientId: input.patientId,
            position: 4,
            status: 'WAITING',
        };

        mockAppointmentRepository.findClinicById.mockResolvedValue({
            id: clinicId,
            isActive: true,
            timezone: 'Asia/Kolkata',
        });

        mockAppointmentRepository.findDoctorById.mockResolvedValue({
            id: input.doctorId,
        });

        mockAppointmentRepository.findPatientById.mockResolvedValue({
            id: input.patientId,
        });

        mockAppointmentRepository.findActiveDoctorClinicLink.mockResolvedValue({
            clinicId,
            doctorId: input.doctorId,
            isActive: true,
        });

        mockAppointmentRepository.findActivePatientClinicLink.mockResolvedValue({
            clinicId,
            patientId: input.patientId,
            isActive: true,
            totalAppointments: 5,
            totalNoShows: 2,
            totalLateArrivals: 1,
            distanceFromClinicKm: 11.5,
        });

        mockAppointmentRepository.acquireAppointmentSlotLock.mockResolvedValue(undefined);
        mockAppointmentRepository.findDoctorAppointmentAtTime.mockResolvedValue(null);

        mockQueueRepository.findHighestQueuePosition.mockResolvedValue(3);
        mockQueueService.calculateNextQueuePosition.mockReturnValue(4);

        mockAppointmentRepository.createAppointment.mockResolvedValue(appointment);
        mockQueueRepository.createQueueEntry.mockResolvedValue(queueEntry);
        mockAppointmentRepository.createNoShowPrediction.mockResolvedValue(storedNoShowPrediction);

        mockPredictNoShowRisk.mockReturnValue(noShowPrediction);

        const result = await appointmentService.createAppointment(clinicId, createdByUserId, input);

        expect(mockPredictNoShowRisk).toHaveBeenCalledWith({
            scheduledAt: appointmentScheduledAt,
            bookedAt: appointmentCreatedAt,
            patientNoShowCount: 2,
            patientLateArrivalCount: 1,
            patientCompletedAppointmentCount: 3,
            distanceFromClinicKm: 11.5,
        });

        expect(mockAppointmentRepository.createNoShowPrediction).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            appointment.id,
            input.patientId,
            noShowPrediction
        );

        expect(result.noShowPrediction).toEqual(storedNoShowPrediction);
        expect(result.appointment.noShowPrediction).toEqual(storedNoShowPrediction);
        expect(result.queueEntry).toEqual(queueEntry);
        expect(result.noShowPrediction).toHaveProperty('score', 60);
    });

    it('rejects a conflicting slot after acquiring the transaction lock', async () => {
        const clinicId = 'clinic-id';
        const createdByUserId = 'user-id';
        const appointmentScheduledAt = new Date('2026-06-20T10:00:00.000Z');

        const input = {
            doctorId: 'doctor-id',
            patientId: 'patient-id',
            scheduledAt: appointmentScheduledAt.toISOString(),
            durationMinutes: 15,
            reason: 'Follow up',
            notes: 'Regular follow up',
            bookingSource: 'RECEPTION' as const,
        };

        mockAppointmentRepository.findClinicById.mockResolvedValue({
            id: clinicId,
            isActive: true,
            timezone: 'Asia/Kolkata',
        });

        mockAppointmentRepository.findDoctorById.mockResolvedValue({
            id: input.doctorId,
        });

        mockAppointmentRepository.findPatientById.mockResolvedValue({
            id: input.patientId,
        });

        mockAppointmentRepository.findActiveDoctorClinicLink.mockResolvedValue({
            clinicId,
            doctorId: input.doctorId,
            isActive: true,
        });

        mockAppointmentRepository.findActivePatientClinicLink.mockResolvedValue({
            clinicId,
            patientId: input.patientId,
            isActive: true,
            totalAppointments: 0,
            totalNoShows: 0,
            totalLateArrivals: 0,
            distanceFromClinicKm: null,
        });

        mockAppointmentRepository.acquireAppointmentSlotLock.mockResolvedValue(undefined);
        mockAppointmentRepository.findDoctorAppointmentAtTime.mockResolvedValue({
            id: 'existing-appointment-id',
        });

        await expect(
            appointmentService.createAppointment(clinicId, createdByUserId, input)
        ).rejects.toMatchObject({
            statusCode: 409,
            code: 'APPOINTMENT_SLOT_CONFLICT',
            message: 'This doctor already has an appointment in this time slot.',
        });

        expect(mockAppointmentRepository.acquireAppointmentSlotLock).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            input.doctorId,
            appointmentScheduledAt
        );

        expect(mockAppointmentRepository.findDoctorAppointmentAtTime).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            input.doctorId,
            appointmentScheduledAt,
            ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_QUEUE', 'CALLED']
        );

        expect(mockAppointmentRepository.createAppointment).not.toHaveBeenCalled();
        expect(mockQueueRepository.createQueueEntry).not.toHaveBeenCalled();
        expect(mockAppointmentRepository.createNoShowPrediction).not.toHaveBeenCalled();
    });
});

describe('appointmentService.updateAppointmentStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('updates appointment status using the clinic verified from access checks', async () => {
        const appointment = {
            id: 'appointment-id',
            clinicId: 'clinic-id',
            noShowPrediction: null,
        };

        mockAccessService.verifyAppointmentClinicAccess.mockResolvedValue({
            id: 'appointment-id',
            clinicId: 'clinic-id',
        });
        mockAppointmentRepository.updateAppointmentStatus.mockResolvedValue({
            appointment,
            failureReason: null,
        });

        await expect(
            appointmentService.updateAppointmentStatus(
                authenticatedUser,
                'appointment-id',
                AppointmentStatus.COMPLETED
            )
        ).resolves.toEqual({
            id: 'appointment-id',
            clinicId: 'clinic-id',
            noShowPrediction: null,
        });

        expect(mockAccessService.verifyAppointmentClinicAccess).toHaveBeenCalledWith(
            authenticatedUser,
            'appointment-id'
        );
        expect(mockAppointmentRepository.updateAppointmentStatus).toHaveBeenCalledWith(
            'appointment-id',
            'clinic-id',
            AppointmentStatus.COMPLETED
        );
    });

    it('does not update appointment status when clinic access is denied', async () => {
        mockAccessService.verifyAppointmentClinicAccess.mockRejectedValue(
            new Error('CLINIC_ACCESS_DENIED')
        );

        await expect(
            appointmentService.updateAppointmentStatus(
                authenticatedUser,
                'appointment-id',
                AppointmentStatus.COMPLETED
            )
        ).rejects.toThrow('CLINIC_ACCESS_DENIED');

        expect(mockAppointmentRepository.updateAppointmentStatus).not.toHaveBeenCalled();
    });
});
