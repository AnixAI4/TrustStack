# SESSION PROMPT — P0 M9: Board Dashboard
## TrustStack™ Platform — Phase 0, Module 9

---

## STEP 1 — READ THESE FILES FIRST

```
implementation/MASTER_CONTEXT.md
implementation/progress.md
```

**This is the last P0 module to build.** M1, M2, M3, and M4 must all be complete.

---

## STEP 2 — PREREQUISITES

Verify all are complete:
- [ ] M1: `assessments`, `assessment_gaps` tables exist
- [ ] M2: `consent_configs`, `consent_records` tables exist
- [ ] M3: `privacy_notices`, `privacy_notice_versions` tables exist
- [ ] M4: `grievance_officers`, `grievance_complaints` tables exist
- [ ] Dashboard shell + sidebar exist

M9 creates NO new database tables. It reads from all existing tables.

---

## ⚠️ IMPLEMENTATION NOTES — read before building (synced after Sessions 2, 3 & 4)

**1. Dashboard is a PLAIN folder, not a route group.** Use `src/app/dashboard/overview/...` and `src/app/dashboard/reports/...` — NOT `src/app/(dashboard)/...`. A `(dashboard)` route group does not add a `/dashboard` URL segment, so pages would land at `/overview` / `/reports` and bypass the auth middleware that protects `/dashboard/*`. (This exact bug was caught in M2 and M3.)

**2. The overview page already exists — you are REPLACING it.** `src/app/dashboard/overview/page.tsx` was created as a placeholder in M1 (Compass Score + open gaps + module grid). M9 replaces it with the full Board Dashboard home. The sidebar already links `overview` → `/dashboard/overview` (`available: true`), so no sidebar change is needed for it. The new `reports` page has **no** sidebar entry yet — add one to `SIDEBAR_MODULES` in `src/lib/constants.ts`, or link to it from the overview header.

