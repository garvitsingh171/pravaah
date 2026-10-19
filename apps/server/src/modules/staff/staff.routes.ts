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
    listStaffController
);

staffRouter.patch(
    '/:clinicId/staff/:userId/status',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema, body: updateStaffStatusSchema }),
    requireClinicAccess,
    updateStaffStatusController
);

staffRouter.post(
    '/:clinicId/staff/invitations/:invitationId/resend',
    ...adminClinicMiddleware,
    validateRequest({ params: staffInvitationManagementParamsSchema }),
    requireClinicAccess,
    resendStaffInvitationController
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

staffRouter.get(
    '/:clinicId/staff/:userId',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema }),
    requireClinicAccess,
    getStaffMemberController
);

staffRouter.patch(
    '/:clinicId/staff/:userId',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema, body: updateStaffProfileSchema }),
    requireClinicAccess,
    updateStaffProfileController
);

staffRouter.delete(
    '/:clinicId/staff/:userId',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema }),
    requireClinicAccess,
    removeStaffMemberController
);

staffRouter.post(
    '/:clinicId/staff/:userId/restore',
    ...adminClinicMiddleware,
    validateRequest({ params: staffMemberParamsSchema }),
    requireClinicAccess,
    restoreStaffMemberController
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
