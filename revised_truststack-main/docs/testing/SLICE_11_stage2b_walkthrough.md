# Slice 11 · Stage 2b — walk-through: a notice, its translation, a report's narrative

> **✅ Approved 2026-10-22 — "Stage 2b approved, including call 11" (D-136).** Call 11 built in the
> close (`742b4ec`). Kept as the record of what was approved; the next slice is SLICE_12.

Built on `slice/11-ai-assistant` (draft PR #41, CI only), on top of Stages 1a, 1b and 2a (approved,
D-126, D-128, D-131). Opened by **"Start Slice 11 Stage 2b"**. Before any code, §7c's three calls went
to Aniket, and he chose the recommendation on all three (**D-133**):

- (i) a narrated report is **version N's stored figures with the narrative in front**, printed as a
  NEW version; every number in it must be one the report states;
- (ii) translation offers **Hindi and Marathi only**, keeping every purpose's key;
- (iii) a notice is drafted from the records that rely on **consent or whose basis is not yet
  decided** — never an s.7 legitimate use; the withdrawal and Board wording stay TrustStack's.

The calls this stage made beyond those are **D-134** (§9 below).

**What changed in the data, the law and who may do what.**

- **One migration**, `20261023000000_ai_notice_narrative`:
  - three drafting tasks join the seven (notice, translation → `consent.read` / `consent.write`;
    narrative → `report.read` / `report.generate`);
  - the Exposure Brief, the Programme Status Report and the evidence pack **keep the document they
    printed** (`reports.document`), written once as the report finishes, never again;
  - a fourth report function, `begin_narrated_report`, makes version N+1 from version N;
  - `complete_report` refuses a narrated version whose figures are not version N's.
- **No permission was added.** No register's write path changed: a notice is saved and published
  through the notice editor's own routes; a report stays immutable.
- **The live site is untouched.** All four Slice 11 migrations stay local until the slice's PR; the
  live site's `AI_ENABLED` stays unset until A1 (§6).

## What you are approving

1. **"Draft a notice from the processing register"** on Notice and consent. It reads only the
   records that rely on consent or are undecided (s.5(1)); a person checks it in the notice editor,
   then saves and publishes it there. TrustStack's fixed withdrawal and Board wording, the forms' links
   and the contact are printed on every notice as before — never drafted.
2. **"Translate into Hindi / Marathi"** on a published notice. The words change; every purpose's key
   stays (a consent is recorded under it). Accepting pre-fills a new notice in that language.
3. **"Draft a narrative"** on a stored Exposure Brief, Programme Status Report or evidence pack, then
   **"Print the narrated version"**: a NEW version, the same figures, the narrative in front. Never
   automatic; the version it was drafted from is never touched.
4. **Ten more reference cases** (D11–D20), **10 of 10 on the real model** (§6).
5. Claude's calls in §9.

## 1. Before and after

`docs/testing/slice11-2b/before/` (the assistant off — the pages exactly as Stage 2a left them) and
`after/` (on), laptop and phone, `.webp`:

| Surface | Before | After |
|---|---|---|
| U33 Notice and consent | "Write a new version" | + "Draft a notice from the processing register" |
| U34 a published notice | "Start a new version from this one" | + "Translate into Hindi" · "Translate into Marathi" |
| U34 a new notice | blank, or from a version | + pre-filled from an accepted draft, under a blue notice ("A legal draft: check every purpose with counsel…") |
| U47 drafting panel | record · intimation · letter | + notice (purposes editable, the fixed texts shown as "Always printed by TrustStack… not drafted"), translation (keys read-only), narrative (headline · paragraphs · points) |
| U20 reports, Stored | Download · New version | + "Draft a narrative" on a finished brief, status report or pack; then "Print the narrated version"; a narrated row says "With narrative · figures of vN" |

Console errors during the shots: see `after/console-errors.json` and `before/console-errors.json`.

## 2. What is enforced, and where

