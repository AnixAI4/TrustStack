# Slice 10.5 · Batch B3 — the registers: manual test, step by step

About **25 minutes**. Fifteen steps. Each one says **what to do** and **what you
should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack). This
batch changes how the registers read, group and page — and **nothing** about the
data, the law, the scores or who may do what. The walk-through is
`docs/testing/SLICE_10_5_batch3_walkthrough.md`.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Batch B3 (no new packages, no migration):
   ```bash
   git fetch && git checkout slice/10-5-b3-registers && git pull
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
   | Dean | `dean@mumbai-university.example.com` | Executive Sponsor (reads, writes nothing) |

   To change person: click the initials (top right) → **Sign out**.

Everything you save in this test is on your laptop's copy only; Claude rebuilds
it afterwards.

---

## Part A — the menu, as the Registrar

### Step 1 — one name per register (F3.1)

**Do:** Sign in as the **Registrar**. Look at the menu's **Registers** group, then
click each one.

**Expect:**
- The menu says **Processing register · Breach register · Rights and grievances ·
  Notice and consent · Processors · Retention register · AI risk register** — each
  on one line.
- Each page's title in the top bar is **exactly** the menu's name ("Rights and
  grievances", not "Rights & grievances").
- Make the window phone-narrow and open the menu (☰): the same names, nothing
  cut off.

---

## Part B — the processing register, as the Registrar

### Step 2 — one primary action, the rest under More (F3.3)

**Do:** Click **Processing register**.

**Expect:**
- One dark button, **Add a processing activity**, and beside it **More ▾**.
- Click **More**: **Import from a spreadsheet · Export (CSV) · Ask the register ·
  Gaps and actions**. Click outside it → it closes.
- With the keyboard: Tab to **More**, press **Enter** (it opens), **Tab** through
  the items, **Escape** (it closes).

### Step 3 — a record in five tabs, with its points (F3.2)

**Do:** Open **Online admission application** (ROPA-001).

**Expect:**
- Under the summary: five tabs — **Who and what 26/34** (amber) · **Purpose and
  ground 14/24** · **Systems and processors 16/16** (green) · **Retention and
  security 14/22** · **Evidence 0/4**. (The numbers are what the register saved.)
- Each tab shows only its own boxes (e.g. Systems and processors: Systems,
  Processors / vendors and "Other details (not scored): Sharing and disclosure").
- A **Save changes** bar stays at the bottom of the screen as you scroll.
- Click **Systems and processors**, then reload the page → it opens on that tab
  (the address ends `#systems`).

### Step 4 — fill two tabs, save once (F3.2)

**Do:** On **Who and what**, type a **Description** ("Test description"). Click
**Systems and processors** and type **Sharing and disclosure** ("Test sharing").
Click **Who and what** again.

**Expect:** Your description is still there (a tab switch loses nothing).

**Do:** Click **Save changes** once. Reload the page.

**Expect:** "Saved." appeared; after the reload both your description (Who and
what) and your sharing text (Systems and processors) are there.

### Step 5 — a new record: its risk, its tabs, the s.7(a) ground (F3.4, F3.5)

**Do:** Back to the register → **Add a processing activity**.

**Expect:**
- Completeness **0/100**, Risk **High**, and under it in amber: "**Risk: High
  until the unknowns are answered.**"
- The tabs say what each is worth: **34 pts · 24 pts · 16 pts · 22 pts · 4 pts**.
- On **Who and what**, the children's box shows (children's data is "Not known");
  open **Fourth Schedule exemption claimed**: each reads words first, the code in
  brackets — "An educational institution — … (A3)".
- Click **Purpose and ground** and open **Lawful ground**: "**A specified purpose
  the person voluntarily gave the data for, and has not said they do not consent
  to its use (s.7(a))**" (the wording changed at the gate, D-117),
  and every other ground reads the same way ("Employment purposes (s.7(i))").

**Do:** Leave without saving (click **← Back to the register**).

### Step 6 — the import has a template (F3.12, N6)

**Do:** **More → Import from a spreadsheet**. Click **Download a template (CSV)**
and open the file (Excel or Numbers).

**Expect:** One header row of thirty columns, starting **ROPA ID · Processing
Activity · Description · Department / Owner …** — the register's own names. The
line beside the link says only the activity's name is required.

