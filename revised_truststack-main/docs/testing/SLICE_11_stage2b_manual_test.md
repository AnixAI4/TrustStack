# Slice 11 · Stage 2b — a notice, its translation, a report's narrative: manual test, step by step

What you are testing: three more **TrustStack Assistant** drafts:

- a **privacy notice** drafted from the processing register (only the records that rely on
  consent, or whose basis is not yet decided — s.5(1));
- its **Hindi or Marathi translation** (the words change, every purpose's key stays);
- a **narrative** for an Exposure Brief, printed as a **new version** of the report — the same
  figures, the narrative in front.

The point of the stage: **nothing is saved or printed until a person does it** — the notice
editor's own Save and Publish, and the report's own "Print the narrated version".

About 25 minutes:

- **Part A (Steps 1–12)** is one command that checks the API for you.
- **Part B (Steps 13–18)** is in the browser.

Both use the **recorded fake**: fixed drafts, no cost, never the real model. **Part C (Step 19)**
is optional and uses the **real model** for the ten new cases, with your key from `.env.local`
(about the cost of 2a's run).

Your gate phrase at the end: **"Stage 2b approved"** (or "Stage 2b approved with changes: …").

---

## Before you start (Claude does this for you on request)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 2b (no new package):
   ```bash
   git fetch && git checkout slice/11-ai-assistant && git pull && pnpm install
   ```
   Stage 2b has **one migration** (`20261023000000_ai_notice_narrative`). Claude has already
   applied it to your laptop's database and rebuilt that database from the seed. **Do not run
   `pnpm db:migrate` or `pnpm db:seed` in a plain Terminal**: the project's `.env.local` points
   at the **live** database. Nothing in this slice goes to the live site until the PR, after your
   approval.
4. Start the app **with the assistant on the fake** (stop any running copy with Ctrl + C first):
   ```bash
   AI_ENABLED=true AI_PROVIDER=fake pnpm dev
   ```
   Wait for the `Local:` line, usually **http://localhost:3001**.
5. Open a **second** Terminal tab in the same folder for Part A.

**Who is who** (password for everyone: `ci-local-only-Passw0rd-not-secret`):

| Who | Email | Role |
|---|---|---|
| Registrar | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner — writes consent, generates reports |
| MU Legal | `legal@mumbai-university.example.com` | Legal — writes consent; reads reports, cannot generate them |
| IT Admin | `it.admin@mumbai-university.example.com` | Organisation Admin |
| Dean | `dean@mumbai-university.example.com` | Executive Sponsor — reads, writes neither |
| BML Owner | `dpdp.owner@bharat-manufacturing.example.com` | Bharat Manufacturing (assistant off) |

Mumbai University's seed has **ten processing records** — nine with no lawful basis decided, and
payroll (ROPA-005) on **s.7(i), employment** — and a **published English notice** with three
purposes (`admissions`, `alumni_updates`, `event_photos`).

If a panel says **"Please wait a little"**, that is the assistant's hourly limit per person (thirty
calls), not a fault. Tell Claude, who rebuilds the database to reset it.

---

## Part A — the drafts through the API, one command (Steps 1–12)

**Do:**
```bash
node tools/ai_manual_test_2b.mjs
```
Press Enter after each step. (Add `--no-pause` to run straight through.)

**Expect:** every line ✓, and at the end **"All green — 39 of 39 checks passed."** (Claude's own run
on 2026-10-22: 39 of 39.) The steps:

| Step | What it checks |
|---|---|
| 1 | The Registrar asks for a **notice draft**. The payroll record (s.7(i)) is **not sent**; the admissions record is. **No notice is saved.** |
| 2 | The draft carries **no** withdrawal, rights or complaint text and no status — TrustStack prints those; every purpose says what it enables and itemises its data (Rule 3(b)); it is marked for counsel. |
| 3 | **The Dean** cannot accept it (403). **MU Legal, who did not ask, accepts it** with an edited title. Still no new notice — you save it in Part B. |
| 4 | The published notice is **translated into Hindi**: the draft is in Hindi and **its keys are the notice's own**. |
| 5 | **Tamil is not offered yet** (400). Accepting with a **renamed key** is refused (422). A model answer that renames one is **not kept** (422). Accepting it as drafted works. |
| 6 | The same notice **in Marathi**. |
| 7 | An **Exposure Brief** is generated — it keeps the figures it printed, so it may carry a narrative. |
| 8 | A **narrative** is drafted from those stored figures; no member's name is sent. A narrative stating **9,999** (a figure the report lacks) is **not kept**; nor is your edit if you type one in. |
| 9 | Accepting it **prints nothing**; the report list now offers to print it. **MU Legal cannot print it** (reads reports, cannot generate them — 403). |
| 10 | The Registrar prints it: **version N+1**, the **same exposure snapshot and date** as version N, linked to it. Printing the same narrative again is refused (409). |
| 11 | The audit log shows `ai.draft.accepted` for the notice, the translation and the narrative, and the narrated version's request naming the version it came from — **never the words**. |
| 12 | Bharat Manufacturing's owner is refused on Mumbai University's report (403); **all forty reference cases** (R1–R20, D1–D20) pass the server's checks. |

---

## Part B — in the browser (Steps 13–18)

Open **http://localhost:3001** and sign in as the **Registrar**.

### Step 13 — A notice drafted from the register, saved by you
**Do:**
1. Menu **Notice and consent** → tab **Notice** → **Draft a notice from the processing register**.
2. Read the panel; change the **Title** a little; scroll to the grey box.
3. Click **Use this draft**.
4. On the new page, click **Save draft**.

**Expect:**
- the panel says it was drafted from the consent-based records and leaves s.7 out; a blue "A legal
  draft. For review by counsel before use." line; each purpose with Key, Purpose, What it provides
  or enables, and the data one per line;
- the grey box: **"Always printed by TrustStack on the notice — not drafted"** with the withdrawal
  and Board sentences;
- after Use this draft: the notice editor, **pre-filled**, under a blue notice "Pre-filled from an
  AI draft accepted by …. A legal draft: check every purpose with counsel…";
- after Save draft: **"Draft saved."** — and only now is there a new notice on the Notice tab.

### Step 14 — Translate into Hindi; the keys stay
**Do:**
1. **Notice and consent** → click the **published** English notice's title.
2. Click **Translate into Hindi**.
3. Try to change a purpose's **Key** box.
4. Click **Use this translation**, then **Save draft**.

**Expect:**
- the panel's text is in Hindi; each **Key** box is grey and **cannot be changed** ("Kept from the
  notice — not translated");
- the new notice page says "Pre-filled from an AI translation"; its **Language** is **Hindi**;
- "Draft saved." — a Hindi draft notice now appears on the Notice tab. (Publishing it is your
  choice; the fake's Hindi is a fixed sample.)

### Step 15 — The Marathi button, and Discard
**Do:** back on the published English notice, click **Translate into Marathi**, then **Discard**.

**Expect:** a Marathi draft in the panel; after Discard the panel closes with "Draft discarded" and
nothing is saved.

### Step 16 — A report's narrative, printed as a new version
**Do:**
1. Menu **Reports** → **PDF reports** → generate the **DPDP Exposure Brief**. It opens **Stored**.
2. On its row, click **Draft a narrative**; read the panel; click **Accept this narrative**.
3. On the same row, click **Print the narrated version**.
4. **Download** the new version and open the PDF.

**Expect:**
- the panel says it was drafted from this version's stored figures and that a narrative with any
  other number is not accepted;
- after Accept: **nothing new in the list yet**; the row now shows **Print the narrated version**;
- after Print: a green line "**DPDP Exposure Brief version N+1 is ready: version N's figures with
  the narrative in front.**"; the new row is tagged **"With narrative · figures of vN"**; version N
  is still there, unchanged;
- the PDF: first section **Executive narrative**, with "Drafted with the TrustStack AI assistant
  and accepted by … It does not assess or certify the organisation's position under the Act."; in
  the header **Version N+1** and **Figures: As recorded in version N**; below it, the same brief as
  version N.

### Step 17 — A number the report lacks is not accepted
**Do:** on version N's row (or a newly generated brief), **Draft a narrative**; in **Paragraphs**,
add a line "9,999 actions are overdue."; click **Accept this narrative**.

**Expect:** a red message: the narrative states "9999", which is not in this version's figures.
Remove the line and Accept works.

### Step 18 — Who sees the buttons
**Do:** sign out; sign in as the **Dean**. Open **Notice and consent**, the published notice, and
**Reports → Stored**.

**Expect:** no "Draft a notice…", no "Translate into…", no "Draft a narrative" or "Print…" — the
Dean writes neither consent nor reports. (Sign in as **MU Legal**: the notice buttons are there,
the report ones are not.)

---

## Part C — optional: the ten new cases against the real model (Step 19)

### Step 19 — ten real drafts, checked
**Do:** stop the app (Ctrl + C) and start it on the real model:
```bash
AI_ENABLED=true AI_PROVIDER=anthropic pnpm dev
```
then, in the second tab:
```bash
node tools/ai_reference_run.mjs --only D11,D12,D13,D14,D15,D16,D17,D18,D19,D20
```
**Expect:**
- ten lines, each ✓ or ✗, with the draft's headline and the seconds it took (20–35 s each);
- it generates its own reports for the three narrative cases;
- Claude's final run passed **10 of 10**: `docs/testing/slice11-2b/reference_run_live.md`, with
  how the first run (8 of 10) got there.

**D19** and **D20** ask for what TrustStack never says ("we are compliant"; a TrustStack target as
the law). Both normally end as **"refused (wording) — nothing kept"**, which their cases allow.

---

## When you are done

Tell Claude **"done"** (or what went wrong, with the step number). Claude stops the app and
rebuilds your laptop's database from the seed. Then, after your review of the reference set
(walk-through call 10), give the gate phrase — and the slice closes (walk-through §11).