| Rule | Where (database first) |
|---|---|
| Notice/translation decided with `consent.write`; narrative with `report.generate` | `app.ai_task_write_permission()` + 2a's guard; RLS test §9b |
| A narratable report keeps its document, written once | `complete_report` (refuses none / the wrong kind / a document on any other kind); `app.report_is_immutable()` (the document joins the finish step only) |
| Version N+1 prints version N's figures | `begin_narrated_report` (same snapshot, assessment, date; version N ready, not narrated, with a document; an ACCEPTED narrative about version N; once) and `complete_report` (sections = one in front + version N's; caveats and notes equal) |
| Every number in a narrative is the report's own | `lib/ai/drafts.ts` (the model's draft) and `lib/ai/routes.ts` (the person's edit) — core `numbersNotInDocument` |
| A translation keeps every key | `lib/ai/drafts.ts` (model) and `lib/ai/routes.ts` (person) — core `translationKeyProblems` |
| Only consent-based records feed a notice | `lib/ai/tasks/notice-draft.ts` `noticeSourceRecords` — core `isNoticeSource` |
| CI | the AI gate "Stages 1a–2b" (ten tasks, their read and write permissions); the report gate (three narratable kinds, four functions, the immutability rule, no anon) |

## 3. What each draft sends — and never sends (§4.5, §4.6, A3)

| Draft | Sends | Never sends |
|---|---|---|
| Notice | per consent-or-undecided record: name, purpose, kinds of data, whose data (kinds of people), basis, children yes/no; the published notice's keys and titles | any s.7 or s.17 record, an owner, an approver, a system's or vendor's details, counts of people, the contact |
| Translation | the published notice's title, introduction, purposes; the keys in their own block | who published or created it, when |
| Narrative | the stored document's sections before the appendices, tables to twelve rows; every member's name → "[a member]" | who generated it, an appendix, the owner's pack, the live registers |

All free text is scrubbed and sent as untrusted data; instruction-like text is flagged
(`tests/unit/ai-context-2b.test.ts`, planted names, emails, phones, ids).

## 4. The output, and the server's part (§4.3)

- Every 2b draft is a **legal draft** (`legalReviewRequired`, the counsel note); the server sets it.
- A **notice** draft has a title, an introduction and purposes — never a status, never the "other
  means" fields (D-134.1); its purposes must be publishable in shape.
- A **translation**'s language is the one asked for; its keys are the source's (D-134.3).
- A **narrative** has a headline, one to four paragraphs and up to eight points; at least one provision.

## 5. The reference set — `2026-10-22.2b`: 20 explain + 20 drafting cases

New: D11–D14 notice (only consent purposes — MU's payroll, s.7(i), must not appear; the fixed texts
never rewritten; no person or contact; Rule 3's order), D15–D17 translation (keys kept even when asked
to translate them; Hindi in Devanagari; Marathi), D18–D20 narrative (no number the report lacks; never
"compliant"; a TrustStack target never as the law). CI runs every recorded answer through the server's
guardrails and the case's checks (`tests/unit/ai-reference-set.test.ts`, 52 tests), plus six tests that
the server refuses a renamed key, a dropped purpose, an invented figure, "compliant", a bad purpose and
a fixed-text field.

## 6. The live model (by hand, local stack, fictional data) — `slice11-2b/reference_run_live.md`

`claude-opus-5-5`, the local Mumbai University on a clean seed. Run 1: 8 of 10 (D19 sent no
provision; D20 refused by the statute-target rule). After the prompt fix and `law.minItems` on the
narrative schema (D-134.9): **final run 10 of 10**. D19 and D20 end in a `wording` refusal — nothing
kept, which their cases allow (their asks are the forbidden statements).

**What the model wrote — read as the DPDP expert, not only by the checker:**

- **Notice (D11):** payroll is left out. But **nine of MU's ten seeded records have no lawful basis
  decided**, so all nine became consent purposes (eleven). The model said so itself: counsel must
  decide which rely on consent — "for example if the University acts as a State instrumentality"
  (s.7(b)–(c)). Call 2.
- **Translation (D16):** faithful Hindi, keys untouched, the introduction kept its mention of rights
  and complaints (as the English source does).
- **Narrative (D18):** every figure is the report's own (123 unanswered questions, ₹700 crore, 203
  days to 13 May 2027); ceilings are "the maximums the Schedule … allows … not a predicted fine", only
  the Board decides a penalty (s.33). "Four of the four penalty heads" — a number in words, which the
  check does not read. Call 3.

## 7. What did not change

The explain helpers and 2a's drafting tasks as approved (D-128, D-131) — their schemas, prompts and
checks; the gateway's order; the guardrails incl. call 15's Option A; the rating and decision rules;
every register's write path; the black box (D-071); exposure model 1.7.0; reports' immutability (only
the finish step may now also write the document); no new permission.

## 8. Client-hosted deployment (proposed Slice 15)

Nothing hosted-only: the narrated version renders with the same PDF engine, the document is stored in
the same Postgres, the fake runs offline. A client-hosted install needs nothing new for 2b.

## 9. Claude's calls — confirm or change

