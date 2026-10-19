import { env } from '../../config/env.js';
import { staffInvitationEmail } from './staffInvitationTemplate.js';

export type EmailSubmissionResult =
    | { status: 'SUBMITTED'; providerMessageId: string | null; submittedAt: Date }
    | { status: 'FAILED'; providerMessageId: null; submittedAt: null };

export const emailService = {
    async sendStaffInvitation(input: {
        invitationId: string;
        email: string;
        clinicName: string;
        expiresAt: Date;
        inviteUrl: string;
    }): Promise<EmailSubmissionResult> {
        if (!env.resendApiKey || !env.invitationFromEmail) {
            console.warn(
                `[email] event=staff_invitation_submission_failed invitationId=${input.invitationId} reason=configuration_missing`
            );
            return { status: 'FAILED', providerMessageId: null, submittedAt: null };
        }

        if (
            env.nodeEnv === 'production' &&
            new URL(input.inviteUrl).origin !== 'https://pravaah.garvitsingh171.com'
        ) {
            console.warn(
                `[email] event=staff_invitation_submission_failed invitationId=${input.invitationId} reason=production_frontend_url_invalid`
            );
            return { status: 'FAILED', providerMessageId: null, submittedAt: null };
        }

        const message = staffInvitationEmail(input);
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${env.resendApiKey}`,
                    'Content-Type': 'application/json',
                    'Idempotency-Key': `staff-invite-${input.invitationId}-${createHash('sha256').update(input.inviteUrl).digest('hex')}`,
                },
                body: JSON.stringify({
                    from: env.invitationFromEmail,
                    to: [input.email],
                    subject: message.subject,
                    html: message.html,
                    text: message.text,
                }),
                signal: AbortSignal.timeout(10_000),
            });
            if (!response.ok) {
                console.warn(
                    `[email] event=staff_invitation_submission_failed invitationId=${input.invitationId} providerStatus=${response.status}`
                );
                return { status: 'FAILED', providerMessageId: null, submittedAt: null };
            }
            const result = (await response.json()) as { id?: unknown };
            return {
                status: 'SUBMITTED',
                providerMessageId: typeof result.id === 'string' ? result.id : null,
                submittedAt: new Date(),
            };
        } catch {
            console.warn(
                `[email] event=staff_invitation_submission_failed invitationId=${input.invitationId} reason=provider_unavailable`
            );
            return { status: 'FAILED', providerMessageId: null, submittedAt: null };
        }
    },
};
import { createHash } from 'node:crypto';
