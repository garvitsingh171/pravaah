import type { AppointmentStatus, Prisma } from '../../generated/prisma/client.js';
import {
    calculateArrivalOutcome,
    isPresenceEstablishingAppointmentStatus,
    type ArrivalOutcome,
} from './appointment.arrival.js';

type EstablishAppointmentArrivalInput = {
    tx: Prisma.TransactionClient;
    appointmentId: string;
    clinicId: string;
    patientId: string;
    scheduledAt: Date;
    targetStatus: AppointmentStatus;
    arrivalTimestamp: Date;
};

export type EstablishAppointmentArrivalResult = {
    wasEstablished: boolean;
    outcome: ArrivalOutcome | null;
};

export async function establishAppointmentArrivalIfNeeded({
    tx,
    appointmentId,
    clinicId,
    patientId,
    scheduledAt,
    targetStatus,
    arrivalTimestamp,
}: EstablishAppointmentArrivalInput): Promise<EstablishAppointmentArrivalResult> {
    if (!isPresenceEstablishingAppointmentStatus(targetStatus)) {
        return {
            wasEstablished: false,
            outcome: null,
        };
    }

    const clinic = await tx.clinic.findUnique({
        where: {
            id: clinicId,
        },
        select: {
            lateArrivalGraceMinutes: true,
        },
    });

    if (!clinic) {
        throw new Error('CLINIC_NOT_FOUND');
    }

    const outcome = calculateArrivalOutcome({
        scheduledAt,
        arrivedAt: arrivalTimestamp,
        graceMinutes: clinic.lateArrivalGraceMinutes,
    });

    const arrivalUpdateResult = await tx.appointment.updateMany({
        where: {
            id: appointmentId,
            clinicId,
            arrivedAt: null,
        },
        data: {
            arrivedAt: arrivalTimestamp,
            arrivalOffsetMinutes: outcome.arrivalOffsetMinutes,
            isLateArrival: outcome.isLateArrival,
            lateArrivalGraceMinutes: outcome.lateArrivalGraceMinutes,
        },
    });

    if (arrivalUpdateResult.count !== 1) {
        return {
            wasEstablished: false,
            outcome: null,
        };
    }

    const patientClinicWhere = {
        clinicId,
        patientId,
        isActive: true,
    };

    if (!outcome.isLateArrival) {
        const patientClinicCount = await tx.patientClinic.count({
            where: patientClinicWhere,
        });

        if (patientClinicCount !== 1) {
            throw new Error('PATIENT_CLINIC_LINK_NOT_FOUND');
        }
    } else {
        const patientClinicUpdateResult = await tx.patientClinic.updateMany({
            where: {
                ...patientClinicWhere,
            },
            data: {
                totalLateArrivals: {
                    increment: 1,
                },
            },
        });

        if (patientClinicUpdateResult.count !== 1) {
            throw new Error('PATIENT_CLINIC_LINK_NOT_FOUND');
        }
    }

    return {
        wasEstablished: true,
        outcome,
    };
}
