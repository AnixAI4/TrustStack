# Slice 7 — manual test: the Processing Activity Register (ROPA)

A step-by-step check of revised Slice 7 by hand (D-061 to D-067), with what to
expect at each step. Written 2026-10-03 against PR #21 (`slice/07-ropa`, merged `714749c`).
About 45 minutes end to end.

## Before you start

**Where.** The live site: https://revised-truststack-web.vercel.app
(PR #21 was merged on 2026-10-03.)

**Sign-ins.** All use the seed password — `SEED_USER_PASSWORD` in the
repo-root `.env.local`.

| Who | Email | Used for |
|---|---|---|
| Consultant | `consultant@anix-ai.example.com` | Does the work; owns the record under approval |
| Registrar | `dpdp.owner@mumbai-university.example.com` | The second person: approves |
| Legal | `legal@mumbai-university.example.com` | Can edit, cannot approve |
| Dean | `dean@mumbai-university.example.com` | Read-only check |
| BML owner | `dpdp.owner@bharat-manufacturing.example.com` | A second, empty organisation |

**Starting state** (checked 2026-10-03, after the live e2e run): Mumbai
University (MU) has the workbook's 10 records and its 66 register gaps already
generated; Bharat Manufacturing (BML) has no records and no gaps. Name anything you create with
`Manual …` so it is easy to spot. `pnpm db:seed` puts the 10 seeded records
and their gaps back as they were.

**Test files** are in `docs/testing/slice07/`:

| File | What it is |
|---|---|
| `manual-import-8-good-2-bad.csv` | 10 rows: row 4 has no name, row 7 has the review date "next year" |
| `manual-import-8-good-2-bad.xlsx` | The same rows as Excel (names start `Manual XL`); C2 is a formula |
| `manual-macro-refused.xlsx` | A workbook carrying a macro part — must be refused unread |

**Date note.** The seeded records are due for review on 2026-10-03. Tested
on that day, "Review overdue" shows **0**; from 2026-10-04 it shows **10**.

## Part A — Read the register (as Consultant, MU)

| # | Do this | Expect |
|---|---|---|
| 1 | Sign in as the Consultant. Click **Processing register** in the left nav. | Heading "Processing Activity Register". Summary: Processing activities **10** · Not yet usable **0** · High or critical risk **8** · Approved **0** · Review overdue **0** (see date note). Band chips: **10 Usable**. |
| 2 | Read the table. | Ten rows, ROPA-001 to ROPA-010. Scores and risk: 001 **70** High · 002 **62** Critical · 003 **70** High · 004 **70** High · 005 **80** Medium · 006 **70** High · 007 **70** Critical · 008 **70** Critical · 009 **78** High · 010 **78** Medium. |
| 3 | Set the **Risk** filter to Critical. | Only 002, 007, 008. Clear the filter. |
| 4 | Open **ROPA-004** (LMS learning activity). | Thirteen areas, each marked complete or missing. A notice reads "**1 linked Data Processor has no contract or no DPDP clauses**". The risk line names its factors and ends "· risk model 1.0.0". |
| 5 | Open **ROPA-005** (HR payroll). | Ground is **Employment** (s.7(i)). The line reads "a notice is not required (good practice); consent is not the basis". Score 80. |

## Part B — Gaps and the roadmap (as Consultant)

Do this before you edit anything, so the numbers match.

| # | Do this | Expect |
|---|---|---|
| 6 | Back on the register, click **Gaps and actions**. | Heading "Register gaps and actions". Either nothing is generated yet, or (after the live e2e run of 2026-10-03) the 66 gaps of step 7 are already there. |
| 7 | Click **Generate the register's gaps** (or **Regenerate from the register**). | **66** open gaps: **16** Critical, **30** High, **20** Medium. The button now says "Regenerate from the register". |
| 8 | Read the gaps for ROPA-004. | Includes "processor contract missing" and "AI unreviewed". ROPA-005 and ROPA-010 have the fewest (4 each). Every gap has a "What to do" fix and an action. |
| 9 | Open one action: assign an owner, set a due date, move it to In progress, and save. | It saves. The roadmap view groups it by its due window. |
| 10 | Click **Regenerate from the register** again. | Still 66. Your action keeps its owner and status — regenerating never duplicates or resets actions. |

## Part C — Add a record from a template (as Consultant)

| # | Do this | Expect |
|---|---|---|
| 11 | Register → **Add a processing activity**. | A form with a picker: "Start from a common activity…". The education list includes "Student grievance handling" and "AI proctoring, chatbot or analytics". |
| 12 | Choose **Student grievance handling**. Rename it `Manual grievance test`. | Name, "Whose personal data" (Students) and Purpose are filled in. Everything else is blank — a template is only a starting point. |
| 13 | Set the lawful ground to **Consent**. | The line reads "a notice is **needed**; consent is **needed**". |
| 14 | Change the ground to **Employment**. | The line flips to "not required (good practice)… not the basis". Set it back to Consent. |
| 15 | Set **Children's data involved?** to **Yes**. | Two new questions appear: "Verifiable parental consent obtained?" and "Any tracking, behavioural monitoring or targeted advertising of children?", plus a "Fourth Schedule exemption claimed" choice. Set it back to **No**: they disappear. |
| 16 | Fill **How long it is kept** but leave the retention trigger empty. | The "Retention and erasure" area stays **missing** — a rule needs its trigger. |
| 17 | Choose the trigger **Kept as long as a named law requires, then erased**. | A new field appears: "Which law requires keeping it". Retention is complete only once that is filled too. |
| 18 | In the Rule 6 safeguards checklist, tick **Encryption…** and **Access logs…**. | Two of six ticked. The "Security safeguards" area shows what is still missing. |
| 19 | Click **Create the record**. | "Saved. Completeness and risk were recalculated by the register." The status is **Draft**. The register's total is now **11**. |

## Part D — Raising the risk needs a reason (as Consultant)

| # | Do this | Expect |
|---|---|---|
| 20 | On `Manual grievance test`, set "Assessor's rating" to **Critical** and leave the reason empty. Click **Save changes**. | Refused: "**Say why the risk rating is raised — the reason is kept with the rating.**" |
| 21 | Type a reason, such as `Manual: grievances include health details`, and save. | Saved. Risk shows **Critical; raised by an assessor**. The reason is kept. |

## Part E — Approval by a second person

| # | Do this | Expect |
|---|---|---|
| 22 | As Consultant, open **ROPA-005**. Set **Owner** to yourself (the Consultant) and save. Click **Submit for review**. | Status **In review**. The note: "Approval needs a reviewer who is not the record's owner…" and "You own this record, so another reviewer must approve it." |
| 23 | Click **Approve** anyway. | Refused: "**The record's owner cannot approve it — another reviewer must.**" Status stays In review. |
| 24 | Sign out. Sign in as **Legal** and open ROPA-005. | **No Approve button** — only "Send back to draft" and "Archive". Legal can edit but is not a reviewer. |
| 25 | Sign out. Sign in as the **Registrar** and open ROPA-005. Click **Approve**. | Status **Approved**. "Approved by … on [today]". Last reviewed = today. Next review = **2027-10-03** (a year out). The form is read-only: "This record is approved, so it is read-only. Reopen it…". |
| 26 | Go back to the register. | Approved **1**. |
| 27 | On ROPA-005, click **Reopen to correct it**. | Status **Draft**. The header now says "**version 2**". Approved goes back to 0. |
| 28 | Submit `Manual grievance test` for review and try to approve it as the Registrar. | If its score is 60 or below: refused, "A record must be at least Usable (61/100) before it can be approved." |

## Part F — Import (as Consultant)

| # | Do this | Expect |
|---|---|---|
| 29 | Register → **Import from a spreadsheet**. Choose `manual-import-8-good-2-bad.csv` and click **Check the file**. | "1. How the columns are read": Processing Activity → name, Data Principal Type, Purpose, Risk Rating, Next Review all matched. Nothing is imported yet. |
| 30 | Read "2. What will happen". | **8** rows can be imported · **2** cannot. "Row 4: The processing activity needs a name." "Row 7: Use a date like 2026-12-31 or 31/12/2026." Row numbers match the spreadsheet (header = row 1). |
| 31 | Click **Import 8 rows**. | "Imported **8** records as Drafts." Click **Go to the register**: 8 `Manual …` rows appear as Draft, each with a low score (Not yet usable goes up by 8). |
| 32 | Import `manual-import-8-good-2-bad.xlsx` the same way. | Same result: 8 importable, rows **4** and **7** rejected, 8 imported (`Manual XL …`). Open "Manual XL Alumni newsletter": its Purpose is "Sending alumni news and events" — the formula's displayed **value**, not the formula. |
| 33 | Try `manual-macro-refused.xlsx`. | Refused before it is read: "**The file contains macros. Save it as a plain Excel workbook (.xlsx) and try again.**" Nothing is imported. |
| 34 | Try any `.pdf` or `.xlsm` file. | "Choose an Excel workbook (.xlsx) or a CSV file. Macro workbooks (.xlsm) are not accepted." |

## Part G — Ask the register, and export

| # | Do this | Expect |
|---|---|---|
| 35 | Register → **Ask the register**. On "Whose data", type **Student** and look it up. | The seeded matches are **7**: ROPA-002, 003, 004, 006, 007, 008 and 009 (plus any `Manual` records whose data mentions students). |
| 36 | Switch to **System** and choose **Student ERP / SIS**. | "Student ERP / SIS is used by **5** processing activities": ROPA-001, 002, 003, 006 and 007, with whose data it affects. |
| 37 | Register → **Export (CSV)**. Open the file in Excel. | One row per record, in the workbook's column names. The first line starts with `#` and says this is a DPDP readiness register, not a statutory record. Extra columns follow the workbook's: Status, Version, Completeness /100, Derived risk, and more. Any cell starting with `=`, `+`, `-` or `@` is prefixed with `'`, so Excel shows it as text and never runs it. Step 21's reason is in the column "Risk raised by assessor because", next to "Risk model version" = 1.0.0. |

## Part H — Permissions and the second organisation

| # | Do this | Expect |
|---|---|---|
| 38 | Sign in as the **Dean** and open the register. | Everything is readable. No "Add a processing activity" or "Import" buttons. A record has no Save, Submit or Archive buttons. |
| 39 | As the Dean, open `/dashboard/ropa/new` directly. | "You do not have permission to add processing records." |
| 40 | Sign in as the **BML owner** and open the register. | Processing activities **0**, and the empty message: "No processing activities are recorded yet…". None of MU's records are visible. |
| 41 | BML → **Gaps and actions** → **Generate the register's gaps**. | Exactly **1** gap, **Critical**: the organisation has no processing records. |

## Clean up

Archive the `Manual …` records (record → **Archive**), or ask for a re-seed
(`pnpm db:seed`). The re-seed restores the 10 records and clears MU's and
BML's register gaps. The automated hosted tests make their own records
(`E2E ROPA …`) and do not depend on what you leave behind.

## If something differs

Note the step number, who you were signed in as, and what you saw (a
screenshot helps). The most likely causes:

- the date (step 1's overdue count);
- someone else having edited the hosted data since the re-seed (counts in steps 1, 7 and 35).