**3. Dev server runs on port 3011.** Docker occupies 3000 — start with `npm run dev -- --port 3011`. `NEXT_PUBLIC_APP_URL` is already `http://localhost:3011`. Do NOT run `next build` while `next dev` is running (they share `.next/` and the build corrupts the dev server's chunk manifest → "Cannot find module './XXXX.js'"). Stop dev first if you need a production build.

**4. AI model + SDK.** Use `claude-sonnet-4-6` via the existing `@anthropic-ai/sdk` setup, mirroring `src/app/api/chat/route.ts`: `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })`, then `anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens, system, messages })`, then check `response.content[0].type === 'text'`. The board-report narrative route (Step 6) follows this exact pattern.

**5. PDF library must be installed first.** M9 is the first module to use `@react-pdf/renderer` — run `npm install @react-pdf/renderer` (MASTER_CONTEXT lists it as "to be added"). Generate the PDF server-side in `/api/dashboard/report/pdf` and stream it back with `Content-Type: application/pdf`. (M3 used `window.print()` for a single notice; the board report is a structured multi-page document, so @react-pdf is the right tool here.)

**6. Reuse the existing Compass gauge.** An animated SVG gauge already exists at `src/components/modules/assessment/CompassScoreGauge.tsx` (0–100, color-coded, counts up on load). Reuse it; only create `src/components/modules/board/CompassScoreGauge.tsx` if you genuinely need a board-specific variant.

**7. Read REAL data from the existing schema + API routes — M9 creates no tables.** Authoritative sources:
- **Org:** `GET /api/organizations/me` → `{ id, name, slug, industry, … }`.
- **M1 Compass:** `assessments` (`compass_score`, `maturity_level`, `risk_tier`, `status = 'completed'`, `completed_at`, `created_at`) — order by `created_at` desc for the latest + the previous one for `score_trend`. Gaps: `assessment_gaps` (`priority` ∈ p0/p1/p2/p3, `resolved` boolean, `recommended_action`, `module_to_fix`). "Unresolved gaps" = `resolved = false`; "critical" = `priority = 'p0'`.
- **M2 Consent:** reuse `GET /api/consent/stats` → `{ total_this_month, consent_rate, withdrawals_this_month, by_channel }`. A `consent_configs` row (with `widget_version`) means consent is "active/configured".
- **M3 Notice:** reuse `GET /api/privacy-notice` → `{ available, notice, current_version, versions }`. Status: `notice.published` → 'published', else versions exist → 'draft', else 'not_created'. `days_until_renewal` = 365 − days since `current_version.published_at` (M3 flags > 12 months as stale).
- **M4 Grievance:** reuse `GET /api/grievance/officer` (active officer or null) and `GET /api/grievance/complaints` (`status` ∈ new/under_review = "open").
- Prefer building `/api/dashboard/overview` to aggregate these server-side in one call, querying tables directly with the **auth server client** (`@/lib/supabase/server`) scoped to the user's org via `organization_members` (same pattern as every other authed route).

**8. Layer 3 industry benchmarking is OPTIONAL right now.** Per MASTER_CONTEXT §12, only build "your score vs. the average [industry] company" once 20+ assessments exist — the query (`assessments` filtered by `organizations.industry`) is trivial but meaningless on thin data. Skip or stub it this session unless there's enough data.

---

## STEP 3 — NO NEW SQL NEEDED

M9 only reads from tables created in M1–M4. No new tables, no new RLS policies.

---

## STEP 4 — FILES TO CREATE

### Dashboard Overview Page (the main dashboard home)

**`src/app/dashboard/overview/page.tsx`** _(replaces the M1 placeholder overview — plain `dashboard/` folder, NOT a route group)_

This is what a user sees when they log in. It must communicate the full compliance picture at a glance.

**Layout (top to bottom):**

```
────────────────────────────────────────────────
 Good morning, [First Name] · [Org Name]                    [Date]
────────────────────────────────────────────────

 ┌─────────────────┐  ┌──────────────────────────────────────────────┐
 │ COMPASS SCORE   │  │ MODULE STATUS                                │
 │                 │  │  M1 Assessment    ✅ Completed — Score: 72   │
 │     72/100      │  │  M2 Consent       ✅ Active — 234 records    │
 │   ████████░░    │  │  M3 Privacy Notice ✅ Published — v2         │
 │  Level 4:Managed│  │  M4 Grievance     ✅ Officer: Ravi Sharma    │
 │                 │  │  M5 DSR           🔲 Coming Soon             │
 │  ↑ 8 pts from   │  │  M6 ROPA          🔲 Coming Soon             │
 │   last month    │  │  M7 Vendors       🔲 Coming Soon             │
 │                 │  │  M8 Breach        🔲 Coming Soon             │
 └─────────────────┘  └──────────────────────────────────────────────┘

 ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
 │  Consent │ │Open      │ │ Unresolved│ │  Days    │
 │ Records  │ │Complaints│ │   Gaps   │ │ to Renew │
 │   234    │ │    2     │ │    5     │ │  Notice  │
 │ this mo  │ │          │ │ (P0: 2)  │ │   89     │
 └──────────┘ └──────────┘ └──────────┘ └──────────┘

 ┌─────────────────────────────────────────────────────────┐
 │ TOP PRIORITY ACTIONS                                    │
 │ 🔴 P0  No DPA with vendor "Zoho CRM" — add DPA         │
 │ 🔴 P0  Parental consent not configured — 3 services     │
 │ 🟡 P1  ROPA not started — 12 processing activities      │
 │ 🟡 P1  Vendor assessment incomplete — 4 vendors pending │
 └─────────────────────────────────────────────────────────┘

 ┌────────────────────────────┐  ┌─────────────────────────┐
 │ RECENT ACTIVITY            │  │ COMPLIANCE CALENDAR     │
 │ 2h ago  New complaint #003 │  │ Today  Privacy notice   │
 │ 1d ago  Consent widget live│  │        review due       │
 │ 3d ago  Assessment complete│  │ +30d  Annual assessment │
 │ 5d ago  Grievance officer  │  │       recommended       │
 │         appointed          │  │ +89d  Privacy notice    │
 └────────────────────────────┘  │       renewal           │
                                 └─────────────────────────┘
```

**`src/app/dashboard/reports/page.tsx`** _(plain `dashboard/` folder, NOT a route group)_

Board-ready report generation page:
- "Generate Board Report" button
- Preview of what the report contains
- Date range selector (defaults to last 30 days)
- Download PDF button
- Share link button (generates a time-limited link for board members without login)

### API Routes

**`src/app/api/dashboard/overview/route.ts`**  
- `GET` (auth required)
- Returns all data needed for the overview page in a single call:

```typescript
interface OverviewResponse {
  compass_score: number | null
  maturity_level: number | null
  risk_tier: string | null
  score_trend: number | null  // change vs previous assessment
  last_assessment_date: string | null
  
  module_status: {
    m1_assessment: { status: 'complete' | 'in_progress' | 'not_started'; last_score?: number }
    m2_consent: { status: 'active' | 'configured' | 'not_configured'; records_this_month?: number }
    m3_notice: { status: 'published' | 'draft' | 'not_created'; version?: number; days_until_renewal?: number }
    m4_grievance: { status: 'officer_set' | 'no_officer'; officer_name?: string; open_complaints?: number }
  }
  
  stats: {
    consent_records_this_month: number
    open_complaints: number
    unresolved_gaps: number
    critical_gaps: number  // P0 gaps
    days_until_notice_renewal: number | null
  }
  
  top_actions: Array<{
    priority: 'p0' | 'p1' | 'p2'
    title: string
    description: string
    module: string
    action_url: string
  }>
  
  recent_activity: Array<{
    timestamp: string
    type: 'complaint' | 'consent_activated' | 'assessment' | 'notice_published' | 'officer_appointed'
    description: string
  }>
}
```

**`src/app/api/dashboard/compass-score/route.ts`**  
- `GET` (auth required)
- Returns current Compass Score + history (last 6 assessments for trend chart)

**`src/app/api/dashboard/report/generate/route.ts`**  
- `POST` (auth required)
- Body: `{ from_date: string, to_date: string }`
- Uses Claude API to generate board report narrative
- Returns: `{ report_html: string, generated_at: string }`

**`src/app/api/dashboard/report/pdf/route.ts`**  
- `POST` (auth required)
- Body: `{ report_html: string }`
- Generates PDF using `@react-pdf/renderer`
- Returns: PDF binary (Content-Type: application/pdf)

### Components

**`src/components/modules/board/CompassScoreGauge.tsx`**  
Animated circular gauge showing 0–100 score with color coding:
- 0–20: Red (Critical)
- 21–40: Orange (Developing)
- 41–60: Blue (Defined)
- 61–80: Green (Managed)
- 81–100: Purple (Optimized)

Uses SVG path for the arc — no canvas. Animates on page load (counts up from 0 to score).

**`src/components/modules/board/ModuleStatusGrid.tsx`**  
Grid showing all 10 modules with their status. Green = done, Yellow = partial, Gray = not started.

**`src/components/modules/board/PriorityActionsCard.tsx`**  
List of top priority actions with colored priority badges. Each action is clickable and navigates to the relevant module.

**`src/components/modules/board/StatsRow.tsx`**  
Row of 4 stat cards: Consent Records / Open Complaints / Unresolved Gaps / Days to Notice Renewal.

**`src/components/modules/board/RecentActivityFeed.tsx`**  
Timeline of recent compliance activity with icons and timestamps.

**`src/components/modules/board/ComplianceCalendar.tsx`**  
Simple list of upcoming compliance tasks/deadlines.

**`src/components/modules/board/BoardReportPDF.tsx`**  
React PDF component using `@react-pdf/renderer`. The PDF report should include:

```
Page 1: DPDP Compliance Status Summary
  - Organization name
  - Report period
  - Compass Score (large, with gauge)
  - Maturity level
  - Executive summary (3 sentences, AI-generated)

Page 2: Module Completion Status
  - Table: Module / Status / Key Metric / Last Updated

Page 3: Key Metrics
  - Consent Records (this period vs. last period)
  - Grievance Complaints (open / resolved)
  - Unresolved Compliance Gaps (by priority)

Page 4: Top Priority Actions
  - P0 gaps (must fix immediately)
  - P1 gaps (fix within 30 days)

Page 5: Compliance Timeline
  - Actions completed this period
  - Upcoming actions

Footer: "Generated by TrustStack™ | [Date] | Confidential"
```

---

## STEP 5 — COMPASS SCORE COMPUTATION IN OVERVIEW

The overview should compute the "effective" Compass Score — not just from M1 assessment, but adjusted upward as modules are completed:

```typescript
function computeEffectiveScore(
  assessmentScore: number,
  moduleStatus: ModuleStatus
): number {
  let bonus = 0
  
  // Award bonus points for completing each module (max 20 bonus points)
  if (moduleStatus.m2_consent.status === 'active') bonus += 5
  if (moduleStatus.m3_notice.status === 'published') bonus += 5
  if (moduleStatus.m4_grievance.status === 'officer_set') bonus += 5
  if (moduleStatus.m4_grievance.open_complaints === 0) bonus += 2
  // ... 
  
  return Math.min(100, assessmentScore + bonus)
}
```

This means completing modules actually raises the score — creates a feedback loop motivating users to complete the platform.

---

## STEP 6 — BOARD REPORT AI NARRATIVE (Claude)

When generating the board report, call Claude to write the executive summary:

```typescript
const BOARD_REPORT_PROMPT = `You are writing a concise executive summary for a company's DPDP (India's Data Protection Act 2023) compliance board report.

