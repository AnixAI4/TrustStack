# Slice 10.5 · Batch B1 — first-run and the overview: manual test, step by step

About **20 minutes**. Thirteen steps, one per fix. Each one says **what to do**
and **what you should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack). This
batch changes what people see first — the overview, Actions, the settings pages,
sign-in — and **nothing** about the data, the law or who may do what. The
walk-through is `docs/testing/SLICE_10_5_batch1_walkthrough.md`.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Batch B1 (no new packages, no migration):
   ```bash
   git fetch && git checkout slice/10-5-b1-first-run && git pull
   ```
   Your laptop's database was rebuilt from scratch by Claude on 2026-10-17
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
   | Controller of Examinations | `examinations@mumbai-university.example.com` | Department Owner |
   | Registrar | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner |
   | Dean | `dean@mumbai-university.example.com` | Executive Sponsor |
   | Admin | `it.admin@mumbai-university.example.com` | Organisation Admin |

   To change person: click the initials (top right) → **Sign out**.

---

## Part A — signing in

### Step 1 — the sign-in page says what TrustStack is (F1.9)

**Do:** Open **http://localhost:3001** (signed out).

**Expect:** The sign-in page. Under **DPDP Compass**: "**DPDP readiness for your
organisation — assessments, registers and reports.**" Under the **Sign in**
button: "**Forgot your password? Ask your organisation's admin.**"

### Step 2 — a dead invitation says who can help (F1.9)

**Do:** Open **http://localhost:3001/invites/accept?token=not-a-real-token**.

**Expect:** "This invitation is not valid or has already been used. **Ask your
organisation's admin to send a new invitation.**"

---

## Part B — the overview and Actions, as a department owner

### Step 3 — Your next steps (F1.1, F1.2)

**Do:** Sign in as the **Controller of Examinations**.

**Expect:** The **Overview**:
- First box: **Mumbai University** — "**University / Higher Education ·
  consultant-assisted**" (no longer `university`).
- Then **Your next steps** — "For examinations@mumbai-university.example.com ·
  **Department Owner**" (no longer `department_owner`), and under **Your open
  actions** the Controller's one action, with "Due 15 Dec 2026", as a link.
  Then "**Open My actions →**".
- **No** "Needs someone now" (that is for the programme roles) and **no**
  "Signed in as" box.

### Step 4 — the deadline and the readiness tile (F1.3, F1.4, Q3)

**Do:** Scroll down the same overview.

**Expect:**
- The exposure tile: "**Until most of the DPDP Rules apply** — **208 days to
  13 May 2027**" (the number counts down each day) and under it "**finish date:
  not enough history yet**".
- The readiness tile starts "**1 of 124 questions answered**", then the score,
  then "Assessed Weight Coverage: 100.00 / 100 — **the weight of the domains
  that apply**".
- The scorecard of sixteen domains: the domains nobody has answered say
  **Not started** (not "Needs Work"). The one domain with an answer still shows
  its own status.

### Step 5 — My actions (F1.5, F1.6)

**Do:** Click **Open My actions →** (or **Actions** in the menu).

**Expect:** The page has one "Actions" title — in the top bar; no second
heading. The purpose line names "…the assessment, the processing register, and
the breach, rights and retention registers…". The **My actions** tab is
**first and open**, with the Controller's action in a table (no Owner column).
**By owner**, **All actions** and the roadmap are the next tabs.

---

## Part C — the programme view, and the phone

### Step 6 — a programme role sees what needs someone (F1.1)

**Do:** Sign out; sign in as the **Registrar**.

**Expect:** **Your next steps** — "For dpdp.owner@… · **DPDP Programme Owner**";
**Needs someone now** with **one** item that is a link — on the seed it is the
most urgent of Mumbai University's registers (e.g. "**ROPA-009 — erasure
overdue since …**"); and **Your open actions**: "**Nothing is assigned to you
right now.**" (the Registrar owns no action in the seed).

### Step 7 — By owner stays first for a programme role (F1.5)

**Do:** Click **Actions** in the menu.

**Expect:** **By owner** is first and open (the Registrar runs the programme).
There is **no** My actions tab — the Registrar owns no action.

### Step 8 — no repeated headings; a phone gives the title the room (F1.6, F1.7)

