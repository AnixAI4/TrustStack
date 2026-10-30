# Slice 10 · Stage 2 — walk-through: the rights and grievance register, and exposure model 1.2.0

**Branch** `slice/10-workflow-modules` · **draft PR #28** · **migration**
`20261012000000_rights_register` (additive; **local only** — it goes to
hosted when you approve Stage 2) · **calls** D-083 · **manual test**
`docs/testing/SLICE_10_stage2_manual_test.md`.

## What you are approving

1. **The two workflows** — Data Principals' requests to exercise a right and
   their grievances, recorded by staff (the public forms are Stage 3).
2. **The SLA wording** — the Rules' ninety days and TrustStack's thirty.
3. **The 1.2.0 rows** — what the register does to penalty head 7.

## 1. The register — one register, two families

A Data Principal writes, calls, sends a letter or walks in. Staff record it
on the day it arrives, at **Rights & grievances → Record a request or
grievance**:

| Kind | Provision | Code |
|---|---|---|
| Access to information | s.11 | `DPR-2026-001` … |
| Correction · Completion · Updating | s.12(2)(a)–(c) | `DPR-…` |
| Erasure | s.12(3) | `DPR-…` |
| Nomination | s.14, Rule 14(4) | `DPR-…` |
| Grievance | s.13, Rule 14(3) | `GRV-2026-001` … |

- **One register, because the law makes it one system** (D-083.1): s.13 makes
  grievance redressal itself a right, Rule 14(3) gives one ceiling, and a
  grievance is often about an earlier request ("About an earlier request").
- **No right the Act does not grant** — the old app's GDPR-style "restrict"
  is gone, and its section numbers are corrected (D-083.3).
- **Who made it**: the person, a nominee (s.14), or a parent or lawful
  guardian (s.2(j)). A **nomination** names its nominee.
- **The person's details are personal data**: they stay in the register — never
  in the audit log, the Actions page or a report (D-083.9).

**The workflow** (each fact stamped with who recorded it and when):

1. **Identity verified** (Rule 14(1)(b), (2)) — when and how. A request cannot
   be fulfilled until it is recorded: fulfilling it for someone else would
   itself disclose their data. A grievance, or a refusal, does not need it.
2. **Response** — outcome and the day: *Fulfilled · Partly fulfilled ·
   Declined* (a grievance: *Resolved · Partly resolved · Not upheld*). Anything
   short of fulfilled says why.
3. **Lifecycle** — *Withdrawn by the person* or *Void — entered in error*,
   each with its reason. Every closed request reopens; **reopening withdraws
   the response** (the audit log keeps it). Nothing is ever deleted.
4. **Remedial actions** — on the one action list, labelled **Rights and
   grievance register**, named by code and kind ("Grievance GRV-2026-001"),
   under the usual closing rule.

## 2. The SLA wording — please read it as counsel would

The note under every register count and on every request:

> The Rules set one period: a response within a reasonable period not
> exceeding ninety days of receipt, under the grievance redressal system the
> organisation publishes (Rule 14(3)); requests to exercise the other rights
> run through the same system. The 30-day response target is TrustStack's,
> not a statutory period.

On each request: **Received** · **Respond by — the Rules' ninety days** ·
**TrustStack's target — thirty days**, and a clock line:

| On the day | The line says |
|---|---|
| Day 0 – 30 | `Day 12 of 90` |
| Day 31 – 90 | `Day 45 of 90 — past TrustStack's 30-day target` |
| Day 91 + | `Overdue — day 95, past the 90-day ceiling` |
| Responded by day 90 | `Responded on day 21` |
| Responded after | `Responded on day 95 — after the 90-day ceiling` |

- Days count from the **date of receipt** (s.13(2)), on India's calendar.
  **Day 90 is still in time.** The respond-by date is the database's
  (receipt + 90), and the receipt date cannot be edited once recorded.
- **Applying the ninety days to every request**, not only grievances, is the
  prompt's reading (SLICE_10 §1): the Rules set no separate period for the
  other rights. Counsel to confirm.

## 3. Model 1.2.0 — the rows to approve

| Row | Head | Provision | Effect |
|---|---|---|---|
| A rights request or grievance **open past ninety days** | H7 | s.11–14, Rule 14(3) | **Exposed** |
| **Open past TrustStack's 30-day target**, still inside the ninety | H7 | Rule 14(3) sets ninety days; thirty is a TrustStack target | **a reason, never a status** |

- The reasons, word for word: "*1 rights request or grievance has been open
  for more than ninety days since it was received (Rule 14(3)).*" and "*1 rights
  request or grievance is open past TrustStack's 30-day response target (a
  target, not a statutory period).*"
- Only **open** requests count. A request is overdue or past the target, never
  both. The target's reason is listed whenever head 7 has been assessed —
  even a Mitigated head stays Mitigated, with it — and moves nothing.
- An overdue request is **direct evidence**: it sets head 7 Exposed even with
  no assessment.
- A **late response** is not a model fact (the row reads "open"); the
  register and the overview count it.
- 1.2.0 is in core and in its own migration; the 1.1.0 migration is
  untouched. Both mirror tests hold the two copies together (400 generated
  inputs, with requests on days 30, 31, 90 and 91).

## 4. Where else it shows

- **Overview** — *Rights requests and grievances*: open requests, open
  grievances, past TrustStack's target, grievances open past the 90 days, and
  the requests that need someone now, oldest first.
- **Actions** — a fourth source; the filter's first option now says *Every
  source* (it said "Both").
- **Exposure** — head 7's *Evidenced by* links the rights register.
- **Reports** — the tracker, the owner's pack and the evidence index carry
  a request's actions (by code and kind). The three new stakeholder reports
  are Stage 6.

## 5. One Stage 1 bug, fixed

Attaching evidence to a **breach's** action stored the file and the link,
then answered *"Action not found."* — so the page showed an error for
something that had worked. It now succeeds, for breach and rights actions
alike (D-083.14). Stage 1's tests and manual test never attached evidence to
a breach action; the Stage 2 API test does.

## 6. Gates

Core **1,025** (982 → +43) · web unit **452** · RLS **420** (393 → +27) ·
typecheck clean · `db:types --check` clean · service-role guard OK. Local e2e
(one worker) — see STATE for the count; CI is the authority.

## 7. Not in Stage 2

The public forms, the organisation's public slug, emailed one-time codes and
the published Rule 9 contact (**Stage 3**); evidence linked to a request
itself (**Stage 6**); acknowledgement and escalation emails (**Slice 13**);
any AI-drafted response (**Slice 11**).
