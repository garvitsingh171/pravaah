import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffInvitationStatus, UserRole, UserStatus } from '../../../generated/prisma/client.js';

const { mockPrisma, mockTx } = vi.hoisted(() => {
    const tx = {
        $executeRaw: vi.fn(),
        $queryRaw: vi.fn(),
        staffInvitation: {
            findFirst: vi.fn(),
            create: vi.fn(),
            findUnique: vi.fn(),
            updateMany: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        lifecycleEvent: { create: vi.fn() },
    };

    return {
        mockTx: tx,
        mockPrisma: {
            $transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) =>
                callback(tx)
            ),
            user: { findMany: vi.fn() },
            staffInvitation: { findMany: vi.fn(), findUnique: vi.fn() },
        },
    };
});

vi.mock('../../../config/prisma.js', () => ({ prisma: mockPrisma }));

import { staffRepository } from '../staff.repository.js';

const pendingInvitation = {
    id: 'invite-id',
    clinicId: 'clinic-id',
    email: 'staff@example.com',
    tokenHash: 'token-hash',
    status: StaffInvitationStatus.PENDING,
    invitedByUserId: 'admin-id',
    acceptedByUserId: null,
    expiresAt: new Date('2099-01-08T00:00:00.000Z'),
    acceptedAt: null,
    revokedAt: null,
    createdAt: new Date('2099-01-01T00:00:00.000Z'),
    updatedAt: new Date('2099-01-01T00:00:00.000Z'),
    clinic: { id: 'clinic-id', name: 'Clinic A', isActive: true },
    acceptedBy: null,
    invitedBy: { id: 'admin-id', fullName: 'Clinic Admin' },
};

