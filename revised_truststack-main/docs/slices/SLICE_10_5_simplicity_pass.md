# SLICE 10.5 — Simplicity pass: every built surface to the non-lawyer bar

**Branch:** B0–B1 on `slice/10-5-simplicity`, shipped in PR #30 (merged 2026-10-17
as `cc1dd77`, live — D-113); **B2 onwards branch off `main` and PR into `main`** · **Est:** 1 app-shell session (B0), 1 audit session (A),
then 2–4 fix sessions · **Ships:** a professional app shell in the old app's
look, and every screen, document and message from Slices 0–10 made **legally
exact, yet simple for a non-lawyer**, with nothing broken.

> **STATUS: FULL PROMPT.** Written 2026-10-16 (D-099) from Aniket's product
> goal: *"simplify the DPDP complexity for the organization. People should
> love our platform for its flexibility, simplicity, ease to use, excellent
> customer experience."* **Order: Stage B0 (the app shell) first — Aniket asked
> for it on 2026-10-16 (D-100), so it is approved as specified in §1** and
> starts on "Start Slice 10.5 Stage B0" — **✅ approved 2026-10-17 (D-102)**. Then **Stage A (the audit)**,
> read-only, inside the new shell ("Start Slice 10.5 Stage A"). Each later fix
> batch (B1 onwards) needs Aniket's approval of the fix list first:
> "Simplicity fixes approved" (or "approved with changes: …").
>
> **Stage A ✅ done 2026-10-17 (D-103)** — the fix list (F1.1–F5.6), the
> ranked top 12 and five questions (Q1–Q5) are in `docs/UX_REVIEW.md` §4
> "Stage A". §3 below is promoted to the batch prompt.
> **Batch B5 ✅ approved and merged 2026-10-17 (D-105, D-106).**
> **Batch B5a ✅ approved and merged 2026-10-17 (D-107–D-109)** — the processor
> questionnaire in sections and the paging guard.
> **Batch B1 ✅ approved and merged 2026-10-17 (D-110, D-112)** — PR #33 into the
> slice branch.
> **Batch B2 ✅ approved and merged 2026-10-18 (D-114, D-115)** — PR #35 into
> `main`, live.
> **Batch B3 ✅ approved with one change and merged 2026-10-18 (D-116, D-117)** —
> PR #36 into `main`, live; s.7(a) reads "…and has not said they do not consent to
> its use (s.7(a))".
> **Batch B4 ✅ approved and merged 2026-10-19 (D-119–D-121)** — exposure model 1.7.0
> (Q1) and F4.1–F4.9, N3, N4, PR #38 into `main`, the migration on hosted.
> **Slice 10.5 is closed.** Walk-through `docs/testing/SLICE_10_5_batch4_walkthrough.md`,
> manual test `…_batch4_manual_test.md`.
>
> ## ✅ SLICE 10.5 CLOSED (D-121). Next: **Slice 11** — `SLICE_11_ai_assistant.md`, on "SLICE_11 approved". Everything in this file is history.
> (The gate below was run on 2026-10-19.)
> On approval (§3.4 "Deliverables and gate"): record it in DECISIONS, merge the PR,
> wait for the production deploy, apply `20261019000000_exposure_model_1_7_0` to
> hosted at once, `node tools/gen_db_types.mjs --check`, check the live site's
> signed-out pages, flip STATE / SLICES / UX_REVIEW / this file to ✅ — **closing
> Slice 10.5** — rebuild the local DB, and run the handover check (PLAYBOOK §6)
> for **Slice 11** (`SLICE_11_ai_assistant.md`, re-synced by B4; awaiting
> "SLICE_11 approved"). §1–§3.4 are then history.

---

## 0. Session bootstrap (every batch session — updated after B3, D-117)

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. **D-011, D-068, D-069,
   D-071, D-086.1, D-099–D-117**), **`docs/UX_REVIEW.md`** (§1 the rubric, §2 the
   register, §4 "Stage A" — the approved fix list, and "Additions approved" — N1–N7)
   and this file. `docs/PLAYBOOK.md` is loaded with CLAUDE.md.
2. Start from `main`, up to date: `git checkout main && git pull`. PR #30
   (`cc1dd77`, D-113), PR #35 (D-115) and PR #36 (D-117) are merged, so `main` holds B0,
   B5, B5a, B1, B2 and B3 and is what the live site serves.
   `slice/10-5-simplicity` is finished — do not branch from it.
