# Slice 11 · Stage 1b — walk-through: explain in the app

> **✅ Approved 2026-10-20 — "Stage 1b approved", every call including call 12 (D-128).**
> Kept as the record of what was approved; the next stage is 2a (SLICE_11 §7b).

Built 2026-10-20 on `slice/11-ai-assistant` (draft PR #41, CI only), on top of Stage 1a
(approved, D-126). Opened by **"Start Slice 11 Stage 1b"**. It builds on D-124 (§4 and
§6 as written), D-125 (the gateway) and D-126.3 (the live smoke's s.8(10) mislabel becomes
the reference set's first case, with its server rule). The calls this stage made are
**D-127**.

**What changed in the data, the law and who may do what.** One migration,
`20261021000000_ai_explain_helpers`, with three changes. Three explain tasks join the
Question Helper. A person may now rate an AI answer (thumbs up or down, once). The draft
store's "never changed" rule is narrowed to "only the rating changes". **No permission
changed**: each helper needs `ai.use` plus the read permission of what it explains
(`evidence.read`, `gap.read`, `score.read`), and every role holds all of them. **Nothing
new is sent to the model that §4.6 did not already allow**; walk-through §3 lists each
helper's allow-list. **The live site is untouched**: the migration stays local until the
slice's PR at the end of Stage 2b, and `AI_ENABLED` stays unset there until A1. No score,
evidence, gap or action write path changed, and exposure model 1.7.0 is unchanged.

The manual test is `docs/testing/SLICE_11_stage1b_manual_test.md` (about 25 minutes:
Part A is one command, Part B is in the browser, Part C optionally uses the real model).
Its gate: **"Stage 1b approved"** (or "Stage 1b approved with changes: …").

## What you are approving

1. **The side panel** (`components/ai/assistant-panel.tsx`) in the B0 shell, opened by an
   Explain button in five places:
   - a question;
   - an answer's evidence ("Is this evidence enough?");
   - a gap ("Explain this gap");
   - an assessment action on the Actions page ("Explain this action");
   - a domain's score ("Why this score?" on the scorecard and the tile).
   Each answer has §4.13's one shape: the answer in one sentence, why it matters here, one
   next-step button that goes somewhere real, the law folded away and told apart, "Tell me
   more", the review note and the caveat, and thumbs up / down.
2. **Three new helpers through the gateway**: Evidence, Gap/Action and Score, each with its
   allow-list, unit-tested with planted bank internals and personal data.
3. **The switch in Organisation settings** — a fifth tab, "AI assistant". It says what the
   assistant does and never sends, and gives the status ("On since …, turned on by …, under
   contract …"), the hold or platform notice, and the contract (DPA) reference, which is
   required to turn it on. Only `organization.update` may change it.
4. **Thumbs up / down** — once, by the person who asked, on an answer that was kept; the
   comment is scrubbed and never audited.
5. **The reference set** — twenty explain cases in `packages/core`, run in CI on recorded
   answers and by hand on the live model. **Case R1 is the live smoke's s.8(10) finding**,
   and with it comes the server rule: a cited provision is "the law" unless its point names
   a TrustStack target.
6. **One 1a guardrail narrowed** (D-127.15, call 12): the live run showed the wording
   check refusing the assistant's own "a reviewer decides whether the evidence is
   accepted". A condition, like a denial, in the same clause is now not a claim. §7a.7 said
   the guardrails must not change, so this one needs your explicit yes.
7. **The calls in §9.**

## 1. Before and after

| Page | Before (`docs/testing/slice11-1b/before/`) | After (`…/after/`) |
|---|---|---|
| U11 Assessment — a question | No help beyond the evidence guidance | **✦ Explain** beside "Suggested owner" (`U11-question-button`) → the panel (`U11-question-panel`, `…-panel-open` with the law and Tell me more unfolded, `…-feedback`) |
| U11 Assessment — an answer's evidence | The file list and the cap sentence | **✦ Is this evidence enough?** on the Evidence line (`U11-evidence-button`, `U11-evidence-panel`) |
| U11 Assessment — Score tab | The scorecard and the GOV tile | **✦ Why this score?** on each scored row and the tile (`U11-score-button`, `U11-score-panel`) |
| U12 Gap register | Each gap with its fix and action | **✦ Explain this gap** beside the question (`U12-gap-button`, `U12-gap-panel`) |
| U13 Actions | Every action, by owner, in a table | **✦ Explain this action** under each ASSESSMENT action only (`U13-action-button`, `U13-action-panel`) |
| U06 Organisation settings | Four tabs | A fifth tab, **AI assistant** (`U06-ai-admin-tab`, `U06-ai-readonly-tab`) |

Every shot is at laptop (1366 px) and phone (390 px) width; no console errors on either run.
The panel takes the full width on a phone and a 28 rem column on a laptop. The question,
gap and Actions pages behind it stay as they were.

## 2. The panel — one shape for every helper (§4.13)

- **Opening asks at once** — one click to an answer. While the model works, a calm line:
  *"Reading the Act, the Rules and your organisation's own records…"*; after ten seconds,
  *"Still working. A careful answer takes 15 to 25 seconds; it is checked in full before you
  see it."* **No streaming** (D-127.1): the guardrails judge the whole answer, so streaming
  would show words that may then be refused.
- **The answer** in bold; **Why it matters here**; **one next step** as a navy button:
  - "Answer this question" and "Add evidence" focus that question's own form;
  - "Answer the remaining questions" opens the Questions tab on that domain;
  - "View gaps" goes to the gap register;
  - from the Actions page, both go to the action's register page.
- **The law behind this (n provisions)** is folded. Each provision is marked **The law**
  (blue) or **TrustStack default, not the law** (amber). A citation the corpus lacks was
  removed, and the panel says so in one line.
- **Tell me more** is folded: the longer explanation, "Evidence that would help", "What the
  assistant did not know".
- **Counsel to confirm** appears as a blue notice when the model set it.
- Every answer carries the review note (*"Suggested by the AI assistant — a person must
  review it before relying on it."*) and D-011's caveat.
- **Was this helpful? Yes / No**, then an optional comment, **Send feedback**, and a toast:
  *"Thanks for the feedback"*.
- **Errors are notices, in words.** Each has a title: *The assistant is off here* (403),
  *That answer was not kept* (422, with the reason), *Please wait a little* (429), *The
  assistant could not answer* (503). The message under each title is 1a's.
- **Ask something more specific** sends the person's own words as a new call, with a
  reminder not to type anyone's name, email or phone. Esc and ✕ close the panel.
- **The button is hidden** when the person lacks `ai.use` or the task's permission, or when
  `GET …/ai` says the assistant cannot answer (D-127.8).

## 3. What each new helper sends — and never sends (§4.5, §4.6, A3)

| Helper | Sends | Never sends |
|---|---|---|
| **Evidence** (`evidence_helper`, `evidence.read`) | The question's text, evidence guidance and area name; the organisation; whether the answer applies, the level **claimed**, and **whether** the evidence held it down; each file's **review verdict**, and its **name** as untrusted data; counts attached / awaiting review / accepted (Adequate or Strong) | A file's contents, an evidence level, by how much, the adjusted score, the cap, the reviewer, a review note, the uploader, a storage path, a question or pack code |
| **Gap / Action** (`gap_helper`, `gap.read`) | The gap's question, area, severity, state, finding, recommended fix, evidence guidance; each action's status, due date, owner **as a role** and whether it has an owner, evidence attached / accepted, how it was closed; titles and notes as untrusted data; which action was asked about | An owner's or closer's name or id, a reviewer's note, a file's contents, the adjusted score, a weight, a code |
| **Score** (`score_helper`, `score.read`) | The domain's name, state and status, its points scored **as a percentage**, its band and confidence, the counts (questions, answered, Not Applicable, unanswered), its critical and high gaps, provisional or finalised; from the **stored** answers: how many were held down by evidence and by how many answer points, the average claimed and counted | The weight, the cap table, a red-flag rule, the overall score cap, any code (§4.5); and nothing recomputed (pitfall 1) |

Every free text is scrubbed (A3: emails, phones, Aadhaar- and PAN-like numbers) and
stripped of bank codes; instruction-like text is flagged (`ai.injection_flagged`) and kept
inside `<untrusted_data>`. **Tests:** `tests/unit/ai-context-helpers.test.ts` (79) plants
21 internal and personal values across the three builders and proves none reaches the
prompt or the stored context. `e2e/api/ai-helpers.spec.ts` proves the same end to end on a
disposable tenant.

## 4. The switch in Organisation settings (A2, A4)

- **Everyone sees it.** The Dean sees *"On since 19 October 2026, under contract
  DEMO-DPA-AI-0001 (fictional, demo tenant)."* and *"Only an Organisation Admin or
  consultant can turn the assistant on or off."*
- **An admin** types the contract reference. **Turn the assistant on** stays greyed out
  until there is one. **Turn the assistant off** works at once and keeps the reference
  (D-125.8). **Update the reference** changes it, and each change is audited as
  `ai.enabled`, `ai.disabled` or `ai.contract_changed` (1a's triggers).
- **A held tenant** (`bfsi` or `healthcare` without counsel's sign-off, or an SDF) sees an
  amber **Held off** notice with 1a's reason, and the button stays greyed out. The
  database refuses it too.
- **The platform's kill switch**, when off, shows an information notice: *"The AI
  assistant is not available on this installation yet."*
- `GET /organizations/{id}` adds `ai.enabledByName`, an additive read, for "turned on by".

## 5. Thumbs up / down (§4.13)

- **Columns on `ai_drafts`:** `feedback` (up / down), `feedback_comment` (≤ 500),
  `feedback_by` and `feedback_at` (stamped by the database).
- **The database allows one change to a draft:** its rating — once, by the person who
  asked, on an answer that was kept. Everything else is still frozen, for tooling too.
  This replaces 1a's blanket "never changed" trigger.
- **The route** is `POST …/ai/drafts/{draftId}/feedback`, with a sweep probe. It scrubs
  the comment before storing it.
- **The audit** records `ai.feedback`: task, target, up/down and "with a comment" —
  never the comment itself.
- **Tests:** `tests/rls/ai.test.ts` §8 (4) and `e2e/api/ai-helpers.spec.ts` (2).

## 6. The reference set and the server rule (§4.13, D-126.3)

**`packages/core/src/ai-reference-set.ts`, version `2026-10-20.1b` — twenty explain
cases:**

| Cases | Helper | What they cover |
|---|---|---|
| R1–R12, R20 | Question | rights, security, children, consent, notice, breach (72 h the law; the 48 h / 12 h alerts TrustStack's), retention, cross-border (counsel to confirm), SDF (never inferred), grievance, roles, vendors, thirty days (TrustStack's target) |
| R13–R14 | Evidence | held down, never approved; an injection in the person's question |
| R15–R16 | Gap / Action | what closing takes; never closed by the assistant |
| R17–R19 | Score | held down by evidence; an untouched domain is "not started"; the band is TrustStack's method |

**What each case checks:**

- the headline is **one sentence of at most thirty words** (the live smoke's finding 2);
- the answer cites one of its expected provisions;
- statute is labelled the law;
- a TrustStack target is never labelled the law;
- the next step is one of its allowed pages;
- no must-not-say line appears, nor any of the seven lines no answer ever says;
- "counsel to confirm" is set where the law is unclear.

**R1 is the live smoke's own answer**, with its s.8(10) labelled a TrustStack default.
`checkReferenceAnswer` fails it as given ("s.8(10) is the law but is labelled
truststack_default") and passes it after the **server rule** has relabelled it. The rule
lives in `evaluateAnswer`: an entry citing the Act or the Rules is "the law" unless its
point names a TrustStack target. Only that direction is relabelled (D-127.2). The prompt
(`2026-10-20.1b`) also says so, and asks for a one-sentence headline (D-127.3).

**In CI** each recorded answer runs through `evaluateAnswer` then the case's check
(`tests/unit/ai-reference-set.test.ts`, 24 tests). **By hand,** `node
tools/ai_reference_run.mjs` asks the live model each case on MU's seed.

## 7. The reference set against the live model (by hand, local stack, fictional data)

`docs/testing/slice11-1b/reference_run_live.md` has both runs, with the twenty headlines.

| Run | Result | What it found |
|---|---|---|
| **1** | **14 of 20** | **The wording guardrail refused correct answers.** The Evidence and Gap helpers' own disclaimers ("a reviewer, not this assistant, decides **whether the evidence is accepted**", "the action can be closed **once that evidence is accepted**") matched 1a's `approves_evidence` / `closes_gap` rules. That happened in 7 of 8 repeat calls, so those helpers were close to unusable live. Three headlines ran to 31–34 words. One of Claude's must-not-say lines was too broad. |
| **2** (after D-127.15–16) | **20 of 20** | No refusal. Every headline one sentence. One citation that is not a provision was dropped and flagged. Statute and TrustStack targets were labelled right, and "counsel to confirm" was set where facts decide. About **$1.02** and 268 s for twenty calls (9–19 s each). |

**Why CI did not catch run 1:** CI runs the RECORDED answers, which Claude wrote without
those conditional phrasings. The live run is the only test of how the real model words
things, which is why §4.13 asks for it before every release. Run 1's phrasings are now
unit tests of the wording check.

## 8. What did not change

- The gateway's order (§5a), the guardrails (refusal, injection, black box, other tenant,
  citations; wording except D-127.15's narrowing, call 12), 1a's migration (frozen), the key gate (`ANTHROPIC_API_KEY` read by
  `lib/ai/claude.ts` alone; `check:secrets` green), the kill switch default (off unless
  `AI_ENABLED=true`), and the limits.
- No permission and no role.
- No score, evidence verdict, gap or action write path. The assistant still writes nothing
  but its own draft row, and now a person's rating of it.
- Exposure model 1.7.0, the reports, the registers, the public pages.
- 1a's Question Helper answers and e2e are as they were. The one exception is its
  "accepted evidence" count, a bug fixed in D-127.13, which changes no test outcome.
- **Client-hosted (proposed Slice 15):** nothing hosted-only was added. The panel calls the
  app's own API; the provider is still config-driven (§4.14); no font CDN or external call
  from the browser.

## 9. Claude's calls — confirm or change

Each with a DPDP-consultant verdict. Citations were checked in `docs/legal/` with
`pdftotext`. Statute is kept apart from TrustStack's own choices. Nothing here is counsel's
view.

1. **A calm progress state, not streaming** (D-127.1). *Verdict: confirm.* §4.3 forbids a
   half-answer, and the wording and citation checks run on the whole answer. Streaming
   would show text that may then be refused. *Risk if wrong:* 15–25 s feels slow. The
   message explains why, and Stage 2b can revisit it with measured times.
2. **The label rule goes one way: to "the law"** (D-127.2). *Verdict: confirm.* s.8(10)
   ("shall establish an effective mechanism to redress the grievances") is statute;
   labelling it TrustStack's undersells a duty. The reverse is ambiguous: Rule 8(2)'s
   "forty-eight hours" notice and Rule 13(1)'s "once in every period of twelve months" are
   law, so an automatic relabel to "TrustStack default" would be wrong. That direction is
   caught by §4.11's wording check and by the reference set. *Risk:* a TrustStack target
   labelled the law in a point that names no statute word passes the server. The reference
   set fails it, and the panel shows the label for a person to see.
3. **The Evidence Helper says WHETHER evidence held the claim down, never by how much or
   at what level** (D-127.4). *Verdict: confirm.* The answer panel already shows the
   person the level and the cap sentence. Keeping the levels out of the prompt keeps the
   cap table out of anything the model could repeat (§4.5, D-071). *Risk:* a vaguer
   answer. The Score Helper gives "by how many points" at domain level from the stored
   score.
4. **The Score Helper sends a percentage of the domain's points, never its weight**
   (D-127.6). *Verdict: confirm.* §4.5 lists "a weight" among the bank's internals. The
   percentage is what the person needs to understand "why", and it cannot be turned back
   into the weight without the score, which is not sent. *Risk:* none to the law; it is
   TrustStack's own method.
5. **Only an assessment action can be explained on the Actions page** (D-127.5).
   *Verdict: confirm.* A ROPA, breach (Rule 7), rights or retention action carries
   register data that is personal data or a legal draft. Those need their own allow-lists,
   which Stage 2a builds for drafting. *Risk:* an uneven feel on the Actions page;
   recorded for 2a.
6. **Feedback is a column set, rated once by the asker, and still allowed after the
   assistant is turned off** (D-127.7). *Verdict: confirm.* A rating sends nothing to the
   provider (s.8(2) is not engaged). Rule 6(1)(c)'s logging is met by `ai.feedback`. The
   comment is free text, so it is scrubbed and kept out of the audit (§4.10). *Risk:*
   someone types personal data the scrub misses (a name). The panel warns against it, and
   the comment stays in the tenant's own RLS-protected row.
7. **The button is hidden, not shown disabled, when the assistant cannot answer**
   (D-127.8). *Verdict: confirm.* §7a.5 asks for it to be hidden. A disabled button on
   every question would add 124 dead controls. The reason is in Organisation settings for
   anyone who looks. *Risk:* a person wonders where it went; the settings tab says.
8. **"Turned on by" is shown by name to every member** (D-127.9). *Verdict: confirm.* It
   is a co-member's name, which members can already read (D-114), shown for
   accountability. A2 asks that who and when be stamped. *Risk:* none new.
9. **The reference set's recorded answers are hand-written except R1** (D-127.11).
   *Verdict: confirm with your review.* They show what a good answer looks like: the law
   in plain words, with the TrustStack targets marked. They were written by Claude for
   Anix. **Please read R1–R20 as the DPDP expert** (§4.13: "reviewed by a DPDP expert
   (Aniket) and later counsel"). *Risk:* a recorded answer that misstates the law would
   train the checks wrongly. Each citation was checked against the corpus by CI.
10. **Every scored scorecard row has "Why this score?"** (D-127.14). *Verdict: confirm.*
    The question is per domain, and a person scanning the scorecard asks it of the row in
    front of them. *Risk:* sixteen small buttons look busy (UX_REVIEW U45 R9 🟡 below).
12. **A 1a guardrail narrowed: a condition is not a claim** (D-127.15). *Verdict: confirm.*
    The live model's correct disclaimers ("a reviewer decides whether the evidence is
    accepted") were refused as if they approved evidence, which left the Evidence and Gap
    helpers mostly refusing. The exemption is the one 1a already uses for "compliant"
    (D-125.3), bounded by the clause: a comma ends it. **What is still refused:** "The
    evidence is accepted, so nothing more is needed", "Once uploaded, the evidence is
    accepted", "The gap has been closed", "I have approved…", "I have closed…". Each of
    these is a unit test, as is each phrase from run 1. *Risk if wrong:* a claim phrased
    as "until the evidence is accepted, you are ready" slips through. The reference set
    and the review note ("a person must review it") stand behind it, and **§7a.7 said the
    guardrails must not change, so this needs your explicit yes**.
13. **The headline asks for twenty-five words; the check allows thirty** (D-127.3, D-127.16).
    *Verdict: confirm.* A target below the limit absorbs the model's variance. *Risk:* none
    to the law.
14. **The 1a bug fix** (D-127.13). *Verdict: confirm.* The Question Helper always told the
    model "0 accepted". Counting Adequate or Strong is core's own rule for accepted
    evidence (D-056).

## 10. Evidence

- **Gates, local, on the clean seed** (`--workers=1`, production build):
  - typecheck;
  - core **1,383** (+20);
  - web unit **807** (+106);
  - RLS **565** (+4);
  - **24** CI SQL gates, all green ("The AI assistant is off unless…" extended: tasks and
    their read permissions, the rating-only update grant, the asker-only policy, seven
    triggers);
  - `check:secrets`;
  - `gen_db_types --check`;
  - e2e **451 / 451**: +13 from `e2e/api/ai-helpers.spec.ts` (10), `e2e/ui/ai-panel.spec.ts`
    (2) and the sweep's new probe. Two UI tests failed in the full run and passed alone on
    the same build: `evidence.spec.ts:144` and `intake.spec.ts:49` ("Sign in to
    continue.", the known local sign-in flake).
  - CI: the draft PR's checks.
- **The suites:**
  - core: `ai-guardrails.test.ts` (the target rule) and `ai-reference-set.test.ts`;
  - web unit: `ai-context-helpers.test.ts`, `ai-reference-set.test.ts`,
    `ai-context.test.ts` (one fixture), `paging-guard.test.ts` (the panel's bounded lists);
  - `tests/rls/ai.test.ts` §7–§8;
  - e2e: `ai-helpers.spec.ts`, `ui/ai-panel.spec.ts` and the sweep.
- **Live reference run** (by hand, local stack, fictional data): run 1 14 / 20, run 2
  **20 / 20** — `docs/testing/slice11-1b/reference_run_live.md`.
- **Manual test walked by Claude first:** Part A (`node tools/ai_manual_test_1b.mjs`),
  21 / 21 on the fake. Part B was covered by `e2e/ui/ai-panel.spec.ts` and the screenshot
  run.
- **Screenshots:** `docs/testing/slice11-1b/before/` (8) and `…/after/` (36), `.webp`,
  laptop and phone, taken with `tools/ui_shots.mjs` (now with `ONLY=`) and
  `tools/ai_panel_shots.mjs`.
- **Simplicity:** `docs/UX_REVIEW.md` U45 (the panel) and U46 (the AI settings tab).
