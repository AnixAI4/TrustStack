# Slice 9 · Stage 2 — the Exposure Command Centre on real data

**For:** Aniket's Stage 2 approval gate (SLICE_09 §12: "the Command Centre on
real data (screenshots)").
**Screenshots:** `docs/testing/slice09-stage2/` — taken from the local stack
on 2026-10-06 with the production build, signed in as real seeded users.
**What is new:** exposure history (stored snapshots, derived in SQL), the
deadline forecast, leverage ("the actions that retire the most exposure"),
the what-if, slippage warnings, "what changed", the Command Centre page
(`/dashboard/exposure`) and an exposure strip at the top of the overview.
The calls Claude had to make are **D-074** — the ones to approve are at the
end of this page.

> Exposure figures are indicative positions within statutory ceilings in the
> Schedule to the DPDP Act 2023, derived from your own assessment, register
> and remediation data under TrustStack exposure model 1.0.0. They are not a
> prediction of any decision of the Data Protection Board, which imposes a
> penalty only after an inquiry finds a breach significant and weighs the
> factors in section 33(2). They are not legal advice.

## 1. Mumbai University (as the Dean) — `mu-command-centre.png`, `mu-overview-strip.png`

The overview now opens with a strip: **₹700 crore** of statutory ceilings
where MU is exposed, **4 of 4** applicable heads at stake, **219 days** to
13 May 2027, "not enough history". It links to the Command Centre.

On the Command Centre:
- **Headline** — ₹700 crore (H1 ₹250 + H2 ₹200 + H3 ₹200 + H7 ₹50), labelled
  "Statutory ceilings, not a predicted fine; penalties are per breach".
  Provisional: MU's assessment is still in progress (123 questions
  unanswered).
- **s.37 flag** — shown because heads are at stake.
- **Slippage** — "Fewer than two of the last eight weeks closed an action";
  "closes about 0 actions a week; 2.5 a week are needed to finish all work
  by 13 May 2027"; "45 actions have no owner on penalty heads that are at
  stake". These are counts of MU's real register actions.
