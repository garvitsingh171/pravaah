import { AppointmentStatus, Prisma, QueueStatus } from '../../generated/prisma/client.js';
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
import { isAppointmentReschedulable } from './appointment.lifecycle.js';
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
    RescheduleAppointmentSlotsQueryInput,
} from './appointment.types.js';

const conflictingAppointmentStatuses = [...schedulingConflictStatuses] as AppointmentStatus[];
const reschedulePreVisitQueueStatuses: QueueStatus[] = [QueueStatus.WAITING];

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

const createAppointmentRescheduleNotAllowedError = () =>
    new AppError(
        409,
        'APPOINTMENT_RESCHEDULE_NOT_ALLOWED',
        'Only scheduled or confirmed appointments can be rescheduled.'
    );

const createAppointmentRescheduleConflictError = () =>
    new AppError(
        409,
        'APPOINTMENT_RESCHEDULE_CONFLICT',
        'Appointment changed while rescheduling. Please refresh and try again.'
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

async function validateDoctorSchedulingContextInTransaction(
    tx: Prisma.TransactionClient,
    clinicId: string,
    doctorId: string
) {
    const clinic = await appointmentRepository.findClinicById(clinicId, tx);

    if (!clinic) {
        throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
    }

    if (!clinic.isActive) {
        throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
    }

    const doctor = await appointmentRepository.findDoctorById(doctorId, tx);

    if (!doctor) {
        throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found');
    }

    if (!doctor.isActive) {
        throw new AppError(400, 'DOCTOR_INACTIVE', 'Doctor is inactive');
    }

    const doctorClinicLink = await appointmentRepository.findActiveDoctorClinicLink(
        clinicId,
        doctorId,
        tx
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
    excludeAppointmentId,
}: {
    clinicId: string;
    doctorId: string;
    date: string;
    durationMinutes: number;
    clinic: SchedulingClinicSettings & {
        timezone: string;
    };
    doctorClinicId: string;
    excludeAppointmentId?: string;
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
            conflictingAppointmentStatuses,
            excludeAppointmentId
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
    client,
}: {
    scheduledAt: Date;
    durationMinutes: number;
    clinic: SchedulingClinicSettings & {
        timezone: string;
    };
    doctorClinicId: string;
    client?: Prisma.TransactionClient;
}) => {
    const localParts = await appointmentRepository.getClinicLocalAppointmentParts(
        scheduledAt,
        clinic.timezone,
        client
    );

    if (!localParts || Number(localParts.seconds) !== 0) {
        throw createAppointmentSlotUnavailableError();
    }

    const weekday = getWeekdayFromIsoDay(localParts.isoWeekday);
    const availabilityPeriods = normalizeAvailabilityPeriods(
        await appointmentRepository.findDoctorAvailabilityPeriods(doctorClinicId, client)
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

const assertAppointmentIsReschedulable = (status: AppointmentStatus): void => {
    if (!isAppointmentReschedulable(status)) {
        throw createAppointmentRescheduleNotAllowedError();
    }
};

const assertRescheduleQueueState = (
    queueEntry: { status: QueueStatus } | null | undefined
): void => {
    if (!queueEntry) {
        throw new AppError(
            409,
            'QUEUE_ENTRY_NOT_FOUND',
            'Linked queue entry was not found for this appointment'
        );
    }

    if (!reschedulePreVisitQueueStatuses.includes(queueEntry.status)) {
        throw new AppError(
            409,
            'STATUS_SYNC_CONFLICT',
            'Queue state changed while rescheduling. Please refresh and try again.'
        );
    }
};

const isSameInstant = (first: Date, second: Date): boolean => {
    return first.getTime() === second.getTime();
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
                    input.doctorId,
                    localAppointmentParts.localDate
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

    async listRescheduleSlots(
        user: AuthenticatedUser | undefined,
        appointmentId: string,
        query: RescheduleAppointmentSlotsQueryInput
    ) {
        const appointmentAccess = await accessService.verifyAppointmentClinicAccess(
            user,
            appointmentId
        );
        const appointment = await appointmentRepository.findAppointmentById(appointmentId);

        if (!appointment || appointment.clinicId !== appointmentAccess.clinicId) {
            throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
        }

        assertAppointmentIsReschedulable(appointment.status);

        const { clinic, doctorClinicId } = await validateDoctorSchedulingContext(
            appointment.clinicId,
            appointment.doctorId
        );
        const slots = await getAvailableSlotCandidates({
            clinicId: appointment.clinicId,
            doctorId: appointment.doctorId,
            date: query.date,
            durationMinutes: appointment.durationMinutes,
            clinic,
            doctorClinicId,
            excludeAppointmentId: appointment.id,
        });
        const currentScheduledAt = appointment.scheduledAt.toISOString();

        return {
            appointmentId: appointment.id,
            clinicId: appointment.clinicId,
            doctorId: appointment.doctorId,
            date: query.date,
            timezone: clinic.timezone,
            durationMinutes: appointment.durationMinutes,
            slotDurationMinutes: clinic.slotDurationMinutes,
            bufferMinutes: clinic.bufferMinutes,
            currentScheduledAt,
            slots: slots.filter((slot) => slot.scheduledAt !== currentScheduledAt),
        };
    },

    async rescheduleAppointment(
        user: AuthenticatedUser | undefined,
        appointmentId: string,
        scheduledAtInput: string
    ) {
        const appointmentAccess = await accessService.verifyAppointmentClinicAccess(
            user,
            appointmentId
        );
        const appointment = await appointmentRepository.findAppointmentById(appointmentId);

        if (!appointment || appointment.clinicId !== appointmentAccess.clinicId) {
            throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
        }

        assertAppointmentIsReschedulable(appointment.status);
        assertRescheduleQueueState(appointment.queueEntry);

        const requestedScheduledAt = new Date(scheduledAtInput);

        if (isSameInstant(appointment.scheduledAt, requestedScheduledAt)) {
            const currentAppointment = await appointmentRepository.findAppointmentDetailsById(
                appointment.id,
                appointment.clinicId
            );

            if (!currentAppointment) {
                throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
            }

            return withNoShowPredictionResponse(currentAppointment);
        }

        if (requestedScheduledAt.getTime() < Date.now()) {
            throw createAppointmentSlotUnavailableError();
        }

        const { clinic, doctorClinicId } = await validateDoctorSchedulingContext(
            appointment.clinicId,
            appointment.doctorId
        );

        const requestedLocalParts = await assertRequestedAppointmentMatchesGeneratedSlot({
            scheduledAt: requestedScheduledAt,
            durationMinutes: appointment.durationMinutes,
            clinic,
            doctorClinicId,
        });
        const sourceLocalParts = await appointmentRepository.getClinicLocalAppointmentParts(
            appointment.scheduledAt,
            clinic.timezone
        );

        if (!sourceLocalParts) {
            throw createAppointmentRescheduleConflictError();
        }

        return appointmentRepository.runInTransaction(async (tx) => {
            await queueRepository.acquireQueueScopeLocks(tx, [
                {
                    clinicId: appointment.clinicId,
                    doctorId: appointment.doctorId,
                    clinicLocalDate: sourceLocalParts.localDate,
                },
                {
                    clinicId: appointment.clinicId,
                    doctorId: appointment.doctorId,
                    clinicLocalDate: requestedLocalParts.localDate,
                },
            ]);

            const currentAppointment = await appointmentRepository.findAppointmentRescheduleState(
                tx,
                appointment.id,
                appointment.clinicId
            );

            if (!currentAppointment) {
                throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
            }

            assertAppointmentIsReschedulable(currentAppointment.status);
            assertRescheduleQueueState(currentAppointment.queueEntry);

            if (!isSameInstant(currentAppointment.scheduledAt, appointment.scheduledAt)) {
                throw createAppointmentRescheduleConflictError();
            }

            const finalSchedulingContext = await validateDoctorSchedulingContextInTransaction(
                tx,
                currentAppointment.clinicId,
                currentAppointment.doctorId
            );
            const finalRequestedLocalParts = await assertRequestedAppointmentMatchesGeneratedSlot({
                scheduledAt: requestedScheduledAt,
                durationMinutes: currentAppointment.durationMinutes,
                clinic: finalSchedulingContext.clinic,
                doctorClinicId: finalSchedulingContext.doctorClinicId,
                client: tx,
            });

            const existingDoctorAppointments =
                await appointmentRepository.findOverlappingDoctorAppointment(
                    tx,
                    currentAppointment.clinicId,
                    currentAppointment.doctorId,
                    requestedScheduledAt,
                    currentAppointment.durationMinutes,
                    finalSchedulingContext.clinic.bufferMinutes,
                    conflictingAppointmentStatuses,
                    currentAppointment.id
                );

            if (existingDoctorAppointments.length > 0) {
                throw createAppointmentSlotConflictError();
            }

            const sourceDate = sourceLocalParts.localDate;
            const destinationDate = finalRequestedLocalParts.localDate;
            let destinationPosition = currentAppointment.queueEntry.position;

            if (sourceDate !== destinationDate) {
                const highestPosition = await queueRepository.findHighestQueuePosition(
                    tx,
                    currentAppointment.clinicId,
                    currentAppointment.doctorId,
                    requestedScheduledAt,
                    finalSchedulingContext.clinic.timezone
                );

                destinationPosition = queueService.calculateNextQueuePosition(highestPosition);
            }

            const updateResult = await appointmentRepository.updateAppointmentScheduledAt(
                tx,
                currentAppointment.id,
                currentAppointment.clinicId,
                appointment.scheduledAt,
                requestedScheduledAt
            );

            if (updateResult.count !== 1) {
                throw createAppointmentRescheduleConflictError();
            }

            if (sourceDate !== destinationDate) {
                const queueUpdateResult = await appointmentRepository.updateQueueEntryPosition(
                    tx,
                    currentAppointment.queueEntry.id,
                    currentAppointment.clinicId,
                    destinationPosition
                );

                if (queueUpdateResult.count !== 1) {
                    throw new AppError(
                        409,
                        'QUEUE_REORDER_CONFLICT',
                        'Queue changed while rescheduling. Please refresh and try again.'
                    );
                }
            }

            const updatedAppointment = await tx.appointment.findFirst({
                where: {
                    id: currentAppointment.id,
                    clinicId: currentAppointment.clinicId,
                },
                include: {
                    doctor: {
                        select: {
                            id: true,
                            fullName: true,
                            specialization: true,
                            qualification: true,
                            registrationNumber: true,
                            phone: true,
                            email: true,
                            gender: true,
                            experienceYears: true,
                            isActive: true,
                        },
                    },
                    patient: {
                        select: {
                            id: true,
                            fullName: true,
                            phone: true,
                            email: true,
                            gender: true,
                            dateOfBirth: true,
                            age: true,
                            address: true,
                            city: true,
                            emergencyContactName: true,
                            emergencyContactPhone: true,
                            isActive: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                        },
                    },
                    queueEntry: {
                        select: {
                            id: true,
                            position: true,
                            status: true,
                            queuedAt: true,
                            calledAt: true,
                            completedAt: true,
                        },
                    },
                    noShowPrediction: {
                        select: {
                            id: true,
                            riskLevel: true,
                            score: true,
                            reasons: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                },
            });

            if (!updatedAppointment) {
                throw new AppError(
                    500,
                    'APPOINTMENT_RESCHEDULE_FAILED',
                    'Appointment reschedule failed'
                );
            }

            return withNoShowPredictionResponse(updatedAppointment);
        });
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
