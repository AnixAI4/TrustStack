# P1.5 — FIX 4: Production Hardening + QA
## Pre-launch quality gate before first paying customer

**Session:** P1.5 Fix 4  
**Phase:** P1.5 — Critical Fixes  
**Priority:** BLOCKER before Milestone 1 (Controlled Beta)  
**Estimated time:** 1 session (~3–4 hours)  
**Branch:** `feature/p15-fix4-production-hardening`  
**Tag after completion:** `v1.5.4`  
**Prerequisites:** FIX1 + FIX2 + FIX3 all complete and tagged

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md` + `implementation/Implementation_Planner/06_Rollout_Milestones.md`

---

## Background

Before the first paying beta customer gets access, every module (M1–M10) must pass a structured QA checklist. This session is the **pre-launch gate**. After FIX4 is tagged, the platform is ready for Milestone 1 (Controlled Beta). This is not feature development — it is hardening, testing, and verification.

---

## Task 1: Full Platform QA Checklist

Run through every module systematically. For each: verify the golden path + key edge cases.

### Auth & Multi-Tenancy (baseline)
- [ ] Sign up creates org + sets role = 'admin'
- [ ] Sign in as admin → can see all modules in sidebar
- [ ] Sign up as new user → invited to org → role 'member' → restricted access
- [ ] Sign out → redirected to /login
- [ ] Unauthenticated GET /dashboard/* → 307 to /login (NOT 200)
- [ ] Unauthenticated POST /api/* → 401 (NOT 200)
- [ ] RLS: create 2 orgs, ensure org A cannot read org B's data in any table

### M1 — DPDP Compass™ Assessment
- [ ] Start assessment → 45 questions load correctly
- [ ] Save progress mid-way → reload → progress persists
- [ ] Complete assessment → Compass Score (0–100) appears
- [ ] AI gap report generates (uses Claude sonnet-4-6)
- [ ] View report PDF — downloads

### M1b — Industry Layers
- [ ] Industry selector loads DPDP-specific questions for: Healthcare, Finance, E-commerce, IT/SaaS, Education, Manufacturing
- [ ] Industry-specific guidance appears alongside generic questions

### M2 — Consent Management
- [ ] Create consent config → embed widget code appears
- [ ] Widget loads from public route (CORS headers present)
- [ ] Record consent via widget → appears in dashboard
- [ ] Withdraw consent → status changes
- [ ] Consent receipt downloadable

### M3 — Privacy Notice Builder
- [ ] Create privacy notice → rich text editor works
- [ ] AI drafting (Claude) generates DPDP-compliant notice
- [ ] Publish notice → gets public slug URL
- [ ] Public URL works unauthenticated → 200

### M4 — Grievance Officer Portal
- [ ] Submit complaint via public form → reference number generated (GRV-YYYY-NNN)
- [ ] **Two orgs both get GRV-YYYY-001 as their first complaint** (FIX1 verified)
- [ ] Grievance officer sees new complaint in dashboard
- [ ] Assign complaint → status updates
- [ ] Email notification sent to complainant (via Resend)
- [ ] Resolve complaint → resolution recorded + email sent

### M5 — DSR Management
- [ ] Submit DSR request via public form (OTP verified)
- [ ] DSR appears in admin dashboard
- [ ] 30-day deadline countdown shows
- [ ] Admin fulfills DSR → status updates
- [ ] DSR past deadline shows ⚠️ badge

### M6 — ROPA Builder (requires FIX2 SQL applied)
- [ ] Supabase → ropa_entries table exists ✅
- [ ] Create ROPA entry manually
- [ ] Create from template (pre-filled fields)
- [ ] DPO approve entry → status: 'active'
- [ ] Export as PDF
- [ ] Export as CSV
- [ ] Annual review reminder appears for entries not reviewed in 12 months

### M7 — Vendor DPA Manager
- [ ] Add vendor
- [ ] Send questionnaire via email link (HMAC token)
- [ ] Vendor fills questionnaire via public link (unauthenticated)
- [ ] Responses appear in admin dashboard
- [ ] Generate DPA PDF
- [ ] Risk score calculated

### M8 — Breach Response (requires FIX2 SQL applied)
- [ ] Supabase → breach_incidents table exists ✅
- [ ] Log a breach incident
- [ ] 72-hour DPBI countdown visible and ticking
- [ ] Generate DPBI Draft (Claude AI)
- [ ] Mark as DPBI Notified → dpbi_notified = true, timestamp recorded
- [ ] CRON_SECRET set in Vercel env ✅
- [ ] Vercel Cron visible in Vercel dashboard ✅
- [ ] Manual test: POST /api/breach/escalations/run with x-cron-secret header → returns 200

### M9 — Board Dashboard (requires FIX3 complete)
- [ ] Generate Board Report PDF
- [ ] PDF has all 7 sections (M1–M8 data)
- [ ] Overdue DSRs show ALERT text
- [ ] Open breach shows in PDF
- [ ] Share link (HMAC token) works for external board members
- [ ] Share link expires after configured days

### M10 — TrustChat™
- [ ] 11-question health check completes
- [ ] AI response generated (Claude sonnet-4-6)
- [ ] Contextual guidance links to correct module
- [ ] Public TrustChat widget loads (unauthenticated route)

---

## Task 2: Mobile Responsiveness Check

Open every module page in Chrome DevTools mobile emulation (iPhone 14 = 390×844):

- [ ] Dashboard sidebar collapses to hamburger menu on mobile
- [ ] M1 Assessment: questions readable, form usable
- [ ] M2 Consent widget: renders correctly on mobile
- [ ] M3 Privacy Notice: public page readable on mobile
- [ ] M4 Grievance form: all fields fit, submit works
- [ ] M5 DSR form: OTP entry works on mobile keyboard
- [ ] M9 Board Dashboard: charts don't overflow
- [ ] No horizontal scroll on any page at 390px width

---

## Task 3: Performance + Security Checklist

```bash
# In project root:
npm audit                     # → 0 vulnerabilities (REQUIRED)
npm run type-check            # → 0 TypeScript errors (REQUIRED)
npm run build                 # → builds without errors (REQUIRED)

