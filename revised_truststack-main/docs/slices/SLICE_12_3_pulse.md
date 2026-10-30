# SLICE 12.3 — DPDP Compass™ Pulse: the short, self-declared assessment that ends in actions

**Status:** full prompt, written 29 Oct 2026; placement approved (D-144). **For Aniket's approval:
"SLICE_12_3 approved"**. Do not start before Slice 12 is merged to `main`.

**Branch:** `slice/12-3-pulse` off `main` (after Slice 12) · **Est:** 3 stages · **Target:** 9–20 Nov 2026

**The design is approved; this prompt does not reopen it.** Source of every rule:
`docs/reference/MULTI_LEVEL_ASSESSMENT_ANALYSIS.md` — Step 3 (design, Q1–Q8), Step 4 + 4b (visuals and
the chart quality standard), Step 5 (AI, Q1–Q6), Step 6 (simplicity fixes S1–S12), Step 7 (this plan).

---

## 0. Session bootstrap

1. Read `CLAUDE.md`, `docs/STATE.md`, this file, then the analysis Steps 3–7.
2. Check `main` has Slice 12 (`parent_assessment_id`, `carry_forward_responses`, the revisit rule). If
   not, stop and say so.
3. Read the code Pulse builds on (§5). Run the gate baseline from `docs/PLAYBOOK.md` §2 on the **local**
   stack (export the local env first; refuse unless the database host is 127.0.0.1).
4. Any opening other than a stage's start line: ask, write no code.

## 1. DPDP anchoring (checked against the Gazette text; re-check at each gate)

- Pulse assesses the same duties as Proof: the Act's Chapter II (ss.4–10) and Chapter III (ss.11–14),
  with the Rules 2025 (Rules 3–15 and the Schedules). **Every Pulse question shows its provision** from
  the bank, unchanged.
- **s.8(1):** the Data Fiduciary stays responsible; a self-declared score never says otherwise.
- **s.10 / Rule 13:** SDF status is **never inferred** from Pulse answers (D-028).
- **The Schedule:** penalty figures are maximums — "ceiling", never "fine".
- **Commencement:** main duties (Rules 3, 5–16, 22, 23) on **13 May 2027**, eighteen months after publication (Rule 1(4) of G.S.R. 846(E)); Rule 4 (Consent Managers) on 13 Nov 2026 (Rule 1(3)). The countdown uses 13 May 2027.
- **Never "compliant", "certified" or "pass"** (D-011); every Pulse figure says **"self-declared"**.

## 2. Goal

A person who has never studied DPDP can, in **about 20 minutes**, answer ~32–40 plain questions and get
**their five most important actions this month**, a **self-declared** score, and a path to prove each
domain with evidence. Repeat it monthly to show progress. Do it with the team, or live in a workshop.

## 3. Scope

**In:** solo Pulse, the declared score and gaps, the five actions, spot checks and "how sure", repeat
Pulses with "what changed", **Prove this domain** and the domain states, the Board page in the Exposure
Brief, the Pulse charts (4b.2a), Team Pulse and workshop mode, AI-1/2/3/4/5 (Step 5), the S1 and S5 fixes
on the live Proof screens (their own batch).

**Out (other slices):** industry picks for BFSI and Healthcare (Slice 12.5 adds them with each pack) ·
white-label PDF, the professional's client table, practice-pack metering (PK2/PK3, wave 2) · Sentinel
helper AI-8 (13.5) · client letter AI-9 (PK2) · billing.

## 4. Decisions — recommended, for Aniket to confirm (record each in DECISIONS)

**4.1 The record.** A Pulse is an `assessments` row with `assessment_type = 'pulse'` and
`pulse_mode` (`solo` | `team` | `workshop`). It never becomes a Proof assessment; Proof is the
organisation's baseline or reassessment.

**4.2 The Pulse set.** `question_versions.pulse_rank` (null | 1..n): two per domain (~32), every
red-flag question first, then P0, then the widest legal basis (Step 3.2). **The list is a gate
artefact**: Aniket and counsel approve it before Stage 1 merges. University picks (3–6) from the
approved University pack. Follow-ups switch on **only from scope**.

**4.3 Answers (S1).** One set of words for Pulse **and** Proof: *Not started · Aware · Written down ·
Approved · In use · Checked regularly* (0–5) + **I don't know** (`answer_state = 'unknown'`, counted as 0,
listed as an unknown, a task to find out — D-026). `CLAIM_LEVELS` is renamed; numbers, meanings and the
evidence cap are unchanged; Proof's meaning keeps "with evidence" at 4–5. A DECISIONS entry.

