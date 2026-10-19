import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({
    nodeEnv: 'test',
    resendApiKey: 'test-secret',
    invitationFromEmail: 'Pravaah <invite@example.test>',
    clientUrl: 'https://pravaah.garvitsingh171.com',
}));
vi.mock('../../../config/env.js', () => ({ env: mockEnv }));

import { emailService } from '../email.service.js';
import { staffInvitationEmail } from '../staffInvitationTemplate.js';

describe('staff invitation email', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mockEnv.resendApiKey = 'test-secret';
        mockEnv.invitationFromEmail = 'Pravaah <invite@example.test>';
        mockEnv.nodeEnv = 'test';
    });

    it('escapes clinic and recipient text in HTML and supplies plain text', () => {
        const rendered = staffInvitationEmail({
            clinicName: '<Clinic & Co>',
            email: 'staff@example.com',
            expiresAt: new Date('2026-10-21T00:00:00Z'),
            inviteUrl: 'https://pravaah.example/invite/secure-token',
        });
        expect(rendered.html).toContain('&lt;Clinic &amp; Co&gt;');
        expect(rendered.html).not.toContain('<Clinic & Co>');
        expect(rendered.text).toContain('https://pravaah.example/invite/secure-token');
    });

    it('submits a branded HTML and text email and records the provider submission ID', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(
                new Response(JSON.stringify({ id: 'resend-message-id' }), { status: 200 })
            );
        vi.stubGlobal('fetch', fetchMock);
        const result = await emailService.sendStaffInvitation({
            invitationId: 'invite-id',
            email: 'staff@example.com',
            clinicName: 'Clinic A',
            expiresAt: new Date('2026-10-21T00:00:00Z'),
            inviteUrl: 'https://pravaah.example/invite/secure-token',
        });
        expect(result).toMatchObject({
            status: 'SUBMITTED',
            providerMessageId: 'resend-message-id',
        });
        const [, request] = fetchMock.mock.calls[0]!;
        const body = JSON.parse(request.body as string);
        expect(body.to).toEqual(['staff@example.com']);
        expect(body.subject).toContain('Clinic A');
        expect(body.html).toContain('Accept invitation');
        expect(body.text).toContain('secure-token');
        expect(request.headers['Idempotency-Key']).not.toContain('secure-token');
    });

    it('records provider rejection without exposing provider response details', async () => {
        const log = vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({ name: 'validation_error', message: 'Invalid sender' }),
                    {
                        status: 422,
                    }
                )
            )
        );
        await expect(
            emailService.sendStaffInvitation({
                invitationId: 'invite-id',
                email: 'staff@example.com',
                clinicName: 'Clinic A',
                expiresAt: new Date(),
                inviteUrl: 'https://pravaah.example/invite/secure-token',
            })
        ).resolves.toMatchObject({ status: 'FAILED' });
        expect(log).toHaveBeenCalledWith(expect.stringContaining('PROVIDER_REJECTED'));
        expect(log).not.toHaveBeenCalledWith(expect.stringContaining('invite/secure-token'));
    });

    it('fails safely when provider credentials are missing', async () => {
        mockEnv.resendApiKey = '';
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        await expect(
            emailService.sendStaffInvitation({
                invitationId: 'invite-id',
                email: 'staff@example.com',
                clinicName: 'Clinic A',
                expiresAt: new Date(),
                inviteUrl: 'https://pravaah.example/invite/secure-token',
            })
        ).resolves.toMatchObject({ status: 'FAILED' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        [401, 'INVALID_API_KEY'],
        [403, 'INVALID_API_KEY'],
        [429, 'RATE_LIMITED'],
        [500, 'PROVIDER_REJECTED'],
    ])('classifies Resend HTTP %s as %s', async (status, category) => {
        const log = vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValue(
                    new Response(JSON.stringify({ message: 'request rejected' }), { status })
                )
        );
        const result = await emailService.sendStaffInvitation({
            invitationId: 'invite-id',
            email: 'staff@example.com',
            clinicName: 'Clinic A',
            expiresAt: new Date(),
            inviteUrl: 'https://pravaah.example/invite/secure-token',
        });
        expect(result.status).toBe('FAILED');
        expect(log).toHaveBeenCalledWith(expect.stringContaining(`"category":"${category}"`));
    });

    it('records a 2xx response without an ID as failed instead of claiming submission', async () => {
        const log = vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
        await expect(
            emailService.sendStaffInvitation({
                invitationId: 'invite-id',
                email: 'staff@example.com',
                clinicName: 'Clinic A',
                expiresAt: new Date(),
                inviteUrl: 'https://pravaah.example/invite/secure-token',
            })
        ).resolves.toEqual({ status: 'FAILED', providerMessageId: null, submittedAt: null });
        expect(log).toHaveBeenCalledWith(expect.stringContaining('INVALID_PROVIDER_RESPONSE'));
    });

    it('records a provider timeout separately from an HTTP rejection', async () => {
        const log = vi.spyOn(console, 'info').mockImplementation(() => {});
        const timeout = new Error('timed out');
        timeout.name = 'TimeoutError';
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeout));
        await expect(
            emailService.sendStaffInvitation({
                invitationId: 'invite-id',
                email: 'staff@example.com',
                clinicName: 'Clinic A',
                expiresAt: new Date(),
                inviteUrl: 'https://pravaah.example/invite/secure-token',
            })
        ).resolves.toMatchObject({ status: 'FAILED' });
        expect(log).toHaveBeenCalledWith(expect.stringContaining('PROVIDER_TIMEOUT'));
    });

    it('records malformed 2xx JSON as an invalid provider response', async () => {
        const log = vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response('not-json', { status: 200 }))
        );
        await expect(
            emailService.sendStaffInvitation({
                invitationId: 'invite-id',
                email: 'staff@example.com',
                clinicName: 'Clinic A',
                expiresAt: new Date(),
                inviteUrl: 'https://pravaah.example/invite/secure-token',
            })
        ).resolves.toMatchObject({ status: 'FAILED' });
        expect(log).toHaveBeenCalledWith(expect.stringContaining('INVALID_PROVIDER_RESPONSE'));
    });

    it('rejects an incorrect production frontend origin before contacting Resend', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        mockEnv.nodeEnv = 'production';
        const result = await emailService.sendStaffInvitation({
            invitationId: 'invite-id',
            email: 'staff@example.com',
            clinicName: 'Clinic A',
            expiresAt: new Date(),
            inviteUrl: 'https://wrong.example/invite/secure-token',
        });
        expect(result.status).toBe('FAILED');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('records a missing sender address without contacting Resend', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        mockEnv.invitationFromEmail = '';
        const result = await emailService.sendStaffInvitation({
            invitationId: 'invite-id',
            email: 'staff@example.com',
            clinicName: 'Clinic A',
            expiresAt: new Date(),
            inviteUrl: 'https://pravaah.example/invite/secure-token',
        });
        expect(result.status).toBe('FAILED');
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
