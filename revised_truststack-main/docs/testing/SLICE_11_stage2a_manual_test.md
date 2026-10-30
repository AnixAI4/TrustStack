# Slice 11 · Stage 2a — drafts for the registers: manual test, step by step

> **✅ Approved 2026-10-21 — "Stage 2a approved with Option A" (D-131); call 15: 1a's wording rule
> kept.** Kept as the record of what was approved; the next stage is 2b (SLICE_11 §7c).

What you are testing: the **TrustStack Assistant's drafts** for three registers:

- a **processing record** drafted from a description;
- the **Board intimation under Rule 7(2)** drafted from a breach;
- a **response letter** drafted from a rights request.

Each draft is edited by a person, then **accepted** or **discarded**. The point of the stage:
**nothing is saved to a register until a person clicks that register's own Save.**

About 25 minutes:

- **Part A (Steps 1–11)** is one command that checks the API for you.
- **Part B (Steps 12–17)** is in the browser.

Both use the **recorded fake**: fixed drafts, no cost, never the real model. **Part C (Step 18)**
is optional and uses the **real model** for the ten drafting cases, with your key from
`.env.local`, at about the cost of 1b's run.

Your gate phrase at the end: **"Stage 2a approved"** (or "Stage 2a approved with changes: …").

---

## Before you start (Claude does this for you on request)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 2a (no new package):
   ```bash
   git fetch && git checkout slice/11-ai-assistant && git pull && pnpm install
   ```
   Stage 2a has **one migration** (`20261022000000_ai_register_drafts`). Claude has already
   applied it to your laptop's database and rebuilt that database from the seed. **Do not run
   `pnpm db:migrate` or `pnpm db:seed` in a plain Terminal**: the project's `.env.local` points
   at the **live** database. Nothing in this stage goes to the live site until the slice's PR
   at the end of Stage 2b.
4. Start the app **with the assistant on the fake** (stop any running copy with Ctrl + C first):
   ```bash
   AI_ENABLED=true AI_PROVIDER=fake pnpm dev
   ```
   Wait for the `Local:` line, usually **http://localhost:3001**.
5. Open a **second** Terminal tab in the same folder for Part A.

**Who is who** (password for everyone: `ci-local-only-Passw0rd-not-secret`):

| Who | Email | Role |
|---|---|---|
| Registrar | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner — writes the registers |
| MU Legal | `legal@mumbai-university.example.com` | Legal — writes the registers |
| IT Admin | `it.admin@mumbai-university.example.com` | Organisation Admin — turns the assistant on and off |
| Dean | `dean@mumbai-university.example.com` | Executive Sponsor — reads the registers, writes none |
| BML Owner | `dpdp.owner@bharat-manufacturing.example.com` | Bharat Manufacturing (assistant off) |

The seed has **no open breach and no open request**, so Part A records a **fictional** open
breach and a **fictional** erasure request from "Asha Fictional-Requester" on your laptop's
Mumbai University. Part B uses them. Claude rebuilds the database afterwards.

If a panel ever says **"Please wait a little"**, that is the assistant's hourly limit per
person (thirty calls), not a fault. Tell Claude, who rebuilds the database to reset it.

---

## Part A — the drafts through the API, one command (Steps 1–11)

**Do:**
```bash
node tools/ai_manual_test_2a.mjs
```
Press Enter after each step. (Add `--no-pause` to run straight through.)

**Expect:** every line ✓, and at the end **"All green — 36 of 36 checks passed."** The steps:

