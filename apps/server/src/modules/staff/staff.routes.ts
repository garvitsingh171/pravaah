import { rateLimit } from '../../middleware/rateLimit.js';
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
    getStaffMemberController,
    listStaffController,
    listStaffInvitationsController,
    previewStaffInvitationController,
    revokeStaffInvitationController,
    resendStaffInvitationController,
    removeStaffMemberController,
    restoreStaffMemberController,
    updateStaffProfileController,
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
    updateStaffProfileSchema,
} from './staff.validation.js';

const adminClinicMiddleware = [authenticateRequest, requireAdminRole] as const;

const staffRouter = Router();

staffRouter.get(
    '/:clinicId/staff',
    ...adminClinicMiddleware,
    validateRequest({ params: clinicIdParamsSchema }),
    requireClinicAccess,
    rateLimit('collection'),
    listStaffController
);

staffRouter.patch(
    '/:clinicId/staff/:userId/status',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema, body: updateStaffStatusSchema }),
    requireClinicAccess,
    rateLimit('mutation'),
    updateStaffStatusController
);

staffRouter.post(
    '/:clinicId/staff/invitations/:invitationId/resend',
    ...adminClinicMiddleware,
    validateRequest({ params: staffInvitationManagementParamsSchema }),
    requireClinicAccess,
    rateLimit('invitationWrite'),
    resendStaffInvitationController
);

staffRouter.get(
    '/:clinicId/staff/invitations',
    ...adminClinicMiddleware,
    validateRequest({ params: clinicIdParamsSchema }),
    requireClinicAccess,
    rateLimit('collection'),
    listStaffInvitationsController
);

staffRouter.post(
    '/:clinicId/staff/invitations',
    ...adminClinicMiddleware,
    validateRequest({ params: clinicIdParamsSchema, body: createStaffInvitationSchema }),
    requireClinicAccess,
    rateLimit('invitationWrite'),
    createStaffInvitationController
);

staffRouter.patch(
    '/:clinicId/staff/invitations/:invitationId/revoke',
    ...adminClinicMiddleware,
    validateRequest({ params: staffInvitationManagementParamsSchema }),
    requireClinicAccess,
    rateLimit('mutation'),
    revokeStaffInvitationController
);

staffRouter.get(
    '/:clinicId/staff/:userId',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema }),
    requireClinicAccess,
    rateLimit('collection'),
    getStaffMemberController
);

staffRouter.patch(
    '/:clinicId/staff/:userId',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema, body: updateStaffProfileSchema }),
    requireClinicAccess,
    rateLimit('mutation'),
    updateStaffProfileController
);

staffRouter.delete(
    '/:clinicId/staff/:userId',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema }),
    requireClinicAccess,
    rateLimit('mutation'),
    removeStaffMemberController
);

staffRouter.post(
    '/:clinicId/staff/:userId/restore',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema }),
    requireClinicAccess,
    rateLimit('mutation'),
    restoreStaffMemberController
);

const staffInvitationRouter = Router();

staffInvitationRouter.get(
    '/invitations/:token',
    authenticateClerkIdentity,
    validateRequest({ params: staffInvitationTokenParamsSchema }),
    rateLimit('invitationRead'),
    previewStaffInvitationController
);

staffInvitationRouter.post(
    '/invitations/:token/accept',
    authenticateClerkIdentity,
    validateRequest({
        params: staffInvitationTokenParamsSchema,
        body: acceptStaffInvitationBodySchema,
    }),
    rateLimit('invitationAccept'),
    acceptStaffInvitationController
);

export { staffInvitationRouter, staffRouter };
