# P2 — Tracker Dashboard: Implementation Status Tracker
## Internal admin dashboard — /dashboard/admin/tracker

**Session:** P2 — Tracker Dashboard  
**Phase:** P2 — Commercialization  
**Priority:** HIGH — provides single source of truth for all 35 modules + rollout progress  
**Estimated time:** 1 session (~2.5 hours)  
**Branch:** `feature/p2-tracker-dashboard`  
**Tag after completion:** `v2.10.0`  
**Prerequisites:** M11–M19 complete; tracker-data.json created with all 35 modules

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md` + `implementation/Implementation_Planner/09_Tracker_Dashboard_Spec.md` (full spec is defined there — this prompt is the execution brief)

---

## What to Build

An internal admin-only dashboard at `/dashboard/admin/tracker` that shows:
1. Progress across all 35 modules (P0 → P4)
2. Rollout milestones (Controlled Beta / Public Launch / Scale + Enterprise)
3. Pending blockers and actions
4. Session history
5. Live metrics from Supabase (real org/consent/DSR counts)

This dashboard reads from `src/app/dashboard/admin/tracker/tracker-data.json` — a version-controlled JSON file updated at the end of every implementation session.

---

## Step 1: Create tracker-data.json

**File:** `src/app/dashboard/admin/tracker/tracker-data.json`

Populate with ALL 35 modules. Use the structure from `09_Tracker_Dashboard_Spec.md`. Key rules:
- M1–M10: status = "live" (P0 and P1 complete)
- FIX1–FIX4: status = "live" (P1.5 complete)
- M11–M19 (P2): status depends on what's been built so far in P2
- M20–M25 (P3): status = "not_started"
- M26–M30 (P4): status = "not_started"

Start with the two example modules from the spec (M10 and M1), then add all remaining modules following the same shape.

---

## Step 2: Route Structure

```
src/app/dashboard/admin/
  tracker/
    page.tsx                        ← Main tracker page (Server Component)
    [moduleId]/
      page.tsx                      ← Module detail page

src/components/modules/tracker/
  TrackerOverview.tsx               ← Phase progress bars + summary metrics
  FeatureStatusBoard.tsx            ← Kanban grid (phase columns, module cards)
  FeatureDetailCard.tsx             ← Used in [moduleId] page
  RolloutTracker.tsx                ← Milestone progress
  SessionLog.tsx                    ← Last 10 sessions from tracker-data.json
  PendingActionsPanel.tsx           ← Red/orange blocker cards
```

---

## Step 3: Main Page (`/dashboard/admin/tracker`)

### Admin Guard

```typescript
// src/app/dashboard/admin/tracker/page.tsx
import { requireOrgAdmin } from '@/lib/auth/require';

export default async function TrackerPage() {
  const { org } = await requireOrgAdmin(); // Throws 403 if not admin role
  
  const trackerData = await import('./tracker-data.json');
  const liveMetrics = await getLiveMetrics(); // Query Supabase
  
  return (
    <div>
      <TrackerOverview data={trackerData} liveMetrics={liveMetrics} />
      <PendingActionsPanel actions={trackerData.pending_actions} />
      <FeatureStatusBoard phases={trackerData.phases} modules={trackerData.modules} />
      <RolloutTracker rollout={trackerData.rollout} />
      <SessionLog sessions={trackerData.sessions} />
    </div>
  );
}
```

### Live Metrics (from Supabase)

```typescript
// src/lib/tracker/live-metrics.ts
export async function getLiveMetrics() {
  const [orgs, assessments, consentRecords, dsrRequests, breachIncidents] = await Promise.all([
    adminSupabase.from('organizations').select('id', { count: 'exact', head: true }),
    adminSupabase.from('assessments').select('id', { count: 'exact', head: true }).eq('status', 'complete'),
    adminSupabase.from('consent_records').select('id', { count: 'exact', head: true }),
    adminSupabase.from('dsr_requests').select('id', { count: 'exact', head: true }),
    adminSupabase.from('breach_incidents').select('id', { count: 'exact', head: true }),
  ]);
  
  return {
    totalOrganizations: orgs.count ?? 0,
    totalAssessments: assessments.count ?? 0,
    totalConsentRecords: consentRecords.count ?? 0,
    totalDsrRequests: dsrRequests.count ?? 0,
    totalBreachIncidents: breachIncidents.count ?? 0,
  };
}
```

---

## Step 4: Component Details

### TrackerOverview

```
TrustStack™ Implementation Tracker
Last updated: Jun 26, 2026 — Session 10    Platform v1.5.4
─────────────────────────────────────────────────────────────

Progress: 15/35 modules built (42.8%)   [████████░░░░░░░░░░░░]

