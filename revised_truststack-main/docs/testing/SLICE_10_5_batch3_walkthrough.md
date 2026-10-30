# Slice 10.5 · Batch B3 — walk-through: the registers

Built 2026-10-18 on `slice/10-5-b3-registers`, off `main` (B0–B2 are live), its
PR straight into `main` (D-104.9, D-113) — so approving it puts it on the live
site when it merges. Opened by "Start Slice 10.5 Batch B3", from the fix list
you approved with the recommendations (D-104: F3.1–F3.12), the paging additions
N6 and N7 (D-107), and B1's narrowing of F3.1 to the menu labels (D-110.10).

**Nothing about the data, the law, the score or who may do what changed**: no
API, permission, model, migration or seed change. Every number on these pages is
still the database's — the record's completeness and risk, the tabs' points, the
retention periods (stored in months, as before), the rights clock. Every
`data-testid` a test used is still there; a few were added (the tabs, the More
menu, the list's request status, the import template). The manual test is
`docs/testing/SLICE_10_5_batch3_manual_test.md` (about 25 minutes). Its gate:
**"Batch B3 approved"**.

> **Approved 2026-10-18 with one change (D-117):** the s.7(a) ground reads "A
> specified purpose the person voluntarily gave the data for, and has not said
> they do not consent to its use (s.7(a))" — the closer wording, chosen at the
> gate over the fix list's "has not objected to". Still listed for counsel.

## What you are approving

1. **One name per register (U05, F3.1)** — the menu says what the top bar says:
   Processing register · Breach register · Rights and grievances · Notice and
   consent · Processors · Retention register · AI risk register.
2. **A processing record in five tabs (U15, F3.2, F3.4, F3.5)** — Who and what ·
   Purpose and ground · Systems and processors · Retention and security ·
   Evidence, each with its points; one sticky **Save** for every tab; a blank
   record says why it is High; s.7(a) in the Act's terms.
3. **The processing register's one primary action (U14, F3.3)** — "Add a
   processing activity"; Import, Export, Ask the register and Gaps under **More**.
4. **Notice and consent in tabs (U33, U34, F3.6, F3.7)** — Notice · Widget ·
   Consent records; purposes by their titles; no stale model version; twenty
   pending languages in one line; a blank notice is not told off.
5. **Processors, retention, AI, rights in words (U35–U38, U31, F3.8–F3.11)**.
6. **Import and look-up (U17, U18, F3.12, N6, N7)** — a template to download;
   the rejected rows and the look-up results paged and searchable; a purpose line;
   one kind of person once.

---

## 1. The menu (U05, F3.1)

| Menu (before) | Menu and top bar (after) |
|---|---|
| Processing | **Processing register** |
| Breaches | **Breach register** |
| Rights & grievances | **Rights and grievances** (the top bar said "&" too) |
| Notice & consent | **Notice and consent** |
| Processors | Processors |
| Retention | **Retention register** |
| AI risk | **AI risk register** |

The browser tab follows: "Processing Activity Register", "Retention" and "AI
risk" became "Processing register", "Retention register" and "AI risk register".
Every name fits one line at laptop width and in the phone's drawer (an e2e test
measures it). `app-shell.test.ts` now also pins label = title for every register.

## 2. A processing record (U15, F3.2, F3.4, F3.5)

| | Before | After |
|---|---|---|
| Layout | Thirteen area boxes and an "Other details" box down one long page, the Save button at the very end, stored evidence below that | **Five tabs**, each with its points (below); the chosen tab in the link (`#systems`); every tab stays loaded, so a half-filled tab survives a switch |
| Save | One button at the end of the page | **One Save, in a bar that stays at the bottom of the screen** — it saves every tab at once ("Create the record" on a new one) |
| Tab badges | — | An existing record: the points the register **saved** ("26/34", amber; "16/16", green). A new record: what the tab is worth ("34 pts") |
| Blank record's risk | "High" | "High" and, under it, "**Risk: High until the unknowns are answered.**" (only on a new record while a "Not known" answer is raising it) |
| s.7(a) in the ground picker | "s.7(a) · Data the person gave for a purpose they asked for" | "**A specified purpose the person voluntarily gave the data for, and has not said they do not consent to its use (s.7(a))**" (D-117); every ground now reads words first, the section in brackets ("Employment purposes (s.7(i))") |
| Fourth Schedule picker | "A3: An educational institution — …" | "An educational institution — … (A3)" |

