# Slice 9 · Stage 3 — walk-through for Aniket's approval

**What to approve at this gate (SLICE_09 §12):** the two PDFs' **layout and
wording** — the DPDP Exposure Brief (Board, one page) and the Programme
Status Report (DPO) — and the calls in **D-076**. Built 2026-10-06 on
`slice/09-intelligence` (commit `9858954`, draft PR #25). Nothing here is on
the live site or the hosted database yet.

Files in `docs/testing/slice09-stage3/` — open the PDFs themselves; the PNGs
are page renders of the same files:

| Organisation | Exposure Brief | Programme Status Report |
|---|---|---|
| **Mumbai University** (local stack; the assessment in progress, register gaps generated) | `mu-exposure_brief.pdf` · `-1.png` | `mu-programme_status.pdf` · pages `-1` … `-5.png` |
| **Second sector: Sahyadri Children's Hospital (demo)** — healthcare, 250,000 Data Principals, children's data **yes**, guardian data and location **not known**, three register records, no assessment | `hospital-exposure_brief.pdf` · `-1.png` | `hospital-programme_status.pdf` · pages `-1` … `-5.png` |
| The Reports page (`/dashboard/reports`) | `reports-page.png` | |

The hospital tenant was a local demo only, removed after the renders.
Bharat Manufacturing's empty state is covered by the e2e suite on a
disposable empty tenant (BML itself is permanent data, and generating a
report records a permanent snapshot).

## 1. The DPDP Exposure Brief — the Board's page

One A4 page, always: proved by a test with a worst-case fixture (five long
reasons, five long action titles, names in Devanagari). Top to bottom:

1. **Header**: "DPDP Exposure Brief", the organisation, "For the Board, CEO
   and Executive Sponsor"; on the right: as of (date in India), version,
   basis (finalised / provisional / no assessment yet), exposure model, and
   who generated it and when.
2. **Where you stand**: four tiles. Statutory ceilings where you are exposed
   (₹ crore, with "Statutory ceilings, not a predicted fine; penalties are
   per breach."), penalty heads at stake ("4 of 4"), days to 13 May 2027,
   and when critical and high work is likely to finish (or "Not enough
   history"). Then the **s.37 notice** (when any head is at stake), "Based
   on: …" naming the assessment and its unanswered count, and one notice
   listing any input that is out of date.
3. **Exposure by penalty head (the Schedule, s.33(1))**: one row per
   modelled head — short name with its provision, status (coloured), the
   Schedule's ceiling, the indicative position ("Upper third: ₹167–250
   crore") and the main reason.
4. **The actions that retire the most exposure**: the top five from the
   leverage ranking, with the heads each counts against, severity, owner
   ("Unassigned" when nobody) and due date.
5. **Pace**: three sentences — critical and high work, all work, closures a
   week against the rate needed.
6. **Both caveats verbatim** (D-011, then the exposure model's §6.6), then
   the notes: heads 5 and 6 not modelled and why; ceilings are not fines;
   counsel to confirm commencement dates; the s.33(2) factors that are the
   Board's own judgement.

**Wording to look at in particular**
- The head short names: "Security safeguards (s.8(5))", "Breach
  notification (s.8(6))", "Children and lawful guardians (s.9)",
  "Significant Data Fiduciary duties (s.10)", "Any other provision". The
  DPO's report uses the full statutory titles.
- "Based on: No assessment yet: the scope and the processing register only. A
  head with no evidence either way is Not yet assessed, and counts as at
  stake."
- Action titles are the actions' own titles. A register action's title
  carries its record code, e.g. "(ROPA-001)". That is the client's own
  identifier, not bank internals (D-071).

## 2. The Programme Status Report — the DPO's report

Several pages, same header, then:

1. **At a glance**: the four exposure tiles, plus actions outstanding,
   overdue, with no owner, and closed (across the assessment AND the
   register); the s.37 notice; the basis and freshness.
2. **Slippage warnings**: the Command Centre's six warnings, as given.
3. **Exposure by penalty head**: per head, the full statutory title,
   provision and ceiling; status and indicative position with its points;
   every reason (direct evidence first, then root causes); the s.33(2)
   factors, signed (+2, −1). Then heads 5 and 6.
4. **Pace and forecast**: a table — outstanding, needed a week to finish by
   13 May 2027, likely (P50) and cautious (P85) finish — for critical and
   high work and for all work. Then the pace, the eight weekly closure
   counts in one row, and the method.
5. **What changed since the last snapshot**: against the snapshot recorded
   BEFORE this report's own. Ceilings and heads at stake, from and to, and
   each head whose status or band moved. Flags a model-version change.
6. **The actions that retire the most exposure**: the top ten, with the
   source and its context ("Processing register · ROPA-003 · …",
   "Assessment · Security safeguards").
7. **Remediation by owner and by window**: outstanding and overdue per
   owner (Unassigned first), per 30/60/90-day window, and per source.
8. **Processing register**: eleven counts, the register page's own, with
   "A DPDP readiness register — not a statutory record."
9. **Appendix — Readiness scorecard**, on its own page: the score of the
   assessment the snapshot was based on (frozen or provisional, said
   plainly), maturity, evidence confidence, critical/high findings, red
   flags by label, and the sixteen domains with weight, score, share of
   weight, evidence confidence and status. "Exposure never feeds back into
   the score."
10. Both caveats verbatim, and the notes.

## 3. How a report is made, stored and fetched (D-076)

- **Generate** (`POST …/reports {kind}`): the database begins the report,
  decides its version, file name and path, and **records a fresh exposure
  snapshot first**. The app renders the PDF from that STORED snapshot (never
  recomputing exposure) plus the Command Centre's and the overview's own
  readers. It uploads with the person's own credentials, and the database
  marks the report ready, reading the file's size itself. Measured locally on
  MU: 0.1–0.6 s.
- **Versions**: generating again ("New version" on the page, or
  `POST …/reports/{id}/regenerate`) makes version 2 with a new snapshot.
  Version 1 and its file are never touched (tested: same SHA-256 before and
  after).
- **Download**: a 60-second signed link, logged every time. The Executive
  Sponsor and the Auditor may download; contributors see the list but cannot
  download; only programme roles generate.
- **Retention**: nobody can edit or delete a report or its file.
  Regenerating adds; deleting a draft assessment leaves the report in place.

## 4. Checks

| Gate | Result (local stack, 2026-10-06) |
|---|---|
| Typecheck | clean |
| Unit: core | **906** (880 + 26) |
| Unit: web | **411** (386 + 25) |
| RLS | **367** (342 + 25) |
| e2e: all Stage 3 specs | api `reports` **8/8**, ui `reports` **2/2**, route sweep **79/79** (5 new probes) |
| e2e: full suite | **241 of 248** passed; 4 failed and 3 did not run, all in UI files Stage 3 did not touch (`tenancy`, `scoring`, `ropa`, `scope`). They pass in isolation (13/13), and the **Stage 2 commit fails the same way on this laptop today**. Cause: the local Auth container ran out of ephemeral ports to Postgres ("cannot assign requested address", 127 Auth 500s in 20 minutes). **CI's fresh stack is the authority** — see PR #25 |
| `pnpm audit` | unchanged by react-pdf (4 moderate / 5 high, all pre-existing) |
| Service-role guard, `db:types --check` | clean |

## 5. To approve

Reply in a new session with **"Stage 3 approved"**, or with changes. If you
approve, the next session applies `20261010000000_reports` to hosted
(additive) before starting Stage 4.
