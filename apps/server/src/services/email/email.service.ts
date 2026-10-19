import { createHash } from 'node:crypto';
import { env } from '../../config/env.js';
import { staffInvitationEmail } from './staffInvitationTemplate.js';

export type EmailSubmissionResult =
    | { status: 'SUBMITTED'; providerMessageId: string; submittedAt: Date }
    | { status: 'FAILED'; providerMessageId: null; submittedAt: null };

type ProviderError = { code?: unknown; message?: unknown; name?: unknown; statusCode?: unknown };

const failedResult = (): EmailSubmissionResult => ({
    status: 'FAILED',
    providerMessageId: null,
    submittedAt: null,
});

const logEmailEvent = (
    event: string,
    input: { invitationId: string },
    details: Record<string, string | number | null>
) => {
    console.info(
        JSON.stringify({
            event,
            invitationId: input.invitationId,
            timestamp: new Date().toISOString(),
            ...details,
        })
    );
};

const readProviderError = async (response: Response): Promise<ProviderError> => {
    try {
        const body: unknown = await response.json();
        if (!body || typeof body !== 'object') return {};
        const data = body as Record<string, unknown>;
        const nested = data.error;
        return nested && typeof nested === 'object'
            ? (nested as ProviderError)
            : (data as ProviderError);
    } catch {
        return {};
    }
};

const safeProviderText = (value: unknown, email: string): string | null => {
    if (typeof value !== 'string') return null;
    return (
        value
            .replaceAll(email, '[recipient]')
            .replace(/https?:\/\/\S+/gi, '[url]')
            .replace(/\/invite\/[A-Za-z0-9_-]+/gi, '/invite/[token]')
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim()
            .slice(0, 240) || null
    );
};

const safeProviderCode = (value: unknown): string | null =>
    typeof value === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/.test(value) ? value : null;

const categorizeProviderFailure = (status: number, code: unknown, message: unknown) => {
    const normalized = `${String(code ?? '')} ${String(message ?? '')}`.toLowerCase();
    if (status === 401 || status === 403) return 'INVALID_API_KEY';
    if (status === 429) return 'RATE_LIMITED';
    if (/domain|sender|from/.test(normalized) && /verify|verified|not allowed/.test(normalized))
        return 'UNVERIFIED_SENDER';
    if (/recipient|email.*invalid|invalid.*email/.test(normalized)) return 'INVALID_RECIPIENT';
    return 'PROVIDER_REJECTED';
};

export const emailService = {
    async sendStaffInvitation(input: {
        invitationId: string;
        email: string;
        clinicName: string;
        expiresAt: Date;
        inviteUrl: string;
    }): Promise<EmailSubmissionResult> {
        if (!env.resendApiKey) {
            logEmailEvent('staff.invitation.email.failed', input, {
                category: 'MISSING_API_KEY',
                providerStatus: null,
                providerErrorCode: null,
                diagnostic: 'Resend API key is not configured',
            });
            return failedResult();
        }
        if (!env.invitationFromEmail) {
            logEmailEvent('staff.invitation.email.failed', input, {
                category: 'MISSING_SENDER',
                providerStatus: null,
                providerErrorCode: null,
                diagnostic: 'Invitation sender address is not configured',
            });
            return failedResult();
        }

        let inviteUrl: URL;
        try {
            inviteUrl = new URL(input.inviteUrl);
        } catch {
            logEmailEvent('staff.invitation.email.failed', input, {
                category: 'INVALID_INVITATION_URL',
                providerStatus: null,
                providerErrorCode: null,
                diagnostic: 'Invitation URL is invalid',
            });
            return failedResult();
        }
        if (
            env.nodeEnv === 'production' &&
            inviteUrl.origin !== 'https://pravaah.garvitsingh171.com'
        ) {
            logEmailEvent('staff.invitation.email.failed', input, {
                category: 'INVALID_PRODUCTION_ORIGIN',
                providerStatus: null,
                providerErrorCode: null,
                diagnostic: 'Invitation URL origin does not match production frontend',
            });
            return failedResult();
        }

        const message = staffInvitationEmail(input);
        logEmailEvent('staff.invitation.email.submission_started', input, {});
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
                const providerError = await readProviderError(response);
                const category = categorizeProviderFailure(
                    response.status,
                    providerError.code,
                    providerError.message
                );
                logEmailEvent('staff.invitation.email.failed', input, {
                    category,
                    providerStatus: response.status,
                    providerErrorCode: safeProviderCode(providerError.code),
                    diagnostic: safeProviderText(providerError.message, input.email) ?? category,
                });
                return failedResult();
            }

            let result: unknown;
            try {
                result = await response.json();
            } catch {
                logEmailEvent('staff.invitation.email.failed', input, {
                    category: 'INVALID_PROVIDER_RESPONSE',
                    providerStatus: response.status,
                    providerErrorCode: null,
                    diagnostic: 'Resend response was not valid JSON',
                });
                return failedResult();
            }
            const providerMessageId =
                result && typeof result === 'object' && 'id' in result
                    ? (result as { id?: unknown }).id
                    : undefined;
            if (typeof providerMessageId !== 'string' || providerMessageId.length === 0) {
                logEmailEvent('staff.invitation.email.failed', input, {
                    category: 'INVALID_PROVIDER_RESPONSE',
                    providerStatus: response.status,
                    providerErrorCode: null,
                    diagnostic: 'Resend response did not include a message ID',
                });
                return failedResult();
            }
            const submittedAt = new Date();
            logEmailEvent('staff.invitation.email.submitted', input, {
                providerStatus: response.status,
            });
            return { status: 'SUBMITTED', providerMessageId, submittedAt };
        } catch (error) {
            const timedOut = error instanceof Error && error.name === 'TimeoutError';
            logEmailEvent('staff.invitation.email.failed', input, {
                category: timedOut ? 'PROVIDER_TIMEOUT' : 'NETWORK_FAILURE',
                providerStatus: null,
                providerErrorCode: null,
                diagnostic: timedOut
                    ? 'Resend request timed out after 10000ms'
                    : 'Resend request could not be completed',
            });
            return failedResult();
        }
    },
};
