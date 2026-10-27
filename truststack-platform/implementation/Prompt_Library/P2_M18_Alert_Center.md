# P2 — M18: Alert Center
## Centralized compliance alerts: overdue DSRs, breach deadlines, expiring vendors, regulatory updates

**Session:** P2 — M18  
**Phase:** P2 — Commercialization  
**Priority:** MEDIUM — proactive compliance monitoring; reduces manual checking  
**Estimated time:** 1 session (~2.5 hours)  
**Branch:** `feature/p2-m18-alert-center`  
**Tag after completion:** `v2.8.0`  
**Prerequisites:** M5 (DSR), M7 (Vendor), M8 (Breach) all live and SQL applied

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

A centralized alert system that monitors all compliance modules and surfaces time-sensitive issues before they become violations. Alerts appear in-app (bell icon in topbar) and optionally via email.

---

## Database Schema

```sql
CREATE TABLE compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                   -- See alert types below
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT,                     -- 'dsr_request' | 'vendor' | 'breach_incident' | 'consent_record'
  entity_id TEXT,                       -- UUID of the entity causing the alert
  action_url TEXT,                      -- Deep link to the relevant module
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  auto_resolve_after TIMESTAMPTZ,       -- Alert auto-resolves if entity status changes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_alerts" ON compliance_alerts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_admins_manage_alerts" ON compliance_alerts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'dpo')
    )
  );

-- Index for fast unread alert count:
CREATE INDEX ON compliance_alerts (organization_id, is_resolved, is_read, created_at DESC);
```

---

## Alert Types

| Type | Severity | Trigger | Auto-Resolve |
|---|---|---|---|
| `dsr_overdue` | CRITICAL | DSR past 30-day deadline | When DSR fulfilled/rejected |
| `dsr_approaching` | HIGH | DSR due in 5 days | When DSR fulfilled |
| `breach_72hr_approaching` | CRITICAL | Breach DPBI deadline within 12 hours | When DPBI notified |
| `breach_72hr_passed` | CRITICAL | Breach past 72-hr DPBI deadline | When DPBI notified |
| `vendor_assessment_overdue` | HIGH | Vendor assessment date passed | When assessment updated |
| `vendor_assessment_due_soon` | MEDIUM | Vendor assessment due in 7 days | When assessment updated |
| `consent_expiry_approaching` | MEDIUM | Consent config expiry within 30 days | When renewed |
| `subscription_trial_ending` | HIGH | Trial ends in 3 days | When plan activated |
| `subscription_past_due` | CRITICAL | Payment failed, subscription past due | When payment succeeds |
| `ropa_review_overdue` | LOW | ROPA entry not reviewed in 12 months | When reviewed |
| `dpdp_rules_update` | INFO | New DPDP Rules published (manual trigger) | When read |

---

## Alert Generator (Cron)

**Add to Vercel Cron (`vercel.json`):**
```json
{
  "path": "/api/alerts/generate",
  "schedule": "0 6 * * *"
}
```

Runs daily at 6 AM IST. Generates new alerts based on current data state.

```typescript
// src/app/api/alerts/generate/route.ts
// POST (called by Vercel Cron)
// Requires x-cron-secret header

// For each org:
// 1. Query overdue DSRs → create dsr_overdue alerts
// 2. Query DSRs due in 5 days → create dsr_approaching alerts
// 3. Query breaches past 72hr → create breach_72hr_passed alerts
// 4. Query vendor assessments overdue → create vendor_assessment_overdue alerts
// 5. Query subscriptions where trial_ends_at BETWEEN NOW() AND NOW()+3days → create subscription_trial_ending
// Skip creating alert if one already exists (check entity_id + type + is_resolved=false)
// Return: { orgs_checked, alerts_created }
```

---

## API Routes

### GET `/api/alerts`
**Auth:** Org member  
**Query:** `?unread_only=true&severity=critical,high&limit=20&offset=0`  
**Returns:** `{ alerts: Alert[], total_unread: number }`

### PATCH `/api/alerts/[id]/read`
**Auth:** Org member  
**Action:** Mark alert as read

### PATCH `/api/alerts/[id]/resolve`
**Auth:** Admin or DPO  
**Body:** `{ note?: string }`  
**Action:** Mark alert as resolved + set resolved_by + resolved_at

### POST `/api/alerts/mark-all-read`
**Auth:** Org member  
**Action:** Mark all alerts as read

---

## UI

### Notification Bell (Topbar)

Add to the main dashboard topbar (already has topbar from M9/M10):

```
[🔔 3]  ← Bell with unread count badge
```

Click → slide-out panel (or dropdown):

```
Recent Alerts                          [Mark all read]
─────────────────────────────────────────────────────
🔴 DSR Request #005 is overdue          [View →]
   Due Jun 20. Sarah's data deletion request past deadline.
   2 hours ago

🟠 2 Vendors need assessment renewal    [View →]
   TechVendor Inc. and DataCorp overdue since Jun 1.
   1 day ago

🟡 Trial ends in 3 days                 [Upgrade →]
   Starter trial expires Jun 29, 2026.
   Just now
```

### Full Alert Center: `/dashboard/alerts`

```
Alert Center                           [All / Unread / Critical]
─────────────────────────────────────────────────────────────────

Filter: [All Severities ▼]  [All Types ▼]  [Date range ▼]

🔴 CRITICAL  DSR #005 Overdue
   Sarah's data deletion request (DSR-2026-005) is 6 days overdue.
   The 30-day DPDP deadline was Jun 20, 2026.
   [View DSR]    [Mark Resolved]

🔴 CRITICAL  Breach #001 Past DPBI Deadline
   Breach BRN-2026-001 logged Jun 22. DPBI notification due Jun 25.
   Notification has NOT been sent. URGENT — regulatory action risk.
   [View Breach]   [Mark Resolved]

🟠 HIGH  Vendor Assessment Overdue: TechVendor Inc.
   Assessment due Jun 1, 2026. Now 25 days overdue.
   [View Vendor]   [Mark Resolved]
```

---

## Email Notifications (Critical Alerts Only)

For CRITICAL severity alerts: send email via Resend to the org's admin + DPO immediately when alert is created.

```typescript
// src/lib/alerts/email.ts
export async function sendCriticalAlertEmail(alert: ComplianceAlert, orgId: string) {
  if (alert.severity !== 'critical') return;
  
  const recipients = await getOrgAdminsAndDPOs(orgId);
  await resend.emails.send({
    from: 'alerts@truststack.in',
    to: recipients.map(r => r.email),
    subject: `🔴 [TrustStack™ Alert] ${alert.title}`,
    html: buildAlertEmail(alert),
  });
}
```

---

## Testing

1. Create a DSR request → set `deadline_at` to yesterday → run `/api/alerts/generate` manually
2. `dsr_overdue` alert created → appears in bell (unread count = 1)
3. Click bell → alert visible in dropdown
4. Click [View DSR] → navigates to DSR detail
5. Mark resolved → alert disappears from unread list
6. Create a breach with `dpbi_notification_due_at` = 2 hours ago → alert `breach_72hr_passed` created
7. Email sent to admin (check Resend dashboard)
8. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M18 Alert Center ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M18 section + new cron job in vercel.json
3. Update `tracker-data.json` — M18 status → "built"
4. Apply SQL: compliance_alerts table
5. Update vercel.json: add alert generation cron
6. Git commit + push + PR + merge + tag `v2.8.0`
