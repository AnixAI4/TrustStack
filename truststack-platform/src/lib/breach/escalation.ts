// M8 Breach — escalation alert email. SERVER-ONLY (imports resend). Sent by
// POST /api/breach/escalations/run when an open, not-yet-DPBI-notified breach
// crosses an un-alerted "hours remaining" threshold (BREACH_ESCALATION_HOURS).
// Best-effort, mirroring the Resend dynamic-import pattern in src/lib/dsr/otp.ts.
// Returns true on success, false if email isn't configured or the send failed.
export async function sendBreachEscalationEmail(
  to: string,
  opts: {
    referenceNumber: string
    natureLabel: string
    hoursRemaining: number
    threshold: number
    overdue: boolean
    orgName: string
    incidentUrl: string
  },
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const headline = opts.overdue
      ? 'OVERDUE — 72-hour DPBI deadline has passed'
      : `~${opts.threshold}h left to notify the DPBI`
    const banner = opts.overdue ? '#DC2626' : opts.threshold <= 12 ? '#DC2626' : '#D97706'
    const timeLine = opts.overdue
      ? 'The statutory 72-hour DPBI notification window has <strong>PASSED</strong>. Notify the Data Protection Board of India immediately and record the notification in TrustStack.'
      : `Approximately <strong>${opts.hoursRemaining} hours</strong> remain to notify the Data Protection Board of India (DPBI) within the statutory 72-hour window (DPDP Act §8(6), Rule 7).`

    const { error } = await resend.emails.send({
      // anixai.io is verified in Resend; switch to truststack.in once verified.
      from: 'TrustStack™ <noreply@anixai.io>',
      to,
      subject: `[${opts.referenceNumber}] ${headline}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:${banner};color:#fff;border-radius:12px 12px 0 0;padding:16px 20px">
            <h2 style="margin:0;font-size:18px">⏱ Breach notification escalation</h2>
          </div>
          <div style="border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;padding:20px">
            <p>${timeLine}</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
              <tr><td style="padding:8px;font-weight:600;color:#6B7280;width:160px">Incident reference</td><td style="padding:8px;font-family:monospace;font-weight:700">${opts.referenceNumber}</td></tr>
              <tr style="background:#F9FAFB"><td style="padding:8px;font-weight:600;color:#6B7280">Nature</td><td style="padding:8px">${opts.natureLabel}</td></tr>
              <tr><td style="padding:8px;font-weight:600;color:#6B7280">Time remaining</td><td style="padding:8px">${opts.overdue ? 'Overdue' : `~${opts.hoursRemaining} hours`}</td></tr>
            </table>
            <a href="${opts.incidentUrl}" style="display:inline-block;padding:12px 24px;background:#003366;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:8px">
              Open Incident in TrustStack™
            </a>
            <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0" />
            <p style="color:#9CA3AF;font-size:12px">Sent via TrustStack™ — DPDP breach response for ${opts.orgName}. You are receiving this because you are the registered DPO / Grievance Officer.</p>
          </div>
        </div>
      `,
    })
    if (error) {
      console.error('[Breach] escalation email error:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('[Breach] escalation email exception:', e)
    return false
  }
}