**Do:** Click **Breaches**, then **Processing**. Then make the window phone
width: in Chrome press **⌥⌘I** (Developer Tools), click the phone-and-tablet
icon, choose **iPhone 12 Pro**, and reload. Tap the initials (top right).

**Expect:** On a laptop: each page's name is only in the top bar ("Breach
register", "Processing register"), with the purpose line under it. At phone
width: the top bar shows "**Processing register**" in full (no "Processi…");
there is no role badge beside the initials; the account menu says "Signed in as
**DPDP Programme Owner** in Mumbai University". Close Developer Tools.

---

## Part D — settings

### Step 9 — Organisation settings in tabs (F1.10)

**Do:** Click **Organisation** in the menu (under Settings).

**Expect:** The top bar says **Organisation settings**. Four tabs: **Profile**
(open) · **Significant Data Fiduciary** · **Third Schedule class** · **Public
pages**. Profile shows **Industry: University / Higher Education**. Click each
tab: one setting at a time.

The Registrar **cannot edit** these settings — only an Organisation Admin or the
consultant can (unchanged by B1). So there is **no Save button** here; each tab
says so instead: Profile — "You can view the profile. Only an Organisation Admin
or consultant can edit it."; the other three — "Only an Organisation Admin or
consultant can …". You see the Save buttons as the Admin in Step 11.

### Step 10 — the scope wizard's Next saves (F1.11)

**Do:** Click **Scope** → step **6. Risk questions**. Tick (or untick)
"**Multiple campuses, branches or subsidiaries**". Click **Next**. Then reload the
page and click **6. Risk questions** again.

**Expect:** There is **no** "Save answers" button — under the questions: "Next
saves these answers." **Next** shows "Saving…", a green "**Scope answers
saved.**" toast with the risk tags, and moves to **7. Preview**. After the reload,
your change to "Multiple campuses…" is still there. **Back** is the plain
(secondary) button.

**Then:** put it back as it was (tick or untick again → **Next**).

### Step 11 — Users offers only what an admin may grant (F1.8)

**Do:** Sign out; sign in as the **Admin** → **Users**.

**Expect:**
- Under the top bar: "**Who can sign in to Mumbai University, and what each role
  may do.**"
- Status says **Active** (capital A).
- The Anix consultant's row shows **Anix AI Consultant** as a plain badge, not a
  drop-down (an admin cannot change it).
- Click **Invite user** → open the **Role** list: **no "Anix AI Consultant"**
  and no "Super Admin". Click **Cancel**.
- Click **What can each role do?** — every role with a line on what it may do;
  Anix AI Consultant is marked "**— you cannot grant this role**".
- Click **Organisation** in the menu: as the Admin, each of the four tabs has its
  own **Save** (Save profile on Profile). Do not save anything — just look.

---

## Part E — the public form when an email cannot be sent

### Step 12 — one message, saying what to do (F1.12)

**Setup (Claude can do this for you):** open Mumbai University's public pages
— as the Admin: **Organisation** → **Public pages** tab → **Suggest** → type
`mumbai-university` in the address box → a contact name and email → **Save**.
Then stop the app (Ctrl + C) and start it with a deliberately wrong email key,
so every email fails:
```bash
RESEND_API_KEY=re_wrong_key_for_test pnpm dev
```

**Do:** In a **private window** open
**http://localhost:3001/p/mumbai-university/rights** → choose a request → fill
your name, **your own email address** and a short note → **Send — we'll email
you a code**. On the next screen click **Send a new code**.

**Expect:** One line: "**We could not send the email just now. Wait a minute,
then choose Send a new code. Nothing reaches Mumbai University until a code is
entered.**" After **Send a new code** the same line stays — **no second box**
saying the same thing again.

**Then:** stop the app (Ctrl + C) and start it normally (`pnpm dev`).

### Step 13 — anything else

**Do:** Click through the other pages you use (Assessments, Reports, the
registers) as any of the four people.

**Expect:** Everything works as before; only repeated headings are gone.

---

## Tidy-up

- Stop the app with **Ctrl + C**.
- Step 12 opened Mumbai University's public pages on your laptop's copy only;
  Claude rebuilds the local database after your test (say "rebuild the local
  database"), which closes them and removes the test request.
- Then tell Claude **"Batch B1 approved"** — or what to change.
