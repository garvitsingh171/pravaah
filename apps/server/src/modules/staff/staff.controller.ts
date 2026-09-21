import type { NextFunction, Request, Response } from 'express';
import { UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { staffService } from './staff.service.js';
import type { CreateStaffInvitationRequest, UpdateStaffStatusRequest } from './staff.validation.js';

const requireIdentity = (req: Request): string => {
    if (!req.authIdentity) {
        throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
    }

    return req.authIdentity.clerkUserId;
};

const requireUser = (req: Request) => {
    if (!req.user) {
        throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
    }

    return req.user;
};

export async function createStaffInvitationController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const { email } = req.body as CreateStaffInvitationRequest;
        const result = await staffService.createInvitation({
            clinicId,
            email,
            invitedBy: requireUser(req),
        });

        res.status(201).json({
            success: true,
            message: 'Invitation created',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function listStaffController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const members = await staffService.listMembers(clinicId);

        res.status(200).json({
            success: true,
            message: 'Clinic team fetched successfully',
            data: { members },
        });
    } catch (error) {
        next(error);
    }
}

export async function listStaffInvitationsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const invitations = await staffService.listInvitations(clinicId);

        res.status(200).json({
            success: true,
            message: 'Staff invitations fetched successfully',
            data: { invitations },
        });
    } catch (error) {
        next(error);
    }
}

export async function previewStaffInvitationController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { token } = req.params as { token: string };
        const invitation = await staffService.previewInvitation(token, requireIdentity(req));

        res.status(200).json({
            success: true,
            message: 'Staff invitation fetched successfully',
            data: { invitation },
        });
    } catch (error) {
        next(error);
    }
}

export async function acceptStaffInvitationController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { token } = req.params as { token: string };
        const result = await staffService.acceptInvitation(token, requireIdentity(req));

        res.status(result.outcome === 'ALREADY_ACCEPTED' ? 200 : 201).json({
            success: true,
            message:
                result.outcome === 'ALREADY_ACCEPTED'
                    ? 'Staff invitation was already accepted'
                    : 'Staff invitation accepted',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function revokeStaffInvitationController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, invitationId } = req.params as {
            clinicId: string;
            invitationId: string;
        };
        const invitation = await staffService.revokeInvitation(clinicId, invitationId);

        res.status(200).json({
            success: true,
            message: 'Staff invitation revoked',
            data: { invitation },
        });
    } catch (error) {
        next(error);
    }
}

export async function updateStaffStatusController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, userId } = req.params as { clinicId: string; userId: string };
        const { status } = req.body as UpdateStaffStatusRequest;
        const member = await staffService.updateStaffStatus({
            clinicId,
            userId,
            status,
        });

        res.status(200).json({
            success: true,
            message: status === UserStatus.SUSPENDED ? 'Staff suspended' : 'Staff reactivated',
            data: { member },
        });
    } catch (error) {
        next(error);
    }
}
