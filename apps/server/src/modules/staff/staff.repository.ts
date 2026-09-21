import {
    Prisma,
    StaffInvitationStatus,
    UserRole,
    UserStatus,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import type { TrustedClerkUserIdentity } from '../auth/auth.types.js';
import type { ManageableStaffStatus } from './staff.types.js';

type ExistingUserRecord = {
    id: string;
    clerkUserId: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    clinicId: string | null;
    createdAt: Date;
};

const invitationInclude = {
    invitedBy: {
        select: {
            id: true,
            fullName: true,
        },
    },
} satisfies Prisma.StaffInvitationInclude;

const acquireEmailMembershipLock = (tx: Prisma.TransactionClient, email: string) => {
    return tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
            hashtextextended(concat('staff-membership:', ${email}::text), 0)
        )
    `;
};

const acquireClinicInvitationLock = (
    tx: Prisma.TransactionClient,
    clinicId: string,
    email: string
) => {
    return tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
            hashtextextended(
                concat('staff-invite:', ${clinicId}::text, ':', ${email}::text),
                0
            )
        )
    `;
};

const findUserByNormalizedEmail = async (
    tx: Prisma.TransactionClient,
    email: string
): Promise<ExistingUserRecord | null> => {
    const [user] = await tx.$queryRaw<ExistingUserRecord[]>`
        SELECT
            "id",
            "clerkUserId",
            "fullName",
            "email",
            "role",
            "status",
            "clinicId",
            "createdAt"
        FROM "users"
        WHERE lower(btrim("email")) = ${email}
        LIMIT 1
    `;

    return user ?? null;
};

export type CreateInvitationRepositoryResult =
    | { outcome: 'CREATED'; invitation: Awaited<ReturnType<typeof createInvitationRecord>> }
    | { outcome: 'MEMBER_EXISTS'; user: ExistingUserRecord }
    | { outcome: 'INVITATION_PENDING' };

const createInvitationRecord = (
    tx: Prisma.TransactionClient,
    input: {
        clinicId: string;
        email: string;
        tokenHash: string;
        invitedByUserId: string;
        expiresAt: Date;
    }
) => {
    return tx.staffInvitation.create({
        data: input,
        include: invitationInclude,
    });
};

export type AcceptInvitationRepositoryResult =
    | {
          outcome: 'ACCEPTED' | 'ALREADY_ACCEPTED';
          user: ExistingUserRecord;
          clinic: { id: string; name: string };
      }
    | { outcome: 'NOT_FOUND' }
    | { outcome: 'IDENTITY_MISMATCH' }
    | { outcome: 'EXPIRED' }
    | { outcome: 'REVOKED' }
    | { outcome: 'ALREADY_ACCEPTED_BY_ANOTHER_IDENTITY' }
    | { outcome: 'IDENTITY_CONFLICT' }
    | { outcome: 'ADMIN_CONFLICT' }
    | { outcome: 'OTHER_CLINIC' }
    | { outcome: 'SUSPENDED' };

export type RevokeInvitationRepositoryResult =
    | { outcome: 'REVOKED'; invitation: Awaited<ReturnType<typeof createInvitationRecord>> }
    | { outcome: 'NOT_FOUND' }
    | { outcome: 'EXPIRED' }
    | { outcome: 'ALREADY_REVOKED' }
    | { outcome: 'ALREADY_ACCEPTED' };

