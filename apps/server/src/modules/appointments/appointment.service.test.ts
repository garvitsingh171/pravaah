import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockTx = {};

const mockAppointmentRepository = vi.hoisted(() => ({
    findClinicById: vi.fn(),
    findDoctorById: vi.fn(),
    findPatientById: vi.fn(),
    findActiveDoctorClinicLink: vi.fn(),
    findActivePatientClinicLink: vi.fn(),
    findDoctorAppointmentAtTime: vi.fn(),
    countPatientAppointmentsByStatus: vi.fn(),
    runInTransaction: vi.fn(),
    createAppointment: vi.fn(),
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

        mockAppointmentRepository.findDoctorAppointmentAtTime.mockResolvedValue(null);

        mockAppointmentRepository.countPatientAppointmentsByStatus
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        mockQueueRepository.findHighestQueuePosition.mockResolvedValue(null);
        mockQueueService.calculateNextQueuePosition.mockReturnValue(1);

        mockAppointmentRepository.createAppointment.mockResolvedValue(appointment);
        mockQueueRepository.createQueueEntry.mockResolvedValue({
            id: 'queue-entry-id',
        });

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

        expect(result).toEqual({
            appointment,
            noShowPrediction,
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

        mockAppointmentRepository.findDoctorAppointmentAtTime.mockResolvedValue(null);

        mockAppointmentRepository.countPatientAppointmentsByStatus
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(3);

        mockQueueRepository.findHighestQueuePosition.mockResolvedValue(3);
        mockQueueService.calculateNextQueuePosition.mockReturnValue(4);

        mockAppointmentRepository.createAppointment.mockResolvedValue(appointment);
        mockQueueRepository.createQueueEntry.mockResolvedValue({
            id: 'queue-entry-id',
        });

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

        expect(result.noShowPrediction).toEqual(noShowPrediction);
    });
});
