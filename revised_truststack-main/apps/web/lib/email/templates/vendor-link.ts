import { INTAKE_LIMITS, VENDOR_DECLARATION, VENDOR_LINK_LIMITS } from "@truststack/core";
import { EMAIL_NAVY, EMAIL_PALE, escapeHtml } from "./invite";

/**
 * The two emails a vendor's respondent receives (Slice 10 Stage 4b): the link
 * to the questionnaire, and the one-time code that confirms the address it
 * went to. Text-first, no images, no tracking, every interpolated value escaped
 * — names are typed by people. The respondent is not a Data Principal, so no
 * Rule 9 contact: the organisation that asked is named instead.
 */

const FOOTER = "Sent by TrustStack DPDP Compass on behalf of the organisation named above.";

/** An instant, as a date and time in India. */
function formatInstantIst(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso)) + " IST";
}

function layout(organization: string, title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en-IN">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px">
      <tr><td style="padding:28px">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:${EMAIL_NAVY}">${escapeHtml(organization)}</p>
        <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </td></tr>
    </table>
    <p style="max-width:560px;margin:12px auto 0;font-size:11px;color:#94a3b8;text-align:center">${escapeHtml(FOOTER)}</p>
  </body>
</html>`;
}

export function renderVendorLinkEmail(input: {
  organizationName: string;
  vendorName: string;
  respondentName: string;
  url: string;
  expiresAt: string;
}): { subject: string; html: string; text: string } {
  const subject = `${input.organizationName} asks you to complete a processor questionnaire`;
  const until = formatInstantIst(input.expiresAt);
  const text = [
    `Dear ${input.respondentName},`,
    "",
    `${input.organizationName} asks you to answer its processor questionnaire about ${input.vendorName} — the security and data-protection controls behind the service you provide to it.`,
    "",
    `Open the questionnaire: ${input.url}`,
    "",
    `The link works until ${until} (${VENDOR_LINK_LIMITS.linkDays} days). When you open it we email a one-time code to this address, to confirm it is you. You can save your answers and come back; when you submit, you sign a declaration: "${VENDOR_DECLARATION}"`,
    "",
    "The link is for you alone: do not forward it. If you were not expecting this email, ignore it.",
    "",
    FOOTER,
  ].join("\n");
  const html = layout(
    input.organizationName,
    "Please complete a processor questionnaire",
    `<p style="margin:0 0 16px;line-height:1.5">Dear ${escapeHtml(input.respondentName)},</p>
        <p style="margin:0 0 16px;line-height:1.5"><strong>${escapeHtml(input.organizationName)}</strong> asks you to answer its processor questionnaire about <strong>${escapeHtml(input.vendorName)}</strong> — the security and data-protection controls behind the service you provide to it.</p>
        <p style="margin:0 0 20px;text-align:center"><a href="${escapeHtml(input.url)}" style="display:inline-block;background:${EMAIL_NAVY};color:#ffffff;text-decoration:none;font-weight:600;border-radius:8px;padding:12px 22px">Open the questionnaire</a></p>
        <p style="margin:0 0 8px;font-size:13px;color:#475569">The link works until ${escapeHtml(until)}. When you open it we email a one-time code to this address, to confirm it is you. You can save your answers and come back; when you submit, you sign a declaration: “${escapeHtml(VENDOR_DECLARATION)}”</p>
        <p style="margin:0;font-size:13px;color:#475569">The link is for you alone: do not forward it. If you were not expecting this email, ignore it.</p>`,
  );
  return { subject, html, text };
}

export function renderVendorLinkCodeEmail(input: { organizationName: string; vendorName: string; code: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Your code for ${input.organizationName}'s questionnaire: ${input.code}`;
  const minutes = INTAKE_LIMITS.codeMinutes;
  const text = [
    `Someone — we hope you — opened ${input.organizationName}'s processor questionnaire about ${input.vendorName} and asked for a code.`,
    "",
    `Your code: ${input.code}`,
    "",
    `Enter it on the questionnaire within ${minutes} minutes. It works once.`,
    "If you did not ask for it, ignore this email: nobody can open the questionnaire without the code.",
    "",
    FOOTER,
  ].join("\n");
  const html = layout(
    input.organizationName,
    "Confirm it is you",
    `<p style="margin:0 0 16px;line-height:1.5">Someone — we hope you — opened <strong>${escapeHtml(input.organizationName)}</strong>'s processor questionnaire about ${escapeHtml(input.vendorName)} and asked for a code.</p>
        <p style="margin:0 0 16px;text-align:center"><span style="display:inline-block;background:${EMAIL_PALE};border-radius:10px;padding:14px 24px;font-family:ui-monospace,Menlo,monospace;font-size:28px;font-weight:700;letter-spacing:6px">${escapeHtml(input.code)}</span></p>
        <p style="margin:0 0 8px;font-size:13px;color:#475569">Enter it on the questionnaire within ${minutes} minutes. It works once.</p>
        <p style="margin:0;font-size:13px;color:#475569">If you did not ask for it, ignore this email: nobody can open the questionnaire without the code.</p>`,
  );
  return { subject, html, text };
}
