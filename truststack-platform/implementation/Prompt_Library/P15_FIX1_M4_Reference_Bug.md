# P1.5 — FIX 1: M4 Grievance Reference Number Bug
## Fix Global-Unique to Per-Org Composite Index

**Session:** P1.5 Fix 1  
**Phase:** P1.5 — Critical Fixes (pre-production hardening)  
**Priority:** BLOCKER — second org's first complaint will fail with unique constraint violation  
**Estimated time:** 1 session (~2 hours)  
**Branch:** `feature/p15-fix1-m4-reference-bug`  
**Tag after completion:** `v1.5.1`

---

## READ FIRST
Before starting: Read `implementation/MASTER_CONTEXT.md` + `implementation/progress.md` + `implementation/Implementation_Planner/11_Session_Checklist.md`.

---

## Background & Root Cause

M4 (Grievance Officer Portal, Session 2) creates grievance reference numbers like `GRV-2026-001`. The generator counts ALL complaints to get the next number:

```typescript
// Current (WRONG):
const count = await supabase.from('grievance_complaints').select('*', { count: 'exact' })
// → GRV-2026-001 for org A
// → GRV-2026-002 for org A
// → GRV-2026-003 for org B  ← fine, different number
// BUT: if org B's first complaint was counted when org A had 2, org B gets 003
// If org B's first complaint is inserted concurrently with org A's 3rd → COLLISION on UNIQUE(reference_number)
```

The `grievance_complaints` table has `reference_number TEXT UNIQUE NOT NULL` — a global unique constraint. When two orgs both have their 1st complaint, they both generate `GRV-YYYY-001`, and one insert fails.

**M5 (DSR) and M8 (Breach) already fixed this correctly** — they use a composite `UNIQUE(organization_id, reference_number)` index and scope the count query to the org.

---

## What to Fix

### 1. Supabase Schema Change

**New SQL migration: `db/fix_grievance_reference_unique.sql`**

```sql
-- Step 1: Drop the global unique constraint
ALTER TABLE grievance_complaints DROP CONSTRAINT IF EXISTS grievance_complaints_reference_number_key;

-- Step 2: Add composite unique constraint (per-org reference numbers)
CREATE UNIQUE INDEX IF NOT EXISTS grievance_complaints_org_reference_uniq
  ON grievance_complaints (organization_id, reference_number);

-- Step 3: Update existing records to be per-org sequential (if any exist)
-- (if the table is empty in production, skip this — the constraint change is enough)
-- WARNING: Only run the UPDATE if you have existing data with collisions. 
-- If all existing reference numbers are already globally unique, the new index will apply without conflict.
```

**Run this in Supabase SQL Editor BEFORE deploying the code fix.**

### 2. Fix the Reference Generator in `src/app/api/grievance/submit/route.ts`

Current (wrong):
```typescript
const { count } = await supabase
  .from('grievance_complaints')
  .select('*', { count: 'exact', head: true })
```

Fixed (scope count to org):
```typescript
const { count } = await supabase
  .from('grievance_complaints')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', org.id)
  .like('reference_number', `GRV-${new Date().getFullYear()}-%`)
```

The reference number format stays the same: `GRV-YYYY-NNN`. It just restarts at 001 for each org (same as M5 DSR and M8 Breach).

### 3. Update Public Lookup in `src/app/public/grievance/[slug]/page.tsx`

The public grievance page uses `[slug]` (org slug) to load the org — this already scopes to the right org. No change needed here.

### 4. Update Complaint Status Lookup

`src/app/api/grievance/complaints/[id]/route.ts` — this uses the complaint's `id` (UUID), not `reference_number` for lookup. No change needed.

However, if there's any code that looks up complaints by `reference_number` alone (without `organization_id`), add the org scope.

**Search the codebase:**
```bash
grep -r "reference_number" src/ --include="*.ts" --include="*.tsx"
```
For any hit that queries `grievance_complaints` by `reference_number`, ensure it also filters by `organization_id`.

---

## Testing

### Manual Test (after SQL migration + code deploy):
1. Create two test organizations (org A and org B)
2. Submit a complaint from org A's public form → should get `GRV-2026-001`
3. Submit a complaint from org B's public form → should get `GRV-2026-001` (SAME — this is CORRECT, per-org)
4. Submit a second complaint from org A → should get `GRV-2026-002`
5. Submit a second complaint from org B → should get `GRV-2026-002`
6. No constraint violation errors anywhere

### Type Check + Audit:
```bash
npm run type-check    # must be 0 errors
npm audit             # must be 0 vulnerabilities
```

---

## Files to Modify
- `db/fix_grievance_reference_unique.sql` — NEW SQL migration file
- `src/app/api/grievance/submit/route.ts` — fix count query to scope to org + year

## Files to Check (but likely no change needed)
- `src/app/public/grievance/[slug]/page.tsx` — already org-scoped via slug
- `src/app/api/grievance/complaints/[id]/route.ts` — uses UUID, not reference_number

---

## After Completion
1. Update `progress.md` — mark FIX1 complete
2. Update `MASTER_CONTEXT.md` — add note under M4 section: "Reference number global-unique bug fixed in P1.5 FIX1. Now uses composite (organization_id, reference_number) unique index — matches M5/M8 pattern."
3. Update `tracker-data.json` — FIX1 status → "live"
4. Remove from `pending_actions` in tracker-data.json
5. Git: commit + push + PR → merge → tag `v1.5.1`

---

## Notes
- M5 DSR + M8 Breach already have the correct pattern — reference this if needed
- This does NOT require any API route changes beyond the submit route
- The fix is backward-compatible: existing complaints keep their reference numbers
- If no complaints exist yet in production, the SQL migration is trivially safe
