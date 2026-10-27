# P1.5 — FIX 3: M9 Board Dashboard — Aggregate All Modules (M5–M8)
## Extend Board Report to include DSR, ROPA, Vendor, Breach stats

**Session:** P1.5 Fix 3  
**Phase:** P1.5 — Critical Fixes  
**Priority:** HIGH — Board Dashboard currently shows M1–M4 data only; M5–M8 are live but invisible to board  
**Estimated time:** 1 session (~2–3 hours)  
**Branch:** `feature/p15-fix3-m9-enhancement`  
**Tag after completion:** `v1.5.3`  
**Prerequisites:** P1.5 FIX2 complete — `db/ropa.sql` and `db/breach_incidents.sql` must be applied in Supabase before this session

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md` + `implementation/Prompt_Library/P0_M9_Board_Dashboard.md`

---

## Background

M9 Board Dashboard (Session 7) generates a PDF report for the organization's board of directors. It currently aggregates:
- M1 Compass Score + maturity level
- M2 Consent statistics (total, active, withdrawn)
- M3 Privacy Notices (count, last published)
- M4 Grievance Portal (open vs resolved, SLA compliance)

**Missing from the board report (M5–M8 are built but not included):**
- M5 DSR Management: pending DSRs, overdue DSRs, average resolution time
- M6 ROPA Builder: number of active processing activities, last DPO review date
- M7 Vendor DPA Manager: total vendors, vendors with overdue assessments
- M8 Breach Response: open breach incidents, incidents past 72-hour DPBI threshold

---

## What to Build

### 1. Update the Board Report Data Fetcher

**File:** `src/lib/ai/board-report-generator.ts` (or wherever M9 aggregates data — check MASTER_CONTEXT.md for exact file)

Add queries for M5–M8:

```typescript
// M5: DSR Management
const [dsrStats] = await supabase.rpc('get_dsr_board_stats', { p_org_id: orgId })
// OR direct queries:
const { count: dsrPending } = await supabase
  .from('dsr_requests')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', orgId)
  .eq('status', 'pending')

const { count: dsrOverdue } = await supabase
  .from('dsr_requests')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', orgId)
  .lt('deadline_at', new Date().toISOString())
  .not('status', 'eq', 'completed')
  .not('status', 'eq', 'rejected')

// M6: ROPA Builder
const { count: ropaActive } = await supabase
  .from('ropa_entries')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', orgId)
  .eq('status', 'active')

const { data: ropaLastReview } = await supabase
  .from('ropa_entries')
  .select('last_reviewed_at')
  .eq('organization_id', orgId)
  .order('last_reviewed_at', { ascending: false })
  .limit(1)
  .single()

// M7: Vendor DPA Manager
const { count: vendorTotal } = await supabase
  .from('vendors')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', orgId)

const { count: vendorOverdue } = await supabase
  .from('vendors')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', orgId)
  .lt('next_assessment_due_at', new Date().toISOString())
  .not('status', 'eq', 'inactive')

// M8: Breach Response
const { count: breachOpen } = await supabase
  .from('breach_incidents')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', orgId)
  .neq('status', 'closed')
  .neq('status', 'no_action_required')

const { count: breachPastDeadline } = await supabase
  .from('breach_incidents')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', orgId)
  .eq('dpbi_notified', false)
  .lt('dpbi_notification_due_at', new Date().toISOString())
```

### 2. Update the Board Report TypeScript Types

**File:** `src/types/dpdp.ts`

Add to the `BoardReportData` type (or equivalent):

```typescript
dsr: {
  pending: number;
  overdue: number;
  completedLast30Days: number;
};
ropa: {
  activeEntries: number;
  lastReviewDate: string | null;
};
vendors: {
  total: number;
  overdueAssessments: number;
};
breach: {
  openIncidents: number;
  pastDpbiDeadline: number;
  lastIncidentDate: string | null;
};
```

### 3. Update the AI Prompt for PDF Generation

**File:** `src/lib/ai/board-report-generator.ts` — the `generateBoardReportNarrative()` function

Add these sections to the AI prompt after the existing M1–M4 sections:

```
## Subject Access Requests (DSR Management)
- Pending DSRs: ${dsr.pending}
- Overdue DSRs (past deadline): ${dsr.overdue}
- Completed in last 30 days: ${dsr.completedLast30Days}
${dsr.overdue > 0 ? 'ALERT: Overdue DSR requests require immediate attention. Organizations must respond within 30 days under DPDP Act.' : 'DSR response times are within DPDP Act limits.'}