**Where each area went** (the thirteen areas, their weights and rules are
unchanged — D-061):

| Tab | Areas (points) | Also on it (not scored) |
|---|---|---|
| Who and what (34) | Processing activity identity (8) · Department and owner (8) · Data Principals — with the children's questions (8) · Personal data categories (10) | — |
| Purpose and ground (24) | Purpose and lawful ground (10) · Collection source (6) · Notice and consent (8) | Rights workflow · Grievance channel |
| Systems and processors (16) | Systems (8) · Processors / vendors — with "stored or sent outside India?" (8) | Sharing and disclosure |
| Retention and security (22) | Retention (8) · Security safeguards — with "AI or automated processing?" (8) · Risk and review (6) | — |
| Evidence (4) | Evidence (4) | The stored files: attach, download, review |

## 3. The processing register (U14, F3.3)

| | Before | After |
|---|---|---|
| Actions | Six equal buttons: Add a processing activity · Import from a spreadsheet · Export (CSV) · Ask the register · Gaps and actions | **Add a processing activity** (the one primary) and **More ▾** — Import from a spreadsheet · Export (CSV) · Ask the register · Gaps and actions |
| Keyboard | — | Tab to More, Enter opens it, Tab walks the items, Escape closes it; a click outside closes it |
| A role that cannot write | Saw Export, Ask, Gaps | The same, under More (Import and Add stay hidden — `<Can>`, and the API refuses) |

## 4. Notice and consent (U33, U34, F3.6, F3.7)

| | Before | After |
|---|---|---|
| Layout | One long page: counts, notice, widget (with its 23-language form), record a consent, look up a person, latest choices | The counts on top, then **Notice · Widget · Consent records** tabs — badges "Published", "Live v1", and the number of people (or "2 unverified", amber) |
| Purposes in staff views | "offers admissions, alumni_updates, event_photos" | "offers **Admissions, Alumni updates, Photographs …**" — the notice's own titles, in the widget line, the record form, the latest choices and the look-up |
| Counts note | "… puts the children's-data penalty head at risk (exposure model 1.3.0)." | "… puts the children's-data penalty head at risk." |
| Widget languages | 23 boxes, twenty saying "(translation pending)" | English, Hindi, Marathi, then one line "**20 more languages — translation pending**" that opens to offer any of them (it opens by itself when one is already offered) |
| A new notice | Four validation messages before anything is typed | None until you leave a purpose field or press Save; a saved draft shows what is still missing when it opens (so you can see why Publish is greyed out) |

## 5. Processors, retention, AI, rights (U31, U35–U38, F3.8–F3.11)

| | Before | After |
|---|---|---|
| Processors tile | "Never assessed 2" (both have a v1 awaiting review) | "**No accepted assessment** 2" |
| Questionnaire summary | "Answered · not applicable · of — 43 · 1 · 44" | "**Progress** — 43 answered, 1 not applicable, of 44" |
| Unevidenced claims | "Claimed, no evidence: A3, C4, G1." | "Claimed, no evidence: **Is the vendor ISO/IEC 27001 certified? (A3); Do they commission independent penetration testing at least annually? (C4); Is a signed contract (Data Processing Agreement) with DPDP clauses in place with the vendor? (G1).**" — the Review tab's per-section line too |
| Retention periods | "120 months", "12 months" | "**10 years**", "**1 year**"; "18 months" stays months. The form still takes months and says "10 years." beside the box |
| AI system's exemption | "Exemption relied on (Fourth Schedule): A3 — An educational institution — tracking for its educational activities or children's safety" | "Exemption relied on (Fourth Schedule): **Educational institution (A3)**" — the Schedule's full words on hover and in the picker |
| Rights list status | "Fulfilled" / "Resolved" (the filter says "Responded") | "**Responded — Fulfilled**" / "**Responded — Resolved**", as the record says it |

## 6. Import and look-up (U17, U18, F3.12, N6, N7)

