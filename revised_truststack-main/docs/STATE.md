# STATE — where the build actually is

**Single source of truth for status.** Read this first in every new session.
Replaces the old app's `progress.md` + `PENDING.md` + `tracker-data.json` (D-010).
Update it in the Sync Step of every slice, before pushing.

## ▶ Start here — the next step (read this box first; everything below is detail or history)

**Last updated:** 2026-10-29 (**the business-model programme and the multi-level assessment analysis, Phase I B1–B7 and Phase II Steps 1–6 approved, D-143; and Step 7 approved, D-144: **Slice 12.3 Pulse after Slice 12**, launch target ~23 Dec 2026; the combined programme closed and merged to `main`) · 2026-10-28 (**the consolidated feature analysis approved, Steps 1–7, D-141** — the build sequence is now 12 (+ Sentinel S1) → 12.5 Packs I → 13 → 13.5 Sentinel → 14 launch mid-Dec → 15 client-hosted Jan, plus Track M in parallel; Slice 12 gains §4.13; the s.11(1)(b) fix approved and merged as `ced5cda`, D-139/D-140; Slice 12 still next) · 2026-10-22 (**Slice 11 is live** — PR #41 merged as `49c9eba`, the four Slice 11 migrations on hosted after the production deploy, D-138; the reference set accepted after the expert review, D-137. Next: **"SLICE_12 approved"** in a new window.)

| | |
|---|---|
| **Live site** | `main` @ `ced5cda` (D-140: the s.11(1)(b) fix, PR #44, no migration, on top of `49c9eba`) — Slices 10, 10.5 and **11** (the TrustStack DPDP Assistant: explain helpers, register drafts, notice / translation / report narrative), exposure model 1.7.0, **31 migrations on hosted** (the last `20261023000000_ai_notice_narrative`, applied 2026-10-22 right after the production deploy; `gen_db_types --check` up to date; signed-out pages checked). **The assistant is OFF on the live site:** `AI_ENABLED` unset, and both organisations' switches off, until A1. |
| **In flight** | Nothing. **Slice 11 is closed and live** (1a D-126 · 1b D-128 · 2a D-131 · 2b D-136 · reference set D-137 · live D-138). **Slice 12** (`docs/slices/SLICE_12_reassessment.md`) is a full prompt awaiting "SLICE_12 approved". |
| **Waiting on Aniket** | Not code: the **Pulse question list** (~32 + University picks) with counsel before Slice 12.3 Stage 1 merges; Packs I content and counsel work from 9 Nov (D-144) · **"SLICE_12 approved"** (or "…with changes: …") — **now including §4.13, the Sentinel tier card (D-141)** in a new window — §4's thirteen decisions (modes, carry-forward, scope change named first, exposure model 1.8.0 for D-119.6, the Reassessment Report, the optional helper, TrustStack cadence vs Rule 13(1)). Contract work, not code: **A1** (the provider's DPA; zero data retention) and the client DPA's AI sub-processor clause — **the live site's `AI_ENABLED` stays unset until then**. Counsel, when engaged: `RIGHTS_CLOCK_NOTE`'s "the Rules set one period" and R20's reading (D-137.1), s.16 / Rule 15 (D-124.3), A4, A5, s.7(a) (D-117.2), the notice and translation drafts. GitHub: Actions budget $15 a month (D-132). |
| **Next session** | **"SLICE_12 approved"** (new window) → Stage 1 (start, carry, answer) on `slice/12-reassessment` off `main` (`git checkout main && git pull && git checkout -b slice/12-reassessment`). Prompt: `docs/slices/SLICE_12_reassessment.md` — §0 bootstrap, §4 decisions, §5 what exists, §7 stages. Any other opening: ask, write no code. |
| **Gate baseline** | `main` @ `ced5cda` (Slice 11 live + the s.11 fix, D-140): core **1,411** · web unit **901** · RLS **581** · **24** CI SQL gates · e2e **486** · **31 migrations**. How to run them: `docs/PLAYBOOK.md` §2 (**the seed gate needs the local `DIRECT_URL` exported**; kill a stale server on the e2e port by its port, not its process name — D-137.6). |
| **Local database** | Clean seed with **`main` checked out** (31 migrations, the last `20261023000000_ai_notice_narrative`; MU's assistant on under the fictional contract `DEMO-DPA-AI-0001`, BML off; no drafts). The app is stopped. |
| **Open loops to remember** | **D-139/D-140 (28 Oct):** the s.11(1)(b) fix (an access request lists who the data was shared with) is **approved and merged** (PR #44, no migration); follow-up open: a hint on the ROPA field "Who it is shared with" — other organisations only, not your own teams (Slice 12 or 13) · **Slice 11 (2b, D-134):** MU's seed has nine of ten processing records with no lawful basis decided, so a notice draft lists them all as consent purposes (call 2) — a demo-data point, not a drafter fault · the narrative's number check is a set check and does not read numbers in words (call 3) · 1a's wording rules are English only: a Hindi/Marathi translation needs a reviewer who reads it (call 4; Hindi/Marathi rules proposed for Slice 13) · a report version from before 2b kept no document, so it cannot be narrated · free e2e tenants are `…a034` onwards · **Slice 11 (earlier):** Aniket's review of the reference set R1–R20 **and D1–D10** before 2b closes (D-128.3) · call 15 decided Option A (D-131.2): a trailing denial ("… cannot be added") is still refused — watch how often live drafts hit it · CI was blocked by GitHub billing 2026-10-20 → fixed 2026-10-21; CI minutes now metered past 2,000 a month ($15 Actions budget) and a documents-only push skips the app's heavy jobs (D-132) · GitHub's notice: `ubuntu-latest` moves to Ubuntu 26 from 19 Oct 2026 — watch CI's first runs after billing is fixed · `scoring.spec.ts:143` failed in both of 2a's full local runs and passed alone — watch it in CI · a draft is 2,100–2,600 output tokens (an explanation ≈450) · R17's loose "not yet fully reviewed" wording for the next version · only an ASSESSMENT action has "Explain this action" — a register's actions still have none (2a built drafting, not explaining, for the registers) · "Why this score?" on all sixteen scorecard rows is busy (U45 R9 🟡) · the corpus prefix is **43,623 tokens** (§4.2 said ≈30,000): ≈$0.04 a cached call, ≈$0.38 the first in an hour; the twenty-case live run cost ≈$1.02 · `AI_ENABLED` must stay unset on hosted until A1 · corrigendum (v) printed beside the Rules, not applied in place (D-125.11) · D-119.6: the forecast counts the **chosen** assessment's gaps and an actionless gap as one unit, the Actions page every assessment's actions — they first differ with a second assessment, so it is carried into SLICE_12's "must not be lost" · D-110.3 / D-114.9 "evidence awaiting your review" on Your next steps needs a reader across answers, actions and registers (an API change — a later slice) · F2.4 narrowed to the person's own department needs a reader that returns it (D-114.3) · the assessment list's per-row score read → a server-side count when Slice 12 lengthens it (D-114.8, also in SLICE_12) · U24's head 7 evidence-trail cell (R9 🟡, kept) · the Gap & Action Tracker's dates are still text (D-120.5) · `ui/consent.spec.ts`'s publish flake was a real save/publish race — fixed (D-136.3) · s.7(a) wording for counsel (D-117.2) · Q4 password-reset flow before launch (Slice 14), logged (Rule 6(1)(c)) · client-hosted deployment, proposed Slice 15 (remind at every gate). |

## History — status notes from the Slice 10 stages (superseded; kept for the record)

**R1–R6 (D-096), applied in the Stage 5 migration:** R1 the start is "the
last day this data was processed" + the Seventh-Schedule sentence; R2 an
erasure counts only with the processors told (or none held it) — "Erasure
incomplete — processors not told" otherwise; R3 the Third Schedule's own words
(13 Nov 2025 for counsel; user account and virtual-token exceptions); R4
"recorded in error" — `retention_erasure_voids`, by someone other than the
recorder, `POST …/erasures/{erasureId}/void`; R5 the AI register asks s.9(3)'s
question with the Fourth Schedule exemption on yes (`child_tracking`,
`child_exemption`), read with `ropa.read`, MU's proctoring = A3; R6 a Retention
section on the overview. Local stack rebuilt (`db reset` → migrate → seed):
core **1,201** · web unit **514** · RLS **530** · all 22 CI SQL gates · e2e
**401/402** (one worker; tenancy UI's known flake, green alone). **CI green on
`de0cb73`: e2e 402/402.**
**Stage 5** — the retention register and the AI risk register (SLICE_10 §7c):
a schedule per processing record whose **end date the database derives**
(start + period in calendar months), **Rule 8(3)'s one-year floor for every
basis**, **Rule 8(1)–(2) only for a recorded Third-Schedule class**
(`organizations.third_schedule_class`, never inferred), erasures **recorded
once and never changed**, a **fifth action parent** whose action may also close
on an erasure recorded by someone other than its owner (closure basis
`erasure_recorded`); the AI risk register (read by members, written with
`ropa.write`, no actions). **Model 1.5.0**: overdue erasure → H7 Exposed; no end
recorded → H7 reason; unreviewed AI system → H4 reason (H4 still only for an
SDF). **MU's head 7 is now Exposed** (ROPA-009's overdue erasure). Built
2026-10-14 on PR #28 (`70e739c`, `4926ac7`, `a3e0949`; D-095); migration
`20261017000000_retention_ai_risk` is **local only** until approval.
Walk-through: `docs/testing/SLICE_10_stage5_walkthrough.md` (§8: six calls to
confirm); manual test: `docs/testing/SLICE_10_stage5_manual_test.md` (four
users, fourteen steps). **CI green on `3ff4552`: core 1,191 · web unit 513 · RLS 524 ·
e2e 399/399**; Vercel preview built. Locally the same except RLS 523/524 and
e2e 386/399 (one worker) — all open loop 4's manual-test leftovers.
**Claude's DPDP-consultant recommendations R1–R6** (walk-through §9):
**approved and built 2026-10-16 (D-096).**
Stage 4b — approved with no changes (D-094): the vendor-facing questionnaire
link; migration on hosted 2026-10-14.
Stage 4a — approved with no changes (D-092): the processor register, the
staff-entered questionnaire with the seven accuracy controls, model 1.4.0;
migration on hosted 2026-10-14.
Stage 3b — approved with no changes (D-090).
Stages 1, 2, 3a, 3b and 4a are approved (D-082, D-085, D-087, D-090, D-092)
and their migrations are on hosted (23 migrations, `db:types --check` clean
against hosted). **Stage 3b** — the versioned privacy notice (s.5, Rule 3), the
consent widget (s.6), the append-only consent register with how a parent or
guardian was verified (s.9(1), Rules 10–11), and exposure model **1.3.0** —
built 2026-10-13 on PR #28 (`762dce5`; D-088), **approved with no changes
2026-10-13 (D-090)**: D-088's eighteen calls stand, including the 1.3.0 row
**and its one addition** — a consent still given for a child (or by a
guardian) makes head 3 apply (D-088.9); Rule 11 and Rule 12 bases beside Rule
10's (D-088.7); no "required" purpose (D-088.4). Walk-through: `docs/testing/SLICE_10_stage3b_walkthrough.md`;
manual test: `docs/testing/SLICE_10_stage3b_manual_test.md` — **passed by Aniket
on the local stack 2026-10-13**, all fifteen steps (Claude had walked them first);
one finding, a 3a carry-over, fixed in `36de5e7` (an empty public address now
warns that the pages stay closed).
Stage 3a — public intake — on PR #28 (`2868d28`; D-086), approved with no
changes (D-087).
Stage 2 — the
rights and grievance register and exposure model **1.2.0** — is on branch
`slice/10-workflow-modules`, draft **PR #28** (core 1,025 · web unit 452 · RLS
420 · local e2e 297/299, the two others local data — see open loop 4). It
also fixes a Stage 1 bug (evidence on a breach's action answered 404).
Walk-through: `docs/testing/SLICE_10_stage2_walkthrough.md`; manual test:
`docs/testing/SLICE_10_stage2_manual_test.md` — **passed by Aniket on the
local stack 2026-10-13**; its one finding (the response form kept showing the
identity refusal after the check was recorded) is fixed in `0cb43b3`.
Claude's calls: D-083 (all stand, D-085).

## ▶ Slice 10.5 tracker — the simplicity pass

Prompt: `docs/slices/SLICE_10_5_simplicity_pass.md`. B0–B1 were built on
`slice/10-5-simplicity` (off `dd180ec`) and shipped together in **PR #30, merged
2026-10-17 as `cc1dd77` and live** (D-113). From B2 on (B2: PR #35, D-115), each batch branches off
`main` and its own PR goes into `main` (D-104.9).

| Stage | Builds | Status | Aniket's approval |
|---|---|---|---|
| B0 | The app shell (§1): tokens and fonts, fixed menu + top bar with the role, `<Notice>` + toasts, `<DataTable>`, `<Tabs>`, public pages' look (D-100, D-101) | ✅ approved 2026-10-17 (D-102) — manual test passed by Aniket (its Step 11 corrected to the Admin, `dacb652`); CI green on PR #30 | ✅ 2026-10-17 |
| A | The audit (§2): every surface U01–U44 scored R1–R11, ranked fix list — read-only | ✅ done 2026-10-17 (D-103): 44 surfaces 🔍, 37 fixes in B1–B5, Q1–Q5; documents only | ✅ 2026-10-17 — approved with the recommendations (D-104) |
| B5 | Public surfaces — F5.1–F5.6 (first, D-104) | ✅ approved 2026-10-17 (D-105, D-106) — manual test passed; PR #31 merged into the slice branch (`b8d6851`); U39–U43 ✅, U03 half (F4.9 in B4) | ✅ 2026-10-17 "Batch B5 approved" |
| B5a | The processor questionnaire in section tabs (N1) + the paging guard — added by Aniket during B5 (D-107) | ✅ approved 2026-10-17 (D-109) — manual test passed; PR #32 merged into the slice branch (`76a4936`); CI green | ✅ 2026-10-17 |
| B1 | First-run and the overview — F1.1–F1.12 (+ Q3 on the overview, Q4 line, Q5; F1.12 from D-106) | ✅ approved 2026-10-17 (D-110, D-112) — manual test passed; PR #33 merged into the slice branch; CI green; U01, U02, U04, U06, U07, U13, U29, U44 ✅ | ✅ 2026-10-17 "Batch B1 approved" |
| B2 | Assessment, evidence and gaps — F2.1–F2.7 + **N2, N5** (D-107) (+ Q3 on the scorecard; D-110.3 evidence-to-review) | ✅ approved 2026-10-18 (D-114, D-115) — manual test passed; PR #35 merged into `main` (live); U09, U10, U12 ✅ | ✅ 2026-10-18 "Approved Batch B2" |
| B3 | The registers — F3.1–F3.12 + **N6, N7** (D-107) | 🔲 **next** after B2 — full prompt §3.3 | per batch |
| B4 | Reports, exports and exposure — F4.1–F4.9 + **N3, N4** (D-107), **Q1 (model 1.7.0: every action source in the forecast)**, Q2 relabel, Q3 in reports | 🔲 | per batch |

**Slice 10.5 Stage B0 — what was built** (2026-10-16/17): `app/globals.css`
(Tailwind v4 `@theme` tokens; `indigo` remapped to the brand), `app/layout.tsx`
(fonts), `components/shell/` (app-shell, sidebar, topbar, brand-mark),
`lib/client/nav.ts` (the menu, titles, initials), `components/feedback/`
(notice, toast), `components/data/` (paging, data-table), `components/ui/tabs.tsx`;
`app/dashboard/layout.tsx` is now the shell; `organization-switcher.tsx` takes
the list from the top bar; 119 messages → `<Notice>` in 47 files; success
toasts on 14 flows; tables on ROPA, breaches, rights, processors, retention, AI,
reports, users, consent choices, pack questions, all actions; tabs on breach,
request, schedule, processor, assessment, actions; sign-in, invitations,
`/p/…`, `/v/…` restyled. New deps: `lucide-react` (ISC),
`@fontsource-variable/inter`, `@fontsource-variable/plus-jakarta-sans` (OFL-1.1).
Tests: `tests/unit/app-shell.test.ts` (30: every old `nav-*` id and gate kept,
one page per link, shell test ids never reused by a page, titles, initials,
paging); e2e selectors updated, none deleted (D-101).

## Slice 10 tracker (✅ done — history)

The prompt is `docs/slices/SLICE_10_workflow_modules.md` (approved by Aniket
2026-10-11, D-080). It runs in **eight stages, one session each** — 1, 2,
3a, 3b, 4a, 4b, 5, 6 (Stages 3 and 4 split by Aniket 2026-10-13, D-084,
D-089), and every
stage ends at an approval gate (§7 of the prompt). **Branch:**
`slice/10-workflow-modules` — created in Stage 1, reused by Stages 2–6 (never a
new branch); draft **PR #28**. Statuses: 🔲 not started · ⏳ built, awaiting
Aniket's approval · ✅ approved. Update this table at the end of every stage,
then push. **Each stage that adds model rows bumps the minor version in its
own new migration (D-079.6).**

| Stage | Builds | Status | Last commit | Aniket's approval |
|---|---|---|---|---|
| 1 | Breach register (Rule 7 timeline, Board extension, intimation records, lifecycle), its actions source, overview section; **model 1.1.0** (breach rows + repetition) | ✅ approved 2026-10-11, no changes (D-081's fifteen calls stand — D-082). Migration `20261011000000_breach_register` applied to hosted 2026-10-11 (19 migrations, `db:types --check` clean). Gates at approval (CI on `23b70b1`): core **982**, web unit **435** (**445** with `main`'s RLS guard), RLS **393**, e2e **278/278**; manual test passed by Aniket 2026-10-11 | `23b70b1` | ✅ 2026-10-11 "Stage 1 approved" |
| 2 | Rights requests + grievance, staff-entered (decision 3), SLA (90-day ceiling, 30-day target), nomination; **model 1.2.0** (H7 rows) | ⏳ built 2026-10-11 (D-083); gates locally: core **1,025**, web unit **452**, RLS **420**, typecheck and `db:types --check` clean, e2e **297/299** (one worker; the 2 others are MU's extra local breach — open loop 4). Migration `20261012000000_rights_register` **local only** — goes to hosted at approval (additive). Also fixes Stage 1's evidence-on-a-breach-action 404 (D-083.14). **Manual test passed by Aniket 2026-10-13** (one finding — the response refusal stayed on screen after the identity check, so the response looked refused — fixed in `0cb43b3`, UI e2e asserts it). ✅ **Approved 2026-10-13, no changes** (D-083's eighteen calls stand — D-085); migration `20261012000000_rights_register` applied to hosted 2026-10-13 (20 migrations, `db:types --check` clean) | `0cb43b3` | ✅ 2026-10-13 "Stage 2 approved" |
| 3a | Public intake: `organizations.public_slug`, the Rule 9 contact, rate limiting, emailed one-time codes, the public rights and grievance forms (SLICE_10 §7a). **No model change** | ⏳ built 2026-10-13 (D-086); gates locally: core **1,036**, web unit **474**, RLS **440**, typecheck, `check:secrets` and `db:types --check` clean, e2e **314/316** (one worker; the 2 others are open loop 4). Migration `20261013000000_public_intake` **local only** — goes to hosted at approval (additive). **Deviation from §7a.3 for approval: intake functions are `service_role`-only, not anon (D-086.1).** **Manual test passed by Aniket 2026-10-13** (all twelve steps, no findings). ✅ **Approved 2026-10-13, no changes** (D-086's sixteen calls stand, incl. D-086.1 — D-087); migration `20261013000000_public_intake` applied to hosted 2026-10-13 (21 migrations, `db:types --check` clean) | `2868d28` | ✅ 2026-10-13 "Stage 3a approved" |
| 3b | The versioned notice page, the consent widget (config versions, records, withdrawal); children's consent → H3, **model 1.3.0** (SLICE_10 §7a) | ⏳ built 2026-10-13 (D-088); gates locally: core **1,081**, web unit **484**, RLS **463**, typecheck, `check:secrets` and `db:types --check` clean, every CI SQL gate run locally, e2e **335/337** locally (one worker; the 2 others are open loop 4). **CI green on `446ddc7`: RLS 463, e2e 337/337** (CI's first run caught two consent RLS tests relying on row order inside one transaction — fixed in `446ddc7`). Migration `20261014000000_notice_consent` **local only** — goes to hosted at approval (additive). **For approval: the 1.3.0 row + the head-3 applicability addition (D-088.9).** **Manual test passed by Aniket 2026-10-13** (all fifteen steps; one 3a carry-over — saving Public pages with an empty address looked like success — fixed in `36de5e7`, UI e2e asserts it). ✅ **Approved 2026-10-13, no changes** (D-088's eighteen calls stand, incl. the head-3 addition D-088.9 — D-090); migration `20261014000000_notice_consent` applied to hosted 2026-10-13 (22 migrations, `db:types --check` clean) | `36de5e7` | ✅ 2026-10-13 "Stage 3b approved" |
| 4a | Processors on `vendors`: contract as evidence, the questionnaire entered by staff, risk, and the accuracy controls (complete, evidenced, consistency-checked, second-person review, attributed, frozen, current — D-089) → H1/H7, **model 1.4.0** (SLICE_10 §7b) | ⏳ built 2026-10-14 (D-091); gates locally: core **1,126**, web unit **492**, RLS **484**, typecheck, `check:secrets` and `db:types --check` clean, the CI SQL gates that changed run locally, e2e **350/355** locally (one worker, production build; the others: open loop 4's MU breach count — 1 failed, 2 did not run — and two known full-run sign-in flakes, ropa and tenancy UI, which pass alone — open loop below); CI is the authority. Migration `20261015000000_processor_register` **local only** — goes to hosted at approval (additive). **For approval: the four calls in walk-through §8.** MU's heads 1 and 7 gain the reason "2 processors have no contract with DPDP clauses recorded"; no e2e pinned their status. **CI green on `92ebae9`: core 1,126, web unit 492, RLS 484, e2e 355/355.** **Manual test done by Aniket 2026-10-14** (no findings reported; it accepted MU's LMS assessment locally — open loop 4). ✅ **Approved 2026-10-14, no changes** (D-091's nineteen calls stand, the four §8 calls confirmed as built — D-092); migration `20261015000000_processor_register` applied to hosted 2026-10-14 (23 migrations, `db:types --check` clean) | `ec8d8a0` | ✅ 2026-10-14 "Stage 4a approved" |
| 4b | The vendor-facing questionnaire link: emailed expiring token, respondent's email confirmed, signed declaration, server-only; nothing counts until reviewed (SLICE_10 §7b). **No model change** | ⏳ built 2026-10-14 (D-093; the sender rule settled by Aniket, D-092). **CI green on `9b22b55`: core 1,131, web unit 501, RLS 502, e2e 373/373**; gates locally: core **1,131**, web unit **501**, RLS **502**, typecheck and `check:secrets` clean, the 4b CI SQL gate run locally; e2e (4b specs + sweep + processor specs) **142/145** locally (the 3 others: open loop 4 — MU's LMS accepted locally); CI is the authority. Migration `20261016000000_vendor_link` **local only** — goes to hosted at approval (additive). **For approval: the six calls in walk-through §8.** Seed: MU's AI proctoring vendor answered through a used link sent by Legal, awaiting review. ✅ **Approved 2026-10-14, no changes** (D-093's sixteen calls stand, the six §8 calls confirmed as built — D-094); migration `20261016000000_vendor_link` applied to hosted 2026-10-14 (24 migrations, `db:types --check` clean) | `cdbf885` | ✅ 2026-10-14 "Stage 4b approved" |
| 5 | Retention register + AI risk register, **model 1.5.0** (SLICE_10 §7c) | ⏳ built 2026-10-14 (D-095; three calls settled by Aniket, D-094). CI green on `3ff4552` (core 1,191, web unit 513, RLS 524, e2e 399/399). ✅ **Approved 2026-10-16 with changes R1–R6 (D-096)** — the six §8 calls confirmed (5 and 6 changed by R5/R6); R1–R6 applied inside the migration 2026-10-16. Gates on the rebuilt local stack: core **1,201**, web unit **514**, RLS **530**, typecheck and `db:types` clean, all 22 CI SQL gates, e2e **401/402** locally (the one: tenancy UI's known full-run flake, green alone). **Part D re-test passed by Aniket 2026-10-16; CI green on `de0cb73` (e2e 402/402).** Migration `20261017000000_retention_ai_risk` **applied to hosted 2026-10-16** (25 migrations, `db:types --check` clean). Seed: MU's ten schedules (ROPA-009 overdue → MU's H7 Exposed), one erasure, one action; the AI proctoring row (child tracking yes, exemption A3) | see git log | ✅ 2026-10-16 "Stage 5 approved with changes: R1–R6"; re-test passed 2026-10-16 |
| 6 | The three reports (new kinds migration), the evidence index's new link types (incl. `breach_incident`), full test pass, Sync Step (promote SLICE_11), PR | ✅ **Approved 2026-10-16 (D-099)**, with model 1.6.0 (D-098). ⏳ built 2026-10-16 (D-097; §7d's four calls kept as recommended by Aniket). Gates on the rebuilt local stack: core **1,225**, web unit **519**, RLS **541**, typecheck, `check:secrets`, `db:types --check` clean, all **23** CI SQL gates (one new), e2e **408/410** (one worker; retention UI's admin test timed out in the full run and passed alone with the test after it). Migration `20261018000000_slice10_reports` **local only** — goes to hosted at approval (additive). **For approval: the seven calls in walk-through §5.** SLICE_11 promoted to a full prompt. CI green on `d2e41d7` (e2e 410/410). Aniket's manual test (Step 5) found head 2's order (fixed `a44516a`) and asked for **model 1.6.0** (D-098, walk-through §6): built inside the same migration; core **1,229**, web unit **519**, RLS **541**, e2e **410/410** locally; he re-tests from Step 1 | `a44516a` + 1.6.0 | ✅ 2026-10-16 — re-test completed; "you can merge PR #28" (D-099) |

**After Stage 6** (exact, in this order):
1. ✅ Done 2026-10-16: Stage 6 built and pushed (`85960e7` + docs), the head
   order fixed (`a44516a`), Aniket's model 1.6.0 change built (`879cefb`,
   D-098); **CI green on `879cefb`** (e2e 410: 409 + one consent UI test green
   on retry); Vercel preview built; the local DB rebuilt from scratch (reset →
   migrate → seed, local env) so the re-test starts clean at Step 1.
2. ✅ Done 2026-10-16: re-test completed by Aniket; **Stage 6 approved
   (D-099)**, with model 1.6.0 (D-098).
3. CI green on the last commit (the authority for e2e).
4. ✅ Done 2026-10-16: `20261018000000_slice10_reports` applied to hosted —
   **26 migrations**, model **1.6.0**, ten report kinds, both new link types,
   `db:types --check` clean, live site 200. Hosted not re-seeded (🔴 list).
   No new Vercel variable.
5. ✅ Done 2026-10-16: **PR #28 merged as `dd180ec`** (Claude, delegated by
   Aniket, D-099); Vercel production deployed `dd180ec` (success, health 200).
   Slice 10 is live.
6. **Next: Slice 10.5** on branch `slice/10-5-simplicity` (created off
   `dd180ec`), prompt `docs/slices/SLICE_10_5_simplicity_pass.md`: **Stage B0
   — the app shell** first ("Start Slice 10.5 Stage B0"; approved by Aniket's
   request, D-100), then **Stage A — the audit**, then the approved fix
   batches. Then **Slice 11** on "SLICE_11 approved" (agreed additions already
   written in, D-099).

**Deploying (Aniket, 2026-10-13, D-084):** the live site stays on Slice 9
(`main` @ `cbbb54c`) until PR #28 merges after Stage 6. Each stage's additive
migration goes to the hosted database at that stage's approval. PR #28's
Vercel preview builds every push, but it reads the hosted database — so its
rights pages work only once Stage 2's migration is on hosted.

## Slice 10 Stage 6 — what was built (2026-10-16, branch `slice/10-workflow-modules`)

- **Migration `20261018000000_slice10_reports`** (additive; local only until
  approval): `app.report_kinds()` and `reports_kind_format_check` widened to ten
  (`security_breach`, `legal_position`, `processor_exposure` — PDF, record an
  exposure snapshot); `evidence_links_entity_type_check` admits
  `breach_incident`, `rights_request`; the link triggers gain their branches
  (breach.write / rights.write; attach refused on a dismissed breach or void
  request; detach refused while closed/dismissed or responded/withdrawn/void).
- **Core** — `reports.ts`: `securityBreachReport`, `legalPositionReport`,
  `processorExposureReport` (+ input types); five register link lines and
  `linkDirectHeads` reading the model's rows; `workbooks.ts` names every link
  type in the Evidence Index.
- **App** — `lib/reports/stakeholders.ts` (each register through its own
  reader); `readAiRegister` (shared with the AI route); `breachSection`,
  `rightsSection`, `retentionSection` exported; documents on breach and request
  readers, `DELETE …/breaches/{id}/evidence/{evidenceId}` and
  `…/rights-requests/{id}/evidence/{evidenceId}`, link-route branches, the
  Documents panel on both detail pages (`canDetach`); the breach form's title
  hint; the evidence index reader reads every link type.
- **Tests** — core `stakeholder-reports.test.ts`; web unit report-store (the
  newest kinds migration; register counters forbidden in report code),
  report-pdf (the three rendered); RLS `register-links.test.ts`; e2e
  `stakeholder-reports.spec.ts` (`…a024`, `…a025`), two sweep probes, UI steps
  in breaches and reports; CI gate "Every register's documents are evidence…".
- **Replaced from the old app (Slice 13's inventory)**: nothing new — the
  reports have no old-app counterpart.

## Slice 10 Stage 5 — what was built (2026-10-14; R1–R6 2026-10-16, branch `slice/10-workflow-modules`)

- **Migration `20261017000000_retention_ai_risk`** (additive; local only until
  the re-test): `retention.read` / `retention.write`;
  `organizations.third_schedule_class`; `retention_schedules` (end and
  inform-by dates derived), `retention_erasures` (append-only),
  **`retention_erasure_voids`** (R4: append-only, by someone other than the
  recorder), `ai_systems` (**`child_tracking`, `child_exemption`** — R5; read
  with `ropa.read`); `gap_actions.retention_schedule_id` + closure basis
  `erasure_recorded` (an erasure that **counts** — processors told or none
  held it, not voided — R2); evidence types `retention_schedule`, `ai_system`;
  **model 1.5.0** (`exposure_input` reads only counting erasures).
- **Core** — `retention.ts` (`retentionEndsOn`, `retentionClock`,
  `erasureStanding`, `lastCountingErasureOn`, `erasureIncomplete`,
  `RETENTION_DEEMED_NOTE`), `ai-risk.ts` (`aiChildProblem`,
  `aiChildTrackingUnexempt`, counts), exposure 1.5.0.
- **Web** — `lib/retention/{shape,routes}.ts` (incl. `voidErasure`),
  `lib/ai-risk/{shape,routes}.ts`; routes under `…/retention-schedules…`
  (incl. `…/erasures/{erasureId}/void`) and `…/ai-systems…`; UI
  `/dashboard/retention`, `/dashboard/ai-risk`, the Third-Schedule box on the
  Organisation page, the overview's **Retention and erasure** section (R6).
- **Tests** — core (`retention.test.ts`, `ai-risk.test.ts`), RLS
  `retention.test.ts` (28), API e2e `retention.spec.ts` (11, `…a020`–`…a022`),
  UI e2e `retention.spec.ts` (3, `…a023`), 15 sweep probes, the Stage 5 CI SQL
  gate (voids, the counting rule, R5's read policy and seed).

## Slice 10 Stage 4b — what was built (2026-10-14, branch `slice/10-workflow-modules`)

- **Migration `20261016000000_vendor_link`** (additive; local only):
  `vendor_assessments.source` widened to `vendor`, the declaration
  (`declared_name`, `declared_role`, `declared_at`) and a CHECK (submitted or
  accepted: `vendor` exactly when declared, then no staff submitter);
  `vendor_assessment_links` (token, code, session as SHA-256 hashes; members
  read a column grant without them; one open per assessment) and
  `vendor_link_documents`; `intake_attempts` surface `vendor_link`;
  `app.vendor_link_limits()` (14 days, 10 documents); staff
  `send_vendor_link` / `revoke_vendor_link`; `save_` / `submit_` /
  `review_vendor_assessment` replaced in place (refuse while a link is open;
  the sender may not review — D-092); seven `service_role`-only functions
  (`vendor_link_view`, `_send_code`, `_confirm`, `_save`, `_add_document`,
  `_attach_document`, `_submit`). No model change.
- **Core** — `vendors.ts`: the `vendor` source, `VENDOR_LINK_LIMITS`, the
  token shape, `vendorLinkState`, the declaration, the refusals.
- **Web** — `lib/vendors/link.ts` (keys, the session cookie, the public steps,
  staff send/revoke, two emails in `lib/email/templates/vendor-link.ts`); the
  door `lib/intake/rpc.ts` gains the seven calls and the signed upload; routes
  `GET|PATCH /api/v1/vendor-links/{token}`, `POST …/code`, `…/confirm`,
  `…/documents`, `…/documents/{evidenceId}/attach`, `…/submit`, and
  `POST|DELETE …/assessments/{assessmentId}/link`. **UI**: the signed-out page
  `/v/{token}` (noindex, no-referrer); on the staff page the "Ask the vendor to
  answer" panel, the read-only form while the vendor answers, the declaration,
  "the vendor's respondent"; "With the vendor" on the register and the vendor
  page.
- **Seed** — MU's AI proctoring vendor: v1 started and sent by Legal, answered
  by "Priya Menon (SAMPLE)" through a used link, a SOC 2 summary of theirs on
  A4, awaiting review (risk 34; A3, D2 unevidenced). CI: seed counts, a 4b SQL
  gate.
- **Tests** — core (+5); RLS `vendor-link.test.ts` (18); API e2e
  `vendor-link.spec.ts` (7, `…a01d`, `…a01e`); UI e2e `vendor-link.spec.ts`
  (2, `…a01f`); sweep (+9 probes); the 4a UI pin of MU's awaiting-review count
  moved to 2.
- **Replaces (Slice 13's inventory)**: the old app's
  `api/vendors/{[id]/send-questionnaire, questionnaire/[token],
  questionnaire/submit}` and `src/app/public/vendor-questionnaire`.

## Slice 10 Stage 4a — what was built (2026-10-14, branch `slice/10-workflow-modules`)

- **Migration `20261015000000_processor_register`** (additive; local only):
  permissions `vendor.assess` (eight roles) and `vendor.review` (six: the leads,
  Legal, Procurement); `vendors.contract_signed_on` / `contract_review_by`;
  `vendor_assessments` (versions per vendor, one open at a time, status
  draft → submitted → accepted | returned, source `staff`, stated source, stored
  score, review-by, all stamps) and `vendor_assessment_answers` — SELECT-only
  for members; written by **five SECURITY DEFINER functions** (`start_`,
  `save_`, `submit_`, `review_`, `discard_vendor_assessment`) that check the
  caller, refuse an incomplete or unsourced submission and a review by anyone
  who created, answered or submitted it, and audit each step once without
  free text. Guard triggers freeze an accepted assessment for everyone.
  `app.vendor_questions()` (the bank as data), `app.vendor_assessment_risk`
  (whole-number score with the evidence rule), `app.vendor_assessment_missing`.
  `evidence_links` type `vendor` (attach with `vendor.assess`; a cited document
  stays; a deleted vendor drops its links). The answers' key to evidence is
  checked at commit (an organisation's deletion). **Model 1.4.0**:
  `vendor_contract_missing` (H1, H7; not mitigated) and
  `vendor_assessment_out_of_date` (H1, H7; reason); `exposure_input` reads
  `vendors`.
- **Core** — `vendors.ts` (the 45 questions, answer validity, completeness, the
  score in tenths, tiers, seven consistency rules, the contract-gap test,
  review-by defaults); exposure 1.4.0 (`ExposureVendorInput`, four module rows,
  input validation); RBAC.
- **Web** — `lib/vendors/{shape,routes}.ts`; routes `GET …/processors`,
  `GET …/processors/{vendorId}`, `POST …/processors/{vendorId}/assessments`,
  `GET|PATCH|DELETE …/assessments/{assessmentId}`, `POST …/submit`,
  `POST …/review`; the vendor PATCH takes the contract dates; the evidence link
  route takes `{ vendorId }`; exposure reads vendor facts. **UI**:
  `/dashboard/processors` (counts, rows), the vendor page (contract, documents,
  versions), the questionnaire and review page; nav "Processors".
- **Seed** — MU: the payment gateway's v1 **accepted** (two documents; risk 16,
  C4 unevidenced) and the LMS provider's v1 **awaiting review** (risk 37; A3, C4,
  G1 unevidenced; three flags). CI: seed counts, model pin 1.4.0, a processor gate.
- **Tests** — core vendors (19) + 1.4.0 (6); RLS vendors (21, incl. the score
  mirror over 120 answer sets and an organisation's deletion); the exposure
  mirror generator carries vendors; API e2e (7, `…a01b`); UI e2e (3, `…a01c`);
  sweep (8 probes); version pins moved to 1.4.0.

## Slice 10 Stage 3b — what was built (2026-10-13, branch `slice/10-workflow-modules`)

- **Migration `20261014000000_notice_consent`** (additive; local only):
  permissions `consent.read` (ten roles), `consent.write` (eight),
  `consent.publish` (Super Admin, Consultant, Org Admin, DPDP Owner, Legal).
  `privacy_notices` (per language, versions numbered by the database, one
  draft per language, published only when complete per Rule 3(b), then
  immutable — trigger), `consent_configs` (widget versions citing one notice of
  the org, offering only its purposes, published only on a published notice,
  then immutable), `consent_records` (append-only for everyone; HMAC key under
  `consent_salts`, which no role reads; basis CHECKed against the kind; a
  widget record never carries a basis), view `consent_principals` (latest per
  person, security_invoker). Staff: `record_consent`, `consent_history`,
  `consent_register_facts` (counts in SQL). Public, **service_role only**:
  `consent_notice`, `consent_widget`, `consent_record_public`. `app.consent_limits()`
  = 120/h per client address per org · 10/h per person, counted in
  `intake_attempts` (widened: `consent` surface, no email hash). Audit: notices
  and widget versions by trigger (`consent.*`, never text); staff records once
  by RPC; widget records none. **Model 1.3.0**: `child_consent_unverified`
  (H3, Exposed) + consents bearing on head-3 applicability; `exposure_input`
  reads `consents`.
- **Core** — `consent.ts` (languages: en + the 22; widget translations en/hi/mr;
  notice sections, fixed withdrawal and Board wording, `noticePurposeProblems`,
  `noticeDataItems`; actions, kinds, bases and their fit; `countConsents`,
  `childConsentUnverified`; `CONSENT_LIMITS`; `widgetSnippet`); exposure 1.3.0
  (`childrenAndGuardianFacts`); RBAC; `publicPaths.notice`.
- **Web** — `lib/consent/{shape,routes}.ts`; `lib/intake/rpc.ts` gains the three
  public calls (still the one door); routes `GET …/consent`, `POST
  …/privacy-notices`, `GET|PATCH|DELETE …/privacy-notices/{id}`, `POST
  …/consent-configs`, `PATCH|DELETE …/consent-configs/{id}`, `POST
  …/consent-records`, `POST …/consent-records/lookup`, public `GET|POST
  /api/v1/public/{slug}/consent` (ACAO `*`); exposure reads consent facts and
  needs `consent.read`.
- **UI** — `/dashboard/consent` (counts, notices, widget versions + snippet,
  record, look up, latest), the notice editor (`/dashboard/consent/notices/…`),
  public `/p/{slug}/notice` and a card on `/p/{slug}`; the widget
  `apps/web/public/widget/consent-v1.js` (nothing pre-ticked; "Privacy
  choices"; withdraw); `/widget/` excluded from the middleware. Demo site for
  the manual test: `docs/testing/consent-widget-demo.html`.
- **Seed** — MU notice v1 (3 purposes), widget v1 (2), three adult staff
  consents (two people). No child consent, no public address.
- **Tests** — core consent (10) + 1.3.0 (6); both mirror tests (generator now
  carries consents); RLS consent (23); API e2e (6, `…a018`, `…a019`); UI e2e (3,
  `…a01a`, the widget on a separate loopback origin); 14 sweep probes; CI
  consent gate, seed counts, model pin 1.3.0.
- **Old app replaced** (for Slice 13): `src/app/api/privacy-notice/{route,
  save, publish, [slug]}`, `src/app/api/consent/{config, versions, record,
  withdraw, manage, audit, stats}`, `public/consent-widget.js`,
  `db/{privacy_notices, consent_config_versions}.sql`. Not ported (AI, Slice
  11): `privacy-notice/{generate, translate}`.

**Open loops from Stage 3b:**
1. **The widget's Hindi and Marathi phrases** are the old widget's, unreviewed
   (origin of the translation unknown) — a translator reviews them before
   production; every new phrase is English only (D-088.14).
2. **For counsel**: a Rule 12 exemption counts as verified in the model
   (D-088.7); a consent still given for a child makes head 3 apply (D-088.9).
3. **Retention of consent records** — they are evidence of consent, kept;
   how long (s.8(7), Rule 8(3)) is for counsel and Stage 5's retention
   register. The widget's attempt rows go with Slice 13's purge.
4. **120 choices an hour per address** may be low for a large campus behind one
   address — revisit with real traffic.
5. **Local e2e flake**: `ui/scoring.spec.ts` "evidence can be detached" failed
   once in a full one-worker run and passed alone (open loop 2's kind).

## Slice 10 Stage 3a — what was built (2026-10-13, branch `slice/10-workflow-modules`)

- **Migration `20261013000000_public_intake`** (additive; local only):
  `organizations` gains `public_slug` (unique, lower-case, NULL = closed) and
  the Rule 9 contact (`public_contact_{name,email,phone,is_dpo}`; a slug
  needs name + email), editable by `organization.update` only (guard
  replaced in place). `intake_submissions` (held until the code; never the
  register) and `intake_attempts` (the limits' counts, hashes only): no
  grant to any role, RLS with deny policies. `app.intake_limits()` = 5/h per
  client address per tenant per form · 3/h and 10/day per email · 5 wrong
  codes · 10 min · 24 h. Four functions — `intake_profile`, `intake_begin`,
  `intake_resend`, `intake_confirm` — SECURITY DEFINER, **`service_role`
  only** (D-086.1). Confirmation inserts one `web_form` request, received the
  day submitted, audited once as `intake.rights_requests.insert`. CI: a new
  public-intake gate.
- **Core** — `intake.ts`: the slug pattern and suggestion, `publicPaths`, the
  public kinds and their plain-words help, `INTAKE_LIMITS`, codes,
  `maskEmail`, refusals and their statuses, `contactLine`.
- **Web** — `lib/intake/{keys,rpc,routes}.ts` (client HMAC, code + hash, the
  only admin-client use besides invites, schemas, refusals, emails);
  `lib/email/templates/intake.ts` (code email, receipt email); routes
  `GET /api/v1/public/{slug}`, `POST …/submissions`,
  `POST …/submissions/{id}/confirm`, `POST …/submissions/{id}/resend` (4
  sweep probes; the route gate now allow-lists public routes); the
  organisation route's `publicPages`; envelope codes `RATE_LIMITED`, `GONE`.
- **UI** — public pages `/p/{slug}`, `/p/{slug}/rights`, `/p/{slug}/grievance`
  (signed out, not indexed); the Organisation page's **Public pages** panel;
  the register's **Web form** chip and "Recorded by: The public form, email
  address confirmed".
- **Seed** — MU's Rule 9 contact, **no public address** (the seed reaches
  hosted; CI asserts no seeded slug).
- **Tests** — core intake (11); web unit intake (22) + the route gate; RLS
  intake (20); API e2e on `…a014` (open), `…a015` (open, the other tenant),
  `…a016` (closed) (9); UI e2e on `…a017` (4); 4 sweep probes.
- **Old app replaced** (for Slice 13): `src/app/public/{[slug], dsr/[slug],
  grievance/[slug]}`, `src/app/api/dsr/{submit, otp/verify, otp/resend}`,
  `src/lib/dsr/otp.ts`, `src/app/api/grievance/{submit, officer}`.

**Open loops from Stage 3a:**
1. **Purge** expired `intake_submissions` and old `intake_attempts` (personal
   data in the first) — Slice 13's job runner.
2. **Check the client address on the Vercel preview** once the migration is
   on hosted: the limit keys on the first `X-Forwarded-For` entry, which
   Vercel sets; one submission from two networks should count apart.

## Slice 10 Stage 2 — what was built (2026-10-11, branch `slice/10-workflow-modules`)

- **Migration `20261012000000_rights_register`** (additive; local only):
  permissions `rights.read` (ten roles) and `rights.write` (eight);
  `rights_requests` — ONE register for requests (s.11, s.12, s.14) and
  grievances (s.13): the code (`DPR-`/`GRV-<year received>-NNN`, per org and
  family) and `respond_by` (receipt + 90 days) derived by trigger and
  CHECKed; `received_on` not editable; the identity check and the response
  stamped with who recorded them; identity corrected never removed;
  fulfilling needs identity; less than fulfilled says why; withdrawn / void
  with a reason; reopening withdraws the response; nothing in the future; no
  DELETE grant; **no `anon` grant at all**; audited by
  `audit_scope_change('rights')` with no personal data or free text.
  `gap_actions` gains `rights_request_id` (one-parent CHECK widened to four);
  `add_rights_action` is the only door. **Exposure model 1.2.0** in SQL:
  `app.exposure_module_inputs()` (4 rows, new effect `reason`),
  `app.rights_ceiling_days()` / `app.rights_target_days()`, the evaluator and
  `app.exposure_input` (now `rights`) replaced in place. CI gates: seed counts,
  1.2.0, a new rights gate.
- **Core** — `rights.ts` (vocabularies, lifecycle, `rightsClock`,
  `countRights`, `needsIdentity`; ported from the old app's `dsr/sla.ts`, its
  30-day SLA now a labelled target); `exposure.ts` 1.2.0 (two H7 rows,
  `ExposureRightsInput`, `MappingKey` `rights`); `ACTION_SOURCES` + `rights`;
  the matrix.
- **Web** — `lib/rights/{shape,routes}.ts` (one reader for the register, the
  overview, exposure and reports; personal data never leaves the register);
  routes `GET|POST …/rights-requests`, `GET|PATCH …/rights-requests/{id}`,
  `POST …/{id}/actions`, `PATCH …/actions/{actionId}`,
  `DELETE …/actions/{actionId}/evidence/{evidenceId}` (seven sweep probes);
  `readRemediation`, `readDashboard` (a `rights` section), the exposure reader
  (needs `rights.read`) and the report lines read it. **Fix:** the evidence
  link route answered 404 for a breach's action after storing the link; it
  answers 201 for breach and rights actions now.
- **UI** — `/dashboard/rights` (register with family and status filters),
  `/new`, `/{id}` (clock, identity, response, lifecycle, details, actions);
  the overview's "Rights requests and grievances"; "Rights & grievances" in
  the nav; one shared `AddAction` (breach and rights); the Actions filter says
  "Every source"; the exposure page links each register's facts.
- **Seed** — MU's DPR-2026-001 (access, fulfilled day 18) and GRV-2026-001
  (grievance, resolved day 22) with one open action. Local only: the "Demo
  Clinic Network" (`…d10a`) has five demo requests for the manual test.
- **Tests** — core rights (14) and 1.2.0 rows (9); both mirror tests (latest
  definition; 400 inputs with requests on days 30, 31, 90, 91); RLS rights
  suite (27); API e2e on `…a011` healthcare and `…a012` empty (12); UI e2e on
  `…a013` (2); 7 sweep probes.
- **Old app replaced** (for Slice 13): `src/app/api/dsr/{requests,
  requests/[id], stats}`, `src/app/api/grievance/{complaints,
  complaints/[id]}`, `src/lib/dsr/sla.ts`, `db/dsr_requests.sql`,
  `db/fix_grievance_reference_unique.sql`. Not yet: `dsr/submit`,
  `dsr/otp/*`, `lib/dsr/otp.ts`, `grievance/{submit,officer}` (Stage 3);
  `dsr/draft`, `lib/dsr/draft.ts` (Slice 11).

## Slice 10 Stage 1 — what was built (2026-10-11, branch `slice/10-workflow-modules`)

- **Migration `20261011000000_breach_register`** (additive; local only):
  permissions `breach.read` (ten roles) and `breach.write` (eight);
  `breach_incidents` — the code (`BRH-<year aware in IST>-NNN`, per org) and
  the Board report's due time (aware + 72 h, or the Board's extension) derived
  by trigger and CHECKed; every intimation stamped with who recorded it and
  when; corrected never removed; nothing in the future; closing needs both
  intimations; dismissed with a reason; no DELETE grant; audited by
  `audit_scope_change('breach')` with no free text. `gap_actions` gains
  `breach_incident_id` (composite FK; one-parent CHECK widened to three);
  `add_breach_action` is the only door. **Exposure model 1.1.0** in SQL:
  `app.exposure_module_inputs()`, `app.exposure_repetition_window_months()`,
  `app.exposure_position_factors()` with `repeated_points`, the evaluator and
  `app.exposure_input` (now `now` + `breaches`) replaced in place. CI gates:
  seed counts, 1.1.0, and a new breach gate.
- **Core** — `breach.ts` (vocabularies, lifecycle, the clock, `boardClock`,
  `countBreaches`, `addMonths`, IST formatting; ported from the old app's
  `countdown.ts`); `exposure.ts` 1.1.0 (`MODULE_INPUTS`, `moduleInputCounts`,
  `recentBreachCount`, repetition +1/+2, `MappingKey` `breach`);
  `ACTION_SOURCES` + `breach`; the matrix.
- **Web** — `lib/breach/{shape,routes}.ts` (one reader for the register, the
  overview, exposure and reports); routes `GET|POST …/breaches`,
  `GET|PATCH …/breaches/{id}`, `POST …/breaches/{id}/actions`,
  `PATCH …/actions/{actionId}`, `DELETE …/actions/{actionId}/evidence/{evidenceId}`
  (seven sweep probes); `readRemediation` and `readDashboard` read breaches;
  the exposure reader needs `breach.read`; report lines carry breach actions.
- **UI** — `/dashboard/breaches` (register), `/new`, `/{id}` (Rule 7 timeline,
  lifecycle, narrative, actions through the shared `ActionEditor`); the
  overview's "Personal data breaches" section; "Breach register" in the nav;
  H2's "Evidenced by" names the breach register.
- **Seed** — MU's BRH-2026-001 (closed, handled in time) and one open action.
- **Tests** — core breach (13) and 1.1.0 rows (11); both mirror tests
  (data: latest definition across migrations; logic: 400 inputs with
  breaches at the boundaries); RLS breach suite (23); API e2e on `…a00e`
  healthcare and `…a00f` empty (10); UI e2e on `…a010` (2); 7 sweep probes.
- **Old app replaced** (for Slice 13): `src/app/api/breach`,
  `src/lib/breach/countdown.ts`, `db/breach_incidents.sql`. Not ported:
  `escalation.ts` (Slice 13), `notification.ts` (Slice 11).

**Open loops from Stage 1:**
1. ~~**The RLS suite ran once against HOSTED**~~ — **✅ fixed 2026-10-11**
   (PR #29, merged into `main` as `cbbb54c`, merged into this branch):
   `connect()` in `apps/web/tests/rls/db.ts` calls `assertLocalDatabase` and
   refuses any host but `127.0.0.1` / `localhost` / `::1` unless
   `RLS_ALLOW_REMOTE=1`. Local runs still export the local stack's env first.
2. **Local e2e under parallel load is flaky** on this laptop (GoTrue "Database
   error querying schema", PostgREST "JWT issued at future"): a different
   ~10 UI specs fail per run, all at sign-in. `--workers=1` passes 278/278.
   CI is the authority.
3. Still open from Slice 9 (Aniket's): a signed-in report generation on
   production on a non-client tenant, and timing a cold start (D-076.1, D-078.12).
4. **MU on the local stack has a second breach** ("Test: staff laptop stolen",
   BRH-2026-002, recorded in the Stage 1 manual test). `e2e/ui/breaches.spec.ts`
   expects MU's one seeded breach, so locally it fails (and skips the next
   test in that file): 297/299. CI's database is fresh. Breaches are never
   deleted, so it stays; a local `supabase db reset` + migrate + seed would
   clear it (and the demo clinic). **Since the Stage 4a manual test
   (2026-10-14)** MU's LMS provider assessment v1 is **accepted** locally (the
   seed leaves it "awaiting review") and Demo Clinic has a vendor "Clinic cloud
   records": `e2e/ui/processors.spec.ts`'s first two tests (MU's awaiting-review
   count; the Registrar's "someone else must review it") fail locally. An
   accepted assessment is never deleted and the seed skips one already
   present, so only a reset restores it. **Stage 4b** (2026-10-14) seeds a
   third MU assessment (the AI proctoring vendor's, awaiting review), so
   locally "Awaiting review" is 1 where CI's fresh database shows 2; and the
   4b manual test, once run, accepts it and a payment-gateway v2.
5. **Applying the ninety days to every request**, not only grievances, is the
   prompt's reading of Rule 14(3) (D-083.4) — counsel to confirm, with the
   other model rows.

**What is deployed where (verified 2026-10-14):**
- **Production** (https://revised-truststack-web.vercel.app) = `main` @
  `cbbb54c` (deployed 2026-10-11) — Slice 9, docs, and PR #29 (the RLS host
  guard; test code only). Checked signed-out 2026-10-13: `/api/v1/health`
  reports `ok` / `cbbb54c` (re-checked 2026-10-14), `/login` 200, `/dashboard` → sign-in (307),
  `/api/v1/auth/me` 401. **Slice 10 is NOT deployed, by Aniket's decision
  (D-084)**: PR #28 merges after Stage 6; a Slice 10 route on production is a
  404 until then. A signed-in check of production is Aniket's (open loop 3).
- **PR #28** (draft, `slice/10-workflow-modules`) — every push builds a Vercel
  preview (green on `92ebae9`) and runs CI. The preview reads the HOSTED
  database, so each stage's pages work there only once its migration is on
  hosted: Stage 4a's migration went on at its approval (2026-10-14), so the
  Processors pages work there; **the vendor link on the preview fails until
  Stage 4b's migration goes on at approval** (expected — nothing on
  production changes).
- **Branches** — `slice/10-workflow-modules` (draft PR #28, `main` merged in
  2026-10-11; `main` has not moved since); `fix/rls-local-host-guard` merged (PR #29).
- **Hosted database** — **23 migrations**: Stage 1's
  `20261011000000_breach_register` applied 2026-10-11 at its approval (D-082);
  Stage 2's `20261012000000_rights_register` applied 2026-10-13 at its
  approval (D-085); Stage 3a's `20261013000000_public_intake` (D-087) and
  Stage 3b's `20261014000000_notice_consent` (D-090) applied 2026-10-13 at
  theirs; Stage 4a's `20261015000000_processor_register` applied 2026-10-14 at
  its approval (D-092); Stage 4b's `20261016000000_vendor_link` applied 2026-10-14 at its approval (D-094). Stage 5's goes on at its approval.
- **Local Supabase stack** — **25 migrations** (Stage 4a's applied 2026-10-14, and seeded: MU's two processor assessments; the 4a manual test then accepted the LMS one and added "Clinic cloud records" to Demo Clinic — open loop 4; Stage 4b's `20261016000000_vendor_link` applied and seeded 2026-10-14: the proctoring vendor's vendor-answered v1; Stage 5's `20261017000000_retention_ai_risk` applied and seeded 2026-10-14: MU's ten schedules, one erasure, one action, the AI proctoring row). MU has its seeded breach and
  requests, plus what the manual tests recorded (a second breach; DPR-2026-002,
  withdrawn); a **"Demo Clinic Network"** healthcare tenant (`…d10a`, the CISO
  is its Organisation Admin) holds the demo breaches and five demo requests
  (as changed by the manual tests) — local data only.
  `apps/web/.env.development.local` is in place, so `pnpm dev` points at the
  LOCAL stack; delete it to point at hosted again.

## Slice 9 tracker (✅ done — history)

The prompt is `docs/slices/SLICE_09_reports.md` (approved by Aniket
2026-10-04). It runs in **four stages, one session each**, and every stage
ends at an approval gate (§12 of the prompt). **Branch:**
`slice/09-intelligence` — created in Stage 1, reused by Stages 2–4 (never a
new branch). Statuses: 🔲 not started · ⏳ built, awaiting Aniket's approval ·
✅ approved. Update this table at the end of every stage, then push.

| Stage | Builds | Status | Last commit | Aniket's approval |
|---|---|---|---|---|
| 1 | Exposure model as data, `exposureFor`, `GET …/exposure` (live), SDF fields | ✅ approved 2026-10-06, no changes (D-073's twelve calls stand). Migration `20261008000000_exposure_sdf` applied to hosted 2026-10-06 (16 migrations, `db:types --check` clean). Gates at approval: core **838**, web unit **359**, RLS **326**, e2e **221/221** | `043571c` | ✅ 2026-10-06 "Stage 1 approved" |
| 2 | SQL mirror + exposure history, forecast, leverage, what-if, Exposure Command Centre | ✅ approved 2026-10-06, no changes (D-074 stands; call 12's two model consequences kept as 1.0.0 — D-075). Migration `20261009000000_exposure_snapshots` applied to hosted 2026-10-06 (17 migrations). Gates at approval: core **880**, web unit **386**, RLS **342**, e2e **233/233** | `6cc8d82` | ✅ 2026-10-06 "Stage 2 approved" |
| 3 | Report store; DPDP Exposure Brief + Programme Status Report (PDF) | ✅ approved 2026-10-08, no changes (D-076's fourteen calls stand — D-077). Migration `20261010000000_reports` applied to hosted 2026-10-08 (18 migrations, `db:types --check` clean). Gates at approval (CI on `8578dbe`): core **906**, web unit **411**, RLS **367**, e2e **248/248** | `9858954` | ✅ 2026-10-08 "Slice 9, I approve stage 3" |
| 4 | Owner Action Pack, Regulator-Ready Evidence Pack, 3 XLSX exports, Sync Step, PR | ✅ merged 2026-10-08 as `a691d88` (D-078; no migration). Gates at merge (CI on `18ba7bb`): core **938**, web unit **425**, RLS **370**, e2e **259/259**. Manually tested by Aniket 2026-10-10 (D-079) | `18ba7bb` | ✅ 2026-10-08 "Merge PR #25" |

**After Stage 4 — Aniket's steps, in this order:**
1. ~~Review the Stage 4 walk-through and PR #25~~ — CI green.
2. ~~**Merge PR #25**~~ — merged 2026-10-08 (`a691d88`), deployed; health
   reports `a691d88`, routes guarded, hosted unchanged at 18. **Still Aniket's
   (signed in, which Claude cannot do):** generate one of each kind on a
   non-client tenant and download it — a report is permanent, so never on MU
   or BML.
3. Check a report's generation time on production (signed in, a non-client
   tenant): the cold start is still unmeasured (D-076.1, D-078.12).
4. ~~Run the Stage 4 manual test~~ — done 2026-10-10 (D-079).
5. Approve SLICE_10 → see "▶ Starting Slice 10" at the top.

## Slice 9 Stage 4 — what was built (2026-10-08, branch `slice/09-intelligence`)

- **Core** — `reports.ts`: the Stage 4 inputs (`ReportActionLine`,
  `ReportGapLine`, `EvidenceIndexEntry`, `EvidenceLinkLine`), `ownerActionPack`,
  `evidencePack`, `evidenceCoverage` (counts of artefacts, each once),
  `linkDirectHeads` / `isEnablingKey` through the model's mapping; all seven
  kinds available. `workbooks.ts`: `ReportWorkbook` and the Gap & Action
  Tracker, ROPA Register and Evidence Index builders. `defuseFormula`
  (`csvCell`'s rule, shared), `ropaReviewOverdue`, `directHeadsOf`.
- **Web** — `readRemediation` extracted from `readDashboard` and shared;
  `lib/reports/inputs.ts` (gap registers → report lines);
  `lib/evidence/index-reader.ts` (every artefact and link, paged);
  `lib/reports/xlsx.ts` (exceljs, values only); one pipeline in
  `lib/reports/generate.ts` (`buildOutput`, `Gathered`); the evidence pack
  makes its Evidence Index first and names it; routes take `ownerUserId` and
  let an owner generate and regenerate their own pack; the ROPA export's
  columns moved to `lib/ropa/shape.ts`. PDF: headings travel with their tables.
- **UI** — `/dashboard/reports`: every kind, grouped by format; owner picker;
  "Generate my pack" for contributors; own-pack download and new version.
- **Tests** — core builders and coverage (32), XLSX read-back (6, incl. a
  guard on the guard), PDF render of both new PDFs, report-store guards over
  the new files, RLS (3: the Stage 4 kinds in SQL, the spreadsheet served
  like a PDF), API e2e on two disposable tenants (`…a00c` healthcare with
  evidence on all three link types, `…a00d` empty), UI e2e (+2).
- **Decision D-078** (twelve calls). **SLICE_10 promoted** to a full prompt
  (for Aniket's approval); SLICE_11 stub-checked.

## Slice 9 Stage 3 — what was built (2026-10-06, branch `slice/09-intelligence`)

- **Migration `20261010000000_reports`** (additive; local only): `reports`
  (version per organisation + kind + owner; `as_of`; points at its exposure
  snapshot and assessment, cleared — never cascaded — if they go), written
  only by `begin_report` (records a FRESH exposure snapshot first for an
  exposure report), `complete_report` (size read from the stored object) and
  `fail_report`; immutability trigger; all seven kinds in
  `app.report_kinds()`; private `reports` bucket (PDF/XLSX, 20 MiB) with
  INSERT only for the person who began a running report and SELECT only for
  a ready one with `report.download` (or your own owner's pack). CI gate.
- **Core** — `reports.ts`: kinds as data (`REPORT_KIND_DEFINITIONS`,
  `AVAILABLE_REPORT_KINDS`, `reportFileName`), the `ReportDocument` model,
  `exposureBrief` and `programmeStatusReport` (pure; no arithmetic).
  `caveat.ts` now holds D-011's caveat.
- **Web** — `lib/reports/`: `pdf.ts` (react-pdf, embedded Noto Sans +
  Devanagari fallback, OFL), `generate.ts`, `store.ts`, `routes.ts`;
  `readLiveExposure` and `readDashboard` extracted from their routes and
  reused; routes `GET|POST …/reports`, `GET …/reports/{id}`,
  `GET …/reports/{id}/download-url` (60 s, audited), `POST
  …/reports/{id}/regenerate`; `/dashboard/reports` and "Reports" in the nav.
- **Tests** — core builders (26), PDF render + text extraction + font
  coverage, SQL ↔ core mirror and no-recompute guards, RLS (25: writes,
  versions, permissions, bucket, gate 5), API e2e on two disposable tenants
  (`…a009` healthcare, `…a00a` empty), UI e2e (`…a00b`), five sweep probes.
- **Decision D-076** (fourteen calls).
- **Not built yet (Stage 4):** the Owner Action Pack, the Regulator-Ready
  Evidence Pack, the three XLSX exports, the Sync Step.

## Slice 9 Stage 2 — what was built (2026-10-06, branch `slice/09-intelligence`)

- **Core** — `forecast.ts` (`forecast`, `weeklyClosures`, `simulateWeeks`,
  `requiredPerWeek`, seeded Park–Miller, P50/P85) and `intelligence.ts`
  (`outstandingWork`, `exposureForecast`, `leverage`, `closeActions`,
  `whatIf`, `delta`, `slippage`, `exposureChanges`, `dayLabel`).
  `exposure.ts` de-noises before comparing (D-074.2); model still 1.0.0.
- **Migration `20261009000000_exposure_snapshots`** (additive; local only):
  the model's data and logic in SQL (`app.exposure_evaluate`,
  `app.exposure_input`, `app.exposure_forecast`, …), the `exposure_snapshots`
  table (SELECT-only, immutable) and `public.record_exposure_snapshot(org)`
  (`score.calculate`, audited). A CI gate checks it.
- **API** — `GET …/exposure` now carries `intelligence` (forecast, top-10
  leverage, slippage, changes) and `lastSnapshot`; `GET|POST
  …/exposure/snapshots`; `GET …/exposure/snapshots/{snapshotId}`;
  `POST …/exposure/what-if`. Readers: `lib/exposure/snapshots.ts`,
  `lib/exposure/closures.ts`; the dashboard's item builders are exported and
  reused for leverage's titles and owners.
- **UI** — `/dashboard/exposure` (headline, s.37, slippage, five head cards
  with root causes collapsed, leverage + what-if, what changed, history chart
  + table, both caveats); "Exposure" in the nav; the overview's exposure strip.
- **Tests** — the SQL ↔ core property test (400 inputs, 120 forecasts), the
  migration-parsing mirror test, forecast and intelligence unit tests,
  snapshot RLS (no user write, immutability, `score.calculate`, gate 5, black
  box, audit), e2e stored = live (with and without SDF, real closure
  history), what-if writes nothing, gate 5 by path and by id, the UI.
- **Decision D-074** (twelve calls; call 12 reports two consequences of the
  approved rules for Aniket's decision).
- **Not built yet (Stages 3–4):** the report store, the five reports, the
  three XLSX exports.

## Slice 9 Stage 1 — what was built (2026-10-05, branch `slice/09-intelligence`)

- **`packages/core/src/exposure.ts`** — the exposure model 1.0.0 as data:
  the Schedule's seven heads and ceilings; the approved §6.2 mapping of every
  domain and every register gap rule (DIRECT with heads and provisions, or
  ENABLING with a reason and the heads it explains); the 40/60/60 thresholds;
  the s.33(2) position factors; thirds-of-ceiling bands; the headline, the
  s.37 flag and the caveat. `exposureFor(input)` is pure, `today` passed in.
  `reports.ts` holds D-011's caveat (`DPDP_REPORT_CAVEAT`).
- **`GET /api/v1/organizations/{id}/exposure`** (`lib/exposure/read.ts`) — the
  live model through the score, gap, ROPA and scope readers; basis by
  `pickAssessments`; `freshness` reports stale registers and an unsaved scope.
  Needs `score.read` + `assessment.read` + `gap.read` + `ropa.read`.
- **Migration `20261008000000_exposure_sdf`** (additive; local only):
  `organizations.sdf_notified_on` / `sdf_notification_ref` (both or neither;
  `organization.update` only — the guard refuses `scope.write`) and
  `organization_scopes.guardian_data` (s.9(1), default `unknown`).
  `PATCH …/organizations/{id}` takes `sdfNotification`; Organisation settings
  has the form; the scope wizard has the guardian question.
- **Decisions D-072** (the ten §4 decisions as approved) and **D-073** (twelve
  calls Stage 1 had to make — the ones to approve at the gate).
- **Not built yet (Stages 2–4):** the SQL mirror and `exposure_snapshots`,
  forecast, leverage, what-if, the Command Centre UI and overview strip,
  reports, exports.

## Slice 8 — what is live (summary; the detail is under "What is built")

The executive overview (`/dashboard`): the readiness score as a frozen
snapshot AND, separately, a live provisional score, never blended; red flags
and gaps on their own tiles; the 16-domain scorecard; open, overdue,
unassigned and closed actions; and the ten processing-register metrics on
their own tile — from one request, `GET …/dashboard`, through the same
readers the score, gap and ROPA routes use, adding no arithmetic. The
actions page (`/dashboard/actions`, a D-067 launch requirement): every action
from the assessment AND the register, by owner and on the 30/60/90 roadmap,
labelled by source. The assessment page collapses by domain. **The question
bank is a black box to clients, enforced by the database** (D-068, D-071):
client roles cannot read the bank tables or the pack/trigger provenance
columns, even by calling PostgREST directly. Decisions D-068 to D-071.

**Hosted database (`nywwsdcnqivefednqezw`) — up to date, 15 migrations.**
Slice 8 added two:
- `20261006000000_question_bank_black_box` (additive: one permission, two
  grants) — checksum `4f621feb…653b860`. Hosted holds **30** permissions,
  **195** grants.
- `20261007000000_black_box_database` (**NOT additive**, D-071) — applied
  2026-10-04 right AFTER the production deploy, per the runbook; checksum
  `ac3b1fde…ec96c4c`. It had been applied once too early that evening,
  broke the live assessment pages for a few minutes, and was reverted by
  hand before being re-applied in the right order.
`prisma migrate status` up to date · `db:types --check` clean against hosted.

**Verified, 2026-10-04.** Local stack, from the final code: core **787**,
web unit **349**, RLS **312**, e2e **209/209**. CI green on PR #23 (5/5).
Live, after the merge: `/api/v1/health` reports `f5986f1`; the specs this
slice touched — `api/black-box`, `api/dashboard`, `api/scope`,
`ui/dashboard`, `ui/assessments` — **31/31** against production, serially.
**Not done:** the full 209-test live suite and the client-chunk secrets
sweep (CI on `main` is the authority); the manual walk-through
(`docs/testing/SLICE_08_manual_test.md`) is still worth doing by hand.
Honest e2e history: two earlier full runs lost seven API tests each to 401s,
caused by the new black-box spec's own `auth.signOut()` (Supabase signs out
GLOBALLY by default, revoking other specs' cached tokens) — fixed with
`{ scope: "local" }` and guarded by a unit test.

> **⏳ The hosted project is provisioned only until 2026-11-02.** If it lapses
> every sign-in fails with "fetch failed". Renew it, or fall back to the local
> stack, before that date.

**Rollback path for Slice 8:** Vercel → Deployments → previous production
(`385efec`) → Instant Rollback — **but `20261007000000_black_box_database`
is NOT additive**: the Slice 7 app reads `pack_codes` and
`assessment_questions(count)`, which client roles can no longer read, so a
rollback ALSO needs this inverse SQL (the exact statements that reverted it
on 2026-10-04), in one transaction against hosted. Prefer a forward fix.

```sql
DROP FUNCTION public.assessment_provenance(uuid, uuid);
DROP FUNCTION public.bank_for_generation(uuid, text[]);
REVOKE SELECT (organization_id, assessment_id, question_code, question_version, question_text, domain_code,
  domain_weight, applicability, priority, evidence_guidance, suggested_owner, sort_order, created_at)
  ON public.assessment_questions FROM authenticated;
REVOKE SELECT (id, organization_id, name, assessment_type, status, industry_code, risk_tags, scope_derived_at,
  generated_at, created_by, created_at, updated_at) ON public.assessments FROM authenticated;
REVOKE SELECT (code, name) ON public.industries FROM authenticated;
GRANT SELECT ON public.assessment_questions, public.assessments, public.industries TO authenticated;
DROP POLICY question_packs_select_bank ON public.question_packs;
DROP POLICY questions_select_bank ON public.questions;
DROP POLICY question_versions_select_bank ON public.question_versions;
CREATE POLICY question_packs_select_authenticated ON public.question_packs FOR SELECT TO authenticated USING (true);
CREATE POLICY questions_select_authenticated ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY question_versions_select_authenticated ON public.question_versions FOR SELECT TO authenticated USING (true);
DROP FUNCTION app.current_user_has_permission_anywhere(text);
DELETE FROM public._prisma_migrations WHERE migration_name = '20261007000000_black_box_database';
```

**Hosted data as it stands** (Mumbai University, 2026-10-04): the four
assessments recorded for Slice 6 (the seeded baseline with 1 answer and 1 gap,
"Test 1", and two FINALISED ones), plus the ten seeded ROPA records — all
Drafts with no owner — and their ROPA gaps, regenerated by the live e2e runs
of 2026-10-03 and 2026-10-04 (every e2e spec deletes the assessments and
records it created). Bharat Manufacturing has no assessment and no ROPA
record. The hosted DB is not quiet: assert only on rows a test creates.

---

## 🔴 Blocked on Aniket

- ~~**Slice 10 Stage 4b — run the manual test, then reply "Stage 4b approved"**~~
  — approved 2026-10-14, no changes (D-094); on hosted. (Was: after reading
  `docs/testing/SLICE_10_stage4b_walkthrough.md` — esp. §8's six calls (one
  writer while a link is open; the sender rule covers every link for the
  version; five wrong codes lock a link; what the respondent sees; a staff
  finish clears the vendor's declaration; ten documents per link). Manual test:
  `docs/testing/SLICE_10_stage4b_manual_test.md`.)
- ~~**Slice 10 Stage 4a — reply "Stage 4a approved"**~~ — approved 2026-10-14,
  no changes (D-092); its migration is on hosted. Aniket settled 4b's call in
  the same message (the link's sender may not review).
- ~~**Slice 10 Stage 3b — reply "Stage 3b approved"**~~ — approved 2026-10-13,
  no changes (D-090); its migration is on hosted.
- ~~**Slice 10 Stage 6 — run the manual test, then reply "Stage 6 approved"**~~
  — re-test completed and approved 2026-10-16 (D-099); migration on hosted;
  Claude merges PR #28 once CI is green.
- ~~**Slice 10.5 Stage B0 — run the manual test**~~ — passed and approved
  2026-10-17 (D-102).
- ~~**Approve Slice 10.5's fix list**~~ — approved 2026-10-17 with the
  recommendations (D-104).
- ~~**Run the Batch B5 manual test**~~ — passed and approved 2026-10-17 (D-106).
- ~~**Merge PR #30 to put Slice 10.5 on production**~~ — merged 2026-10-17 as
  `cc1dd77`, B0 + B5 + B5a + B1 live (D-113).
- **Password reset (D-104 Q4)** — a real "forgot password" flow is scheduled
  before the production launch (Slice 14); until then the sign-in page says to
  ask the organisation's admin (B1).
- **Approve SLICE_11** ("SLICE_11 approved" or "with changes: …") — §4's calls
  and §6's data-protection position (an AI provider is a sub-processor; where
  inference runs) before any Slice 11 code.
- **After PR #28 merges (Slice 10 Stage 6): re-seed hosted?** No Slice 10 stage
  has run `pnpm db:seed` against hosted, so MU's Slice 10 demo rows (contact,
  breach, requests, notice, widget, consents) are not there. Decide then.

0. ~~**Review and merge PR #25 — Slice 9, all four stages**~~ — merged 2026-10-08 (Stage 4 walk-through:
   `docs/testing/SLICE_09_stage4_walkthrough.md`; calls D-078). No migration.
0. ~~**Approve SLICE_10 §4 and §6**~~ — approved as written 2026-10-11 (D-080).
0. **Check a report's generation time with a cold start** on production or a
   signed-in PR preview (D-076.1, D-078.12) — the laptop cannot reach a preview.

0. **The five Slice 7 design calls are settled for a production launch**
   (D-067, approved by Aniket 2026-10-03): owner rule and stored-evidence rule
   confirmed; risk model kept with a version stamp and a required reason for
   a raise (built); Excel import added (built); ROPA actions stay on the
   register's page, with the combined view a Slice 8 launch requirement.
0. **A DPDP practitioner or counsel should sign off ROPA risk model 1.0.0**
   (the 13 factors, their points, and the 2/5/8 thresholds — D-061, D-067) —
   a one-page review, and a launch blocker.
0. **Counsel should review the lawful-ground, Fourth Schedule and retention
   vocabularies and their wording** (D-065). They are labelled as notes for
   counsel, never legal opinions, but they ARE legal content.
0. **Five design calls in Slice 6 were Claude's, under the prompt's
   recommendations — each is reversible and each is written down** (D-054 to
   D-058). The two worth an explicit yes or no: **closing is stricter than the
   prompt recommended** (reviewed evidence, or a reviewer holding
   `evidence.review` who is not the owner — D-056), and **a finalised
   assessment's gaps are frozen while its actions stay editable** (D-058).
1. **⏳ The hosted Supabase project expires 2026-11-02.** It vanished once
   already on 2026-09-30 and Aniket restored it the same day, same ref, nothing
   lost. Renew it before the date, or dev, preview and live verification all
   stop again with "fetch failed" on sign-in. **CI is unaffected** — it builds
   its own ephemeral local stack (D-018) — and the local stack remains a
   complete fallback for development.
2. **Resend paperwork (D-030):** accept/retain Resend's DPA as vendor evidence; add
   the vendor-register entry (cross-border: Tokyo sending region + US primary processing).
2. **Licensing shape — not blocking anything before Slice 14** (D-040). Aniket
   chose functionality first. Settle it before Slice 14 is promoted: what a
   licence grants, what expiry does, who issues it, whether one organisation may
   hold more than one industry.
~~Merge the Slice 8 PR~~ — merged 2026-10-04 (`f5986f1`), deployed, migrations applied, verified live.
~~Approve the black-box hardening~~ — **approved 2026-10-04 and built** in
   PR #23 (D-071): the database now refuses the bank and the provenance
   columns to every client role, tested by direct PostgREST calls.
~~Approve the reporting direction~~ — **approved 2026-10-04: decisions 0–5
   all yes** (`docs/proposals/INTELLIGENT_REPORTING_PROPOSAL.md`).
~~Approve the rewritten SLICE_09 prompt~~ — **approved 2026-10-04.** (Was: — in particular
   its ten §4 decisions and the §6 exposure model 1.0.0 (which domains and
   register gaps evidence each penalty head, the status thresholds 40/60/60,
   and the s.33(2) positioning points). Nothing is built until approved.
   **§6.2 was rechecked against the Act and Rules on Aniket's question
   (2026-10-04)**: governance, inventory, the register itself, AI outside an
   SDF and cross-border were wrongly treated as penalty obligations — they
   are now "enabling controls" that never set a status; H3 now includes
   persons with disability who have a lawful guardian (s.9(1)).)
~~Is there a "Step 13 sample report"?~~ — yes, `DPDP_revised/DPDP_Compass_Step13_Report.docx`
   (Aniket, 2026-10-04) — but it is NOT the target: Aniket wants exposure-led,
   stakeholder-specific reporting, not a readiness scorecard (proposal above).
~~Merge PR #21 (Slice 7)~~ — merged by Aniket's instruction 2026-10-03 (`714749c`); verified live.
~~Red-flag threshold~~ — decided 2026-09-20: **≤ 2** (Aniket, D-046).
~~Slice 5 parity target~~ — decided 2026-09-20: keep the spec's cap, assert both runs (Aniket, D-048).
~~Validate the Slice 4 preview~~ — done 2026-09-20 (Aniket); PR #11 merged.
~~Confirm the 10 University overlay questions~~ — done 2026-09-18 (D-031).
~~Is "108 questions" contracted anywhere?~~ — **no** (Aniket, 2026-09-18). It is
marketing wording only, so the product is free to report the real scope-derived
count. No annexure needed.
~~Confirm the scoring directions~~ · ~~the scoped-out gate~~ — both decided
2026-09-18 (D-037 built and in PR #9; D-038 recorded for Slice 5).

## ✨ Simplicity pass — every built surface to the non-lawyer bar

**Aniket, 2026-10-16:** the platform must simplify DPDP — legally exact, yet
simple; flexible, easy, an excellent experience — **for everything already
built, not only new slices**, tracked, reminded, and corrected without
breaking anything. Register and rubric: **`docs/UX_REVIEW.md`** (44 surfaces,
U01–U44, each scored R1–R11). Prompt: `docs/slices/SLICE_10_5_simplicity_pass.md`.
Status (2026-10-17): B0 shell ✅ · audit ✅ (37 fixes F1.1–F5.6 + N1–N7, approved
D-104/D-107) · B5 ✅ · B5a ✅ · **B1 ✅ (D-112)** · **B2 next**, then B3, B4
to come — see the tracker below and the ▶ Start here box. Every slice gate from
now on scores its own new surfaces (CLAUDE.md, "Simplicity gate").

## 🧭 Client-hosted deployment — keep it possible, remind Aniket at every gate

**Aniket, 2026-10-16:** some clients will refuse the hosted subscription and want
TrustStack in their own premises or cloud — "one click deployment in their
premises. We will work on this as well … remind me at regular intervals."
Proposed as **Slice 15** (`docs/SLICES.md`), not yet scheduled. Until then,
**every slice gate checks it added no hosted-only dependency** and says so in
one line.

Design points already known:
- **Packaging**: single-tenant mode; Docker Compose for a server, Helm for
  Kubernetes, Terraform for the client's own cloud in an India region.
- **Platform**: self-hosted Supabase (Postgres, Auth, Storage, PostgREST) or
  plain Postgres + an auth server + S3-compatible storage; no Vercel-only
  feature; email through the client's SMTP.
- **Roles change**: the client runs it, so Anix is a software vendor, not a
  Data Processor (s.2(k)), unless Anix has support access — that access then
  needs its own contract (s.8(2)).
- **The question bank's black box (D-071) is weak when the client's DBA owns
  the database**: licence terms and/or an encrypted, signed bank are needed.
- **Licensing (Slice 14)** needs an offline-capable, signed licence; the Anix
  console sees nothing of a client-hosted install.
- **AI (Slice 11)**: the client brings its own provider account and region, or
  a private model, through the provider interface; the AI stays off until the
  client enables it.
- **Updates**: the client applies our frozen migrations in order; releases are
  signed and versioned.

## 🚀 Production launch readiness (D-067 — no pilot; launch = end of Slice 14)

Nothing here blocks Slices 8–12; ALL of it blocks go-live. Owner in brackets.

| Blocker | Where | Status |
|---|---|---|
| Licensing + Anix console | Slice 14 (Claude; licence shape is Aniket's) | 🔲 licence shape undecided |
| Combined actions view (both parents) | Slice 8 (Claude) | ✅ live (`/dashboard/actions`) |
| Evidence expiry, answers and ROPA records (D-049) | Slice 13 (Claude) | 🔲 |
| MFA · failed-access logging · reminders | Slice 13 (Claude) | 🔲 |
| Paid production Supabase (backups) + separate staging; dev project lapses 2026-11-02 | Aniket | 🔲 |
| `app.truststack.co.in`, DMARC → quarantine | Slice 13 (Aniket + Claude) | 🔲 |
| Live e2e from CI, not a laptop | Slice 13 (Claude) | 🔲 |
| `pnpm audit`: `next`→`postcss` (high), Prisma tooling | Slice 13 (Claude) | 🔲 pre-existing |
| Counsel review: lawful grounds, Fourth Schedule, retention wording (D-065) | Aniket / counsel | 🔲 |
| Practitioner sign-off: ROPA risk model 1.0.0 (D-067) | Aniket / practitioner | 🔲 |
| Counsel sign-off: exposure model 1.0.0 — head mapping, thresholds, positioning, caveat, forecast method (SLICE_09 §6, D-072/D-073/D-074) | Aniket / counsel | 🔲 Aniket approved Stage 1 (2026-10-06); counsel next. The model is now in core AND SQL — a change bumps the version in both. The reports' wording (D-076) goes to counsel with it |
| Legal citation on every published question (0 of 1,527) | content | 🔲 |
| Resend DPA + vendor-register entry (D-030) | Aniket | 🔲 |
| The other nine industry overlays approved (D-032) — or sell University + core only | content / Aniket | 🔲 |

## 🟡 Open loops

**From Slice 10.5 Stage A**
- **Q1 — the exposure forecast reads two of five action sources** (`readExposureInput`
  passes only assessment and processing-register actions): the Exposure page, the
  Exposure Brief, the Programme Status Report and the Evidence Pack under-count open
  work (MU: 1 counted, 4 open). **Approved fix (D-104): count every source — model
  1.7.0, built in Batch B4.** Until then the live site keeps the under-count.
- **The audit generated MU reports on the LOCAL database only** (rebuilt after:
  reset → migrate → seed); nothing was written to hosted.

**From Slice 10.5 Stage B0**
- **The shell adds one signed-in read per page load** (`/auth/me` for the name;
  the organisations list moved from the switcher to the top bar, so it is not
  new). On this laptop's local stack the Auth container's port exhaustion
  ("cannot assign requested address", Slice 9 Stage 3's loop) now shows on a
  full UI run as one or two org-switch steps failing — each green alone.
  If it reaches CI, cache `/auth/me` per session in the client.
- **Not paged in B0**: per-item evidence and document lists, the gap register
  (its own views); the scope wizard and the ROPA record are long single pages.
  Stage A scores them.
- **The overview's "Signed in as … `legal_user`" panel** now repeats the top bar
  with a raw role code — Stage A (copy) decides.

**From Slice 10 Stage 6**
- **The consent UI e2e "an admin writes and publishes the notice…" flaked once
  in CI** (`879cefb`: "Draft saved." still on screen when "Version 1 is
  published." was expected; green on the automatic retry). Stage 6 did not
  touch consent. Wait for the published state before asserting the message;
  Slice 13's hardening pass if it recurs.
- **Full local e2e runs flake on sign-in-heavy UI specs** (retention UI's admin
  test, ROPA UI's first test — both green alone). Known since Slice 9; CI is
  the authority.

**From Slice 9 Stage 4**
- **A Vercel cold start of report generation is unmeasured** (carried from
  Stage 3). Locally: PDFs 0.2–0.35 s, spreadsheets under 0.1 s. The evidence
  pack generates two files in one request (`maxDuration` 60 s).
- **Every role can list every report, owners' packs included** (`report.read`,
  Stage 3's RLS): a department owner sees that a colleague's pack exists and
  who generated it, but cannot open it. Narrow it (own packs only for
  contributors) if Aniket wants — a policy change, so after the deploy.
- **The full local e2e suite was not re-run this stage** (the laptop's Auth
  container exhausts its ports on a full run — Stage 3's open loop). The
  Stage 4 specs and every spec the refactors touched pass locally; the full
  suite is CI's on PR #25.
- **Consent and notice text in 22 languages** (SLICE_10 decision 6) needs
  human translation and counsel review — never machine translation.
- **The evidence index omits a link whose target the caller cannot read**
  rather than inventing one. Every generating role reads everything today; a
  narrower role in future would see a shorter index, by design.

**From Slice 9 Stage 3**
- ~~Hosted does not have `20261010000000_reports` yet~~ — applied
  2026-10-08 on Aniket's approval.
- ~~A Vercel cold start of PDF generation is unmeasured~~ — carried into Stage 4's loops. (D-076.1.) Locally:
  0.1–0.6 s per report. Check on PR #25's preview by hand; `maxDuration` is
  60 s on the two generating routes.
- **The full local e2e suite no longer completes cleanly on this laptop**
  (2026-10-06; CI on `8578dbe` is 248/248, confirming it is local only): 3–5 UI tests in `tenancy`, `scoring`, `ropa`, `scope` fail
  on every full run and pass alone. The Stage 2 commit fails the same way,
  so it is not Stage 3. The Auth container logs "cannot assign requested
  address" connecting to Postgres: ephemeral-port exhaustion under ~13,000
  Auth calls in 20 minutes, which a stack restart did not cure. The laptop
  also runs about a dozen unrelated containers. CI's fresh stack is the
  authority; a fix would be the Slice 13 live-e2e/`storageState` work (fewer
  sign-ins), or fewer `getUser` calls per request.
- **Only Latin and Devanagari text renders in a PDF.** A name or title in
  Tamil, Bengali, Gujarati and the like prints as missing glyphs. Add the Noto
  fallbacks when a client needs them (about 200 KB each).
- **A failed or abandoned generation leaves a row** (failed, or "running" and
  shown as failed after ten minutes) and, if the upload had finished, an
  unreferenced file. Nothing purges them: the Slice 13 purge job, with
  evidence's.
- **The live view and the report's snapshot are read in the same request,
  not the same transaction.** An action closed in between would show in
  leverage but not in the stored headline. Harmless for a ranking; the
  headline is always the stored one.

**From Slice 9 Stage 2**
- ~~Hosted does not have `20261009000000_exposure_snapshots` yet~~ — applied
  2026-10-06 on Aniket's approval.
- **D-074.12 — kept as 1.0.0 by Aniket's approval (D-075):** finishing a
  head's last gap can raise its position a point (the (e) factor); with no
  assessment, closing a head's only register gap shows it as Not yet
  assessed. Worth putting to counsel with the model sign-off; a fix is a
  1.1.0 bump in core and SQL together.
- **A stored snapshot is permanent** (immutable; it goes only with its
  assessment). e2e records snapshots only on disposable tenants, never on MU
  or BML — keep it that way, or the hosted history fills with test rows.
- **Leverage is a ranking, not a simulation of the best plan**: closing the
  top ten one at a time often "moves no head by itself" when a head has many
  gaps. The what-if shows the combined effect. A "smallest set that moves a
  head" search is a possible Slice 11/12 feature.
- **The local production server can outlive `pkill -f "next start"`** (its
  process is `next-server`): kill by port (`lsof -tiTCP:3100`) before a
  rebuild, or the browser loads stale chunks (ChunkLoadError).

**From Slice 9 Stage 1**
- ~~Hosted does not have `20261008000000_exposure_sdf` yet~~ — applied
  2026-10-06 on Aniket's approval.
- **No bank question asks about guardian consent for persons with
  disability.** H3 can now apply through the guardian answer alone (s.9(1)),
  but the CHILD domain's questions ask about children. A content gap for
  `CORE_DPDP_V2`, beside the five already listed under Content gaps.
- **The per-domain mapping is coarse (§6.2, accepted for 1.0.0):** BREACH
  detection questions count towards H2 although they are Rule 6(1)(c) (H1).
  The per-question provision tag (`legal_control_basis`) fixes it and bumps
  the model version.
- ~~Reasons lists are long~~ — the Command Centre shows direct evidence first
  and collapses root causes (Stage 2).
- **GitHub was unreachable from the laptop for part of 2026-10-05**
  (timeouts on every port; npm worked). Pushed once it returned; draft PR #25.

**From Slice 8**
- ~~The assessment questions API still carries codes to clients~~ — **closed
  by D-071**: provenance is withheld by column privilege and returned only to
  `question.read_bank` holders through `assessment_provenance`. (Question
  CODES like `G1.2` are still shown on the assessment page — they are the
  client's own identifiers, not bank internals.)
- **No role in today's matrix lacks a dashboard section.** The omission logic
  (a section returned as null and named in `omitted`) is written and
  type-checked but reachable only by a future, narrower role. Test it when
  one exists.
- **The actions page reads every assessment's gaps** (D-069.4) — one reader
  call per assessment. Fine for the handful a tenant holds today; if a tenant
  ever accumulates dozens of reassessments, read actions by organisation in
  one paged query instead.
- **Spec filters not built:** department, evidence status and due-date range
  on the actions page (source and severity are). Status is implicit (open
  only). Add when a client asks.
- **No trend lines** — one baseline exists; Slice 12.
- **The first full e2e run after a build lost four API tests** that pass
  serially — the start-up pattern Slice 7 recorded (`JWT issued at future`).
  The second full run was clean. Not chased.

**From Slice 7**
- **The seeded review dates have passed** (they were 2026-10-03). All ten workbook records have
  `Next Review` 2026-10-03. From 2026-10-04 (India) every one of them is
  overdue: the register's "Review overdue" tile reads 10 and generating ROPA
  gaps opens ten `review_overdue` gaps. Correct behaviour on real data; a trap
  for any test that asserts a date-dependent count on the seed.
- **No ROPA gap is seeded, and the register can be stale** (D-062). A fresh
  tenant shows "not generated yet" until someone presses Generate, exactly as
  the assessment register does. A consultant who never regenerates works from
  an old list that says it is old.
- ~~Import is CSV only~~ — **Excel (.xlsx) import added** (D-067), behind
  pre-parse checks: size, the ZIP directory (no bomb, no ZIP64, no macros, no
  external links) and a time limit; values only. `.xls` (the old binary
  format) and `.xlsm` are refused — "save as .xlsx" is the message.
- **The import's audit row counts only what reached the database.** Its
  `rejected` is the rows the DATABASE refused (a duplicate ID); rows core
  rejected first are reported to the user but are not in the log's count.
  `submitted` is what was sent. Good enough for a trail; say so if a report
  ever quotes it.
- **A ROPA record is live, never snapshotted.** Unlike a finalised score, the
  register has no frozen copy; Slice 9 must decide whether a report freezes the
  register it quotes (noted in SLICE_09).
- **The spec's other ~25 ROPA fields are backlog** (D-061): purpose category,
  necessity, collection method, hosting model, access control, logging, DPDP
  clauses, sub-processors, erasure trigger, AI use case, DPIA-style review…
  Several duplicate what the Slice 2 registers already hold per system and
  vendor; linking a record to them may be the better route than new columns.
- **Scope-wizard and AI suggestions of records are not built** — Out, by the
  prompt (Slice 11 for AI; a later slice for wizard suggestions).
- **The record form's "if saved" preview runs core in the browser** — the same
  rules the database runs, and the mirror test holds them together. The SAVED
  number is always the database's.
- **The first from-zero e2e run can fail at start-up with `PGRST303 JWT
  issued at future`** — Docker's auth and REST containers disagree on the
  clock for a few seconds after `supabase start`. Wait, or re-run; do not chase
  it as a code bug. CI has not hit it (its stack starts long before the e2e
  step).
- **No ROPA reminders.** A review date passes and the register turns red;
  nobody is emailed — Slice 13, with the action reminders.

**From Slice 6**
- **A full live e2e run now rarely completes cleanly from a laptop.** The
  suite is 157 tests and about 4½ minutes serial against production; two runs
  on 2026-10-02 each lost a request to `read ETIMEDOUT`. Because the long
  specs are `serial`, one timeout skips the rest of that file, so a single
  dropped packet costs up to nine tests. Playwright retries are on in CI only.
  Either allow one retry when `PLAYWRIGHT_BASE_URL` is set, or run the live
  check from CI rather than from a laptop — a Slice 13 job, with the
  `storageState` work already listed there.
- **Never run `next build` (or the e2e suite, which builds) while `next dev` is
  running in the same checkout.** They share `apps/web/.next`. On 2026-10-02 a
  dev server left running for manual testing made a local build fail once,
  serve a 500 from `/api/v1/health` once, and fail six unrelated e2e tests at
  sign-in. CI was unaffected. Stop the dev server first.
- **Vercel previews sit behind Vercel Authentication**, so scripts
  (`tools/answer_assessment.mjs`, a live e2e run) cannot reach a preview URL.
  Run the branch locally against the hosted database instead — it is the same
  data the preview shows.
- **A closure can outlive the evidence it stood on.** If a reviewer accepts an
  artefact, the action closes on it, and a second reviewer later re-reviews the
  same artefact as Rejected, the action stays Closed with `closure_basis =
  'evidence'`. Detaching is refused while closed; re-reviewing is not. It
  takes two reviewers disagreeing, and the register shows the artefact's
  current verdict — but nothing reopens the action. Close before GA: either
  refuse the re-review, or reopen the action in the same transaction.
- **Reviewer approval is two people on paper, not always in fact.** A reviewer
  who did the work can assign a colleague as owner and then approve the
  closure. It is all on the audit log; it is not refused (D-056). The evidence
  route is the strong one.
- **The register is regenerated on request, not on every answer** (D-057). In
  between, `GET …/gaps` reports `stale: true` and the UI says so. A consultant
  who never presses Regenerate is working from an old register that announces
  it is old. Finalising always regenerates.
- **One action per gap.** The schema allows more and the API returns
  `actions[]`, but no route creates a second one. A gap that needs three
  workstreams is one action with notes today.
- **A Blocked action needs no reason.** The status exists; nothing asks why.
- **Slice 5's snapshot trigger shares a hazard this slice guarded against.**
  A snapshot hangs off both its assessment and its organisation;
  `app.snapshot_is_immutable` treats "the assessment is gone" as the sign of a
  cascade. When a whole ORGANISATION is deleted, nothing guarantees the
  assessment's cascade reaches the snapshot before the organisation's own
  does. **It works today** — checked on a local stack on 2026-10-02 by
  deleting an organisation that owned a snapshot — because Postgres fires the
  cascade triggers in NAME order, the names end in an OID, and the
  assessments FK was created first. That holds only while those OIDs have the
  same number of digits; it is an accident of creation order, not a design.
  The gap freeze looks the organisation up as well, and an RLS test deletes a
  whole finalised tenant. Give the snapshot trigger the same lookup before
  Slice 13's erasure work depends on it. Left alone here because D-052 is
  settled and this slice had no reason to reopen it.
- **Dates are India's.** Due dates and the roadmap use `Asia/Kolkata`,
  hard-coded in SQL and in `lib/client/gaps.ts` (D-055). Correct for a DPDP
  product; a per-tenant time zone is not modelled.
- **The backfilled assessment's due dates count from 2026-10-02**, not from
  the day it was finalised (D-058). Hosted dev data only.
- **The gap register is not paginated.** One request returns every gap — at
  most the assessment's question count, 124 for MU. PostgREST caps a response
  at 1,000 rows, and no assessment can reach that today (the largest draft
  overlay would give ~300). Revisit if a pack ever makes it possible.
- **No reminders, no escalation.** A due date passes and the roadmap turns
  red; nobody is emailed. Out of scope by the prompt — Slice 13.
- **CHECK constraints are evaluated in NAME order.** A test that asserts which
  constraint refused a row must make only that one fail; the first version of
  one here named the wrong constraint. Carried into the Slice 7 pitfalls.

**From Slice 5**
- **`pnpm dev` does not read the repo-root `.env.local` on its own.** Next looks
  for env files in `apps/web/`, not the monorepo root, so although
  `next.config.ts` calls `loadEnvConfig` on the root, the **edge middleware**
  bundle never receives the variables and every `/dashboard` request fails with
  `NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set`.
  Sourcing the file into the shell does not work either — some values contain
  spaces and `>`. Worked around locally with `apps/web/.env.local` as a symlink
  to the root file (gitignored). A proper fix belongs in `next.config.ts` or in
  a documented per-app env file; build, CI and Vercel are unaffected because
  they inject real environment variables.
- **Falling back to the LOCAL stack for dev is a two-minute job** and is worth
  knowing for 2026-11-02. Start the stack, `pnpm db:migrate && pnpm db:seed`,
  then drop an `apps/web/.env.development.local` carrying the CLI's local URL
  and keys — Next loads it *before* `.env.local`, so it overrides the hosted
  values in `pnpm dev` only, and nothing reaches CI, Vercel or the build. This
  was done on 2026-09-30 while the project was missing and **removed again**
  once it came back. Note the local seeded users' password is the CI value
  (`app.yml`), not the one in `.env.local`.
- **Evidence freshness is still not modelled (D-049).** Deferred to Slice 13, on
  purpose and with the cost stated: a three-year-old document reviewed as E5 still
  supports a claim of 5 today, and nothing prompts a reviewer to revisit it. It
  must be closed before general availability. When it is built it is a migration,
  not a setting — the cap is a row invariant, so the D-044 CHECK widens with it.
- **The assessment page now renders an answer panel for all 124 questions.** Slice
  4 rendered eight. First paint is visibly slower and three e2e tests flaked on it
  until they were given explicit readiness waits. It works, but a 124-panel page is
  not the client-facing presentation — **Slice 8** should paginate or collapse by
  domain. Do not treat the waits in `e2e/ui/scoring.spec.ts` as the fix.
- **Running the full e2e suite against the LIVE site is flaky from a laptop, and
  that is not a code signal.** Three runs on 2026-09-30/10-02: one clean
  141/141, one with a single `read ETIMEDOUT`, one with an ETIMEDOUT plus a
  sign-in that did not finish inside the 5-second assertion window. The live
  site was healthy throughout (`/api/v1/health` ~180 ms). Each test crosses two
  networks — laptop → Vercel → Supabase Mumbai — so a slow hop fails a test that
  CI, running everything locally, never sees. **Treat a timeout as a timeout:
  re-run, and do not re-run until green and call that verification.** The
  authoritative signals are CI on `main` and one clean live run, both recorded
  for Slice 5.
- **Re-seed before running RLS against a database somebody has been testing on.**
  `tests/rls/*` assert the SEEDED state of Mumbai University's baseline, so
  manually answering `G1.2` or detaching its artefact makes 8 of them fail with
  no code change. `pnpm db:seed` restores it (it resets that assessment's
  answers, not just upserts them). Found on 2026-10-02 after manual Slice 5
  testing followed the guide's steps on the seeded baseline — prefer a
  throwaway assessment for manual testing, as the Slice 5 guide's later steps do.
- **The live e2e run against the HOSTED project needs `--workers=1`.** The suite
  has grown to 141 tests and its browser sign-ins are not cached (only API tokens
  are). In parallel it trips the hosted project's `sign_in_sign_ups` limit, which
  was never raised — CI is unaffected because its local stack sets it to 1000.
  Serial takes ~2.1 minutes and passes 141/141. Caching browser sessions with
  Playwright `storageState` is the real fix, and is a Slice 13 job.
- **`answerEverything` in `e2e/api/scoring.spec.ts` writes in batches of 8.**
  124 sequential writes took over 30 seconds against Mumbai and timed out; that
  test now also carries a 180-second budget. Anything that answers a whole
  assessment over the network needs the same treatment.
- **The local Supabase stack degrades under sustained repeated runs.** After
  roughly fifteen consecutive full e2e runs, Auth began returning `Database error
  querying schema` and a run collapsed with 13 unrelated failures. The runs either
  side were 141/141 and the hosted run was 141/141, so it is stack saturation on a
  laptop, not a regression — but do not chase a cascade of unrelated auth failures
  as a code bug. Restart the stack instead.
- **Two artefacts leak per unlink, still.** Slice 4's purge gap (STATE below) now
  has a second source: a detached artefact has no link, so any cleanup that finds
  evidence through `evidence_links` misses it. `e2e/ui/scoring.spec.ts` works
  around this by cleaning up on its own file name. The real purge job is Slice 9/13.
- **`MATURITY_BANDS`, `RED_FLAGS` and the severity ladder now exist twice** — in
  `packages/core/src/engine.ts` and in SQL (D-053). `apps/web/tests/unit/scoring-engine.test.ts`
  parses the migration and fails if they diverge. Any new rule must go in both.
- **Nothing is seeded as finalised** (D-052), so no screen has ever been seen with
  a real frozen snapshot outside the e2e suite. If a demo needs one, seed a
  separate small assessment with every question answered — do not finalise MU's.

**From Slice 4**
- **The workbook encodes the naive cap (D-045).** `Responses!J` is
  `MIN(claimed, evidence)` (and `MIN(…, 3)` when evidence is not current) — not
  the spec's E0→1, E1→2 table. **Correction (D-047):** the sample is NOT claim =
  evidence everywhere — 5 `CB1.x` rows separate the rules, so parity is affected.
  Settled by D-048: the gate asserts both runs. The spec's table governs; recorded so nobody "fixes" the engine
  towards the workbook. Freshness and the red-flag threshold are Slice 5's calls.
- **Hosted dev DB — clean.** Migration `20260918200000_evidence_scoring` was
  developed against a LOCAL Supabase stack (the CLI via `npx`, as CI does) and
  applied to `nywwsdcnqivefednqezw` once, final, with `pnpm db:migrate`. No
  post-apply edits, so no drift note this time. `prisma migrate status` clean;
  `pnpm db:types --check` clean against hosted.
- **Test teardown leaves orphan blobs.** Users can never delete evidence (D-042),
  so e2e cleanup deletes `storage.objects` rows with `storage.allow_delete_query`;
  the bytes stay in the storage backend unreferenced. A few bytes per live e2e
  run. A proper purge (Storage API with the service role, from the worker) is a
  Slice 9/13 job — and the same job must handle evidence retention and erasure.
- **Abandoned uploads leave inert rows.** `POST …/evidence/upload-url` registers
  the row before Storage will sign (its INSERT policy needs the row). If the file
  never arrives, the row can never be linked, reviewed or shown — the database
  checks the object exists — but it stays. Same purge job.
- **The upload URL lives 2 hours** — Storage's fixed expiry for signed upload
  URLs, not configurable from `createSignedUploadUrl`. It can create exactly one
  object at one registered path, once (no overwrite). Download URLs are 60 s.
- ~~Evidence freshness is not modelled at all~~ — **decided by Slice 5 (D-049):
  deferred to Slice 13**, with the cost written down. See the Slice 5 loops above.
- **One transient failure** on the first full e2e run against hosted: Slice 2's
  `GET /industries` returned no body under load; the file passed 8/8 on rerun.
  Not reproduced locally or in CI. Watch for it.
- **A mandatory question cannot be N/A** (D-041) — a new rule, stated in the
  question UI by simply not offering N/A there. If MU's consultant finds a
  mandatory core question that genuinely does not apply, that is a bank-content
  change (its applicability), not an answer.
- ~~`evidence_links` has no user DELETE~~ — **closed by Slice 5** (D-051).
  `DELETE …/evidence/{id}/links/{responseId}` detaches an artefact from one
  answer and re-derives that answer's level and adjusted score in the same
  transaction. The artefact itself is still never deleted.

**From Slice 2**
- Aniket decided 2026-09-15: DPDP Programme Owner may edit scope → `scope.write` (D-026).
- Aniket approved thresholds 2026-09-15 as configurable internal triggers with
  tiers, non-statutory wording and enhanced-review flags (D-028) — built into PR #7.
- **No linter is configured** (no ESLint script). Merge checks today = typecheck,
  unit, RLS, route guard, secrets guard, build, e2e. Adding ESLint is a small
  follow-up if wanted.
- Wizard-field backlog for Slice 3 (D-029): placements, alumni, hostel, transport,
  call centre, high-volume marketing, support recordings, health vs financial data,
  breach-prone systems.
- Migration `20260915100000_scope_wizard` applied to the hosted dev DB with
  `pnpm db:migrate` (no manual SQL this time); seed re-run; counts match CI.
- Bug found and fixed before merge: a vendor create with an invalid system link
  returned 422 but left the vendor row. Now validated before insert + compensated (D-027).
- Test load hit Supabase Auth's sign-in rate limit: e2e helpers cache access tokens
  per worker; CI's local stack raises `sign_in_sign_ups` (config.toml, CI only).
  **The hosted project's own limit was not changed** — live e2e runs rely on the cache.
- RLS harness fix: privileged setup inside a test transaction now uses a savepoint
  and clears JWT claims (otherwise "tooling" writes looked like user writes).
- `SEED_SCOPE` ids use variant nibble `8` — API UUID validation (Zod) rejects
  non-RFC variants, so fixtures must be real v4-shaped UUIDs.
- Spec gaps: `departments.head_user_id` dropped (D-026); `data_categories` still Slice 7.
- `organization_users.department_id` now has a composite FK; MU's Department Owner
  is in Examinations.

**Invite emails (2026-09-15, PR #5 merged `625d7d6`, D-025) — ✅ verified live**
- Live e2e 39/39 against production after merge.
- Aniket's manual test on the live site, 2026-09-15: invite to a personal Gmail
  as Auditor/Reviewer → email #1 in **inbox** (not spam) → Resend → email #2 →
  email #1 link "not valid" → account created from #2 → dashboard as
  `auditor_reviewer` → #2 link reused "not valid". Audit log shows
  `user.invited` 16:05, `email_sent` ×2 with Resend message ids (16:05, 16:22),
  `invite.reissued` 16:22, `invite.accepted` 16:25 IST.
- That test account was deleted on request the same day (invite, membership,
  `users` row, Auth user — one transaction). Its audit rows remain, append-only,
  with `user_id` set null by the FK.
- Resend verified for `notify.truststack.co.in` (Tokyo). `RESEND_API_KEY` and
  `INVITE_EMAIL_FROM` set in Vercel (Production + Preview) and `.env.local` by Aniket.
- Migration `20260915000000_invite_reissue` applied to the hosted dev DB.
- CI has no Resend key on purpose: all CI invitees are example.com → suppressed.
- DMARC is `p=none` (monitor only). Tighten to `quarantine` once a few weeks of
  clean sending are seen — Slice 13.
- Near-miss 2026-09-15: real Supabase keys for an unused project
  (`wkiqwinadqndlcsdrcow`) were pasted into `.env.example` locally. Caught before
  any commit; file restored. Aniket confirmed that project is not in use.

**From Slice 1**
- **Hosted dev DB — honest note.** The `tenancy_rbac` migration was applied with
  `pnpm db:migrate`; its final block (`_prisma_migrations` lockdown) was added
  afterwards, run by script with the identical SQL, and the checksum in
  `_prisma_migrations` updated to match the file. `prisma migrate status` is clean.
  CI proves the full file applies from zero.
- `.env.local` gained `ACTIVE_ORG_COOKIE_SECRET` (generated). `.env.example` has the name.
- **Spec gap filled by judgement (D-020):** legal / IT-security / procurement
  roles are not in the spec matrix — modelled as Department Owners.
- **`super_admin` has no cross-tenant power** — acts only where it is a member.
  A platform admin console is now planned as **Slice 14** (D-040).
- **Denied access is not audited.** 403s are returned but not logged; Rule 6(c)
  "monitoring" may want failed-access logs. Candidate for Slice 13's security pass.
- **Bug found and fixed in CI:** sign-out used Supabase's default `global` scope,
  revoking *all* of a user's sessions; a parallel UI sign-out broke an API spec's
  bearer token. Now `scope: "local"`. Also: CI's RLS step needs `packages/core`
  built first (`test:rls` now builds it).
- e2e runs create `e2e-invitee-*@example.com` Auth users and delete them after
  each spec; their audit rows remain (append-only, `user_id` set null).

**From Slice 0B**
- Supabase Auth email confirmation is on (`mailer_autoconfirm=false`) — invites
  bypass it by design (D-022).
- Pitfall hit: the Prisma client is gitignored, so `db:seed` runs `prisma generate` first.
- Hosted dev DB holds test audit rows from local e2e runs. Harmless.

**From Slice 3**
- **The University overlap is settled (D-031).** Aniket confirmed the 10 overlay
  questions on 2026-09-18. `MU_Overlay` U3 became a new authored question,
  `UNI-GOV-009`, so the University file is 108 and the bank 1,527.
- **The other nine industry overlays are `draft` (D-032)** — each still owes the
  same overlap exercise before that industry is sold. Until then a
  non-University organisation gets the core pack only.
- **The six cross-industry conditional packs have no authored questions at all**
  (`CHILDREN_DATA_V1`, `VENDOR_PROCESSOR_V1`, `CLOUD_CROSSBORDER_V1`,
  `AI_RISK_V1`, `MARKETING_TRACKING_V1`, `SDF_READINESS_V1`). They exist as rows
  so `selectQuestionPacks()` resolves and the gap is visible; MU's generation
  reports all six as skipped on every run. Authoring them is content work.
- **11 authored trigger phrases cannot be evaluated yet** — the wizard-field
  backlog, now measured rather than estimated. For Mumbai University:
  `NAD/DigiLocker used` · `events collect data` · `hostel/welfare services` ·
  `international collaborations` · `placements` · `placements conducted` ·
  `placements/alumni/events` · `scholarship/category data` ·
  `scholarship/reservation data` · `GenAI use possible`. Each shows its question
  as **Potentially Applicable**, so nothing is hidden — but a wizard field would
  turn judgement back into derivation. 80 of the 110 distinct phrases across all
  ten files are unmapped; the BFSI and healthcare process phrases are the bulk.
- **A domain can end up with no questions.** An organisation with no Data
  Processors gets 92 of the 98 core questions (`V1.1`–`V1.6` are conditional on
  "vendors exist"), and the `VENDOR` domain has none at all — while keeping its
  weight of 7. ~~What it contributes to the score is Slice 5's call~~ — **built
  in Slice 5 to D-038**: it is `scoped_out`, scores null (never zero), and leaves
  the denominator, so such a tenant is assessed on **93 applicable weighted
  points** with a visible coverage line. An e2e test pins it on a `general` tenant.
- **Hosted dev DB — honest note.** Migration `20260918000000_question_bank` was
  applied with `pnpm db:migrate`. Two `question_versions` CHECK constraints were
  then revised (D-033) and the RPC moved from `app.` to `public.` (D-035); both
  changes were applied to that database by script with the **identical SQL now
  in the migration file**, so the file and the dev DB agree. CI proves the file
  applies from zero.
- Seed counts changed: `2/9/10/2/10/29/193/10/10/11/4/5/8/2/16/20/1527/1527/1/124`.
  CI gained four gates — those counts, the 100.00 weight total, no user write
  grant on the bank or the snapshot, and no placeholder legal basis.
- **Spec deviation recorded (D-035):** assessment routes nest under
  `/organizations/{id}/` rather than the spec's flat `/assessments/{id}`.
- **Vendor scope gate added after CI first went green (D-037).** Migration
  `20260918100000_vendor_scope_gate` — a separate migration rather than an edit
  to the applied one, so there is no second drift note. Applied to the hosted
  dev DB with `pnpm db:migrate`; the backfill set MU and BML to `yes` from their
  own registers. `EMPTY_SCOPE.usesDataProcessors` is `unknown`, unlike its
  neighbours which default to `no` — deliberate, and commented.
- **Not built, deliberately:** `usesDataProcessors = unknown` does NOT add a risk
  tag or an enhanced-review trigger. It gates the questions, which is what the
  decision asked for. Adding a tag would change `RISK_TAGS`, the DB CHECK and
  pack selection; worth considering in Slice 5 when the scoring consequence of
  "we do not know" becomes visible.
- e2e spec files run in **parallel** against one database. Two tests learned it
  the hard way; scope-writing specs now use a disposable tenant
  (`createE2eTenant` in `e2e/helpers.ts`) whose member is a seeded user no other
  spec asserts. If a run crashes, the next `beforeAll` cleans it up.

**Content gaps — not blocking the MU pilot** (`docs/QUESTION_FORMAT.md`)
- **SaaS: no priorities** on 156 questions; **process packs: no priorities** on 78.
  All 234 are stored as `null` and shown as "—" — never guessed.
- **No per-question legal citation** anywhere: 0 of 1,527 have one. The core
  pack's placeholder sentence is stored as `null`, and CI fails if it ever
  reaches the database. Required before general availability.
- Four core questions vaguer than the Rules: 8(3)/6(e) one-year log floor ·
  14(3) 90-day grievance SLA · 9 contact in every rights response · 3(c) Board
  complaint route. Plus Fourth Schedule Part A(3) carve-out for `CH1.4`.
- **Five more core gaps found by the overlap exercise** (`OVERLAP_UNIVERSITY_CORE.md`
  §6): core has **no question on DPDP training or awareness at all**; no approval
  authority for notices, consent text, retention schedules, vendor clauses or
  breach communication; no implementation roadmap (`G1.7` is budget only);
  erasure never reaches backups and archives; grievance records are not
  themselves protected as sensitive. Candidates for a future `CORE_DPDP_V2` —
  they were deliberately NOT smuggled in as University overlay questions.

**🔶 The operating model, and where it lands in the plan (D-040)**
Aniket, 2026-09-18: one client = one tenant = one industry = one licence; the
client's admin manages it, alone or with an Anix consultant; to the client the
platform is a black box. **Functionality first**, so:
- **Licensing and an Anix-side console → Slice 14** (new), after the MU pilot and
  before a second client. Nothing in Slices 4–13 depends on the licence shape.
  Neither existed anywhere in the plan before 2026-09-18 — D-008's "entitlement
  tables" were listed and never built.
- **The question-bank browser is not a black box yet** — it lists all 20 packs to
  everyone. Fixed in **Slice 8** with the rest of the client-facing presentation.
- **Nothing may be University-specific** outside the University packs. Slice 4's
  keystone runs on a `general`-industry tenant as well as MU to prove it.
- The scope wizard's system vocabulary is University-flavoured (`sis`, `lms`,
  `exam`; nothing for EMR, core banking, POS or plant systems). Widen it as each
  industry overlay is approved (D-032).

**Other**
- Old app freeze not yet explicitly confirmed by Aniket (D-002). Not blocking.
- Staging/production domains undecided. New app stays on a Vercel preview domain;
  takes `app.truststack.co.in` at Slice 13.

## ✅ What is built

### Slice 8 — Dashboards · 2026-10-04 · PR #23 (merged `f5986f1`)
**Deploy:** verified 2026-10-04 — `f5986f1` live, both migrations on hosted, 31/31 touched specs live (detail at the top of this file).
Manual test guide: `docs/testing/SLICE_08_manual_test.md`.
**Supabase:** `20261006000000_question_bank_black_box` (additive) and `20261007000000_black_box_database` (applied after the deploy) — both on hosted.

| Gate | Status |
|---|---|
| 1 Migration + RLS | ✅ `20261006000000_question_bank_black_box` — one permission (`question.read_bank`) granted to `super_admin` and `consultant`; **`20261007000000_black_box_database`** (D-071) — bank SELECT policies require `question.read_bank`, `bank_for_generation` and `assessment_provenance` (SECURITY DEFINER), provenance columns withheld by column privilege. No new tenant table |
| 2 `packages/core` | ✅ `dashboard.ts`: `ACTION_SOURCES` + labels, `isOutstanding`, `summariseActions`, `groupActionsByOwner`, `bucketActionsByWindow`, `countRopaRegister` (the spec's ten ROPA metrics, now shared with the register page); `rbac.ts` gains the permission and keeps it from the Organisation Admin |
| 3 Unit tests | ✅ core **787** (was 752: +35 — every count alone, boundaries at today / 60 / 61, superseded gaps, Unassigned first, the window table, the matrix row, an admin refused a consultant); web **327** (was 315: +12 — `dashboard.test.ts`: no scoring/completeness/risk import or direct table read in the reader or either page, the shared readers, no "compliant", `pickAssessments`) |
| 4 API + guards | ✅ `GET /organizations/{id}/dashboard` (`withApi`, `organization.read`, each section on its own permission, omitted not errored); `GET /question-packs` and `…/[code]/questions` now require `question.read_bank` (D-071); assessment, generation and scope responses allow-listed per view |
| 5 Cross-tenant | ✅ RLS **310** (was 307: +3 — only Anix roles hold the permission in both tenants; a client's pack list comes from its own tenant's rows, BML sees none; the invite RPC refuses an admin minting a consultant). Route sweep: the dashboard in both directions (Org A's own carries no Org B marker; Org B's path 403), and both bank routes in both directions (BML sees no MU pack, cannot open one) |
| 6 UI on real data | ✅ `/dashboard` (executive overview), `/dashboard/actions` (owner-wise + roadmap, source and severity filters), the bank browser's client view, the assessment page collapsed by domain. KPI tiles and labelled chips — no chart library (D-069.5). Never "compliant" (tested) |
| 7 Seed | ✅ nothing new needed (§11): MU's baseline, gap and records; BML the empty state. CI seed string now `…/30/195/…` |
| 8 Audit | ✅ nothing new is written — every route here is a read; the dashboard writes nothing, and the action edits it links to were already audited by trigger (D-027) |
| 9 CI + deploy | ✅ CI green on PR #23 (5/5); merged; deployed (`f5986f1`); both migrations on hosted; 31/31 of the touched specs live |
| 10 Docs | ✅ this Sync Step; D-068, D-069; SLICE_09 promoted; SLICE_10 stub-checked; CLAUDE.md (one rule) |

**The six §4 decisions** (each recorded, each reversible):

| | Decision | |
|---|---|---|
| Which score | newest finalised snapshot (dated, frozen) AND the live score of an assessment started after it (provisional) — two tiles, never one number | D-069.1 |
| One endpoint | `GET …/dashboard` over the existing readers, extracted from their handlers so route and dashboard share them | D-069.2 |
| Black box | `question.read_bank` for Anix staff, enforced by RLS and column privilege; clients read their questions on their own assessment | D-068, D-071 |
| Owner-wise | the person; Unassigned first; source + context (domain / record and rule); every assessment's actions | D-069.4 |
| Charts | none — KPI tiles and chips, no new dependency | D-069.5 |
| Collapse | domain header buttons; first open; closed groups render no panels; every test id still reachable | D-069.6 |

**Found and fixed while building**
1. **The shared roadmap grouped owners by display name.** Two people with one
   name would have merged, and a former member with no name fell into
   "Unassigned". It now groups by owner id (D-069.4).
2. **My own read-only test was wrong first time:** it treated any link whose
   text began "Approve…" or "Attach…" as a write control — but an action's
   TITLE is data and can begin that way. The link check now names the two
   real write links exactly.
3. **The e2e name-prefix guard caught the new specs** — both wrote
   `'${NAME_PREFIX}%'` inline, which the guard reads as one shared literal.
   Switched to the parameterised form every other spec uses.

**Files**
- `packages/core/src/dashboard.ts` (+ test); `rbac.ts` (+ test); `index.ts`.
- `packages/db/prisma/migrations/20261006000000_question_bank_black_box/`.
- `apps/web/lib/dashboard/read.ts`; readers extracted: `readAssessmentScore`
  (`lib/assessments/score.ts`), `readGapRegister` + `countsOf`
  (`lib/gaps/routes.ts`), `ropaCountFacts` / `ropaRegisterCounts` /
  `readRopaGapRegister` (`lib/ropa/shape.ts`), `listAssessments`
  (`lib/assessments/routes.ts`); `packCodesInUse` / `packForClient` /
  `questionForClient` (`lib/assessments/bank.ts`).
- Routes: `app/api/v1/organizations/[id]/dashboard/route.ts`;
  `app/api/v1/question-packs/**` (filtered).
- UI: `app/dashboard/{page,executive-overview}.tsx` (`latest-score.tsx`
  removed), `app/dashboard/actions/`, `questions/question-bank-browser.tsx`,
  `assessments/[assessmentId]/assessment-detail.tsx` (collapse, plain reasons),
  `score-panel.tsx` (`Scorecard` exported), `gaps/roadmap.tsx` (by owner id),
  `layout.tsx` (Actions link); `lib/client/{dashboard,assessments}.ts`.
- Tests: `tests/unit/dashboard.test.ts`; `tests/rls/question-bank.test.ts`
  (+3); `e2e/api/dashboard.spec.ts` (5), `e2e/ui/dashboard.spec.ts` (7),
  `e2e/api/assessments.spec.ts` (+3, two re-pointed at the consultant),
  route-sweep (+1, two strengthened); `e2e/ui/{assessments,scoring}.spec.ts`
  open the collapsed domains they read.
- CI: `app.yml` seed counts.

**Commands:** none new.

### Slice 7 — ROPA / Processing Activity Register · 2026-10-03 · PR #21 (merged `714749c`)
**Deploy:** verified 2026-10-03 — CI green on PR #21 and on `main`; live site
serving `714749c`; secrets absent from all 22 served client chunks; live e2e as
recorded below. Manual test guide: `docs/testing/SLICE_07_manual_test.md`.

**Hosted dev DB (`nywwsdcnqivefednqezw`) — all three Slice 7 migrations APPLIED
2026-10-03**, final, with `prisma migrate deploy`; checksums in
`_prisma_migrations` match the committed files:
- `20261003000000_ropa` — `7b461387…5dcc258`.
- `20261004000000_ropa_dpdp_structure` (D-065, D-066 — approved by Aniket
  after the DPDP review) — `fcd38bff…5ed1cca`. Re-derived every record under
  the new rules on apply; hosted re-seeded after it.
- `20261005000000_ropa_risk_governance` (D-067 — risk model version, reasoned
  raises) — `faec099d…`. Hosted re-seeded; RLS **307/307**, types clean, the
  ROPA API/UI specs and the route sweep **87/87** serially. Additive: the live Slice 6
app runs against it unchanged (no ROPA action exists until the new code
generates one). Seeded: MU's ten records, scored exactly as locally.
**Verified against hosted, 2026-10-03:** `prisma migrate status` up to date ·
`pnpm db:types --check` clean · RLS **294/294** (after the second migration:
**304/304**; the ROPA API, UI and route-sweep specs **85/85** serially) · full
e2e of the first migration, honestly: one run of all **183**
with the app built locally against hosted — **178 passed, 3 failed, 2 did
not run**. It ran on 5 workers (`pnpm test:e2e -- --workers=1` does not pass the
flag through — use `pnpm --filter web exec playwright test --workers=1`), and
all three failures were Supabase Auth's `Request rate limit reached` at sign-in
(the known hosted limit, Slice 5 loops). The three files involved —
`ui/sign-in`, `ui/scoring`, `ui/tenancy` — were re-run serially: **9/9**. Every
ROPA spec passed against hosted in the first run.
**Verified against a from-zero local stack (after D-067):** all 13 migrations
apply, the seed is idempotent at
`2/9/10/2/10/29/193/10/10/11/4/5/8/2/16/20/1527/1527/1/124/1/1/1/0/0/1/1/10/10/1/0`,
every CI gate query passes, core **752**, web **315**, RLS **307**, e2e
**189/189**. (The first e2e pass after `supabase start` lost 4 tests to the
known `JWT issued at future` container clock skew; the re-run on the warm
stack is the result.)

> **⏳ The hosted project is provisioned only until 2026-11-02.** If it lapses
> every sign-in fails with "fetch failed". Renew it, or fall back to the local
> stack (Slice 5 loops below), before that date.

**Verified live, 2026-10-03 (after the merge):** CI green on PR #21's final
commit and on `main`; Vercel's production deploy of `714749c` succeeded and
`/api/v1/health` reports `version: 714749c`; signed in as the Consultant and
walked every ROPA page — the service-role key, the Resend key and the seed
password are absent from all **22** served client chunks (5 of them the ROPA
pages); live e2e, honestly: one full serial run of all **189** against
production — **186 passed, 2 failed, 1 did not run**. Neither failure touched
ROPA: `api/scoring` lost a request to `read ETIMEDOUT` (the known laptop
loop), and `ui/gaps` saw "Awaiting review" where it expected "Strong" inside
its 5 s wait, which skipped the next test in that serial file. Those two files
re-run on their own against production: **12/12**. Every ROPA spec passed in
the full run.


| Gate | Status |
|---|---|
| 1 Migration + RLS | ✅ `ropa_records` (tenant; completeness, band, missing areas, risk factors, points, ratings and link counts DERIVED by trigger and CHECKed as row invariants; no user grant on any derived or stamped column; no DELETE), `ropa_systems`, `ropa_vendors` (composite FKs both sides; NO ACTION on the register side so a linked system cannot be deleted), `ropa_gaps` (SELECT-only). `gap_actions.gap_id` nullable + `ropa_gap_id`, exactly one parent (CHECK). `evidence_links` widened to `ropa_record`, all four trigger functions redefined from their Slice 6 bodies. One import RPC, one generation RPC |
| 2 `packages/core` | ✅ `ropa.ts`: the thirteen areas as data (weights asserted to total 100), `isResolvedText` and the reviewed phrase list, `ropaCompleteness`, `ROPA_BANDS`/`ropaBand`, the risk factors as points with `ropaRisk` (assessor raise only), the lifecycle graph and `approvalDecision`, the twelve gap rules and `deriveRopaGaps`, `mapColumns`/`applyMapping`, `validateRopaRow`, `parseTriState`, `parseImportDate`, `csvCell`/`fromCsvCell` |
| 3 Unit tests | ✅ core **734** (was 605: +129) — each area alone scores its weight, Unknown is incomplete everywhere, band boundaries 30/31/60/61/80/81, every risk factor alone and together, never lowered by an assessor, the lifecycle, each gap rule alone; web **289** (was 207: +82) — `ropa-register.test.ts` (58, the SQL↔TS mirror), `ropa-import.test.ts` (15: 8 good + 2 bad, a formula cell is text, the ten workbook records) and the CSV reader |
| 4 API + guards | ✅ nine route files, twelve handlers, all `withApi`, nested (D-035): register list/create, record read/update/archive, record evidence detach, CSV import (dry run + commit), CSV export, ROPA gaps list/generate, ROPA action edit and detach. `POST …/evidence/[id]/link` takes `{ ropaRecordId }`, and `{ gapActionId }` now reads back a ROPA action too |
| 5 Cross-tenant | ✅ RLS **294** (was 248: +46): every ROPA table Org A ≠ Org B, anon locked out, composite FKs refusing a foreign system/vendor/department even as tooling, the RPCs refused across tenants, a foreign owner and foreign evidence refused. Route sweep probes all twelve handlers in both directions (**67/67**). The API e2e attacks MU's record by path (403), by id under BML's path (404), and by an evidence link (404) |
| 6 UI on real data | ✅ `/dashboard/ropa` (counts incl. "not yet usable", band chips, filters, the table), `/dashboard/ropa/new` and `/[ropaId]` (the form grouped by the thirteen areas, each saying "Complete · N pts" or "Missing · worth N pts", a live preview from core, the saved numbers from the database, risk factors, lifecycle buttons, links, stored evidence with review), `/dashboard/ropa/import` (check → mapping → rejected rows with reasons → import), `/dashboard/ropa/gaps` (generate, stale banner, the shared action editor, the shared 30/60/90 roadmap). Never the word "compliant" (tested) |
| 7 Seed | ✅ the workbook's ten records for MU, extracted to `packages/db/question-bank/ropa-register.json` by `tools/extract_core_pack.py` (`--check`ed in `docs.yml`) and loaded through the importer's own mapping and validation; obvious department/system/vendor links as seed judgement (10 system links, 1 vendor link); the seed asserts the database and core agree on every score and rating. BML has none. No ROPA gap is seeded (D-062). Idempotent |
| 8 Audit | ✅ `ropa.ropa_records.<op>`, `ropa.ropa_systems.<op>`, `ropa.ropa_vendors.<op>` by trigger with the record code, status, version, completeness and risk — never the activity's name or any text field (tested); a re-derivation alone is not an event; ONE `ropa.records.imported` row per import and ONE `ropa.gaps.generated` row per generation; `ropa.register.exported` on every export |
| 9 CI + deploy | ✅ seed counts end `…/1/1/10/10/1/0`; one new gate (the ROPA rules in SQL at every boundary; no user write on a derived column, no DELETE on a record, no write on a ROPA gap; the record trigger present and enabled); `docs.yml` checks the new fixture. CI green on PR #21 and on `main`; merged; deployed; verified live |
| 10 Docs | ✅ this Sync Step; D-061…D-064; SLICE_08 promoted; SLICE_09 stub-checked; SLICES.md and README brought up to date |

**The nine §4.4 decisions** (each recorded, each reversible):

| | Decision | |
|---|---|---|
| Fields | the workbook's 24 + description, department link, owner, volume, high-risk documents, status, version; the spec's other ~25 are backlog | D-061 |
| "Complete" | per area, as data; Unknown / "to be legally reviewed" / a to-do are NOT complete; department AND a named owner; evidence = a STORED artefact | D-061 |
| Risk | a derived floor of points (thresholds 2/5/8); an assessor may raise, the database refuses lower | D-061 |
| Stored | derived on write by trigger, CHECKed, integer, mirrored in core | D-061 |
| Lifecycle | draft → in review → approved → archived; approval by a reviewer who is not the owner, at ≥ 61; approved is read-only; reopening starts a new version | D-061 |
| Links | text kept AND join tables; text alone counts, no partial credit; the vendor-mapping gap asks for the link | D-061 |
| ROPA actions | own gap table, shared action table; shown on `/dashboard/ropa/gaps`, not on an assessment's roadmap | D-062 |
| Import | CSV only, parsed on the server, no new dependency; formulas are text; a bad row never fails the file | D-063 |
| Data categories | free text | D-061 |

**The DPDP structure (D-065, D-066 — approved by Aniket after an expert
review against the Act and Rules):** a lawful ground per record (consent, the
nine s.7 legitimate uses, s.17), with notice and consent asked for only where
the ground needs them — removing the false gaps the first build raised;
children's duties (verifiable parental consent, no tracking, Fourth Schedule
exemptions) as two Critical gaps; retention with what ends it and which law;
a Rule 6 checklist; processor contract status read from the vendor register;
fifteen gap rules; starter templates; a "what do we hold about…" draft for
s.11 access requests and a system/processor impact lookup
(`GET …/ropa/lookup`); and a 12-month review set on approval. Second
migration; tests: core +18, web +10, RLS +10, e2e +4, sweep +1.

**The ten workbook records, through the rules** (not an oracle — the sheet
computes nothing and its Risk Rating is typed by hand): all ten **Usable** —
62 to 80 out of 100 after D-065, every one short of an owner and a stored
artefact; nine have no lawful ground the workbook names (payroll's
"employment" is the one it does) and eight no stated end to retention. Risk:
**6 agree** with the hand rating; **ROPA-002** and **ROPA-007** are raised to
Critical by the hand rating (kept — a raise); **ROPA-008** (AI + no retention
rule) and **ROPA-009** (children's data "Possible") derive higher than the hand
rating, which would lower them and is ignored.

**Found and fixed while building**
0. **A large register could not be read** (found after D-065, 2026-10-03):
   `GET …/ropa/gaps` put every gap id into one PostgREST `in.(…)` URL, and
   ~100 gaps gave a 500 "URI too long". The register is now read by
   organisation and paged, and id lists elsewhere — the Slice 6 assessment
   register too — go in chunks of 80. Pinned by an e2e test on a 60-record,
   300+-gap register.
1. **The record form would have lost focus on every keystroke.** Each area's
   section was a component declared inside the render, so React remounted its
   inputs on each change. Hoisted to module level before any test ran.
2. **A test asserted the wrong refusal twice** — the trigger refuses a foreign
   artefact (`TS404`) and an unknown link type (`TS422`) BEFORE the FK and the
   CHECK can. The pitfall Slice 6 recorded for CHECK order, one layer up.
3. **The first full e2e run on a freshly restarted local stack** failed four
   tests at start-up with `PGRST303 JWT issued at future` — the auth and REST
   containers' clocks disagree for a few seconds after `supabase start`. Not a
   code signal; the re-run on the warm stack is the result recorded above.
   Worth knowing before the next from-zero run.

**Files**
- `packages/core/src/ropa.ts` (+ test); `index.ts` exports it.
- `packages/db/prisma/migrations/20261003000000_ropa/migration.sql`;
  `schema.prisma` (4 models; `GapAction.gapId` optional + `ropaGapId`);
  `seed.ts` `seedRopa()`; `seed-data.ts` `SEED_ROPA` + counts;
  `question-bank/ropa-register.json`; `tools/extract_core_pack.py` (a third output).
- `apps/web/lib/ropa/{csv,import,shape,routes}.ts`; `lib/client/ropa.ts`;
  `lib/gaps/routes.ts` (the action edit and detach extracted for both parents);
  `lib/gaps/shape.ts` and `lib/client/gaps.ts` (`gap_id` nullable);
  `lib/evidence/routes.ts` (the third target).
- Routes: `app/api/v1/organizations/[id]/ropa/**` (nine files).
- UI: `app/dashboard/ropa/{page,ropa-register,record-view}.tsx`, `new/`,
  `[ropaId]/`, `import/`, `gaps/`; nav link; `action-editor.tsx` (`actionUrl`)
  and `roadmap.tsx` (`RoadmapGap`) generalised.
- Tests: `tests/unit/{ropa-register,ropa-import}.test.ts`;
  `tests/rls/ropa.test.ts` (46); `e2e/api/ropa.spec.ts` (9); `e2e/ui/ropa.spec.ts`
  (5); route-sweep probes (12).
- CI: `app.yml` (counts + one gate), `docs.yml` (the fixture).

**Commands:** none new. `python3 tools/extract_core_pack.py [--check]` now
writes three files.

### Slice 6 — Gap register and remediation actions · 2026-10-02 · PR #18 (merged `e9721fc`)
**Deploy:** verified 2026-10-02 — CI green on PR #18 and on `main`; live site
serving `e9721fc`; secrets absent from all served client chunks; live e2e:
every test passed, though not in one run (recorded 2026-10-02).
**Supabase:** both migrations applied to `nywwsdcnqivefednqezw` (2026-10-02).

| Gate | Status |
|---|---|
| 1 Migration + RLS | ✅ `assessment_gaps` (tenant, composite FKs to the assessment AND its snapshot question, **SELECT-only** — no user write grant of any kind) and `gap_actions` (tenant, six user-updatable columns, no INSERT or DELETE). Row invariants: `severity = app.question_severity(adjusted_score)`, `priority = app.question_priority(severity)`, a gap never above the threshold, closed ⇔ timestamp ⇔ basis, no self-approval. `evidence_links` widened to `gap_action`, all four trigger functions redefined |
| 2 `packages/core` | ✅ `gaps.ts`: `GAP_MAX_ADJUSTED` + `opensGap`, `GAP_DUE_DAYS` + `dueDate` (no clock inside), `generateGaps` over the engine's own `DomainResult`s, `compareGaps`, the workflow graph as data + `canTransition`, `closureDecision`, `roadmapWindow`, `isOverdue`. `engine.ts` gains `questionPriority` beside `questionSeverity` |
| 3 Unit tests | ✅ core **605** (was 552) incl. the threshold boundary (3 opens, 4 does not), the six-row priority table, unevidenced claim of 5 → High → P1, scoped out → no gaps, null authored priority; web **207** (was 154) incl. `gap-register.test.ts` — 49 tests parsing the migration against core |
| 4 API + guards | ✅ `GET …/gaps`, `POST …/gaps/generate`, `PATCH …/gaps/[gapId]/actions/[actionId]`, `DELETE …/gaps/[gapId]/actions/[actionId]/evidence/[evidenceId]`; `POST …/evidence/[id]/link` now takes exactly one of `{responseId}` / `{gapActionId}`. All `withApi`, all nested (D-035) |
| 5 Cross-tenant | ✅ RLS **248** (was 175): both tables Org A ≠ Org B, anon locked out, the RPC refused across tenants both ways, a foreign owner refused, composite FK refusing a foreign action even as tooling, cross-tenant evidence links refused. Route sweep probes all four new routes in both directions, plus the widened link route. An e2e test attacks a disposable tenant that really HAS gaps: by path (403), by id under Org A's own path (404), and by evidence link (404) |
| 6 UI on real data | ✅ `/dashboard/assessments/[id]/gaps`: counts, Generate/Regenerate behind `<Can permission="gap.write">`, a stale banner, filters (severity, domain, owner, status), an action editor offering only the legal moves, evidence on the action with review, the 30/60/90 roadmap grouped by owner with overdue in red. The score panel gains "N gaps, M critical". No question code, pack code or trigger expression anywhere on it (D-040, tested) |
| 7 Seed | ✅ MU's baseline: **one gap, one action**, derived by the same SQL the API calls from its one answer (G1.2, adjusted 3 → Low / P3, no due date). Idempotent. BML has none |
| 8 Audit | ✅ ONE `assessment.gaps.generated` row per generation carrying the counts; `gap.gap_actions.update` by trigger for every user change (owner, due date, status, closing, reopening) with the changed column NAMES and the closure basis — never the title, notes or finding (tested). Evidence links reuse the Slice 4 trigger. Finalise still writes one row, now with `gapCount` |
| 9 CI + deploy | ✅ seed counts end `…/0/0/1/1`; one new gate (the gap rules in SQL; no user write on a gap; exactly six updatable action columns; both triggers present AND enabled). CI green on PR #18 and on `main`; merged; deployed; verified live |
| 10 Docs | ✅ this Sync Step; D-054…D-060; CLAUDE.md invariant; SLICE_07 promoted; SLICE_08 stub-checked; SLICES.md and README status brought up to date |

**The five §4.4 decisions** (each recorded, each reversible):

| | Decision | |
|---|---|---|
| Threshold | a gap opens at adjusted **≤ 3**; a red flag still fires at ≤ 2 | D-054 |
| Due dates | P0 30 · P1 60 · P2 90 days · P3 none ("next cycle"); stored once, never recomputed | D-055 |
| Closing | an owner, and reviewed evidence on the action **or** a reviewer who is not the owner | D-056 |
| Regeneration | follows the answers; an action with human work is never discarded or rewritten | D-057 |
| Whose gaps | frozen with the assessment's score at finalise; the actions live on | D-058 |

**The workbook sample through the SQL generator:** 98 gaps — **10 critical ·
52 high · 36 medium**, the same critical and high the engine reports; actions
due 30 / 60 / 90 days out. The sample cannot police the threshold (no answer
above 2), so the boundary has its own tests in core, in SQL and in RLS.

**Found and fixed while building**
1. **The freeze would have blocked its own engine.** `app.refresh_assessment_gaps`
   upserts, and a BEFORE INSERT row trigger fires before the conflict is
   detected — so on a finalised assessment even a no-op regeneration is
   refused. That is the behaviour wanted, but it means the order inside
   `finalise_assessment` is load-bearing: refresh FIRST, then flip the status.
   A unit test pins the order.
2. **An organisation-level delete could have been mistaken for an edit.** See
   the open loop above; fixed for gaps before the migration was applied
   anywhere but a local stack, and tested.
3. **Assessments finalised before this slice had no register and could never
   get one.** Found on the hosted dev database after the first migration went
   on. Fixed with a second migration rather than an edit to the applied one.
4. **A test named the wrong constraint**, because CHECKs are evaluated in name
   order (open loop above).
5. **The live score and its own finalised snapshot named different maturity
   bands** — a Slice 5 defect, found while finalising a manual test assessment
   on hosted. 124 answers all adjusted 1 gave a live "20.00 / 100 · Level 1 -
   Aware" and, seconds later, a snapshot of 20.0000 · "Level 0 - Not Started".
   20 of 100 is exactly the 0.20 boundary, which belongs to the lower band.
   SQL sums exact numerics and was right; `packages/core` summed sixteen
   floating-point domain scores, got 20.000000000000004, and banded it one
   level up. D-053's mirror test could not see it: the tables matched, the
   arithmetic did not. Fixed in core with `exactProportion()` — the proportion
   is rounded to nine decimal places before it meets a boundary, for the band
   and for the On Track threshold alike. No stored number changes (snapshots
   were always computed in SQL), so `ENGINE_VERSION` stays `1.0.0`. Tests pin
   every boundary and fail without the fix.

**Files**
- `packages/core/src/gaps.ts` (+ test); `engine.ts` gains `questionPriority`,
  `GAP_PRIORITIES`, `SEVERITY_PRIORITY`; `index.ts` exports `gaps.js`.
- `packages/db/prisma/migrations/20261002000000_gaps_actions/` and
  `20261002010000_backfill_finalised_gap_registers/`; `schema.prisma` (2
  models); `seed.ts` `seedGaps()`; `seed-data.ts` counts.
- `apps/web/lib/gaps/{routes,shape}.ts`; `lib/client/gaps.ts`;
  `lib/evidence/routes.ts` (`link` takes either target).
- Routes: `…/assessments/[assessmentId]/gaps`, `…/gaps/generate`,
  `…/gaps/[gapId]/actions/[actionId]`, `…/actions/[actionId]/evidence/[evidenceId]`.
- UI: `app/dashboard/assessments/[assessmentId]/gaps/{page,gap-register,action-editor,roadmap}.tsx`;
  `score-panel.tsx` (the link); `answer-panel.tsx` exports `ReviewForm`.
- Tests: `tests/unit/gap-register.test.ts`; `tests/rls/gaps.test.ts` (73);
  `e2e/api/gaps.spec.ts` (9); `e2e/ui/gaps.spec.ts` (3); route-sweep probes.
- CI: `app.yml` (counts + one gate).

**Commands:** none new. To see a full register by hand:
`node tools/answer_assessment.mjs "<name>" 2` answers every outstanding
question, then press Generate on the register page.

### Slice 5 — The full 16-domain scoring engine · 2026-09-30 · PR #15 (merged `8bddb00`)
**Deploy:** verified 2026-09-30 — CI green on PR #15 and on `main`, both
workflows; live site serving `8bddb00`; live e2e **141/141** (`--workers=1`);
service-role key absent from all served client chunks. One transient failure on
the first live run (`fetch failed` on a sign-in, 38 passed before it cascaded);
Supabase was reachable immediately after and the re-run was clean — the same
class of flake STATE already notes for live runs.
**Supabase:** migration `20260920000000_scoring_engine` **applied** to
`nywwsdcnqivefednqezw` — clean, no post-apply edits, checksum matches the
committed file (checked directly against `_prisma_migrations`). Seeded; counts
unchanged except the two new tables, which are **0 and 0 on purpose** (D-052).
**Verified against hosted:** RLS **175/175**, full e2e **141/141** (with
`--workers=1` — see open loops), `pnpm db:types --check` clean.
**Verified against a from-zero local stack:** migrations apply, seed is
idempotent at `2/9/10/2/10/29/193/10/10/11/4/5/8/2/16/20/1527/1527/1/124/1/1/1/0/0`,
every new CI gate passes, e2e 141/141 on repeated runs.

| Gate | Status |
|---|---|
| 1 Migration + RLS | ✅ `assessment_score_snapshots`, `assessment_domain_scores` (tenant, composite FKs, D-027); SELECT-only grants and an immutability trigger that binds tooling (D-052); `DELETE` on `evidence_links` behind `evidence.write` (D-051); row invariants — `final_score = least(raw, cap)` and an empty domain's score is NULL, never 0 |
| 2 `packages/core` | ✅ `engine.ts`: `maturityBand`, `questionSeverity`, `RED_FLAGS` + `applyRedFlags` (lowest cap wins), `scoreDomain`, `scoreAssessment`, `overallEvidenceConfidence`, the three D-038 states, `ENGINE_VERSION`. The cap rule is a parameter (D-048) |
| 3 Unit tests | ✅ core **552** (was 480) incl. the band boundaries, the severity ladder, all seven red flags alone and together, the ≤ 2 boundary (2 fires, 3 does not), and the empty-domain rules; web **154** (was 105) incl. the two-run parity gate and the SQL↔TS mirror |
| 4 API + guards | ✅ `GET …/score` widened to all 16 + overall (`?domain=` kept, its GOV default **dropped**); `POST …/finalise`; `DELETE …/evidence/[id]/links/[responseId]`. Scoring moved to `lib/assessments/score.ts` |
| 5 Cross-tenant | ✅ RLS **175** (was 136): both snapshot tables Org A ≠ Org B, composite FKs refusing a foreign row as tooling, finalise refused across tenants, unlink refused across tenants. Route sweep probes both new routes in both directions |
| 6 UI on real data | ✅ overall panel (score / applicable weight, coverage line, band, confidence, critical/high, each red flag in plain language), 16-row scorecard keeping Scoped Out and all-N/A distinct, Finalise behind `<Can>` disabled with the outstanding count, answering open on every domain, Detach on each artefact; the overview tile now shows the overall score |
| 7 Seed | ✅ unchanged and idempotent; **nothing is finalised**, because finalising needs every question answered (D-041, D-052) |
| 8 Audit | ✅ one `assessment.score.finalised` row carrying the frozen numbers and the red-flag codes — not sixteen "domain score created" rows; unlinking reuses the Slice 4 trigger, which already covered DELETE. Still no free text in the log (tested) |
| 9 CI + deploy | ✅ seed counts end `…/1/1/1/0/0`; two new gates (the red-flag table, bands and severity ladder in SQL; no user write path and an immutability trigger on both snapshot tables); the parity gate runs in `pnpm test:unit`; the docs workflow checks the new fixture. CI green on PR #15 and on `main`; merged; live e2e 141/141 |
| 10 Docs | ✅ this Sync Step; D-049…D-053; SLICE_06 promoted; SLICE_07 stub-checked |

**The parity gate, as built** (D-007, D-048) — the workbook's 98 sample
responses through the engine twice:

| Run | Cap rule | Score | Confidence | Critical | High |
|---|---|---:|---:|---:|---:|
| (a) aggregation parity | the workbook's naive `MIN` | **24.7014** | **23.9%** | **10** | **57** |
| (b) the product | the spec's cap table | **25.3014** | **23.9%** | **10** | **52** |

Both reproduce exactly. The SQL engine runs (b) only — the naive rule lives in
the TypeScript test fixture and is unreachable from the database. The two runs
differ on exactly five rows, `CB1.1`–`CB1.5`, all in `CROSSBORDER`, which is the
only domain whose score moves (0.60 → 1.20). Red-flag cap on the sample: **50**
(children's data) under both rules; `≤ 2` also fires `SECURITY`, which `< 2` did
not (D-046).

**Three bugs found and fixed while building**
1. **The domain aggregate cross-joined questions against responses.** One answer
   in an 8-question domain reported `applicable_count` 8 and `outstanding_count`
   0 — the averages happened to come out right, which is why it looked fine. It
   would have let `finalise_assessment` freeze a half-answered assessment. The
   CTE now joins each question to its OWN response.
2. **The snapshot immutability trigger blocked its own cascade.** Deleting an
   assessment that had ever been finalised was impossible, which would have made
   a finalised tenant undeletable (and erasure, Slice 13, impossible). Found by a
   test teardown. UPDATE is now always refused; DELETE only while the parent
   exists (D-052). The unlink trigger had the same flaw for artefact deletion.
3. **`api/scoring.spec.ts` was named `E2E scoring` and `ui/scoring.spec.ts`
   `E2E scoring UI`** — cleanups delete by `name LIKE 'prefix%'`, so the API
   spec's teardown swept the UI spec's assessment away mid-run. This is the exact
   pitfall Slice 4 wrote down, hit anyway, so it is now an automated check
   (D-012): `apps/web/tests/unit/e2e-name-prefixes.test.ts` fails if any spec's
   prefix is a prefix of another's on the same table. It was written, verified to
   catch the real bug, and found to have its own flaw first — it keyed on the
   basename, and both files are called `scoring.spec.ts`.

**Files**
- `packages/core/src/engine.ts` (+ test); `index.ts` exports it.
- `packages/db/prisma/migrations/20260920000000_scoring_engine/migration.sql`;
  `schema.prisma` (2 models); `seed-data.ts` `SEED_COUNTS` gains two zeros.
- `packages/db/question-bank/workbook-sample.json` — the 98 samples, generated
  by `tools/extract_core_pack.py`, which now emits and `--check`s both fixtures.
- `apps/web/lib/assessments/score.ts` (live score, snapshot read, finalise);
  `lib/evidence/routes.ts` gains `unlink`; `lib/client/assessments.ts` score types.
- Routes: `…/assessments/[assessmentId]/{score,finalise}`,
  `…/evidence/[evidenceId]/links/[responseId]`.
- UI: `app/dashboard/assessments/[assessmentId]/score-panel.tsx`;
  `assessment-detail.tsx`, `answer-panel.tsx`, `latest-score.tsx`.
- Tests: `tests/unit/{scoring-parity,scoring-engine,e2e-name-prefixes}.test.ts`;
  `tests/rls/scoring-engine.test.ts`; `e2e/api/scoring.spec.ts`;
  `e2e/ui/scoring.spec.ts`; route-sweep probes; `tests/rls/evidence.test.ts` and
  `e2e/ui/evidence.spec.ts` updated for the two behaviours Slice 5 changed.
- CI: `app.yml` (counts + two gates), `docs.yml` (the new fixture).

**Commands (new):** `node tools/answer_assessment.mjs "<name>" [claim]` — answers
every outstanding question in one assessment through the real API, so Finalise
can be reached by hand without clicking 124 dropdowns. Manual testing only;
nothing depends on it. Pass `APP_URL` when the dev server is not on port 3000.
`python3 tools/extract_core_pack.py [--check]` now writes two files, not one.

### Slice 4 — Keystone: one question end to end · 2026-09-20 · PR #11 (merged `6829f93`)
**Deploy:** verified 2026-09-20 — Aniket validated the Vercel preview (the full
keystone, E1/E2, N/A, read-only and cross-tenant checks); CI green on PR #11 and
on `main`; live site serves `6829f93`;
`PLAYWRIGHT_BASE_URL=https://revised-truststack-web.vercel.app pnpm test:e2e` →
123 passed, 1 failed on a `page.goto` network timeout against the live site (and 2
serial tests after it skipped); that file re-run → **4/4**, so **126/126**. The
failing test also had a real weakness (`allTextContents()` does not wait) — fixed
in the docs PR. Service-role key value absent from all 8 served client chunks.
**Rollback path:** Vercel → Deployments → previous production (`f9b376a`) →
Instant Rollback. **Caveat:** the migration is additive, so the older app runs
against it — but MU's baseline is now `in_progress`, which the older app would
refuse to regenerate (correctly).
**Supabase:** migration `20260918200000_evidence_scoring` **applied** to
`nywwsdcnqivefednqezw` (clean, see open loops); bucket `evidence` created private;
seeded twice (idempotent): MU's baseline `G1.2` claim 5 · E3 → **adjusted 3**,
assessment `in_progress`, one stored sample artefact.
**Verified against hosted before the PR:** RLS **136/136**, full e2e **126/126**
(one transient, see open loops), types up to date.

| Gate | Status |
|---|---|
| 1 Migration + RLS | ✅ `assessment_responses`, `evidence`, `evidence_links` (tenant, composite FKs, D-027); column-level grants so no user can write a derived column; `app.evidence_cap` / `app.adjusted_score`; derived-by-trigger with a CHECK that refuses an uncapped score even from tooling (D-044); private bucket + `storage.objects` SELECT/INSERT policies, no UPDATE/DELETE (D-042) |
| 2 `packages/core` | ✅ `scoring.ts`: `EVIDENCE_CAP`, `adjustedScore`, `domainScore` (null = not scored, D-038), `evidenceConfidence`, `summariseDomainScore` (provisional/outstanding), `responseEvidenceLevel`, review rules, storage layout, content types |
| 3 Unit tests | ✅ core **480** (was 448) incl. **claim 5 + E0 → 1 · claim 4 + E1 → 2 · claim 4 + E2 → 2** and the full 6×6 table; web **105** (was 87) incl. the SQL cap table parsed and compared with core, bucket/CHECK vocabularies, no grant on a derived column |
| 4 API + guards | ✅ 7 new handlers, all `withApi`, nested under `/organizations/[id]/` (D-035): responses list/PUT, score, evidence upload-url / link / download-url / review |
| 5 Cross-tenant | ✅ RLS **136** (was 99): Org A ≠ Org B on all three tables, cross-tenant links refused, Storage policies tested in SQL. Route sweep probes all 7 routes both ways (Org B path → 403; Org A path + an Org B evidence id → 404). e2e: Org B cannot obtain a download URL via the API **or** sign/download/list/upload straight at Storage with its own JWT |
| 6 UI on real data | ✅ `/dashboard/assessments/[id]`: answer (claim 0–5 or N/A with a required reason), attach, review behind `<Can permission="evidence.review">`, `claimed → adjusted` with the cap named; GOV tile there and on the Overview |
| 7 Seed | ✅ one answered `G1.2` + one stored artefact, uploaded by the Registrar, reviewed by the consultant; idempotent |
| 8 Audit | ✅ answer / link / review by trigger (with claim, level, adjusted score — never free text); upload-URL and **every** download-URL issuance by the API |
| 9 CI + deploy | ✅ CI now starts `storage-api`; two new gates (no user write on a derived column + cap = `1/2/2/1` in SQL; bucket private + no UPDATE/DELETE storage policy); seed counts end `…/1/124/1/1/1`. CI green on PR #11 and `main`; preview validated by Aniket; merged; live e2e 126/126 |
| 10 Docs | ✅ this Sync Step; D-041…D-045; SLICE_05 promoted; SLICE_06 stub-checked |

**The keystone, as tested** (`e2e/api/evidence.spec.ts`, both tenants):
claim 5 → adjusted **1** (unevidenced = E0), GOV **1.40**/7, assessment →
`in_progress`, regeneration → 409 → upload + link → still 1 → self-review → 403 →
review E5 → **5**, GOV **7.00**, confidence 100% → review Rejected/E0 → **1**,
GOV **1.40**, confidence 0%. Identical on `university` and `general`.

**Files**
- `packages/core/src/scoring.ts` (+ test).
- `packages/db/prisma/migrations/20260918200000_evidence_scoring/migration.sql`;
  `schema.prisma` (3 models); `seed.ts` `seedEvidence()`; `seed-data.ts`
  `SEED_RESPONSES`, `SEED_EVIDENCE`, `seedEvidencePath`, counts.
- `apps/web/lib/assessments/responses.ts`, `lib/evidence/{routes,shape}.ts`;
  `requireAssessment` exported from `lib/assessments/routes.ts`.
- Routes: `…/assessments/[assessmentId]/{responses,responses/[questionCode],score}`,
  `…/evidence/{upload-url,[evidenceId]/link,[evidenceId]/download-url,[evidenceId]/review}`.
- UI: `app/dashboard/assessments/[assessmentId]/{answer-panel,domain-score-tile}.tsx`,
  `assessment-detail.tsx`; `app/dashboard/{page,latest-score}.tsx`.
- Tests: `tests/unit/evidence-cap.test.ts`; `tests/rls/evidence.test.ts`
  (`question-bank.test.ts` resets MU's baseline to draft where it regenerates);
  `e2e/api/evidence.spec.ts`; `e2e/ui/evidence.spec.ts`; route-sweep probes;
  `e2e/helpers.ts` gains `extraMembers` and `removeEvidence`.
- CI: `app.yml` (storage, counts, two gates).

**Commands (new):** local stack for development —
`npx -y supabase@2.117.0 start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit`,
then export its `DB_URL`/`API_URL`/keys (`supabase status -o env`) as the app's env.

### Slice 3 — Question bank + dynamic assessment generation · 2026-09-18 · PR #9 (merged `1c1b83d`)
**Deploy:** verified 2026-09-18 — Aniket validated the Vercel preview before
merge; after merge the live site serves `1c1b83d`,
`PLAYWRIGHT_BASE_URL=https://revised-truststack-web.vercel.app pnpm test:e2e`
→ **105/105**, and the service-role key value is absent from every served client
chunk. CI was green on the branch twice (most recently after the D-037 vendor
gate) and again on `main`.
**Rollback path:** Vercel → Deployments → previous production (`d4caf1c`) →
Instant Rollback. **Caveat:** both Slice 3 migrations are additive, so the older
app runs against the new schema unchanged — but an assessment generated after
this deploy would be invisible to it.
**Supabase:** migration `20260918000000_question_bank` **applied** to
`nywwsdcnqivefednqezw` (see the honest note above); seeded — 16 domains,
20 packs, **1,527 questions**, and Mumbai University's draft baseline of
**124** questions. Bharat Manufacturing has none, on purpose.

| Gate | Status |
|---|---|
| 1 Migration + RLS | ✅ `dpdp_domains`, `question_packs`, `questions`, `question_versions` (reference, SELECT-only); `assessments`, `assessment_questions` (tenant, D-027). CHECK vocabularies; the 100-point total as a deferred constraint trigger (D-036); `public.set_assessment_questions` as the snapshot's only write path (D-035) |
| 2 `packages/core` | ✅ `domains.ts` (the 16, weights from `Config`), `questions.ts` (canonical record + Markdown parser), `triggers.ts` (JSON expressions, 46 reviewed phrases), `assessment.ts` (the generator), `packs.ts` (D-031's outcome as code) |
| 3 Unit tests | ✅ core **445** (was 342) — incl. the stale 104-point set throwing, one fixture per authored layout, the full operator truth table, generator determinism; web **87** (was 54) — the bank as it is on disk, and the migration's reference data mirrored against core |
| 4 API + guards | ✅ 8 new handlers, all `withApi`: `dpdp-domains`, `question-packs`, `question-packs/[code]/questions`, and assessments list/create/read/questions/generate-questions |
| 5 Cross-tenant | ✅ RLS **96** (was 61): both new tables Org A ≠ Org B, composite FK refusing a foreign row even as tooling, the RPC's own locks. Route sweep probes all 8 new routes, and the assessment routes in **both** directions (Org B's path → 403; Org A's path + a foreign id → 404, no data) |
| 6 UI on real data | ✅ `/dashboard/questions` (16 domains + 20 packs + a pack's questions by domain), `/dashboard/assessments` and `/dashboard/assessments/[id]` (the snapshot in 16 domain groups, each question labelled with why it is there), and **Generate assessment** on scope step 7 behind `<Can permission="assessment.write">` |
| 7 Seed | ✅ the whole bank + MU's draft baseline; idempotent (verified by running it twice) |
| 8 Audit | ✅ `assessment.assessments.<op>` by trigger, and **one** `assessment.questions.generated` row per generation carrying the count — not one row per question |
| 9 CI + deploy | ✅ CI green on PR #9 and on `main`, both workflows, including the four new gates (seed counts, `100.00` weight total, no user write grant on the bank or the snapshot, no placeholder legal basis); preview validated by Aniket; merged; live e2e 105/105 |
| 10 Docs | ✅ this Sync Step; `OVERLAP_UNIVERSITY_CORE.md`; D-031…D-036; `QUESTION_FORMAT.md` updated; SLICE_04 promoted; SLICE_05 re-synced |

**The bank, per pack**

| Pack | Tier · status | Questions |
|---|---|---:|
| `CORE_DPDP_V1` | core · approved | 98 |
| `UNIVERSITY_HIGHER_ED_V1` | overlay · approved | **10** (the confirmed ones, D-031) |
| `UNIVERSITY_AI_PROCTORING_V1` | conditional · approved | 1 |
| `UNIVERSITY_CONDITIONAL_V1` | conditional · approved | 19 |
| `UNIVERSITY_REFERENCE_V1` | reference · approved | 78 |
| `EDTECH_OVERLAY_V1` | overlay · draft | 162 |
| `BFSI_OVERLAY_V1` | overlay · draft | 201 |
| `HEALTHCARE_OVERLAY_V1` | overlay · draft | 195 |
| `SAAS_TECH_OVERLAY_V1` | overlay · draft | 156 |
| `MANUFACTURING_OVERLAY_V1` | overlay · draft | 121 |
| `RETAIL_ECOMMERCE_OVERLAY_V1` | overlay · draft | 128 |
| `PROFESSIONAL_SERVICES_OVERLAY_V1` | overlay · draft | 122 |
| `PUBLIC_SECTOR_OVERLAY_V1` | overlay · draft | 121 |
| `GENERAL_ORGANISATION_V1` | overlay · draft | 115 |
| six cross-industry conditional packs | conditional · draft | **0** — none authored |
| **Total** | | **1,527** |

**Mumbai University's baseline: 124 questions** = 98 core + the 10 confirmed
overlay + 15 of the 19 conditional-pool + 1 proctoring. By reason: 70 core
mandatory · 20 on a mapped trigger · 33 Potentially Applicable (22 of which name
no condition at all — the core pack's bare "Conditional" rows) · 1 overlay-only.
Four conditional questions are excluded on purpose (no research participants,
no CCTV or biometrics, no chatbot). All 16 domains covered; weights total 100.

**Files**
- `packages/core/src/{domains,questions,triggers,assessment,packs}.ts` (+ a test
  each); `scope.ts` gains `UNIVERSITY_CONDITIONAL_V1` to the University selection.
- `packages/db/prisma/migrations/20260918000000_question_bank/migration.sql`;
  `question-bank/{core-pack.json,load.ts}`; `seed.ts` gains `seedQuestionBank()`
  and `seedAssessments()`; `seed-data.ts` gains `SEED_ASSESSMENTS`.
- `tools/extract_core_pack.py` (`--check` in the docs workflow).
- `apps/web/lib/assessments/{bank,generate,routes}.ts`; `lib/client/assessments.ts`.
- Routes: `app/api/v1/{dpdp-domains,question-packs}`; `question-packs/[code]/questions`;
  `organizations/[id]/assessments` + `[assessmentId]` + `/questions` + `/generate-questions`.
- UI: `app/dashboard/questions/`, `app/dashboard/assessments/`; nav links; scope step 7.
- Tests: `tests/unit/question-bank.test.ts`; `tests/rls/question-bank.test.ts`;
  `e2e/api/assessments.spec.ts`; `e2e/ui/assessments.spec.ts`; `e2e/helpers.ts`
  gains `createE2eTenant`/`removeE2eTenant`.
- Content: `UNI-GOV-009` authored; `docs/question_packs/OVERLAP_UNIVERSITY_CORE.md`;
  `INVENTORY.md` regenerated (1,429).

**Bugs found and fixed while building**
1. **`GET /question-packs` reported zero for whole packs.** It tallied counts by
   listing `questions` in JavaScript; PostgREST caps a response at 1,000 rows and
   the bank is 1,527. Counts now come from a database aggregate, and the bank
   read pages explicitly rather than trusting one response.
2. **The bank could have held a conditional question nothing could evaluate.** A
   CHECK constraint surfaced it, and applicability is now resolved once, when the
   bank is loaded (D-033).
3. The RPC was created in schema `app.`, which PostgREST does not expose, so it
   was unreachable. Moved to `public.`, like the Slice 1 RPCs (D-035).

**Commands (new):** `python3 tools/extract_core_pack.py [--check]` — re-extract
the core pack and the `Config` weights after the workbook changes.

### Slice 2 — Organisation profile + scope wizard · 2026-09-15 · PR #7 (merged `260efab`)
**Deploy:** verified 2026-09-16 — Aniket validated the Vercel preview (main
journey) before merge; after merge CI green on `main`, live site serving
`260efab`, `PLAYWRIGHT_BASE_URL=https://revised-truststack-web.vercel.app pnpm test:e2e`
→ **71/71**; service-role and Resend key values absent from all 8 served client chunks.
**Rollback path:** Vercel → Deployments → previous production (`86baff4`) → Instant
Rollback. The migration is additive, so the older app runs against it unchanged.
**Supabase:** migration `20260915100000_scope_wizard` **applied** to
`nywwsdcnqivefednqezw`; seeded (MU: 8 departments, 9 systems, 3 vendors, 6 Data
Principal types, all 10 risk tags; BML: 2/2/1/2, `sensitive_documents`).

| Gate | Status |
|---|---|
| 1 Migration + RLS | ✅ `industries` (reference), `departments`, `systems`, `vendors`, `vendor_systems`, `data_principal_types`, `organization_scopes`; composite tenant FKs; CHECK vocabularies; RLS read for members, write on `scope.write`; `organizations` column-group guard |
| 2 `packages/core` | ✅ `scope.ts`: `INDUSTRIES`, tri-states, `explainRiskTags`/`deriveRiskTags`, `selectQuestionPacks`; `scope.write` in the matrix |
| 3 Unit tests | ✅ core 341 (incl. D-028 tiers and config override) (incl. the university example, unknown-as-risk for every tri-state, determinism); web 54 (matrix/industries == migrations across all files) |
| 4 API + guards | ✅ 22 new handlers, all `withApi`: industries, profile, scope GET/PUT, preview, 4 registers × list/create/update/delete |
| 5 Cross-tenant | ✅ RLS 61 (every scope table, cross-tenant writes, composite FKs even as `postgres`); route sweep probes all new routes incl. Org-A-path + Org-B-child-id → 404 |
| 6 UI on real data | ✅ `/dashboard/organization`; 7-step `/dashboard/scope` with explicit Unknown and tag reasons |
| 7 Seed | ✅ MU university environment + BML minimal; tags derived by core; idempotent |
| 8 Audit | ✅ by trigger in the same transaction: `scope.<table>.<insert|update|delete>` incl. `organizations` profile/scope edits |
| 9 CI + deploy | ✅ CI green on PR #7 and `main`; preview validated by Aniket; live e2e 71/71 |
| 10 Docs | ✅ this Sync Step; D-026, D-027; SLICE_03 promoted; SLICE_04 stub re-synced |

**Files**
- `packages/core/src/scope.ts` (+ test): also `RiskTriggerConfig`, tiers, `assessScopeProfile`, `LARGE_SCALE_NOTICE` (D-028); `rbac.ts` gains `scope.write`.
- `packages/db/prisma/migrations/20260915100000_scope_wizard/migration.sql` —
  DDL, industries, value migration, constraints, `scope.write`, `app.audit_scope_change`,
  `app.guard_organization_update`, grants, RLS. `seed-data.ts` gains `SEED_SCOPE`
  and new `SEED_COUNTS`; `seed.ts` derives tags with core; `db:seed` builds core first.
- `apps/web/lib/scope/{registers,risk,db-errors}.ts`.
- Routes: `app/api/v1/industries`; `organizations/[id]/route.ts`; `…/scope`,
  `…/scope/preview-assessment`; `…/{departments,systems,vendors,data-principal-types}` + `[childId]`.
- UI: `app/dashboard/organization/`, `app/dashboard/scope/`; nav links.
- Tests: `tests/rls/scope.test.ts`; `tests/rls/db.ts` (savepoints); `tests/unit/rbac-matrix.test.ts`
  (all migrations + industries); `e2e/api/scope.spec.ts`; `e2e/ui/scope.spec.ts`;
  route-sweep probes; `e2e/helpers.ts` token cache.
- CI: seed counts `2/9/10/2/10/29/193/10/10/11/4/5/8/2`; `supabase/config.toml` sign-in limit.

### Slice 1 — Tenancy, identity, RBAC · 2026-09-14 · PR #3 (merged `5957430`)
**Deploy:** verified 2026-09-15 — live site serving `5957430`;
`PLAYWRIGHT_BASE_URL=https://revised-truststack-web.vercel.app pnpm test:e2e` →
**37/37** (route sweep, tampered cookies, invites, switcher UI); Supabase
service-role key value absent from all 8 served client chunks.
`ACTIVE_ORG_COOKIE_SECRET` set in Vercel by Aniket.
**Supabase:** migration `20260914100000_tenancy_rbac` **applied** to
`nywwsdcnqivefednqezw`; seeded (9 users, 10 memberships).

| Gate | Status |
|---|---|
| 1 Migration + RLS | ✅ `roles`, `permissions`, `role_permissions` (global, SELECT-only), `organization_invites` (inviter-only, `token_hash` column not granted); `users_select_co_member`; `organization_users.role_id` backfilled then NOT NULL; `_prisma_migrations` closed |
| 2 `packages/core` | ✅ `rbac.ts`: `ROLE_CODES`, `PERMISSION_CODES`, `ROLE_PERMISSIONS`, `can`, `resolveEffectivePermissions`, `assertCanAssignRole`, `assertNotSelfDemotion`; `isMemberOf` |
| 3 Unit tests | ✅ 302 core (full 10×28 truth table) + 28 web (matrix == migration, guard static check, cookie tamper/replay) |
| 4 API + guards | ✅ `withApi` guard chain on all 10 routes; Zod; `FORBIDDEN`/`CONFLICT`/`INVITE_*`/`LAST_ORGANIZATION_ADMIN` codes |
| 5 Cross-tenant | ✅ API: filesystem **route sweep** (unlisted route fails) + tampered/replayed cookies. RLS: 32 tests incl. RPC escalation, wrong-email accept, anon locked out |
| 6 UI on real data | ✅ org switcher, `<Can>`, `/dashboard/users` + invite modal, signed-out `/invites/accept` |
| 7 Seed | ✅ MU: Registrar (DPDP owner), Org Admin, Dean, IT/Security, Legal, Dept Owner (Examinations), Anix consultant (both orgs); BML: DPDP owner, Org Admin |
| 8 Audit | ✅ `organization.user.invited` / `.invite.accepted` / `.user.role_changed` / `.user.status_changed` written inside the RPCs; `auth.organization_switched` as the user |
| 9 CI + deploy | ✅ CI green on PR #3 and `main`; deployed; live e2e 37/37 |
| 10 Docs | ✅ this Sync Step; D-020…D-024; SLICE_02 promoted |

**Files**
- `packages/core/src/rbac.ts` (+ test); `membership.ts` gains `isMemberOf`; `types.ts`
  gains `OrganizationInvite` and membership fields.
- `packages/db/prisma/migrations/20260914100000_tenancy_rbac/migration.sql` —
  DDL, reference data, `app.has_permission`, `app.can_grant_role`, three RPCs,
  grants, RLS. `seed-data.ts` now has `memberships[]` per user + `SEED_COUNTS`.
- `apps/web/lib/api/guard.ts` (`withApi`, `ApiError`, `rpcError`,
  `resolveActiveOrganizationId`); `lib/auth/active-organization.ts`;
  `lib/invites/{token,lookup}.ts`; `lib/client/{api.ts,permissions.tsx}`;
  `lib/supabase/database.types.ts` (generated).
- Routes: `app/api/v1/auth/{me,me/organizations,me/permissions,switch-organization}`,
  `organizations/[id]/users`, `…/users/invite`, `…/users/[userId]`, `invites/accept`.
- UI: `app/dashboard/{layout,organization-switcher}.tsx`, `app/dashboard/users/`,
  `app/invites/accept/`.
- Tests: `tests/unit/{rbac-matrix,route-guard,active-organization}.test.ts`;
  `tests/rls/{db.ts,cross-tenant.test.ts,rbac.test.ts}`;
  `e2e/api/{rbac,route-sweep}.spec.ts`; `e2e/ui/{tenancy,invite}.spec.ts`.
- `tools/gen_db_types.mjs` (`pnpm db:types`, `--check` in CI); `app.yml`: seed
  counts `2/9/10/2/10/28/189`, anon-grant check, types check, cookie secret.

**Commands (new):** `pnpm db:types` — regenerate DB types after a migration (Docker must run).

### Slice 0B — Walking skeleton · 2026-09-14 · PR #1 (merged `33d94d0`)
**Deploy:** Vercel project `revised-truststack-web`, root `apps/web`, region `bom1`,
auto-deploys `main`. URL https://revised-truststack-web.vercel.app. Verified
2026-09-14: Aniket's manual smoke test (health, redirect, wrong password, both
tenants) passed; `PLAYWRIGHT_BASE_URL=<url> pnpm test:e2e` → 10/10 against the
live site; service-role key value absent from all served client JS. Vercel
account has 2FA enabled. Env vars set in Vercel: the three Supabase keys +
`NEXT_PUBLIC_APP_NAME` (no DB URLs — D-015).
**Supabase:** project ref `nywwsdcnqivefednqezw`, region `ap-south-1`, Postgres 17.6.
Migration `20260914000000_walking_skeleton` **applied** to it; seeded.

| Gate | Status |
|---|---|
| 1 Migration + RLS | ✅ 4 tables, RLS + policy on each; CI asserts every public table has both |
| 2 `packages/core` | ✅ types + `assertActiveMembership()`, no framework imports (CI grep) |
| 3 Unit tests | ✅ 5 in core + 1 import test from `apps/web` |
| 4 API + guards | ✅ `/api/v1/health`, `/api/v1/organizations/me`; Zod; spec envelope |
| 5 Cross-tenant | ✅ API (Playwright, both directions) **and** RLS (11 tests direct to Postgres) |
| 6 UI on real data | ✅ `/login`, `/dashboard` via the API; loading + error states |
| 7 Seed | ✅ Mumbai University + Bharat Manufacturing Ltd, 1 user each; idempotent (CI runs it twice) |
| 8 Audit | ✅ seeded sign-ins; live `auth.sign_in` / `auth.sign_out` written as the user via RLS |
| 9 CI + deploy | ✅ CI green on `main`; deployed to Vercel (see below) |
| 10 Docs | ✅ this Sync Step |

**Files**
- `apps/web/` — `middleware.ts` (guards `/dashboard`, 307 → `/login`);
  `app/login/{page,login-form,actions}.tsx|ts`; `app/dashboard/{page,organization-panel}.tsx`;
  `app/api/v1/health/route.ts`; `app/api/v1/organizations/me/route.ts`;
  `lib/api/envelope.ts` (`ok()` / `fail()`); `lib/supabase/{server,middleware,admin}.ts`;
  `lib/audit/record.ts`; `tests/unit`, `tests/rls` (Vitest); `e2e/api`, `e2e/ui` (Playwright);
  `vercel.json`.
- `packages/core/src/{types,membership,index}.ts`.
- `packages/db/` — `prisma/schema.prisma`, `prisma/migrations/…`, `prisma/seed.ts`,
  `prisma/seed-data.ts` (fixed UUIDs, imported by tests), `prisma.config.ts`, `src/client.ts`.
- `supabase/config.toml` (local stack for CI only — Prisma owns migrations).
- `tools/check_service_role.mjs` — service-role key referenced only in `admin.ts`,
  never `NEXT_PUBLIC_`, value absent from the client bundle.
- `.github/workflows/app.yml`; `docs.yml` now fails a PR that changes
  `apps|packages|supabase` without `docs/STATE.md` (D-010).
- Decisions D-015…D-019.

**Commands:** `pnpm install` · `pnpm dev` · `pnpm typecheck` · `pnpm test:unit` ·
`pnpm db:migrate` · `pnpm db:seed` · `pnpm test:rls` · `pnpm test:e2e` ·
`pnpm check:secrets`.

### Slice 0A addendum — industry question intake · 2026-09-14
- `docs/question_packs/industry/` — **10 industry files, 1,428 questions, 0
  duplicate codes, every file covers all 16 domains.** (Slice 3 added
  `UNI-GOV-009`, taking University to 108 and the total to **1,429**.)
  University 107 · EdTech 162
  · BFSI 201 · Healthcare 195 · SaaS 156 · Manufacturing 121 (added same day,
  fully prioritised) · Retail 128 · Professional Services 122 · Public Sector 121
  · General 115. (Duplicate `(1)` copies of BFSI and SaaS were
  byte-identical and excluded.)
- `tools/question_inventory.py` — layout-agnostic parser + invariant checks, run in
  CI. Generates `docs/question_packs/INVENTORY.md`.
- `docs/QUESTION_FORMAT.md` rewritten around the authored Markdown: canonical
  record, column aliases, `Type` split into applicability + risk tags, priority
  mapping, three-tier pack taxonomy, content gaps.
- `DECISIONS.md` D-013 (Markdown is source of truth), D-014 (overlays add to the
  16-domain score; core overlap resolved in Slice 3).
- `SLICE_03` stub re-synced with all of the above.

### Slice 0A — Scaffolding · 2026-09-07
Documentation and handoff system, no application code. `CLAUDE.md`, `STATE.md`,
`DECISIONS.md` (D-001…D-012), `SLICES.md`, `docs/slices/` (0B + 1 full, 2–13
stubs), `docs/spec` (frozen), `docs/legal`, `docs/source`, `.env.example`,
`.github/workflows/docs.yml`. Commit `b22d583`, CI green.

## ❄️ Frozen

`aniketmhala/dpdp` → `truststack-platform/` — pre-beta, no production tenants.
Bug fixes only until Slice 10 ports its six modules; retired at Slice 13 (D-002).

## Score oracle

From the workbook's 98 sample responses — **a CI gate since Slice 5** (D-007),
per D-047:
- workbook's naive rule: **24.7014 / 100** · **23.9%** · **10** critical · **57** high
  (the documented "24.7015" was a rounding slip);
- the spec's cap table: **25.3014 / 100** · **23.9%** · **10** critical · **52** high.

The gate asserts **both** (D-048) and passes. Red flags at adjusted **≤ 2**
(D-046): cap 50 on the sample either way. The samples are committed as
`packages/db/question-bank/workbook-sample.json`, regenerated and `--check`ed by
`tools/extract_core_pack.py`, so nothing at runtime opens the `.xlsx`.

**What the oracle cannot police** — each of these needed its own tests:
the empty-domain rule (all 16 domains are answered in the sample, D-038); the
band denominator (`applicable_weight` is 100 there, D-050); the red-flag
threshold (the cap is 50 either way); evidence freshness (no stale rows, D-049);
and the Slice 6 gap threshold (every sample answer is adjusted ≤ 2, so `≤ 3` and
`≤ 2` open the same 98 gaps — built at ≤ 3, D-054, with boundary tests of its
own). What the oracle DOES give Slice 6: the SQL generator opens exactly 98
gaps on the sample, **10 critical · 52 high · 36 medium**.