**4.4 The declared rule.** `DECLARED_CAP_RULE = (claimed) => claimed` in `packages/core` beside
`SPEC_CAP_RULE`, mirrored in SQL with a parity test. Snapshots gain `kind` (`proven` | `declared`);
**never blended**, never used for Proof. Oracle check: the 98 samples score **26.1** declared (25.3
proven) — a CI test.

**4.5 Gaps and the five actions.** Declared gaps at claimed ≤ 3 (D-054), derived in SQL, labelled
"self-declared". **The five actions are ranked by rule** (red flags → P0 → largest Schedule ceiling →
legal clocks before 13 May 2027), a pure function mirrored in SQL; the person ticks which to keep; kept
ones join the one actions list with `source = 'pulse'` (D-067). The AI never picks them.

**4.6 Spot checks.** Red-flag questions only, one tap (*document · records or logs · someone told me ·
not sure*). Not scored. Feed "how sure" per domain (*sure · partly sure · not sure*) and the Proof
checklist.

**4.7 Repeat Pulses (S8).** Reuse Slice 12's carry-forward: the last answers pre-fill; each domain is
**confirmed explicitly**, with one "Nothing changed in these N domains — confirm all" tap. "What changed"
lists moved answers, actions closed between, unknowns resolved. Expected movement dotted, "not yet
re-checked".

**4.8 Prove this domain.** Opens (or extends) the organisation's Proof assessment with **all** the
domain's applicable questions, Pulse answers pre-filled as claims marked "from Pulse — please confirm".
The evidence checklist comes from the bank's evidence guidance (rule-based). Domain states
**Declared → Being proven → Proven** are a derived view, never stored by hand. Proof's rules unchanged.

**4.9 Team Pulse and workshop (S9–S11).** `assessment_domain_assignees` (owners pre-filled from the
bank's suggested owner by role, one "Send all", a reminder after 3 days); `assessment_response_inputs`
(two independent answers on red-flag questions; disagreement at ≥ 2 levels is a finding; one "Settle").
Workshop: large type, one question per screen, keyboard 0–5 and U.

**4.10 The Board page.** A new section in the Exposure Brief: "You say X (self-declared, Pulse of
[date]). You can prove Y (evidence-backed, [date])." plus the domains furthest apart and three
decisions. Pulse findings show in the exposure view as **"declared position"**, never blended.

**4.11 AI (Step 5).** `question_helper` gains the six answer examples (AI-1); four new tasks:
`spotcheck_helper` (explain), `action_plan_draft` (draft), `evidence_checklist_draft` (draft),
`disagreement_helper` (explain; department names only). Guardrails G1–G7, including **G1 the label
lock** as a wording rule and **G6: every screen works with AI off**. The reference set grows by four
cases per new task. Held industries and the kill switch unchanged.

**4.12 Simplicity (S2–S12).** About 20 minutes; inline five scope questions (S4); no question codes on
any screen, export or PDF (S5, also on Proof); *Declared* = "what you told us", *Proven* = "what your
evidence shows" (S6); the result in three layers, actions first, "held at 50 until…" (S7); phone-first
"my part" (S10); one ✦ per question, none on scores (S12). UX rows U48–U59 scored on screen at each gate.

**4.13 Charts.** The Pulse charts follow the 4b.2a standard (proven blue, declared orange, status colours
with words, a Table view per chart). **Apache ECharts bundled with the app** (no CDN, so client-hosted
works offline) — a DECISIONS entry under CLAUDE.md's stack rule (Step 4b Q1). Charts read the routes'
own readers and add no arithmetic (D-069).

**4.14 Metering hook.** "A client organisation counts once it has a Pulse" (P-4) is exposed as a derived
fact for Slice 14; no billing here.

## 5. What exists — build on it

