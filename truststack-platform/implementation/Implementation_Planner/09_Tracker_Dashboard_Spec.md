# TrustStack™ — DPDP Implementation Tracker Dashboard
## Internal-only. Real-time. Single source of truth.

**Version:** 1.0 — June 2026  
**Location:** Inside truststack-platform at `/dashboard/admin/tracker`  
**Access:** `admin` role only (gated by middleware)  
**Data Source:** `src/app/dashboard/admin/tracker/tracker-data.json` (updated at end of every session)

---

## Why Inside truststack-platform?

✅ Shares Supabase connection — can read live tables (assessments, breaches, consents) for real metrics  
✅ Reuses existing auth (admin role gate — no separate login)  
✅ Reuses Sidebar, Topbar, design system, Tailwind colors  
✅ Single Vercel deployment — no separate project  
✅ tracker-data.json is version-controlled alongside code (git history = automatic audit trail)  
✅ Zero new dependencies  

Migration path: When we want LIVE auto-updates (not end-of-session JSON), replace the JSON read with a Supabase `tracker_modules` table query — one-line change in the data-fetching function.

---

## Route Structure

```
src/app/dashboard/admin/
  tracker/
    page.tsx                     ← Main tracker page (server component)
    tracker-data.json            ← Source of truth (updated after every session)
    [moduleId]/
      page.tsx                   ← Feature detail modal/page

src/components/modules/tracker/
  TrackerOverview.tsx            ← Progress bars, phase summary, key metrics
  FeatureStatusBoard.tsx         ← Kanban-style feature grid
  FeatureDetailCard.tsx          ← Click-through detail (files, DB, routes, test status)
  RolloutTracker.tsx             ← Milestone progress + revenue target vs. actual
  SessionLog.tsx                 ← History of sessions (from tracker-data.json)
```

---

## tracker-data.json Structure

```json
{
  "meta": {
    "last_updated": "2026-06-26",
    "updated_by": "Session 10 — Implementation Planner",
    "platform_version": "1.1.0",
    "total_features": 35,
    "built": 11,
    "partial": 4,
    "not_started": 20
  },
  "phases": {
    "P0": { "label": "Foundation", "status": "complete", "features_total": 7, "features_done": 7 },
    "P1": { "label": "Compliance Depth", "status": "complete", "features_total": 4, "features_done": 4 },
    "P1_5": { "label": "Critical Fixes", "status": "not_started", "features_total": 4, "features_done": 0 },
    "P2": { "label": "Commercialization", "status": "not_started", "features_total": 9, "features_done": 0 },
    "P3": { "label": "Scale", "status": "not_started", "features_total": 6, "features_done": 0 },
    "P4": { "label": "Innovation", "status": "not_started", "features_total": 5, "features_done": 0 }
  },
  "modules": [
    {
      "id": "M10",
      "name": "TrustChat™",
      "phase": "P0",
      "status": "live",
      "description": "Claude-powered DPDP chatbot. 11-question health check. Contextual guidance.",
      "roles": ["All", "Public"],
      "session": "Pre-existing",
      "git_branch": "main",
      "git_tag": "v1.0.0",
      "prompt_file": "P0_M10_TrustChat_DONE.md",
      "db_tables": [],
      "api_routes": ["/api/chat", "/api/health-check"],
      "key_files": ["src/components/chatbot/TrustChat.tsx", "src/app/api/chat/route.ts"],
      "test_status": "passed",
      "known_issues": [],
      "notes": "Live. No DB tables. Claude sonnet-4-6."
    },
    {
      "id": "M1",
      "name": "DPDP Compass™ Assessment",
      "phase": "P0",
      "status": "live",
      "description": "45-question assessment, Compass Score 0-100, maturity levels 1-5, AI gap report.",
      "roles": ["Admin", "DPO"],
      "session": "Session 1",
      "git_branch": "main",
      "git_tag": "v1.1.0",
      "prompt_file": "P0_M1_Compass_Assessment.md",
      "db_tables": ["assessments", "assessment_answers", "assessment_gaps"],
      "api_routes": ["/api/assessment/start", "/api/assessment/save-answer", "/api/assessment/submit", "/api/assessment/results/[id]"],
      "key_files": ["src/lib/assessment-questions.ts", "src/lib/ai/compass-scorer.ts", "src/lib/ai/gap-generator.ts"],
      "test_status": "passed",
      "known_issues": [],
      "notes": "Industry Layer 1+2 complete (M1b). Layer 3 benchmarking deferred."
    }
  ],
  "rollout": {
    "milestone_1": {
      "label": "Controlled Beta",
      "status": "not_started",
      "target_customers": 12,
      "actual_customers": 0,
      "target_revenue_lakhs": 10,
      "actual_revenue_lakhs": 0,
      "target_date": "2026-09-30"
    },
    "milestone_2": {
      "label": "Public Launch",
      "status": "not_started",
      "target_customers": 75,
      "actual_customers": 0,
      "target_arr_lakhs": 60,
      "actual_arr_lakhs": 0,
      "target_date": "2026-12-31"
    },
    "milestone_3": {
      "label": "Scale + Enterprise",
      "status": "not_started",
      "target_customers": 500,
      "actual_customers": 0,
      "target_arr_crore": 2.5,
      "actual_arr_crore": 0,
      "target_date": "2027-06-30"
    }
  },
  "sessions": [
    {
      "session_number": 1,
      "date": "2026-06-XX",
      "module": "M1",
      "status": "complete",
      "tag": "v1.1.0",
      "notes": "Auth + Dashboard + Compass Assessment. 10/10 tests passing."
    }
  ],
  "pending_actions": [
    { "id": "sql-m6", "title": "Apply db/ropa.sql in Supabase", "priority": "BLOCKER", "phase": "P1.5" },
    { "id": "sql-m8", "title": "Apply db/breach_incidents.sql in Supabase", "priority": "BLOCKER", "phase": "P1.5" },
    { "id": "fix-m4-bug", "title": "Fix M4 global-unique reference bug", "priority": "BLOCKER", "phase": "P1.5" },
    { "id": "cron-m8", "title": "Set CRON_SECRET + Vercel Cron for M8 escalations", "priority": "HIGH", "phase": "P1.5" }
  ]
}
```

