// M7 Vendor DPA — vendor-facing email. SERVER-ONLY (dynamic-imports resend).
// Mirrors sendOtpEmail in src/lib/dsr/otp.ts. Returns true on success, false if
// email isn't configured or the send failed (the caller decides how to surface).

export async function sendQuestionnaireEmail(
  to: string,
  opts: { vendorName: string; orgName: string; link: string; contactName?: string | null },
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const greeting = opts.contactName ? `Dear ${opts.contactName},` : 'Hello,'
    const { error } = await resend.emails.send({
      // anixai.io is verified in Resend; switch to truststack.in once verified.
      from: 'TrustStack™ <noreply@anixai.io>',
      to,
      subject: `${opts.orgName} — DPDP vendor data-protection questionnaire`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#003366">Data Protection Questionnaire</h2>
          <p>${greeting}</p>
          <p><strong>${opts.orgName}</strong> uses <strong>${opts.vendorName}</strong> as a data processor and is assessing
             vendor compliance under India's Digital Personal Data Protection Act, 2023 (DPDP).</p>
          <p>Please complete this short security &amp; privacy questionnaire. It takes about 10 minutes and helps us
             finalise the Data Processing Agreement between our organisations.</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${opts.link}" style="display:inline-block;padding:14px 28px;background:#003366;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
              Complete the Questionnaire
            </a>
          </div>
          <p style="color:#6B7280;font-size:13px">Or paste this link into your browser:<br />
             <span style="word-break:break-all">${opts.link}</span></p>
          <p style="color:#6B7280;font-size:13px">This secure link is unique to your organisation and expires in 30 days.</p>
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0" />
          <p style="color:#9CA3AF;font-size:12px">Sent via TrustStack™ — DPDP compliance for ${opts.orgName}.</p>
        </div>
      `,
    })
    if (error) {
      console.error('[Vendors] questionnaire email error:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('[Vendors] questionnaire email exception:', e)
    return false
  }
}
