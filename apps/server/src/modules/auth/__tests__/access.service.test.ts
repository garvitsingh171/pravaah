import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../../generated/prisma/client.js';
import { AppError } from '../../../utils/AppError.js';

const mockAccessRepository = vi.hoisted(() => ({
    findClinicById: vi.fn(),
    findAppointmentClinicById: vi.fn(),
}));

vi.mock('../access.repository.js', () => ({
    accessRepository: mockAccessRepository,
}));

import { accessService } from '../access.service.js';
import type { AuthenticatedUser } from '../auth.types.js';

const activeAdminUser: AuthenticatedUser = {
    id: 'user-id',
    clerkUserId: 'clerk-user-id',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    clinicId: 'clinic-id',
};

describe('accessService.requireAdmin', () => {
    it('allows active Admin users', () => {
        expect(accessService.requireAdmin(activeAdminUser)).toEqual(activeAdminUser);
    });

    it('denies active Staff users', () => {
        const activeStaffUser: AuthenticatedUser = {
            ...activeAdminUser,
            role: UserRole.STAFF,
        };

        expect(() => accessService.requireAdmin(activeStaffUser)).toThrow(
            new AppError(403, 'ADMIN_REQUIRED', 'Admin access is required')
        );
    });
});

describe('accessService.requireClinicStaff', () => {
    it('allows Admin and Staff users', () => {
        const activeStaffUser: AuthenticatedUser = {
            ...activeAdminUser,
            role: UserRole.STAFF,
        };

        expect(accessService.requireClinicStaff(activeAdminUser)).toEqual(activeAdminUser);
        expect(accessService.requireClinicStaff(activeStaffUser)).toEqual(activeStaffUser);
    });

    it('denies non-clinic staff roles', () => {
        const unsupportedRoleUser: AuthenticatedUser = {
            ...activeAdminUser,
            role: 'PATIENT' as UserRole,
        };

        expect(() => accessService.requireClinicStaff(unsupportedRoleUser)).toThrow(
            new AppError(403, 'CLINIC_STAFF_REQUIRED', 'Clinic staff access is required')
        );
    });

    it('denies inactive internal users', () => {
        const invitedUser: AuthenticatedUser = {
            ...activeAdminUser,
            status: UserStatus.INVITED,
        };

        expect(() => accessService.requireClinicStaff(invitedUser)).toThrow(
            new AppError(403, 'USER_NOT_ACTIVE', 'User is not active')
        );
    });
});

describe('accessService.verifyClinicAccess', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('denies missing internal users', async () => {
        await expect(
            accessService.verifyClinicAccess(undefined, 'clinic-id')
        ).rejects.toMatchObject(
            new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
        );

        expect(mockAccessRepository.findClinicById).not.toHaveBeenCalled();
    });

    it('denies foreign clinics before looking up clinic details', async () => {
        await expect(
            accessService.verifyClinicAccess(activeAdminUser, 'other-clinic-id')
        ).rejects.toMatchObject(
            new AppError(403, 'CLINIC_ACCESS_DENIED', 'You do not have access to this clinic')
        );

        expect(mockAccessRepository.findClinicById).not.toHaveBeenCalled();
    });

    it('returns the clinic when the active user belongs to it', async () => {
        const clinic = {
            id: 'clinic-id',
            isActive: true,
            timezone: 'Asia/Kolkata',
        };

        mockAccessRepository.findClinicById.mockResolvedValue(clinic);

        await expect(
            accessService.verifyClinicAccess(activeAdminUser, 'clinic-id')
        ).resolves.toEqual(clinic);

        expect(mockAccessRepository.findClinicById).toHaveBeenCalledWith('clinic-id');
    });

    it('denies inactive clinics', async () => {
        mockAccessRepository.findClinicById.mockResolvedValue({
            id: 'clinic-id',
            isActive: false,
            timezone: 'Asia/Kolkata',
        });

        await expect(
            accessService.verifyClinicAccess(activeAdminUser, 'clinic-id')
        ).rejects.toMatchObject(new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive'));

        expect(mockAccessRepository.findClinicById).toHaveBeenCalledWith('clinic-id');
    });
});
