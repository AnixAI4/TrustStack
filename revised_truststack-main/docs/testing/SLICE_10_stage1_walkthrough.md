# Slice 10 · Stage 1 — the breach register and exposure model 1.1.0

**For:** Aniket's Stage 1 approval gate (SLICE_10 §7).
**What it shows:** the breach register on **Mumbai University**, a
**healthcare clinic network** and **Bharat Manufacturing's empty state**, and
what the register now does to penalty head 2. The figures are real API
responses from the local stack on 11 Oct 2026 at about 09:30 IST, not mock-ups.
**Where the rules come from:** SLICE_10 §1, §4.4 and §6, approved as written
(D-080). The calls Claude had to make are in **D-081**.

> Exposure figures are indicative positions within statutory ceilings in the
> Schedule to the DPDP Act 2023, derived from your own assessment, register
> and remediation data under TrustStack exposure model 1.1.0. They are not a
> prediction of any decision of the Data Protection Board, which imposes a
> penalty only after an inquiry finds a breach significant and weighs the
> factors in section 33(2). They are not legal advice.

## What was built

| | |
|---|---|
| **Register** | `breach_incidents`: what happened (title, nature, severity, where, people affected, data involved, likely impact, containment) and the **Rule 7 timeline** — aware → Board told without delay (7(2)(a)) → the detailed report (7(2)(b)) → each affected person told (7(1)). |
| **The clock** | The database sets the report's due time: **aware + 72 hours**, or the time the Board allowed on a written request. Nobody can edit it, nor when the organisation became aware. Exactly 72 hours is in time; the next instant is overdue. |
| **Stamps** | Each fact records when it happened (entered) and **who recorded it, and when** (stamped). A fact can be corrected, never removed. Nothing in the future. |
| **Lifecycle** | Open → Contained → Closed. **Closing needs both the Board report and the people's intimation.** A closed breach is reopened to change. **Dismissed** = not a personal data breach, with the reason. Nothing is ever deleted. |
| **Actions** | A breach's remedial actions live on the **one action list** (a third parent on `gap_actions`), with the same owners, due dates, editor and closing rule (D-056). |
| **Exposure 1.1.0** | Three new rows on head 2 (below), in core **and** SQL, held together by both mirror tests. |
| **Overview** | A "Personal data breaches" section: counts and every clock still running. |
| **Permissions** | `breach.read` (every role) · `breach.write` (the roles that already write registers). |
| **Pages** | Breach register · Record a breach · the breach's own page. |

## The 1.1.0 rows — for your approval (then counsel's)

| Row | Head | Provision | What it does |
|---|---|---|---|
| Detailed report to the Board past its due time (72 h, or the extension) and not recorded as made | H2 | s.8(6), Rule 7(2)(b) | **Exposed** — even with no assessment: it is direct evidence, not silence |
| Affected Data Principals not yet recorded as intimated | H2 | s.8(6), Rule 7(1) | H2 can be **at best Partially mitigated**. It never lifts a head out of "Not yet assessed" |
| Breaches (not dismissed) the organisation became aware of in the last 24 months | H2 position | s.33(2)(c) | **+1** for one, **+2** for two or more. A well-handled breach still counts, as the row says |

A dismissed breach counts for nothing in the model. The 48-hour and 12-hour
alerts on the page are **TrustStack targets, labelled as such**; 72 hours is
the Rules'.

## Three tenants, side by side

| | Mumbai University (seeded) | Demo Clinic Network (healthcare) | Bharat Manufacturing |
|---|---|---|---|
| Breaches recorded | 1 — **BRH-2026-001**, exam marks shared through a public link, March 2026 | 3 | 0 (empty state) |
| Their state | **Closed.** Board told the same day; detailed report **16 Mar 2026, 16:30 IST**, before its due time (17 Mar, 10:20 IST); students told 15 Mar | **BRH-2026-001** open, report **overdue by 8 h**, nobody told · **BRH-2026-002** ransomware, critical, Board extension to 7 days → **158 h remaining** · **BRH-2026-003** dismissed ("link blocked, no personal data reached") | — |
| Overview counts (open · in window · overdue · not told) | 0 · 0 · 0 · 0 | 2 · 1 · **1** · **2** | 0 · 0 · 0 · 0 |
| Breach actions on the action list | 1 open (link-sharing review, IT/Security Lead, due 30 Nov 2026) | 1 open (Legal Counsel, due 15 Dec 2026) | 0 |
| **H2 status** | Not yet assessed (no BREACH question answered yet) | **Exposed** | Not yet assessed |
| H2 position | Upper third (₹133–200 cr), 5 points — incl. **(c) 1 breach in 24 months +1** | Upper third (₹133–200 cr), 5 points — incl. **(c) 2 breaches +2** (the dismissed one does not count) | Lower third (up to ₹67 cr), 1 point — no repetition |
| H2 reasons | "No question that evidences this head has been answered yet…" | "1 personal data breach: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b))." · "2 personal data breaches: affected Data Principals are not recorded as intimated (Rule 7(1))." | "No assessment has been started…" |

What each tells you:

- **Mumbai University** handled its breach in time, so nothing makes H2
  Exposed — but the breach still adds **+1 under s.33(2)(c)** until March 2028.
  Before 1.1.0 that factor was always 0.
- **The clinic** has one report overdue: H2 is **Exposed** although the clinic
  has no assessment at all. Recording the report clears that row; H2 would
  then stay "at stake" until the people are told and the BREACH area is
  answered and evidenced.
- **BML** shows the empty state everywhere: a zero register, no section clocks,
  no repetition.

## The calls to approve (D-081, in brief)

1. Two permissions: `breach.read` everyone, `breach.write` the register writers.
2. Two Board intimations recorded apart; only the 7(2)(b) report has the clock.
3. Exactly 72 hours is still in time.
4. Awareness can never be edited; a recorded fact can be corrected, never removed.
5. Dismissed = not a personal data breach, with its reason; never deleted.
6. Closing needs both intimations.
7. Breach actions: one RPC door, `breach.write` + `gap.write`; a closed breach can still take actions.
8. An overdue report makes H2 Exposed even with no assessment; the people-not-told row never lifts "Not yet assessed".
9. Repetition: 24 calendar months ending today, dated in India, both ends included.
10. The exposure view also needs `breach.read` (every role has it).
11. The overview's breach section; breach actions in the Actions page and the Stage 4 reports.
12. Times are stored in UTC and always entered and shown in IST.
13. Not in this stage: evidence on a breach itself (Stage 6); timed email alerts (Slice 13); AI-drafted letters (Slice 11).
14. Seed: MU's one past breach (+1 repetition on its H2).

## Gates (local stack)

core **982** (+44) · web unit **435** (+10) · RLS **393** (+23) · e2e
**278/278** (+19: 10 API, 2 UI, 7 sweep probes). CI on PR #28 is the
authority for the full e2e suite.

## To approve

Open a new session with **"Stage 1 approved"** (or "Stage 1 approved with
changes: …"). On approval the migration `20261011000000_breach_register` goes
to hosted (it is additive), and Stage 2 (rights requests and grievances,
model 1.2.0) starts.
