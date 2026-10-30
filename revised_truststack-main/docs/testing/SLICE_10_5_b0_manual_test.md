# Slice 10.5 · Stage B0 — manual test, step by step

About **20 minutes**. Twelve steps. Each one says **what to do** and **what you
should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack). Nothing
in this stage changes data, rules or permissions — it changes **how every page
looks and moves**: the old app's colours and fonts, a fixed menu on the left, a
fixed bar at the top showing **who is signed in, as which role, in which
organisation**, one style for every message, pages of 25 on long lists, and
tabs on long pages. Try it on your laptop **and** with the browser narrowed to
phone width (or on your phone, if it can reach your laptop).

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage B0 — **and install its three new packages** (the icons and the two fonts):
   ```bash
   git checkout slice/10-5-simplicity && git pull && pnpm install
   ```
   Your laptop's database was rebuilt from scratch by Claude on 2026-10-16
   (Slice 10's seed). **Do not run `pnpm db:migrate` or `pnpm db:seed` in a
   plain Terminal**: the project's `.env.local` points at the **live** database.
   (B0 has no migration anyway.)
4. Start the app:
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line — usually **http://localhost:3001**. If it prints
   another port, use that everywhere below.
5. **Password for every user:** `ci-local-only-Passw0rd-not-secret`

| Short name | Email | Role you should see in the top bar |
|---|---|---|
| **DPO** | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner |
| **Legal** | `legal@mumbai-university.example.com` | Legal User |
| **Dean** | `dean@mumbai-university.example.com` | Executive Sponsor |
| **Admin** | `it.admin@mumbai-university.example.com` | Organisation Admin |
| **Consultant** | `consultant@anix-ai.example.com` | Anix AI Consultant (in two organisations) |

---

## Part A — the frame

### Step 1 — sign-in looks like the product

**Do:** Open the address from step 4. You land on **Sign in**.

**Expect:** A white card on a soft blue-grey page, a **navy shield**, "TrustStack"
in blue and **DPDP Compass** in navy, in the new fonts (Inter for text, Plus
Jakarta Sans for headings). A wrong password shows a red message with an ✕
icon and a red edge on the left.

### Step 2 — the menu stays on the left, the bar stays on top

**Do:** Sign in as **DPO**. Open **Processing** (left menu, under *Registers*), then
scroll the page down to the bottom.

**Expect:** A **navy menu** on the left with icons, in four groups — *Overview*,
**Programme** (Assessments, Actions, Exposure, Reports), **Registers**
(Processing, Breaches, Rights & grievances, Notice & consent, Processors,
Retention, AI risk) and **Settings** (Organisation, Scope). The page you are on
is highlighted. A white bar on top says *REGISTERS* / **Processing register**.
When you scroll, **only the page moves** — the menu and the top bar stay put.

### Step 3 — who is signed in, as which role

**Do:** Look at the top right. Then click it.

**Expect:** Initials in a navy circle, **Registrar (DPDP Programme Owner)**, a blue badge **DPDP Programme Owner**, and **Mumbai
University** under it. Clicking opens a menu: your name and email, "Signed in as
**DPDP Programme Owner** in Mumbai University", **Organisation settings**, and a
red **Sign out**. Click outside the menu (or press Esc) and it closes.

### Step 4 — every person sees their own role

**Do:** Open the menu → **Sign out**. Sign in as **Dean**, then as **Legal**, then as
**Consultant** (sign out between each).

**Expect:** The badge says **Executive Sponsor**, then **Legal User**, then **Anix
AI Consultant**. The menu shows **only what that person may open**: the Dean has
no **Users** and no **Question bank**; the Consultant has **Question bank**. The
Consultant also gets an **organisation switcher** in the top bar (Mumbai
University / Bharat Manufacturing); switching reloads the page into the other
organisation and the bar's organisation name changes with it.

### Step 5 — collapse the menu; it remembers

**Do:** (Any user.) At the bottom of the menu press **Collapse menu**. Reload the page.

**Expect:** The menu shrinks to icons only; hovering an icon shows its name. After
the reload it is **still collapsed** (it is remembered in this browser). Press
the arrow to open it again.

### Step 6 — on a phone

**Do:** Make the browser window narrow (about phone width), or open the same
address on your phone. Press the **☰** button at the top left.

**Expect:** No menu on the left until you press ☰ — then it slides in over the
page, with an ✕ to close it. Choosing a page closes it. The top bar still shows
the **role badge** beside the initials; the name and the organisation switcher
are inside the account menu.

---

## Part B — lists, tabs and messages

### Step 7 — a long list is in pages, searchable and sortable

**Do:** As **Consultant**, open **Question bank** → click **DPDP Compass core assessment**
(the largest pack).

**Expect:** The pack's questions in a table: **25 a page**, "Showing 1–25 of …",
page numbers and **Rows per page** (25 / 50 / 100) under it. Type a word such as
`breach` in the search box: only matching questions stay, and the count
changes. Click the **Question** column heading: the arrows show it is sorted;
click again to reverse; a third time puts it back in the bank's order.

### Step 8 — the registers are tables now

**Do:** As **DPO**, open **Breaches**, **Rights & grievances**, **Processors**,
**Retention** and **AI risk** in turn.

**Expect:** Each register is a **table** with a search box (no longer a column of
cards). The summary tiles at the top show **the same numbers as before**. A
filter above a table (e.g. Retention's *Show* → *Erasure overdue*) narrows the
table and its "Showing" line. (Paging appears only once a list has more than
25 rows — Mumbai University's registers are shorter than that.)

### Step 9 — a breach in tabs

**Do:** **Breaches** → open **BRH-2026-001**. Click **Documents**, then **Actions**,
then **Details**, then press the browser's **reload**.

**Expect:** The breach's code, status and title stay at the top; under them,
tabs: **Timeline** (the Rule 7 steps and the status — the one that needs action,
so it opens first) · **Documents 0** · **Actions 1** · **Details**. Each tab shows
only its part — no endless page. After the reload you are **still on the tab
you chose** (it is in the address, e.g. `#details`).

### Step 10 — the other long pages

**Do:** Open a request in **Rights & grievances**, a schedule in **Retention**
(ROPA-009), a vendor in **Processors**, and the baseline in **Assessments**.

**Expect:** Tabs on each: a request — **Response · Documents · Actions ·
Details**; a schedule — **Erasure** (with an orange **Overdue** badge for
ROPA-009) · Documents · Actions · Schedule; a vendor — **Contract** (an orange
**Gap** badge when no contract with DPDP clauses is recorded) · Assessments ·
Documents; the assessment — **Questions 124 · Score**. On **Actions** (left
menu): **By owner · All actions · 30 / 60 / 90-day roadmap** — *All actions* is
one searchable table of every action.

### Step 11 — a save you cannot miss

**Do:** Sign in as **Admin** (only an Organisation Admin or the consultant may edit
the profile — the DPO sees it read-only). Open **Organisation** and press **Save**
on the profile without changing anything. Then open **Processing** → **ROPA-001**
→ **Save changes**.

**Expect:** A **green toast** slides in at the top right ("Profile saved." — then
"Saved. Completeness and risk were recalculated by the register."), and
disappears by itself after about 4 seconds (or press ✕). The green message
**on the page** stays as before — the toast never replaces it.

### Step 12 — a refusal you cannot miss

**Do:** As **Legal**, open **Rights & grievances** → **Record a request or
grievance** → press **Save** with the form empty. Then open **DPR-2026-001**,
**Response** tab, and look at any message there.

**Expect:** The browser asks for the required fields, or the page shows a red
box with an **✕ icon and a red edge** saying why, **beside the form** (errors
never go into a toast). Warnings are amber with a ⚠ icon, notes blue with an ⓘ
— the same look on every page.

---

## When you are done

Stop the app with **Ctrl + C**. If everything matched, reply **"Stage B0
approved"** (or "approved with changes: …"). Then **Stage A — the audit** starts
in a new window with "Start Slice 10.5 Stage A".
