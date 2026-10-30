# Slice 9 · Stage 4 — manual test, step by step

About **25 minutes**. Twelve steps. Each one says **what to do** and **what you
should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack), not the
live site: a report can never be deleted, and on the live site Mumbai
University is a real client.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Start the app:
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line. It is usually **http://localhost:3001** (port
   3000 is taken by another app on your laptop). Use whatever address it prints.
   The `Environments:` line must mention `.env.development.local` — that file
   points the app at your laptop's database (it is already in place).
4. **Password for every user below:** `ci-local-only-Passw0rd-not-secret`
5. Use **one private (incognito) window per person**, or click **Sign out**
   before switching person.

| Short name | Email | What they are |
|---|---|---|
| **DPO** | `dpdp.owner@mumbai-university.example.com` | Runs the programme — can make every report |
| **Exams owner** | `examinations@mumbai-university.example.com` | Department Owner — owns 6 actions |
| **Dean** | `dean@mumbai-university.example.com` | Executive Sponsor — reads and downloads |
| **BML admin** | `admin@bharat-manufacturing.example.com` | Another company — must see nothing of MU |

> The dates below assume you test on **8 October 2026**. On a later day the
> Overdue / "next 30 days" numbers shift a little — that is correct.

---

## Part A — the Reports page (as the DPO)

### Step 1 — Open Reports

**Do:** Sign in as **DPO** → click **Reports** in the top menu.

**Expect:**
- Heading **Reports**, then **Generate a report**.
- Two groups: **Reports (PDF)** with 4 cards (DPDP Exposure Brief, Programme
  Status Report, **Owner Action Pack**, **Regulator-Ready Evidence Pack**), and
  **Working files (Excel)** with 3 cards (**Gap & Action Tracker**, **ROPA
  Register**, **Evidence Index**).
- The Owner Action Pack card has a **drop-down of people**.
- Below: **Stored reports**, a table of earlier reports.

---

## Part B — the three Excel files

### Step 2 — Gap & Action Tracker

**Do:** On the **Gap & Action Tracker** card click **Generate**. Then, in the
Stored reports table, on the new top row click **Download**. Open the file in
Excel (or Numbers).

**Expect:**
- A green message: "**Gap & Action Tracker version N is ready (0.1 s)**".
- The file is named like `TrustStack_Gap_and_Action_Tracker_vN_2026-10-08.xlsx`.
- Three sheets: **About**, **Actions**, **Gaps**.
- **About** shows the organisation, date, version, and the paragraph starting
  "*This report is a DPDP readiness and assessment output…*".
- **Actions**: one row per action. The **Source** column has both
  **Assessment** and **Processing register** rows. Six rows show **Owner =
  Controller of Examinations (Department Owner)**; most others say
  **Unassigned**. The **Overdue** column says **Yes** on two of his rows.
- The header row stays frozen when you scroll, and has filter arrows.

### Step 3 — Formulas never run (safety check)

**Do:**
1. Go to **Processing register → Gaps** (`/dashboard/ropa/gaps`). On any
   action, open its editor, type `=1+1` in **Notes**, click **Save**.
2. Back on **Reports**, click **New version** on the Gap & Action Tracker row.
   Download the new version and open it.

**Expect:** In the **Notes** column you see the text **`'=1+1`** (or `=1+1`
shown as plain text) — **not `2`**. Excel never calculates anything a client
typed. *(Afterwards you may clear that note again.)*

### Step 4 — ROPA Register

**Do:** Generate the **ROPA Register**, download it, open it. Then go to
**Processing register** and click **Export (CSV)**, and open that too.

**Expect:**
- The Excel file has sheets **About** and **Register**, with **10 records**.
- The Register sheet's **column headings are exactly the same, in the same
  order, as the CSV's** second line.
- About says "**A DPDP readiness register — not a statutory record.**"

### Step 5 — Old versions are kept

**Do:** Look at the Stored reports table.

**Expect:** Every earlier version of each report is still listed (v1, v2…),
each with its own **Download** button. Nothing was overwritten.

---

## Part C — the two new PDFs

### Step 6 — Regulator-Ready Evidence Pack (+ its Evidence Index)

**Do:** On the **Regulator-Ready Evidence Pack** card click **Generate**.

**Expect:**
- The message says the pack is ready **and** "**Evidence Index version N was
  generated with it.**"
- **Two** new rows appear: the Evidence Pack (PDF) and the Evidence Index (XLSX).

