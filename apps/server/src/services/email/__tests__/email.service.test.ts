import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({
    nodeEnv: 'test',
    resendApiKey: 'test-secret',
    invitationFromEmail: 'Pravaah <invite@example.test>',
}));
vi.mock('../../../config/env.js', () => ({ env: mockEnv }));

import { emailService } from '../email.service.js';
import { staffInvitationEmail } from '../staffInvitationTemplate.js';

describe('staff invitation email', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mockEnv.resendApiKey = 'test-secret';
        mockEnv.invitationFromEmail = 'Pravaah <invite@example.test>';
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
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response('private provider detail', { status: 422 }))
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
});