| Step | What it checks |
|---|---|
| 1 | The Registrar describes an activity and gets a **draft processing record**: a name and a purpose, never a risk rating or a status. An email typed in the description is masked before anything is sent. **The register still has 10 records.** |
| 2 | **MU Legal, who did not ask, accepts it** with an edited name. Any register writer may (D-129.3). Still **no new record**: the form saves it, in Part B. A second decision is refused (409). |
| 3 | **The Dean** reads the register but cannot write it: asking for a draft (403) and discarding one (403) are both refused. |
| 4 | A fictional breach is recorded, with the students told by email. The **Rule 7(2) draft** is a legal draft for counsel. **(iv), "the person who caused the breach", is always the placeholder.** **(vi) is written by TrustStack from the breach's own Rule 7(1) record.** No email, recorder or closer is sent. |
| 5 | Accepting the intimation keeps its text for the Dean to read and copy. **The Board report is still not recorded**: that stays the breach's own step. |
| 6 | A fictional erasure request is recorded. The **response letter** starts "Dear [Name]," and keeps [reference]. It has a letter and a summary, and **no outcome**. Her name, email and enrolment number are never sent. |
| 7 | An outcome cannot be accepted as part of the draft (400). Accepting the letter leaves the request **open, with no response recorded**. |
| 8 | A letter that decides the outcome ("We have erased all of your personal data") is **refused** (422), and the message says why. |
| 9 | The audit log shows `ai.draft.accepted`, who decided, and whether they edited the draft. It **never** shows the words. |
| 10 | Bharat Manufacturing's owner is refused on Mumbai University's drafts (403), and BML's own assistant is off. |
| 11 | The **reference set**: thirty cases (twenty explain, ten drafting) pass the server's checks. |

---

## Part B — in the browser (Steps 12–17)

Open **http://localhost:3001** and sign in as the **Registrar**.

### Step 12 — A processing record from a description, saved by you
**Do:** **Processing register** → **✦ Draft a record from a description** (beside "Add a
processing activity"). Type:
`Through the admissions portal we collect applicants' names, contact details and marks to decide admission.`
Click **Draft the record**.

**Expect:** a panel from the right: *TrustStack Assistant · Draft a record from a description*.
After a short wait you see:
- a bold one-sentence headline;
- *"Edit anything below. Nothing is saved to the register until you save it there yourself."*;
- the fields: Processing activity, Description, Whose data, Kinds of personal data, Purpose,
  Where the data comes from, Who it is shared with, How long it is kept, Security safeguards;
- **Lawful basis — a note for counsel** set to *"Not sure — leave for counsel"*;
- Children's data, Leaves India and AI processing, each *Not sure*;
- **The law behind this**, folded (s.4(1), s.5(1), each marked *The law*);
- **What the assistant did not know — you add it**;
- the review note and the caveat;
- **Use this draft** and **Discard**, and Yes / No.

There is no counsel notice: a register entry is not a legal draft. (On the fake the draft is
always the admissions one. The real model drafts what you describe; see Part C.)

**Do:** change **Processing activity** to `Undergraduate admissions (checked)`, then click
**Use this draft**.

**Expect:**
- a toast: *"Draft accepted — check the form, then save the record"*;
- the **New processing activity** form, with a blue notice: **Pre-filled from an AI draft —
  Accepted by Registrar (DPDP Programme Owner). Check every field before you save — nothing is
  in the register until you do. The lawful basis is a note for counsel, not a legal opinion.**;
- the fields filled in, the name as you edited it;
- no template picker.

**Do:** open **Processing register** in a **new tab**.
**Expect:** still **10** processing activities.

**Do:** back in the form tab, click **Create the record**.
**Expect:** the new record's page. The register now has **11**.

### Step 13 — Discard
**Do:** **Processing register** → **✦ Draft a record from a description**. Type any description
of 20 characters or more → **Draft the record** → **Discard**.
**Expect:** a toast *"Draft discarded"*; the panel closes; nothing else changes.

### Step 14 — The Board intimation under Rule 7(2)
**Do:** **Breach register** → open **Examinations portal account used from outside (manual
test)** (recorded by Part A). On the **Timeline** tab, look at **Detailed report to the Board —
Rule 7(2)(b)**.
**Expect:** a box **Draft intimation to the Board — Accepted by MU Legal Counsel on …** (from
Part A Step 5), then the line *"A draft for counsel to check before it is sent. Recording that the
report was made is the step above. Attach the copy you actually sent under Documents."*, with
**Show the text**, **Copy** and **Download (.txt)**. Below it is **✦ Draft the Board intimation
(Rule 7(2))**.

**Do:** click **✦ Draft the Board intimation (Rule 7(2))**.
**Expect:**
- the notice *"A legal draft. For review by counsel before use."*;
- two tabs: **(a) Without delay** (nature, extent, timing, location, likely impact) and **(b)
  Within 72 hours**, which says *"…or such longer period as the Board may allow on a written
  request"*.

**Do:** click **(b) Within 72 hours**.
**Expect:**
- **(iv) Findings regarding the person who caused the breach** reads *"[To be completed by the
  organisation — do not name individuals in this draft.]"*, with the hint *"Left for you to
  complete: TrustStack never asks the assistant about a person…"*;
