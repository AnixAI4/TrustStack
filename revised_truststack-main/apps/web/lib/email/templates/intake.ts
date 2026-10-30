import {
  BOARD_COMPLAINT_TEXT,
  contactLine,
  INTAKE_LIMITS,
  RIGHTS_CEILING_DAYS,
  RIGHTS_KIND_LABEL,
  type PublicContact,
  type RightsKind,
} from "@truststack/core";
import { EMAIL_NAVY, EMAIL_PALE, escapeHtml } from "./invite";

/**
 * The two emails a Data Principal receives from a public form (Slice 10
 * Stage 3a): the one-time code, and the acknowledgement with the request's
 * code and its respond-by date. Both name the organisation's published
 * contact (Rule 9: "mention in every response"). Text-first, no images, no
 * tracking, every interpolated value escaped — names and contacts are typed
 * by people.
 */

interface Organisation {
  name: string;
  contact: PublicContact;
}

const FOOTER = "Sent by TrustStack DPDP Compass on behalf of the organisation named above.";

/** "2027-01-11" → "11 January 2027": a calendar date, so formatted as one (no time zone shift). */
export function formatIndianDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function layout(org: Organisation, title: string, bodyHtml: string): string {
  const contact = escapeHtml(contactLine(org.contact));
  return `<!doctype html>
<html lang="en-IN">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px">
      <tr><td style="padding:28px">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:${EMAIL_NAVY}">${escapeHtml(org.name)}</p>
        <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
        ${bodyHtml}
        <p style="margin:20px 0 0;font-size:13px;color:#475569">Questions about your personal data: ${contact}</p>
      </td></tr>
    </table>
    <p style="max-width:560px;margin:12px auto 0;font-size:11px;color:#94a3b8;text-align:center">${escapeHtml(FOOTER)}</p>
  </body>
</html>`;
}

export function renderIntakeCodeEmail(input: { organization: Organisation; code: string; kind: RightsKind }): {
  subject: string;
  html: string;
  text: string;
} {
  const what = input.kind === "grievance" ? "a grievance" : `a request (${RIGHTS_KIND_LABEL[input.kind]})`;
  const subject = `Your confirmation code for ${input.organization.name}: ${input.code}`;
  const minutes = INTAKE_LIMITS.codeMinutes;
  const text = [
    `Someone — we hope you — submitted ${what} to ${input.organization.name} using this email address.`,
    "",
    `Your confirmation code: ${input.code}`,
    "",
    `Enter it on the form within ${minutes} minutes. It works once.`,
    "If you did not submit anything, ignore this email: nothing is recorded unless the code is entered.",
    "",
    `Questions about your personal data: ${contactLine(input.organization.contact)}`,
    "",
    FOOTER,
  ].join("\n");
  const html = layout(
    input.organization,
    "Confirm your email address",
    `<p style="margin:0 0 16px;line-height:1.5">Someone — we hope you — submitted ${escapeHtml(what)} to <strong>${escapeHtml(input.organization.name)}</strong> using this email address.</p>
        <p style="margin:0 0 16px;text-align:center"><span style="display:inline-block;background:${EMAIL_PALE};border-radius:10px;padding:14px 24px;font-family:ui-monospace,Menlo,monospace;font-size:28px;font-weight:700;letter-spacing:6px">${escapeHtml(input.code)}</span></p>
        <p style="margin:0 0 8px;font-size:13px;color:#475569">Enter it on the form within ${minutes} minutes. It works once.</p>
        <p style="margin:0;font-size:13px;color:#475569">If you did not submit anything, ignore this email: nothing is recorded unless the code is entered.</p>`,
  );
  return { subject, html, text };
}

export function renderIntakeReceiptEmail(input: {
  organization: Organisation;
  requestCode: string;
  kind: RightsKind;
  receivedOn: string;
  respondBy: string;
}): { subject: string; html: string; text: string } {
  const what = input.kind === "grievance" ? "grievance" : `request (${RIGHTS_KIND_LABEL[input.kind]})`;
  const subject = `${input.organization.name} received your ${input.kind === "grievance" ? "grievance" : "request"} — ${input.requestCode}`;
  const received = formatIndianDate(input.receivedOn);
  const by = formatIndianDate(input.respondBy);
  const lines = [
    `${input.organization.name} has received your ${what}.`,
    "",
    `Reference: ${input.requestCode}`,
    `Received on: ${received}`,
    `To be answered by: ${by} — within ${RIGHTS_CEILING_DAYS} days of receipt (DPDP Rules, 2025, Rule 14(3)).`,
    "",
    "Quote the reference in any message about it. Before acting on a request about your personal data, the organisation may ask you to confirm your identity.",
    // A grievance's next step, in the published notice's own words (s.13(3); Slice 10.5 B5, F5.6).
    ...(input.kind === "grievance" ? ["", BOARD_COMPLAINT_TEXT] : []),
  ];
  const text = [...lines, "", `Questions about your personal data: ${contactLine(input.organization.contact)}`, "", FOOTER].join("\n");
  const html = layout(
    input.organization,
    `We received your ${input.kind === "grievance" ? "grievance" : "request"}`,
    `<p style="margin:0 0 16px;line-height:1.5">${escapeHtml(input.organization.name)} has received your ${escapeHtml(what)}.</p>
        <table role="presentation" style="margin:0 0 16px;font-size:14px;line-height:1.6">
          <tr><td style="padding-right:12px;color:#475569">Reference</td><td style="font-family:ui-monospace,Menlo,monospace;font-weight:700">${escapeHtml(input.requestCode)}</td></tr>
          <tr><td style="padding-right:12px;color:#475569">Received on</td><td>${escapeHtml(received)}</td></tr>
          <tr><td style="padding-right:12px;color:#475569">To be answered by</td><td>${escapeHtml(by)}</td></tr>
        </table>
        <p style="margin:0 0 8px;font-size:13px;color:#475569">Within ${RIGHTS_CEILING_DAYS} days of receipt (DPDP Rules, 2025, Rule 14(3)).</p>
        <p style="margin:0;font-size:13px;color:#475569">Quote the reference in any message about it. Before acting on a request about your personal data, the organisation may ask you to confirm your identity.</p>${
          input.kind === "grievance" ? `\n        <p data-board style="margin:8px 0 0;font-size:13px;color:#475569">${escapeHtml(BOARD_COMPLAINT_TEXT)}</p>` : ""
        }`,
  );
  return { subject, html, text };
}
