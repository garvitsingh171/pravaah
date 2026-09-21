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
    clinic: { id: 'clinic-id', name: 'Clinic A' },
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
    });

    it('revokes only through a guarded PENDING claim after taking the row lock', async () => {
        mockTx.$queryRaw.mockResolvedValueOnce([{ id: pendingInvitation.id }]);
        mockTx.staffInvitation.findUnique.mockResolvedValue(pendingInvitation);
        mockTx.staffInvitation.updateMany.mockResolvedValue({ count: 1 });
        const now = new Date('2099-01-02T00:00:00.000Z');

        const result = await staffRepository.revokeInvitation({
            clinicId: 'clinic-id',
            invitationId: 'invite-id',
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
    });
});
