import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { StaffInvitationStatus, UserRole, UserStatus } from '../../../generated/prisma/client.js';

const { sendStaffInvitation } = vi.hoisted(() => ({
    sendStaffInvitation: vi.fn(),
}));

vi.mock('../../../services/email/email.service.js', () => ({
    emailService: { sendStaffInvitation },
}));

const integrationEnabled = process.env.STAFF_INVITATION_NEON_INTEGRATION === '1';

const assertDevelopmentNeonTarget = () => {
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Set NODE_ENV=development before running the Neon integration test.');
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString)
        throw new Error('DATABASE_URL is required for the Neon integration test.');
    const host = new URL(connectionString).hostname.toLowerCase();
    const target = process.env.SEED_DATABASE_TARGET?.trim().toLowerCase();
    const allowlist = (process.env.SEED_DATABASE_ALLOWLIST ?? '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

    if (
        !host.endsWith('.neon.tech') ||
        !target ||
        /prod|production|staging|stage/i.test(target) ||
        target !== host ||
        !allowlist.includes(host)
    ) {
        throw new Error(
            'Refusing database integration test: DATABASE_URL must match the explicitly allowlisted development Neon host.'
        );
    }
};

describe('staff invitation creation with the Neon adapter', () => {
    it.skipIf(!integrationEnabled)(
        'acquires all advisory locks and reaches email submission on the development branch',
        async () => {
            assertDevelopmentNeonTarget();
            sendStaffInvitation.mockResolvedValue({
                status: 'SUBMITTED',
                providerMessageId: 'integration-provider-message',
                submittedAt: new Date(),
            });

            const [{ prisma }, { staffService }] = await Promise.all([
                import('../../../config/prisma.js'),
                import('../staff.service.js'),
            ]);
            const email = `staff-invitation-integration-${randomUUID()}@example.com`;
            let invitationId: string | undefined;

            try {
                const admin = await prisma.user.findFirst({
                    where: {
                        role: UserRole.ADMIN,
                        status: UserStatus.ACTIVE,
                        clinicId: { not: null },
                    },
                    select: {
                        id: true,
                        clerkUserId: true,
                        role: true,
                        status: true,
                        clinicId: true,
                    },
                });
                if (!admin?.clinicId) {
                    throw new Error(
                        'Development Neon branch needs an active Admin clinic fixture.'
                    );
                }

                const result = await staffService.createInvitation({
                    clinicId: admin.clinicId,
                    email,
                    invitedBy: admin,
                });
                invitationId = result.invitation.id;

                expect(result.invitation.status).toBe(StaffInvitationStatus.PENDING);
                expect(result.invitation.emailStatus).toBe('SUBMITTED');
                expect(sendStaffInvitation).toHaveBeenCalledOnce();
                expect(sendStaffInvitation).toHaveBeenCalledWith(
                    expect.objectContaining({ invitationId, email })
                );
            } finally {
                const created = invitationId
                    ? await prisma.staffInvitation.findUnique({ where: { id: invitationId } })
                    : await prisma.staffInvitation.findFirst({
                          where: { email },
                          select: { id: true },
                      });
                if (created) {
                    await prisma.lifecycleEvent.deleteMany({
                        where: { entityType: 'STAFF_INVITATION', entityId: created.id },
                    });
                    await prisma.staffInvitation.deleteMany({ where: { id: created.id } });
                }
                await prisma.$disconnect();
            }
        }
    );
});
