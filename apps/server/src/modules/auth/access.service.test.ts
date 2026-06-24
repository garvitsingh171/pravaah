import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';

const mockAccessRepository = vi.hoisted(() => ({
    findClinicById: vi.fn(),
    findAppointmentClinicById: vi.fn(),
}));

vi.mock('./access.repository.js', () => ({
    accessRepository: mockAccessRepository,
}));

import { accessService } from './access.service.js';
import type { AuthenticatedUser } from './auth.types.js';

const activeAdminUser: AuthenticatedUser = {
    id: 'user-id',
    clerkUserId: 'clerk-user-id',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    clinicId: 'clinic-id',
};

describe('accessService.verifyClinicAccess', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
});
