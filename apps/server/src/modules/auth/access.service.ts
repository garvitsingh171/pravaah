import { UserRole, UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { accessRepository } from './access.repository.js';
import type { AuthenticatedUser } from './auth.types.js';

export const accessService = {
    requireAuthenticatedUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
        if (!user) {
            throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new AppError(403, 'USER_NOT_ACTIVE', 'User is not active');
        }

        return user;
    },

    requireAdmin(user: AuthenticatedUser | undefined): AuthenticatedUser {
        const authenticatedUser = this.requireAuthenticatedUser(user);

        if (authenticatedUser.role !== UserRole.ADMIN) {
            throw new AppError(403, 'ADMIN_REQUIRED', 'Admin access is required');
        }

        return authenticatedUser;
    },

    requireClinicStaff(user: AuthenticatedUser | undefined): AuthenticatedUser {
        const authenticatedUser = this.requireAuthenticatedUser(user);

        if (
            authenticatedUser.role !== UserRole.ADMIN &&
            authenticatedUser.role !== UserRole.STAFF
        ) {
            throw new AppError(403, 'CLINIC_STAFF_REQUIRED', 'Clinic staff access is required');
        }

        return authenticatedUser;
    },

    async verifyClinicAccess(user: AuthenticatedUser | undefined, clinicId: string) {
        const authenticatedUser = this.requireAuthenticatedUser(user);

        if (authenticatedUser.clinicId !== clinicId) {
            throw new AppError(
                403,
                'CLINIC_ACCESS_DENIED',
                'You do not have access to this clinic'
            );
        }

        const clinic = await accessRepository.findClinicById(clinicId);

        if (!clinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (!clinic.isActive) {
            throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
        }

        return clinic;
    },

    async verifyAppointmentClinicAccess(
        user: AuthenticatedUser | undefined,
        appointmentId: string
    ) {
        const appointment = await accessRepository.findAppointmentClinicById(appointmentId);

        if (!appointment) {
            throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
        }

        await this.verifyClinicAccess(user, appointment.clinicId);

        return appointment;
    },
};
