# Phase P1.5 — Critical Fixes
## Pre-production hardening before first paying customer

**Phase:** P1.5  
**Status:** 🔲 Not Started  
**Target completion:** Before Milestone 1 (Controlled Beta, September 2026)  
**Tags:** v1.5.1 → v1.5.2 → v1.5.3 → v1.5.4

---

## Why P1.5 Exists

After completing P0 and P1 (11 modules, v1.0.0), four issues were found that make the platform unsuitable for a paying customer:

1. **M4 Reference Bug** — Global unique constraint on `grievance_complaints.reference_number` will cause constraint violation when two orgs each log their first complaint. The second org's insert fails silently.
2. **M6 ROPA not live** — `db/ropa.sql` was written and committed but never applied in Supabase. ROPA Builder is non-functional.
3. **M8 Breach not live** — Same as M6. `db/breach_incidents.sql` not applied. Plus `CRON_SECRET` missing → escalation emails never send.
4. **M9 Board Dashboard incomplete** — Only shows M1–M4 data. M5–M8 (DSR, ROPA, Vendor, Breach) are live but invisible to the board.

P1.5 also includes a final production QA pass (FIX4) to ensure the platform is stable, mobile-responsive, and ready for beta customers.

---

## Fixes

| ID | Name | Prompt File | Tag | Status |
|---|---|---|---|---|
| FIX1 | M4 Grievance Reference Bug | `P15_FIX1_M4_Reference_Bug.md` | v1.5.1 | 🔲 |
| FIX2 | Apply M6+M8 SQL + Cron | `P15_FIX2_M6_M8_SQL_And_Cron.md` | v1.5.2 | 🔲 |
| FIX3 | M9 Board Dashboard Enhancement | `P15_FIX3_M9_Enhancement.md` | v1.5.3 | 🔲 |
| FIX4 | Production Hardening + QA | `P15_FIX4_Production_Hardening.md` | v1.5.4 | 🔲 |

---

## Execution Order

FIX1 and FIX2 are independent — can be done in parallel (separate sessions).  
FIX3 requires FIX2 (ropa_entries and breach_incidents tables must exist in Supabase).  
FIX4 requires FIX1 + FIX2 + FIX3 all complete — it's the QA gate.

```
FIX1 ──────────────────────────────────────────┐
                                               ├──→ FIX4 ──→ v1.5.4 (BETA READY)
FIX2 ──→ FIX3 ─────────────────────────────────┘
```

---

## Definition of Done

P1.5 is complete when:
- [ ] `npm run type-check` → 0 errors
- [ ] `npm audit` → 0 vulnerabilities
- [ ] `npm run build` → builds clean
- [ ] Two orgs can each have `GRV-2026-001` without constraint error
- [ ] ROPA Builder CRUD works end-to-end
- [ ] Breach Response logs incidents, countdown shows, CRON fires
- [ ] Board PDF has all 7 sections (M1–M8 data)
- [ ] All public routes have CORS headers
- [ ] Mobile layout works at 390px on all pages
- [ ] No secrets in `src/` directory
- [ ] All env vars set in Vercel Production + Preview
- [ ] Vercel Cron shows M8 escalation at */15 minutes

After P1.5: platform is tagged `v1.5.4` and **beta-ready for Milestone 1 (Controlled Beta)**.

---

## Key Technical Decisions in P1.5

**Per-org reference numbers (universal rule):**  
All reference numbers (grievance, DSR, breach) must use composite `UNIQUE(organization_id, reference_number)` — never global unique. M5 and M8 already had this correct; M4 needed fixing.

**CRON_SECRET approach:**  
`CRON_SECRET` header on the escalation endpoint (rather than IP allowlisting) allows easy local testing via curl and is the pattern Vercel recommends for cron-triggered routes.

**M9 board data graceful degradation:**  
M9 board queries must catch table-not-found errors and return zeros — so M9 doesn't break if someone runs FIX3 before FIX2 (before ropa_entries exists in Supabase).
