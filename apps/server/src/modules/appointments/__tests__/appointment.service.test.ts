import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatus, UserRole, UserStatus } from '../../../generated/prisma/client.js';

const mockTx = {};

const mockAppointmentRepository = vi.hoisted(() => ({
    findClinicById: vi.fn(),
    findDoctorById: vi.fn(),
    findPatientById: vi.fn(),
    findActiveDoctorClinicLink: vi.fn(),
    findActivePatientClinicLink: vi.fn(),
    findDoctorAvailabilityPeriods: vi.fn(),
    getClinicLocalAppointmentParts: vi.fn(),
    acquireDoctorScheduleLock: vi.fn(),
    findOverlappingDoctorAppointment: vi.fn(),
    findDoctorSchedulingAppointmentsForDate: vi.fn(),
    getClinicLocalDateWeekday: vi.fn(),
    getClinicLocalDateTimeInstants: vi.fn(),
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
const mockIncrementPatientTotalAppointments = vi.hoisted(() => vi.fn());
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

vi.mock('../appointment.repository.js', () => ({
    appointmentRepository: mockAppointmentRepository,
}));

vi.mock('../../queues/queue.repository.js', () => ({
    queueRepository: mockQueueRepository,
}));

vi.mock('../../queues/queue.service.js', () => ({
    queueService: mockQueueService,
}));

vi.mock('../../auth/access.service.js', () => ({
    accessService: mockAccessService,
}));

vi.mock('../../predictions/prediction.service.js', () => ({
    predictNoShowRisk: mockPredictNoShowRisk,
    toNoShowPredictionResponse: mockToNoShowPredictionResponse,
}));

vi.mock('../../patients/patient.statistics.repository.js', () => ({
    incrementPatientTotalAppointments: mockIncrementPatientTotalAppointments,
}));

import { appointmentService } from '../appointment.service.js';

const authenticatedUser = {
    id: 'user-id',
    clerkUserId: 'clerk-user-id',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    clinicId: 'clinic-id',
};

const clinicSchedulingSettings = {
    timezone: 'Asia/Kolkata',
    openingTime: '09:00',
    closingTime: '18:00',
    slotDurationMinutes: 15,
    bufferMinutes: 5,
};

const mockValidSchedulingPolicy = () => {
    mockAppointmentRepository.getClinicLocalAppointmentParts.mockResolvedValue({
        localDate: '2026-06-20',
        localTime: '15:30',
        isoWeekday: 6,
        seconds: 0,
    });
    mockAppointmentRepository.findDoctorAvailabilityPeriods.mockResolvedValue([
        {
            weekday: 'SATURDAY',
            startTime: '09:00',
            endTime: '18:00',
        },
    ]);
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
            ...clinicSchedulingSettings,
        });

        mockAppointmentRepository.findDoctorById.mockResolvedValue({
            id: input.doctorId,
            isActive: true,
        });

        mockAppointmentRepository.findPatientById.mockResolvedValue({
            id: input.patientId,
        });

        mockAppointmentRepository.findActiveDoctorClinicLink.mockResolvedValue({
            id: 'doctor-clinic-id',
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

        mockAppointmentRepository.countPatientAppointmentsByStatus
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        mockValidSchedulingPolicy();
        mockAppointmentRepository.acquireDoctorScheduleLock.mockResolvedValue(undefined);
        mockAppointmentRepository.findOverlappingDoctorAppointment.mockResolvedValue([]);

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
            patientLateArrivalCount: 0,
            patientCompletedAppointmentCount: 0,
            distanceFromClinicKm: null,
        });

        expect(mockAppointmentRepository.acquireDoctorScheduleLock).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            input.doctorId,
            '2026-06-20'
        );

        expect(mockAppointmentRepository.findOverlappingDoctorAppointment).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            input.doctorId,
            appointmentScheduledAt,
            input.durationMinutes,
            clinicSchedulingSettings.bufferMinutes,
            ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_QUEUE', 'CALLED']
        );

        expect(mockAppointmentRepository.createNoShowPrediction).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            appointment.id,
            input.patientId,
            noShowPrediction
        );
        expect(mockIncrementPatientTotalAppointments).toHaveBeenCalledWith({
            tx: mockTx,
            clinicId,
            patientId: input.patientId,
        });

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

    it('uses live appointment history while generating no-show prediction', async () => {
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
            ...clinicSchedulingSettings,
        });

        mockAppointmentRepository.findDoctorById.mockResolvedValue({
            id: input.doctorId,
            isActive: true,
        });

        mockAppointmentRepository.findPatientById.mockResolvedValue({
            id: input.patientId,
        });

        mockAppointmentRepository.findActiveDoctorClinicLink.mockResolvedValue({
            id: 'doctor-clinic-id',
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
            totalLateArrivals: 1,
            distanceFromClinicKm: 11.5,
        });

        mockAppointmentRepository.countPatientAppointmentsByStatus
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(3);

        mockValidSchedulingPolicy();
        mockAppointmentRepository.acquireDoctorScheduleLock.mockResolvedValue(undefined);
        mockAppointmentRepository.findOverlappingDoctorAppointment.mockResolvedValue([]);

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
            ...clinicSchedulingSettings,
        });

        mockAppointmentRepository.findDoctorById.mockResolvedValue({
            id: input.doctorId,
            isActive: true,
        });

        mockAppointmentRepository.findPatientById.mockResolvedValue({
            id: input.patientId,
        });

        mockAppointmentRepository.findActiveDoctorClinicLink.mockResolvedValue({
            id: 'doctor-clinic-id',
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

        mockAppointmentRepository.countPatientAppointmentsByStatus
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        mockValidSchedulingPolicy();
        mockAppointmentRepository.acquireDoctorScheduleLock.mockResolvedValue(undefined);
        mockAppointmentRepository.findOverlappingDoctorAppointment.mockResolvedValue([
            {
                id: 'existing-appointment-id',
            },
        ]);

        await expect(
            appointmentService.createAppointment(clinicId, createdByUserId, input)
        ).rejects.toMatchObject({
            statusCode: 409,
            code: 'APPOINTMENT_SLOT_CONFLICT',
            message: 'This doctor already has an appointment that overlaps this time slot.',
        });

        expect(mockAppointmentRepository.acquireDoctorScheduleLock).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            input.doctorId,
            '2026-06-20'
        );

        expect(mockAppointmentRepository.findOverlappingDoctorAppointment).toHaveBeenCalledWith(
            mockTx,
            clinicId,
            input.doctorId,
            appointmentScheduledAt,
            input.durationMinutes,
            clinicSchedulingSettings.bufferMinutes,
            ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_QUEUE', 'CALLED']
        );

        expect(mockAppointmentRepository.createAppointment).not.toHaveBeenCalled();
        expect(mockQueueRepository.createQueueEntry).not.toHaveBeenCalled();
        expect(mockAppointmentRepository.createNoShowPrediction).not.toHaveBeenCalled();
        expect(mockIncrementPatientTotalAppointments).not.toHaveBeenCalled();
    });
});

