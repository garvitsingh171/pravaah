import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatus } from '../../../generated/prisma/client.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import {
    applyPatientAppointmentOutcome,
    incrementPatientTotalAppointments,
} from '../patient.statistics.repository.js';

const patientClinicUpdateMany = vi.fn();
const tx = {
    patientClinic: {
        updateMany: patientClinicUpdateMany,
    },
} as unknown as Prisma.TransactionClient;

describe('patient statistics repository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('increments total appointments atomically for the clinic-specific patient link', async () => {
        patientClinicUpdateMany.mockResolvedValue({ count: 1 });

        await incrementPatientTotalAppointments({
            tx,
            clinicId: 'clinic-id',
            patientId: 'patient-id',
        });

        expect(patientClinicUpdateMany).toHaveBeenCalledWith({
            where: {
                clinicId: 'clinic-id',
                patientId: 'patient-id',
            },
            data: {
                totalAppointments: {
                    increment: 1,
                },
            },
        });
    });

    it('increments completed visits and advances last visit only when the event is newer', async () => {
        const eventTimestamp = new Date('2026-09-17T11:20:00.000Z');
        patientClinicUpdateMany
            .mockResolvedValueOnce({ count: 1 })
            .mockResolvedValueOnce({ count: 0 });

        await applyPatientAppointmentOutcome({
            tx,
            clinicId: 'clinic-id',
            patientId: 'patient-id',
            previousStatus: AppointmentStatus.CALLED,
            newStatus: AppointmentStatus.COMPLETED,
            eventTimestamp,
        });

        expect(patientClinicUpdateMany).toHaveBeenNthCalledWith(1, {
            where: {
                clinicId: 'clinic-id',
                patientId: 'patient-id',
            },
            data: {
                totalCompletedVisits: {
                    increment: 1,
                },
            },
        });
        expect(patientClinicUpdateMany).toHaveBeenNthCalledWith(2, {
            where: {
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                OR: [{ lastVisitAt: null }, { lastVisitAt: { lt: eventTimestamp } }],
            },
            data: {
                lastVisitAt: eventTimestamp,
            },
        });
    });

    it('increments no-shows without changing completed visits or last visit', async () => {
        patientClinicUpdateMany.mockResolvedValue({ count: 1 });

        await applyPatientAppointmentOutcome({
            tx,
            clinicId: 'clinic-id',
            patientId: 'patient-id',
            previousStatus: AppointmentStatus.CONFIRMED,
            newStatus: AppointmentStatus.NO_SHOW,
            eventTimestamp: new Date('2026-09-17T11:20:00.000Z'),
        });

        expect(patientClinicUpdateMany).toHaveBeenCalledTimes(1);
        expect(patientClinicUpdateMany).toHaveBeenCalledWith({
            where: {
                clinicId: 'clinic-id',
                patientId: 'patient-id',
            },
            data: {
                totalNoShows: {
                    increment: 1,
                },
            },
        });
    });

    it('does not write outcome statistics for a same-status retry', async () => {
        await applyPatientAppointmentOutcome({
            tx,
            clinicId: 'clinic-id',
            patientId: 'patient-id',
            previousStatus: AppointmentStatus.COMPLETED,
            newStatus: AppointmentStatus.COMPLETED,
            eventTimestamp: new Date('2026-09-17T11:20:00.000Z'),
        });

        expect(patientClinicUpdateMany).not.toHaveBeenCalled();
    });
});