*Optional:* type two rows into the template (one with a name, one without), save
it as CSV and choose it → **Check the file**: "1 row can be imported · 1 cannot";
the row that cannot is in a table with a search box ("Row 3 · … needs a name").
Do **not** press Import (or do — it is your laptop's copy).

### Step 7 — the look-up says what it is for (F3.12, N7)

**Do:** **More → Ask the register**.

**Expect:**
- A line: "Two questions the register answers in seconds: what personal data you
  hold about a kind of person — the summary a person may ask for (section 11(1)) —
  and what a system or a processor touches …"
- Open **Whose data**: **Applicant** appears once (no "Applicants").
- Choose **Student** → a table of the activities that name students, with a search
  box. Type `ROPA-003` → one row. Risk reads "High", not "high".

---

## Part C — notice and consent, as the Registrar

### Step 8 — three tabs, purposes by their titles (F3.6)

**Do:** Click **Notice and consent**.

**Expect:**
- The counts at the top; the note under them ends "… penalty head at risk." — no
  "(exposure model 1.3.0)".
- Tabs **Notice** (badge "Published") · **Widget** ("Live v1") · **Consent records**
  ("2").
- **Widget**: "Live: version 1, citing the English notice v1 — offers
  **Admissions, Alumni updates, …**" — titles, not `alumni_updates`. In the new
  version form, the languages show English, Hindi, Marathi and one line "**20 more
  languages — translation pending**"; click it → the twenty appear.
- **Consent records**: the record form's purposes, the latest choices and a
  look-up all say the titles.

### Step 9 — a blank notice is not told off (F3.7)

**Do:** **Notice** tab → **Write a new version**.

**Expect:** No yellow warnings on the blank form.

**Do:** Click into the first purpose's **Key**, type `test_key`, then press **Tab**.

**Expect:** Now the yellow box lists what is still missing (e.g. "… Rule 3(b)(ii)").
Leave without saving.

---

## Part D — the other registers, as the Registrar

### Step 10 — processors in words (F3.8)

**Do:** Click **Processors**.

**Expect:** The tile says "**No accepted assessment 2**" (not "Never assessed").

**Do:** Open **LMS provider** → **Assessments** tab → open its v1 (awaiting
review).

**Expect:** "Progress — **43 answered, 1 not applicable, of 44**" (or the numbers
it has); "Claimed, no evidence: **Is the vendor ISO/IEC 27001 certified? (A3); …
(C4); … (G1).**" — each claim named by its question.

### Step 11 — periods in years (F3.9)

**Do:** Click **Retention register**.

**Expect:** "Kept for" reads **10 years** (ROPA-002), **3 years**, **1 year** —
no "120 months". Open ROPA-001's schedule: **3 years**. If you can edit it, the
"Kept for (months)" box still takes months and says "3 years." under it.

### Step 12 — the AI exemption by name (F3.10)

**Do:** Click **AI risk register** → **AI proctoring**.

**Expect:** "Exemption relied on (Fourth Schedule): **Educational institution
(A3)**". Hover over it → the Schedule's full words.

### Step 13 — a request's status, the same everywhere (F3.11)

**Do:** Click **Rights and grievances**.

**Expect:** The Status column says "**Responded — Fulfilled**" (DPR-2026-001) and
"**Responded — Resolved**" (GRV-2026-001). Set the Status filter to **Responded**
→ both stay. Open one → its status reads the same phrase.

---

## Part E — on a phone, and as someone who only reads

### Step 14 — a phone (F3.2, F3.3, F3.6)

**Do:** Make the window phone-narrow (or the browser's device toolbar). Open the
processing register, a record, and Notice and consent.

**Expect:** The register's two buttons fit one row; More opens below. The record's
tabs scroll sideways; the **Save changes** bar stays at the bottom. Consent's
three tabs fit.

### Step 15 — the Dean writes nothing (unchanged)

**Do:** Sign out. Sign in as the **Dean**. Open the processing register and a
record.

**Expect:** No **Add a processing activity** button; **More** offers Export, Ask
the register and Gaps and actions — no Import. In the record every field is
greyed out, there is no Save bar, and the tabs still show their points.

---

## Tidy-up

- Stop the app with **Ctrl + C**.
- Step 4 saved a description and sharing text on ROPA-001 (and Step 6 may have
  imported a row) on your laptop's copy only. Say **"rebuild the local database"**
  and Claude puts it back to the seed.
- Then tell Claude **"Batch B3 approved"** — or what to change.
