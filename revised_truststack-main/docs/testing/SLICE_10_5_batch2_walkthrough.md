# Slice 10.5 · Batch B2 — walk-through: assessment, evidence and gaps

Built 2026-10-18 on `slice/10-5-b2-assessment`, off `main` (B0–B1 are live),
its PR straight into `main` (D-104.9, D-113) — so approving it puts it on the
live site when it merges. Opened by "Start Slice 10.5 Batch B2", from the fix
list you approved with the recommendations (D-104: F2.1–F2.7, Q3 on the
scorecard), the paging additions N2 and N5 (D-107), and B1's calls 3 and 8
(D-110).

**Nothing about the data, the law, the score or who may do what changed**: no
API, permission, model, migration or seed change. Every number on these pages is
still the engine's or the database's — the cap is read from `EVIDENCE_CAP`,
never restated. Every `data-testid` a test used is still there, except the
assessment page's **Open every domain** / **Close every domain**
(`domains-expand-all`, `domains-collapse-all`), which one-domain-at-a-time (N2)
replaces. The manual test is `docs/testing/SLICE_10_5_batch2_manual_test.md`
(about 25 minutes). Its gate: **"Batch B2 approved"**.

> **One call needs your eye first (§8, call 1):** F2.2 asked for the score
> bands' names ("Level 2 - Defined") on the 0–5 picker, and to check first. They
> do not fit: on the spec's own answer scale **3** is "Defined" and **2** is a
> draft. I built the spec's answer scale instead. One constant switches it back
> if you prefer the band names.

## What you are approving

1. **The assessment page (U11)** — the header leads with progress (F2.1); one
   domain at a time, with pills, Previous / Next domain and **Unanswered only**
   (N2); the claimed level in words (F2.2); evidence in words with the `E3` code
   in a tooltip (F2.3); **Questions for my role**, the default for a department
   owner (F2.4); "Not started" on the scorecard (Q3).
2. **The assessments list (U10)** — status in words, "17 Oct 2026", "answered x
   of y", one **Open**, paged and searchable (F2.6, N5).
3. **The gap registers (U12, U16)** — paged, searchable, sortable tables; every
   evidence or document list on one item pages past ten (F2.5).
4. **The question bank (U09)** — a purpose line, "Approved" / "Draft", "201
   questions" (F2.7).
5. **One defect fixed on the way** — an answered question's picker could open on
   "Choose…" instead of the saved level (§8, call 10).

---

## 1. The assessment page — header and domains (U11, F2.1, N2)

| | Before | After |
|---|---|---|
| Header | "in_progress · **124** questions · 91 answered as asked, 33 shown as Potentially Applicable" | "**In progress · 1 of 124 answered · 33 may not apply — confirm or answer them**", and a progress bar |
| Domain cards | "Governance … weight 7 · 8 questions · 1 Potentially Applicable" | "weight 7 · **answered 1 of 8** · 1 may not apply", a bar each; the chosen domain's card is outlined; a card opens its domain |
| The questions | Sixteen collapsible groups, the first open; "Open every domain" / "Close every domain" | **One domain at a time**: sixteen pills ("1. Governance 1/8" … "16. SDF 0/8", green when complete), the domain's full name as its heading, **← previous** and **Next domain: …** at the bottom, the chosen domain in the link (`#SECURITY` — a reload or a shared link lands on it) |
| Filters | — | **Unanswered only** (anyone who can read answers) |
| Each question | "Owner Executive Sponsor / DPDP Owner" | "**Suggested owner** Executive Sponsor / DPDP Owner" — the bank's suggestion; who actually owns the work is on the action |

## 2. Answering and evidence (U11, F2.2, F2.3)