## Record of Processing Activities (ROPA)
- Active ROPA entries: ${ropa.activeEntries}
- Last DPO review: ${ropa.lastReviewDate ?? 'Not yet reviewed'}
${!ropa.lastReviewDate ? 'ALERT: ROPA entries have not been reviewed. DPO review required for compliance.' : ''}

## Third-Party Vendor Compliance
- Total vendors assessed: ${vendors.total}
- Vendors with overdue assessments: ${vendors.overdueAssessments}
${vendors.overdueAssessments > 0 ? `ALERT: ${vendors.overdueAssessments} vendor(s) have overdue security assessments. DPA agreements must be kept current.` : 'All vendor assessments are current.'}

## Data Breach Incidents
- Open breach incidents: ${breach.openIncidents}
- Incidents past DPBI 72-hour notification deadline: ${breach.pastDpbiDeadline}
${breach.pastDpbiDeadline > 0 ? 'CRITICAL ALERT: DPBI notification deadline exceeded. Immediate regulatory reporting required.' : ''}
${breach.openIncidents === 0 ? 'No active breach incidents.' : `${breach.openIncidents} breach incident(s) under active management.`}
```

### 4. Update the Board Dashboard UI Page

**File:** `src/app/dashboard/board/page.tsx` (or equivalent — check MASTER_CONTEXT.md)

Add new metric cards or table rows for M5–M8 data:

**New section below existing stats: "Compliance Coverage"**

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPLIANCE COVERAGE                                             │
├──────────────────────┬──────────────────────┬──────────────────┤
│  DSR Requests        │  ROPA Entries        │  Vendors         │
│  Pending: X          │  Active: X           │  Total: X        │
│  Overdue: X ⚠️        │  Last review: date   │  Overdue: X ⚠️   │
├──────────────────────┴──────────────────────┴──────────────────┤
│  DATA BREACH STATUS                                              │
│  Open incidents: X   Past 72hr DPBI deadline: X 🔴              │
└─────────────────────────────────────────────────────────────────┘
```

Use the existing card/metric components from M9 — don't create new design patterns.

---

## Board Report PDF Structure (Updated)

The generated PDF now has 7 sections (was 5):

1. Executive Summary (Compass Score + overall status)
2. Consent & Privacy Notices
3. Grievance & Redress
4. **Subject Access Requests (NEW)**
5. **Record of Processing Activities (NEW)**
6. **Third-Party Vendor Compliance (NEW)**
7. **Data Breach Incidents (NEW)**

---

## Handle Gracefully: Tables May Not Have Data Yet

If any of the new tables don't have data (org just onboarded), return zeros — don't throw:

```typescript
// Pattern for tables that may be empty or not yet exist for this org:
const dsrPending = dsrPendingResult.count ?? 0;
const ropaActive = ropaActiveResult.count ?? 0;
// etc.
```

If a table doesn't exist yet (Supabase error `"relation does not exist"`), catch the error and default to 0 — this can happen if FIX2's SQL hasn't been applied yet.

---

## Testing

1. Generate a board report PDF → verify it has all 7 sections
2. Create a DSR request (mark as pending) → re-generate report → DSR pending = 1
3. Let a DSR go past deadline → DSR overdue = 1, ALERT text appears in PDF
4. Create a breach incident, leave DPBI notification pending → breach open = 1
5. Let breach go past 72-hour deadline → "CRITICAL ALERT" in PDF
6. `npm run type-check` — 0 errors
7. `npm audit` — 0 vulnerabilities

---

## Files to Modify
- `src/lib/ai/board-report-generator.ts` — add M5–M8 data fetching + AI prompt sections
- `src/types/dpdp.ts` — add M5–M8 fields to BoardReportData type
- `src/app/dashboard/board/page.tsx` — add new compliance coverage section to UI

---

## After Completion

1. Update `progress.md` — FIX3 complete; M9 Board Dashboard now → Full ✅
2. Update `MASTER_CONTEXT.md` — M9 entry: "Now aggregates M1–M8 data. BoardReportData type extended."
3. Update `tracker-data.json` — M9 status: "partial" → "live"; FIX3 removed from pending_actions
4. Git commit: `fix(p1.5): extend M9 board dashboard to aggregate all M1-M8 modules`
5. Push + PR + merge + tag `v1.5.3`
