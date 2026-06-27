import { getAuth } from '@clerk/express';
import type { RequestHandler } from 'express';
import { AppError } from '../../utils/AppError.js';
import { accessService } from './access.service.js';
import { authService } from './auth.service.js';

export const authenticateRequest: RequestHandler = async (req, _res, next) => {
    try {
        const auth = getAuth(req);

        if (!auth.isAuthenticated || !auth.userId) {
            throw new AppError(401, 'UNAUTHENTICATED', 'Missing or invalid authentication token');
        }

        req.user = await authService.getActiveUserByClerkUserId(auth.userId);

        next();
    } catch (error) {
        next(error);
    }
};

export const requireClinicAccess: RequestHandler = async (req, _res, next) => {
    try {
        const { clinicId } = req.params;

        if (!clinicId || Array.isArray(clinicId)) {
            throw new AppError(400, 'CLINIC_ID_REQUIRED', 'Clinic id is required');
        }

        await accessService.verifyClinicAccess(req.user, clinicId);

        next();
    } catch (error) {
        next(error);
    }
};

export const requireAdminRole: RequestHandler = (req, _res, next) => {
    try {
        accessService.requireAdmin(req.user);

        next();
    } catch (error) {
        next(error);
    }
};

export const requireClinicStaffRole: RequestHandler = (req, _res, next) => {
    try {
        accessService.requireClinicStaff(req.user);

        next();
    } catch (error) {
        next(error);
    }
};
