# TrustStack™ — Session Checklist
## Mandatory Before/After Every Prompt Session

**Version:** 1.0 — June 2026  
**Rule:** Every new prompt session starts in a FRESH Claude Code window. This checklist ensures cold sessions have context and every completed session leaves clean state.

---

## BEFORE STARTING ANY SESSION

### Step B1 — Read Context (REQUIRED — do this first in every new window)
```
Read: implementation/MASTER_CONTEXT.md       ← tech stack, DB schema, patterns
Read: implementation/progress.md             ← current status of all modules
Read: implementation/Implementation_Planner/00_Master_Plan.md  ← phase overview
Read: implementation/Implementation_Planner/tracker-data.json  ← pending actions
```

### Step B2 — Identify the Prompt File
- Find the prompt file in `implementation/Prompt_Library/`
- Example: `P2_M11_Team_Management.md`
- Read it fully before writing a single line of code

### Step B3 — Create the Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/p{phase}-m{number}-{name}
# Examples:
# git checkout -b feature/p15-fix1-m4-reference-bug
# git checkout -b feature/p2-m11-team-management
# git checkout -b feature/p2-m12-billing-engine
```

### Step B4 — Verify Prerequisites
Check the prompt file's "Prerequisites" section. Confirm all dependent modules are complete and their SQL is applied in Supabase. If any prerequisite is missing, DO NOT proceed — fix it first.

### Step B5 — Check npm audit and type-check baseline
```bash
cd /Users/aniketmhala/Downloads/Anix/AI_Projects/DPDP/truststack-platform
npm audit                    # must be 0 vulnerabilities
npm run type-check           # must be 0 errors
```
If either fails, investigate and fix BEFORE writing new code. Never add to existing debt.

---

## DURING THE SESSION

### Code Standards (always follow — from MASTER_CONTEXT.md §14)
- TypeScript strict mode — no `any`, no `ts-ignore`
- Server Components by default — `'use client'` only when needed
- Always scope DB queries to `organization_id` — never query without RLS
- Per-org reference numbers: ALWAYS use composite `unique(organization_id, reference_number)` — NEVER global unique
- Public routes: admin client + CORS + OPTIONS handler
- No hardcoded prices, limits, or trial days — must come from DB
- No hardcoded strings — use constants from `src/lib/constants.ts`

### Commit Incrementally
```bash
git add [specific files]     # never `git add .` or `git add -A`
git commit -m "feat(m11): add user invite flow with role assignment"
git commit -m "feat(m11): add seat limit enforcement per subscription tier"
git commit -m "test(m11): verify all API routes return correct auth errors"
```

### Before Declaring "Done"
```bash
npm run type-check           # must be 0 errors
npm audit                    # must be 0 vulnerabilities
npm run dev -- --port 3011   # start dev server
# Manually verify:
# - All new dashboard routes: 307 → /login (unauthenticated)
# - All new auth API routes: 401 (unauthenticated)  
# - All new public routes: 200 or 400 (not 401/307)
# - No console errors on load
# - Mobile layout doesn't break
```

---

## AFTER COMPLETING A SESSION

### Step A1 — Update progress.md
Add a new session entry with:
```markdown
### Session N — {Module Name} ✅ COMPLETE

**Files created:**
- [list every new file]

**Files modified:**
- [list every modified file with what changed]

**DB changes:**
- [list new tables, new columns, new SQL files — and whether applied in Supabase]

**Key decisions:**
- [non-obvious decisions and why]

**Verification:**
- `npm run type-check` ✅ / ❌
- `npm audit` ✅ 0 vulns / ❌
- Routes verified: [list 401/307/200 checks]

**Pre-next-session requirements:**
- [ ] Apply SQL: db/xxx.sql in Supabase
- [ ] Set env var: XXX=... in .env.local and Vercel
- [ ] Any manual step the user must take
```

Update the module status in the Phase table from `🔲 Not Started` → `✅ Complete` (or `⚠️ Partial` if SQL pending).

### Step A2 — Update MASTER_CONTEXT.md
Add a new section under "What Is Already Built" for the completed module. Follow the exact format of existing sections (M1 through M8). Include:
- Module name + session + date
- Constants added to `constants.ts`
- Types added to `dpdp.ts`
- Lib files created
- API routes created (with auth/public designation)
- Components created
- Pages created
- DB tables (+ SQL file name)
- Key decisions

### Step A3 — Update tracker-data.json
```json
// In tracker-data.json:
// 1. Find the module entry and update:
{
  "id": "M11",
  "status": "built",        // was "not_started"
  "session": "Session 10",
  "git_branch": "feature/p2-m11-team-management",
  "git_tag": "v2.1.0",
  "test_status": "passed",
  "notes": "Team invite + role management + seat limits. SQL pending."
}
// 2. Update phases.P2.features_done count
// 3. Update meta.last_updated and meta.built count
// 4. Add to sessions[] array
// 5. Remove resolved pending_actions entries
```

### Step A4 — Git: Commit Everything
```bash
git add implementation/progress.md
git add implementation/MASTER_CONTEXT.md
git add implementation/Implementation_Planner/tracker-data.json  # if exists
git add src/  # all new/modified source files
git add db/   # any new SQL files

git commit -m "$(cat <<'EOF'
feat(m11): implement team management — invite, roles, seat limits

Adds multi-user support: admin can invite team members via email,
assign roles (admin/DPO/viewer/board), and seat limits are enforced
per subscription plan. Sends invite email via Resend.

