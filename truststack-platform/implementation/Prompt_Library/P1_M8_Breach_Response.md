# SESSION PROMPT — P1 M8: Breach Response
## TrustStack™ Platform — Phase 1, Module 8

---

## STEP 1 — READ THESE FILES FIRST

```
implementation/MASTER_CONTEXT.md
implementation/progress.md
```

---

## ⚠️ IMPLEMENTATION NOTES — read before building (synced after Session 8 / M6)

All Phase 0 modules + M5 (DSR) + M7 (Vendor DPA) + M6 (ROPA) are complete — see `progress.md`. M8 Breach is the **last** module. Structurally it's another CRUD + status + dashboard module (twin of M5 DSR / M7 Vendor / M6 ROPA) with: a per-org sequential reference (like M5), a Claude notification draft (like M7's DPA), a DERIVED 72-hour countdown (like M5's SLA / M7's expiry), and email escalations. **Reuse those modules heavily — M5 DSR is the closest twin (reference number + due-date countdown + status workflow + DPO email).**

**1. Dashboard pages go in the PLAIN `src/app/dashboard/breach/` folder — NOT a `(dashboard)` route group.** A route group adds no `/dashboard` URL segment, so pages land at `/breach` and bypass the auth middleware that protects `/dashboard/*`. This exact bug was caught in M2/M3/M5/M6/M7 — don't repeat it. Breach is an INTERNAL incident log (an org logs its own breaches) — there are **NO public routes**, so do NOT touch `src/middleware.ts` / `PUBLIC_API_ROUTES` (same as M6 ROPA).

**2. ⚠️ REFERENCE NUMBER IS UNIQUE PER ORG, NOT GLOBAL — the prompt's SQL has the M4/M5 bug.** The Step-3 SQL says `reference_number TEXT UNIQUE NOT NULL` — that global `UNIQUE` is WRONG and collides across orgs, because the generator counts per org (`BRH-YYYY-NNN` restarts at 001 for each org). **Drop the global `UNIQUE`; use a composite `create unique index breach_incidents_org_reference_uniq on public.breach_incidents (organization_id, reference_number)` instead** (exactly what `db/dsr_requests.sql` does). Generate the reference by counting that org's incidents for the year. This bit M4 (still latent) and was fixed during M5 testing — do it right the first time here.

**3. Reuse M5 / M7 / M6 — they are the closest twins.** A CRUD entity → list/filter/search → status workflow → DPO email mirrors all three. Mirror these files:
- Components: `src/components/modules/dsr/` — `DsrStatusBadge` → `BreachStatusBadge` (open/contained/resolved), `SlaIndicator` → `BreachCountdown`, `DsrRequestsTable` → `BreachTable` (the register), `DsrRequestDetail` → `BreachDetail`; the log-incident modal mirrors M6's `RopaEntryForm`.
- Auth API shape: `src/app/api/dsr/requests/route.ts` (GET list/filter/search/paginate + POST create), `.../requests/[id]/route.ts` (GET+PATCH), `.../dsr/stats/route.ts` → make `/api/breach`, `/api/breach/[id]`, `/api/breach/stats`.
- Dashboard pages: `src/app/dashboard/dsr/page.tsx` (home + stats + 30s refresh), `.../dsr/requests/page.tsx` (list/register), `.../dsr/requests/[id]/page.tsx` (detail) → make the `breach/` equivalents.

**4. The 72-hour countdown is DERIVED at read time — no cron.** Store `dpbi_notification_due_at = discovered_at + 72h` server-side on create. Compute "hours/minutes remaining" + urgency band in a CLIENT-SAFE lib `src/lib/breach/countdown.ts` (mirror `src/lib/dsr/sla.ts` + `src/lib/vendors/status.ts`): `DPBI_DEADLINE_HOURS = 72`, `dueAtFrom(discoveredAt)`, `hoursRemaining`, `minutesRemaining`, `isOverdue`, `urgencyLevel` (normal / warning / critical / overdue). The detail-page timer ticks client-side (a `setInterval` re-rendering the derived value) so it's accurate to the minute with no polling. Nothing flips status automatically.

