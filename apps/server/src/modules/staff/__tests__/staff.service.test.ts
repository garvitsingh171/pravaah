import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffInvitationStatus, UserRole, UserStatus } from '../../../generated/prisma/client.js';
import { AppError } from '../../../utils/AppError.js';

const mockStaffRepository = vi.hoisted(() => ({
    createInvitation: vi.fn(),
    listClinicMembers: vi.fn(),
    listClinicInvitations: vi.fn(),
    findInvitationByTokenHash: vi.fn(),
    acceptInvitation: vi.fn(),
    revokeInvitation: vi.fn(),
    updateStaffStatus: vi.fn(),
}));

const mockClerkIdentityService = vi.hoisted(() => ({
    getTrustedUserIdentity: vi.fn(),
}));

vi.mock('../staff.repository.js', () => ({ staffRepository: mockStaffRepository }));
vi.mock('../../auth/clerkIdentity.service.js', () => ({
    clerkIdentityService: mockClerkIdentityService,
}));
vi.mock('../../../config/env.js', () => ({
    env: { clientUrl: 'https://app.pravaah.test' },
}));

import {
    getEffectiveInvitationStatus,
    hashStaffInvitationToken,
    staffService,
} from '../staff.service.js';
import { EffectiveStaffInvitationStatus } from '../staff.types.js';

const admin = {
    id: 'admin-id',
    clerkUserId: 'clerk-admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    clinicId: 'clinic-id',
};

const invitation = {
    id: 'invite-id',
    clinicId: 'clinic-id',
    email: 'staff@example.com',
    tokenHash: 'stored-hash',
    status: StaffInvitationStatus.PENDING,
    invitedByUserId: admin.id,
    acceptedByUserId: null,
    expiresAt: new Date('2099-01-08T00:00:00.000Z'),
    acceptedAt: null,
    revokedAt: null,
    createdAt: new Date('2099-01-01T00:00:00.000Z'),
    updatedAt: new Date('2099-01-01T00:00:00.000Z'),
    invitedBy: { id: admin.id, fullName: 'Clinic Admin' },
};

