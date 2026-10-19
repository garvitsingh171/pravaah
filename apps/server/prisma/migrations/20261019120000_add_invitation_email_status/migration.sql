CREATE TYPE "InvitationEmailStatus" AS ENUM ('NOT_SENT', 'SUBMITTED', 'FAILED');

ALTER TABLE "staff_invitations"
ADD COLUMN "emailStatus" "InvitationEmailStatus" NOT NULL DEFAULT 'NOT_SENT',
ADD COLUMN "emailSubmittedAt" TIMESTAMP(3),
ADD COLUMN "emailProviderMessageId" TEXT;
