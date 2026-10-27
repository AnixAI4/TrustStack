# P1.5 — FIX 2: Apply M6 + M8 SQL + Wire M8 Escalation Cron
## Make ROPA Builder and Breach Response fully live

**Session:** P1.5 Fix 2  
**Phase:** P1.5 — Critical Fixes  
**Priority:** BLOCKER — M6 ROPA and M8 Breach are non-functional without their DB tables  
**Estimated time:** 1 session (~1.5 hours — mostly Supabase SQL + Vercel config)  
**Branch:** `feature/p15-fix2-sql-and-cron`  
**Tag after completion:** `v1.5.2`

---

## READ FIRST
Before starting: Read `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`.

---

## Task 1: Apply M6 ROPA SQL in Supabase

**File:** `db/ropa.sql`

Go to Supabase Dashboard → SQL Editor → paste and run `db/ropa.sql`.

This creates:
- `ropa_entries` table (with all columns per MASTER_CONTEXT schema)
- RLS: org members can SELECT/INSERT/UPDATE/DELETE their own entries
- Indexes: `(organization_id, status)` + `(organization_id, created_at desc)`

**Verification after applying:**
1. Go to Supabase → Table Editor → confirm `ropa_entries` appears
2. Test the ROPA dashboard: `http://localhost:3011/dashboard/ropa`
3. Try creating a ROPA entry — should save without errors
4. Try the "Add from template" → should pre-fill fields
5. Try DPO approval → should flip status to 'active'
6. Try PDF export → should generate PDF
7. Try CSV export → should download CSV

---

## Task 2: Apply M8 Breach SQL in Supabase

**File:** `db/breach_incidents.sql`

Go to Supabase Dashboard → SQL Editor → paste and run `db/breach_incidents.sql`.

This creates:
- `breach_incidents` table with ALL columns (reference_number, dpbi_notification_due_at, escalations_sent[], etc.)
- RLS: org members manage their own incidents
- **Composite per-org unique index:** `breach_incidents_org_reference_uniq ON (organization_id, reference_number)` — NOT global unique (matches M5 pattern)
- Indexes: org+status, org+created_at desc, org+dpbi_notification_due_at, org+dpbi_notified

**Verification after applying:**
1. Supabase → Table Editor → confirm `breach_incidents` appears
2. Test the Breach dashboard: `http://localhost:3011/dashboard/breach`
3. Log a test breach incident (use "Log Breach" button)
4. Verify 72-hour countdown appears and ticks on the detail page
5. Verify "Generate DPBI Draft" works (calls Claude, generates formal letter)
6. Verify "Mark as DPBI Notified" sets the timestamp

---

## Task 3: Set CRON_SECRET Environment Variable

The M8 escalation runner (`POST /api/breach/escalations/run`) requires a `CRON_SECRET` to be set. Without it, the endpoint returns 401 to all callers and no escalation emails are ever sent.

### Step 3a: Generate a secure secret
```bash
openssl rand -hex 32
# Example output: a3f8e2c1d7b4a9f0e2c1d7b4a9f0e2c1d7b4a9f0e2c1d7b4a9f0e2c1d7b4a9f0
```

### Step 3b: Add to `.env.local`
```bash
CRON_SECRET=<your-generated-secret>
```

### Step 3c: Add to Vercel Environment Variables
Vercel Dashboard → Project → Settings → Environment Variables → Add:
- Key: `CRON_SECRET`
- Value: `<same secret>`
- Environment: Production + Preview

---

## Task 4: Wire Vercel Cron for M8 Escalations

Create `vercel.json` in the project root (or update if it exists):

```json
{
  "crons": [
    {
      "path": "/api/breach/escalations/run",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

This runs the escalation check every 15 minutes. The route is idempotent (won't send duplicate emails — `escalations_sent[]` array prevents it).

**How to verify cron is wired:**
After deploying to Vercel, go to: Vercel Dashboard → Project → Cron Jobs tab → confirm the cron appears with the 15-minute schedule.

**Local testing (without waiting for cron):**
```bash
# Test the escalation endpoint directly (needs a breach incident with dpbi_notification_due_at in the past)
curl -X POST http://localhost:3011/api/breach/escalations/run \
  -H "x-cron-secret: <your-secret>" \
  -H "Content-Type: application/json"
# Should return { "processed": N, "escalated": N }
```

---

## Task 5: Verify RESEND_API_KEY + Switch to truststack.in (if ready)

Check if `truststack.in` has been verified in Resend. If yes:
1. Update `RESEND_API_KEY` is set in `.env.local` and Vercel (already done per progress.md)
2. Update the `from` address in ALL email-sending files from `noreply@anixai.io` to `noreply@truststack.in`

**Search for all occurrences:**
```bash
grep -r "noreply@anixai.io" src/ --include="*.ts"
```

Files to update (if truststack.in is verified):
- `src/lib/dsr/otp.ts` — DSR OTP emails
- `src/lib/vendors/email.ts` — Vendor questionnaire emails
- `src/lib/breach/escalation.ts` — Breach escalation emails
- `src/app/api/grievance/submit/route.ts` — Grievance submission emails

**If truststack.in is NOT verified yet:** Leave as `noreply@anixai.io` — document as pending.

---

## After Completion

1. Update `progress.md`:
   - Infrastructure table: M6 SQL → ✅ Complete, M8 SQL → ✅ Complete
   - Infrastructure table: CRON_SECRET → ✅ Set
   - Infrastructure table: M8 Breach escalation → ✅ Live (Vercel Cron wired)

2. Update `MASTER_CONTEXT.md`:
   - Under M6 section: "DB schema applied in Supabase ✅"
   - Under M8 section: "DB schema applied in Supabase ✅. CRON_SECRET set. Vercel Cron wired at */15."
   - Under Environment Variables: add `CRON_SECRET`

3. Update `tracker-data.json`:
   - FIX2 status → "live"
   - Remove "sql-m6" and "sql-m8" from pending_actions

4. Git: commit `vercel.json` + any email domain changes + progress/context updates
   ```
   git commit -m "fix(p1.5): apply M6+M8 SQL, wire Vercel Cron for M8 escalations"
   ```
5. Push + PR → merge → tag `v1.5.2`

---

## Notes
- `db/ropa.sql` and `db/breach_incidents.sql` were written and committed during Sessions 8 and 9 — just need to be run in Supabase
- The Vercel Cron approach is documented in M8's MASTER_CONTEXT entry as the expected scheduler
- Alternative scheduler: Supabase pg_cron or GitHub Actions (both call the same endpoint)
- If using GitHub Actions instead of Vercel Cron: create `.github/workflows/breach-escalation.yml` with a `schedule: cron('*/15 * * * *')` that hits the production endpoint
