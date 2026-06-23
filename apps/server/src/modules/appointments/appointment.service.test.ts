import { beforeEach, describe, expect, it, vi } from 'vitest';

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
}));

const mockQueueRepository = vi.hoisted(() => ({
    findHighestQueuePosition: vi.fn(),
    createQueueEntry: vi.fn(),
}));

const mockQueueService = vi.hoisted(() => ({
    calculateNextQueuePosition: vi.fn(),
}));

const mockPredictNoShowRisk = vi.hoisted(() => vi.fn());

vi.mock('./appointment.repository.js', () => ({
    appointmentRepository: mockAppointmentRepository,
}));

vi.mock('../queues/queue.repository.js', () => ({
    queueRepository: mockQueueRepository,
}));

vi.mock('../queues/queue.service.js', () => ({
    queueService: mockQueueService,
}));

vi.mock('../predictions/prediction.service.js', () => ({
    predictNoShowRisk: mockPredictNoShowRisk,
}));

import { appointmentService } from './appointment.service.js';

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
            appointmentId: appointment.id,
            clinicId,
            patientId: input.patientId,
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
        });

        mockAppointmentRepository.countPatientAppointmentsByStatus
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        mockAppointmentRepository.acquireAppointmentSlotLock.mockResolvedValue(undefined);
        mockAppointmentRepository.findDoctorAppointmentAtTime.mockResolvedValue(null);

        mockQueueRepository.findHighestQueuePosition.mockResolvedValue(null);
        mockQueueService.calculateNextQueuePosition.mockReturnValue(1);

        mockAppointmentRepository.createAppointment.mockResolvedValue(appointment);
        mockQueueRepository.createQueueEntry.mockResolvedValue(queueEntry);
        mockAppointmentRepository.createNoShowPrediction.mockResolvedValue(storedNoShowPrediction);

        mockPredictNoShowRisk.mockReturnValue(noShowPrediction);

        const result = await appointmentService.createAppointment(clinicId, createdByUserId, input);

        expect(mockAppointmentRepository.countPatientAppointmentsByStatus).toHaveBeenCalledWith(
            clinicId,
            input.patientId,
            ['NO_SHOW']
        );

        expect(mockAppointmentRepository.countPatientAppointmentsByStatus).toHaveBeenCalledWith(
            clinicId,
            input.patientId,
            ['COMPLETED']
        );

        expect(mockPredictNoShowRisk).toHaveBeenCalledWith({
            scheduledAt: appointmentScheduledAt,
            bookedAt: appointmentCreatedAt,
            patientNoShowCount: 0,
            patientCompletedAppointmentCount: 0,
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
            appointment,
            queueEntry,
            noShowPrediction: storedNoShowPrediction,
        });

        expect(result.noShowPrediction.score).toBe(35);
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
            appointmentId: appointment.id,
            clinicId,
            patientId: input.patientId,
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
        });

        mockAppointmentRepository.countPatientAppointmentsByStatus
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(3);

        mockAppointmentRepository.acquireAppointmentSlotLock.mockResolvedValue(undefined);
        mockAppointmentRepository.findDoctorAppointmentAtTime.mockResolvedValue(null);

        mockQueueRepository.findHighestQueuePosition.mockResolvedValue(3);
        mockQueueService.calculateNextQueuePosition.mockReturnValue(4);

        mockAppointmentRepository.createAppointment.mockResolvedValue(appointment);
        mockQueueRepository.createQueueEntry.mockResolvedValue(queueEntry);
        mockAppointmentRepository.createNoShowPrediction.mockResolvedValue(storedNoShowPrediction);

        mockPredictNoShowRisk.mockReturnValue(noShowPrediction);

        const result = await appointmentService.createAppointment(clinicId, createdByUserId, input);

        expect(mockAppointmentRepository.countPatientAppointmentsByStatus).toHaveBeenCalledWith(
            clinicId,
            input.patientId,
            ['NO_SHOW']
        );

        expect(mockAppointmentRepository.countPatientAppointmentsByStatus).toHaveBeenCalledWith(
            clinicId,
            input.patientId,
            ['COMPLETED']
        );

        expect(mockPredictNoShowRisk).toHaveBeenCalledWith({
            scheduledAt: appointmentScheduledAt,
            bookedAt: appointmentCreatedAt,
            patientNoShowCount: 2,
            patientCompletedAppointmentCount: 3,
        });

        expect(mockAppointmentRepository.createNoShowPrediction).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            appointment.id,
            input.patientId,
            noShowPrediction
        );

        expect(result.noShowPrediction).toEqual(storedNoShowPrediction);
        expect(result.queueEntry).toEqual(queueEntry);
        expect(result.noShowPrediction.score).toBe(60);
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
        });

        mockAppointmentRepository.countPatientAppointmentsByStatus
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

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
