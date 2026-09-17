import { AppointmentStatus, type Prisma } from '../../generated/prisma/client.js';

type PatientStatisticScope = {
    tx: Prisma.TransactionClient;
    clinicId: string;
    patientId: string;
};

type ApplyPatientAppointmentOutcomeInput = PatientStatisticScope & {
    previousStatus: AppointmentStatus;
    newStatus: AppointmentStatus;
    eventTimestamp: Date;
};

const assertPatientClinicUpdated = (updatedCount: number): void => {
    if (updatedCount !== 1) {
        throw new Error('PATIENT_CLINIC_LINK_NOT_FOUND');
    }
};

export async function incrementPatientTotalAppointments({
    tx,
    clinicId,
    patientId,
}: PatientStatisticScope): Promise<void> {
    const updateResult = await tx.patientClinic.updateMany({
        where: {
            clinicId,
            patientId,
        },
        data: {
            totalAppointments: {
                increment: 1,
            },
        },
    });

    assertPatientClinicUpdated(updateResult.count);
}

export async function applyPatientAppointmentOutcome({
    tx,
    clinicId,
    patientId,
    previousStatus,
    newStatus,
    eventTimestamp,
}: ApplyPatientAppointmentOutcomeInput): Promise<void> {
    if (previousStatus === newStatus) {
        return;
    }

    if (newStatus === AppointmentStatus.COMPLETED) {
        const completedUpdateResult = await tx.patientClinic.updateMany({
            where: {
                clinicId,
                patientId,
            },
            data: {
                totalCompletedVisits: {
                    increment: 1,
                },
            },
        });

        assertPatientClinicUpdated(completedUpdateResult.count);

        await tx.patientClinic.updateMany({
            where: {
                clinicId,
                patientId,
                OR: [
                    {
                        lastVisitAt: null,
                    },
                    {
                        lastVisitAt: {
                            lt: eventTimestamp,
                        },
                    },
                ],
            },
            data: {
                lastVisitAt: eventTimestamp,
            },
        });

        return;
    }

    if (newStatus === AppointmentStatus.NO_SHOW) {
        const noShowUpdateResult = await tx.patientClinic.updateMany({
            where: {
                clinicId,
                patientId,
            },
            data: {
                totalNoShows: {
                    increment: 1,
                },
            },
        });

        assertPatientClinicUpdated(noShowUpdateResult.count);
    }
}