DB: organization_invites table + RLS. SQL: db/organization_invites.sql
Progress: progress.md + MASTER_CONTEXT.md updated.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step A5 — Push + Open PR + Merge + Tag
```bash
git push origin feature/p2-m11-team-management

# Create PR (via gh CLI or GitHub UI)
gh pr create \
  --title "feat(M11): Team Management — invite, roles, seat limits" \
  --body "$(cat <<'EOF'
## What
Multi-user team management: invite members, assign roles (admin/DPO/viewer/board), enforce seat limits per subscription plan.

## Modules
- M11: Team Management (P2 Phase — first commercialization module)

## Test
- [ ] Invite sends email and creates pending invite
- [ ] Accept invite creates organization_member record  
- [ ] Seat limit blocks invite when at cap
- [ ] Role restricts access to correct modules
- [ ] type-check ✅  npm audit = 0 ✅

## DB
- Run `db/organization_invites.sql` in Supabase before testing

🤖 Generated with Claude Code
EOF
)"

# After PR approved + merged:
git checkout main
git pull origin main
git tag -a v2.1.0 -m "M11: Team Management complete"
git push origin v2.1.0
```

### Step A6 — Update Supabase (if SQL files exist)
Go to Supabase SQL Editor → run the new SQL file(s). Mark them as applied in progress.md.

### Step A7 — Update .env.local and Vercel (if new env vars)
Add any new env vars to:
- `.env.local` (local development)
- Vercel project settings (production)
Document new vars in MASTER_CONTEXT.md §4 (Environment Variables).

---

## Session Version Tagging Convention

| Scenario | Tag Format | Example |
|---|---|---|
| New P1.5 fix | v1.X.Y | v1.5.1 (fix 1), v1.5.2 (fix 2) |
| New P2 feature | v2.X.0 | v2.1.0 (M11), v2.2.0 (M12) |
| P2 fix/patch | v2.X.Y | v2.1.1 (M11 bug fix) |
| New P3 feature | v3.X.0 | v3.1.0 (M20), v3.2.0 (M21) |
| New P4 feature | v4.X.0 | v4.1.0 (M26) |

**Current version:** v1.0.0 (all P0+P1 complete)  
**Next version:** v1.5.1 (first P1.5 fix)

---

## Quick Reference — Module → Prompt File Mapping

| Module | Phase | Prompt File | Status |
|---|---|---|---|
| M1 Compass Assessment | P0 | P0_M1_Compass_Assessment.md | ✅ Done |
| M1b Industry Layers | P0 | P0_M1b_Industry_Layers.md | ✅ Done |
| M4 Grievance Portal | P0 | P0_M4_Grievance_Officer_Portal.md | ✅ Done |
| M2 Consent Management | P0 | P0_M2_Consent_Management.md | ✅ Done |
| M3 Privacy Notice | P0 | P0_M3_Privacy_Notice_Builder.md | ✅ Done |
| M9 Board Dashboard | P0 | P0_M9_Board_Dashboard.md | ✅ Done |
| M10 TrustChat | P0 | P0_M10_TrustChat_DONE.md | ✅ Done |
| M5 DSR Management | P1 | P1_M5_DSR_Management.md | ✅ Done |
| M6 ROPA Builder | P1 | P1_M6_ROPA_Builder.md | ✅ Done |
| M7 Vendor DPA | P1 | P1_M7_Vendor_DPA_Manager.md | ✅ Done |
| M8 Breach Response | P1 | P1_M8_Breach_Response.md | ✅ Done |
| FIX1 M4 Ref Bug | P1.5 | P15_FIX1_M4_Reference_Bug.md | 🔲 |
| FIX2 SQL Apply | P1.5 | P15_FIX2_M6_M8_SQL_And_Cron.md | 🔲 |
| FIX3 M9 Aggregate | P1.5 | P15_FIX3_M9_Enhancement.md | 🔲 |
| FIX4 Production QA | P1.5 | P15_FIX4_Production_Hardening.md | 🔲 |
| M11 Team Management | P2 | P2_M11_Team_Management.md | 🔲 |
| M12 Billing Engine | P2 | P2_M12_Billing_Subscription_Engine.md | 🔲 |
| M13 PAYG Credits | P2 | P2_M13_PAYG_Credits_Engine.md | 🔲 |
| M14 Onboarding Wizard | P2 | P2_M14_Onboarding_Wizard.md | 🔲 |
| M15 WhatsApp Consent | P2 | P2_M15_WhatsApp_Consent.md | 🔲 |
| M16 Aadhaar OTP | P2 | P2_M16_Aadhaar_OTP.md | 🔲 |
| M17 Trust Center | P2 | P2_M17_Trust_Center.md | 🔲 |
| M18 Alert Center | P2 | P2_M18_Alert_Center.md | 🔲 |
| M19 Re-Consent Campaign | P2 | P2_M19_ReConsent_Campaign.md | 🔲 |
| M20 Sector Packs | P3 | P3_M20_Sector_Packs.md | 🔲 |
| M21 Academy | P3 | P3_M21_TrustStack_Academy.md | 🔲 |
| M22 Badge | P3 | P3_M22_Compliance_Badge.md | 🔲 |
| M23 DPO-as-a-Service | P3 | P3_M23_DPO_as_a_Service.md | 🔲 |
| M24 DSR Connectors | P3 | P3_M24_India_DSR_Connectors.md | 🔲 |
| M25 API | P3 | P3_M25_DPDP_API.md | 🔲 |
| M26 AI Governance | P4 | P4_M26_AI_Governance.md | 🔲 |
| M27 Consent Propagation | P4 | P4_M27_Consent_Propagation.md | 🔲 |
| M28 ISO 27701 | P4 | P4_M28_ISO27701_Pathway.md | 🔲 |
| M29 Data Discovery | P4 | P4_M29_Data_Discovery.md | 🔲 |
| M30 Privacy-as-Code | P4 | P4_M30_Privacy_as_Code.md | 🔲 |

**Tracker Dashboard** | P2 | P2_Tracker_Dashboard.md | 🔲 |
