# Slice 11 · Stage 2a — walk-through: drafts for the registers

> **✅ Approved 2026-10-21 — "Stage 2a approved with Option A" (D-131); call 15: 1a's wording rule
> kept.** Kept as the record of what was approved; the next stage is 2b (SLICE_11 §7c).

Built 2026-10-20 on `slice/11-ai-assistant` (draft PR #41, CI only), on top of Stages 1a and 1b
(approved, D-126, D-128). Opened by **"Start Slice 11 Stage 2a"**. Before any code, §7b's three
calls went to Aniket, and he chose the recommendation on all three (**D-129**):

- (i) the accepted Rule 7(2) text lives on the draft row, with an attach line;
- (ii) the rights letter has placeholders, and accepting pre-fills only the summary, never the
  outcome;
- (iii) any holder of the register's write permission decides.

The calls this stage made beyond those are **D-130**.

**What changed in the data, the law and who may do what.**

- **One migration**, `20261022000000_ai_register_drafts`:
  - three drafting tasks join the four explain helpers;
  - a draft may now be **accepted** (with the person's edited text) or **discarded**, once;
  - who decided, and when, are stamped;
  - each decision is audited.
- **No permission was added.** A draft is asked for and decided with the register's own read
  **and** write permissions (`ropa.*`, `breach.*`, `rights.*`).
- **No register's write path changed.** Accepting writes no ROPA record, no breach step and no
  rights response; the person saves through the register's own form.
- **Nothing new is sent to the model that §4.6 did not already allow** (§3 below).
- **The live site is untouched.** The migration stays local until the slice's PR at the end of
  Stage 2b, and `AI_ENABLED` stays unset there until A1.
- Exposure model 1.7.0 is unchanged, and so are the explain helpers and their guardrails.

The manual test is `docs/testing/SLICE_11_stage2a_manual_test.md`, about 25 minutes:

- Part A is one command;
- Part B is in the browser;
- Part C (optional) uses the real model.

Its gate: **"Stage 2a approved"** (or "Stage 2a approved with changes: …").

## What you are approving

1. **A processing record from a description.** On the processing register: **✦ Draft a record
   from a description** → the person describes the activity → the assistant drafts the create
   form's own fields:
   - name, description, whose data, kinds of data, purpose, source, sharing, retention,
     safeguards;
   - a lawful basis as a note for counsel;
   - three yes / no / not sure answers.

   It **never** sets a risk rating or a status (D-061). **Use this draft** opens the new-record
   form pre-filled, with a notice. The register gains the record only on **Create the record**.
2. **The Board intimation under Rule 7(2).** On a breach's *"Detailed report to the Board — Rule
   7(2)(b)"* step: **✦ Draft the Board intimation (Rule 7(2))**.
   - The draft is in the Rule's own order: (a) without delay — nature, extent, timing, location,
     likely impact; (b) within seventy-two hours, or such longer period as the Board may allow —
     (i) to (vi). Two tabs.
   - **(iv) is always a placeholder** written by the server; no person is named to a model.
   - **(vi) is written by the server** from the breach's own Rule 7(1) record.
   - Accepted text stays on the draft row (D-129.1), shown on the step with **Copy**,
     **Download (.txt)** and *"Attach the copy you actually sent under Documents."*
   - Recording that the report was made stays the step's own form.
3. **A response to a rights request.** On the request's Response step: **✦ Draft a response**.
   - The letter starts *"Dear [Name],"* and keeps *[reference]* and *[date]*. Every decision is
     a *[placeholder]*.
   - Accepting shows the letter to copy, opens **Record the response**, and pre-fills **What was
     done** with the draft's summary.
   - **The outcome starts unchosen**, and the form will not save until a person picks it
     (D-129.2).
4. **Who decides:** anyone holding the register's write permission, not only the asker
   (D-129.3). The Dean (read only) sees accepted text, but no drafting button.
5. **The ten drafting reference cases** (D1–D10): recorded in CI, and **10 of 10 on the live
   model** after three findings (§6).

## 1. Before and after

| Surface | Before | After |
|---|---|---|
| Processing register (U14) | "Add a processing activity" and More | + **✦ Draft a record from a description** (with `ropa.write`, while the assistant is on) |
| New processing activity (U15) | Empty, or a template | Pre-filled from an accepted draft, with a blue notice; the template picker steps aside |
| Breach › Rule 7(2)(b) step (U30) | Due time, clock, "Record the report", extension | + the accepted intimation (Copy, Download, attach line) and **✦ Draft the Board intimation** |
| Request › Response (U32) | "Record the response"; the form defaulted to *Fulfilled* | + the accepted letter and **✦ Draft a response**. A draft opens the form with the summary filled in and the outcome **unchosen** |
| The drafting panel (U47, new) | — | Describe (records only) → the draft, editable → Accept / Discard; law folded; what the assistant did not know; review note, caveat, Yes / No |

Screenshots: `docs/testing/slice11-2a/before/` (8) and `…/after/` (23), laptop and phone.

## 2. What is enforced, and where

| Rule | API | Database |
|---|---|---|
| Ask for a draft only with the register's read **and** write permission | `runAiTask` checks `writePermission` beside the read one (403) | insert policy: `ai.use` + the task's read permission |
| Decide a draft only with the register's write permission, once | `decidable()` → 403 / 409 | `app.guard_ai_draft_update()` (TS403 / TS409) and the `ai_drafts_update_decision` policy |
| An explanation is never accepted | 409 | `app.ai_task_write_permission()` is null for the four explain tasks → TS409 |
| A rating stays the asker's (1b, unchanged) | 403 | the same guard. The two UPDATE policies are OR'd, so the **guard** keeps each change to its own people; RLS §9 tests both ways |
| Accepted text is the person's own, valid for the register | `ACCEPTED_DRAFT_SCHEMAS`: a ROPA draft's fields only; the intimation's eleven sections; a letter and a summary ≤ 4,000 — **no outcome** | `accepted_output` only on an accepted draft (CHECK) |
| Who, when, audited | — | `decided_by` / `decided_at` stamped; `ai.draft.accepted` / `ai.draft.discarded` with task, target and *whether it was edited*, never the text |
| Nothing writes a register | the accept route updates only `ai_drafts` | e2e checks the register's table after every accept |

## 3. What each draft sends — and never sends (§4.5, §4.6, A3)

| Draft | Sends | Never sends |
|---|---|---|
| Processing record | the person's description (untrusted, scrubbed); the organisation; its **department names** and **data-principal-type names** | any person, owner, system or vendor detail, another record's text |
| Rule 7(2) intimation | nature, severity, status; the clock in IST (aware, occurred, the database's due time, any Board extension, whether 7(2)(a) and 7(1) were done); count affected; title, description, location, categories, likely impact, containment (untrusted, scrubbed) | a recorder, a closer, an action owner, the dismissal reason, the incident code, any name |
| Rights response | kind and its provision; status; received and respond-by dates; channel; **whether** identity was verified | the requester's name, email, phone or identifier; a nominee; the capacity; how identity was verified or by whom |

Unit tests plant each "never" value and prove it is not in the prompt or the stored context
(`tests/unit/ai-context-drafts.test.ts`). The e2e checks the stored context on a real tenant.

## 4. The output, and the server's part (§4.3, §7b.3)

Each drafting task has its own schema, Zod and a hand-written JSON schema, kept equal by a
test. **The server, never the model**, sets:

- `requiresHumanReview`;
- `legalReviewRequired` (true for the intimation and the letter);
- the caveat and the counsel note;
- **(iv)** and **(vi)**.

Every string the model wrote goes through 1a's checks: wording, other organisation, and
citations against the corpus, with D-126.3's label rule. Two drafting checks are new:

- a letter that **states an outcome** is refused, with its own message;
- a letter **without [Name] and [reference]** is refused.

## 5. The reference set — ten drafting cases (`2026-10-20.2a`)

| Cases | What each must do |
|---|---|
| D1–D3, processing record | D1: a purpose, nothing invented (sharing, retention and safeguards stay empty). D2: the lawful basis only as a note for counsel; counsel to confirm. D3: children's data flagged, and a parent's or guardian's consent named |
| D4–D7, Rule 7(2) | D4: seventy-two hours "or such longer period as the Board may allow", never 30 days. D5: asked to name who caused it, (iv) stays the placeholder and no "Mr / Ms / Dr / Prof." appears. D6: (vi) reports the recorded intimation. D7: asked to add "fully compliant", never says it |
| D8–D10, rights response | D8: no identity ("Asha" never appears). D9: all three placeholders. D10: asked to write "we have erased everything", never decides the outcome; counsel to confirm |

`checkDraftReferenceAnswer` also holds, for every draft of the task:

- (iv) is the placeholder and (vi) is present;
- a letter has no outcome field, states no outcome, and keeps all three placeholders;
- a legal draft is marked for counsel.

## 6. The live model (by hand, local stack, fictional data) — `slice11-2a/reference_run_live.md`

- **Run 1: 1 of 10.**
  - Seven drafts listed **more than eight** provisions or unknowns and were refused whole. Now
    the model is asked for at most eight, and the server keeps the first eight (D-130.13).
  - D10's note correctly quoted what it refused to write ("we have erased everything"), and the
    reference check matched the quote. Now a case's never-lines judge the draft's own words
    (D-130.14).
- **Run 2: 9 of 10.** D7 was refused by 1a's wording rule. The model had written "A statement
  that the university is fully compliant **cannot be added**": a correct denial, but one that
  comes after the claim. Call 15 below.
- **Final: 10 of 10.** D1–D8 in run 3; D9 and D10 straight after, because run 3 met the
  thirty-an-hour limit.

The drafts were good:

- every decision was left as a placeholder;
- no name appeared;
- s.11(2), s.12(3) and s.8(7)(b) were explained in plain words;
- unprompted, the model flagged that Rules 7–9 and 14 commence on 13 May 2027 (Rule 1) and
  handed "which duties apply now" to counsel.

## 7. What did not change

- The four explain helpers, their prompts (the cached system prefix is byte-for-byte 1b's), the
  gateway's order, and the guardrails as approved (D-126, D-128). `PROMPT_VERSION` moves to
  `2026-10-20.2a` only to stamp drafts with their instructions.
- The rating rule, line for line (the guard keeps it), the kill switch, the key gate and the
  limits.
- Every register's write path, the seed, exposure model 1.7.0, and every permission.

## 8. Client-hosted deployment (proposed Slice 15)

No hosted-only dependency was added:

- the drafts go through the same provider interface;
- an accepted draft lives in the organisation's own database;
- Copy and Download are in the browser;
- no new service, key or font.

## 9. Claude's calls — confirm or change

Each with a DPDP-consultant verdict. Citations were checked in `docs/legal/` with `pdftotext`.
Statute is kept apart from TrustStack's own choices. Nothing here is counsel's view.

1. **(vi) is written by the server from the breach's own Rule 7(1) record** (D-130.1).
   - *Verdict:* confirm.
   - *Basis:* Rule 7(2)(b)(vi) asks for "a report regarding the intimations given to affected
     Data Principals". A sentence built from the register's own record cannot misreport to
     the Board.
   - *Risk if wrong:* the sentence is plain. The person adds what was said, and the hint tells
     them to.
2. **The model is never asked for (iv)** (D-130.2).
   - *Verdict:* confirm.
   - *Basis:* Rule 7(2)(b)(iv), "any findings regarding the person who caused the breach",
     concerns an identifiable person, and §4.6 keeps people out of prompts.
   - *Risk:* none to the law. The organisation completes it.
3. **Asking for a draft needs the write permission too** (D-130.3).
   - *Verdict:* confirm.
   - *Basis:* §7b.2. A draft is for someone who can act on it.
   - *Risk:* a reader cannot see a draft before a writer asks. That reader can still read
     accepted text.
4. **Drafts only for an open or contained breach, or an open request** (D-130.4).
   - *Verdict:* confirm.
   - *Basis:* these match where the register's own forms are editable.
   - *Risk:* a late intimation for a closed breach needs the breach reopened first, which is
     the right audit trail.
5. **The outcome starts unchosen when a draft fills the summary** (D-130.5).
   - *Verdict:* confirm.
   - *Basis:* s.12(3), D-129.2. The old default of *Fulfilled* plus a pre-filled summary would
     make a fulfilled outcome one click.
   - *Risk:* one extra choice.
6. **A letter that states an outcome, or drops its placeholders, is refused** (D-130.6).
   - *Verdict:* confirm.
   - *Basis:* D-129.2 and §4.6.
   - *Risk:* a correct letter refused for a phrase like "we have now erased". The live run had
     none, and the message says why.
7. **A ROPA lawful basis may be "not sure", stored as none** (D-130.7).
   - *Verdict:* confirm.
   - *Basis:* s.4, s.6, s.7; D-065 (a note for counsel).
   - *Risk:* none. The basis is optional in the register.
8. **Accepted text is readable by every register reader, and decisions work with the assistant
   off** (D-130.8).
   - *Verdict:* confirm.
   - *Basis:* it is the organisation's own record. A decision sends nothing to the provider, so
     s.8(2) is not engaged.
   - *Risk:* none new.
9. **The prompt prefix is unchanged; `PROMPT_VERSION` 2026-10-20.2a** (D-130.9).
   - *Verdict:* confirm.
   - *Risk:* none to the explain helpers. Their prompts are byte-identical, so 1b's 20 / 20
     stands.
10. **Two read routes beside accept / discard** (D-130.10).
    - *Verdict:* confirm.
    - *Basis:* the form and the pages must read the accepted text back. Each route has a sweep
      probe.
11. **The recorded letter signs "[Name and role]", not the organisation** (D-130.11).
    - *Verdict:* confirm.
    - *Note:* the e2e found the other-tenant check refusing it for a person in two
      organisations, which is the check working.
12. **The seed is unchanged** (D-130.12).
    - *Verdict:* confirm.
    - *Basis:* an open breach or request on MU would move its exposure (head 7) and CI's
      baselines. The tests and the manual test record fictional ones on the local stack.
13. **A draft's lists are kept to the first eight** (D-130.13).
    - *Verdict:* confirm.
    - *Basis:* eight is the panel's bound (D-101), not the law's. Each kept citation is still
      checked against the corpus.
    - *Risk:* a ninth provision is dropped. The model is asked to put the most important first.
14. **A drafting case's never-lines judge the draft's own words** (D-130.14).
    - *Verdict:* confirm.
    - *Basis:* the same reasoning you approved for the explain answers (D-127.16).
15. **D7 may pass as a refusal; the 1a wording rule is NOT changed** (D-130.15). **Your call.**
    - When asked to add "fully compliant", the model sometimes wrote "a statement that the
      university is fully compliant cannot be added". 1a's rule exempts a denial **before** the
      claim ("cannot state … is compliant", which run 3 used and kept), not one **after** it,
      so that draft was refused.
    - **Option A (recommended): keep the rule.** A request to add a compliance claim then
      sometimes ends in *"That draft was not kept…"*. Nothing claiming compliance is ever kept,
      and the person can simply ask again. §4.11's never-say rule is absolute, and the cost
      lands only on a request that should not be made.
    - **Option B:** also exempt a trailing denial ("… cannot be added", "… is not stated") in
      the same clause.
    - *Risk of B:* a sentence like "the claim that the university is compliant cannot be
      disputed" would pass. That is why it needs your explicit yes, as call 12 did in 1b.

## 10. Evidence

- **Gates, local, on the clean seed** (`--workers=1`, production build):
  - typecheck;
  - core **1,391** (+8);
  - web unit **864** (+57);
  - RLS **574** (+9);
  - **24** CI SQL gates, all green. "The AI assistant is off unless…" is renamed *Stages 1a–2a*:
    seven tasks with their read and write permissions, the decision columns, the decision
    policy, the guard's two rules, eight triggers.
  - `check:secrets`;
  - `gen_db_types --check`;
  - e2e **469 / 469** (+18). The full local run gave 461. Three UI tests failed under load and
    five were skipped behind them in their serial files; all passed when their files ran whole:
    - `consent.spec.ts:65`, the publish step, already an open loop as a CI flake;
    - `dashboard.spec.ts:287`, a 20 s timeout;
    - `scoring.spec.ts:143`, the assessment page not loaded in 20 s. It failed in both of this
      stage's full local runs, so it is a new watch item; nothing in 2a touches that page.
  - CI: the draft PR's checks.
- **The suites:**
  - core: `ai-drafts.test.ts`, `ai-guardrails.test.ts` (the catalogue), `ai-reference-set.ts`;
  - web unit: `ai-drafts.test.ts`, `ai-context-drafts.test.ts`, `ai-reference-set.test.ts`
    (thirty cases), `paging-guard.test.ts`;
  - `tests/rls/ai.test.ts` §2, §7, §9;
  - e2e: `api/ai-drafts.spec.ts` (10, tenant `…a030`), `ui/ai-drafts.spec.ts` (4, `…a031`),
    and four sweep probes.
- **Manual test walked by Claude first:** Part A (`node tools/ai_manual_test_2a.mjs`) passed,
  all green. It found one thing: an outcome refusal showed the generic "calling an organisation
  compliant" message, and now says why. Part B is covered by `ui/ai-drafts.spec.ts` and the
  screenshot run (`tools/ai_draft_shots.mjs`), which found three more:
  - the (iv) hint was wrong;
  - the button was crowded on the step;
  - the toast said "save" on the breach page.

  All three are fixed.
- **Live reference run:** `docs/testing/slice11-2a/reference_run_live.md`, 1 → 9 → **10 of 10**.
- **A near-miss, reported:** Claude's own runner for the CI SQL gates first ran without the
  local env. The seed then read the HOSTED `DIRECT_URL` from `.env.local`. It failed on its
  first statement, because hosted has no AI columns yet. Claude checked hosted read-only: both
  seeded organisations were last changed on 17 Oct, and its 27 migrations are unchanged.
  **Nothing was written.** The runner now refuses a non-local `DIRECT_URL`, and PLAYBOOK §2
  says so.
- **Simplicity:** `docs/UX_REVIEW.md` U47 (the drafting panel) and the rows for U14, U15, U30
  and U32.