| # | Call | Recommendation |
|---|---|---|
| 1 | **The notice draft has no "other means" fields** (D-134.1): the model drafts title, introduction and purposes; withdrawal and Board wording stay TrustStack's fixed texts; the contact and forms are printed by TrustStack; the person may add other means in the editor | **Keep** (D-133.3 exactly; Rule 3(c) is met by the fixed texts and links) |
| 2 | **Undecided records are drafted as consent purposes** (D-133.3), so MU's eleven-purpose draft. Alternative: draft only `consent` records, and list the undecided ones in "What the assistant did not know" | **Keep**, as approved: the draft says counsel must decide each, and a notice that omits a consent purpose is the worse error (s.5(1)). Deciding MU's bases in the register is the fix, not the drafter |
| 3 | **The number check is a set check** (D-134.4): it refuses a figure the report never states, not a true figure misused, nor a number in words | **Keep** for 2b; the narrative is read by a person before it is printed, and the notice on the narrated page says what it is |
| 4 | **Wording rules are English** (D-134.10): a Hindi or Marathi translation is checked for keys, shape, citations and other tenants, not for "compliant" in Hindi/Marathi | **Keep**, with a reviewer who reads the language and counsel (the panel and the editor say so); add Hindi/Marathi wording rules once a native-speaker reviewer has written them (Slice 13) |
| 5 | **D20 passes on a `wording` refusal**, like D7 and D19 (D-134.9) | **Keep** — the ask is the forbidden statement |
| 6 | **The narrative prompt and schema** (D-134.9): asks for at least one provision; `law.minItems: 1` on the narrative's structured output only | **Keep** |
| 7 | **The narrated page's notice line and header** (D-134.7): "Drafted with the TrustStack AI assistant and accepted by … It reads the figures below, which are this report's own as recorded in version N. It does not assess or certify the organisation's position under the Act."; header "Figures: As recorded in version N" | **Keep** |
| 8 | **A version from before Stage 2b cannot be narrated** (D-134.6): it kept no document | **Keep** — generate a new version first; nothing is re-computed into an old one |
| 9 | **Printing needs `report.generate` only** (D-134.8): no new snapshot, so not `score.calculate` | **Keep** |
| 10 | **Your review of the reference set** — R1–R20, D1–D20 — as the DPDP expert, before the slice closes (D-128.3) | **Do it now**: `packages/core/src/ai-reference-set.ts`; the live answers in `slice11-1b/`, `slice11-2a/`, `slice11-2b/` |
| 11 | **"thirty-day" is not recognised as a TrustStack target** (found in your Part C, D20): 1b's relabel rule (D-126.3) knows "thirty days" but not "thirty-day" / "30-day", so a point saying "TrustStack's own thirty-day target" was badged "The law". Its words are right; the badge is not | **Fix in the slice's close**: widen core's TrustStack-target pattern to the hyphenated forms ("30-day", "thirty-day", "12-hour", "48-hour"), with tests; a guardrail change, so it needs your yes |

## 10. Evidence

| Gate | Result (local, clean seed, `AI_PROVIDER=fake`) |
|---|---|
| core unit | **1,401** (1,391 after 2a) |
| web unit | **895** (864) |
| RLS | **581** (574) |
| CI SQL gates | **24 of 24** |
| e2e (one worker, production build) | **485** — 470 in the full run; the 15 others (four UI tests failing under load — `breaches.spec.ts:67`, `dashboard.spec.ts:196`, `scoring.spec.ts:91`, `tenancy.spec.ts:12` — and 11 skipped behind them) all passed with their files. The 15 new tests and the affected suites (route sweep, every AI spec, reports, consent: 224) passed first time |
| Manual test Part A (Claude's walk) | **39 / 39** |
| typecheck · `check:secrets` · `db:types --check` | clean |
| Live reference run | D11–D20 **10 / 10** (`claude-opus-5-5`); your Part C: 7 / 10, then **10 / 10** after D-135's two fixes |
| web unit after D-135 | **897** |

## 11. After approval — closing the slice (§7c.8)

1. The Sync Step: STATE, DECISIONS, **promote `SLICE_12_reassessment.md` from its stub**, UX_REVIEW.
2. CI green on the branch; PR #41 out of draft; your approval; merge.
3. After the production deploy: the four Slice 11 migrations on hosted, in order
   (`20261020000000_ai_gateway`, `20261021000000_ai_explain_helpers`,
   `20261022000000_ai_register_drafts`, `20261023000000_ai_notice_narrative`), then
   `gen_db_types --check` against hosted. **`AI_ENABLED` stays unset on the live site until A1.**
