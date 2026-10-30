# Slice 10 · Stage 5 — walk-through: the retention register, the AI risk register, model 1.5.0

Built 2026-10-14 on `slice/10-workflow-modules` (PR #28), migration
`20261017000000_retention_ai_risk` (**local only** until your re-test). Your
three decisions are **D-094**: *no end recorded is a reason; the AI register
uses `ropa.write`; no AI actions.* The calls Claude made are **D-095**; the ones
to look at are in §8. **Exposure model 1.5.0.**

> **Approved 2026-10-16 with changes R1–R6 (D-096)** — all six applied inside
> the same migration on 2026-10-16 (§9); this page describes Stage 5 as it now
> stands. Your re-test is Part D of the manual test.

## What you are approving

1. **The retention register**: a schedule per processing activity, its end
   date worked out by the database, erasures recorded once and never changed,
   Rule 8(3)'s one-year floor, and Rule 8(1)–(2) only for a recorded
   Third-Schedule class.
2. **The AI risk register**: one row per AI system or AI use, enabling only —
   it never sets an exposure status.
3. **Model 1.5.0** — three rows (§5).
4. **Overdue erasure as work** on the one action list, and the new way such an
   action closes (§4).

## 1. The retention register — *Retention* in the nav (`retention.read`)

Each processing activity in the register can have **one schedule**:

| Field | Meaning |
|---|---|
| **What ends the retention** | When the purpose is served · When consent is withdrawn (both s.8(7)(a)) · A fixed period · A law requires keeping it (the law named) · *Three years without contact* — only for a Third-Schedule class (Rule 8(1)) |
| **Kept for** | Whole months, **at least 12** for every basis (Rule 8(3) — personal data, traffic data and logs, one year from the processing) |
| **The day the clock started** | **The last day this data was processed** — Rule 8(3) runs "from the date of such processing" (R1); for the Third Schedule, the day the people last approached the organisation. **Empty = no end recorded** (e.g. students still enrolled). Never in the future |
| **End date** | **Worked out by the database**: start + period. Nobody can type it |
| **Tell the people by** | Third-Schedule period only: two days before the end (Rule 8(2), 48 hours) |

Where each schedule stands today: **Retained** · **Erasure overdue** (the day
after the end date, no erasure recorded) · **No end recorded** · **Erased**.
The page counts them, and shows the Rule 8 note.

**Erasures** — recorded on the schedule: the day, how (deleted · anonymised ·
physically destroyed · another way, described — never the erased data itself),
and whether every processor that held it was told to erase it (s.8(7)(b)). Who
recorded it is stamped. **Never changed or deleted.** An erasure counts for the
**current cycle** (on or after the clock started); moving the start date to a
later day begins a new cycle.

An erasure **counts** — clears "Erasure overdue", closes an action — only when
it is **complete**: the processors told, or none held the data (R2). One with
"No — not yet" is tagged **"Erasure incomplete — processors not told"** and the
schedule stays overdue; record it again once they are told.

**Recorded in error** (R4): someone **other than the person who recorded it**
marks an erasure as recorded in error, with a reason. The erasure stays, struck
through, and no longer counts; the mark itself is a record, never changed. An
action already closed on it stays closed (its closure is in the audit log) —
add a new one if work remains.

**Documents** — an erasure certificate, or a processor's confirmation, attaches
to the schedule (evidence type `retention_schedule`).

## 2. The Third-Schedule class — *Organisation* page (`organization.update`)

A new box under the SDF notification: **None of these** by default, or one of
the three classes (e-commerce ≥ 2 crore users · online gaming ≥ 50 lakh ·
social media ≥ 2 crore). **Never inferred.** Only once it is recorded does the
"Three years without contact" basis appear; an erasure under it must record the
day the people were told. It cannot be cleared while a schedule uses it. The
register and the form show the Third Schedule's own words (R3): three years
from the last approach or **13 Nov 2025** (the earlier, conservative reading —
counsel to confirm), and the two purposes outside it — access to the user
account, and a virtual token usable for money, goods or services.

## 3. The AI risk register — *AI risk* in the nav (every member reads it)

One row per AI system (from the scope) or AI use: name, **what it is for**,
**the personal data it uses**, s.9(3)'s question — **"Does it track,
behaviourally monitor or target advertising at children?"** (yes / no / not
known) — and, on yes, **the Fourth Schedule exemption relied on** (A1–A5,
B1–B6, the processing register's list; R5), **the human-review step**, in use /
retired, and the **last review** (stamped with who recorded it; corrected,
never removed). "Yes" with no exemption is a **red warning** and a count —
never a model row (counsel first). "Review due" after twelve months — a
**TrustStack default**. Read with **`ropa.read`** (R5) and written with
**`ropa.write`** (D-094.2); **no actions** (D-094.3). The page says plainly: algorithmic due diligence binds a Significant
Data Fiduciary (Rule 13(3)); head 4 does not apply without a recorded SDF
notification.

## 4. Overdue erasure is work — and how its action closes (D-095.7)

A schedule can carry actions (retention.write + gap.write), on the **same action
list** as every other gap, labelled **"Retention register"** — High (P1) while
the erasure is overdue, else Medium. Such an action closes on:

1. reviewed evidence attached to it (as every action), **or**
2. **an erasure recorded on its schedule for this cycle by someone other than
   the action's owner** — complete, and not marked in error (D-096) — shown as
   "on an erasure recorded by someone else", **or**
3. a reviewer who is not the owner (as every action).

The owner's own erasure does not close their own action: two people, always
(D-056).

## 5. Exposure model 1.5.0

| Row | Head | Provision | Effect |
|---|---|---|---|
| A retention schedule past its end date with no erasure recorded | H7 | s.8(7), Rule 8(3) | **Exposed** |
| A retention schedule with no end date recorded | H7 | s.8(7) | **reason** (D-094.1) |
| An AI system in use with no review in the last twelve months | H4 | Rule 13(3); twelve months is a TrustStack default | **reason** |

Head 4 still applies **only** with a recorded SDF notification, so for every
other client the AI row says nothing. Like every reason row, it speaks once its
head has been assessed. Mirrored in core and SQL; both mirror tests green.

## 6. On Mumbai University (the seed — fictional, laws marked SAMPLE)

- **Ten schedules**, one per ROPA record. **ROPA-009** (event registrations):
  purpose served 15 Feb 2025, kept 12 months → ended 15 Feb 2026, **no erasure →
  Erasure overdue**, one open action owned by the IT/Security Lead.
  **ROPA-003** (SIS): **no end recorded** (students still enrolled).
  **ROPA-008** (chatbot logs): ended 30 Jun 2026, **erased 10 Jul 2026** by the
  IT/Security Lead.
- **MU's head 7 is now Exposed**, with both retention reasons. *(This is the
  move the brief asked to be named.)*
