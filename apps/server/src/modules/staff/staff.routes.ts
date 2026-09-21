import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    authenticateClerkIdentity,
    authenticateRequest,
    requireAdminRole,
    requireClinicAccess,
} from '../auth/auth.middleware.js';
import {
    acceptStaffInvitationController,
    createStaffInvitationController,
    listStaffController,
    listStaffInvitationsController,
    previewStaffInvitationController,
    revokeStaffInvitationController,
    updateStaffStatusController,
} from './staff.controller.js';
import {
    acceptStaffInvitationBodySchema,
    clinicIdParamsSchema,
    createStaffInvitationSchema,
    staffInvitationManagementParamsSchema,
    staffInvitationTokenParamsSchema,
    staffMemberParamsSchema,
    updateStaffStatusSchema,
} from './staff.validation.js';

const adminClinicMiddleware = [authenticateRequest, requireAdminRole] as const;

const staffRouter = Router();

staffRouter.get(
    '/:clinicId/staff',
    ...adminClinicMiddleware,
    validateRequest({ params: clinicIdParamsSchema }),
    requireClinicAccess,
    listStaffController
);

staffRouter.patch(
    '/:clinicId/staff/:userId/status',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema, body: updateStaffStatusSchema }),
    requireClinicAccess,
    updateStaffStatusController
);

staffRouter.get(
    '/:clinicId/staff/invitations',
    ...adminClinicMiddleware,
    validateRequest({ params: clinicIdParamsSchema }),
    requireClinicAccess,
    listStaffInvitationsController
);

staffRouter.post(
    '/:clinicId/staff/invitations',
    ...adminClinicMiddleware,
    validateRequest({ params: clinicIdParamsSchema, body: createStaffInvitationSchema }),
    requireClinicAccess,
    createStaffInvitationController
);

staffRouter.patch(
    '/:clinicId/staff/invitations/:invitationId/revoke',
    ...adminClinicMiddleware,
    validateRequest({ params: staffInvitationManagementParamsSchema }),
    requireClinicAccess,
    revokeStaffInvitationController
);

const staffInvitationRouter = Router();

staffInvitationRouter.get(
    '/invitations/:token',
    authenticateClerkIdentity,
    validateRequest({ params: staffInvitationTokenParamsSchema }),
    previewStaffInvitationController
);

staffInvitationRouter.post(
    '/invitations/:token/accept',
    authenticateClerkIdentity,
    validateRequest({
        params: staffInvitationTokenParamsSchema,
        body: acceptStaffInvitationBodySchema,
    }),
    acceptStaffInvitationController
);

export { staffInvitationRouter, staffRouter };
