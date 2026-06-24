import type { UserRole, UserStatus } from '../../generated/prisma/client.js';

export type AuthenticatedUser = {
    id: string;
    clerkUserId: string;
    role: UserRole;
    status: UserStatus;
    clinicId: string | null;
};
