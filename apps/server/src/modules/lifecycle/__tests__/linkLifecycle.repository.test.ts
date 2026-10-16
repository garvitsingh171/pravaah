import { beforeEach, describe, expect, it, vi } from 'vitest';

const { tx, prisma } = vi.hoisted(() => {
    const transaction = {
        $queryRaw: vi.fn(),
        doctorClinic: { findUnique: vi.fn(), update: vi.fn() },
        patientClinic: { findUnique: vi.fn(), update: vi.fn() },
        appointment: { count: vi.fn() },
        queueEntry: { count: vi.fn() },
        lifecycleEvent: { create: vi.fn() },
    };
    return {
        tx: transaction,
        prisma: {
            $transaction: vi.fn((callback: (client: typeof transaction) => unknown) =>
                callback(transaction)
            ),
        },
    };
});

vi.mock('../../../config/prisma.js', () => ({ prisma }));

import { doctorRepository } from '../../doctors/doctor.repository.js';
import { patientRepository } from '../../patients/patient.repository.js';

const base = { clinicId: 'clinic-a', actorUserId: 'admin-a' };

describe('clinic association lifecycle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        tx.$queryRaw.mockResolvedValue([{ id: 'link-id' }]);
        tx.appointment.count.mockResolvedValue(0);
        tx.queueEntry.count.mockResolvedValue(0);
    });

    it('blocks doctor archival while unresolved visits exist and preserves every link', async () => {
        tx.doctorClinic.findUnique.mockResolvedValue({
            id: 'doctor-link-a',
            isActive: true,
            doctor: { id: 'doctor-id', isActive: true },
        });
        tx.appointment.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

        const result = await doctorRepository.setClinicLinkActive({
            ...base,
            doctorId: 'doctor-id',
            isActive: false,
        });

        expect(result).toMatchObject({
            outcome: 'ACTIVE_VISITS',
            impact: { futureAppointments: 1 },
        });
        expect(tx.doctorClinic.update).not.toHaveBeenCalled();
        expect(tx.lifecycleEvent.create).not.toHaveBeenCalled();
        expect(tx.appointment.count).toHaveBeenCalledWith({
            where: expect.objectContaining({ clinicId: 'clinic-a', doctorId: 'doctor-id' }),
        });
    });

    it('archives only the requested doctor association and records the actor', async () => {
        tx.doctorClinic.findUnique.mockResolvedValue({
            id: 'doctor-link-a',
            isActive: true,
            doctor: { id: 'doctor-id', isActive: true },
        });

        const result = await doctorRepository.setClinicLinkActive({
            ...base,
            doctorId: 'doctor-id',
            isActive: false,
        });

        expect(result).toMatchObject({ outcome: 'UPDATED', doctor: { clinicLinkIsActive: false } });
        expect(tx.doctorClinic.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { doctorId_clinicId: { clinicId: 'clinic-a', doctorId: 'doctor-id' } },
            })
        );
        expect(tx.doctorClinic.update).toHaveBeenCalledWith({
            where: { id: 'doctor-link-a' },
            data: { isActive: false },
        });
        expect(tx.lifecycleEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                clinicId: 'clinic-a',
                actorUserId: 'admin-a',
                entityId: 'doctor-link-a',
                action: 'ARCHIVED',
            }),
        });
    });

    it('rejects a patient outside the requested clinic without leaking or changing it', async () => {
        tx.patientClinic.findUnique.mockResolvedValue(null);

        const result = await patientRepository.setClinicLinkActive({
            ...base,
            patientId: 'patient-id',
            isActive: false,
        });

        expect(result).toEqual({ outcome: 'NOT_FOUND' });
        expect(tx.patientClinic.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { patientId_clinicId: { clinicId: 'clinic-a', patientId: 'patient-id' } },
            })
        );
        expect(tx.patientClinic.update).not.toHaveBeenCalled();
        expect(tx.lifecycleEvent.create).not.toHaveBeenCalled();
    });

    it('restores a patient clinic link without touching the global profile or history', async () => {
        tx.patientClinic.findUnique.mockResolvedValue({
            id: 'patient-link-a',
            isActive: false,
            patient: { id: 'patient-id', isActive: true },
        });

        const result = await patientRepository.setClinicLinkActive({
            ...base,
            patientId: 'patient-id',
            isActive: true,
        });

        expect(result).toMatchObject({ outcome: 'UPDATED', patient: { clinicLinkIsActive: true } });
        expect(tx.patientClinic.update).toHaveBeenCalledWith({
            where: { id: 'patient-link-a' },
            data: { isActive: true },
        });
        expect(tx.lifecycleEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                clinicId: 'clinic-a',
                actorUserId: 'admin-a',
                entityId: 'patient-link-a',
                action: 'RESTORED',
            }),
        });
    });
});
