# Slice 10 · Stage 6 — manual test, step by step

> **Re-test after your head-2 change (model 1.6.0, D-098).** Your laptop's
> database was rebuilt from scratch with it, so what you did in Steps 1–5 is
> gone. **Do "Before you start" again, then every step from Step 1.** Step 5's
> Expect changed (head 2); the rest is as before.

About **20 minutes**. Eleven steps. Each one says **what to do** and **what you
should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack), not the
live site: a report, a document link on a closed breach and an exposure
snapshot are all permanent. You play four people. The point of this stage:
the CISO, counsel and procurement each get their own report, every register's
documents are evidence, and nothing personal leaves a register.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 6:
   ```bash
   git checkout slice/10-workflow-modules && git pull
   ```
   The Stage 6 migration and the seed are **already on your laptop's
   database** — Claude rebuilt it from scratch on 2026-10-16. **Do not run
   `pnpm db:migrate` or `pnpm db:seed` in a plain Terminal**: the project's
   `.env.local` points at the **live** database.
4. Start the app:
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line — usually **http://localhost:3001**. If it prints
   another port, use that everywhere below.
5. **Password for every user:** `ci-local-only-Passw0rd-not-secret`
6. To change person: **Sign out** (top right), then sign in as the next one.
7. Have a small PDF or text file ready to upload (any file of yours).

| Short name | Email | Who they are |
|---|---|---|
| **CISO** | `ciso@mumbai-university.example.com` | Mumbai University's IT/Security Lead — writes the breach register |
| **Legal** | `legal@mumbai-university.example.com` | Legal User — writes the rights register |
| **Admin** | `it.admin@mumbai-university.example.com` | Organisation Admin — generates reports |
| **BML** | `admin@bharat-manufacturing.example.com` | Bharat Manufacturing's admin — an empty organisation |

---

## Part A — documents on a breach and a request

### Step 1 — a closed breach takes a document, and keeps it

**Do:** Sign in as **CISO** → **Breach register** → open **BRH-2026-001**. Scroll to
**Documents**. Choose your file → **Attach**.

**Expect:** The panel said "Nothing attached yet…" and now lists your file with
"review: pending" and a **Download** link — but **no Detach**: the breach is
Closed, and a closed breach keeps what its closure stands on.

### Step 2 — an open breach's document can be detached

**Do:** **Breach register** → **Record a breach** → title "Manual test — laptop left
in a taxi", any nature → **Save**. Under the title box you should see the new
hint first. On the new breach, attach your file under **Documents**, then press
**Detach** next to it.

**Expect:** Under **Short title**: "describe what happened, never name the
people affected". After Attach the file is listed **with** Detach; after Detach
the list says "Nothing attached yet…" again. (The file itself is kept — only the
link went.)

### Step 3 — a request's response sent

**Do:** Sign out → sign in as **Legal** → **Rights & grievances** → open **DPR-2026-001**
(Responded). Attach your file under **Documents**.

**Expect:** Listed, with **no Detach** — the request is answered, so what was
sent stays. Nowhere in the panel is the requester's name or email repeated.

## Part B — the evidence index (as Admin)

### Step 4 — every register's documents, named as the register names them

**Do:** Sign out → sign in as **Admin** → **Reports** → under "Working files
(Excel)" → **Evidence Index** → **Generate**. When it says ready, **Download**
and open it in Excel. Find your file's rows (filter column A).

**Expect:** One row for **BRH-2026-001** ("Personal data breach", the incident
title, "Head 2") and one for **DPR-2026-001** ("Rights request or grievance",
"Access to information", "Head 7") — **no person's name**. MU's processor
documents show "Vendor · Processor register · … · Head 1, Head 7".

## Part C — the three reports (as Admin)

### Step 5 — Security and Breach Report

**Do:** **Reports** → under "Reports (PDF)" → **Security and Breach Report** →
**Generate** → **Download**, open the PDF.

**Expect:** "For the CISO and the incident response team"; the header says
**Exposure model 1.6.0**. Page 1: tiles for **2. Breach notification (s.8(6))**
— **Partially mitigated** (model 1.6.0: a recorded breach assesses head 2) —
and **1. Security safeguards (s.8(5))** with its stored status, then "Detailed reports to the Board overdue" and "Affected
people not yet told". **The breach register (s.8(6), Rule 7)**: counts, then
BRH-2026-001 and your manual-test breach — the Board "without delay" time, the
detailed report's clock ("Made …" or "…remaining"), whether the people were
told, and the number of documents (1 on BRH-2026-001). The note that 48 h / 12 h
alerts are TrustStack targets. Under **Penalty heads 2 and 1**, head 2 comes
first, with the reasons "2 personal data breaches are recorded in the breach
register (s.8(6), Rule 7), so this head is assessed from them." and (your
manual-test breach) "affected Data Principals are not recorded as intimated
(Rule 7(1))". Both caveats at the end.

### Step 6 — Legal Position Report

**Do:** Generate and open **Legal Position Report**.

**Expect:** Heads **3** and **7**. **Rights** — "Open past TrustStack's 30-day
target — a target, not a statutory period" and "past the ninety days the Rules
allow (Rule 14(3))", requests named by code and kind only. **Notice and
consent** — MU's published notice and widget version. **Children** — consents
on behalf of a child. **Retention** — **ROPA-009** listed as an overdue erasure
("No erasure recorded"), the sentence "An erasure counts only when it is
complete…", and "No Third Schedule class is recorded…". **AI systems — an
enabling note, not a status** — the AI proctoring row counted as tracking
children, **no** warning (MU records exemption A3), and "head 4 does not apply".

### Step 7 — Processor Exposure Report

**Do:** Generate and open **Processor Exposure Report**.

**Expect:** Heads **1** and **7**. The register: **LMS provider** ("Contract:
Yes. DPDP clauses: No." in red), **Payment gateway provider**, **AI proctoring
vendor** ("DPDP clauses: Not known" in red, assessment "Awaiting review").
**Contracts to fix** lists the LMS and proctoring vendors with what each needs
(s.8(2), s.8(7)(b), Rule 6(1)(f)). No respondent's name or email anywhere.

### Step 8 — a new version, never an edit

**Do:** In the reports table, press **New version** on the Legal Position Report.

**Expect:** A **v2** row appears; v1 is still listed and still downloads.

## Part D — who may, and the empty state

### Step 9 — a contributor may not generate

**Do:** Sign out → sign in as **Legal** → **Reports**.

**Expect:** No "Generate" buttons for the three new reports (Legal holds no
`report.generate`); the reports Admin made are listed.

### Step 10 — an empty organisation

**Do:** Sign out → sign in as **BML** → **Reports** → generate **Legal Position
Report** and open it.

**Expect:** It still has every section, each saying so: "No privacy notice has
been published.", "No consent widget version is published…", "No erasure is
overdue.", and both caveats.

### Step 11 — nothing from one organisation in the other

**Do:** Still as **BML**, open **Breach register** and **Rights & grievances**.

**Expect:** Empty registers — nothing of Mumbai University's, including the
documents you attached in Part A.

---

When done, reply **"Stage 6 approved"** (or "approved with changes: …") with
anything that differed.