| | Before | After |
|---|---|---|
| Import — starting point | Nothing to start from | "**Download a template (CSV)** — one column for each thing the register records; only the activity's name is required." Thirty columns, named as the workbook names them (the importer's own header list) |
| Import — rejected rows, notes, problems | Plain lists | Paged, searchable tables ("Row 7 · Use a date like …"); search by row number or reason |
| Look-up — purpose | Only the "not a statutory record" line | "Two questions the register answers in seconds: what personal data you hold about a kind of person — the summary a person may ask for (section 11(1)) — and what a system or a processor touches, the first question when something goes wrong." (the positioning line kept) |
| Look-up — people | "Applicant" and "Applicants" | **"Applicant" once** — it finds the records that say either |
| Look-up — results | A list of cards | A paged, searchable table: the activity (name, ID, risk "High") and what the record says |

## 7. What did not change

- **No API, permission, model, migration or seed change.** Same readers, same
  shapes; the tab points sum the areas the register returned with the record.
- **Rules**: completeness /100 and risk are the database's (D-061); risk may be
  raised, never lowered; retention is stored in months (Rule 8(3)); the rights
  clock is core's; a s.9(3) exemption is still required before tracking children.
- **Who may do what**: every link stays behind its `<Can>`; the API and RLS
  still enforce. Nobody reviews their own upload (D-043).
- **Legal text**: every citation kept — folded into brackets, never dropped
  (pitfall 1); D-011's positioning line stays on the register, import and look-up.
- **Old exports still import**: a CSV exported before B3 carries the old s.7(a)
  words; the importer still reads them (a core test pins it).
- **Reports** still say "Never assessed" (the Processor Exposure Report) — reports
  are B4's.

## 8. Before and after

Screenshots, laptop and phone: `docs/testing/slice10_5-b3/{before,after}/` — the
menu (phone drawer), the processing register, a record (existing and new), the
import, the look-up, the breach and rights registers, a request, consent, a new
notice, processors and a processor, retention and a schedule, AI and an AI
system — all as the Registrar.

## 9. Claude's calls (D-116) — confirm or change

As your DPDP consultant: each call with a verdict, its basis (statute checked in
`docs/legal/` with `pdftotext`; TrustStack's own method named as such), and the
risk if wrong. Counsel confirms wording; the product never claims counsel has
reviewed it.

1. **A tab's badge is the points the register saved.** An existing record shows
   "26/34" from the record's own areas (D-061: completeness is derived by the
   database, never by the browser); a new record shows what each tab is worth
   ("34 pts"), as nothing is saved yet. While you edit, the area boxes inside show
   the live preview (as before) and the summary says "(if saved)"; the badge moves
   on Save. *Verdict: confirm.* TrustStack's method. *Risk if wrong:* none to the
   data — at most a badge one Save behind the boxes.
2. **The thirteen areas into five tabs (§2's table)**, with the unscored details
   split by meaning: rights workflow and grievance channel beside notice and
   consent (what the person is told and how they act — s.5(1)(ii)–(iii), s.13);
   sharing beside systems and processors. *Verdict: confirm.* A display grouping;
   weights unchanged.
3. **The stored files sit on the Evidence tab but outside the record's form** (a
   web form cannot hold another form): attaching a file is its own step, as
   before, and does not need Save. The Save bar sits below everything and stays
   on screen. *Verdict: confirm.*
4. **s.7(a) — "A specified purpose the person voluntarily gave the data for, and
   has not said they do not consent to its use (s.7(a))"** — built first as the
   fix list's "has not objected to"; **changed at the gate (D-117)** to this closer
   alternative. The Act: "for the
   specified purpose for which the Data Principal has voluntarily provided her
   personal data …, and in respect of which she has not indicated to the Data
   Fiduciary that she does not consent to the use of her personal data". *Verdict
   (at the gate): Aniket chose the stricter wording* — it tracks "has not
   indicated … that she does not consent" more closely than "has not objected
   to"; still for counsel to confirm. The old gloss ("a purpose
   they asked for") was wrong — it dropped "voluntarily" and the objection limb.
   To fit the approved words, **every ground now reads words first, section in
   brackets** ("Consent of the person (s.6)"), as F3.10 does for the exemptions.
   *Risk if wrong:* a ground recorded on a misreading of s.7(a); the register's
   ground is the organisation's position for counsel (D-011), never a legal
   opinion.
5. **"Risk: High until the unknowns are answered" shows on a new record only,
   while a "Not known" answer is raising it** — the preview's own rating, never a
   new number. *Verdict: confirm.* Unknown counts as risk (D-026) — TrustStack's
   rule, not statute.
6. **More is a native disclosure**, not a script-built menu: it works with Tab,
   Enter and Escape without help, and every item stays in the page behind its own
   permission gate. *Verdict: confirm.*
7. **Consent: the counts stay above the tabs** (the unverified-guardian alert is
   seen on every tab); purposes take the **published** notice's title (a draft's if
   none is published; an unknown key shows as it is); "(exposure model 1.3.0)" is
   dropped rather than updated — a model version is not for a DPO, and the
   penalty-head sentence stays. *Verdict: confirm.* s.9(1) and Rules 10–11 are
   still cited at the top.
