# SLICE 12 — Reassessment and trend

**Branch:** `slice/12-reassessment` · **Est:** 2 sessions, in 2 stages (1, 2), each ending at an
approval gate (§7) · **Week:** 20 · **Ships:** reassessment that **measures improvement, not a
restart from zero** (spec Step G "Reassessment Logic"; PRD §13): start a full, delta or
event-triggered reassessment from a finalised assessment, carry forward what still stands, re-ask
what is open, weak, stale or new, and compare baseline with current — the workbook's
`Reassessment_Trend` sheet as the shape.

> **STATUS: FULL PROMPT, for Aniket's approval.** Written 2026-10-22 by Slice 11's Sync Step
> (D-136), against the code on `slice/11-ai-assistant` @ the close commit — **Slice 11 is merged and
> live (`49c9eba`, D-138).** **Do not start Stage 1 until Aniket has approved §4 (the
> decisions)** in his opening message:
> - **"SLICE_12 approved"** — every §4 decision as recommended; or
> - **"SLICE_12 approved with changes: …"** — record each change in DECISIONS and edit this file to
>   match BEFORE writing code.
>
> Any other opening message: ask, and write no code. **The opening message starts Stage 1 in that
> session**; Stage 2 is its own new session, opened with **"Start Slice 12 Stage 2"** after "Stage 1
> approved". One branch for both, off `main`; one PR into `main` at the end of Stage 2. If anything
> has drifted since 2026-10-22, the code wins.

---

## 0. Session bootstrap