- **(vi)** reads *"The affected Data Principals were informed on … IST, by: Email to each
  student (Rule 7(1))…"*, with the hint that TrustStack wrote it from the breach's own record.

**Do:** click **Accept this draft**.
**Expect:**
- a toast *"Draft accepted — it is below, to copy for counsel"*;
- the box now says *Accepted by Registrar…*;
- **Show the text** opens the intimation in the Rule's order;
- **Copy** gives a *"Copied"* toast;
- **Download (.txt)** saves a file named like `BRH-2026-00X-board-intimation-draft.txt`.

**Record the report** is still there: the report is **not** recorded until you record it.

### Step 15 — A response letter; you choose the outcome
**Do:** **Rights and grievances** → open the request **"Asks the university to delete her hostel
records…"** (recorded by Part A). On the **Response** tab, click **✦ Draft a response**.
**Expect:**
- the counsel notice;
- **The letter**, starting *"Dear [Name],"* with *"Our reference: [reference]"* and `[date]`;
- **Summary for the register**.

The name "Asha" appears nowhere. (On the fake the letter is the access-request example,
whatever the request. The real model writes to the request; see Part C.)

**Do:** click **Accept this draft**.
**Expect:**
- the **Record the response** form opens by itself;
- **Outcome** reads **— Choose the outcome —**;
- **What was done** is pre-filled with the draft's summary;
- the line *"'What was done' is pre-filled from the accepted draft — complete its [placeholders].
  Choose the outcome yourself."*;
- above the form, the box **Draft response letter — Accepted by Registrar…** with Copy and
  Download.

**Do:** click **Save the response** without choosing an outcome.
**Expect:** the browser asks you to choose an item in the list. Nothing is saved.

You may now choose an outcome and save. It is your laptop's copy only.

### Step 16 — The Dean reads, but cannot draft
**Do:** sign out; sign in as the **Dean**. Open the breach from Step 14, then **Processing
register**.
**Expect:**
- the breach shows the **accepted intimation box**, with Copy and Download;
- there is **no** "Draft the Board intimation" button;
- the register has **no** "Draft a record from a description" button.

### Step 17 — Off hides the buttons; accepted text stays readable
**Do:** sign in as the **IT Admin** → **Organisation** → **AI assistant** → **Turn the assistant
off**. Open the breach from Step 14.
**Expect:** **no** draft button, but the **accepted intimation box is still there** to copy.
Accepted text is the organisation's own record, and nothing is sent anywhere.
**Do:** turn it back on with `DEMO-DPA-AI-0001`.

---

## Part C — optional: the ten drafting cases against the real model (Step 18)

### Step 18 — ten real drafts, checked
**Do:** stop the app (Ctrl + C) and start it on the real model:
```bash
AI_ENABLED=true AI_PROVIDER=anthropic pnpm dev
```
then, in the second tab:
```bash
node tools/ai_reference_run.mjs --drafts
```
**Expect:**
- ten lines, each ✓ or ✗, with the draft's one-sentence headline and the seconds it took
  (10–30 s each);
- it records its own fictional breach and requests first;
- Claude's final run passed **10 of 10**: `docs/testing/slice11-2a/reference_run_live.md`, which
  also shows how the first run (1 of 10) got there.

The real model may word things differently each time. In particular, **D7** (asked to add "fully
compliant") may come back as a draft that refuses the claim, or as a refusal. Both pass; this is
walk-through call 15.

(Run `node tools/ai_reference_run.mjs` without `--drafts` to run all thirty, which uses the
hourly limit faster.)

---

## When you are done

Tell Claude **"done"** (or what went wrong, with the step number). Claude stops the app and
rebuilds your laptop's database from the seed. Then give the gate phrase.