export const staffRepository = {
    createInvitation(input: {
        clinicId: string;
        email: string;
        tokenHash: string;
        invitedByUserId: string;
        expiresAt: Date;
        now: Date;
    }): Promise<CreateInvitationRepositoryResult> {
        return prisma.$transaction(async (tx) => {
            await acquireEmailMembershipLock(tx, input.email);
            await acquireClinicInvitationLock(tx, input.clinicId, input.email);

            const existingUser = await findUserByNormalizedEmail(tx, input.email);

            if (existingUser) {
                return { outcome: 'MEMBER_EXISTS', user: existingUser };
            }

            const pendingInvitation = await tx.staffInvitation.findFirst({
                where: {
                    clinicId: input.clinicId,
                    email: input.email,
                    status: StaffInvitationStatus.PENDING,
                    expiresAt: { gt: input.now },
                },
                select: { id: true },
            });

            if (pendingInvitation) {
                return { outcome: 'INVITATION_PENDING' };
            }

            const invitation = await createInvitationRecord(tx, input);

            return { outcome: 'CREATED', invitation };
        });
    },

    listClinicMembers(clinicId: string) {
        return prisma.user.findMany({
            where: {
                clinicId,
                role: { in: [UserRole.ADMIN, UserRole.STAFF] },
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
            orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
        });
    },

    listClinicInvitations(clinicId: string) {
        return prisma.staffInvitation.findMany({
            where: { clinicId },
            include: invitationInclude,
            orderBy: { createdAt: 'desc' },
        });
    },

    findInvitationByTokenHash(tokenHash: string) {
        return prisma.staffInvitation.findUnique({
            where: { tokenHash },
            include: {
                clinic: { select: { id: true, name: true } },
                acceptedBy: { select: { id: true, clerkUserId: true } },
            },
        });
    },

    acceptInvitation(input: {
        tokenHash: string;
        identity: TrustedClerkUserIdentity;
        normalizedEmail: string;
        now: Date;
    }): Promise<AcceptInvitationRepositoryResult> {
        return prisma.$transaction(async (tx) => {
            const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
                SELECT "id"
                FROM "staff_invitations"
                WHERE "tokenHash" = ${input.tokenHash}
                FOR UPDATE
            `;

            if (!lockedRows[0]) {
                return { outcome: 'NOT_FOUND' };
            }

            const invitation = await tx.staffInvitation.findUnique({
                where: { id: lockedRows[0].id },
                include: {
                    clinic: { select: { id: true, name: true } },
                    acceptedBy: { select: { id: true, clerkUserId: true } },
                },
            });

            if (!invitation) {
                return { outcome: 'NOT_FOUND' };
            }

            if (invitation.email !== input.normalizedEmail) {
                return { outcome: 'IDENTITY_MISMATCH' };
            }

            if (invitation.status === StaffInvitationStatus.REVOKED) {
                return { outcome: 'REVOKED' };
            }

            if (invitation.status === StaffInvitationStatus.ACCEPTED) {
                const acceptedBy = invitation.acceptedBy;

                if (!acceptedBy || acceptedBy.clerkUserId !== input.identity.clerkUserId) {
                    return { outcome: 'ALREADY_ACCEPTED_BY_ANOTHER_IDENTITY' };
                }

                const acceptedUser = await tx.user.findUnique({
                    where: { id: acceptedBy.id },
                    select: {
                        id: true,
                        clerkUserId: true,
                        fullName: true,
                        email: true,
                        role: true,
                        status: true,
                        clinicId: true,
                        createdAt: true,
                    },
                });

                if (!acceptedUser) {
                    return { outcome: 'IDENTITY_CONFLICT' };
                }

                return {
                    outcome: 'ALREADY_ACCEPTED',
                    user: acceptedUser,
                    clinic: invitation.clinic,
                };
            }

            if (invitation.expiresAt <= input.now) {
                return { outcome: 'EXPIRED' };
            }

            await acquireEmailMembershipLock(tx, input.normalizedEmail);

            const clerkUser = await tx.user.findUnique({
                where: { clerkUserId: input.identity.clerkUserId },
                select: {
                    id: true,
                    clerkUserId: true,
                    fullName: true,
                    email: true,
                    role: true,
                    status: true,
                    clinicId: true,
                    createdAt: true,
                },
            });
            const emailUser = await findUserByNormalizedEmail(tx, input.normalizedEmail);

            if (clerkUser && emailUser && clerkUser.id !== emailUser.id) {
                return { outcome: 'IDENTITY_CONFLICT' };
            }

            const existingUser = clerkUser ?? emailUser;
            let staffUser: ExistingUserRecord;

            if (existingUser) {
                if (
                    existingUser.clerkUserId !== input.identity.clerkUserId ||
                    existingUser.email.trim().toLowerCase() !== input.normalizedEmail
                ) {
                    return { outcome: 'IDENTITY_CONFLICT' };
                }

                if (existingUser.role !== UserRole.STAFF) {
                    return { outcome: 'ADMIN_CONFLICT' };
                }

                if (existingUser.clinicId !== invitation.clinicId) {
                    return { outcome: 'OTHER_CLINIC' };
                }

                if (existingUser.status === UserStatus.SUSPENDED) {
                    return { outcome: 'SUSPENDED' };
                }

                staffUser =
                    existingUser.status === UserStatus.INVITED
                        ? await tx.user.update({
                              where: { id: existingUser.id },
                              data: { status: UserStatus.ACTIVE },
                              select: {
                                  id: true,
                                  clerkUserId: true,
                                  fullName: true,
                                  email: true,
                                  role: true,
                                  status: true,
                                  clinicId: true,
                                  createdAt: true,
                              },
                          })
                        : existingUser;
            } else {
                staffUser = await tx.user.create({
                    data: {
                        clerkUserId: input.identity.clerkUserId,
                        fullName: input.identity.fullName,
                        email: input.normalizedEmail,
                        role: UserRole.STAFF,
                        status: UserStatus.ACTIVE,
                        clinicId: invitation.clinicId,
                    },
                    select: {
                        id: true,
                        clerkUserId: true,
                        fullName: true,
                        email: true,
                        role: true,
                        status: true,
                        clinicId: true,
                        createdAt: true,
                    },
                });
            }

            const claim = await tx.staffInvitation.updateMany({
                where: {
                    id: invitation.id,
                    status: StaffInvitationStatus.PENDING,
                    expiresAt: { gt: input.now },
                },
                data: {
                    status: StaffInvitationStatus.ACCEPTED,
                    acceptedAt: input.now,
                    acceptedByUserId: staffUser.id,
                },
            });

            if (claim.count !== 1) {
                throw new Error('Staff invitation claim lost after row lock');
            }

            return { outcome: 'ACCEPTED', user: staffUser, clinic: invitation.clinic };
        });
    },

    revokeInvitation(input: {
        clinicId: string;
        invitationId: string;
        now: Date;
    }): Promise<RevokeInvitationRepositoryResult> {
        return prisma.$transaction(async (tx) => {
            const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
                SELECT "id"
                FROM "staff_invitations"
                WHERE "id" = ${input.invitationId}::uuid
                  AND "clinicId" = ${input.clinicId}::uuid
                FOR UPDATE
            `;

            if (!lockedRows[0]) {
                return { outcome: 'NOT_FOUND' };
            }

            const invitation = await tx.staffInvitation.findUnique({
                where: { id: lockedRows[0].id },
                include: invitationInclude,
            });

            if (!invitation) {
                return { outcome: 'NOT_FOUND' };
            }

            if (invitation.status === StaffInvitationStatus.REVOKED) {
                return { outcome: 'ALREADY_REVOKED' };
            }

            if (invitation.status === StaffInvitationStatus.ACCEPTED) {
                return { outcome: 'ALREADY_ACCEPTED' };
            }

            if (invitation.expiresAt <= input.now) {
                return { outcome: 'EXPIRED' };
            }

            const transition = await tx.staffInvitation.updateMany({
                where: {
                    id: invitation.id,
                    clinicId: input.clinicId,
                    status: StaffInvitationStatus.PENDING,
                    expiresAt: { gt: input.now },
                },
                data: {
                    status: StaffInvitationStatus.REVOKED,
                    revokedAt: input.now,
                },
            });

            if (transition.count !== 1) {
                throw new Error('Staff invitation revoke claim lost after row lock');
            }

            return {
                outcome: 'REVOKED',
                invitation: {
                    ...invitation,
                    status: StaffInvitationStatus.REVOKED,
                    revokedAt: input.now,
                },
            };
        });
    },

    updateStaffStatus(input: { clinicId: string; userId: string; status: ManageableStaffStatus }) {
        return prisma.$transaction(async (tx) => {
            await tx.$queryRaw`
                SELECT "id"
                FROM "users"
                WHERE "id" = ${input.userId}::uuid
                  AND "clinicId" = ${input.clinicId}::uuid
                FOR UPDATE
            `;

            const user = await tx.user.findFirst({
                where: { id: input.userId, clinicId: input.clinicId },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                },
            });

            if (!user) {
                return { outcome: 'NOT_FOUND' as const };
            }

            if (user.role !== UserRole.STAFF) {
                return { outcome: 'STAFF_REQUIRED' as const };
            }

            const expectedStatus =
                input.status === UserStatus.SUSPENDED ? UserStatus.ACTIVE : UserStatus.SUSPENDED;

            if (user.status !== expectedStatus) {
                return { outcome: 'INVALID_TRANSITION' as const, user };
            }

            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: { status: input.status },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                },
            });

            return { outcome: 'UPDATED' as const, user: updatedUser };
        });
    },
};