**5. Email escalations (48h/24h/12h/6h/2h) need a SCHEDULER — be honest, there is none wired up.** The countdown itself is derived (note 4, no cron). The *alert emails* genuinely need an external trigger. Build it as an idempotent endpoint `POST /api/breach/escalations/run` gated by a shared secret header (a `CRON_SECRET` env var — there's no user session): it finds open, not-yet-DPBI-notified breaches whose remaining time has crossed an un-alerted threshold, emails the org's DPO/admin via Resend (reuse the dynamic-import pattern in `src/lib/dsr/otp.ts` / M4, `noreply@anixai.io`), and records which thresholds were sent so it never double-sends (store `escalations_sent TEXT[]` on the row). **Do NOT claim emails auto-send** — document that wiring a real scheduler (Vercel Cron via `vercel.json`, a GitHub Action, or Supabase `pg_cron` hitting the endpoint every ~15 min) is a deployment step, the same way the SQL is applied manually. `BREACH_ESCALATION_HOURS = [48,24,12,6,2]` lives in constants.

**6. DPBI notification draft → keep the prompt builder CLIENT-SAFE** (`src/lib/breach/notification.ts`, no SDK import) and the `@anthropic-ai/sdk` call in the route (`POST /api/breach/[id]/dpbi-draft`) — mirror `src/lib/vendors/dpa.ts` + `src/app/api/vendors/[id]/dpa/route.ts`. Model **`claude-sonnet-4-6`**. Use the exact DPBI prompt in this file (Section 8(6) / Rule 7). Output is a FORMAL LETTER in Markdown/plain text (NOT JSON — unlike M6's structured AI-assist). Pull the **"Contact person for DPBI follow-up" from the org's active M4 Grievance Officer** (`grievance_officers`, server-side — like M3 pulled officer details into the notice), never from the client. Persist the returned draft to `dpbi_notification_draft` (in the route or via PATCH) so it re-loads.

**7. "Mark as DPBI Notified" + status workflow — capture timestamps SERVER-SIDE.** `PATCH /api/breach/[id]` with a `mark_dpbi_notified` action sets `dpbi_notified=true` + `dpbi_notified_at=now()` server-side (mirror M6's server-side DPO-approval stamp); likewise `principals_notified` + `principals_notified_at`. Capture `logged_by` from `auth.getUser()` on create (never from the client). Validate the `open → contained → resolved` transitions in the PATCH handler and stamp `resolved_at` on resolve. **Recommended:** treat DPBI-notified as the BOOLEAN and keep the lifecycle `status` as `open|contained|resolved` — the schema's `'dpbi_notified'` status value overlaps the boolean, so don't double-encode it (drive the dashboard "DPBI notified" state from `dpbi_notified`).

**8. Constants → add to `src/lib/constants.ts`:** `BREACH_NATURE_TYPES` (the 6 natures with labels), `BREACH_STATUS_LABELS` (open/contained/resolved), `DPBI_DEADLINE_HOURS = 72`, `BREACH_ESCALATION_HOURS = [48,24,12,6,2]`. **Reuse `DATA_CATEGORIES`** (M3) for `data_categories_affected` — don't invent a new list. Flip the `breach` `SIDEBAR_MODULES` entry to `available: true` (the `AlertTriangle` icon is already registered in `Sidebar.tsx`).

**9. Types → add to `src/types/dpdp.ts`:** `BreachIncident` (the DB row), `BreachNature`, `BreachStatus`, `BreachStats`. Keep DB-row types here.

**10. Breach register + export (PDF/CSV optional, NO new deps).** The "Breach Register" is the chronological list page (core — the audit log). An auditor PDF/CSV export of the register is a nice-to-have; if you build it, reuse M6's pattern exactly: `@react-pdf/renderer` (already installed; `serverExternalPackages` set; `runtime='nodejs'`) for the PDF and a hand-rolled CSV (no xlsx lib). Keep `npm audit` at **0**.

**11. New table → save as `db/breach_incidents.sql` and run MANUALLY in the Supabase SQL Editor.** Idempotent style of `db/dsr_requests.sql` / `db/vendors.sql` (`create table if not exists`, `drop policy if exists` before each `create policy`). RLS = the standard org-members policy (querying `organization_members` from `breach_incidents` is fine — the recursion trap only applies to policies ON `organization_members`). Add the composite per-org reference index (note 2) + org-scoped indexes (org+status, org+created_at desc, org+dpbi_notification_due_at for countdown/escalation scans, org+dpbi_notified). If you add `escalations_sent TEXT[]` (note 5), include it here.

**12. Dev server runs on port 3011** (`npm run dev -- --port 3011`); Docker holds 3000. Do **NOT** run `next build` while `next dev` is running (shared `.next/` corrupts the dev manifest). Lint isn't configured — verify with `npm run type-check` + dev route checks (auth routes → 401, `/dashboard/breach` → 307→login, `escalations/run` without the secret → 401). Keep `npm audit` at **0**.

**13. The M9 board reads M1–M4 only — it will NOT auto-show M8.** Lighting up M8 (and the still-pending M5/M6/M7 tiles) on the board (`src/lib/dashboard/aggregate.ts` + `src/components/modules/board/ModuleStatusGrid.tsx`) is an optional follow-up, out of M8 scope.

**Stack baseline (end of Session 8):** Next `15.5.19`, React 19, `@anthropic-ai/sdk 0.36.3` (model `claude-sonnet-4-6`), `@react-pdf/renderer 4.5.1`, Resend `6.14.0`, `npm audit` = 0. M8 should add **no** new dependencies. New env var only if you build escalations: `CRON_SECRET` (gates the escalation-run endpoint).

---

## WHAT THIS MODULE BUILDS

Breach Response module — log personal data breaches, trigger 72-hour DPBI notification countdown, generate DPBI-format breach notification draft, track resolution.

This is TrustStack's most unique feature — **no competitor has built a 72-hour DPBI-specific breach workflow.**

---

## SUPABASE SQL

```sql
CREATE TABLE breach_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reference_number TEXT UNIQUE NOT NULL,   -- BRH-2026-001
  discovered_at TIMESTAMPTZ NOT NULL,      -- when org became aware
  occurred_at TIMESTAMPTZ,                 -- when breach actually happened (if known)
  nature TEXT NOT NULL,                    -- 'unauthorized_access' | 'accidental_disclosure' | 'ransomware' | 'data_loss' | 'insider_threat' | 'other'
  data_categories_affected TEXT[] NOT NULL,
  data_subjects_affected_approx INTEGER,   -- approximate number
  systems_involved TEXT[],
  discovery_method TEXT,
  containment_actions TEXT,
  
  -- 72-hour DPBI countdown
  dpbi_notification_due_at TIMESTAMPTZ NOT NULL,  -- discovered_at + 72 hours
  dpbi_notified BOOLEAN NOT NULL DEFAULT FALSE,
  dpbi_notified_at TIMESTAMPTZ,
  dpbi_notification_draft TEXT,            -- AI-generated notification text
  
  -- Data principal notification
  principals_notified BOOLEAN DEFAULT FALSE,
  principals_notified_at TIMESTAMPTZ,
  notification_method TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open',    -- 'open' | 'contained' | 'resolved' | 'dpbi_notified'
  root_cause TEXT,
  remediation_actions TEXT,
  resolved_at TIMESTAMPTZ,
  
  logged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE breach_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage breaches" ON breach_incidents FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
```

---

## KEY FEATURES

1. **Breach Log Form** — Log a new incident with all required DPDP Rule 7 fields
2. **72-Hour Countdown Timer** — Prominent countdown on breach detail page and dashboard
3. **DPBI Notification Draft** — Claude generates the notification in the format DPBI requires
4. **Escalation Alerts** — Email to DPO + admin every 12 hours until DPBI notified
5. **Data Principal Notification** — Template for notifying affected users (when DPBI requires it)
6. **Post-Mortem Template** — Root cause analysis form after resolution
7. **Breach Register** — Chronological log of all incidents for audit purposes

## 72-HOUR COUNTDOWN (critical feature)

```typescript
// When a breach is logged:
const dpbi_notification_due_at = new Date(discovered_at.getTime() + 72 * 60 * 60 * 1000)

// Dashboard shows:
// ⏱ 47 hours remaining to notify DPBI
// Send alerts at: 48h, 24h, 12h, 6h, 2h remaining
```

## DPBI NOTIFICATION PROMPT (Claude)

```
Generate a breach notification to the Data Protection Board of India (DPBI) under DPDP Act 2023, Section 8(6) and Rule 7.

Data Fiduciary: {org_name}
Breach discovered: {discovered_at}
Nature: {nature}
Data categories affected: {categories}
Approximate data principals affected: {count}
Systems involved: {systems}
Containment actions taken: {containment}

Include all fields required under DPDP Rules 2025 Rule 7:
1. Nature and extent of the breach
2. Timing (when discovered, when occurred if known)
3. Categories of personal data involved
4. Approximate number of data principals affected
5. Likely consequences of the breach
6. Measures taken/proposed to address the breach
7. Contact person for DPBI follow-up

Format: Formal letter to DPBI. Professional tone. Factual, no speculation.
```

## ACCEPTANCE CRITERIA

- [ ] Breach form logs all Rule 7 required fields
- [ ] 72-hour countdown timer accurate to the minute
- [ ] Countdown visible prominently on breach detail page
- [ ] Countdown visible on dashboard as alert when breach is open
- [ ] Claude generates DPBI notification draft in < 10 seconds
- [ ] Alert emails sent at 48h, 24h, 12h, 6h remaining (use Resend + scheduled checks)
- [ ] "Mark as DPBI Notified" button records timestamp
- [ ] Breach register shows all historical incidents
- [ ] Reference numbers sequential per year (BRH-2026-001)