**Do:** Download the **Evidence Pack** PDF and read it.

**Expect, top to bottom:**
1. **Where you stand** — the ₹ crore ceilings tile, heads at stake, days to
   13 May 2027.
2. **Your evidence at a glance** — Artefacts stored, Accepted by a reviewer,
   Awaiting review, Not linked to anything.
3. **Evidence by penalty head** — one row per head with its counts.
4. **Evidence by obligation area** — all 16 areas; some say **Enabling
   control** instead of a head.
5. **Remediation closed, and on what basis** — "No remediation action has been
   closed yet." is fine for MU.
6. **Review status of every artefact**, then a sentence naming the **Evidence
   Index file** — the **same file name** as the XLSX row from this step.
7. At the end, two boxed paragraphs: **About this report** and **About the
   exposure figures**.

### Step 7 — Evidence Index

**Do:** Download the **Evidence Index** from the same step and open it.

**Expect:** Sheets **About** and **Evidence index**. Each row is one file and
what it supports. MU has one stored file, linked to an **Assessment answer**,
named by its area and question text — **never a code like `G1.2`**.

> To see all three link types (answer, action, register record) and a "Not
> linked" row, open the sample `docs/testing/slice09-stage4/hospital-evidence_index.xlsx`.

### Step 8 — Owner Action Pack, made by the DPO for someone else

**Do:** On the Owner Action Pack card, pick **Controller of Examinations
(Department Owner)** in the drop-down → **Generate** → download the PDF.

**Expect:**
- Under the title: "**For Controller of Examinations (Department Owner)**".
- **At a glance:** Actions you owe **6** · Overdue **2** (red) · Due in the next
  30 days **2** · Closed **0**.
- An **Overdue** table with **2** actions (due 26 September and 5 October 2026).
- **Your actions, by when they are due:** small tables headed **Next 30 days
  (2)**, **31–60 days (1)**, **After 90 days (1)** — each heading on the same
  page as its table.
- Every row says where it comes from, e.g. "**Processing register · ROPA-00X ·
  …**", and the Evidence column says "**No evidence attached**".
- **Evidence to provide** lists the same 6 actions, then a line on how an
  action closes.
- At the end, **only one** boxed paragraph: **About this report** (no exposure
  paragraph — this pack has no exposure figures).

---

## Part D — who can do what

### Step 9 — The owner makes his OWN pack

**Do:** Sign in as **Exams owner** → **Reports**.

**Expect:**
- **No** "Generate a report" section. Instead **Your actions** with one card and
  a **Generate my pack** button.
- In Stored reports, **Download** and **New version** buttons appear **only on
  his own Owner Action Pack rows**. Other reports are listed but have no buttons.

**Do:** Click **Generate my pack**, then **Download** on the new row.

**Expect:** It is ready; the PDF opens and is addressed to him. (He can download
his own pack even though he cannot download other reports.)

### Step 10 — The Dean

**Do:** Sign in as **Dean** → **Reports**.

**Expect:**
- Only **Generate my pack** (the Dean cannot make Board or programme reports).
- **Download** buttons on **every** ready report (the Dean may download), but
  **New version** only on the Dean's own packs (there are none yet, so none).

### Step 11 — Another company sees nothing (privacy check)

**Do:** Sign in as **BML admin** → **Reports**.

**Expect:** BML's Stored reports says "**No report has been generated yet.**"
— none of Mumbai University's reports appear.

**Do:** In the address bar open
`http://localhost:3001/api/v1/organizations/0b000000-0000-4000-8000-000000000001/reports`
(use your port; this is Mumbai University's report list).

**Expect:** An error with **403** — never MU's list.

**Do not click Generate as BML** (keep BML's empty data clean).

### Step 12 — The live site is on the new version (2 minutes)

**Do:** Open https://revised-truststack-web.vercel.app/api/v1/health

**Expect:** `"status":"ok"` and `"version":"a691d88"` (or newer).
*(Do not generate reports on the live site for MU or BML — they are permanent.)*

---

## When you are done

- Stop the app: press **Ctrl+C** in the Terminal running `pnpm dev`.
- Optional: to point `pnpm dev` back at the hosted database later, delete
  `apps/web/.env.development.local`.

## If something is different

Note the **step number**, what you **saw**, and a screenshot, and send it in
the next session — e.g. "Stage 4 manual test: step 8 shows Overdue 3, expected
2". Nothing here can harm the live site or real client data.
