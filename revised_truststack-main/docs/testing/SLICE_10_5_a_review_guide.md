# Slice 10.5 · Stage A — review guide, step by step

About **15 minutes**. Nine steps. Stage A changed **no code**: it is an audit.
Each step shows you one of the top findings on your laptop's own copy of
TrustStack, so you can judge it yourself before approving the fix list in
`docs/UX_REVIEW.md` §4 ("Stage A"). **Do** says what to open; **You should
see** is the finding; **Proposed fix** names the fix you are approving.

Nothing here changes data. Your laptop's database was rebuilt from scratch by
Claude on 2026-10-17 (the seed, public pages closed).

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get the Stage A documents (no new packages):
   ```bash
   git checkout slice/10-5-simplicity && git pull
   ```
   **Do not run `pnpm db:migrate` or `pnpm db:seed` in a plain Terminal**: the
   project's `.env.local` points at the **live** database.
4. Start the app:
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line — usually **http://localhost:3001**.
5. **Password for every user:** `ci-local-only-Passw0rd-not-secret`

| Short name | Email |
|---|---|
| **DPO** | `dpdp.owner@mumbai-university.example.com` |
| **Dean** | `dean@mumbai-university.example.com` |
| **Exams** (a department owner) | `examinations@mumbai-university.example.com` |
| **Admin** | `it.admin@mumbai-university.example.com` |

Use a private window per person, or sign out from the account menu (top right).

---

### Step 1 — the Board figure that under-counts (Q1, rank 1)

**Do:** Sign in as **DPO**. Open **Actions** (left menu) and note **Open**.
Then open **Exposure** and read the **Forecast — all work** tile.

**You should see:** Actions says **Open 4** (one from the assessment, one each
from the breach, rights and retention registers). Exposure says **"1 actions
open"**. The Exposure Brief PDF in `docs/testing/slice10_5-a/reports/` says
"Critical and high work: **Nothing outstanding**" though three are High.

**Your call (Q1):** count every open action in the forecast (recommended — a
small model change), or relabel the tiles "assessment and processing-register
work only".

### Step 2 — the s.37 note as an alarm (rank 7)

**Do:** Stay on **Exposure**.

**You should see:** a **red error box** about blocking under s.37 — for an
organisation that has had no penalty.

**Proposed fix F4.1:** the same words as a neutral legal note under the tiles.

### Step 3 — "ceilings where you are exposed" (Q2)

**Do:** Read the first tile, **₹700 crore**, and the **Penalty heads** list below.

**You should see:** ₹700 crore includes heads 1 and 3, which say **Not yet
assessed**.

**Your call (Q2):** relabel "Statutory ceilings **at stake**" (recommended — the
figure is unchanged).

### Step 4 — the same overview for everyone (rank 3)

**Do:** Open **Overview** as **DPO**, then sign in as **Exams** and open **Overview**.

**You should see:** the same page for both. The first card repeats the top bar
with a raw code (`department_owner`). Nothing says what Exams should do next —
though Exams owns a High action (the grievance fix due 15 Dec 2026).

**Proposed fix F1.1 (+ Q5):** a "Your next steps" panel in place of that card —
your open actions, evidence awaiting your review, and for the programme roles
the most urgent register item.

### Step 5 — an owner hunting for their own action (rank 4)

**Do:** As **Exams**, open **Actions**.

**You should see:** every owner's actions grouped by owner; Exams has to find
their own name. The purpose line says actions come "from the assessment and
from the processing register" — there are five sources.

**Proposed fix F1.5:** a **My actions** tab first; the purpose line corrected.

### Step 6 — the assessment in codes (rank 5)

**Do:** As **DPO**, open **Assessments**, then the assessment. Open the first
domain and look at question **G1.2**.

**You should see:** `in_progress`; "91 answered as asked, 33 shown as
Potentially Applicable"; maturity chosen as a bare **0–5**; "capped by **E3**
(E3 supports at most 3)" and "Partial · E3". The overview calls this score
"Level 0 - Not Started" beside "Assessed Weight Coverage 100.00 / 100", and
every unanswered domain says **Needs Work** (Q3).

**Proposed fixes F2.1–F2.3, F1.4 (+ Q3):** "In progress · 1 of 124 answered",
level names on the picker, evidence in words, "Not started" for an unanswered
domain.

### Step 7 — one register, three names (B3)

**Do:** Open **Processing** in the menu.

**You should see:** the menu says **Processing**, the top bar **Processing
register**, the page **Processing Activity Register**. The same for
**Retention** / Retention register and **AI risk** / AI risk register. On this
page, six equal buttons.

**Proposed fixes F3.1, F3.3:** one name each; one primary button, the rest under
"More". Then open any record: one long page of thirteen areas — **F3.2** puts it
in tabs.

### Step 8 — a role the server refuses (rank 11)

**Do:** Sign in as **Admin**, open **Users**, open any member's role list.

**You should see:** **Anix AI Consultant** offered — but the server never lets an
admin give it (D-068: consultants are added by Anix), so the page offers a
choice that can only be refused. (Do not save it — just look.)

**Proposed fix F1.8:** offer only the roles the admin may give, and a "What can
each role do?" fold-out.

### Step 9 — the public side (ranks 2, 6, 8) — from the screenshots

The public pages are closed on your laptop's database, so look at the audit's
pictures in `docs/testing/slice10_5-a/`:

- `U42-widget-first--public--laptop.png` — **You should see:** "We value your
  privacy" with no organisation named; **Accept all** filled, **Reject all**
  outlined. **F5.1:** name the organisation; equal weight for both.
- `U41-public-notice--public--laptop.png` — **You should see:** "Mumbai
  University" at the top, "University of Mumbai" in the footer. **F5.2:** one
  name, the legal name once.
- `U43-vendor-dead--public--laptop.png` — **You should see:** Next's bare "404 —
  This page could not be found." **F5.4:** one plain, branded page for every
  dead link, still a single 404.

---

## When you are done

Stop the app with **Ctrl+C**. Then reply in chat:

- **"Simplicity fixes approved"** — the list as written, with your answers to
  **Q1–Q5**; or
- **"Simplicity fixes approved with changes: …"** — strike, change or reorder
  anything (for example, run B5 and B1 first, which is the recommendation).
