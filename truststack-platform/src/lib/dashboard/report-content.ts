// Board report content builders (no SDK import — client-safe).
// - buildBoardReportPrompt: the exact Claude prompt (Step 6) with facts substituted.
// - buildReportHtml: a self-contained HTML preview rendered on the reports page.

import type { BoardReportData } from '@/types/dpdp'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmtPeriod(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function trendLabel(trend: number | null): string {
  if (trend == null) return 'no prior assessment to compare'
  if (trend === 0) return 'unchanged'
  return `${trend > 0 ? '+' : ''}${trend} points`
}

// Step 6 — executive-summary prompt. Returns the user-message content; the route
// pairs it with a short system role and claude-sonnet-4-6.
export function buildBoardReportPrompt(report: BoardReportData, modulesCompleted: number): string {
  const c = report.compliance
  const scoreLabel =
    report.compass_score != null
      ? `${report.compass_score}/100 (Level ${report.maturity_level ?? '—'}: ${report.maturity_label ?? '—'})`
      : 'Not yet assessed (no completed Compass Assessment)'

  return `You are writing a concise executive summary for a company's DPDP (India's Data Protection Act 2023) compliance board report.

Company: ${report.org_name}
Report Period: ${fmtPeriod(report.period_from)} to ${fmtPeriod(report.period_to)}
Compass Score: ${scoreLabel}
Change since last period: ${trendLabel(report.score_trend)}

Key facts this period:
- Consent records: ${report.metrics.consent_this_period}
- Open complaints: ${report.metrics.complaints_open}
- Resolved complaints: ${report.metrics.complaints_resolved}
- Unresolved compliance gaps: ${report.metrics.gaps_total} (${report.metrics.gaps_p0} critical)
- Modules completed: ${modulesCompleted}/10

Compliance operations (rights, records, vendors, breaches):
- Data Subject Requests: ${c.dsr.pending} pending, ${c.dsr.overdue} overdue (past the 30-day DPDP limit), ${c.dsr.completed_last_30_days} completed in the last 30 days${c.dsr.overdue > 0 ? ' — OVERDUE DSRs are a statutory breach and need immediate attention' : ''}
- Records of Processing Activities: ${c.ropa.active_entries} active${c.ropa.last_review_date ? `, last DPO review ${fmtPeriod(c.ropa.last_review_date)}` : ' — not yet reviewed by the DPO'}
- Third-party vendors: ${c.vendors.total} tracked, ${c.vendors.overdue_assessments} with an expired or lapsed Data Processing Agreement
- Data breaches: ${c.breach.open_incidents} open incident(s), ${c.breach.past_dpbi_deadline} past the 72-hour DPBI notification deadline${c.breach.past_dpbi_deadline > 0 ? ' — CRITICAL: missed DPBI deadlines require immediate regulatory reporting to the Data Protection Board' : ''}

Write 3 sentences:
1. Current compliance status and score
2. Key achievements or concerns this period (call out any overdue DSRs or missed breach deadlines as the most urgent items if present)
3. Top priority recommendation for next period

Tone: Professional, clear, suitable for board members without DPDP expertise. Avoid jargon. Return only the three sentences as a single paragraph, with no preamble or headings.`
}

// Deterministic 3-sentence summary — used as the /generate fallback when the
// model call fails, and on the public shared report (which never calls Claude).
export function deterministicSummary(report: BoardReportData, modulesCompleted: number): string {
  const scoreText =
    report.compass_score != null
      ? `a Compass Score of ${report.compass_score}/100 (Level ${report.maturity_level}: ${report.maturity_label})`
      : 'no completed assessment yet'
  const c = report.compliance
  // Surface the single most urgent item first: a missed breach deadline outranks
  // an overdue rights request, which outranks an open critical gap.
  const recommendation =
    c.breach.past_dpbi_deadline > 0
      ? `Urgent: ${c.breach.past_dpbi_deadline} breach incident(s) have passed the 72-hour DPBI notification deadline and require immediate reporting to the Data Protection Board.`
      : c.dsr.overdue > 0
        ? `The top priority for next period is to resolve ${c.dsr.overdue} overdue Data Subject Request(s), which must be answered within 30 days under the DPDP Act.`
        : report.metrics.gaps_p0 > 0
          ? `The top priority for next period is to close the ${report.metrics.gaps_p0} critical (P0) gap(s) outstanding.`
          : 'No critical gaps or overdue actions remain; focus next period on maintaining controls and scheduling the next compliance review.'
  return (
    `${report.org_name} currently holds ${scoreText} with ${modulesCompleted} of 10 compliance modules in place. ` +
    `During this period the organization recorded ${report.metrics.consent_this_period} consent events and resolved ${report.metrics.complaints_resolved} complaint(s) (${report.metrics.complaints_open} open), and is managing ${c.dsr.pending} data-subject request(s), ${c.ropa.active_entries} active processing record(s), ${c.vendors.total} vendor(s), and ${c.breach.open_incidents} open breach incident(s). ` +
    recommendation
  )
}

// On-screen HTML preview (the PDF is rendered separately via @react-pdf).
export function buildReportHtml(report: BoardReportData): string {
  const period = `${fmtPeriod(report.period_from)} – ${fmtPeriod(report.period_to)}`
  const scoreBig =
    report.compass_score != null ? `${report.compass_score}<span style="font-size:18px;color:#6B7280">/100</span>` : '—'
  const trend =
    report.score_trend == null
      ? ''
      : `<span style="color:${report.score_trend >= 0 ? '#059669' : '#DC2626'};font-size:13px">${
          report.score_trend > 0 ? '▲ +' : report.score_trend < 0 ? '▼ ' : ''
        }${report.score_trend !== 0 ? Math.abs(report.score_trend) + ' pts vs last assessment' : 'No change'}</span>`

  const moduleRows = report.modules
    .map(
      m => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #EEF2F7;font-weight:600;color:#1A1A2E">${escapeHtml(m.module)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EEF2F7;color:#374151">${escapeHtml(m.status)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EEF2F7;color:#6B7280">${escapeHtml(m.metric)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EEF2F7;color:#6B7280">${escapeHtml(m.last_updated ?? '—')}</td>
      </tr>`
    )
    .join('')

  const gapList = (items: BoardReportData['actions_p0']) =>
    items.length
      ? items
          .map(
            g => `<li style="margin-bottom:8px">
              <span style="font-weight:600;color:#1A1A2E">${escapeHtml(g.title)}</span>
              <div style="color:#6B7280;font-size:13px">${escapeHtml(g.action)}${g.module ? ` <em style="color:#9CA3AF">→ ${escapeHtml(g.module)}</em>` : ''}</div>
            </li>`
          )
          .join('')
      : '<li style="color:#059669">None — all clear.</li>'

  const timelineList = (kind: 'completed' | 'upcoming') => {
    const items = report.timeline.filter(t => t.kind === kind)
    return items.length
      ? items
          .map(
            t =>
              `<li style="margin-bottom:6px;color:#374151">${escapeHtml(t.label)}${t.date ? ` <span style="color:#9CA3AF">— ${escapeHtml(t.date)}</span>` : ''}</li>`
          )
          .join('')
      : '<li style="color:#9CA3AF">—</li>'
  }

  const consentDelta = report.metrics.consent_this_period - report.metrics.consent_last_period

  // M5–M8 compliance coverage (P1.5 FIX3). Red sub-text flags statutory risks.
  const c = report.compliance
  const sub = (alert: boolean, text: string) =>
    `<div style="font-size:12px;color:${alert ? '#DC2626' : '#6B7280'}">${escapeHtml(text)}</div>`
  const coverageCard = (label: string, value: string, subHtml: string) =>
    `<div style="background:#fff;border:1px solid #EEF2F7;border-radius:10px;padding:14px">
      <div style="font-size:12px;color:#6B7280">${escapeHtml(label)}</div>
      <div style="font-size:24px;font-weight:700;color:#003366">${escapeHtml(value)}</div>
      ${subHtml}
    </div>`
  const coverageSection = `
  <h2 style="font-size:15px;color:#003366;border-left:3px solid #2874A6;padding-left:10px;margin:28px 0 12px">Compliance Coverage</h2>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
    ${coverageCard('Data Subject Requests', `${c.dsr.pending} pending`,
      sub(c.dsr.overdue > 0, c.dsr.overdue > 0 ? `⚠ ${c.dsr.overdue} overdue · ${c.dsr.completed_last_30_days} done in 30d` : `${c.dsr.completed_last_30_days} completed in last 30 days`))}
    ${coverageCard('Processing Activities (ROPA)', `${c.ropa.active_entries} active`,
      sub(!c.ropa.last_review_date, c.ropa.last_review_date ? `Last DPO review ${fmtPeriod(c.ropa.last_review_date)}` : 'Not yet reviewed by DPO'))}
    ${coverageCard('Third-Party Vendors', `${c.vendors.total} tracked`,
      sub(c.vendors.overdue_assessments > 0, c.vendors.overdue_assessments > 0 ? `⚠ ${c.vendors.overdue_assessments} with expired DPA` : 'All DPAs current'))}
    ${coverageCard('Data Breach Incidents', `${c.breach.open_incidents} open`,
      sub(c.breach.past_dpbi_deadline > 0, c.breach.past_dpbi_deadline > 0 ? `🔴 ${c.breach.past_dpbi_deadline} past 72-hr DPBI deadline` : 'None past 72-hr DPBI deadline'))}
  </div>`

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1A1A2E;max-width:760px;margin:0 auto">

  <div style="border-bottom:3px solid #003366;padding-bottom:16px;margin-bottom:24px">
    <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6B7280;font-weight:600">DPDP Compliance Status Summary</div>
    <h1 style="font-size:26px;color:#003366;margin:6px 0 2px">${escapeHtml(report.org_name)}</h1>
    <div style="color:#6B7280;font-size:13px">Report period: ${period}</div>
  </div>

  <div style="display:flex;gap:24px;align-items:center;margin-bottom:24px;background:#F4F8FC;border-radius:12px;padding:20px">
    <div style="text-align:center;min-width:140px">
      <div style="font-size:48px;font-weight:800;color:#003366;line-height:1">${scoreBig}</div>
      <div style="margin-top:6px">${trend}</div>
    </div>
    <div>
      <div style="font-size:13px;color:#6B7280">Maturity</div>
      <div style="font-size:18px;font-weight:700;color:#003366">${report.maturity_level ? `Level ${report.maturity_level}: ${escapeHtml(report.maturity_label ?? '')}` : 'Not yet assessed'}</div>
      <p style="margin-top:12px;font-size:14px;line-height:1.55;color:#374151">${escapeHtml(report.summary || 'Executive summary unavailable.')}</p>
    </div>
  </div>

  <h2 style="font-size:15px;color:#003366;border-left:3px solid #2874A6;padding-left:10px;margin:28px 0 12px">Module Completion Status</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead><tr style="text-align:left;color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
      <th style="padding:8px 10px">Module</th><th style="padding:8px 10px">Status</th><th style="padding:8px 10px">Key metric</th><th style="padding:8px 10px">Updated</th>
    </tr></thead>
    <tbody>${moduleRows}</tbody>
  </table>

  <h2 style="font-size:15px;color:#003366;border-left:3px solid #2874A6;padding-left:10px;margin:28px 0 12px">Key Metrics</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
    <div style="background:#fff;border:1px solid #EEF2F7;border-radius:10px;padding:14px">
      <div style="font-size:12px;color:#6B7280">Consent records (period)</div>
      <div style="font-size:24px;font-weight:700;color:#003366">${report.metrics.consent_this_period}</div>
      <div style="font-size:12px;color:${consentDelta >= 0 ? '#059669' : '#DC2626'}">${consentDelta >= 0 ? '+' : ''}${consentDelta} vs prior period</div>
    </div>
    <div style="background:#fff;border:1px solid #EEF2F7;border-radius:10px;padding:14px">
      <div style="font-size:12px;color:#6B7280">Complaints</div>
      <div style="font-size:24px;font-weight:700;color:#003366">${report.metrics.complaints_open} <span style="font-size:13px;color:#6B7280">open</span></div>
      <div style="font-size:12px;color:#6B7280">${report.metrics.complaints_resolved} resolved this period</div>
    </div>
    <div style="background:#fff;border:1px solid #EEF2F7;border-radius:10px;padding:14px">
      <div style="font-size:12px;color:#6B7280">Unresolved gaps</div>
      <div style="font-size:24px;font-weight:700;color:#003366">${report.metrics.gaps_total}</div>
      <div style="font-size:12px;color:#DC2626">${report.metrics.gaps_p0} critical (P0)</div>
    </div>
  </div>

  ${coverageSection}

  <h2 style="font-size:15px;color:#003366;border-left:3px solid #2874A6;padding-left:10px;margin:28px 0 12px">Top Priority Actions</h2>
  <div style="font-size:13px;font-weight:700;color:#DC2626;margin-bottom:6px">🔴 P0 — Must fix immediately</div>
  <ul style="margin:0 0 16px;padding-left:18px;font-size:14px">${gapList(report.actions_p0)}</ul>
  <div style="font-size:13px;font-weight:700;color:#D97706;margin-bottom:6px">🟡 P1 — Fix within 30 days</div>
  <ul style="margin:0;padding-left:18px;font-size:14px">${gapList(report.actions_p1)}</ul>

  <h2 style="font-size:15px;color:#003366;border-left:3px solid #2874A6;padding-left:10px;margin:28px 0 12px">Compliance Timeline</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:14px">
    <div><div style="font-weight:600;color:#059669;margin-bottom:6px">Completed this period</div><ul style="margin:0;padding-left:18px">${timelineList('completed')}</ul></div>
    <div><div style="font-weight:600;color:#2874A6;margin-bottom:6px">Upcoming</div><ul style="margin:0;padding-left:18px">${timelineList('upcoming')}</ul></div>
  </div>

  <div style="margin-top:28px;border-top:1px solid #EEF2F7;padding-top:12px;font-size:11px;color:#9CA3AF;text-align:center">
    Generated by TrustStack™ | ${fmtPeriod(report.generated_at)} | Confidential
  </div>
</div>`.trim()
}