Company: {org_name}
Report Period: {from_date} to {to_date}
Compass Score: {score}/100 (Level {level}: {level_label})
Change since last period: {change} points

Key facts this period:
- Consent records: {consent_count}
- Open complaints: {open_complaints}
- Resolved complaints: {resolved_complaints}
- Unresolved compliance gaps: {gap_count} ({critical_count} critical)
- Modules completed: {completed_modules}/10

Write 3 sentences:
1. Current compliance status and score
2. Key achievements or concerns this period
3. Top priority recommendation for next period

Tone: Professional, clear, suitable for board members without DPDP expertise. Avoid jargon.`
```

---

## STEP 7 — EMPTY STATE (first-time user)

When a new user arrives with no data:

```
Compass Score: "—"  (with text: "Complete your assessment to get your score")

Module Status: All gray "Not Started"

Priority Actions: 
  🔴 Start your DPDP Compass Assessment → /dashboard/assessment
  🔴 Appoint a Grievance Officer → /dashboard/grievance
  🔴 Configure Consent Management → /dashboard/consent
  🔴 Create your Privacy Notice → /dashboard/privacy-notice

Show a "30-Day DPDP Compliance Plan" progress tracker:
  Day 1–3:  ☐ Complete Compass Assessment
  Day 4–7:  ☐ Review gaps and roadmap
  Day 8–14: ☐ Consent widget live + Privacy Notice published
  Day 15–21: ☐ Grievance Officer appointed
  Day 22–30: ☐ First compliance review
```

---

## STEP 8 — ACCEPTANCE CRITERIA

- [ ] `npm run type-check` passes
- [ ] `/dashboard/overview` loads in < 2 seconds
- [ ] Compass Score gauge animates on load
- [ ] Module status reflects actual data (complete M1 → M1 shows green)
- [ ] Priority actions show actual gaps from M1 assessment
- [ ] Recent activity shows real events from M1–M4
- [ ] Empty state shows 30-day plan for new users
- [ ] Board report PDF generates without errors
- [ ] PDF contains all 5 pages of content
- [ ] Board report AI narrative is coherent and professional
- [ ] Mobile-responsive (board members read on phones)
- [ ] Score trend shows comparison to previous assessment

---

## STEP 9 — UPDATE PROGRESS.MD WHEN DONE

After this session, ALL Phase 0 modules are complete. Update progress.md to mark all P0 modules as ✅ Complete and note the launch readiness state.
