# Slice 10 · Stage 1 — manual test, step by step

About **25 minutes**. Fourteen steps. Each one says **what to do** and **what
you should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack), not the
live site: a breach can never be deleted, and on the live site Mumbai
University is a real client.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Bring your laptop's database up to Stage 1 (safe to run twice):
   ```bash
   git checkout slice/10-workflow-modules && git pull
   ```
   The migration and seed are already applied on your laptop's database. If
   you ever reset it, run `pnpm db:migrate && pnpm db:seed`.
4. Start the app:
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line — usually **http://localhost:3001**. Use whatever
   address it prints. The `Environments:` line must mention
   `.env.development.local` (it is in place, pointing at your laptop's database).
5. **Password for every user below:** `ci-local-only-Passw0rd-not-secret`
6. Use **one private (incognito) window per person**, or **Sign out** between people.

| Short name | Email | What they are |
|---|---|---|
| **Dean** | `dean@mumbai-university.example.com` | Executive Sponsor — reads only |
| **CISO** | `ciso@mumbai-university.example.com` | MU's IT/Security Lead — records breaches. Also **Organisation Admin of "Demo Clinic Network"** (a healthcare tenant set up on your laptop) |
| **DPO** | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner — can approve an action's closure |
| **Exams owner** | `examinations@mumbai-university.example.com` | Department Owner |
| **BML admin** | `admin@bharat-manufacturing.example.com` | Another company — must see nothing of MU |

All times on screen are **India time (IST)**.

---

## Part A — reading the register (as the Dean)

### Step 1 — Mumbai University's register

**Do:** Sign in as **Dean** → click **Breach register** in the top menu.

**Expect:**
- Heading **Breach register**, with a sentence on Rule 7(1) and 7(2).
- Counts: **Recorded 1**, Open or contained 0, inside the window 0, **overdue 0**, people not yet told 0.
- A small note ending "*The 48-hour and 12-hour alerts are TrustStack targets, not statutory periods.*"
- One breach, **BRH-2026-001** · **Closed** · High · Accidental disclosure — "Examination marks list shared through a public link".
- Board report: **Made 16 Mar 2026, 16:30 IST**. People: **Told 15 Mar 2026, 11:30 IST**.
- **No "Record a breach" button** (the Dean reads only).

### Step 2 — the breach's own page

**Do:** Click the breach's title.

**Expect:**
- **Rule 7 timeline**: Became aware **14 Mar 2026, 10:20 IST**; Board told **14 Mar 2026, 15:00 IST**; detailed report **Due 17 Mar 2026, 10:20 IST — 72 hours from becoming aware**, made 16 Mar (reference "MU-BR-2026-01"); people told 15 Mar, by email and a portal notice. Each says **who recorded it**.
- **No buttons** to record, edit, close or reopen.
- **Remedial actions**: "Review link-sharing settings on every examinations folder" — owner MU IT/Security Lead, due 30 Nov 2026.

### Step 3 — the overview

**Do:** Click **Overview**.

**Expect:** a section **Personal data breaches** — Open or contained 0, inside the window 0, overdue 0, people not yet told 0 — and the actions line ends "**· from the breach register: 1 open, 0 overdue**".

---

## Part B — recording a breach (as the CISO, on Mumbai University)

### Step 4 — record one that is already overdue

**Do:** Sign in as **CISO** (Mumbai University) → **Breach register** → **Record a breach**.
Set *When did the organisation become aware?* to **3 days and 1 hour ago**
(e.g. today 09:00 → three days ago, 08:00). Title "**Test: staff laptop
stolen**", nature **Loss or destruction of data**, severity **High**. Click
**Record the breach**.

**Expect:** the breach's page opens: code **BRH-2026-002**, **Open**, and under
the detailed report "**Overdue by 1h …**" in red. Due time = aware + exactly 72 hours.

### Step 5 — what that does to exposure

**Do:** Click **Exposure** in the top menu. Find **Penalty head 2 · s.8(6)**.

**Expect:**
- Head 2 is **Exposed**.
- Reasons include "**1 personal data breach: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b)).**" and "**… affected Data Principals are not recorded as intimated (Rule 7(1)).**"
- Under *Why this position*: "**2 personal data breaches recorded in the last 24 months. (+2, s.33(2)(c))**".
- *Evidenced by* ends with **breach register: …** (two rows, with their Rule 7 provisions).
- The caveat at the foot says "**exposure model 1.1.0**".

### Step 6 — the Board told, then the report

**Do:** Back on BRH-2026-002: under *Board told without delay* click **Record** → **Save**
(it defaults to now). Then under *Detailed report* click **Record the report**,
type reference **TEST-1**, **Save**.

**Expect:** each step now says "**Recorded by MU IT/Security Lead on …**". The
report line says "**Made … — after the due time**" (it was late), and the red
"Overdue" is gone.

### Step 7 — closing too early is refused

**Do:** Click **Close**.

**Expect:** a red message: "**Record the report to the Board and the intimation to the affected Data Principals before closing this breach.**" Status stays **Open**.

### Step 8 — people told, then close

**Do:** Under *Each affected Data Principal told* click **Record**, type "**Phone call**", **Save**. Click **Close**.

**Expect:** status **Closed**, with who closed it. The **Edit** link and the record buttons are gone; only **Reopen** is offered.

### Step 9 — an action on the one action list

**Do:** Under *Remedial actions* click **Add an action**: "**Encrypt every staff laptop**", owner **Controller of Examinations**, any due date → **Add**. Then click **Actions** in the top menu and set *Source* to **Breach register**.

**Expect:** the action is listed, labelled **Breach register**, with its owner and due date — next to (filter "All") the assessment and register actions.

### Step 10 — the owner cannot approve their own closure

**Do:** Sign in as **Exams owner** → open BRH-2026-002 (Breach register → its title) → on the action set *Status* to **Closed** → **Save**.

**Expect:** refused: "*Closing needs reviewed evidence attached to this action, or approval by a reviewer who is not its owner.*"

**Then:** sign in as **DPO**, same action → **Closed** → **Save**.

**Expect:** the action closes: "Closed on … by Registrar (DPDP Programme Owner), on **a reviewer's approval**".

---

## Part C — the Board's extension, a dismissal, and two other tenants

### Step 11 — the extension (on the Demo Clinic Network)

**Do:** Sign in as **CISO** → in the organisation switcher (top right) choose **Demo Clinic Network** → **Breach register**.

**Expect:** a **healthcare** tenant's own register: 3 breaches with codes from **BRH-2026-001** again (codes are per organisation), counts **overdue 1**, **people not yet told 2**, **dismissed** shown on BRH-2026-003. BRH-2026-002 (ransomware) shows **about 150 hours remaining** — the Board allowed 7 days ("DPB/EXT/2026/DEMO-17").

### Step 12 — dismiss one as not a personal data breach

**Do:** **Record a breach**: aware now, title "**Test: suspicious login**", nature Other, severity Low → on its page click **Dismiss — not a personal data breach**, leave the reason empty.

**Expect:** the **Dismiss** button stays greyed until you type a reason. Type "**Login was the user's own, from a new phone**" → **Dismiss**. Status **Dismissed — not a personal data breach**, the reason shown, the clock line "**No clock — dismissed as not a personal data breach**".

### Step 13 — Bharat Manufacturing sees an empty register, and nothing of MU

**Do:** Sign in as **BML admin** → **Breach register**.

**Expect:** counts all **0** and "**No breach is recorded.** When the organisation becomes aware of one, record it here straight away…". The Overview's breach section says "No breach is recorded."

**Then:** in the address bar open
`http://localhost:3001/api/v1/organizations/0b000000-0000-4000-8000-000000000001/breaches`
(use your port; this is Mumbai University's register).

**Expect:** an error with **403** — never MU's breaches.

### Step 14 — the Dean cannot record

**Do:** Sign in as **Dean** → open `http://localhost:3001/dashboard/breaches/new`.

**Expect:** "*Recording a breach needs the breach register's write permission. Tell your DPDP Programme Owner straight away.*" — and no form.

---

## When you are done

- Stop the app: press **Ctrl+C** in the Terminal running `pnpm dev`.
- What you recorded stays on your laptop only (MU now has 2 breaches there).
- To point `pnpm dev` back at the hosted database later, delete
  `apps/web/.env.development.local`.

## If something is different

Note the **step number**, what you **saw**, and a screenshot, and send it in
the next session with your approval — e.g. "Stage 1 approved; step 11 showed
overdue 2". Nothing here can harm the live site or real client data.
