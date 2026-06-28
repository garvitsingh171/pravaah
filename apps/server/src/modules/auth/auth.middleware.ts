import { getAuth } from '@clerk/express';
import type { RequestHandler } from 'express';
import { AppError } from '../../utils/AppError.js';
import { accessService } from './access.service.js';
import { authService } from './auth.service.js';

const bearerAuthorizationHeaderPattern = /^Bearer\s+\S+$/i;

const hasBearerAuthorizationHeader = (authorizationHeader: string | undefined): boolean => {
    return (
        authorizationHeader !== undefined &&
        bearerAuthorizationHeaderPattern.test(authorizationHeader)
    );
};

export const authenticateRequest: RequestHandler = async (req, _res, next) => {
    try {
        const authorizationHeader = req.header('authorization');

        if (!authorizationHeader) {
            throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
        }

        if (!hasBearerAuthorizationHeader(authorizationHeader)) {
            throw new AppError(
                401,
                'INVALID_AUTH_TOKEN',
                'Authentication token is invalid or expired'
            );
        }

        const auth = getAuth(req);

        if (!auth.isAuthenticated || !auth.userId) {
            throw new AppError(
                401,
                'INVALID_AUTH_TOKEN',
                'Authentication token is invalid or expired'
            );
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
