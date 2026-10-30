# Slice 10.5 · Batch B2 — assessment, evidence and gaps: manual test, step by step

About **25 minutes**. Fourteen steps, one per fix. Each one says **what to do**
and **what you should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack). This
batch changes how the assessment, its evidence and the gap registers read and
page — and **nothing** about the data, the law, the score or who may do what. The
walk-through is `docs/testing/SLICE_10_5_batch2_walkthrough.md`.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Batch B2 (no new packages, no migration):
   ```bash
   git fetch && git checkout slice/10-5-b2-assessment && git pull
   ```
   Your laptop's database was rebuilt from scratch by Claude on 2026-10-18
   (the seed). **Do not run `pnpm db:migrate` or `pnpm db:seed` in a plain
   Terminal**: the project's `.env.local` points at the **live** database.
4. Start the app (if it is still running from before, stop it with Ctrl + C first):
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line — usually **http://localhost:3001**. If it prints
   another port, use that everywhere below.
5. **Password for everyone:** `ci-local-only-Passw0rd-not-secret`. You play:

   | Who | Email | Role |
   |---|---|---|
   | Registrar | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner |
   | Controller of Examinations | `examinations@mumbai-university.example.com` | Department Owner |
   | Anix consultant | `consultant@anix-ai.example.com` | Anix AI Consultant |

   To change person: click the initials (top right) → **Sign out**.

Everything you save in this test is on your laptop's copy only; Claude rebuilds
it afterwards.

---

## Part A — the assessments list, as the Registrar

### Step 1 — the list speaks in words, and pages (F2.6, N5)

**Do:** Sign in as the **Registrar**. Click **Assessments** in the menu.

**Expect:**
- One line saying what an assessment is, ending "Open one to answer it, attach
  evidence and see its score."
- A table: **Assessment** "Mumbai University DPDP Compass Baseline" (and
  "Baseline" under it) · **Status** "In progress" — never `in_progress` ·
  **Progress** "answered 1 of 124" · **Generated** a date like "17 Oct 2026" — no
  time of day · an **Open** button.
- A search box. Type `xyz` → "No assessments match “xyz”." Clear it.
- Click **Open** → the assessment opens.

---

## Part B — the assessment page, as the Registrar

### Step 2 — the header leads with progress (F2.1)

**Do:** You are on the assessment page (Questions tab).

**Expect:**
- Under the name: **"In progress · 1 of 124 answered · 33 may not apply —
  confirm or answer them"**, and a thin progress bar under it.
