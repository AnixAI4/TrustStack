# Slice 10.5 · Batch B4 — walk-through: reports, exposure and emails

Built 2026-10-19 on `slice/10-5-b4-reports`, off `main` (B0–B3 are live), its PR
straight into `main` (D-104.9, D-113), so approving it puts it on the live site
when it merges. Opened by "Start Slice 10.5 Batch B4", from the fix list you
approved with the recommendations (D-104: F4.1–F4.9, **Q1 → exposure model 1.7.0,
built here**, Q2 "Statutory ceilings at stake", Q3 "Not started" in the reports),
the paging additions N3 and N4 (D-107), and B1's note that Exposure's repeated
heading goes with N3 (D-110.10). **This is the last batch of Slice 10.5.**

**One rule changed, on purpose: Q1.** The deadline forecast now counts every open
action, as the Actions page does. That is a model change, so the exposure model
is **1.7.0**, with one migration that replaces three SQL functions (no table,
grant or permission changes). **Nothing about the penalty heads changed**: no
head's status, position, ceiling or leverage moves (D-104.1). Everything else is
wording, layout and paging. No API, permission or seed change. Every
`data-testid` a test used is still there; a few were added (the tabs, the
report guide, the history's model column). The manual test is
`docs/testing/SLICE_10_5_batch4_manual_test.md` (about 25 minutes). Its gate:
**"Batch B4 approved"**.

## What you are approving

1. **Q1, the forecast counts every open action (U19, U21, U22, U24).** Breach,
   rights and retention actions now count in the forecast, "Critical and high
   work" and the Programme Status source table. On Mumbai University: **4 open
   actions, 3 of them critical or high**, where before it said 1 and "Nothing
   outstanding". Exposure model **1.7.0**.
2. **Q2, one name for the headline (U04 strip, U19, every PDF):** "Statutory
   ceilings at stake", from one constant in core.
3. **Exposure in four tabs (U19, N3, N4, F4.1, F4.2):** Where you stand ·
   Penalty heads · What-if · History. The s.37 note is a calm information note,
   no longer a red error. "1 action open", never "1 actions open". The history is
   a paged table that names each snapshot's model. The repeated page heading is
   gone.
4. **The PDFs in plain words (U21–U24, U26–U28, F4.3–F4.6):** "From every
   register."; "The penalty heads this report covers"; head 7's eight "has not been
   answered yet" lines become one "Not yet answered: …"; "Amend the contract to
   carry DPDP clauses, then record it"; "No accepted assessment"; "No change since
   the snapshot of …"; no near-empty page; "Not started" in the scorecards.
5. **The Evidence Index (U25, F4.7):** "The vendor (questionnaire link)" as the
   uploader of a vendor's file; E0–E5 explained on the About sheet; real date
   cells (India's date).
6. **The reports centre in three tabs (U20, F4.8):** PDF reports · Working
   files · Stored, each generating tab led by **"Which report do I need?"**, one
   line per audience.
7. **The emails in the app's navy (U03, F4.9),** and the invitation says in one
   line what accepting asks of the person.

---

## 1. Q1: the forecast counts every open action (model 1.7.0)

**What was wrong.** The model's gap input took two sources only: the
assessment's gaps and the processing register's gaps. Breach, rights and
retention actions hang on their register's record, not on a gap row (D-067), so
the forecast left them out. The Actions page counts all five sources. So on
Mumbai University:

| | Before (1.6.0) | After (1.7.0) |
|---|---|---|
| Exposure page, "Forecast — all work" | Not enough history · "**1 actions open**; 0.1 a week needed" | Not enough history · "**4 actions open**; 0.2 a week needed" |
| Exposure Brief, "Critical and high work finishes" | "**Nothing outstanding**" (3 High actions were open) | "Not enough history", **3** outstanding |
| Programme Status, "Pace and forecast" | Critical and high **0**, all work **1** | Critical and high **3**, all work **4** |
| Programme Status, "Actions outstanding" tile | 4, "Across the assessment and the processing register." | 4, "**From every register.**" |
| Programme Status, source table | Assessment 1 · Processing register 0 (**totals 1**, not 4) | Assessment 1 · Processing register 0 · Breach register 1 · Rights and grievance register 1 · Retention register 1 (**totals 4**) |
| Exposure page and Actions page, open actions | 1 vs 4 | **4 = 4** (an e2e test holds them together) |

**What the model now reads.** A new input, `registerActions`: every action on a
breach, a request or grievance, and a retention schedule. Each carries the
severity and state the Actions page already gives it:

| Source | Severity (as on the Actions page) | Not work owed when |
|---|---|---|
| Breach | the breach's own severity | the breach is dismissed as not a breach |
| Rights | a grievance **high**, any other request **medium** | the request is void (entered in error) |
| Retention | **high** while the schedule is past its end with no erasure that counts for this cycle, else **medium** | — |

Each one still owed counts as **one unit** of outstanding work.

**What did not change.** Penalty-head leverage rules are unchanged (D-104.1). No
head reads the new input: every status, position, ceiling and leverage weight is
the same with or without it. That is tested in core, in SQL (the RLS mirror) and
end to end. "The actions that retire the most exposure" still ranks only gap
actions, because a register action has no head weight of its own. A breach still
counts on head 2 through the breach register's own facts (1.1.0, 1.6.0).

**Where it lives.**
- Core: `ExposureRegisterActionInput` and `registerActions` on `ExposureInput`
  (`exposure.ts`), counted by `outstandingWork` (`intelligence.ts`). The version
  is `"1.7.0"`.
- The app: `readExposureInput` builds them from the registers' own item builders
  (`breachItems`, `rightsItems`, `retentionItems`). Those are the functions the
  Actions page uses, so the two cannot disagree (D-069).
- SQL: migration `20261019000000_exposure_model_1_7_0` replaces
  `app.exposure_model_version()` (now 1.7.0), `app.exposure_input` (adds
  `registerActions`) and `app.exposure_outstanding_work` (counts them). It keeps
  each function's `REVOKE … FROM PUBLIC`. It contains no table, grant or revoke
  change, and `app.exposure_evaluate_head` is not touched.
- CI: the snapshot gate's pin reads `1.7.0/0.4/0.6/60/20270513`. The seed-count
  gate did not move (no seed change).
- Stored snapshots are immutable. Those taken before keep **1.6.0**, and the
  history now shows each one's model.

**The hosted step (after you approve):** merge → wait for Vercel's production
deploy → `pnpm db:migrate` against hosted at once (Claude exports the hosted env
for that one command only) → `node tools/gen_db_types.mjs --check`. In the
minutes between the deploy and the migration, a snapshot taken on the live site
would carry 1.6.0 and the old count. That is harmless, because no live code
compares the TS and SQL versions.

## 2. The headline's name (Q2) and the Exposure page (N3, N4, F4.1, F4.2)

| | Before | After |
|---|---|---|
| Headline tile (overview strip, Exposure, every PDF) | "Statutory ceilings **where you are exposed**" | "**Statutory ceilings at stake**" (core `CEILINGS_AT_STAKE_HEADING`), the figure unchanged |
| Page layout | One long page: heading, tiles, red s.37 box, slippage, five head cards, leverage, what-if, what changed, history, caveats | **Four tabs**: **Where you stand** (tiles, s.37 note, slippage) · **Penalty heads** (the five cards and the two not modelled; badge = heads at stake) · **What-if** (the actions that retire the most exposure, and the what-if) · **History** (what changed, "Record a snapshot now", the history; badge = snapshots). The chosen tab is in the link (`#history`) |
| Page heading | "DPDP Exposure Command Centre" under the top bar's "Exposure" | Gone (D-110.10); the top bar names the page |
| s.37 | A red error box | An **information note** under the tiles, the citation kept, "(s.37)" |
| Forecast tile | "1 actions open" | "**1 action open**" / "4 actions open" (core `actionsOpenLabel`) |
| Head 7's reasons | Eight lines "… has not been answered yet." | One line: "**Not yet answered:** Purpose, lawful basis and data minimisation; Notice management; …" |
| History table | A plain table | A **paged, sortable table** (`<DataTable>`) with an **Exposure model** column; the chart line is the app's navy |
| Caveats | At the bottom | At the bottom, **outside the tabs**: on the page whatever tab is open |

## 3. The reports (F4.3–F4.6)

| Report | Before | After |
|---|---|---|
| Programme Status, Owner Action Pack | "Across the assessment and the processing register." / "From the assessment and the processing register." | "**From every register.**" (the Owner Action Pack already listed retention and breach actions) |
| Gap & Action Tracker (card and About sheet) | "from the assessment and the register" | "from every register" (it lists every register's actions too) |
| Security and Breach · Legal Position · Processor Exposure | Section "Penalty heads 2 and 1" / "3 and 7" / "1 and 7" | "**The penalty heads this report covers**" (the tiles above name them) |
| Every report's head detail, the Exposure Brief's "Main reason" | Eight "… has not been answered yet." lines on head 7 | One "**Not yet answered: …**" line |
| Processor Exposure, "What it needs" | "Record that the contract carries DPDP clauses: …" | "**Amend the contract to carry DPDP clauses, then record it:** the processor acts only on instructions, …" (citations kept) |
| Processor Exposure, tile, count row and assessment column | "Processors never assessed" / "…never assessed" / "Never assessed" | "Processors with **no accepted assessment**" / "…with **no accepted assessment**" / "**No accepted assessment**" (B3's words, D-116.9; the count row was caught in Aniket's manual test, Step 10) |
| Programme Status, "What changed" | "ceilings at stake went from ₹700 crore to ₹700 crore; heads at stake from 4 to 4." | "**No change since the snapshot of** 19 October 2026, 08:55 IST: ceilings at stake ₹700 crore; heads at stake 4." (a partial move: "ceilings at stake unchanged at ₹700 crore; heads at stake from 4 to 3") |
| Programme Status, page 3 | Near-empty: the short register table alone, because the scorecard forced a new page | The scorecard follows the register on page 3, so no page in the middle is near-empty. MU's report is still **4 pages**: its content is about 3.8 pages, so the two caveats and the notes close it on page 4 (call 7) |
| Every scorecard (Programme Status appendix, Security and Breach's head 1 areas) | An unanswered domain "Needs Work" | "**Not started**" (Q3's display rule, core `domainStatusLabel`); the engine still stores `needs_work`, and the score and the workbook oracle are untouched |
| Pace lines | "about 1 actions a week" (possible) | "about 1 action a week" (core `countNoun`) |

## 4. The Evidence Index (F4.7)

| | Before | After |
|---|---|---|
| "Uploaded by" for a file a vendor sent through the questionnaire link | Blank | "**The vendor (questionnaire link)**" |
| "Evidence level" | `E3`, unexplained | `E3` in the cell; the About sheet explains E0 to E5 in the assessment's own words ("E0 — No evidence; E1 — Informal evidence; … E5 — Evidence it is monitored and reviewed. An answer's score is capped by its strongest reviewed file.") |
| "Uploaded on", "Reviewed on" | Text, e.g. `2026-10-01`, the **UTC** date of the timestamp | **Real date cells** shown "1 Oct 2026", so they sort and filter as dates, on **India's** date (a file uploaded at 01:30 IST was a day early before) |
| Values only | Yes | Yes: a date is a value, never a formula; `defuseFormula` still guards every text cell (D-078) |

## 5. The reports centre (F4.8)

| | Before | After |
|---|---|---|
| Layout | One page: ten equal "Generate" cards, then the stored list | **Three tabs**: **PDF reports** · **Working files** · **Stored** (a count badge) |
| Choosing | Read ten cards | "**Which report do I need?**" at the top of each generating tab, one line per audience: "Board, CEO and Executive Sponsor: DPDP Exposure Brief", "DPO and DPDP Programme Owner: Programme Status Report", … |
| After Generate | The new report appeared in the list below | The **Stored** tab opens on it; the toast says "it is in the Stored tab" |
| A role that may not generate (the Dean) | Their own pack's card, then the list | **PDF reports** (their own pack) and **Stored**; no Working files tab |

Every `<Can>` gate and test id is kept; the backend still decides who may
generate or download.

## 6. The emails (F4.9)

| | Before | After |
|---|---|---|
| Colour (invitation, the public form's emails, the vendor's link and code) | The old indigo `#4338ca`, an indigo-50 code box | The app's **navy `#003366`**, the app's pale blue `#eff6ff` code box (written as hex: an email cannot read CSS tokens) |
| Invitation | Who invited you, the role, the link | Adds one line: "**When you accept, you will be asked to choose a password; TrustStack then opens on the DPDP readiness work your role covers.**" |

The s.13(3) line on a grievance receipt (B5, F5.6) is unchanged.

## 7. Paging (N3, N4)

The paging guard (`tests/unit/paging-guard.test.ts`) is lowered in the same
commit. `exposure-history.tsx`'s allowance goes (1 → 0, through `<DataTable>`).
`exposure-command-centre.tsx` keeps 9 for the model's fixed lists, and its
"owed: tabs, N3" words are dropped. The reports centre gets one allowance with
its reason: the guide's fixed lines, one per report kind.

## 8. What did not change

- **No penalty-head rule.** Statuses, positions, ceilings, the s.33(2) factors and
  leverage are the same (D-104.1). The stored snapshots are immutable and keep
  their own model version.
- No API shape, permission, seed, scoring rule or legal position. The readiness
  score, its caps and the workbook oracle (23.9% / 10 / 25.3014 / 52) are
  untouched.
- D-011's caveat and the exposure caveat stay verbatim on every page and report.
  The caveat now names model 1.7.0, because it is built from the version.
- Every statutory citation stays: s.37, s.8(2), s.8(7)(b), Rule 6(1)(f),
  Rule 7, Rule 14(3), the Schedule.

## 9. Claude's calls — confirm or change

Each with a DPDP-consultant verdict. Citations checked in `docs/legal/` (the Act
via `pdftotext -layout`).

1. **A register action counts as one unit while its breach or request stands and
   it is not closed.** A dismissed breach's or a void request's actions are not
   work owed, which is the Actions page's own rule (`isOutstanding`). A breach
   with no action yet adds nothing, as in the tracker. *Verdict: confirm.* It is a
   TrustStack projection of the organisation's own pace, never a statutory
   measure (D-011).
2. **Their severity is the Actions page's.** A breach's own; a grievance high, a
   request medium; an overdue retention schedule high. So "critical and high
   work" counts what that page shows as critical or high. *Verdict: confirm.*
   *Risk if wrong:* none legal. The ranking of work is TrustStack's.
3. **"Overdue" and "No owner" slippage warnings still count only the actions on
   heads at stake (gap actions).** A register action has no head weight, by
   D-104.1, so it cannot be "on a head at stake". The Actions page still shows
   it as overdue or unassigned. *Verdict: confirm.*
4. **The what-if closes only gap actions, as before.** A register action never
   appears in the leverage list the what-if is ticked from. Its "after" forecast
   still counts the register actions that remain open. *Verdict: confirm.*
5. **A difference that remains, on purpose:** the forecast counts the **chosen**
   assessment's gaps, and an open gap with no action as one unit. The Actions
   page counts every assessment's actions and does not count a gap with no
   action. They agree on MU (4 = 4). They can differ for an organisation with an
   older finalised assessment whose actions live on (D-058), or with gaps not
   yet given an action. Q1 was about the three missing sources, so this is
   listed as an open loop, not changed. *Verdict: confirm, or ask for it as a
   later model change.*
6. **The "Not yet answered" fold is applied on the Exposure page's head cards
   and the Board brief's "Main reason" as well as the PDFs' head detail.** The
   page showed the same eight lines (U19). It is display only: the stored
   snapshot keeps the model's reasons word for word. *Verdict: confirm.*
7. **The scorecard appendix no longer forces a new page.** It follows the
   register table when there is room, which removes the near-empty middle page
   (F4.5). The test that pinned "the appendix on its own page" now pins "no
   forced break". On MU the report is still four pages: the last holds only the
   two caveats and the notes, which are kept together and never split. Keeping
   them on one page is deliberate: the caveat is read whole (D-011). *Verdict:
   confirm.* If you would rather the appendix opened its own page again, the
   short page moves back to the middle.
8. **Report scorecard rows carry each domain's question count.** It is an
   internal report input, not an API change, so "Not started" can be decided as
   on the overview (B1) and the assessment (B2). *Verdict: confirm.*
9. **Evidence Index dates are India's dates** (D-055). Before, the cell took the
   UTC date of the timestamp. They show as "d mmm yyyy". **Only the Evidence
   Index** changed (its fix row). The Gap & Action Tracker's due and closed dates
   are still text: say if you want them as date cells too. *Verdict: confirm.*
10. **A vendor's upload is known from `vendor_link_documents`.** That is the
    record the questionnaire link writes, readable by members under RLS. It is
    never inferred from a missing uploader, because a removed member also leaves
    one. *Verdict: confirm.*
11. **The invitation's line is Claude's wording**: "When you accept, you will be
    asked to choose a password; TrustStack then opens on the DPDP readiness work
    your role covers." It is accurate for every role, including read-only ones,
    and promises no task the role cannot do. *Verdict: confirm, or give the words
    you want.*
12. **Generating a report opens the Stored tab.** One next step: the new report,
    with Download. The guide's lines use each report's own audience text.
    *Verdict: confirm.*
13. **The s.37 note is an information note, under the tiles.** The Act: the
    Central Government may direct blocking "upon receipt of a reference in
    writing from the Board that— (a) intimates the imposition of monetary
    penalty … in two or more instances; and (b) advises … the blocking" (s.37(1)).
    The note's words are unchanged. Only its tone changed, because it is a
    consequence to know, not an error the organisation made. *Verdict: confirm.*
14. **"Amend the contract to carry DPDP clauses, then record it."** s.8(2): a Data
    Fiduciary may engage a Data Processor "only under a valid contract". Recording
    is TrustStack's evidence of it, never a substitute. The citations s.8(2),
    s.8(7)(b) and Rule 6(1)(f) are kept. *Verdict: confirm.* Counsel, when
    engaged, may want to word the clause list.
15. **The "before" reports were generated on the local copy's Mumbai University,
    and the database was rebuilt from the seed afterwards.** No live tenant was
    touched. MU is the tenant whose data shows every fix: the register actions,
    head 7's unanswered areas, a vendor's upload. The e2e tests still generate
    only on disposable tenants (pitfall 4). *Verdict: confirm.*

**Client-hosted deployment (proposed Slice 15):** nothing in B4 adds a hosted-only
dependency. No new package, service, font or environment variable. The migration
is plain SQL. The emails' colours are written into the email itself.

## 10. Evidence

- **Gates** (local stack rebuilt to the clean seed on 2026-10-19): core **1,302**
  (+10: Q1's counts and version, the plural helper, the reports' wording, the
  Evidence Index), web unit **595** (+12: `exposure-report-pages.test.ts`, the
  emails, the xlsx date cells; the paging guard lowered for N3 and N4), RLS
  **542** (+1: `app.exposure_input` reads every register action; the mirror's
  generated inputs now carry register actions, and `app.exposure_outstanding_work`
  = `outstandingWork` on them), typecheck, `check:secrets`, `db:types --check`,
  all **23** CI SQL gates (the pin on 1.7.0; the seed count unchanged); full e2e
  **424/425** in one clean full run (one worker, production build); the one failure was the known sign-in flake in `ui/processors.spec.ts`, which B4 does not touch, green alone (3/3). An earlier run caught two bugs in B4's new tests, both fixed and green (21/21 for their two files). **425** tests (+2: Q1 on the Exposure page and through the API). CI is the authority.
- **New or changed e2e:** Exposure's open-action count equals the Actions page's
  (MU), and the forecast tile says "4 actions open"; a breach's action counts in
  the stored and the live forecast (disposable tenant), on 1.7.0, moving no head
  and never ranked; the Programme Status report has "From every register.", all
  five source rows, "Statutory ceilings at stake" and never "from ₹X to ₹X"; the
  Processor Exposure Report's new words; the s.37 note as a status; the tabs on
  Exposure and Reports; the strip's heading; every 1.6.0 expectation moved to
  1.7.0.
- **Screenshots** (`docs/testing/slice10_5-b4/{before,after}/`, `.webp`, laptop and
  phone, the full page): the overview (the strip), Exposure (after: each of the
  four tabs, opened by clicking it), Reports (after: each of the three tabs).
  **The ten reports** before and after, the PDFs as PNG pages and the three
  workbooks, under `…/before/reports/` and `…/after/reports/` (generated on the
  local MU, rebuilt afterwards). **The emails** as HTML and `.webp` under
  `…/{before,after}/emails/`. The "before" emails are the same render with the old
  colours and without the new line, checked against `main`'s templates.
- **Code:** core `words.ts` (new), `exposure.ts` (1.7.0, the input, the heading),
  `intelligence.ts` (outstanding work), `reports.ts` (wording, fold, change
  sentence, scorecard), `workbooks.ts` (date cells, gloss, vendor uploader);
  migration `20261019000000_exposure_model_1_7_0`; the Exposure page, its
  history, the strip, the reports centre, the three email templates, the
  evidence index reader, the exposure reader.