- **AI proctoring** is in the AI register, never reviewed; it monitors
  children's behaviour under exemption **A3** (educational institution), so no
  warning (R5). MU is not an SDF: no effect.
- **The overview** has a *Retention and erasure* section (R6): 1 overdue
  (ROPA-009), 0 ending in 30 days, 1 with no end.
- Bharat Manufacturing: both registers empty.

## 7. Gates

- **After R1–R6 (2026-10-16), on the local stack rebuilt as CI does:** core **1,201** · web unit **514** · RLS **530** · all 22 CI SQL gates · typecheck, `check:secrets`, `db:types --check` clean · e2e **401/402** (one worker; the one is tenancy UI's known full-run flake, green alone). CI: see STATE.
- New with R1–R6: RLS +6 (§8 of `tests/rls/retention.test.ts`), API e2e +2, 1 sweep probe (the void route), UI e2e assertions on the overview, the void and the children warning; the Stage 5 CI SQL gate checks voids, the counting rule and R5.
- As first built — **CI green on `3ff4552`: core 1,191 · web unit 513 · RLS 524 · e2e 399/399**; the Vercel preview built.
- New: `tests/rls/retention.test.ts` (22), `e2e/api/retention.spec.ts` (9), `e2e/ui/retention.spec.ts` (3), 14 sweep probes, the Stage 5 CI SQL gate.
- Locally the same, except e2e **386/399** (one worker): open loop 4's three Dean UI specs (manual-test leftovers on MU) and the 10 serial tests after them.

## 8. Calls to confirm (D-095)

1. **Rule 8(3)'s one-year floor applies to every basis**, not only to logs — the
   rule names personal data, traffic data and logs together. (D-095.2)
2. **The third way to close**: a retention action closes on an erasure recorded
   **by someone other than its owner**. (D-095.7)
3. **The Third Schedule's three years count from 13 Nov 2025 at the earliest**
   (its "commencement of the Rules") — for counsel. (D-095.3)
4. **Erasures are never changed**, even by tooling; a correction is a new
   record. (D-095.4)
5. **The AI register is read by every member** (`organization.read`, as the
   vendor register), any system type may be linked, and a row is retired,
   never deleted. (D-095.8, D-095.9)
6. **No overview section** for either register — the retention actions reach
   the overview's action list. (D-095.11)

## 9. The consultant's recommendations — R1 to R6 (given 2026-10-14)

> **All six applied 2026-10-16 (D-096)**, inside
> `20261017000000_retention_ai_risk`; model still 1.5.0. Re-test: the manual
> test's Part D.

Claude's review as a DPDP consultant, checked against the Gazette text. As
given (before they were built): Approving "with changes: R1–R6" (or any subset, e.g. "R2, R4")
means the next session applies exactly these, **inside
`20261017000000_retention_ai_risk` before it reaches hosted** — model stays
**1.5.0**. Anything not named stays as built.

| # | Change | Why (the text) | Where it lands |
|---|---|---|---|
| **R1** | Every basis's start date means **"the last day this data was processed"** (purpose served / consent withdrawn / period / law); the note gains: *"During the year Rule 8(3) requires, the data is held only for the purposes in the Seventh Schedule — not used for the original purpose."* | Rule 8(3) runs "from the date of such processing", "for the purposes as specified in the Seventh Schedule" | Wording only: core `RETENTION_START_LABEL`, `RETENTION_NOTE`; UI; the manual test |
| **R2** | An erasure counts (clears overdue, closes the action) **only when processors told = Yes or No processor held it**. "No" shows **"Erasure incomplete — processors not told"** and the schedule stays overdue. | s.8(7)(b): cause the Data Processor to erase | core `retentionClock`/facts (latest *complete* erasure), SQL `exposure_input` (`max(erased_on) FILTER (processors_told <> 'no')`), the action-closing trigger, the API pre-check; mirror tests, RLS, e2e |
| **R3** | Keep **13 Nov 2025** as the earliest start of the Third Schedule's three years (the conservative, earlier erasure date; counsel to confirm). Under the deemed basis, show the Schedule's exceptions: *access to the user account* and *virtual tokens usable for money, goods or services* are outside the three-year rule. | Third Schedule col. 3–4; Rule 1(2)–(4) commence the Rules in stages | Wording only: core note, the deemed basis's help text |
| **R4** | An erasure may be marked **"recorded in error"** — append-only, with a reason, by **someone other than the person who recorded it**; the original stays visible, struck through. A voided erasure no longer counts (core, SQL, closing trigger). The method note warns: never type the erased personal data here. | Accuracy of the organisation's own record (s.8(5) accountability; the Board's inquiry, s.28) | New table `retention_erasure_voids` (insert-only, RLS, audit), `POST …/erasures/{erasureId}/void`, UI button; sweep probe, CI gate, RLS, e2e |
| **R5** | AI register: (a) read with **`ropa.read`**, not `organization.read` (no visible change — every role holds it; it becomes a lever); (b) replace "affects children" with the s.9(3) question **"Does it track, behaviourally monitor or target advertising at children?"** (yes/no/unknown) and, when yes, **the Fourth Schedule exemption relied on** — reusing the processing register's `ROPA_CHILD_EXEMPTIONS` (A1–A5, B1–B6). "Yes" with no exemption shows a **red warning** and is counted; **no model row** (counsel first). Seed: MU's proctoring = yes, exemption **A3** (educational institution). | s.9(3); Rule 12; Fourth Schedule Parts A–B; Rule 6 access control | Column change in the Stage 5 migration (`child_tracking`, `child_exemption`), RLS policy, routes, UI, seed, tests |
| **R6** | A small **Retention** section on the overview: erasures overdue, ending in 30 days, no end recorded — counted in core over the register's reader, linking to the register. | Rule 8 duties commence 13 May 2027 (Rule 1(4)); leadership visibility | `readDashboard` (`retention` section, `omitted`), `executive-overview.tsx`, e2e |

After applying any of them: gates on the local stack, the walk-through and
manual test updated to match, **CI green**, then — and only then — the
migration goes to hosted.

## Then

Approved with changes R1–R6 (D-096). Run the manual test's **Part D** and reply
**"Stage 5 re-test passed"**: the migration then goes to hosted (additive), and
**Stage 6** — the three reports, the evidence index's new link types, the full
test pass and the PR — is next, in a new session.
