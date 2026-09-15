import { AppointmentStatus, Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { accessService } from '../auth/access.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { timeToMinutes, type Weekday } from '../doctors/doctorAvailability.js';
import {
    predictNoShowRisk,
    toNoShowPredictionResponse,
} from '../predictions/prediction.service.js';
import type { StoredNoShowPredictionForResponse } from '../predictions/prediction.types.js';
import { queueRepository } from '../queues/queue.repository.js';
import { queueService } from '../queues/queue.service.js';
import { appointmentRepository } from './appointment.repository.js';
import {
    addMinutes,
    buildCandidateLocalStartTimes,
    findConflictingSchedulingAppointment,
    minutesToTime,
    schedulingConflictStatuses,
    weekdayByIsoDay,
    type SchedulingAvailabilityPeriod,
    type SchedulingClinicSettings,
} from './appointment.scheduling.js';
import type {
    AvailableAppointmentSlotsQueryInput,
    CreateAppointmentInput,
    ListAppointmentsQueryInput,
} from './appointment.types.js';

const conflictingAppointmentStatuses = [...schedulingConflictStatuses] as AppointmentStatus[];

const createAppointmentSlotConflictError = () =>
    new AppError(
        409,
        'APPOINTMENT_SLOT_CONFLICT',
        'This doctor already has an appointment that overlaps this time slot.'
    );

const createAppointmentSlotUnavailableError = () =>
    new AppError(
        409,
        'APPOINTMENT_SLOT_UNAVAILABLE',
        'Selected appointment time is not available for this doctor.'
    );

const withNoShowPredictionResponse = <
    T extends { noShowPrediction: StoredNoShowPredictionForResponse | null },
>(
    appointment: T
) => ({
    ...appointment,
    noShowPrediction: toNoShowPredictionResponse(appointment.noShowPrediction),
});

async function validateAppointmentClinicOwnership(
    clinicId: string,
    doctorId: string,
    patientId: string
): Promise<{
    clinicTimezone: string;
    clinic: SchedulingClinicSettings & {
        id: string;
        timezone: string;
    };
    doctorClinicId: string;
    patientClinicHistory: {
        totalLateArrivals: number;
        distanceFromClinicKm: unknown;
    };
}> {
    const clinic = await appointmentRepository.findClinicById(clinicId);

    if (!clinic) {
        throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
    }

    if (!clinic.isActive) {
        throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
    }

    const doctor = await appointmentRepository.findDoctorById(doctorId);

    if (!doctor) {
        throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found');
    }

    if (!doctor.isActive) {
        throw new AppError(400, 'DOCTOR_INACTIVE', 'Doctor is inactive');
    }

    const patient = await appointmentRepository.findPatientById(patientId);

    if (!patient) {
        throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
    }

    const doctorClinicLink = await appointmentRepository.findActiveDoctorClinicLink(
        clinicId,
        doctorId
    );

    if (!doctorClinicLink) {
        throw new AppError(
            403,
            'DOCTOR_NOT_LINKED_TO_CLINIC',
            'Doctor is not linked to this clinic'
        );
    }

    const patientClinicLink = await appointmentRepository.findActivePatientClinicLink(
        clinicId,
        patientId
    );

    if (!patientClinicLink) {
        throw new AppError(
            403,
            'PATIENT_NOT_LINKED_TO_CLINIC',
            'Patient is not linked to this clinic'
        );
    }

    return {
        clinicTimezone: clinic.timezone,
        clinic,
        doctorClinicId: doctorClinicLink.id,
        patientClinicHistory: {
            totalLateArrivals: patientClinicLink.totalLateArrivals,
            distanceFromClinicKm: patientClinicLink.distanceFromClinicKm,
        },
    };
}

async function validateDoctorSchedulingContext(clinicId: string, doctorId: string) {
    const clinic = await appointmentRepository.findClinicById(clinicId);

    if (!clinic) {
        throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
    }

    if (!clinic.isActive) {
        throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
    }

    const doctor = await appointmentRepository.findDoctorById(doctorId);

    if (!doctor) {
        throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found');
    }

    if (!doctor.isActive) {
        throw new AppError(400, 'DOCTOR_INACTIVE', 'Doctor is inactive');
    }

    const doctorClinicLink = await appointmentRepository.findActiveDoctorClinicLink(
        clinicId,
        doctorId
    );

    if (!doctorClinicLink) {
        throw new AppError(
            403,
            'DOCTOR_NOT_LINKED_TO_CLINIC',
            'Doctor is not linked to this clinic'
        );
    }

    return {
        clinic,
        doctorClinicId: doctorClinicLink.id,
    };
}

const getWeekdayFromIsoDay = (isoWeekday: number): Weekday => {
    const weekday = weekdayByIsoDay[isoWeekday];

    if (!weekday) {
        throw new AppError(
            500,
            'APPOINTMENT_WEEKDAY_RESOLUTION_FAILED',
            'Weekday could not be resolved'
        );
    }

    return weekday;
};

const normalizeAvailabilityPeriods = (
    periods: SchedulingAvailabilityPeriod[]
): SchedulingAvailabilityPeriod[] => {
    return periods.map((period) => ({
        weekday: period.weekday,
        startTime: period.startTime,
        endTime: period.endTime,
    }));
};

const buildLocalEndTime = (localStartTime: string, durationMinutes: number): string => {
    return minutesToTime(timeToMinutes(localStartTime) + durationMinutes);
};

const getAvailableSlotCandidates = async ({
    clinicId,
    doctorId,
    date,
    durationMinutes,
    clinic,
    doctorClinicId,
}: {
    clinicId: string;
    doctorId: string;
    date: string;
    durationMinutes: number;
    clinic: SchedulingClinicSettings & {
        timezone: string;
    };
    doctorClinicId: string;
}) => {
    const localDateParts = await appointmentRepository.getClinicLocalDateWeekday(date);

    if (!localDateParts) {
        return [];
    }

    const weekday = getWeekdayFromIsoDay(localDateParts.isoWeekday);
    const availabilityPeriods = normalizeAvailabilityPeriods(
        await appointmentRepository.findDoctorAvailabilityPeriods(doctorClinicId)
    );
    const localStartTimes = buildCandidateLocalStartTimes({
        clinic,
        weekday,
        availabilityPeriods,
        durationMinutes,
    });
    const slotInstants = await appointmentRepository.getClinicLocalDateTimeInstants(
        date,
        localStartTimes,
        clinic.timezone
    );
    const existingAppointments =
        await appointmentRepository.findDoctorSchedulingAppointmentsForDate(
            clinicId,
            doctorId,
            date,
            clinic.timezone,
            clinic.bufferMinutes,
            conflictingAppointmentStatuses
        );

    return slotInstants
        .filter((slot) => {
            return slot.resolvedLocalDate === date && slot.resolvedLocalTime === slot.localTime;
        })
        .filter((slot) => {
            return !findConflictingSchedulingAppointment(
                {
                    scheduledAt: slot.instant,
                    durationMinutes,
                },
                existingAppointments,
                clinic.bufferMinutes
            );
        })
        .map((slot) => ({
            scheduledAt: slot.instant.toISOString(),
            endsAt: addMinutes(slot.instant, durationMinutes).toISOString(),
            localDate: date,
            localStartTime: slot.localTime,
            localEndTime: buildLocalEndTime(slot.localTime, durationMinutes),
        }));
};

const assertRequestedAppointmentMatchesGeneratedSlot = async ({
    scheduledAt,
    durationMinutes,
    clinic,
    doctorClinicId,
}: {
    scheduledAt: Date;
    durationMinutes: number;
    clinic: SchedulingClinicSettings & {
        timezone: string;
    };
    doctorClinicId: string;
}) => {
    const localParts = await appointmentRepository.getClinicLocalAppointmentParts(
        scheduledAt,
        clinic.timezone
    );

    if (!localParts || Number(localParts.seconds) !== 0) {
        throw createAppointmentSlotUnavailableError();
    }

    const weekday = getWeekdayFromIsoDay(localParts.isoWeekday);
    const availabilityPeriods = normalizeAvailabilityPeriods(
        await appointmentRepository.findDoctorAvailabilityPeriods(doctorClinicId)
    );
    const candidateLocalStartTimes = buildCandidateLocalStartTimes({
        clinic,
        weekday,
        availabilityPeriods,
        durationMinutes,
    });

    if (!candidateLocalStartTimes.includes(localParts.localTime)) {
        throw createAppointmentSlotUnavailableError();
    }

    return localParts;
};

export const appointmentService = {
    async createAppointment(
        clinicId: string,
        createdByUserId: string,
        input: CreateAppointmentInput
    ) {
        const { clinicTimezone, clinic, doctorClinicId, patientClinicHistory } =
            await validateAppointmentClinicOwnership(clinicId, input.doctorId, input.patientId);

        const scheduledAt = new Date(input.scheduledAt);
        const localAppointmentParts = await assertRequestedAppointmentMatchesGeneratedSlot({
            scheduledAt,
            durationMinutes: input.durationMinutes,
            clinic,
            doctorClinicId,
        });
        const [patientNoShowCount, patientCompletedAppointmentCount] = await Promise.all([
            appointmentRepository.countPatientAppointmentsByStatus(clinicId, input.patientId, [
                AppointmentStatus.NO_SHOW,
            ]),
            appointmentRepository.countPatientAppointmentsByStatus(clinicId, input.patientId, [
                AppointmentStatus.COMPLETED,
            ]),
        ]);
        const distanceFromClinicKm =
            patientClinicHistory.distanceFromClinicKm === null ||
            patientClinicHistory.distanceFromClinicKm === undefined
                ? null
                : Number(patientClinicHistory.distanceFromClinicKm);

        try {
            return await appointmentRepository.runInTransaction(async (tx) => {
                await appointmentRepository.acquireDoctorScheduleLock(
                    tx,
                    clinicId,
                    input.doctorId
                );

                const existingDoctorAppointments =
                    await appointmentRepository.findOverlappingDoctorAppointment(
                        tx,
                        clinicId,
                        input.doctorId,
                        scheduledAt,
                        input.durationMinutes,
                        clinic.bufferMinutes,
                        conflictingAppointmentStatuses
                    );

                if (existingDoctorAppointments.length > 0) {
                    throw createAppointmentSlotConflictError();
                }

                const highestPosition = await queueRepository.findHighestQueuePosition(
                    tx,
                    clinicId,
                    input.doctorId,
                    scheduledAt,
                    clinicTimezone
                );

                const nextPosition = queueService.calculateNextQueuePosition(highestPosition);

                const appointment = await appointmentRepository.createAppointment(
                    tx,
                    clinicId,
                    createdByUserId,
                    input
                );

                const noShowPrediction = predictNoShowRisk({
                    scheduledAt: appointment.scheduledAt,
                    bookedAt: appointment.createdAt,
                    patientNoShowCount,
                    patientLateArrivalCount: patientClinicHistory.totalLateArrivals,
                    patientCompletedAppointmentCount,
                    distanceFromClinicKm,
                });

                const queueEntry = await queueRepository.createQueueEntry(
                    tx,
                    clinicId,
                    appointment.id,
                    input.doctorId,
                    input.patientId,
                    nextPosition
                );

                const storedNoShowPrediction = await appointmentRepository.createNoShowPrediction(
                    tx,
                    clinicId,
                    appointment.id,
                    appointment.patientId,
                    noShowPrediction
                );
                const noShowPredictionResponse = toNoShowPredictionResponse(storedNoShowPrediction);

                return {
                    appointment: {
                        ...appointment,
                        noShowPrediction: noShowPredictionResponse,
                    },
                    queueEntry,
                    noShowPrediction: noShowPredictionResponse,
                };
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw createAppointmentSlotConflictError();
            }

            throw error;
        }
    },

    async listAvailableSlots(clinicId: string, query: AvailableAppointmentSlotsQueryInput) {
        const { clinic, doctorClinicId } = await validateDoctorSchedulingContext(
            clinicId,
            query.doctorId
        );
        const slots = await getAvailableSlotCandidates({
            clinicId,
            doctorId: query.doctorId,
            date: query.date,
            durationMinutes: query.durationMinutes,
            clinic,
            doctorClinicId,
        });

        return {
            clinicId,
            doctorId: query.doctorId,
            date: query.date,
            timezone: clinic.timezone,
            durationMinutes: query.durationMinutes,
            slotDurationMinutes: clinic.slotDurationMinutes,
            bufferMinutes: clinic.bufferMinutes,
            slots,
        };
    },

    async listAppointments(clinicId: string, filters: ListAppointmentsQueryInput) {
        const clinic = await appointmentRepository.findClinicById(clinicId);

        if (!clinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (!clinic.isActive) {
            throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
        }

        if (filters.doctorId !== undefined) {
            const doctor = await appointmentRepository.findDoctorById(filters.doctorId);

            if (!doctor) {
                throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found');
            }

            const doctorClinicLink = await appointmentRepository.findActiveDoctorClinicLink(
                clinicId,
                filters.doctorId
            );

            if (!doctorClinicLink) {
                throw new AppError(
                    403,
                    'DOCTOR_NOT_LINKED_TO_CLINIC',
                    'Doctor is not linked to this clinic'
                );
            }
        }

        if (filters.patientId !== undefined) {
            const patient = await appointmentRepository.findPatientById(filters.patientId);

            if (!patient) {
                throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
            }

            const patientClinicLink = await appointmentRepository.findActivePatientClinicLink(
                clinicId,
                filters.patientId
            );

            if (!patientClinicLink) {
                throw new AppError(
                    403,
                    'PATIENT_NOT_LINKED_TO_CLINIC',
                    'Patient is not linked to this clinic'
                );
            }
        }

        const appointments = await appointmentRepository.findAppointmentsByClinicId(
            clinicId,
            filters,
            clinic.timezone
        );

        return appointments.map(withNoShowPredictionResponse);
    },

    async updateAppointmentStatus(
        user: AuthenticatedUser | undefined,
        appointmentId: string,
        status: AppointmentStatus
    ) {
        const appointmentAccess = await accessService.verifyAppointmentClinicAccess(
            user,
            appointmentId
        );

        let result: Awaited<ReturnType<typeof appointmentRepository.updateAppointmentStatus>>;

        try {
            result = await appointmentRepository.updateAppointmentStatus(
                appointmentId,
                appointmentAccess.clinicId,
                status
            );
        } catch (error) {
            if (error instanceof Error && error.message === 'QUEUE_STATUS_SYNC_CONFLICT') {
                throw new AppError(
                    409,
                    'STATUS_SYNC_CONFLICT',
                    'Status changed while updating. Please refresh and try again.'
                );
            }

            throw error;
        }

        if (result.failureReason === 'NOT_FOUND') {
            throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
        }

        if (result.failureReason === 'FINAL_STATUS_CONFLICT') {
            throw new AppError(
                409,
                'APPOINTMENT_STATUS_FINAL',
                'Completed, cancelled, or no-show appointments cannot be changed to another status'
            );
        }

        if (result.failureReason === 'INVALID_STATUS_TRANSITION') {
            throw new AppError(
                409,
                'APPOINTMENT_STATUS_TRANSITION_INVALID',
                'Requested appointment status transition is not allowed'
            );
        }

        if (result.failureReason === 'STATUS_TRANSITION_CONFLICT') {
            throw new AppError(
                409,
                'STATUS_SYNC_CONFLICT',
                'Status changed while updating. Please refresh and try again.'
            );
        }

        if (result.failureReason === 'QUEUE_ENTRY_NOT_FOUND') {
            throw new AppError(
                409,
                'QUEUE_ENTRY_NOT_FOUND',
                'Linked queue entry was not found for this appointment'
            );
        }

        if (!result.appointment) {
            throw new AppError(
                500,
                'APPOINTMENT_STATUS_UPDATE_FAILED',
                'Appointment status update failed'
            );
        }

        return withNoShowPredictionResponse(result.appointment);
    },
};