describe('staffRepository transaction ownership', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTx.$executeRaw.mockResolvedValue(1);
        mockTx.$queryRaw.mockResolvedValue([]);
    });

    it('locks normalized email and clinic/email before duplicate checks and insert', async () => {
        mockTx.staffInvitation.findFirst.mockResolvedValue(null);
        mockTx.staffInvitation.create.mockResolvedValue(pendingInvitation);

        const result = await staffRepository.createInvitation({
            clinicId: 'clinic-id',
            email: 'staff@example.com',
            tokenHash: 'token-hash',
            invitedByUserId: 'admin-id',
            expiresAt: pendingInvitation.expiresAt,
            now: pendingInvitation.createdAt,
        });

        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
        expect(mockTx.$executeRaw).toHaveBeenCalledTimes(2);
        expect(mockTx.$queryRaw).toHaveBeenCalledTimes(1);
        expect(mockTx.staffInvitation.findFirst).toHaveBeenCalledWith({
            where: {
                clinicId: 'clinic-id',
                email: 'staff@example.com',
                status: StaffInvitationStatus.PENDING,
                expiresAt: { gt: pendingInvitation.createdAt },
            },
            select: { id: true },
        });
        expect(result.outcome).toBe('CREATED');
        expect(mockTx.lifecycleEvent.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ actorUserId: 'admin-id', action: 'CREATED' }),
            })
        );
    });

    it('creates Staff and claims the locked invitation in one transaction', async () => {
        mockTx.$queryRaw
            .mockResolvedValueOnce([{ id: pendingInvitation.id }])
            .mockResolvedValueOnce([]);
        mockTx.staffInvitation.findUnique.mockResolvedValue(pendingInvitation);
        mockTx.user.findUnique.mockResolvedValue(null);
        mockTx.user.create.mockResolvedValue({
            id: 'staff-id',
            clerkUserId: 'clerk-staff',
            fullName: 'Staff Member',
            email: 'staff@example.com',
            role: UserRole.STAFF,
            status: UserStatus.ACTIVE,
            clinicId: 'clinic-id',
            createdAt: new Date('2099-01-01T00:00:00.000Z'),
        });
        mockTx.staffInvitation.updateMany.mockResolvedValue({ count: 1 });

        const now = new Date('2099-01-02T00:00:00.000Z');
        const result = await staffRepository.acceptInvitation({
            tokenHash: 'token-hash',
            identity: {
                clerkUserId: 'clerk-staff',
                email: 'staff@example.com',
                fullName: 'Staff Member',
            },
            normalizedEmail: 'staff@example.com',
            now,
        });

        expect(mockTx.user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    role: UserRole.STAFF,
                    status: UserStatus.ACTIVE,
                    clinicId: 'clinic-id',
                }),
            })
        );
        expect(mockTx.staffInvitation.updateMany).toHaveBeenCalledWith({
            where: {
                id: 'invite-id',
                status: StaffInvitationStatus.PENDING,
                expiresAt: { gt: now },
            },
            data: {
                status: StaffInvitationStatus.ACCEPTED,
                acceptedAt: now,
                acceptedByUserId: 'staff-id',
            },
        });
        expect(result.outcome).toBe('ACCEPTED');
        expect(mockTx.lifecycleEvent.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ actorUserId: 'staff-id', action: 'ACCEPTED' }),
            })
        );
    });

    it('does not accept a pending invitation while its clinic is inactive', async () => {
        mockTx.$queryRaw.mockResolvedValueOnce([{ id: pendingInvitation.id }]);
        mockTx.staffInvitation.findUnique.mockResolvedValue({
            ...pendingInvitation,
            clinic: { ...pendingInvitation.clinic, isActive: false },
        });

        const result = await staffRepository.acceptInvitation({
            tokenHash: 'token-hash',
            identity: {
                clerkUserId: 'clerk-staff',
                email: 'staff@example.com',
                fullName: 'Staff Member',
            },
            normalizedEmail: 'staff@example.com',
            now: new Date('2099-01-02T00:00:00.000Z'),
        });

        expect(result).toEqual({ outcome: 'CLINIC_INACTIVE' });
        expect(mockTx.user.create).not.toHaveBeenCalled();
        expect(mockTx.staffInvitation.updateMany).not.toHaveBeenCalled();
    });

    it('revokes only through a guarded PENDING claim after taking the row lock', async () => {
        mockTx.$queryRaw.mockResolvedValueOnce([{ id: pendingInvitation.id }]);
        mockTx.staffInvitation.findUnique.mockResolvedValue(pendingInvitation);
        mockTx.staffInvitation.updateMany.mockResolvedValue({ count: 1 });
        const now = new Date('2099-01-02T00:00:00.000Z');

        const result = await staffRepository.revokeInvitation({
            clinicId: 'clinic-id',
            invitationId: 'invite-id',
            actorUserId: 'admin-id',
            now,
        });

        expect(mockTx.staffInvitation.updateMany).toHaveBeenCalledWith({
            where: {
                id: 'invite-id',
                clinicId: 'clinic-id',
                status: StaffInvitationStatus.PENDING,
                expiresAt: { gt: now },
            },
            data: {
                status: StaffInvitationStatus.REVOKED,
                revokedAt: now,
            },
        });
        expect(result.outcome).toBe('REVOKED');
        expect(mockTx.lifecycleEvent.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ actorUserId: 'admin-id', action: 'REVOKED' }),
            })
        );
    });

    it('removes a Staff member without deleting their identity or attribution', async () => {
        mockTx.user.findFirst.mockResolvedValue({
            id: 'staff-id',
            role: UserRole.STAFF,
            status: UserStatus.ACTIVE,
        });
        mockTx.user.update.mockResolvedValue({
            id: 'staff-id',
            role: UserRole.STAFF,
            status: UserStatus.REMOVED,
        });

        const result = await staffRepository.setStaffRemoved({
            clinicId: 'clinic-id',
            userId: 'staff-id',
            actorUserId: 'admin-id',
            restore: false,
        });

        expect(result).toMatchObject({ outcome: 'UPDATED', user: { status: UserStatus.REMOVED } });
        expect(mockTx.user.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { status: UserStatus.REMOVED } })
        );
        expect(mockTx.lifecycleEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ action: 'REMOVED', actorUserId: 'admin-id' }),
        });
    });

    it('protects Admin accounts from the Staff removal endpoint', async () => {
        mockTx.user.findFirst.mockResolvedValue({
            id: 'admin-id',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
        });

        const result = await staffRepository.setStaffRemoved({
            clinicId: 'clinic-id',
            userId: 'admin-id',
            actorUserId: 'admin-id',
            restore: false,
        });

        expect(result).toEqual({ outcome: 'STAFF_REQUIRED' });
        expect(mockTx.user.update).not.toHaveBeenCalled();
    });
});
