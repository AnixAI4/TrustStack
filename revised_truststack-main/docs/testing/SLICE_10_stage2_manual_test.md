# Slice 10 · Stage 2 — manual test, step by step

About **25 minutes**. Fourteen steps. Each one says **what to do** and **what
you should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack), not the
live site: a request can never be deleted, and on the live site Mumbai
University is a real client.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 2:
   ```bash
   git checkout slice/10-workflow-modules && git pull
   ```
   The Stage 2 migration, the seed and the demo requests below are already on
   your laptop's database. If you ever reset it, run
   `pnpm db:migrate && pnpm db:seed` (the demo clinic's requests are not in
   the seed).
4. Start the app:
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line — usually **http://localhost:3001**. Use whatever
   address it prints. The `Environments:` line must mention
   `.env.development.local` (it points at your laptop's database).
5. **Password for every user below:** `ci-local-only-Passw0rd-not-secret`
6. Use **one private (incognito) window per person**, or **Sign out** between people.

| Short name | Email | What they are |
|---|---|---|
| **Dean** | `dean@mumbai-university.example.com` | Executive Sponsor — reads only |
| **Legal** | `legal@mumbai-university.example.com` | MU's Legal User — records requests. Also a Department Owner in "Demo Clinic Network" |
| **CISO** | `ciso@mumbai-university.example.com` | **Organisation Admin of "Demo Clinic Network"** (a healthcare tenant on your laptop) |
| **DPO** | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner — can approve an action's closure |
| **BML admin** | `admin@bharat-manufacturing.example.com` | Another company — must see nothing of MU |

Dates on screen are **India's calendar**. "Day 0" is the day a request was received.

---

## Part A — reading the register (as the Dean)

### Step 1 — Mumbai University's register

**Do:** Sign in as **Dean** → click **Rights & grievances** in the top menu.

**Expect:**
- Heading **Rights and grievances**, with a sentence naming sections 11, 12, 13 and 14 and "*not exceeding ninety days from receipt (Rule 14(3))*".
- Counts: Open requests **0**, Open grievances **0**, Past TrustStack's 30-day target **0**, Open past the 90 days **0**, Responded after the 90 days **0**.
- The note ending "*The 30-day response target is TrustStack's, not a statutory period.*"
- Two entries:
  - **DPR-2026-001** · **Fulfilled** · Access to information · s.11 — Response "**Responded on day 18**", owner MU Legal Counsel.
  - **GRV-2026-001** · **Resolved** · Grievance · s.13, Rule 14(3) — "**Responded on day 22**", from "Parent (seed) (a parent or lawful guardian)".
- **No "Record a request or grievance" button.**

### Step 2 — the filter, and the grievance's page

**Do:** Set *Show* to **Grievances only**, then click the grievance's text.

**Expect:**
- Only GRV-2026-001 was listed.
- Its page: **Responded — Resolved**. *Response clock*: Received **2 Sep 2026**, Respond by **1 Dec 2026**, TrustStack's target **2 Oct 2026**; "Responded on day 22".
- *Identity verified* says **Not recorded.** (a grievance does not need it). *Response*: **Resolved** on 24 Sep 2026, with who recorded it.
- **No buttons** to record, edit or reopen.
- *Remedial actions*: "Make corrections in the student record flow to the examination system" — due 15 Dec 2026.

### Step 3 — the overview

**Do:** Click **Overview**.

**Expect:** a section **Rights requests and grievances** with four zeros, and the actions line ending "**· from the rights register: 1 open, 0 overdue**".

---

## Part B — a request from start to finish (as Legal, on Mumbai University)

### Step 4 — record an erasure request

**Do:** Sign in as **Legal** → **Rights & grievances** → **Record a request or grievance**.
*What is it?* **Erasure (s.12(3))**. Leave *When was it received?* as today.
Name "**Test Student**", identifier "**Seat 2026-EX-9999**", summary
"**Please delete my old phone number**". Click **Record the request**.

**Expect:** the request's page: code **DPR-2026-002**, **Open**, clock "**Day 0 of 90**". Respond by = today + 90 days; TrustStack's target = today + 30.

### Step 5 — fulfilling it before the person is identified is refused

**Do:** Click **Record the response** → leave **Fulfilled** → **Save the response**.

**Expect:** the form says in amber "*Record how the person was identified first…*", and the save is refused in red: "**Record how the person's identity was verified before fulfilling the request.**"

### Step 6 — identify, then respond

**Do:** Under *Identity verified* click **Record how they were identified**, type
"**Matched the seat number and registered email**", **Save**. Then
**Record the response** → **Fulfilled** → **Save the response**.

**Expect:**
- *Identity verified* shows the date, the method and "**Recorded by MU Legal Counsel on …**".
- Status **Responded — Fulfilled**, clock "**Responded on day 0**".
- The **Edit** link and the record buttons are gone; only **Reopen** is offered.

### Step 7 — a remedial action on the one action list

**Do:** Under *Remedial actions* click **Add an action**: "**Remove the number from the alumni mailer too**", owner **Controller of Examinations (Department Owner)** → **Add**. Then **Actions** in the top menu → *Source* **Rights and grievance register**.

**Expect:** the action is listed, labelled **Rights and grievance register**, with "**DPR-2026-002 · Erasure (s.12(3))**" under it — and nowhere does it say "Test Student".

### Step 8 — reopen, and withdraw

**Do:** Back on DPR-2026-002 click **Reopen**.

**Expect:** status **Open**; the response is gone (the identity check stays). The note said reopening withdraws the response.

**Then:** click **Withdrawn by the person**, leave the reason empty.

**Expect:** **Mark withdrawn** stays greyed. Type "**Phoned to withdraw it**" → **Mark withdrawn**. Status **Withdrawn by the person**, the reason shown, clock "**No clock — withdrawn by the person**".

---

## Part C — the clock and the model (as the CISO, on the Demo Clinic Network)

### Step 9 — a register with something overdue

**Do:** Sign in as **CISO** → organisation switcher (top right) → **Demo Clinic Network** → **Rights & grievances**.

**Expect:** a **healthcare** tenant's own register, codes from **DPR-2026-001** again (per organisation):
- **DPR-2026-001** · Access — "**Overdue — day 95, past the 90-day ceiling**" in red (the day count is higher if you test on a later day).
- **DPR-2026-002** · Erasure — "**Day 40 of 90 — past TrustStack's 30-day target**" in amber.
- **GRV-2026-001** · Grievance — "Day 10 of 90", from "Demo Guardian (a parent or lawful guardian)".
- **DPR-2026-003** Correction and **DPR-2026-004** Nomination — responded.
- Counts: Open requests **2**, Open grievances **1**, Past target **1**, Open past the 90 days **1**.

### Step 10 — what that does to exposure

**Do:** **Exposure** in the top menu → find **Penalty head 7**.

**Expect:**
- Head 7 is **Exposed** (this clinic has no assessment — the overdue request alone is direct evidence).
- Reasons include "**1 rights request or grievance has been open for more than ninety days since it was received (Rule 14(3)).**" and "**1 rights request or grievance is open past TrustStack's 30-day response target (a target, not a statutory period).**"
- *Evidenced by* ends with **rights and grievance register: …** (two rows) and links to the register.
- The caveat at the foot says "**exposure model 1.2.0**".

### Step 11 — answer the overdue one, late

**Do:** Open **DPR-2026-001** → record its identity (any method) → **Record the response** → **Fulfilled** → **Save the response**. Go back to **Exposure**.

**Expect:** the request says "**Responded on day 95 — after the 90-day ceiling**" in red; the register's *Responded after the 90 days* is **1**. On Exposure, head 7 is back to **Not yet assessed**: with nothing open past ninety days and no assessment, nothing evidences it — and the 30-day target (DPR-2026-002) does not count as evidence, because it is a target, not a status.

### Step 12 — the grievance is about that request; the nomination names its nominee

**Do:** Open **GRV-2026-001**, then **DPR-2026-004**.

**Expect:** the grievance shows *About an earlier request* **DPR-2026-001** (a link). The nomination shows **Nominee: Demo Nominee**, **Relationship: Spouse**.

---

## Part D — the other tenants and permissions

### Step 13 — Bharat Manufacturing sees an empty register, and nothing of MU

**Do:** Sign in as **BML admin** → **Rights & grievances**.

**Expect:** counts all **0** and "**No request or grievance is recorded.** When a Data Principal writes, calls or visits…". The Overview's section says "No request or grievance is recorded."

**Then:** in the address bar open
`http://localhost:3001/api/v1/organizations/0b000000-0000-4000-8000-000000000001/rights-requests`
(use your port; this is Mumbai University's register).

**Expect:** an error with **403** — never MU's requests.

### Step 14 — the Dean cannot record; evidence attaches to a breach action again

**Do:** Sign in as **Dean** → open `http://localhost:3001/dashboard/rights/new`.

**Expect:** "*Recording a request or grievance needs the rights register's write permission…*" — and no form.

**Then (the Stage 1 fix):** sign in as **CISO** (Mumbai University) → **Breach register** → **BRH-2026-001** → on its action, choose any small PDF or text file under *Attach evidence* → attach.

**Expect:** the file appears under the action with **no red "Action not found."** (Stage 1 showed that error even though the file was attached.)

---

## When you are done

- Stop the app: press **Ctrl+C** in the Terminal running `pnpm dev`.
- What you recorded stays on your laptop only.
- To point `pnpm dev` back at the hosted database later, delete
  `apps/web/.env.development.local`.

## If something is different

Note the **step number**, what you **saw**, and a screenshot, and send it in
the next session with your approval — e.g. "Stage 2 approved; step 9 showed
day 97". Nothing here can harm the live site or real client data.
