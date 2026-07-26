import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../generated/prisma/client.js';

const mockPrisma = vi.hoisted(() => ({
    clinic: {
        findUnique: vi.fn(),
        create: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
    },
    $transaction: vi.fn(),
}));

vi.mock('../../config/prisma.js', () => ({
    prisma: mockPrisma,
}));

import { authRepository } from './auth.repository.js';

describe('authRepository.findOnboardingUserByClerkUserId', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('queries onboarding state by trusted Clerk user id with a minimal select', async () => {
        const user = {
            id: 'user-id',
            fullName: 'Dr. Asha Rao',
            email: 'asha@example.com',
            role: 'ADMIN',
            status: 'ACTIVE',
            clinicId: 'clinic-id',
            clinic: {
                id: 'clinic-id',
                name: 'Pravaah Family Clinic',
                slug: 'pravaah-family-clinic',
                isActive: true,
            },
        };

        mockPrisma.user.findUnique.mockResolvedValue(user);

        await expect(
            authRepository.findOnboardingUserByClerkUserId('clerk-user-id')
        ).resolves.toEqual(user);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
            where: {
                clerkUserId: 'clerk-user-id',
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                clinicId: true,
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                    },
                },
            },
        });
        expect(mockPrisma.user.create).not.toHaveBeenCalled();
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
        expect(mockPrisma.user.upsert).not.toHaveBeenCalled();
        expect(mockPrisma.user.delete).not.toHaveBeenCalled();
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('returns null when no internal user exists', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
            authRepository.findOnboardingUserByClerkUserId('missing-clerk-user-id')
        ).resolves.toBeNull();

        expect(mockPrisma.user.create).not.toHaveBeenCalled();
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
        expect(mockPrisma.user.upsert).not.toHaveBeenCalled();
        expect(mockPrisma.user.delete).not.toHaveBeenCalled();
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
});

describe('authRepository.findClinicBySlug', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('checks clinic slug existence with a minimal select', async () => {
        const clinic = {
            id: 'clinic-id',
        };

        mockPrisma.clinic.findUnique.mockResolvedValue(clinic);

        await expect(authRepository.findClinicBySlug('pravaah-family-clinic')).resolves.toEqual(
            clinic
        );

        expect(mockPrisma.clinic.findUnique).toHaveBeenCalledWith({
            where: {
                slug: 'pravaah-family-clinic',
            },
            select: {
                id: true,
            },
        });
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
});

describe('authRepository.createClinicWithAdmin', () => {
    const input = {
        clinic: {
            name: 'Pravaah Family Clinic',
            slug: 'pravaah-family-clinic',
            phone: '+91 9876543210',
            email: 'clinic@example.com',
            addressLine1: '12 Flow Street',
            addressLine2: 'Second Floor',
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India',
            pincode: '411001',
            timezone: 'Asia/Kolkata',
            openingTime: '09:00',
            closingTime: '18:00',
            slotDurationMinutes: 15,
            bufferMinutes: 0,
        },
        admin: {
            clerkUserId: 'trusted-clerk-user-id',
            fullName: 'Clinic Admin',
            email: 'admin@example.com',
        },
    };

    const clinic = {
        id: 'clinic-id',
        name: input.clinic.name,
        slug: input.clinic.slug,
    };

    const user = {
        id: 'internal-user-id',
        fullName: input.admin.fullName,
        email: input.admin.email,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    };

    const createTransactionClient = () => ({
        clinic: {
            create: vi.fn(),
        },
        user: {
            create: vi.fn(),
        },
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates a clinic and admin user inside one Prisma transaction', async () => {
        const tx = createTransactionClient();

        mockPrisma.$transaction.mockImplementation(async (operation) => operation(tx));
        tx.clinic.create.mockResolvedValue(clinic);
        tx.user.create.mockResolvedValue(user);

        await expect(authRepository.createClinicWithAdmin(input)).resolves.toEqual({
            user,
            clinic,
        });

        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
        expect(tx.clinic.create).toHaveBeenCalledWith({
            data: {
                name: input.clinic.name,
                slug: input.clinic.slug,
                phone: input.clinic.phone,
                email: input.clinic.email,
                addressLine1: input.clinic.addressLine1,
                addressLine2: input.clinic.addressLine2,
                city: input.clinic.city,
                state: input.clinic.state,
                country: input.clinic.country,
                pincode: input.clinic.pincode,
                timezone: input.clinic.timezone,
                openingTime: input.clinic.openingTime,
                closingTime: input.clinic.closingTime,
                slotDurationMinutes: input.clinic.slotDurationMinutes,
                bufferMinutes: input.clinic.bufferMinutes,
            },
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });
        expect(tx.user.create).toHaveBeenCalledWith({
            data: {
                clerkUserId: input.admin.clerkUserId,
                fullName: input.admin.fullName,
                email: input.admin.email,
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                clinicId: clinic.id,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
            },
        });
    });

    it('uses nulls for omitted optional clinic fields', async () => {
        const tx = createTransactionClient();

        mockPrisma.$transaction.mockImplementation(async (operation) => operation(tx));
        tx.clinic.create.mockResolvedValue(clinic);
        tx.user.create.mockResolvedValue(user);

        await authRepository.createClinicWithAdmin({
            ...input,
            clinic: {
                name: input.clinic.name,
                slug: input.clinic.slug,
                country: input.clinic.country,
                timezone: input.clinic.timezone,
                openingTime: input.clinic.openingTime,
                closingTime: input.clinic.closingTime,
                slotDurationMinutes: input.clinic.slotDurationMinutes,
                bufferMinutes: input.clinic.bufferMinutes,
            },
        });

        expect(tx.clinic.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    phone: null,
                    email: null,
                    addressLine1: null,
                    addressLine2: null,
                    city: null,
                    state: null,
                    pincode: null,
                }),
            })
        );
    });

    it('does not create the user when clinic creation fails', async () => {
        const tx = createTransactionClient();
        const error = new Error('clinic create failed');

        mockPrisma.$transaction.mockImplementation(async (operation) => operation(tx));
        tx.clinic.create.mockRejectedValue(error);

        await expect(authRepository.createClinicWithAdmin(input)).rejects.toBe(error);

        expect(tx.user.create).not.toHaveBeenCalled();
    });

    it('rejects when user creation fails and does not return a successful result', async () => {
        const tx = createTransactionClient();
        const error = new Error('user create failed');

        mockPrisma.$transaction.mockImplementation(async (operation) => operation(tx));
        tx.clinic.create.mockResolvedValue(clinic);
        tx.user.create.mockRejectedValue(error);

        await expect(authRepository.createClinicWithAdmin(input)).rejects.toBe(error);

        expect(tx.clinic.create).toHaveBeenCalled();
        expect(tx.user.create).toHaveBeenCalled();
    });
});