1. Read `docs/STATE.md` (its ▶ box first), `docs/DECISIONS.md` (esp. **D-011, D-019, D-027, D-034,
   D-035, D-038, D-039, D-043, D-044, D-048, D-050, D-054, D-056, D-058, D-069, D-071, D-074, D-076,
   D-104, D-114.8, D-119 (esp. .6), D-133.1** and Slice 11's D-123–D-136; the s.11(1)(b) fix D-139–D-140; D-141 — the approved build sequence, which adds §4.13), this file,
   `docs/UX_REVIEW.md`, spec **Step G "Reassessment Logic"** (`docs/spec/03_…G-I.md` §"Reassessment
   Logic"), **Step J "Reassessment Dashboard"** (`docs/spec/04_…J-L.md`), the data model's
   `assessment_type` / `parent_assessment_id` (`docs/spec/02_…D-F.md`), and the Act's **s.8(1),
   s.8(5), s.10(2)(c)** and the Rules' **Rule 13(1)** (`docs/legal/`, `pdftotext -layout`).
2. **Branch:** `git checkout main && git pull && git checkout -b slice/12-reassessment` (PR #41 —
   Slice 11 — and PR #44 — the s.11 fix — are merged). Stage 2: `git checkout slice/12-reassessment && git pull`.
3. Local stack as before (export the local env first — `.env.local` points at hosted; e2e
   `--workers=1`; every gate: `docs/PLAYBOOK.md` §2; **the seed gate needs the local `DIRECT_URL`
   exported**). Baseline after Slice 11 and the s.11 fix (on `main`, `ced5cda`, D-140): core **1,411**, web unit **901**, RLS
   **581**, **24** CI SQL gates, e2e **486**; **31 migrations**, the last
   `20261023000000_ai_notice_narrative` — this slice's first is dated after it.
4. The UI conventions (D-101): `components/shell/`; `globals.css` tokens; `<Notice>` / `useToast()`;
   `<DataTable>` for a list that grows, `<Tabs>` for a long page, under the paging guard; counts in
   words (`countNoun`); no font CDN or hosted-only call (client-hosted, proposed Slice 15). Every new
   surface is scored in `docs/UX_REVIEW.md` — **legally exact, yet simple for a non-lawyer**.
5. Every stage ends with a walk-through **and** a step-by-step manual test
   (`docs/testing/SLICE_12_stageN_{walkthrough,manual_test}.md`) with a one-command runner for its API
   part, before/after `.webp`, and the handover check (PLAYBOOK §6).

## 1. DPDP anchoring (checked against the Gazette text, 2026-10-22)

- **s.8(1):** the Data Fiduciary stays responsible for complying with the Act and the Rules —
  readiness is not a one-off state; **s.8(5)** reasonable security safeguards are an ongoing duty.
  Reassessment is how the platform shows that responsibility being kept, over time.
- **Only a Significant Data Fiduciary has a statutory cycle:** s.10(2)(c)(i)–(ii) periodic DPIA and
  audit; **Rule 13(1): once in every period of twelve months** from notification, with a report of
  significant observations to the Board (Rule 13(2)). For everyone else, **30-day, 90-day, 180-day and
  annual reassessments are TrustStack's cadence, never the law** (Slice 10 pitfall 1). The product
  never presents a TrustStack cadence as statute, and never presents a TrustStack reassessment as an
  SDF's Rule 13 DPIA or audit (D-028: no SDF status is inferred).
- **Commencement (the clock):** most of the Rules commence **13 May 2027** (Rule 1(3)–(4);
  the consent-manager rules on 13 November 2026). A reassessment before then measures readiness for duties not yet in force;
  copy must say "readiness", never "compliance".
- **The product's own rules carry over:** the score is the engine's, from stored adjusted scores
  (D-035, D-044); a finalised score and its gaps are frozen (D-058); a scope change is a scope change,
  not score movement (Slice 3 external review, §4.6 below).

## 2. Goal

1. **Start a reassessment from a finalised assessment** — one of three modes (PRD §13):
   - **Full** — every applicable question, each pre-filled from the last answer for a person to
     confirm or change (baseline-again, annual review, audit readiness);
   - **Delta** — re-ask only what is open, weak, stale or new; carry the rest (30/90-day reviews);
   - **Event-triggered** — re-ask only the domains a named event touches (a new processor, system, AI
     tool, form, breach, cross-border transfer or policy change); carry the rest.
2. **Carry forward, never restart:** a carried answer keeps its applicability, claimed maturity and
   notes, and its evidence is RE-LINKED (the same reviewed items), so the database re-derives the cap.
3. **Compare and trend:** baseline vs current, side by side — readiness score, maturity, evidence
   confidence, applicable-weight coverage, critical and high gaps, open actions, ROPA completion — with
   a scope change shown as a scope change, and domain movement only where both assessments assessed the
   domain; a trend of every version (V1 Baseline, V2 30-day, …) in the workbook's shape.
4. **A Reassessment Report** (PDF, stored document — D-133.1's pattern) and, if approved (§4.10), the
   assistant's "Why did the score move?" from the STORED comparison.
5. **Sentinel S1 — the tier card** (added 2026-10-28 by the consolidated analysis, Step 6 Q5, D-141):
   which level of continuous assurance this organisation needs, and why (§4.13).

## 3. Scope

**In:** the reassessment record and its parent link, the three modes, question selection and
carry-forward, the comparison and trend (SQL-derived), the reassessment page and trend view, the
Reassessment Report, the assessment list's server-side counts (D-114.8), the decision on D-119.6 (§4.7),
seed (MU gains a finalised baseline and an in-progress delta), tests, audit; **the Sentinel tier
card (§4.13)**.
**Out (later slices):** evidence expiry dates (D-049 — Slice 13; this slice uses the existing
`outdated` review status and an age rule, §4.4); automatic reassessment or reminders (Slice 13); a
reassessment of a single department or a vendor (spec's `department`/`vendor` types — not in the PRD's
three modes); the Anix console's cross-client trend (Slice 14).

## 4. Decisions — recommended, for Aniket to confirm (record each in DECISIONS)

**4.1 The record.** A reassessment is an `assessments` row with `assessment_type = 'reassessment'`
(the CHECK already allows it), a new **`parent_assessment_id`** (composite FK `(organization_id,
parent_assessment_id)`, D-027), **`reassessment_mode`** (`full` · `delta` · `event`, NULL for a
baseline — a CHECK), **`version_label`** (a person's label, e.g. "V2 30-day review"; default "V{n}"),
and for `event`, **`trigger_event`** (a short note) and **`trigger_domains`** (domain codes). *Rec.*

**4.2 Who and when.** Started with `assessment.write`, **only from the newest FINALISED assessment of
the organisation**, and **only when no other draft or in-progress assessment exists** — so
`pickAssessments` (one finalised + one in progress) stays true, and the trend is a line, not a tree.
An SQL function `start_reassessment(p_org, p_parent, p_mode, p_label, p_trigger_event, p_trigger_domains)`
creates the row; the app then generates the questions (as `create` does) and calls
`carry_forward_responses(p_org, p_assessment)`. Audited (`assessment.reassessment_started`). *Rec.*

**4.3 Questions come from the CURRENT scope and bank** — `generateForOrganization`, exactly as a new
assessment. A reassessment reflects what the organisation is today: a domain newly in scope appears,
one now out of scope leaves (§4.6 shows both). Bank provenance stays withheld (D-071). *Rec.*

**4.4 What is re-asked ("revisit") and what is carried.** For each question of the new set, with the
parent's answer to the same `question_code` and `question_version`:

| Revisit when… | Full | Delta | Event |
|---|---|---|---|
| no parent answer, or the question's version changed (new to the set) | ✔ | ✔ | ✔ |
| the parent's adjusted score ≤ 3 (an open gap, D-054) or a red flag (≤ 2, D-046) | ✔ | ✔ | in trigger domains |
| the answer's strongest evidence is `pending`, `rejected`, `outdated`, or **reviewed more than 12 months ago** (a TrustStack default, not the law — D-049's expiry dates are Slice 13) | ✔ | ✔ | in trigger domains |
| the question has an open action that is overdue | ✔ | ✔ | in trigger domains |
| the question is in a trigger domain | — | — | ✔ |
| anything else | pre-filled, to confirm | **carried** | **carried** |

A **carried** answer is copied into the new assessment (applicability, N/A reason, claimed maturity,
notes) with `carried_from_response_id` set and **every evidence link re-created to the same evidence
items** — review status and level are per item, so the database re-derives `evidence_level` and
`adjusted_score` (D-044); nobody re-reviews, nothing is overridden (D-039). A **revisit** question is
left unanswered, with the parent's answer shown beside it read-only ("Last time: …"). A carried
answer can be edited like any other. In **full** mode every answer is pre-filled AND marked "to
confirm"; finalising needs each confirmed (the outstanding count, D-050's denominator, unchanged). *Rec.*

**4.5 Gaps and actions (D-058 kept).** The parent's gaps stay frozen with its score; its actions live
on where they are (never moved, never duplicated). The new assessment generates its own gaps from its
own adjusted scores (`generate_assessment_gaps`). Where a new gap has the same `question_code` as a
parent gap with an OPEN action, the new gap shows **"Already being worked on: <action> (from V1)"** and
**no duplicate action is suggested**; closing still needs accepted evidence or a non-owner reviewer
(D-056). *Rec.*

**4.6 A scope change is reported as a scope change** (Slice 3 external review — must not be lost).
The comparison shows, side by side: the readiness score; **the applicable weight assessed**
(`93/100 → 100/100`, D-050); what changed in scope (domains in / out, questions added / removed);
and **domain movement only for domains applicable in both**. The headline sentence names a scope
change before a score change when there is one ("The score fell 2.1 points, mostly because Domain X
came into scope; on the 14 domains assessed both times it rose 6.4"). *Rec.*

**4.7 D-119.6 — the forecast's count with two assessments.** Today the exposure forecast counts the
CHOSEN assessment's gaps (newest finalised, else in progress) with an actionless gap as one unit; the
Actions page counts every assessment's actions. With a reassessment they first differ. *Recommendation:*
**exposure model 1.8.0** counts the chosen assessment's gaps **plus** older assessments' still-OPEN
actions whose `question_code` has no gap in the chosen assessment (work promised and not done does not
vanish because a newer assessment exists), each once; a new model row in its own migration (D-079.6).
*Alternative:* keep 1.7.0 and say on the Actions page that older assessments' actions are not in the
forecast.

**4.8 Exposure and the overview while a reassessment runs.** The basis stays the newest FINALISED
assessment (`pickAssessments` — unchanged); the overview shows the reassessment's provisional score
beside it, as it already shows an in-progress assessment. Nothing moves the exposure figures until the
reassessment is finalised. *Rec.*

**4.9 The comparison and the trend are SQL-derived, never client arithmetic (D-069).**
`public.assessment_comparison(p_org, p_from, p_to)` returns both sides from the FINALISED snapshots
(or, for an unfinalised side, the live score reader, labelled **provisional**) and the per-domain rows;
`public.assessment_trend(p_org)` returns every assessment in the chain in order. Pages and the report
read only these (D-069). The trend's columns are the workbook's: version, date, overall score, maturity
level, evidence confidence, critical gaps, high gaps, open actions, comment — plus applicable weight.
*Rec.*

**4.10 The assistant (optional, Stage 2).** A `reassessment_helper` explain task — "Why did the score
move?" — reading ONLY the stored comparison (pitfall 1), read with `score.read`, in 1b's answer shape;
a new migration replacing the task vocabularies (as every Slice 11 stage did); reference cases ×3 (a
scope change named first; never "compliant"; a cadence never as the law). *Rec: include.*
*Alternative:* leave to Slice 14.

**4.11 The Reassessment Report** — a new PDF kind `reassessment_report` (Leadership / consultant; spec
J report 9): the comparison and the trend, the scope change, domain movement, the new and closed gaps;
it **keeps its document** (D-133.1) so it can carry a narrative later. Generated with
`report.generate`; records no new exposure snapshot (it reports two finalised assessments). *Rec.*

**4.12 The cadence is offered, never imposed.** The finalised assessment's page suggests the next
review (30 days after a baseline, 90 after a 30-day review, then 180, then annual — **TrustStack's
cadence, labelled so**); for an organisation with `sdf_notified_on`, the line instead quotes Rule 13(1)
("A Significant Data Fiduciary undertakes a DPIA and an audit once in every period of twelve months —
a TrustStack reassessment is not that audit"). No automatic start, no reminder (Slice 13). *Rec.*

**4.13 Sentinel S1 — the tier card (D-141; design: `docs/reference/CONSOLIDATED_FEATURE_ANALYSIS.md`
Step 3 §3.5).** A pure core function `sentinelApplicability(facts) → { tier, reasons[] }` over facts the
registers already hold, read through their own readers (D-069): children's data in the ROPA,
`sdf_notified_on` / `third_schedule_class`, the industry, `data_principal_count_estimate`, AI systems on
personal data, cross-border records or processors, the number of linked processors, a breach in the last
24 months, `parent_organization_id`. Tiers **Essentials · Lite · Sentinel · Critical** (Step 3 Q3);
**Essentials is always shown as included** (Step 3 Q2). A card on the overview: the tier, two or three
plain "because you…" reasons, and "Not now" honesty for low-signal organisations. **No table, no
migration, no score** (Step 3 Q1); never infers SDF status (D-028); the AI writes nothing here. Weights
live in core with a version, unit-tested, and are TrustStack's, labelled so. Stage 2. *Rec.*

## 5. What exists — build on it (verified 2026-10-22)

| Concern | Where |
|---|---|
| Assessments | `assessments` (`assessment_type` CHECK `baseline`/`reassessment`; `status` `draft`/`in_progress`/`submitted`/`finalised`); routes `lib/assessments/routes.ts` (`list`, `create` → `generateForOrganization` then compensating delete on failure, `read`, `questions`, `generate`); `lib/assessments/generate.ts`, `bank.ts` |
| Questions | `public.set_assessment_questions(org, assessment, rows)` (draft only; deletes and re-inserts; audited); `assessment_questions` is a snapshot (D-035) with `question_version`; black box by column (D-071) |
| Answers | `assessment_responses` — one per question; `evidence_level` / `adjusted_score` derived by the database from the strongest REVIEWED linked evidence (D-044); `lib/assessments/responses.ts` |
| Evidence | `evidence` (per-ITEM `review_status` `pending`/`adequate`/`strong`/`partial`/`rejected`/`outdated`, `evidence_level`, `reviewed_at`), `evidence_links` (`linked_entity_type` `assessment_response` …; UNIQUE per evidence + entity) |
| Score | `lib/assessments/score.ts` `readAssessmentScore` (finalised snapshot or live); `public.finalise_assessment` (writes `assessment_score_snapshots`, freezes gaps — D-058) |
| Gaps / actions | `public.generate_assessment_gaps(org, assessment)`; `lib/gaps/shape.ts`; actions live on after a gap is frozen (D-058); closing rule D-056 |
| Choosing an assessment | `lib/dashboard/read.ts` `pickAssessments` (newest finalised; in progress only if newer); `lib/exposure/read.ts` `chooseAssessment` |
| The list's per-row count | `assessments.list` counts each row's questions in its own query (D-114.8 — make it one server-side count) |
| Reports | `lib/reports/generate.ts` `runGeneration` (begin → build → render → store → finish), `NARRATABLE_KINDS`, `reports.document` (D-133.1); `app.report_kinds()` (a new kind = a migration replacing it and `reports_kind_format_check`) |
| AI | `lib/ai/gateway.ts` `buildContext` (a new task adds a case), core `AI_TASKS` / `AI_TASK_SPECS`, mirrored by a migration replacing `app.ai_tasks()` / `app.ai_task_read_permission()` / `app.ai_task_write_permission()` / the target CHECK; answer shape `lib/ai/answer.ts`; reference set `packages/core/src/ai-reference-set.ts` |
| Reference shape | the workbook's `Reassessment_Trend` sheet (`docs/source/…Step12.xlsx`): Assessment Version · Date · Overall Score · Maturity Level · Evidence Confidence · Critical Gaps · High Gaps · Open Actions · Comment; versions V1 Baseline, V2 30-Day, V3 90-Day, V4 180-Day, V5 Annual / Continuous |
| Seed | MU has one in-progress baseline (`SEED_ASSESSMENTS.muBaseline`, 123 questions unanswered at 2b's live run) — Stage 1 must finalise a baseline in the seed (fictional answers + reviewed evidence) to start a reassessment from |

## 6. Data-protection position

Nothing new is collected: a reassessment copies the organisation's own answers and re-links its own
evidence inside the tenant. Gate 5 holds for the parent link (composite FK) and for every reader. The
Reassessment Report is a record (immutable, D-076) like the others. The AI helper (if approved) sends
only the stored comparison's numbers and domain names — no answer text, no evidence, no person (§4.6 of
SLICE_11 applies). **Client-hosted (proposed Slice 15):** nothing hosted-only.

## 7. Stages and approval gates

| Stage | Start line | Builds | Gate: Aniket approves… |
|---|---|---|---|
| **1 — start, carry, answer** | "SLICE_12 approved" | Migration: `parent_assessment_id`, `reassessment_mode`, `version_label`, `trigger_event`, `trigger_domains`, `assessment_responses.carried_from_response_id`, CHECKs, `start_reassessment`, `carry_forward_responses` (SQL: revisit/carry per §4.4, evidence re-linked, audited), RLS + CI gate; core: the revisit rule as a pure function mirrored in SQL (a test holds them equal, as the scoring engine is); route `POST …/assessments/{id}/reassess` (sweep probe); the assessment page's "Start a reassessment" (mode, label, trigger) and the answer view's "Last time: …" / "Carried from V1" / "to confirm"; §4.5's "Already being worked on"; D-114.8's server-side count; seed: MU's finalised baseline | a delta and an event reassessment on MU; that nothing restarts from zero and nothing is re-reviewed; the scope-change case; the manual test |
| **2 — compare, trend, report; close** | "Start Slice 12 Stage 2" | `assessment_comparison`, `assessment_trend` (SQL); the comparison page and the trend (the workbook's columns), §4.6's headline; §4.7 (model 1.8.0 or the label); the Reassessment Report (new kind, stored document); §4.10's helper if approved; §4.12's cadence line; **§4.13's tier card**; Sync Step (promote SLICE_12_5 — Packs I — D-141), the PR, the hosted migrations after the deploy | the comparison on MU (scope change and domain movement), the trend, the report, the helper's reference cases, the tier card on MU and on BML, the PR |

## 8. Tests (every stage)

- **Carry-forward is exact:** a carried answer equals its parent's (applicability, N/A reason, claimed
  maturity, notes); its evidence links are the parent's items; `evidence_level` and `adjusted_score`
  are re-derived, never copied; a revisit question is unanswered; the outstanding count is right.
- **The revisit rule:** core and SQL agree on every row of §4.4's table (a test runs both on the same
  fixture, as the scoring engine's oracle does).
- **Only from the newest finalised assessment, only one open at a time, only with `assessment.write`**
  — RLS and API; **Gate 5** on the parent link (Org B cannot start a reassessment of Org A's
  assessment, nor link to it — composite FK).
- **D-058 holds:** the parent's gaps and score never change; its actions are not moved or duplicated.
- **Scope change:** a fixture where a domain enters scope — the comparison reports the coverage change
  and domain movement only for comparable domains; the headline names the scope change first.
- **The comparison and trend are SQL's:** the page and the report add no arithmetic (D-069 test).
- **Black box:** no question code, pack or weight reaches a client in the comparison or the report.
- **Wording:** no "compliant"; a TrustStack cadence never as the law; Rule 13(1) only for an SDF.
- Audit for every start, carry and report.

## 9. Known pitfalls

1. **Carry, don't copy numbers.** Copying `adjusted_score` would freeze a cap the evidence no longer
   supports; re-link the evidence and let the database derive it (D-044).
2. **A scope change is not regression** — the trend line lies otherwise (§4.6).
3. **The finalised parent is frozen** — nothing in a reassessment may write to it, its gaps or its
   snapshot (D-058); its actions are shared, not copied.
4. **TrustStack cadences are not the law** — only Rule 13(1) (SDFs, twelve months) is.
5. **`pickAssessments` assumes one finalised + one newer in progress** — enforce "one open at a time"
   in the database, not only in the UI.
6. Carried: new route ⇒ sweep probe; migration ⇒ `pnpm db:types`; local gates on the local stack only;
   disposable e2e tenants (free from `…a034`); an applied migration is frozen.

## Must not be lost (from the stub, kept)

- Reassessment measures improvement; it does not restart from zero (§4.4).
- `Reassessment_Trend` is the reference shape (§4.9).
- Delta and event-triggered modes (PRD §13), not only full (§4.1, §4.4).
- A scope change is reported as a scope change (§4.6).
- D-119.6 — a second assessment splits two counts (§4.7).
- D-114.8 — the list's per-row count goes server-side (Stage 1).
- **Pulse is next (Slice 12.3, multi-level assessment Step 7):** keep `assessment_type` open to a third value (`'pulse'`), keep the revisit rule a pure function any parent can use, and let carry-forward be confirmed **per domain** (Pulse's one-tap "confirm all unchanged domains", S8). Do not build Pulse here.