- **Five heads** — H1 Partially mitigated, H2 Not yet assessed, H3 **Exposed**
  (no verifiable parental consent, 8 open gaps; children may be tracked),
  H4 Not applicable (no SDF notification), H7 Partially mitigated. Direct
  evidence is listed first; **root causes are collapsed** (Stage 1's open
  loop: MU's H7 list was 16 lines).
- **Leverage** — ten actions. The top one is the processor contract
  (ROPA-004): it counts against H1 *and* H7, so it outranks the critical
  children's consent actions (H3 only). Each says what closing it alone would
  change — here, nothing by itself, because each head has many open gaps.
- **What-if** — two actions ticked: ceilings ₹700 → ₹700 crore, no head
  moves, 77 → 75 open. Nothing was written (the e2e test counts the rows).
- **What changed** — against the snapshot recorded earlier that day: no movement.
- **History** — one snapshot, chart and table.
- Both caveats verbatim at the foot, and the s.33(2) factors that are not scored.

## 2. A second sector: a healthcare clinic network — `healthcare-command-centre.png`

A disposable tenant (removed after the run): 2.5 lakh Data Principals,
children's data **yes**, guardian data **unknown**, sensitive documents yes,
two register records (one paediatric with no parental consent), register gaps
generated, **three actions closed — one 9 and one 16 days ago** — and one
snapshot recorded. No assessment.

- **Headline** ₹700 crore, 4 of 4: H1 Partially mitigated (no safeguards
  recorded), H2 Not yet assessed, H3 **Exposed** for children's reasons
  ("No verifiable parental consent (1 open gap)"), H7 Partially mitigated.
  Nothing on the page is University-specific.
- **Forecast** — enough history now (three active weeks of eight): likely
  **27 Jul 2027**, cautious **5 Oct 2027**, 0.4 closed a week against 0.6
  needed. Slippage: "critical and high work is likely to finish around
  18 May 2027 — after 13 May 2027"; "a real risk (1 in 7 or more) that all
  work finishes after 13 May 2027"; the pace warning; "10 actions have no owner".
- **Leverage** — the top action is the paediatric consent action. Closing it
  alone moves H3 **Exposed → Not yet assessed** (see call 12 below).

## 3. Bharat Manufacturing — the empty state — `bml-empty-state.png`

No assessment, no register: ₹500 crore (H1, H2, H7 Not yet assessed — silence
is not mitigation), H3 and H4 Not applicable, "Nothing outstanding", no
leverage, no warnings, "No snapshot recorded yet". No error anywhere.

## How the stored snapshot is kept honest

- `POST …/exposure/snapshots` takes **no body**. The database derives every
  value (`public.record_exposure_snapshot`), as the date in India, under the
  model version, and writes one audit row as the person. No user may insert,
  edit or delete a row; a trigger refuses edits even to tooling.
- **The model exists twice** (core for the live view, SQL for the stored
  one), so three tests hold them together:
  1. a unit test parses the migration and fails if the heads, mapping,
     thresholds, points, forecast constants or version differ from core;
  2. an RLS test feeds **400 generated inputs** to both and fails on any
     difference — status, band, rupee range, factors, every reason word for
     word — and does the same for **120 forecast histories**, draw for draw;
  3. an e2e test records a snapshot and proves it equals the live model at
     that moment, on the healthcare tenant, with and without an SDF
     notification.

## Gates (local stack, 2026-10-06)

core **880** (838 → +42) · web unit **386** (359 → +27) · RLS **342**
(326 → +16) · e2e **233/233** (221 → +12) · typecheck clean · `db:types
--check` clean. Measured: `GET …/exposure` for MU inside the 3 s budget (e2e);
the SQL model ~27 ms for MU; the worst-case forecast (every run to the
five-year horizon) ~90 ms.

## The calls to approve (D-074)

1. **The SQL mirror is a pure evaluator over core's own input shape**
   (`app.exposure_evaluate(input)`), plus a separate input builder — so the
   two copies can be compared on generated inputs, not only by reading the code.
2. **Floating-point noise removed in core** before comparing to 40%/60% and
   before rounding a percentage (`exactProportion`, the engine's own rule).
   No status changes for any real input; the model stays 1.0.0.
3. **Forecast** — Park–Miller generator, seed 20270513, 1,000 runs,
   nearest-rank P50/P85, a five-year horizon ("beyond five years" is said,
   not hidden). Critical/high and all work run on the same draws, and the
   critical/high projection **assumes that work is done first**.
4. **What counts as work** — on the gaps the model reads (the chosen
   assessment and the register): each outstanding gap's actions not closed,
   or one unit if it has no action. **The pace** is every closure in the
   organisation (either parent, any assessment) over eight weeks.
5. **Required rate** rounded UP to one decimal; null once the deadline has passed.
6. **Leverage** — severity weights critical 4 · high 3 · medium 2 · low 1;
   only heads AT STAKE count (closing a gap on a mitigated head retires no
   exposure); ties by due date, then id; top 10; each with "closing it alone".
7. **What-if** — up to 50 ids; an id that is not an open action of this
   organisation is reported back as unknown, never an error; the same
   permissions as the exposure view; read-only, so not audited.
8. **Six slippage warnings** — not enough history · critical/high after the
   deadline (P50) · all work after the deadline (P85) · pace below the
   required rate · overdue actions on heads at stake · unowned actions on
   heads at stake.
9. **"What changed"** compares the live model with the newest snapshot, and
   says when that snapshot was recorded under another model version.
10. **A snapshot goes only with what it was about** — its assessment or its
    score snapshot (the cascade, as D-052). Recording needs `score.calculate`;
    reading needs `score.read`. A full-read route
    (`GET …/exposure/snapshots/{id}`) was added for Stage 3's reports.
11. **The overview strip makes its own request** (`GET …/exposure`); the
    dashboard's single request is unchanged. "Exposure" joins the navigation
    for everyone holding `score.read`.
12. **Two consequences of the approved 1.0.0 rules, for your decision —
    not changed:**
    - **(e) mitigation factor.** Closing the LAST open gap on a head (whose
      owners and dates were all set) removes the −1 "every open gap has an
      owner and a due date", so that head's position can rise one point —
      the band can go UP when remediation is finished. Cause: D-073.8 ("no
      gaps is not a plan"). Suggested fix for **1.1.0**: also award −1 when
      no direct gap is outstanding and at least one direct domain is
      answered. Ceilings and statuses never get worse (unit-tested).
    - **Unassessed heads.** With no assessment, closing the only register gap
      on a head moves it from Exposed to **Not yet assessed** — still at
      stake, same ceiling. This is D-026 ("silence is not mitigation")
      working as intended, but the "alone" line can read oddly.

**Start Stage 3 with:** "Stage 2 approved" (or "approved with changes: …").
