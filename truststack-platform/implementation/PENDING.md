# TrustStack™ — Pending / Deferred Register

**Single source of truth for everything started-but-not-finished, or deliberately deferred.**
Last updated: 2026-06-29 (after P1.5 FIX4).

> This is the human-readable companion to `Implementation_Planner/tracker-data.json`
> (`pending_actions[]`). When you close an item here, also update the tracker.
> Future modules that are simply *not started yet* live in the roadmap
> (`tracker-data.json` + `progress.md`), **not** here — this file is only for
> loose ends from work already done + intentional deferrals.

---

## 🔴 A. BLOCKERS before Milestone 1 (Controlled Beta)

These MUST be done before treating the platform as beta-live.

- [ ] **FIX4 manual sign-off** — the interactive half of production hardening. Needs a running app + browser + Vercel; cannot be verified from code. Full checklist in `progress.md` → "P1.5 FIX4 Sign-Off Checklist". Covers:
  - [ ] Golden-path click-through of every module M1–M10 (incl. FIX1 two-org `GRV-2026-001` check; live board-report PDF showing M5–M8 data).
  - [ ] Mobile responsiveness at 390×844 (sidebar hamburger, no horizontal scroll, forms usable).
  - [ ] Vercel env vars set in **Production + Preview** (all 6 required + optional `CRON_SECRET`).
  - [ ] Production deploy verification (`/login` loads, unauth routes 307, public widget CORS present).
  - _Note: Claude can drive most of the interactive QA + mobile check if the dev server is running (`npm run dev`, :3011)._

---

## 🟡 B. Optional / hardening follow-ups (not beta blockers)

- [ ] **M8 breach escalation emails not wired** (FIX2 remainder). `POST /api/breach/escalations/run` is built + `CRON_SECRET`-gated + idempotent, but nothing calls it. Until a scheduler is set up, escalation alert emails never send. To enable: set `CRON_SECRET` in `.env.local` + Vercel, then point Vercel Cron / GitHub Action / Supabase pg_cron (~every 15 min) at that endpoint (`x-cron-secret` or `Authorization: Bearer`). Prompt: `Prompt_Library/P15_FIX2_M6_M8_SQL_And_Cron.md`.
- [ ] **`truststack.in` email domain** — verify in Resend, then swap every `from: 'noreply@anixai.io'` → `noreply@truststack.in`, verify a test send, and update `NEXT_PUBLIC_APP_URL` → `https://truststack.in` in Vercel. Currently sends from the verified `anixai.io` (works, not a blocker).

---

## 🟢 C. Credentials / setup needed BEFORE specific future modules

Gather these before starting the named P2 session so the build isn't blocked mid-way.

- [ ] **Razorpay live keys** (`rzp_live_...`) — before **M12 Billing** (`P2_M12_Billing_Subscription_Engine.md`).
- [ ] **Twilio WhatsApp Business** setup — before **M15 WhatsApp Consent** (`P2_M15_WhatsApp_Consent.md`).
- [ ] **Move `tracker-data.json`** to `src/app/dashboard/admin/tracker/tracker-data.json` when the **Tracker Dashboard** (`P2_Tracker_Dashboard.md`) is built — it reads from that path.

---

## 🔵 D. Deferred by design (revisit when the trigger condition is met)

- [ ] **M9 Layer 3 — industry benchmarking** ("vs. the average [industry] company"). Deferred until there are **20+ assessments** in the system (meaningless below that). Trivial query to add later in the results/overview page.
- [ ] **Consent widget: 3 languages fall back to English** — Kashmiri (`ks`), Santali (`sat`), Manipuri (`mni`). Their specialised scripts can't be responsibly machine-translated for legal consent text; needs professional localization before claiming 22-language support.

---

## Status snapshot (P1.5)

| Fix | State |
|---|---|
| FIX1 — M4 reference bug | ✅ Live (`v1.5.1`) |
| FIX2 — M6/M8 SQL + cron | 🟡 SQL live; cron optional-pending (§B) |
| FIX3 — M9 board M1–M8 | ✅ Live (`v1.5.3`) |
| FIX4 — production hardening | 🟡 Automated ✅; manual sign-off pending (§A) |

**Next feature work after P1.5 sign-off:** P2 → **M11 Team Management** (`P2_M11_Team_Management.md`).