8. **A notice's checks show once a purpose field is left or Save is pressed**; a
   saved draft shows them as it opens. Publish stays disabled while any remains.
   *Verdict: confirm.* Rule 3(b)'s itemisation is unchanged.
9. **"No accepted assessment"** counts the processors without an accepted, current
   assessment — awaiting review, with the vendor, or never started (the number is
   the reader's `neverAssessed`, unchanged). *Verdict: confirm.* s.8(2) requires a
   valid contract, not an assessment; the assessment is TrustStack's due
   diligence. The report's "Never assessed" moves with B4.
10. **Years only when whole**: 120 → "10 years", 18 → "18 months"; the form keeps
    months (the database counts calendar months; Rule 8(3) sets at least one
    year) and says the years beside the box. *Verdict: confirm.*
11. **The exemption's short names are TrustStack's**, e.g. "Educational
    institution (A3)", "Clinical health services (A1)" (the Schedule's A1 also
    covers mental-health establishments — the full words are in the tooltip and
    the picker). Checked against the Fourth Schedule (Rule 12) in the Gazette.
    *Verdict: confirm.*
12. **The rights list says "Responded — Fulfilled"**; the filter keeps the status
    alone ("Responded"), so the two start with the same word; sorting follows the
    phrase. *Verdict: confirm.* Rule 14(3)'s ninety days are unchanged.
13. **The import template is the header row only** — the thirty columns the
    importer reads, by the workbook's names; no example row (a sample could be
    imported by mistake). *Verdict: confirm.*
14. **People types fold only when the singular is inside the plural**
    ("Applicant"/"Applicants", "Address"/"Addresses"), because the look-up
    matches words as written; "University"/"Universities" stay apart. *Verdict:
    confirm.*
15. **The look-up's purpose line names s.11(1).** The right to a summary is for
    processing on consent or s.7(a) (s.11(1)); the page's own note already says
    the summary is a draft to check before sending. *Verdict: confirm.*
16. **Small extras on the way**: the import's error details and the look-up's
    risk ("High", not "high") use the same table and labels as everywhere else.
    *Verdict: confirm.*

**Client-hosted deployment (proposed Slice 15):** nothing in B3 adds a hosted-only
dependency — no new package, service, font or environment variable; the import
template is built in the browser from core.

## 10. Evidence

- **Gates** (local stack rebuilt to the clean seed on 2026-10-18): core
  **1,292** (+24, `register-display.test.ts`), web unit **583** (+14,
  `register-pages.test.ts` and the menu test; the paging guard lowered for N6 and
  N7), RLS **541**, typecheck, `check:secrets`, `db:types --check`, all **23** CI
  SQL gates (no migration); full e2e **423/423** in one clean run (+1, the menu
  names) locally (one worker, production build). CI is the authority. New or changed e2e: the menu names on a laptop and in the phone
  drawer; the register's one primary and More (keyboard Escape); a new record's
  risk line and tab worth; filling four tabs, one Save, the tabs' saved points;
  two tabs saved once and both back after a reload; the s.7(a) option; consent's
  tabs, purpose titles, folded languages, no model version; a blank notice
  without problems; "No accepted assessment", claims by question, progress in
  words; "10 years", "1 year" and the form's "1 year."; the exemption's short name
  and tooltip; "Responded — Resolved" in the list; the template download; the
  rejected rows searched; the look-up's purpose, folded people and searched
  results.
- **Code**: core `packages/core/src/register-display.ts` (periods, exemption
  names, request status, questionnaire progress, people types, the record's tabs
  and points, the import template); `components/ui/more-menu.tsx`; the record view,
  the register, consent, the notice editor, the questionnaire, the retention,
  AI and rights pages, the import and the look-up.