# Check for exposed secrets:
grep -r "ANTHROPIC_API_KEY\|SUPABASE_SERVICE_ROLE_KEY\|RAZORPAY_KEY_SECRET" src/ --include="*.tsx" --include="*.ts"
# → MUST return 0 results (secrets only in .env.local, never in src/)

# Check for any 'use client' on API routes:
grep -r "'use client'" src/app/api/ --include="*.ts"
# → MUST return 0 results (API routes are never client components)

# Check all public routes have CORS headers:
grep -r "OPTIONS" src/app/api/ --include="*.ts" -l
# → Should list all public-facing API routes (consent widget, grievance submit, DSR submit, vendor questionnaire)
```

---

## Task 4: Environment Variables Audit

Confirm ALL required env vars are set in both `.env.local` AND Vercel:

| Variable | Required by | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client | ✅ |
| `ANTHROPIC_API_KEY` | Claude AI | ✅ |
| `RESEND_API_KEY` | Email | ✅ |
| `HMAC_SECRET` | Board share links, Vendor questionnaire | Verify |
| `CRON_SECRET` | M8 breach escalation | Set in FIX2 |
| `NEXT_PUBLIC_APP_URL` | Email links, public widgets | Verify |

For each var: confirm it's in Vercel Production AND Preview environments.

---

## Task 5: Fix Any Issues Found

Fix any bugs found in Tasks 1–4. Document every fix with a commit message. If a bug is too large to fix in this session, create a new item in `tracker-data.json` pending_actions with priority HIGH.

---

## Task 6: Final Deployment Verification

```bash
# 1. Merge all P1.5 branches to main (via PRs — this is the last P1.5 session)
# 2. Deploy to Vercel production:
git checkout main
git pull origin main
# Vercel auto-deploys on push to main

# 3. After Vercel deploy completes, verify production:
# - https://truststack.vercel.app/login → loads
# - https://truststack.vercel.app/api/health → 200 (if health endpoint exists)
# - All module routes: 307 redirect (unauthenticated)
# - Public widget: CORS headers present
```

---

## truststack.in Domain Setup (if ready)

If the user has verified `truststack.in` in Resend:
1. Update all `from: 'noreply@anixai.io'` → `from: 'noreply@truststack.in'`
2. Verify emails send from truststack.in domain
3. Update `NEXT_PUBLIC_APP_URL` to `https://truststack.in` in Vercel

If NOT ready: document as "pending domain verification" in progress.md. Not a blocker.

---

## After Completion

1. Update `progress.md`:
   - All P1.5 fixes: ✅ Complete
   - Platform status: "Ready for Milestone 1 — Controlled Beta"
   - Add new section: "P1.5 Sign-Off Checklist" with all items above checked off

2. Update `MASTER_CONTEXT.md`:
   - Version: v2.4 (add "P1.5 Production Hardening complete" note)
   - All modules M1–M10: status → "live"

3. Update `tracker-data.json`:
   - FIX4 status → "live"
   - All P1.5 items: status → "live"
   - pending_actions: clear all P1.5 items
   - phases.P1_5.status → "complete", features_done → 4

4. Git:
   ```
   git commit -m "fix(p1.5): production hardening, full QA pass, env audit"
   git tag -a v1.5.4 -m "P1.5 complete: production hardening + full QA"
   ```
5. Push + PR + merge → tag `v1.5.4` on main

6. **Milestone 0 is now complete. TrustStack™ is BETA-READY.**

---

## Notes
- This is the LAST P1.5 session. After this: v2.x.0 (P2 Commercialization) begins.
- The next Claude session should implement M11 Team Management (`P2_M11_Team_Management.md`).
- Before starting P2: create `tracker-data.json` at `src/app/dashboard/admin/tracker/tracker-data.json` with all 35 modules populated. The Tracker Dashboard (P2_Tracker_Dashboard.md) will read this file.
