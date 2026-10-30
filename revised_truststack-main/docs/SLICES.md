# Slice plan — canonical

This is the single authoritative sequence. `docs/spec/05_*.md` contains an older
13-phase outline; it is frozen historical context and is **superseded by this file**.

Status: 🔲 not started · 🟡 in progress · ✅ done
Prompt: **full** = ready to run · *stub* = promoted by the Sync Step of the prior slice

| # | Slice | Ships | Wk | Status | Prompt |
|---|---|---|---|---|---|
| 0A | Scaffolding | Repo, CLAUDE.md, docs system, CI skeleton | 1 | ✅ | full |
| 0B | Walking skeleton | Supabase, RLS, auth, 1 API, 1 page, CI, deploy | 1 | ✅ | full |
| 1 | Tenancy, identity, RBAC | users, org_users, roles, permissions, org switcher, invites | 2–3 | ✅ | full |
| 2 | Org profile + scope wizard | industries, departments, systems, vendors, risk tags | 3–4 | ✅ | full |
| 3 | Question bank + generation | 98 core + 1,429 industry questions, triggers, version snapshot; University baseline = 98 + 10 (D-031) | 4–5 | ✅ | full |
| 4 | Keystone: one question end-to-end | response → evidence (signed URL) → **cap** → score → tile | 6 | ✅ | full |
| 5 | Full scoring engine | 16 domains, red flags, confidence, parity gate, immutable snapshots | 7–8 | ✅ | full |
| 6 | Gaps + actions | derived gap register (adjusted ≤ 3), P0–P3, owners, 30/60/90 roadmap, closing on evidence or review | 9–10 | ✅ | full |
| 7 | ROPA register | records, completeness /100 and a versioned risk floor derived in SQL, the DPDP structure (D-065), Excel/CSV import and export (D-063, D-067), ROPA gaps on the shared action workflow (D-060, D-062) | 11 | ✅ | full |
| 8 | Dashboards | executive overview (frozen + provisional score, never blended), 16-domain scorecard, the ten ROPA metrics, actions across both parents by owner and 30/60/90, black-box bank (D-068, D-069) | 12 | ✅ | full |
| **9** | **TrustStack Intelligence** | penalty exposure per Schedule head (ceilings, status, indicative band with s.33(2) reasons), deadline forecast, leverage + what-if, Exposure Command Centre; Board brief, DPO report, owner packs, regulator-ready evidence pack, XLSX exports — all versioned, signed, audited, caveated | 13–14 | ✅ | full |
| 10 | Workflow modules | Breach, rights + grievance, notice + consent, processors, retention, AI risk — each feeding the exposure model (1.1.0 → 1.5.0, one version per stage) and the one actions view; three stakeholder reports | 14–17 | ✅ live — 8 stages, all approved (D-082 … D-099); exposure model 1.6.0 (D-098); merged as `dd180ec` (PR #28) | **full** (approved 2026-10-11, D-080) |
| 10.5 | Simplicity pass (2026-10-16) ✅ | **B0: the app shell** — old app's look, fixed left menu, fixed top bar with the signed-in role, toasts + notices, pagination, tabs (D-100); then audit every built surface on the non-lawyer rubric (`docs/UX_REVIEW.md`), then fix by journey in small PRs — no rule changes, every gate green | — | ✅ B0 ✅ (D-102) · audit ✅ (D-103) · fixes approved (D-104) · B5 ✅ (D-106) · B5a ✅ (D-109) · B1 ✅ (D-112) · **B0–B1 live** (PR #30 → `cc1dd77`, D-113) · **B2 ✅ live** (PR #35, D-115) · **B3 ✅ live** (PR #36, D-117) · **B4 ✅** (reports, exposure, emails; exposure model 1.7.0 — D-119–D-121, PR #38) · **✅ closed 2026-10-19** | **full** (`SLICE_10_5_simplicity_pass.md`) |
| 11 | AI assistant | gateway, the whole legal corpus in a cached prefix (no pgvector, D-124), structured output, guardrails; drafts for a human (report narration, Rule 7 intimation, notice, responses) | 18–19 | ✅ live — 1a, 1b, 2a, 2b approved (D-126 … D-136); reference set D-137; merged as `49c9eba` (PR #41), 31 migrations on hosted (D-138); the assistant off on the live site until A1 | **full** — approved 2026-10-19 (D-124); four stages 1a · 1b · 2a · 2b (D-123). **1a ✅** (the safe gateway, D-125, D-126); **1b ✅ approved 2026-10-20** (the panel with four explain helpers, thumbs, the AI switch, the reference set 20/20 live — D-127, D-128). **2a built 2026-10-20, at its gate** (drafts for the registers: a ROPA record, the Rule 7(2) intimation, a rights response; accept/discard by a register writer; nothing writes a register — D-129, D-130; reference set 30 cases, drafting 10/10 live). **2a ✅ approved 2026-10-21** (call 15 Option A, D-131). **2b built 2026-10-22, at its gate** (a notice from the consent-based records, its Hindi/Marathi translation with keys kept, a report narrative printed as a new version from the stored figures — D-133, D-134; reference set 40 cases, D11–D20 10/10 live). **2b ✅ approved 2026-10-22** (D-136; call 11 built in the close). **✅ closed and live 2026-10-22** (D-138) |
| 12 | Reassessment | start a full / delta / event-triggered reassessment from a finalised assessment, carry forward, compare baseline vs current (scope change named), trend in the workbook's shape, Reassessment Report; **+ Sentinel S1, the tier card** (D-141) | 20 · 2–6 Nov 2026 | 🔲 next | **full** — written 2026-10-22 (D-136.4), for Aniket's approval: "SLICE_12 approved" |
| 12.3 | DPDP Compass™ Pulse (new, D-144) | the short self-declared assessment: ~20 minutes, plain answers + "I don't know", the declared score (never blended with proven), the five actions ranked by rule, repeat Pulses on Slice 12's carry-forward, **Prove this domain** (Declared → Being proven → Proven), the Board page "You say X. You can prove Y.", Team Pulse + workshop mode, AI-1–AI-5 with guardrails G1–G7; one set of answer words for Pulse and Proof (S1) | 9–20 Nov 2026 | 🔲 after Slice 12 | **full** — `SLICE_12_3_pulse.md`, for Aniket's approval once Slice 12 is merged: "SLICE_12_3 approved" |
| 12.5 | Packs I (new, D-141) | the pack factory (analysis Step 5 §5.5) run for the six cross-industry risk packs (children, vendors, cloud and cross-border, AI, marketing, SDF readiness) + **BFSI** + **Healthcare**; ROPA starter records per pack; the ROPA field hint "other organisations only" (D-140.2); counsel reviews regulator references | 21–27 Nov 2026 (content in parallel from 9 Nov) | 🔲 | *stub* |
| 13 | Hardening + launch readiness | security pass (MFA, failed-access logging), evidence expiry (D-049), reminders, production infrastructure, UAT, decommission old app (D-067); **the job runner and email sender Sentinel needs** (D-141) | 21 · 28 Nov–5 Dec 2026 | 🔲 | *stub* |
| 13.5 | Sentinel S2–S3 (new, D-141) | 23 DPDP controls (17 on data held today), the append-only hash-chained ledger with `verify`, the Sentinel page (status line, no score), daily and on-change runs, alerts + daily digest, actions from failing controls; **Essentials for every client**; legal-clock alerts cannot be switched off (analysis Step 3) | 7–14 Dec 2026 | 🔲 | *stub* |
| 14 | Platform console + licensing → **production launch** | Anix-side console across all clients; one licence per organisation (one industry per unit, refining D-040 when multi-entity ships); **feature selection — ticked modules set the fee, or everything at a fixed fee** (F-67); Sentinel across clients; industry-pack approval (D-040); then go-live (D-067) | 22–23 · 15–23 Dec 2026 | 🔲 | *stub* |
| 15 | Client-hosted deployment (scheduled by D-141) | one-click install in the client's premises or cloud — single-tenant mode, Compose/Helm/Terraform, self-hosted Supabase or Postgres + auth + storage, offline licence, protected question bank, bring-your-own AI provider or a private model | — | 🔲 4–22 Jan 2027 | *none yet* |
| M | Marketing track (new, D-141; parallel, own session, `apps/site`) | industry landing pages from the pack files (BFSI, Health, University first); lead form with our own notice and consent; the public chatbot on the guarded gateway (live only after A1) | Nov 2026 | 🔲 | *stub* |

**After Slice 15 (D-141):** Phase B before 13 May 2027 — Packs II/III, multi-entity (MU affiliated
colleges), Sentinel S4 (Board pulse, evidence pack), the old app's strengths rebuilt, the engagement
workspace and partner console, DPIA and depth features; Phase C after — law-change watch, Trust Center,
small-business tier, API and Consent Manager integration, connectors. Every feature, its status and
its slice: `docs/reference/feature_register.json` → `docs/reference/FEATURE_TRACKER.html`; the reasoning:
`docs/reference/CONSOLIDATED_FEATURE_ANALYSIS.md` (Steps 1–7, approved 28 Oct 2026).

## Milestones

- **Slice 4** — the product thesis (*evidence caps claims*) runs in code. Once one
  domain works end to end, the other fifteen are repetition, not risk.
- **Slice 9** — commercially sellable. The ₹9.75–12L Institutional Baseline
  engagement needs assessment → evidence → score → ROPA → dashboard → report,
  and **none of the workflow modules**. Those are 90-Day Sprint deliverables.
- **Slice 13** — launch-ready: hardened, evidence expires, reminders run, the
  production infrastructure exists; the old app is retired.
- **Slice 14 — the production launch.** **No pilot** (Aniket, 2026-10-03,
  D-067): TrustStack goes live as a production platform once licensing and the
  Anix-side console exist. Mumbai University is the first production client.
  Supersedes D-040's "pilot first, licensing before the second client".

## Why this order

Tenancy first, because retrofitting it is what kills B2B rewrites. The scoring
engine before the modules that decorate it. The narrow keystone (Slice 4) before
the wide one (Slice 5), so the hard mechanism is proven on one domain before being
repeated across sixteen. Reports before the AI that drafts their prose.