describe('appointmentService.listAvailableSlots', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects inactive doctor profiles before generating slots', async () => {
        mockAppointmentRepository.findClinicById.mockResolvedValue({
            id: 'clinic-id',
            isActive: true,
            ...clinicSchedulingSettings,
        });
        mockAppointmentRepository.findDoctorById.mockResolvedValue({
            id: 'doctor-id',
            isActive: false,
        });

        await expect(
            appointmentService.listAvailableSlots('clinic-id', {
                doctorId: 'doctor-id',
                date: '2026-06-20',
                durationMinutes: 15,
            })
        ).rejects.toMatchObject({
            statusCode: 400,
            code: 'DOCTOR_INACTIVE',
            message: 'Doctor is inactive',
        });

        expect(mockAppointmentRepository.findActiveDoctorClinicLink).not.toHaveBeenCalled();
        expect(mockAppointmentRepository.findDoctorAvailabilityPeriods).not.toHaveBeenCalled();
    });

    it('filters DST-normalized wall times out of the generated slot response', async () => {
        const clinic = {
            id: 'clinic-id',
            isActive: true,
            timezone: 'America/New_York',
            openingTime: '01:00',
            closingTime: '04:00',
            slotDurationMinutes: 30,
            bufferMinutes: 5,
        };

        mockAppointmentRepository.findClinicById.mockResolvedValue(clinic);
        mockAppointmentRepository.findDoctorById.mockResolvedValue({
            id: 'doctor-id',
            isActive: true,
        });
        mockAppointmentRepository.findActiveDoctorClinicLink.mockResolvedValue({
            id: 'doctor-clinic-id',
            clinicId: 'clinic-id',
            doctorId: 'doctor-id',
            isActive: true,
        });
        mockAppointmentRepository.getClinicLocalDateWeekday.mockResolvedValue({
            localDate: '2026-03-08',
            isoWeekday: 7,
        });
        mockAppointmentRepository.findDoctorAvailabilityPeriods.mockResolvedValue([
            {
                weekday: 'SUNDAY',
                startTime: '01:00',
                endTime: '04:00',
            },
        ]);
        mockAppointmentRepository.getClinicLocalDateTimeInstants.mockResolvedValue([
            {
                localTime: '02:30',
                instant: new Date('2026-03-08T07:30:00.000Z'),
                resolvedLocalDate: '2026-03-08',
                resolvedLocalTime: '03:30',
            },
            {
                localTime: '03:30',
                instant: new Date('2026-03-08T07:30:00.000Z'),
                resolvedLocalDate: '2026-03-08',
                resolvedLocalTime: '03:30',
            },
        ]);
        mockAppointmentRepository.findDoctorSchedulingAppointmentsForDate.mockResolvedValue([]);

        const result = await appointmentService.listAvailableSlots('clinic-id', {
            doctorId: 'doctor-id',
            date: '2026-03-08',
            durationMinutes: 30,
        });

        expect(result.slots).toEqual([
            {
                scheduledAt: '2026-03-08T07:30:00.000Z',
                endsAt: '2026-03-08T08:00:00.000Z',
                localDate: '2026-03-08',
                localStartTime: '03:30',
                localEndTime: '04:00',
            },
        ]);
        expect(
            mockAppointmentRepository.findDoctorSchedulingAppointmentsForDate
        ).toHaveBeenCalledWith(
            'clinic-id',
            'doctor-id',
            '2026-03-08',
            clinic.timezone,
            clinic.bufferMinutes,
            ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_QUEUE', 'CALLED'],
            undefined
        );
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

    it('maps invalid appointment lifecycle transitions to a domain conflict', async () => {
        mockAccessService.verifyAppointmentClinicAccess.mockResolvedValue({
            id: 'appointment-id',
            clinicId: 'clinic-id',
        });
        mockAppointmentRepository.updateAppointmentStatus.mockResolvedValue({
            appointment: null,
            failureReason: 'INVALID_STATUS_TRANSITION',
        });

        await expect(
            appointmentService.updateAppointmentStatus(
                authenticatedUser,
                'appointment-id',
                AppointmentStatus.CONFIRMED
            )
        ).rejects.toMatchObject({
            statusCode: 409,
            code: 'APPOINTMENT_STATUS_TRANSITION_INVALID',
            message: 'Requested appointment status transition is not allowed',
        });
    });

    it('preserves final-status conflict errors from the repository', async () => {
        mockAccessService.verifyAppointmentClinicAccess.mockResolvedValue({
            id: 'appointment-id',
            clinicId: 'clinic-id',
        });
        mockAppointmentRepository.updateAppointmentStatus.mockResolvedValue({
            appointment: null,
            failureReason: 'FINAL_STATUS_CONFLICT',
        });

        await expect(
            appointmentService.updateAppointmentStatus(
                authenticatedUser,
                'appointment-id',
                AppointmentStatus.ARRIVED
            )
        ).rejects.toMatchObject({
            statusCode: 409,
            code: 'APPOINTMENT_STATUS_FINAL',
        });
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