| | Before | After |
|---|---|---|
| The picker | "Claimed maturity: Choose… 0 1 2 3 4 5 Not Applicable" | "**How far along is this?** 0 — Not started · 1 — Aware · 2 — Draft or partial · 3 — Defined · 4 — Implemented · 5 — Operational and monitored · Not Applicable"; choosing one shows its meaning ("An approved policy or process exists. Evidence decides what it counts as.") |
| The saved answer | "Claimed 5 → adjusted 3 · capped by E3 (E3 supports at most 3)" | "You claimed **5** (Operational and monitored) → it counts as **3** of 5", then "**Reviewed: Partial (evidence level 3 of 5) — this answer counts at most 3**" (tooltip "Evidence E3") |
| Nothing reviewed | "· capped by E0 (E0 supports at most 1) — no reviewed evidence yet" | "No reviewed evidence yet (evidence level 0 of 5) — this answer counts at most 1" |
| A file | "Partial · E3" | "Reviewed: Partial (evidence level 3 of 5) — **supports** at most 3" (tooltip "Evidence E3"); awaiting review: "Awaiting review — supports nothing until it is reviewed" |
| The reviewer's level picker | "E3 (supports at most 3)" | "3 of 5 — Approved document or process (supports at most 3)" (the spec's evidence table; the value sent is still 3) |
| No file | "…this answer scores as E0 — at most 1." | "…this answer counts at most 1 (evidence level 0 of 5)." |

## 3. Questions for my role (U11, F2.4)

| Role | What opens | Offered |
|---|---|---|
| Department Owner (the Controller of Examinations) | **Questions for my role (73)** — every question whose suggested owner names a department or a process owner ("Process Owners", "Registrar / Exam Cell", "Placement Head", "Academic Administration / Legal"…); pills with none are hidden | **All questions (124)**, one click |
| Legal User · IT/Security User · Procurement User · DPDP Programme Owner · Executive Sponsor | All questions | Questions for my role (their function: Legal; IT, Security, CISO, Engineering; Procurement; DPDP Owner, Compliance; Executive Sponsor) |
| Organisation Admin · Anix AI Consultant · Auditor/Reviewer | All questions | — (no question names them) |

A line says it plainly: "Showing the questions suggested for your role
(Department Owner). A guide, not a limit — choose All questions to see every
one." The API and RLS still decide what each role may answer.

## 4. The assessments list (U10, F2.6, N5)

| | Before | After |
|---|---|---|
| Purpose | "A generated question set is a snapshot…" | "Each assessment is a snapshot of the questions at the moment it was generated — … Open one to answer it, attach evidence and see its score." |
| A row | "baseline · 124 questions · generated 17/10/2026, 12:12:04 pm" · `in_progress` | **Assessment** (name, "Baseline") · **Status** "In progress" · **Progress** "answered 1 of 124" · **Generated** "17 Oct 2026" · **Open** |
| Layout | A plain list | `<DataTable>`: search, sort by any column, 25 a page once there are more |

## 5. The gap registers and evidence lists (U12, U16, F2.5)

| | Before | After |
|---|---|---|
| Gap register | Every gap card on one page, filters above | The same cards in a **paged table** (25 a page): **Gap** (sorts most severe first), **Domain** and **Next due** on a laptop (on a phone the card names its domain); a search over the question, domain, fix and owners — **never the question code** (D-040); the filters and "Showing x of y" stay |
| Register gaps | Every gap on one page | The same, with a **Record** column; search by record code, name, gap or owner |
| Evidence and documents on one item | Every file listed | The plain list up to ten; past ten, "Showing 1–10 of 14" with Previous / Next — on an answer, an action, a processing record, a processor and every register row's Documents |
| A document's review | "review: pending" | "Awaiting review" (the label every other list uses) |

## 6. The question bank (U09, F2.7) — Anix only

| | Before | After |
|---|---|---|
| Purpose | — | "The question bank every assessment is generated from — for Anix consultants only; clients never see it. …" |
| Counts and status | "draft" · "201" · domain "7" | "Draft" · "**201 questions**" · "weight 7"; a question's status "Approved" |

## 7. What did not change

