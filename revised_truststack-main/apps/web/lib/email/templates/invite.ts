export interface InviteEmailInput {
  organizationName: string;
  roleName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: string;
}

/**
 * The app's navy (`--color-brand-navy` in globals.css) and its pale blue
 * (`--color-brand-blue-pale`), written as hex: an email cannot read CSS tokens
 * (Slice 10.5 B4, F4.9 — not the old indigo).
 */
export const EMAIL_NAVY = "#003366";
export const EMAIL_PALE = "#eff6ff";

/** What accepting asks of the person, in one line (F4.9). */
export const INVITE_WHAT_NEXT =
  "When you accept, you will be asked to choose a password; TrustStack then opens on the DPDP readiness work your role covers.";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Plain, text-first invitation. No images, no tracking pixels, no link
 * shorteners — the link is the credential and must be the real, visible URL.
 * Every interpolated value is escaped: organisation and inviter names are
 * user-controlled.
 */
export function renderInviteEmail(input: InviteEmailInput): { subject: string; html: string; text: string } {
  const expires = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(input.expiresAt));

  const subject = `You're invited to ${input.organizationName} on TrustStack DPDP Compass`;

  const text = [
    `${input.inviterName} has invited you to join ${input.organizationName} on TrustStack DPDP Compass as ${input.roleName}.`,
    "",
    INVITE_WHAT_NEXT,
    "",
    "Accept the invitation:",
    input.inviteUrl,
    "",
    `This link works once and expires on ${expires} IST.`,
    "If you were not expecting this invitation, ignore this email — no account is created unless you open the link.",
    "",
    "TrustStack DPDP Compass — DPDP readiness assessment. It does not certify compliance.",
  ].join("\n");

  const e = {
    org: escapeHtml(input.organizationName),
    role: escapeHtml(input.roleName),
    inviter: escapeHtml(input.inviterName),
    url: escapeHtml(input.inviteUrl),
    expires: escapeHtml(expires),
  };

  const html = `<!doctype html>
<html lang="en-IN">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px">
      <tr><td style="padding:28px">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:${EMAIL_NAVY}">TrustStack</p>
        <h1 style="margin:0 0 16px;font-size:20px">You're invited to ${e.org}</h1>
        <p style="margin:0 0 20px;line-height:1.5">${e.inviter} has invited you to join <strong>${e.org}</strong> on TrustStack DPDP Compass as <strong>${e.role}</strong>.</p>
        <p style="margin:0 0 20px;line-height:1.5">${escapeHtml(INVITE_WHAT_NEXT)}</p>
        <p style="margin:0 0 20px"><a href="${e.url}" style="display:inline-block;background:${EMAIL_NAVY};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">Accept invitation</a></p>
        <p style="margin:0 0 8px;font-size:13px;color:#475569">Or paste this link into your browser:</p>
        <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#475569">${e.url}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#475569">This link works once and expires on ${e.expires} IST.</p>
        <p style="margin:0;font-size:13px;color:#475569">If you were not expecting this invitation, ignore this email — no account is created unless you open the link.</p>
      </td></tr>
    </table>
    <p style="max-width:560px;margin:12px auto 0;font-size:11px;color:#94a3b8;text-align:center">TrustStack DPDP Compass — DPDP readiness assessment. It does not certify compliance.</p>
  </body>
</html>`;

  return { subject, html, text };
}
