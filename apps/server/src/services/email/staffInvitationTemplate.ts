const escapeHtml = (value: string) =>
    value.replace(
        /[&<>"']/g,
        (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!
    );

export const staffInvitationEmail = (input: {
    clinicName: string;
    email: string;
    expiresAt: Date;
    inviteUrl: string;
}) => {
    const clinicName = escapeHtml(input.clinicName);
    const email = escapeHtml(input.email);
    const expiresAt = input.expiresAt.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
    });
    const safeUrl = escapeHtml(input.inviteUrl);
    return {
        subject: `You're invited to join ${input.clinicName} on Pravaah`,
        text: `You're invited to join ${input.clinicName} on Pravaah.\n\nYou were invited as a Staff member. Invited email: ${input.email}.\nInvitation expires: ${expiresAt} (India Standard Time).\n\nAccept invitation: ${input.inviteUrl}\n\nIf you were not expecting this invitation, you can ignore this email. This invitation is for your email address and can be used only once.\n\n— The Pravaah Team`,
        html: `<!doctype html><html><body style="margin:0;background:#f3f7fa;font-family:Arial,Helvetica,sans-serif;color:#13243a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="background:#10263f;padding:24px 32px;color:#fff;font-size:20px;font-weight:bold">Pravaah</td></tr><tr><td style="padding:32px"><h1 style="font-size:26px;line-height:1.25;margin:0 0 18px;color:#10263f">You're invited to join ${clinicName}.</h1><p style="font-size:16px;line-height:1.6;margin:0 0 22px">Hello,</p><p style="font-size:16px;line-height:1.6;margin:0 0 24px">You've been invited to join <strong>${clinicName}</strong> as a Staff member on Pravaah. Coordinate appointments, patient arrivals, live queues and everyday clinic operations with your team.</p><div style="background:#f3f7fa;border-radius:10px;padding:18px 20px;margin:0 0 26px"><p style="margin:0 0 10px"><strong>Clinic:</strong> ${clinicName}</p><p style="margin:0 0 10px"><strong>Role:</strong> Staff</p><p style="margin:0 0 10px"><strong>Invited email:</strong> ${email}</p><p style="margin:0"><strong>Expires:</strong> ${escapeHtml(expiresAt)} IST</p></div><p style="margin:0 0 26px"><a href="${safeUrl}" style="display:inline-block;background:#00a6a6;color:#fff;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:bold">Accept invitation</a></p><p style="font-size:13px;line-height:1.6;color:#536579">If the button does not work, use this secure link:<br><a href="${safeUrl}" style="color:#087f8c;word-break:break-all">${safeUrl}</a></p><p style="font-size:13px;line-height:1.6;color:#536579">If you were not expecting this invitation, you can ignore this email. This invitation is intended for your email address and can be used only once.</p><p style="font-size:14px;margin:24px 0 0">— The Pravaah Team</p></td></tr></table></td></tr></table></body></html>`,
    };
};
