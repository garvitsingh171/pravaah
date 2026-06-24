import { AppointmentStatus, Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { accessService } from '../auth/access.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
    predictNoShowRisk,
    toNoShowPredictionResponse,
} from '../predictions/prediction.service.js';
import type { StoredNoShowPredictionForResponse } from '../predictions/prediction.types.js';
import { queueRepository } from '../queues/queue.repository.js';
import { queueService } from '../queues/queue.service.js';
import { appointmentRepository } from './appointment.repository.js';
import type { CreateAppointmentInput, ListAppointmentsQueryInput } from './appointment.types.js';

const conflictingAppointmentStatuses: AppointmentStatus[] = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_QUEUE,
    AppointmentStatus.CALLED,
];

const createAppointmentSlotConflictError = () =>
    new AppError(
        409,
        'APPOINTMENT_SLOT_CONFLICT',
        'This doctor already has an appointment in this time slot.'
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
): Promise<string> {
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

    return clinic.timezone;
}

export const appointmentService = {
    async createAppointment(
        clinicId: string,
        createdByUserId: string,
        input: CreateAppointmentInput
    ) {
        const clinicTimezone = await validateAppointmentClinicOwnership(
            clinicId,
            input.doctorId,
            input.patientId
        );

        const scheduledAt = new Date(input.scheduledAt);

        const [patientNoShowCount, patientCompletedAppointmentCount] = await Promise.all([
            appointmentRepository.countPatientAppointmentsByStatus(clinicId, input.patientId, [
                AppointmentStatus.NO_SHOW,
            ]),
            appointmentRepository.countPatientAppointmentsByStatus(clinicId, input.patientId, [
                AppointmentStatus.COMPLETED,
            ]),
        ]);

        try {
            return await appointmentRepository.runInTransaction(async (tx) => {
                await appointmentRepository.acquireAppointmentSlotLock(
                    tx,
                    clinicId,
                    input.doctorId,
                    scheduledAt
                );

                const existingDoctorAppointment =
                    await appointmentRepository.findDoctorAppointmentAtTime(
                        tx,
                        clinicId,
                        input.doctorId,
                        scheduledAt,
                        conflictingAppointmentStatuses
                    );

                if (existingDoctorAppointment) {
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
                    patientCompletedAppointmentCount,
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
        await accessService.verifyAppointmentClinicAccess(user, appointmentId);

        let result: Awaited<ReturnType<typeof appointmentRepository.updateAppointmentStatus>>;

        try {
            result = await appointmentRepository.updateAppointmentStatus(appointmentId, status);
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