---

## Dashboard Pages & Components

### Main Page (`/dashboard/admin/tracker`)
**Sections:**
1. **Header bar** — Platform version, last updated, overall % complete
2. **Phase Progress** — 6 horizontal progress bars (P0 → P4), color-coded
3. **Feature Status Board** — Kanban grid grouped by phase. Each card shows: module name, phase badge, status pill (not started / in progress / built / SQL pending / QA'd / live)
4. **Pending Actions** — Red/orange alert cards for blockers and high-priority items
5. **Rollout Tracker** — 3 milestone cards with progress bars (customers, ARR)
6. **Recent Sessions** — Last 5 sessions with module, date, tag, status
7. **Key Metrics** (live from Supabase):
   - Total organizations in the platform
   - Total assessments completed
   - Total consent records
   - Total DSR requests
   - Total breach incidents logged

### Feature Detail Page (`/dashboard/admin/tracker/[moduleId]`)
**Shows:**
- Full description + phase + roles
- Status timeline (not started → in prompt → built → SQL applied → QA'd → live)
- Files created (key files list)
- DB tables (names + link to Supabase)
- API routes (list)
- Prompt file (name + link)
- Git branch / tag
- Test status
- Known issues
- Notes from session

---

## Update Process (End of Every Session)

At the end of every prompt session (as part of the Session Checklist):

```bash
# 1. Open tracker-data.json
# 2. Update the module entry:
#    - status: "not_started" → "built" (or "sql_pending" / "live")
#    - session, git_branch, git_tag, key_files, db_tables, api_routes, test_status, notes
# 3. Update phases[phaseId].features_done count
# 4. Update meta.last_updated, meta.built, meta.partial
# 5. Move completed pending_actions to resolved (or remove them)
# 6. Add entry to sessions[] array
# 7. Commit tracker-data.json alongside the feature code
```

**The tracker auto-reflects reality because it's committed with the same PR that delivers the feature.**

---

## Middleware Protection

```typescript
// src/middleware.ts — add to PROTECTED_PREFIXES
// /dashboard/admin/* is already protected (requires auth)
// Add role check in the page itself:

// src/app/dashboard/admin/tracker/page.tsx
// Check: org.role === 'admin' — if not, redirect to /dashboard/overview
```

---

## Future Enhancement: Live Supabase Mode

When ready to move from JSON to live DB:
1. Create `tracker_modules` table in Supabase
2. Replace `fs.readFileSync('tracker-data.json')` with `supabase.from('tracker_modules').select()`
3. All tracker writes go via an admin-only API route instead of file edits
4. Zero component changes needed (same data shape)