- **No API, permission, model, migration or seed change.** The pages read the
  same readers; "answered x of y" on the list is each assessment's own score
  reader counted by core `answeredProgress` (the overview's own method, D-069).
- **Scores and caps**: the adjusted score, the evidence level and the cap still
  come from the database (D-044); the browser reads `EVIDENCE_CAP` and a unit test
  fails if a page ever writes the table out. "Not started" is a label: the engine
  still stores `needs_work`; the workbook oracle (24.7014 / 25.3014) is untouched.
- **Who may do what**: "Questions for my role" filters the page; the API and RLS
  still decide what a role may read or answer. Nobody reviews their own upload
  (D-043) — unchanged.
- **The black box** (D-071): the question code is not searchable on the gap
  register; pack codes and "why it is in the set" still reach Anix staff only.
- **Test ids**: all kept but `domains-expand-all` / `domains-collapse-all`;
  `domain-toggle-{code}` is now the domain card's button and `domain-group-{code}`
  the domain's panel.

## 8. Claude's calls (D-114) — confirm or change

As your DPDP consultant: each call with a verdict, its basis (statute checked in
`docs/legal/` with `pdftotext`; TrustStack's own method named as such), and the
risk if wrong. Counsel confirms wording; the product never claims counsel has
reviewed it.

1. **The 0–5 picker uses the spec's answer scale, not the score bands' names.**
   *Verdict: change (from the fix list's wording) — built that way.* The fix list
   said "Level 0 Not Started … Level 5 Continuous Assurance", the names of
   `MATURITY_BANDS`. Those name a **score percentage** (Level 2 "Defined" is 41–60
   %); the spec's own "Maturity Scoring" table for **one answer** (Step G,
   `docs/spec/03_…G-I.md`) says 0 Not started · 1 Aware · **2 Draft / partial** ·
   **3 Defined** · 4 Implemented · 5 Operational and monitored. Borrowing the band
   names would tell an assessor that 2 means an approved policy exists. Built as
   core `CLAIM_LEVELS`, with the spec's one-line meanings, lightly edited for
   plain English ("Draft or partial"). **This is TrustStack's method, not
   statute**: the Act sets duties, not maturity levels; the scale measures how far
   an organisation has taken the "appropriate technical and organisational
   measures to ensure effective observance" of the Act (s.8(4)). *Risk if wrong:*
   an over-claim at 2 that the record then misstates (the cap still bounds the
   score, so the number is safe; the record is not).
2. **Evidence in words: "this answer counts at most N" on the answer; "supports
   at most N" on each file.** *Verdict: confirm.* An answer counts at its
   strongest **reviewed** file (D-044/D-045), so a per-file "this answer counts at
   most 3" would be false when a second file is stronger. A file awaiting review
   "supports nothing until it is reviewed"; a rejected file is "Reviewed: Rejected
   (evidence level 0 of 5)", which still counts at most 1. TrustStack's rule, no
   statute; `E0`–`E5` stay in the tooltip for anyone who knows the codes.
3. **"Questions for my role" matches the bank's free-text suggested owner by the
   function it names.** A Department Owner matches any named owner that is not an
   organisation-wide function (DPDP Owner, Compliance, Executive Sponsor, Legal,
   IT, Security, CISO, Engineering, Procurement, AI Governance) — so "Process
   Owners", "Data Owners", "Registrar / Exam Cell", "Placement Head". On MU that
   is **73 of 124** for the Controller of Examinations: the process-owner
   questions apply to every department. *Verdict: confirm, and narrow later* —
   the browser does not know a person's **department** (no reader returns it), so
   "Exam Cell" cannot yet be matched to the Controller alone; that needs a reader
   change, not a B2 fix. Display only: access is unchanged (Rule 6(1)(b),
   "appropriate measures to control access" — enforced by the API and RLS). *Risk
   if wrong:* a department owner misses a question — mitigated by the note, the
   one-click All questions, and the programme owner seeing everything.
4. **"33 may not apply" counts the Potentially Applicable questions not yet
   answered**, so it falls as they are confirmed or marked Not Applicable, and
   disappears at zero. *Verdict: confirm.* A Not Applicable answer still needs its
   reason, and a mandatory question still cannot take one (D-041).
5. **One domain at a time keeps the domain cards** as the at-a-glance progress
   (F2.1) and adds the pills as the stepper (N2); a card opens its domain; the
   **first domain opens by default** (not "the first with work left"), so links,
   habits and tests stay predictable. Every domain's panel stays rendered (hidden),
   so a half-chosen answer survives a switch. *Verdict: confirm.* On a phone the
   sixteen pills wrap into a tall block — say if you would rather they scroll
   sideways.
6. **The gap registers are one wide "Gap" column** — the card you know, with its
   action editor — sortable by severity, plus **Domain** / **Record** and **Next
   due** columns on a laptop; the search never matches a question code (D-040).
   *Verdict: confirm.*
7. **Evidence lists page at ten** (`<PagedList>`), registers at 25
   (`<DataTable>`): one item rarely holds ten files; a register grows without end.
   *Verdict: confirm.*
8. **The list's "answered x of y" is one score read a row** (the reader the
   overview uses). *Verdict: confirm for now;* when re-assessments (Slice 12) make
   the list long, a server-side count is the step — an API change, so not here.
9. **"Evidence awaiting your review" stays out of Your next steps** (D-110.3,
   again). No reader returns pending evidence across answers, actions and
   registers: the evidence index serves only report generation, and the
   assessment's answers reader covers answers alone — a partial list would say
   "nothing to review" while a processing record's document waits. *Verdict:
   confirm; keep it as an open loop* — a small reader ("evidence awaiting review
   that you did not upload", D-043) belongs with a later slice's API work.
   Accountability for the review stays with the organisation (s.8(1)).
10. **Defect fixed: an answered question's picker opened on "Choose…".** The
    form mounted before the answers arrived (on `main` too); it now re-opens on
    the saved answer whenever that answer loads or changes. *Verdict: confirm.*
    Without it, an answered question looked unanswered, and "Update answer" asked
    for a level again.
11. **"Owner" became "Suggested owner"** on each question: it is the bank's
    suggestion; the person who owns the work is named on the gap's action.
    *Verdict: confirm.*

**Client-hosted deployment (proposed Slice 15):** nothing in B2 adds a hosted-only
dependency — no new package, service, font or environment variable; the icons are
the bundled `lucide-react` B0 already uses.

## 9. Evidence

- **Gates** (local stack rebuilt to the clean seed on 2026-10-18): core
  **1,268** (+17, `assessment-display.test.ts`), web unit **569** (+11,
  `assessment-pages.test.ts`; the paging guard lowered — N5, N2's "owed" words,
  F2.5's four), RLS **541**, typecheck, `check:secrets`, `db:types --check`; all
  **23** CI SQL gates (no migration); full e2e **422/422** (one clean run passed 420; the Reports
  page's organisation-switcher flake and two processor specs that need a fresh
  seed — they fail only on a database an earlier run wrote to — are green alone on
  a clean seed) locally (one worker,
  production build). CI is the authority. New or changed e2e: the list's label,
  date, progress, search and Open; the header line and progress bar; a domain at
  a time (pills, a card opens its domain, Next / previous, the link remembers it
  across a reload); Unanswered only; the claim picker in words; the department
  owner's default and All questions; a programme role opening on all; evidence in
  words with the `E0` tooltip, and Rejected named; the gap register found by
  owner and never by code; the register gaps found through search; the bank's
  purpose line, units and labels; "Not started" on the assessment's scorecard.
- **Screenshots** (laptop and phone, `.webp`):
  `docs/testing/slice10_5-b2/{before,after}/` — the assessments list, the
  assessment page as the Registrar (top, the domain steps, the Score tab) and as
  the Controller of Examinations (top, the domain steps), the gap register, the
  register gaps, and the question bank as the consultant.
- **Code**: core `packages/core/src/assessment-display.ts` (status labels, the
  claim scale, the evidence sentences, the role matcher, pill names);
  `components/data/paged-list.tsx`; `components/ui/progress-bar.tsx`; the
  assessment page, answer panel, list, gap register, register gaps, question bank
  and the five evidence/document lists.