- **By domain**: sixteen cards, each "answered 0 of 8" (Governance: "answered 1
  of 8"), "· 2 may not apply" where it applies, and a small bar each.

### Step 3 — one domain at a time (N2)

**Do:** Scroll down to **Questions, one domain at a time**.

**Expect:**
- Sixteen pills — "1. Governance 1/8", "2. Personal data discovery 0/8" … "16.
  SDF 0/8" — wrapping onto a few rows. Governance is selected and only its
  eight questions are shown.
- At the bottom of the panel: **Next domain: Personal data discovery →**.

**Do:** Click **Next domain**. Then scroll up and click the **Security
safeguards** card under By domain.

**Expect:** Each click shows that one domain (the card gets a dark border). The
address bar ends `#SECURITY`. Press **reload**: you come back to Security
safeguards. At its bottom, the left button names the domain before it
(**← Data accuracy**) and the right one **Next domain: Personal data breach
readiness →**.

### Step 4 — Unanswered only (N2)

**Do:** Click the **1. Governance** pill. Tick **Unanswered only**.

**Expect:** G1.2 (the one answered question) disappears; the other seven stay.
Untick it: G1.2 is back.

### Step 5 — the claimed level in words (F2.2)

**Do:** On **G1.1**, open **How far along is this?**

**Expect:** Six levels in words — "0 — Not started", "1 — Aware", "2 — Draft or
partial", "3 — Defined", "4 — Implemented", "5 — Operational and monitored" —
then "Not Applicable" only where a question may be excluded (G1.1 is mandatory,
so it is not offered there).

**Do:** Choose **3 — Defined**.

**Expect:** A line under it: "An approved policy or process exists. Evidence
decides what it counts as."

**Do:** Click **Save answer**.

**Expect:** "You claimed **3** (Defined) → it counts as **1** of 5", and under it
in amber: "No reviewed evidence yet (evidence level 0 of 5) — this answer counts
at most 1". The header now says "2 of 124 answered" and the pill "2/8".

### Step 6 — evidence in words (F2.3)

**Do:** Look at **G1.2** (the seeded answer with the office order).

**Expect:**
- "You claimed **5** (Operational and monitored) → it counts as **3** of 5".
- In amber: "**Reviewed: Partial (evidence level 3 of 5) — this answer counts at
  most 3**". Hover over it: a tooltip "Evidence E3".
- Its picker shows **5 — Operational and monitored** already chosen (before this
  batch it could open on "Choose…").
- The file row: "office-order-dpdp-owner-SAMPLE.txt · **Reviewed: Partial
  (evidence level 3 of 5) — supports at most 3**" (hover: "Evidence E3").

### Step 7 — the scorecard says Not started (Q3)

**Do:** Click the **Score** tab.

**Expect:** On the scorecard, every domain nobody has touched reads **"Not
started"**, not "Needs Work". Governance, which has answers, keeps its own
status. The score itself is unchanged by this batch.

---

## Part C — the questions for my role, as the Controller of Examinations

### Step 8 — a department owner starts on their questions (F2.4)

**Do:** Sign out. Sign in as the **Controller of Examinations**. Open
**Assessments → Open**. Scroll to the questions.

**Expect:**
- **Questions for my role (73)** is selected, beside **All questions (124)**.
- A line: "Showing the questions suggested for your role (Department Owner). A
  guide, not a limit — choose All questions to see every one."
- Fewer pills (Grievance redressal and Personal data breach readiness are not
  there — none of their questions names a department), each counting only the
  questions for your role: "1. Governance 0/1".
- Governance shows only UNI-GOV-009 ("Suggested owner Academic Administration /
  Legal"); G1.2 is not there.

**Do:** Click **All questions (124)**.

**Expect:** All sixteen pills; Governance shows its eight questions again,
G1.2 included.

---

## Part D — the gap registers, as the Registrar

### Step 9 — the gap register is a paged, searchable table (F2.5)

**Do:** Sign out; sign in as the **Registrar**. Open the assessment → **Score**
tab → the gap register link (or go to
`/dashboard/assessments/0b000006-0000-4000-8000-000000000001/gaps`).

**Expect:**
- A table: **Gap — most severe first when sorted** (the card with its action, as
  before) · **Domain** · **Next due**, with a search box above.
- Type `nominated` → the one gap ("Is there a formally nominated DPDP owner…").
  Type `G1.2` → "No gaps match" (a question's code is never shown or searched).
  Clear it.
- Click the **Gap** header → sorted by severity; again → reversed.
- An amber line "Answers or evidence have changed since this register was
  generated…" is expected: Step 5 saved a new answer after the register was
  built. You need not regenerate; if you do, G1.1 (counts as 1 of 5) opens a
  second gap — and then the sort above shows its order.

### Step 10 — the register's gaps, the same way (F2.5)

**Do:** Menu **Processing** → **Gaps and actions** (or `/dashboard/ropa/gaps`).
Click **Generate the register's gaps** if it is offered.

**Expect:** The gaps in a table — **Gap** and **Record** columns, a search box,
25 a page with page numbers once there are more than 25. Type a record code
(e.g. `ROPA-009`) → only that record's gaps.

### Step 11 — documents page past ten (F2.5) — optional, 3 minutes

**Do:** Open any processing record (menu **Processing** → a record →
**Stored evidence**) and attach **eleven** small files (any PDF or text file,
one at a time).

**Expect:** Up to ten, the plain list as before. At eleven: "Showing 1–10 of 11"
with **Page 1 of 2** and arrows; the next page shows the eleventh. Each file
says "Awaiting review — supports nothing until it is reviewed".

---

## Part E — the question bank, as the Anix consultant

### Step 12 — the bank says what it is for (F2.7)

**Do:** Sign out; sign in as the **Anix consultant**. Menu **Question bank**.

**Expect:**
- First line: "The question bank every assessment is generated from — for Anix
  consultants only; clients never see it. …"
- Each domain row ends "weight 7", not a bare "7".
- Each pack: "Approved" or "Draft" (capital letter), and "201 questions" — a unit
  on every count. Click a pack: its questions say "v… · Approved" (or "Draft").

---

## Part F — the phone, and anything else

### Step 13 — the assessment page at phone width

**Do:** Make the browser window narrow (about a phone's width), or use the
browser's device toolbar. Open the assessment as the Registrar.

**Expect:** The header line wraps cleanly; the domain cards stack; the pills
wrap (it is a long block on a phone — say if you would rather they scroll
sideways); **Next domain** is at the bottom of each domain. The gap register on
a phone shows the card only, with the domain inside it.

### Step 14 — anything else

**Do:** Use the assessment as you normally would — answer, attach, review (as a
different person from the uploader), open the gap register.

**Expect:** Everything works as before; only the words, the paging and the one
domain at a time are new.

---

## Tidy-up

- Stop the app with **Ctrl + C**.
- Steps 5, 10 and 11 saved an answer, generated register gaps and attached files
  on your laptop's copy only. Say **"rebuild the local database"** and Claude
  puts it back to the seed.
- Then tell Claude **"Batch B2 approved"** — or what to change.