P0 Foundation    ████████████████████  7/7   100%  COMPLETE
P1 Compliance    ████████████████████  4/4   100%  COMPLETE
P1.5 Fixes       ████████████████████  4/4   100%  COMPLETE
P2 Commerce      ████████░░░░░░░░░░░░  4/10   40%  IN PROGRESS
P3 Scale         ░░░░░░░░░░░░░░░░░░░░  0/6     0%  NOT STARTED
P4 Innovation    ░░░░░░░░░░░░░░░░░░░░  0/5     0%  NOT STARTED

─────────────────────────────────────────────────────────────
Live Platform Metrics (all organizations):
  Organizations: 3  |  Assessments: 8  |  Consent Records: 1,247
  DSR Requests: 12  |  Breach Incidents: 1
```

### FeatureStatusBoard

Grid layout — one column per phase, module cards as rows:

```
P0  COMPLETE    P1  COMPLETE    P1.5  DONE    P2  IN PROGRESS   P3  —    P4  —
─────────────  ─────────────  ──────────────  ──────────────   ─────   ──────
✅ M10 TrustChat  ✅ M5 DSR      ✅ FIX1        ✅ M11 Team
✅ M1 Compass     ✅ M6 ROPA     ✅ FIX2        ✅ M12 Billing
✅ M1b Industry   ✅ M7 Vendor   ✅ FIX3        ✅ M13 PAYG
✅ M2 Consent     ✅ M8 Breach   ✅ FIX4        ✅ M14 Onboard
✅ M3 Notice                                   🔲 M15 WhatsApp
✅ M4 Grievance                                🔲 M16 Aadhaar
✅ M9 Board                                    🔲 M17 Trust
                                               🔲 M18 Alerts
                                               🔲 M19 ReConsent
                                               🔲 Tracker (this)
```

Status colors:
- ✅ Green = "live"
- 🟡 Yellow = "sql_pending" or "partial"
- 🔵 Blue = "built" (code done, not in prod)
- 🔲 Gray = "not_started"
- 🔴 Red = known issue

### RolloutTracker

```
Rollout Milestones
─────────────────────────────────────────────────────────────
Milestone 1: Controlled Beta (Sep 30, 2026)
Customers:  0 / 12    [░░░░░░░░░░]
Revenue:    ₹0 / ₹10L [░░░░░░░░░░]
Status: Not started

Milestone 2: Public Launch (Dec 31, 2026)
Customers:  0 / 75    [░░░░░░░░░░]
ARR:        ₹0 / ₹60L [░░░░░░░░░░]
Status: Not started

Milestone 3: Scale + Enterprise (Jun 30, 2027)
Customers:  0 / 500   [░░░░░░░░░░]
ARR:        ₹0 / ₹2.5Cr [░░░░░░░░░░]
Status: Not started
```

---

## Step 5: Module Detail Page (`/dashboard/admin/tracker/[moduleId]`)

```typescript
// src/app/dashboard/admin/tracker/[moduleId]/page.tsx
export default async function ModuleDetailPage({ params }: { params: { moduleId: string } }) {
  await requireOrgAdmin();
  const trackerData = await import('../tracker-data.json');
  const module = trackerData.modules.find(m => m.id === params.moduleId);
  if (!module) notFound();
  return <FeatureDetailCard module={module} />;
}
```

**Shows:**
- All tracker-data.json fields for the module (status, session, git_branch, git_tag, etc.)
- Files created (key_files list)
- DB tables
- API routes
- Test status
- Known issues
- Notes

---

## Step 6: Add to Sidebar Navigation

In the admin sidebar (check MASTER_CONTEXT.md for sidebar component location):

```
[Admin section — visible to role='admin' only]
Implementation Tracker  ← add this link
```

---

## Step 7: Session End — Update tracker-data.json

After this session completes, update tracker-data.json:
- Add this tracker dashboard as `{ "id": "TRACKER", "phase": "P2", "status": "live", ... }`
- Update `meta.last_updated` and `meta.built` count
- Update `phases.P2.features_done`
- Add session to `sessions[]`

---

## Testing

1. `/dashboard/admin/tracker` → loads (admin user)
2. Progress bars reflect correct percentages
3. Live metrics show real counts from Supabase
4. Module cards show correct status colors
5. Click a module card → detail page loads correctly
6. DPO user → `/dashboard/admin/tracker` → 403 (admin only)
7. `npm run type-check` → 0 errors
8. `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — Tracker Dashboard ✅ Complete
2. Update `MASTER_CONTEXT.md` — add Tracker section
3. Update `tracker-data.json` — TRACKER module → "live"
4. Git commit + push + PR + merge + tag `v2.10.0`

**P2 Commercialization Phase is now complete after this session. Next: P3 Scale begins with M20 Sector Packs.**