| Area | Where |
|---|---|
| Scoring | `packages/core` `scoreAssessment`, `EngineOptions.capRule`, `SPEC_CAP_RULE`, `MATURITY_BANDS`, `questionSeverity`, `questionPriority` |
| Answer words | `packages/core/src/assessment-display.ts` `CLAIM_LEVELS`, `claimLevelLabel` |
| Assessments | `assessments`, `assessment_responses`, `assessment_score_snapshots`; `lib/assessments/*`; the answering page `app/dashboard/assessments/[id]` |
| Carry-forward | Slice 12: `start_reassessment`, `carry_forward_responses`, the revisit rule |
| Gaps and actions | the derived gap register (D-054, D-058), `gap_actions`, the one actions view |
| Exposure and reports | exposure model 1.7.0 (1.8.0 after Slice 12), the Exposure Brief, the report store |
| AI | `packages/core/src/ai-tasks.ts`, `ai-guardrails.ts`, `ai-drafts.ts`; `apps/web/lib/ai/*`; the reference set |
| Roles | `consultant` already exists ("runs assessments for the client organisations they are assigned to") — workshop mode needs no new role |
| Chart reference | `tools/visual_report.mjs` + `tools/visual_report_template.html` (the approved forms and palette) |

## 6. Data-protection position

Pulse stores answers about the organisation, not about Data Principals. Team Pulse stores who answered
(user ids, audited). Nothing personal is sent to the AI (department names only, G4). The product works
in full with AI off (G6), so BFSI, healthcare and client-hosted installs lose nothing essential.

## 7. Stages and approval gates

| Stage | Start line | Builds | Gate: Aniket approves… |
|---|---|---|---|
| **1 — solo Pulse** | "SLICE_12_3 approved" | Migration (`assessment_type` 'pulse', `pulse_mode`, `pulse_rank`, `answer_state`, `spot_check`, snapshot `kind`, `gap_actions.source` 'pulse'), RLS + CI gate; core: `DECLARED_CAP_RULE`, the five-actions rule, "how sure" (mirrored in SQL); routes; Start a Pulse (S4), answering (S5, S10), the result (S7); seed: MU's first Pulse. **Separate commit: S1 + S5 on Proof's live screens** | the Pulse set list (with counsel); a Pulse on MU end to end in ~20 minutes; the oracle 26.1 test; U48–U50 scored; the manual test |
| **2 — repeat, prove, Board, AI** | "Start Slice 12.3 Stage 2" | Repeat Pulse (S8) on carry-forward; "what changed"; Prove this domain + the domain-states view; the Board page; the Pulse charts (ECharts bundled); AI-1, AI-2, AI-3, AI-5 with G1–G7 and their reference cases | a repeat and a domain upgraded to Proven on MU; the Board PDF; the AI reference results; U51, U55, U56, U59 scored; the manual test |
| **3 — team and workshop; close** | "Start Slice 12.3 Stage 3" | Team Pulse (assignees, inputs, disagreement, Settle, reminder); workshop view (S11); AI-4; the Sync Step (STATE, SLICES, DECISIONS, UX_REVIEW, register, tracker; Slice 12.5 prompt promoted with Pulse picks per pack) | a Team Pulse with a settled disagreement; a workshop run by a consultant; U52–U54 scored; the manual test; the handover |

## 8. Tests (every stage)

- **Core:** the declared rule on the 98 oracle samples (26.1 declared, 25.3 proven, unchanged); the five-
  actions ranking; "how sure"; the label lock (G1) and number lock (G2) wording tests.
- **SQL:** every rule mirrored and held equal to core by a test; declared and proven never blended
  (a query over snapshots).
- **RLS:** Org A / Org B on every new table; a Team Pulse assignee sees only their domains.
- **e2e (one worker):** start → answer → result; I don't know → task; repeat with confirm-all; prove a
  domain; Team Pulse disagreement → Settle; AI off → every screen still works.
- **UX:** U48–U59 scored on screen in light and dark, laptop and 375 px.
- **Manual test per stage:** a plain Do / Expect list on the local stack.

## 9. Known pitfalls

1. **Never blend** declared and proven in one number, chart bar or sentence.
2. **Don't borrow band names for answers:** "Defined" is a band, not an answer (S1).
3. **No silent copy-forward:** a repeat pre-fills but every domain is confirmed.
4. **The AI never picks the five actions** and never changes an answer.
5. **No question codes** on client-facing surfaces (S5).
6. **A finalised Proof never changes** when Pulse pre-fills claims (D-035): pre-fill only into a draft
   or in-progress Proof.

## Must not be lost

- The headline "You say X. You can prove Y." appears only where both figures exist.
- "I don't know" is a task, not a blank.
- Pulse works with AI off; client-hosted works offline (charts bundled).
- Wave 1 professionals (Dec–Jan) use the existing `consultant` role and workshop mode — no partner
  features needed for wave 1.
- The ICAI "DPDP Compass" name clash: counsel's trade-mark search before launch (Step 5 Q6).