3. Create the batch branch: `git checkout -b slice/10-5-bN-<name>` (B3:
   `slice/10-5-b3-registers`; B4: `slice/10-5-b4-reports`). Its PR targets **`main`** (D-104.9): merging it,
   after Aniket's approval, puts the batch on the live site. A batch with a
   migration (B4's model 1.7.0) follows CLAUDE.md's hosted-migration rule.
4. Local stack only (details: `docs/PLAYBOOK.md` §2). Build the env from `npx -y supabase@2.117.0 status -o env`
   (API_URL → `NEXT_PUBLIC_SUPABASE_URL`, ANON_KEY, SERVICE_ROLE_KEY, DB_URL →
   `DATABASE_URL` and `DIRECT_URL`, plus CI's `SEED_USER_PASSWORD` and
   `ACTIVE_ORG_COOKIE_SECRET` from `.github/workflows/app.yml`) and `source` it
   before any gate — `.env.local` points at the **live** database. Rebuild clean:
   `npx -y supabase@2.117.0 db reset` → `pnpm db:migrate` → `pnpm db:seed`.
5. Gates green before writing code — baseline after B3: core **1,292**, web unit
   **583**, RLS **541**, all **23** CI SQL gates (run through a `psql` shim into
   `supabase_db_truststack`; the seed-count gate differs locally only in the
   audit-log count), e2e **423** (one worker locally, production build; a single
   sign-in/Auth flake that passes alone is the known open loop). How to run every
   gate in one go: `docs/PLAYBOOK.md` §2.
6. Remind Aniket in one line of client-hosted deployment (proposed Slice 15).

## 1. Stage B0 — the app shell (first; approved by Aniket's request, D-100)

Aniket, 2026-10-16: *"modify the stylesheet of our new app just like old app,
also we need pagination wherever it is applicable. The notification messages
must be clear to visualise … lot of scrolling … Can we have the menu fixed of
left hand side. Systematic login details also fixed at top right corner. On
every page user must see the logged in as which role … professional, simple
to use."*

**The reference** — the old app (`aniketmhala/dpdp` → `truststack-platform/`,
frozen): `tailwind.config.ts`, `src/app/globals.css`,
`src/app/dashboard/layout.tsx`, `src/components/dashboard/{Sidebar,Topbar}.tsx`.
Its look: a **navy sidebar** (`#003366`, white text, the active item on
`white/15`, icons, collapsible to icons only), a **white top bar** (56 px,
bottom border, an initials avatar, a user menu), a soft page background
(`#F4F8FC`), **Inter** for text and **Plus Jakarta Sans** for headings, the
palette navy `#003366` / blue `#2563EB` / surface `#F4F7F9` / border `#E2E8F0`
/ text `#0F172A`·`#475569`·`#94A3B8`, and semantic danger / warning / success
colours with light backgrounds (`#FEF2F2`, `#FFFBEB`, `#ECFDF5`).

**Build:**
1. **Design tokens** — the old palette, shadows and radii as Tailwind v4
   `@theme` tokens in `apps/web/app/globals.css` (the new app has no tokens
   today); the two fonts through `next/font` (self-hosted files, so a
   client-hosted install needs no Google call — proposed Slice 15).
2. **App shell** (`app/dashboard/layout.tsx`) — the page is a fixed frame:
   - **Left sidebar, fixed**, navy, with icons (`lucide-react`, ISC — a new
     dependency, record it), grouped: *Overview* · **Programme**: Assessments,
     Actions, Exposure, Reports · **Registers**: Processing, Breaches, Rights &
     grievances, Notice & consent, Processors, Retention, AI risk · **Settings**:
     Organisation, Scope, Users, Question bank. The active page highlighted;
     collapsible to icons (remembered per browser); on a phone, a drawer behind
     a menu button. **Every `<Can>` permission gate and every `nav-*`
     `data-testid` stays exactly as today.**
   - **Top bar, fixed**: the page title on the left; on the right the
     organisation switcher and the user block — initials avatar, name and a
     **role badge** ("Legal User"), under it the organisation name — with a
     menu (profile details, **Sign out**). The role comes from the existing
     permissions context (`roleName`), so every page shows **who is signed in,
     as which role, in which organisation**.
   - **Content scrolls on its own**; full width with a comfortable maximum
     (not today's narrow `max-w-4xl`).
3. **Notifications, one system, clear to see** — (a) **toasts** for transient
   outcomes (top right, icon + coloured edge + title + one line; success
   auto-dismisses after 4 s, warnings and errors stay until closed; `aria-live`),
   built in-house (a small context, no extra dependency); (b) one **`<Notice>`**
   component (info / success / warning / error) for messages that must stay on
   the page — refusals, legal notes, the s.37 warning. Existing message
   elements keep their `data-testid`s (e2e reads them) and are restyled
   through `<Notice>`; a toast is added where the result was easy to miss.
4. **Pagination and less scrolling** — one **`<DataTable>`**: page size 25
   (25 / 50 / 100), page numbers, "showing 1–25 of 140", sortable columns, a
   search box where a list can grow, and a sticky header. Used first on every
   list that grows: the registers (ROPA, breaches, rights, consent records,
   processors, retention, AI), Actions, Reports, evidence lists, Users, the
   question bank. **Client-side** over the rows the readers already return
   (no API change; the counts stay the readers' own — D-069); server-side
   paging is a later step if a list passes ≈ 1,000 rows. **Long detail pages**
   (a breach, a request, a schedule, a vendor, an assessment) get **tabs** —
   e.g. a breach: Timeline · Documents · Actions · Details — instead of one
   endless page; the first tab is the one that needs action.
5. **Public pages** (`/p/...`, `/v/...`, the widget) keep their own light
   layout (no sidebar) but take the tokens and the `<Notice>`, so they look
   like the same product.

**Safety:** no API, permission, model or migration change; every
`data-testid` kept; every gate green (core, unit, RLS, every CI SQL gate, the
full e2e — selectors that rely on the old layout are updated, never deleted);
before/after screenshots of every page on a laptop and a phone; a walk-through
and a manual test (`docs/testing/SLICE_10_5_b0_{walkthrough,manual_test}.md`);
`docs/UX_REVIEW.md` §4 gets a dated entry (shell items R2, R6, R8, R9, R10, R11).
Gate: Aniket approves the shell on his laptop ("Stage B0 approved").

## 2. Stage A — the audit (one session, read-only, no code change)

> **Re-synced after B0 (D-102).** B0 is approved and every surface now sits in
> the new shell. B0's before/after screenshots of 37 pages are in
> `docs/testing/slice10_5-b0/`; `docs/UX_REVIEW.md` §4 lists what B0 already
> moved (R2, R6, R8–R11) and what it left for this audit (the overview's raw
> role code, headings that repeat the top bar's title, the gap register and
> per-item evidence lists not paged, the scope wizard and the ROPA record as
> long single pages). Score what the user sees **now**, not before B0.

1. Start the app on the local stack and walk **every surface in
   `docs/UX_REVIEW.md` §2** (U01–U44) as its real user — MU's seeded people
   (Dean, DPDP Owner, Legal, CISO, Admin, a department owner), a Data
   Principal on the public pages, a vendor on the link page — on a laptop
   width and a phone width. **`tools/ui_shots.mjs`** takes the laptop and phone
   screenshots of the 37 dashboard and public pages in one run (local env
   exported; open BML's public pages on the LOCAL database for the `/p/…`
   pages, then close them). Add the surfaces it does not reach by hand: the
   emails (U03), the PDFs and spreadsheets (U21–U28 — generate them only on a
   disposable tenant, pitfall 4), the widget (U42) and the vendor link (U43).
2. For each surface: a screenshot; a score on **R1–R11**; the top issues in
   one line each; the proposed fix; the effort (S/M/L); the risk (copy only ·
   layout · behaviour).
3. Rank by impact: Data Principals' public surfaces and first-run first; then
   what users touch most (overview, assessment, actions); then the registers;
   then reports and exports.
4. Write it all into `docs/UX_REVIEW.md` (§2 filled, §4 a dated entry) and a
   **fix list** grouped into batches by journey: (B1) first-run and the
   overview; (B2) assessment, evidence and gaps; (B3) the registers; (B4)
   reports and exports; (B5) public surfaces.
5. Gate: Aniket reviews the scores and the fix list; nothing is fixed before
   his approval. Commit and push the docs; tell him the one line that starts
   the first fix batch.

## 3. Stages B1 onward — the fixes (one batch per session)

> **Promoted after Stage A (D-103).** The fixes are `docs/UX_REVIEW.md` §4,
> "Stage A" — each with its surfaces, effort and risk. A batch starts on
> "Start Slice 10.5 Batch Bn" once Aniket has approved the list.
> **✅ Approved 2026-10-17 with the recommendations (D-104): order B5, B1, B2,
> B3, B4; Q1 → model 1.7.0 in B4; Q2 relabel in B4; Q3 display rule; Q4 line
> now, reset flow by Slice 14; Q5 a UX fix.** Branch per D-104.9.
> **B5 ✅ (D-106) · B5a ✅ (D-109) · B1 ✅ (D-112) · B2 ✅ (D-115) · B3 ✅ (D-117) · B4 ✅ (D-121). Slice 10.5 closed.**
>
> - **Order (recommended):** B5 public surfaces and B1 first-run first, then
>   B2 assessment, B3 registers, B4 reports. Aniket may reorder.
> - **Before a batch:** re-read its rows in §4 and Aniket's approval message
>   (in DECISIONS) — a fix he struck or changed is done his way; answers to
>   Q1–Q5 decide F4.2/F4.3 (Q1), the "ceilings" label (Q2), F1.4/F4.6 (Q3),
>   F1.9 (Q4) and F1.1 (Q5).
> - **Q1, if approved,** is a model change, not a UX fix: count every open
>   action in the forecast and the work tiles (`readExposureInput` passes all
>   five sources), a new model version, its snapshot pin in CI and the
>   seed-count gate — its own DECISIONS entry, folded into B4.
> - **Wording that e2e asserts** (headings, status words, the s.37 note, the
>   Actions purpose line, register names) changes with the approved wording;
>   search `e2e/` and `tests/` for the old string before changing it.
> - **Evidence:** `tools/ui_shots.mjs` for before/after of the batch's pages;
>   the audit's own shots are in `docs/testing/slice10_5-a/`.

- **No rule changes.** Copy, layout, empty states, guided next steps, defaults,
  glossing, consistency, accessibility. A change that would alter a model
  rule, a permission or a legal position is stopped and raised as a DECISIONS
  question.
- **Legal text stays exact**: citations, statute vs TrustStack defaults,
  D-011's caveat verbatim; checked against `docs/legal/`.
- **Nothing breaks**: `data-testid`s and API shapes unchanged; a test that
  asserts wording changes only with the approved new wording; every gate
  green (core, unit, RLS, every CI SQL gate, e2e).
- **Each batch**: before/after screenshots, a walk-through and a step-by-step
  manual test (`docs/testing/SLICE_10_5_batchN_{walkthrough,manual_test}.md`),
  its own PR; the register's rows move to ✅ with the commit.

> **Added 2026-10-17 (D-107, D-108): the paging guard.** Every batch from B5a
> on runs under `apps/web/tests/unit/paging-guard.test.ts`: a list a page renders
> row by row outside `<DataTable>` needs an allowance with its reason. When a
> batch pages a list (F2.5, N2–N7 …), lower that file's allowance and drop its
> "owed" words in the same commit — the test fails until it does. B2 owes N2, N5;
> B3 N6, N7; B4 N3, N4 (`docs/UX_REVIEW.md` §4, "Additions approved").

## 3.1 Batch B1 — first-run and the overview (✅ approved and merged 2026-10-17, D-110, D-112 — history)

**Start line:** "Start Slice 10.5 Batch B1". **Branch:** `slice/10-5-b1-first-run`
off `slice/10-5-simplicity` (§0). **Approved:** D-104 (the fix list with the
recommendations; Q3, Q4, Q5 answered) and D-106 (F1.12 added). **Surfaces:**
U01, U02, U04, U05, U06, U07, U08, U13, U44, and the public intake form's
failed-code message (U40). **No API, permission, model, migration or seed
change; every `data-testid` kept.** If a fix below cannot be done without one,
stop and ask Aniket — do not build it.

### The fixes — build exactly these (wording in quotes is approved)

| ID | Where | What to build |
|---|---|---|
| F1.1 | `app/dashboard/page.tsx`, `organization-panel.tsx` (+ a new panel) | Replace the overview's "Signed in as … `role_code`" panel (the top bar already shows it) with **"Your next steps"**: the signed-in person's own open actions (overdue first, then by due date; each a link to its register page), and for the programme roles (DPDP Programme Owner, Organisation Admin, Consultant, Executive Sponsor) the single most urgent register item the overview already reads (e.g. an overdue erasure, a Board report due). **Only data the page already loads** (`/api/v1/organizations/{id}/dashboard`, `/api/v1/auth/me`), filtered to the user in the browser. If "evidence awaiting your review" needs a reader that does not exist, leave it out and note it in the walk-through. Every panel stays behind its existing `<Can>` gate (Q5) |
| F1.2 | `organization-panel.tsx` | Industry as its label, not the code: "University / Higher Education · consultant-assisted" (labels from the scope wizard's industry list) |
| F1.3 | `exposure-strip.tsx` | "208 days to 13 May 2027 · finish date: not enough history yet" (the number and the forecast state come from the model, unchanged) |
| F1.4 | `executive-overview.tsx` (readiness tile, scorecard) | Lead with progress — "1 of 124 questions answered" — then the score; gloss coverage as "the weight of the domains that apply". **Q3:** a domain with no answered question shows **"Not started"** instead of "Needs Work" — a display rule only; the engine's `needs_work`, the score and the workbook oracle are untouched |
| F1.5 | `app/dashboard/actions/actions-dashboard.tsx` | A **"My actions"** tab, first and selected by default for anyone who owns at least one action; programme roles keep "By owner" first. The purpose line names all five sources: "…from the assessment, the processing register, and the breach, rights and retention registers…" |
| F1.6 | every dashboard page whose `<h1>`/heading repeats the top bar's title (Actions, Breach register, Users, …) | Drop the repeated heading; keep the one-line purpose under the top bar. The top bar's title stays the page's `<h1>` (D-101.4) |
| F1.7 | `components/shell/topbar.tsx` | Phone width: the page title gets the room (no "Processi…"); the role badge moves into the account menu on a phone. Laptop unchanged |
| F1.8 | `app/dashboard/users/users-panel.tsx` | A purpose line ("Who can sign in to {organisation}, and what each role may do."); the role list offers **only roles the signed-in admin may assign** — decide with `assertCanAssignRole`/the role matrix from `@truststack/core` (D-068: an admin never sees "Anix AI Consultant"); a "What can each role do?" fold-out read from the same matrix; "Active" with a capital |
| F1.9 | `app/login/login-form.tsx`, `app/invites/accept/accept-form.tsx`, `app/page.tsx` | Sign-in: one line on what TrustStack is ("DPDP readiness for your organisation — assessments, registers and reports.") and **"Forgot your password? Ask your organisation's admin."** (Q4 — no reset flow; that is Slice 14). A dead invitation adds "Ask your organisation's admin to send a new invitation." |
| F1.10 | `app/dashboard/organization/page.tsx` | Heading "Organisation settings"; industry as its label; the four settings (profile, SDF notification, Third-Schedule class, public pages) as tabs with the existing `<Tabs>` (D-101), profile first |
| F1.11 | `app/dashboard/scope/scope-wizard.tsx` | "Next" saves the step and moves on (one primary button); "Back" secondary; the separate "Save answers" button folded into Next. Client-side only — the same save call the button makes today |
| F1.12 | `app/p/[slug]/intake-form.tsx` (code step) | When the code email could not be sent, **one** message: "We could not send the email just now. Wait a minute, then choose Send a new code. Nothing reaches {organisation} until a code is entered." — not two |

### Tests — pin every fix, delete none
- **e2e:** extend `ui/dashboard`, `ui/tenancy`, `ui/sign-in`, `ui/invite`,
  `ui/scope`, the Actions specs and `ui/intake`: "Your next steps" shows the
  user's own action and not another's; a department owner lands on "My
  actions"; an admin's role list has no consultant; "Not started" on an
  unanswered domain; the sign-in line; the scope wizard's Next saves (reload
  shows the answer); the single failed-code message. Search `e2e/` and
  `tests/` for every old string first ("Signed in as", "Needs Work",
  "Save answers", page headings) and change the assertion only to the approved
  wording.
- **Unit:** the "Not started" display rule (a domain with zero answered
  questions, a domain with one); the assignable-roles filter against the
  matrix; "x days to …" text.
- **Check D-101's `tests/unit/app-shell.test.ts`** still passes — shell test
  ids must not be reused by a page.

### Deliverables and gate
1. Every gate green locally (§0.5 list) and on CI.
2. Before/after screenshots of every B1 surface at laptop and phone width,
   as `.webp`, in `docs/testing/slice10_5-b1/{before,after}/` (`tools/ui_shots.mjs`
   plus the role overviews as the Dean, the Controller of Examinations and the
   Admin).
3. `docs/testing/SLICE_10_5_batch1_walkthrough.md` in the **B0/B5 standard**:
   intro (how it was opened, decisions, "nothing about the data, the law or who
   may do what changed", the manual test, the gate phrase) · What you are
   approving · before/after tables · What did not change · **Claude's calls —
   confirm or change**, each with a DPDP-consultant verdict, its citation
   checked in `docs/legal/` with `pdftotext`, and the risk · Evidence.
4. `docs/testing/SLICE_10_5_batch1_manual_test.md` in the B5 standard: before
   you start (Docker, checkout, `pnpm dev` on 3001, the password), then numbered
   **Do / Expect** steps, one per fix, with fallbacks; tidy-up at the end.
   **Do every prerequisite for Aniket** (start the app in his Terminal panel, any
   setup step) when he asks.
5. `docs/UX_REVIEW.md`: re-score the B1 rows in §2 (✅ where every check passes)
   and a dated §4 entry; `docs/STATE.md` and `docs/DECISIONS.md` (D-107 for the
   calls); this file: B1 status, and **§3.2 — the full prompt for B2**, written
   against the code as it then stands.
6. Commit, push, open the PR into `slice/10-5-simplicity`, bind it, offer
   Auto-fix. Gate: Aniket's **"Batch B1 approved"** after his manual test; then
   merge the PR into the slice branch.

**After B1:** B2 (assessment, evidence and gaps — F2.1–F2.7, Q3 on the
scorecard), then B3 (registers — F3.1–F3.12), then B4 (reports and exposure —
F4.1–F4.9, **Q1: model 1.7.0, every action source in the forecast**, Q2 "Statutory
ceilings at stake").

## 3.2 Batch B2 — assessment, evidence and gaps (✅ approved and merged 2026-10-18, D-114, D-115 — history)

**Start line:** "Start Slice 10.5 Batch B2" — B1 is approved, merged and live
(D-112, D-113; `main` @ `cc1dd77`). **Branch:** `slice/10-5-b2-assessment` off
`main` (§0); its PR goes into `main`. **Approved:** D-104
(F2.1–F2.7; Q3 "Not started" on the scorecard), D-107 (N2, N5), D-110 (B1's
calls 3 and 8 carry here). **Surfaces:** U09, U10, U11, U12, U16. **No API,
permission, model, migration or seed change; every `data-testid` kept.** If a
fix cannot be done without one, stop and ask Aniket.

### What B1 left you (use it, do not rebuild it)
- `@truststack/core`: `answeredProgress(domains)` (answered — N/A counts — of
  generated), `domainStatusLabel(d)` + `DOMAIN_NOT_STARTED_LABEL` (Q3),
  `ownOpenActions`, `isProgrammeRole`, `assignableRoles`, `roleCapabilities`.
- `<Scorecard domains notStarted />` (`assessments/[assessmentId]/score-panel.tsx`)
  — **B2 turns `notStarted` on for the assessment page** (Q3 on the scorecard).
- `<Tabs>` (`components/ui/tabs.tsx`, steps style + controlled), `<SteppedTabs>`,
  `<DataTable>` (`components/data/data-table.tsx`, `Column<T>` exported),
  `lib/client/industries.ts` (`useIndustryLabel` — never import core's
  `INDUSTRIES` into the browser: it carries pack codes, D-071; a unit test guards it).
- The paging guard (`tests/unit/paging-guard.test.ts`) owes B2: **N5**
  (`assessment-list.tsx`, 1), **N2** (`assessment-detail.tsx`, the "owed" half of
  its 2), **F2.5** (`register-documents.tsx` 1, `ropa/gaps/ropa-gaps.tsx` 1,
  `processors/[vendorId]/processor-detail.tsx` and `ropa/record-view.tsx`
  evidence). Lower each allowance and drop its "owed" words in the same commit.

### The fixes — build exactly these (wording in quotes is approved)

| ID | Where | What to build |
|---|---|---|
| F2.1 | `assessments/[assessmentId]/assessment-detail.tsx` (header, domain cards) | "In progress · 1 of 124 answered · 33 may not apply — confirm or answer them" (status as a label, never `in_progress`; the counts from `answeredProgress` and the existing Potentially Applicable count); a progress bar; each domain card "answered x of y" |
| F2.2 | `answer-panel.tsx` (maturity picker) | The engine's own level names with a one-line meaning each, from core's `MATURITY_BANDS` labels ("Level 0 - Not Started" … "Level 5 - Continuous Assurance"). **Check first:** those labels name score-percent bands; using them for the claimed level 0–5 is a wording call — put it to Aniket as a walk-through call with a DPDP-consultant verdict |
| F2.3 | `answer-panel.tsx` (lines ~80, ~270) | "Reviewed: Partial (evidence level 3 of 5) — this answer counts at most 3"; the `E3` code kept in a `title` tooltip. The cap stays `EVIDENCE_CAP` (E0→1 … E5→5) — never restate the table in the browser |
| F2.4 | `assessment-detail.tsx` | A "Questions for my role" filter: the question's `suggestedOwner` matched to the user's role (`usePermissions().value.role` / `roleName`) — **the default for a department owner**; everyone can switch to all. Display only: RLS and the API still decide what a role may answer |
| F2.5 | `gaps/gap-register.tsx`, `ropa/gaps/ropa-gaps.tsx`, `register-documents.tsx` | Gap register and register gaps through `<DataTable>` (25 a page, searchable, sortable); evidence lists on an item paged past ten |
| F2.6 | `assessments/assessment-list.tsx` | Status label; "17 Oct 2026" (not `toLocaleString`); "answered x of y"; one "Open" — **and N5**: the list through `<DataTable>` |
| F2.7 | `questions/question-bank-browser.tsx` | A purpose line; "Draft" / "Approved"; "201 questions" (a unit on every count). Anix-only page (D-068) |
| N2 | `assessment-detail.tsx` | One domain at a time — `<Tabs variant="steps">` (sixteen pills, wrapping) with "answered x of y" badges (green when complete), Previous / Next domain, an "Unanswered only" filter. Panels stay mounted; the chosen domain in the hash |
| Q3 | `assessment-detail.tsx` → `<Scorecard notStarted />` | "Not started" on the assessment page's scorecard (display only) |
| D-110.3 | — | "Evidence awaiting your review" on the overview's Your next steps: **only if** an existing reader returns it (evidence with `review_status` pending that the user did not upload); otherwise record it again as an open loop |

### Tests — pin every fix, delete none
- **e2e:** `ui/assessments`, `ui/evidence`, `ui/gaps`, `ui/scoring`,
  `ui/dashboard` (assessment page) and the ROPA gaps spec: the header line and
  progress bar; a domain at a time (pills, Next domain, Unanswered only); the
  department owner's default "Questions for my role"; evidence in words with the
  tooltip; the paged gap register (find a gap through search); the assessments
  list's label and date; the bank's purpose line and units. Search `e2e/` and
  `tests/` for every old string first ("answered as asked", "Potentially
  Applicable", "capped by E", `in_progress`, "generated ") and change an
  assertion only to the approved wording.
- **Unit:** the role filter (suggested owner ↔ role), the evidence sentence, the
  paging guard lowered.

### Deliverables and gate
As §3.1's: every gate green locally and on CI; before/after `.webp` shots in
`docs/testing/slice10_5-b2/` (laptop and phone; the assessment page as the
Registrar and the Controller of Examinations); `SLICE_10_5_batch2_walkthrough.md`
and `…_manual_test.md` in the B1 standard; `UX_REVIEW.md` §2 rows U09–U12, U16
re-scored and a dated §4 entry; STATE, DECISIONS (next free D-number), this
file's B2 status and **§3.3 — the full prompt for B3**; commit, push, PR into
`main`, bind it, offer Auto-fix. Gate: **"Batch B2 approved"** — then merge
(it goes live) and check the live site's signed-out pages.

## 3.3 Batch B3 — the registers (✅ approved with one change and merged 2026-10-18, D-116, D-117 — history)

**Start line:** "Start Slice 10.5 Batch B3" — only once B2 is approved and its
PR merged into `main` (§0's guard). **Branch:** `slice/10-5-b3-registers` off
`main`; its PR goes into `main`. **Approved:** D-104 (F3.1–F3.12 as written in
`docs/UX_REVIEW.md` §4 — re-read the rows), D-107 (N6, N7), D-110.10 (F3.1 now
only aligns menu labels: the repeated page headings went in B1). **Surfaces:**
U05 (menu), U14, U15, U17, U18, U29–U38. **No API, permission, model, migration
or seed change; every `data-testid` kept.** If a fix cannot be done without
one, stop and ask Aniket.

### What B1 and B2 left you (use it, do not rebuild it)
- `<Tabs>` (`variant="steps"`, controlled `value`/`onValueChange`, hash-kept),
  `<SteppedTabs>` (Back/Next, `onNext` can save first — B5a's questionnaire and
  B1's scope wizard use it), `<DataTable>` (search, sort, 25 a page),
  **`<PagedList>`** (`components/data/paged-list.tsx`, a short list paged past
  ten — B2), **`<ProgressBar>`** (`components/ui/progress-bar.tsx` — B2),
  `<Notice>` + `useToast()`.
- The pattern for wording rules: framework-free helpers in core with unit tests
  (B2's `packages/core/src/assessment-display.ts`), a web unit test guarding
  what pages may say (`apps/web/tests/unit/assessment-pages.test.ts`).
- **The paging guard owes B3:** `ropa/import/ropa-import.tsx` (3 → 1: the
  preview and the rejected rows, **N6**) and `ropa/lookup/ropa-lookup.tsx` (1 →
  0, **N7**). Lower each allowance and drop its "owed" words in the same commit.

### The fixes — build exactly these (wording in quotes is approved)

| ID | Where | What to build |
|---|---|---|
| F3.1 | `lib/client/nav.ts` | Menu label = the top bar's title, one name per register: "Processing register" · "Breach register" · "Rights and grievances" · "Notice and consent" · "Processors" · "Retention register" · "AI risk register" (titles too, where they differ — e.g. "Rights & grievances" → "Rights and grievances"). Check the menu still fits at laptop width and the phone drawer; `app-shell.test.ts` must pass |
| F3.2 | `ropa/record-view.tsx` (new and existing record, 1,126 lines) | The form in tabs — **Who and what · Purpose and ground · Systems and processors · Retention and security · Evidence** — each tab's badge its completeness points (the record's own `areas`, never recomputed in the browser — D-061); **Save stays one button** (sticky, saving every tab); panels stay mounted (a half-filled tab survives a switch). Map every existing `AreaSection code=…` to one tab and say which in the walk-through |
| F3.3 | `ropa/ropa-register.tsx` | "Add a processing activity" the one primary button; Import, Export, Ask the register, Gaps and actions under a "More" menu (keyboard usable; each keeps its test id) |
| F3.4 | `ropa/record-view.tsx` (risk preview) | A blank record says "Risk: High until the unknowns are answered" (the preview's own risk, unchanged) |
| F3.5 | `packages/core/src/ropa.ts` `voluntary` basis label | "A specified purpose the person voluntarily gave the data for, and has not objected to (s.7(a))" — **legal wording**: check s.7(a) in `docs/legal/` with `pdftotext`; list it for counsel in the walk-through |
| F3.6 | `consent/consent-home.tsx` (628 lines) | Tabs — **Notice · Widget · Consent records**; purpose titles instead of purpose keys in staff views; drop "(exposure model 1.3.0)"; the twenty pending languages folded into one line |
| F3.7 | `consent/notices/notice-editor.tsx` | Validation messages on Save or on leaving a field — not on a blank form |
| F3.8 | `processors/processor-register.tsx`, `processors/[vendorId]/…` | "No accepted assessment" instead of "Never assessed"; the questionnaire summary "43 answered, 1 not applicable, of 44"; unevidenced claims named by question, the code in brackets |
| F3.9 | `retention/retention-register.tsx`, `[scheduleId]/…`, `schedule-fields.tsx` | Periods in years where whole: "10 years", "18 months" (the stored months unchanged; a core helper + unit test) |
| F3.10 | `ai-risk/ai-register.tsx`, `ai-fields.tsx` | The Fourth-Schedule exemption by its short label, the code in brackets |
| F3.11 | `rights/rights-register.tsx`, `[requestId]/…` | "Responded — Fulfilled" / "Responded — Resolved", the same words in the list, the filter and the record |
| F3.12 | `ropa/import/ropa-import.tsx`, `ropa/lookup/ropa-lookup.tsx` | Import: a template to download (the columns the importer already reads — no new parser); Look-up: a purpose line, and people types folded by case and plural ("Student" / "students" once) |
| N6 | `ropa/import/ropa-import.tsx` | The preview and the rejected rows through `<DataTable>` |
| N7 | `ropa/lookup/ropa-lookup.tsx` | The look-up results through `<DataTable>` |

### Tests — pin every fix, delete none
- **e2e:** `ui/ropa`, `ui/breaches`, `ui/rights`, `ui/consent`,
  `ui/processors`, `ui/retention`, `ui/dashboard` (menu) and the shell spec:
  the menu names; a record's tabs with their points and one Save (fill two tabs,
  save once, reload shows both); the register's one primary and the More menu;
  the blank record's risk line; the s.7(a) label; consent's tabs and purpose
  titles; no validation on a blank notice; "No accepted assessment"; "10 years";
  "Responded — Fulfilled"; the import template downloads; paged import preview
  and look-up results. Search `e2e/` and `tests/` for every old string first
  ("Never assessed", "Data the person gave for a purpose they asked for",
  "exposure model 1.3.0", "Rights & grievances", the menu labels "Processing",
  "Breaches", "Retention", "AI risk") and change an assertion only to the
  approved wording.
- **Unit:** the period-in-years helper; the s.7(a) label; people-type folding;
  the paging guard lowered (N6, N7).

### Deliverables and gate
As §3.2's: every gate green locally and on CI; before/after `.webp` shots in
`docs/testing/slice10_5-b3/` (laptop and phone; a ROPA record new and existing
as the Registrar, consent, processors, retention, rights, the menu);
`SLICE_10_5_batch3_walkthrough.md` and `…_manual_test.md` in the B2 standard
(F3.5's wording listed for counsel); `UX_REVIEW.md` §2 rows U05, U14, U15, U17,
U18, U29–U38 re-scored and a dated §4 entry; STATE, DECISIONS (next free
D-number), this file's B3 status and **§3.4 — the full prompt for B4** (F4.1–F4.9,
N3, N4, **Q1 model 1.7.0** with its migration, CI pin and seed-count gate, Q2,
Q3 in reports); commit, push, PR into `main`, bind it, offer Auto-fix. Remind
Aniket of client-hosted deployment (Slice 15) in one line. Gate: **"Batch B3
approved"** — then merge (it goes live) and check the live site's signed-out pages.

## 3.4 Batch B4 — reports, exposure and emails (✅ approved and merged 2026-10-19, D-119–D-121 — history)

> **Built as below** on `slice/10-5-b4-reports`. Q1 as D-119 (a `registerActions`
> input; outstanding work only; migration `20261019000000_exposure_model_1_7_0`;
> CI pin 1.7.0; seed count unchanged); the fixes as D-120's ten calls. **The close
> of Slice 10.5, once approved:** nothing is left from the fix list (F1.1–F5.6,
> N1–N7, Q1–Q5 all built). What remains are the open loops in STATE: D-119.6 (the
> forecast's chosen-assessment and actionless-gap units vs the Actions page);
> D-110.3 / D-114.9; D-114.3; D-114.8; s.7(a) and the invitation line for counsel's
> or Aniket's words; U24's evidence-trail cell (R9 🟡, kept); U08's long step and
> U11's question codes (not in the fix list); Q4's reset flow (Slice 14);
> client-hosted deployment (Slice 15).

**Start line:** "Start Slice 10.5 Batch B4" — only once B3 is approved and its PR
merged into `main` (§0's guard). **Branch:** `slice/10-5-b4-reports` off `main`;
its PR goes into `main`. **Approved:** D-104 (F4.1–F4.9 as written in
`docs/UX_REVIEW.md` §4 — re-read the rows; **Q1 → model 1.7.0, built here**; **Q2
"Statutory ceilings at stake"**; **Q3 "Not started" in the reports** (F4.6)),
D-107 (N3, N4), D-110.10 (Exposure's repeated page heading stays for B4 — drop it
with N3). **Surfaces:** U19–U28, U03 (the emails), and the overview's exposure
strip. **The one approved exception to "no model change" is Q1** — a migration, a
new model version, its CI pin; everything else is copy, layout and paging, every
`data-testid` kept. If any other fix needs an API, permission or rule change,
stop and ask Aniket.

### What B1–B3 left you (use it, do not rebuild it)
- `<Tabs>` (controlled, hash-kept; underline or `variant="steps"`), `<SteppedTabs>`,
  `<DataTable>`, `<PagedList>`, `<ProgressBar>`, `<Notice>` + `useToast()`, and
  **`<MoreMenu>`** (`components/ui/more-menu.tsx`, B3 — one primary, the rest
  behind a keyboard-usable disclosure).
- Wording rules as framework-free core helpers with unit tests
  (`assessment-display.ts` B2, `register-display.ts` B3) and a web unit test
  guarding what pages may say (`assessment-pages.test.ts`, `register-pages.test.ts`).
  `domainStatusLabel(d)` + `DOMAIN_NOT_STARTED_LABEL` (B1) are Q3's display rule —
  reuse them in the PDFs (F4.6).
- **The paging guard owes B4:** `exposure/exposure-history.tsx` (1 → 0, N4) and
  `exposure/exposure-command-centre.tsx` (9 — the model's fixed lists stay; drop
  its "owed: tabs, N3" words when N3 lands). Lower each and drop its "owed" words
  in the same commit.

### Q1 — the forecast counts every open action (model 1.7.0, its own DECISIONS entry)
**What is wrong today (checked in the code, 2026-10-18).** The model's gap input
takes two sources only — `ExposureGapInput` is `source: "assessment"` or `"ropa"`
(`packages/core/src/exposure.ts`, ~line 1059), each mapped to penalty heads by
`EXPOSURE_MAPPING`. Breach, rights and retention actions have **no gap row**: they
hang on `gap_actions` by `breach_incident_id`, `rights_request_id` or
`retention_schedule_id` (D-067's one action table; constraint
`gap_actions_one_parent`). So `readExposureInput` (`apps/web/lib/exposure/read.ts`,
`gaps` ~line 159 and `items` ~line 196) and the SQL mirror `app.exposure_input`
(last replaced in `20261017000000_retention_ai_risk`; it builds `gaps` from
`assessment_gaps` and `ropa_gaps` only) both leave them out. The Actions page counts
all five (`apps/web/lib/dashboard/read.ts` `readDashboard`: `assessmentItems`,
`ropaItems`, `breachItems`, `rightsItems`, `retentionItems`). Result: the forecast,
"Critical and high work", "the actions that retire the most exposure" and the
Programme Status source table disagree with the Actions page.

**Build (approved as D-104.1 — no further approval needed; record it as its own
DECISIONS entry):**
1. **A new model input for register actions** — the open actions on a breach, a
   request or a retention schedule (id, owner, due date, status, severity as the
   Actions page's items give it). They count in **pace and outstanding work** (the
   forecast, `outstandingWork` in `intelligence.ts`, the work tiles, the Programme Status source table)
   and **never in head leverage**: `EXPOSURE_MAPPING` and the ranking of "the
   actions that retire the most exposure" are unchanged (D-104.1: "penalty-head
   leverage rules are unchanged"). Read them through the registers' own readers
   (`readBreaches`, `readRights`, `readRetentionFacts` already run inside
   `readExposureInput`; D-069 — no arithmetic of the page's own).
2. **`EXPOSURE_MODEL_VERSION` → `"1.7.0"`** (`packages/core/src/exposure.ts`
   line ~111) and one migration, **`packages/db/prisma/migrations/20261019000000_exposure_model_1_7_0/`**
   (the next date after `20261018000000_slice10_reports`), that `CREATE OR REPLACE`s
   `app.exposure_model_version()` (last in `20261018000000_slice10_reports`, line
   ~335), `app.exposure_input` (add the register actions from `gap_actions`), and
   whichever of `app.exposure_outstanding_work` / `app.exposure_forecast` reads
   them — each keeping its `REVOKE … FROM PUBLIC` and grants exactly as before.
   Then `pnpm db:types` and commit the generated file (D-024).
3. **CI pin** in `.github/workflows/app.yml`, step "A stored exposure snapshot is
   evidence — derived in SQL, written by one RPC, immutable (Slice 9)":
   `[ "$v" = "1.6.0/0.4/0.6/60/20270513" ]` → `1.7.0/0.4/0.6/60/20270513`, with a
   comment line for 1.7.0 (Slice 10.5 B4, Q1). The **seed-count gate** ("Seed is
   idempotent") should not move — no seed change; say so if it does.
4. **Tests:** core units — a breach, a rights and a retention action count in
   `outstandingWork` and the forecast and change no head's leverage; the version
   string; the RLS mirror (`apps/web/tests/rls/exposure-mirror.test.ts`: the
   `app.exposure_evaluate`, `app.exposure_outstanding_work` and
   `app.exposure_forecast` blocks) TS = SQL on inputs that include register
   actions; e2e — the Exposure page's open-action count equals the Actions page's,
   and a Programme Status report (disposable tenant) totals the same. Stored
   snapshots are immutable: old ones keep `1.6.0`; the history shows the version
   per row.
5. **Hosted (CLAUDE.md, D-071 runbook):** the migration only replaces functions —
   no table, grant or revoke change — and no live code compares the TS and SQL
   versions (checked: `apps/web/lib` only reads `model_version` from stored
   snapshots). Order: **merge → wait for Vercel's production deploy → `pnpm
   db:migrate` against hosted at once** (export the hosted env only for that one
   command), then `node tools/gen_db_types.mjs --check`. In the minutes between,
   a snapshot taken would carry 1.6.0 — harmless. List the step in the walk-through,
   the manual test's tidy-up and STATE.

### The fixes — build exactly these (wording in quotes is approved)

| ID | Where | What to build |
|---|---|---|
| Q2 | `app/dashboard/exposure-strip.tsx`, `exposure/exposure-command-centre.tsx`, `packages/core/src/reports.ts` | "Statutory ceilings at stake" replaces "Statutory ceilings where you are exposed" everywhere (one constant in core, used by the app and every PDF); the figure unchanged |
| F4.1 | `exposure-command-centre.tsx` (`exposure-s37`, a red error `<Notice>`) | The s.37 note as a neutral legal note under the tiles (`tone="info"` or a plain note), the citation kept |
| F4.2 | `exposure/exposure-command-centre.tsx` line ~294 (`{projection.outstanding} actions open`) and every count the model's text writes (`intelligence.ts`, `forecast.ts`, `reports.ts` — search `actions`) | "1 action open" / "N actions open" — a plural helper in core with a unit test, used at every such site |
| F4.3 | `reports.ts` line ~1396 (Owner Action Pack: "From the assessment and the processing register.") and the Programme Status lines that say the same | "From every register." — every register the Actions page reads |
| F4.4 | `reports.ts` (`"Penalty heads 2 and 1"`, `"3 and 7"`, `"1 and 7"`; head 7's lines; the processor fix) | "The penalty heads this report covers"; head 7's "not answered yet" lines folded into one ("Not yet answered: …"); "Amend the contract to carry DPDP clauses, then record it"; and B3's "No accepted assessment" for the report's "Never assessed" (D-116.9) |
| F4.5 | Programme Status PDF; `reports.ts` line ~818 ("ceilings at stake went from … to …") | Keep short tables with the next section (no near-empty page); "No change since the snapshot of …" when the two figures are equal, instead of "went from ₹700 crore to ₹700 crore" |
| F4.6 | the scorecards in every PDF (`reports.ts`) | Unanswered domains "Not started" — Q3's display rule, core `domainStatusLabel` / `DOMAIN_NOT_STARTED_LABEL` (`packages/core/src/engine.ts` line ~332); the engine still stores `needs_work` and the workbook oracle is untouched |
| F4.7 | `packages/core/src/workbooks.ts` (Evidence Index: `text(e.uploadedByName)` ~line 333, column "Uploaded by" ~line 361) | "The vendor (questionnaire link)" as uploader when the upload came through the vendor link; `E0–E5` glossed on the About sheet; dates as date cells (values only, `defuseFormula`, D-078) |
| F4.8 | `reports/reports-centre.tsx` (321 lines; today one "Generate a report" section of equal cards, an own-pack section, the stored list) | A "Which report do I need?" line per audience; three `<Tabs>` — **PDF reports · Working files · Stored**; every `<Can>` gate and test id kept |
| F4.9 | `lib/email/templates/{invite,intake,vendor-link}.ts` | The app's navy (`--color-brand-navy` `#003366` from `globals.css`, written as a hex — an email cannot read CSS tokens), not the old indigo `#4338ca`; the invite says in one line what the person will be asked to do |
| N3 | `exposure/exposure-command-centre.tsx` (479 lines) | Tabs — **Where you stand · Penalty heads · What-if · History**; drop the repeated page heading (D-110.10) |
| N4 | `exposure/exposure-history.tsx` | The exposure history through `<DataTable>` |

### Tests — pin every fix, delete none
- **e2e:** `ui/exposure`, `ui/reports`, `ui/dashboard` (the strip), `api/exposure`,
  `api/reports`, `api/report-packs`, `api/stakeholder-reports`, `ui/invite` (the
  email). **Reports are permanent: generate them only on disposable tenants** (§4
  pitfall 4). Search `e2e/` and `tests/` for every old string first ("where you are
  exposed", "Penalty heads 2 and 1", "3 and 7", "1 and 7", "1 actions", "from the
  assessment and the processing register", "Never assessed", "from ₹", the model
  version `1.6.0`, "Needs Work") and change an assertion only to the approved
  wording.
- **Unit:** the plural helper; "Statutory ceilings at stake" from one constant;
  "Not started" in the PDF scorecards; the Evidence Index cells; the paging guard
  lowered (N3, N4); Q1's forecast counts and the model version.

### Deliverables and gate
As §3.3's: every gate green locally and on CI (the RLS mirror on 1.7.0; the CI
pin); before/after `.webp` shots in `docs/testing/slice10_5-b4/` (laptop and
phone; Exposure's four tabs, the reports centre's three tabs, the strip) and the
PDFs rendered to PNG pages before/after on a disposable tenant;
`SLICE_10_5_batch4_walkthrough.md` and `…_manual_test.md` in the B3 standard (the
migration and the hosted step listed; Q1 as a model change with its basis);
`UX_REVIEW.md` §2 rows U03, U19–U28 re-scored and a dated §4 entry; STATE,
DECISIONS (next free D-number; Q1's own entry), this file's B4 status and the
**close of Slice 10.5** (what is left: nothing from the fix list; the open loops in
STATE). **Re-sync `SLICE_11_ai_assistant.md`** — it was written before 10.5 and is
stale in four places: its baseline (§0.3 says core 1,229 · web unit 519 · e2e 410 ·
model 1.6.0 — write the after-B4 numbers and 1.7.0), "PR #28 must be merged first"
(it is — say so), the UI conventions (the side panel lives in the B0 shell:
`components/shell/`, D-101 tokens, `<Notice>`/`useToast()`), and its "recommended
order" note (10.5 is finished). Keep it awaiting "SLICE_11 approved". Commit, push, PR into
`main`, bind it, offer Auto-fix. Remind Aniket of client-hosted deployment
(Slice 15) in one line. Gate: **"Batch B4 approved"** — then merge, wait for the
production deploy, apply the migration to hosted at once (Q1 step 5), check the
live site's signed-out pages, and run the **handover check** (`docs/PLAYBOOK.md`
§6) so Slice 11's window starts clean.

## 4. Pitfalls

1. Simplicity never means dropping the law: fold the citation away, never
   delete it.
2. One next step per screen — not five buttons.
3. Never present a TrustStack target as statute (Slice 10 pitfall 1).
4. Reports are permanent: generate them only on disposable tenants in e2e.
5. The shell must not hide permission gating: a link a role cannot use stays
   hidden (`<Can>`), and the backend still enforces.
6. Client-hosted (Slice 15): no runtime call to a font CDN or any hosted-only
   service from the shell.