describe('staffService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockClerkIdentityService.getTrustedUserIdentity.mockResolvedValue({
            clerkUserId: 'clerk-staff',
            email: ' Staff@Example.com ',
            fullName: 'Staff Member',
        });
    });

    it('derives EXPIRED without mutating the persisted PENDING status', () => {
        expect(
            getEffectiveInvitationStatus(
                StaffInvitationStatus.PENDING,
                new Date('2026-01-01T00:00:00.000Z'),
                new Date('2026-01-01T00:00:00.000Z')
            )
        ).toBe(EffectiveStaffInvitationStatus.EXPIRED);
        expect(
            getEffectiveInvitationStatus(
                StaffInvitationStatus.PENDING,
                new Date('2026-01-01T00:00:00.001Z'),
                new Date('2026-01-01T00:00:00.000Z')
            )
        ).toBe(EffectiveStaffInvitationStatus.PENDING);
    });

    it('creates a normalized seven-day invitation while persisting only a SHA-256 hash', async () => {
        mockStaffRepository.createInvitation.mockImplementation(
            async (input: { email: string; tokenHash: string }) => ({
                outcome: 'CREATED',
                invitation: { ...invitation, email: input.email, tokenHash: input.tokenHash },
            })
        );

        const result = await staffService.createInvitation({
            clinicId: 'clinic-id',
            email: ' Staff@Example.com ',
            invitedBy: admin,
        });
        const repositoryInput = mockStaffRepository.createInvitation.mock.calls[0]?.[0];

        if (!repositoryInput) {
            throw new Error('Expected the invitation repository to be called');
        }

        const rawToken = result.inviteUrl.split('/invite/').at(-1)!;

        expect(repositoryInput.email).toBe('staff@example.com');
        expect(repositoryInput.tokenHash).toMatch(/^[a-f0-9]{64}$/);
        expect(repositoryInput.tokenHash).toBe(hashStaffInvitationToken(rawToken));
        expect(repositoryInput).not.toHaveProperty('rawToken');
        expect(result.invitation).not.toHaveProperty('tokenHash');
        expect(repositoryInput.expiresAt.getTime() - repositoryInput.now.getTime()).toBe(
            7 * 24 * 60 * 60 * 1000
        );
    });

    it('rejects duplicate pending invitations deterministically', async () => {
        mockStaffRepository.createInvitation.mockResolvedValue({ outcome: 'INVITATION_PENDING' });

        await expect(
            staffService.createInvitation({
                clinicId: 'clinic-id',
                email: 'staff@example.com',
                invitedBy: admin,
            })
        ).rejects.toThrow(
            new AppError(
                409,
                'STAFF_INVITATION_ALREADY_PENDING',
                'An unexpired Staff invitation is already pending for this email'
            )
        );
    });

    it.each([
        [
            { clinicId: 'clinic-id', role: UserRole.STAFF, status: UserStatus.SUSPENDED },
            'STAFF_REACTIVATION_REQUIRED',
        ],
        [
            { clinicId: 'clinic-id', role: UserRole.STAFF, status: UserStatus.ACTIVE },
            'STAFF_ALREADY_MEMBER',
        ],
        [
            { clinicId: 'clinic-id', role: UserRole.ADMIN, status: UserStatus.ACTIVE },
            'STAFF_ALREADY_MEMBER',
        ],
        [
            { clinicId: 'other-clinic', role: UserRole.STAFF, status: UserStatus.ACTIVE },
            'USER_ALREADY_BELONGS_TO_ANOTHER_CLINIC',
        ],
    ])('maps existing member state to %s', async (user, expectedCode) => {
        mockStaffRepository.createInvitation.mockResolvedValue({
            outcome: 'MEMBER_EXISTS',
            user: {
                id: 'existing-id',
                clerkUserId: 'existing-clerk',
                fullName: 'Existing User',
                email: 'staff@example.com',
                createdAt: new Date(),
                ...user,
            },
        });

        await expect(
            staffService.createInvitation({
                clinicId: 'clinic-id',
                email: 'staff@example.com',
                invitedBy: admin,
            })
        ).rejects.toMatchObject({ code: expectedCode });
    });

    it('requires the trusted Clerk email to match during preview', async () => {
        mockStaffRepository.findInvitationByTokenHash.mockResolvedValue({
            ...invitation,
            clinic: { id: 'clinic-id', name: 'Clinic A' },
            acceptedBy: null,
        });
        mockClerkIdentityService.getTrustedUserIdentity.mockResolvedValue({
            clerkUserId: 'clerk-other',
            email: 'other@example.com',
            fullName: 'Other User',
        });

        await expect(staffService.previewInvitation('raw-token', 'clerk-other')).rejects.toThrow(
            new AppError(
                403,
                'INVITATION_IDENTITY_MISMATCH',
                'Sign in with the email address that received this invitation'
            )
        );
    });

    it('accepts using only trusted identity and the hashed route token', async () => {
        mockStaffRepository.acceptInvitation.mockResolvedValue({
            outcome: 'ACCEPTED',
            user: {
                id: 'staff-id',
                clerkUserId: 'clerk-staff',
                fullName: 'Staff Member',
                email: 'staff@example.com',
                role: UserRole.STAFF,
                status: UserStatus.ACTIVE,
                clinicId: 'clinic-id',
                createdAt: new Date(),
            },
            clinic: { id: 'clinic-id', name: 'Clinic A' },
        });

        const result = await staffService.acceptInvitation('raw-token', 'clerk-staff');

        expect(mockStaffRepository.acceptInvitation).toHaveBeenCalledWith(
            expect.objectContaining({
                tokenHash: hashStaffInvitationToken('raw-token'),
                normalizedEmail: 'staff@example.com',
                identity: {
                    clerkUserId: 'clerk-staff',
                    email: 'staff@example.com',
                    fullName: 'Staff Member',
                },
            })
        );
        expect(result.user).toMatchObject({ role: UserRole.STAFF, status: UserStatus.ACTIVE });
    });

    it.each([
        ['EXPIRED', 'STAFF_INVITATION_EXPIRED'],
        ['REVOKED', 'STAFF_INVITATION_REVOKED'],
        ['SUSPENDED', 'STAFF_REACTIVATION_REQUIRED'],
        ['OTHER_CLINIC', 'USER_ALREADY_BELONGS_TO_ANOTHER_CLINIC'],
        ['ADMIN_CONFLICT', 'STAFF_ALREADY_MEMBER'],
        ['IDENTITY_CONFLICT', 'STAFF_INVITATION_IDENTITY_CONFLICT'],
    ])('maps acceptance outcome %s to domain error %s', async (outcome, code) => {
        mockStaffRepository.acceptInvitation.mockResolvedValue({ outcome });

        await expect(
            staffService.acceptInvitation('raw-token', 'clerk-staff')
        ).rejects.toMatchObject({
            code,
        });
    });

    it('rejects an Admin target in the Staff status flow', async () => {
        mockStaffRepository.updateStaffStatus.mockResolvedValue({ outcome: 'STAFF_REQUIRED' });

        await expect(
            staffService.updateStaffStatus({
                clinicId: 'clinic-id',
                userId: 'admin-id',
                status: UserStatus.SUSPENDED,
            })
        ).rejects.toMatchObject({ code: 'STAFF_MEMBER_REQUIRED' });
    });
});
