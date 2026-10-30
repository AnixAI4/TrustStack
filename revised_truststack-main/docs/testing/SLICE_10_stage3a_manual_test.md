# Slice 10 · Stage 3a — manual test, step by step

About **20 minutes**. Twelve steps. Each one says **what to do** and **what
you should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack), not the
live site: a request can never be deleted. You play two people — the
**clinic's admin**, and a **member of the public** making a request.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 3a:
   ```bash
   git checkout slice/10-workflow-modules && git pull
   ```
   The Stage 3a migration is already on your laptop's database. If you ever
   reset it, run `pnpm db:migrate && pnpm db:seed`.
4. Start the app:
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line — usually **http://localhost:3001**. Use whatever
   address it prints. The `Environments:` line must mention
   `.env.development.local` (it points at your laptop's database).
5. **Password for the staff user:** `ci-local-only-Passw0rd-not-secret`
6. **For the member of the public, use your own email address** — the codes
   really are emailed. Each address gets at most **3 codes an hour**, so the
   steps below use your address with a `+` tag for the last part (Gmail
   delivers `you+lock@gmail.com` to `you@gmail.com`).
7. Use a **normal window for the admin** and a **private (incognito) window
   for the member of the public** — they must not share a sign-in.

| Short name | Email | What they are |
|---|---|---|
| **CISO** | `ciso@mumbai-university.example.com` | **Organisation Admin of "Demo Clinic Network"** (a healthcare tenant on your laptop) |
| **You** | your own email | A patient of the clinic — not a user, never signs in |

**If a code email never arrives** (the laptop has no email key): wait a
minute, then run this in a second Terminal — it gives the newest waiting
submission the code **424242**, exactly as if you had read it from the email:
```bash
docker exec -i supabase_db_truststack psql -U postgres -d postgres -c "UPDATE intake_submissions SET code_hash = encode(extensions.digest(id::text || ':424242', 'sha256'), 'hex') WHERE id = (SELECT id FROM intake_submissions WHERE confirmed_at IS NULL ORDER BY created_at DESC LIMIT 1);"
```

---

## Part A — the clinic opens its public pages (as the CISO, normal window)

### Step 1 — closed until you open it

**Do:** Sign in as **CISO** → choose **Demo Clinic Network** in the organisation
switcher → click **Organisation** in the top menu → scroll to **Public pages**.

**Expect:**
- A sentence citing **Rule 14** and **Rule 9**, ending "*the ninety days start then*".
- Status: "**Closed.** Nobody can make a request or a grievance online until an address and a contact are set."
- A *Public address* box with `/p/` before it and a grey suggestion **demo-clinic-network**; Contact name, Contact email, Contact phone (optional), and a tick box "This is our Data Protection Officer".

### Step 2 — open them

**Do:** Public address **`demo-clinic`** · Contact name **`Dr Meera Iyer`** ·
Contact email **`dpo@demo-clinic.example.com`** · tick the DPO box → **Save public pages**.

**Expect:**
- Green "**Public pages saved.**"
- Status: "Open at **/p/demo-clinic** — requests at /p/demo-clinic/rights, grievances at /p/demo-clinic/grievance."

*(Optional: type `Demo Clinic` with capitals or a space — the address turns red and Save is greyed out.)*

---

## Part B — a member of the public (private window, NOT signed in)

### Step 3 — the public page

**Do:** In the private window open **http://localhost:3001/p/demo-clinic**.

**Expect:**
- Small heading **Demo Clinic Network**, title **Your personal data**.
- Two boxes: **Make a request** and **Raise a grievance**.
- At the bottom: "*Questions about your personal data:* **Dr Meera Iyer, Data Protection Officer · dpo@demo-clinic.example.com**" and "answers every request and grievance within ninety days of receipt (DPDP Rules, 2025, Rule 14(3))".
- **No sign-in asked for.**

### Step 4 — nobody can probe for other organisations

**Do:** Open each of these in turn:
- http://localhost:3001/p/no-such-clinic
- http://localhost:3001/p/mumbai-university
- http://localhost:3001/p/Demo_Clinic

**Expect:** all three show the **same "404 — This page could not be found."**
(Mumbai University has a contact but no public address, so it looks exactly
like an organisation that does not exist.)

### Step 5 — make an erasure request

**Do:** Back on http://localhost:3001/p/demo-clinic → **Make a request** →
choose **Erasure** → Your name **`Test Patient`** · Your email **your own
address** · How Demo Clinic Network knows you **`Patient number DC-1001`** ·
Your request **`Please erase the old mobile number you hold for me.`** → **Send**.

**Expect:**
- Six choices were listed, each with its section (Erasure says "(s.12(3))").
- Now: **Check your email** — "We sent a six-digit code to **yo\*\*\*\*@…**" (your address, masked) "Enter it within 10 minutes. Nothing reaches Demo Clinic Network until the code is entered."
- Within a minute an email: subject "**Your confirmation code for Demo Clinic Network: NNNNNN**", the code in a box, "nothing is recorded unless the code is entered", and the line *Questions about your personal data: Dr Meera Iyer, Data Protection Officer · dpo@demo-clinic.example.com*.

### Step 6 — a wrong code, then a new code

**Do:** Type **`000000`** → **Confirm**. Then press **Send a new code**.

**Expect:**
- Red "**That code is not right. Check the email and try again. 4 tries left.**" (no "Start again" link).
- After *Send a new code*: "A new code is on its way to yo\*\*\*\*@…. The old one no longer works." — and a **second** email arrives with a different code.

### Step 7 — confirm

**Do:** Enter the **newest** code → **Confirm**.

**Expect:**
- Green box "**Your request has been received**": Reference **DPR-2026-00N**, Received on **today's date**, To be answered by **today + 90 days**.
- "…must answer within ninety days of receipt (DPDP Rules, 2025, Rule 14(3)) … may ask you to confirm your identity." and "We have emailed you these details."
- A **third** email: "Demo Clinic Network received your request — DPR-2026-00N" with the same three dates.

*(Write the reference down: ____________)*

### Step 8 — a grievance about that request

**Do:** Open http://localhost:3001/p/demo-clinic/grievance → name **`Test Patient`** ·
email **exactly the same address as Step 5** (a grievance is linked to an
earlier request only when it comes from the same address) · *Is this about
an earlier request?* type the reference from Step 7 in **small letters** ·
Your grievance **`Nobody has confirmed the erasure.`** → **Send** → enter the
code from the email → **Confirm**.

**Expect:** "**Your grievance has been received**" with a **GRV-2026-00N** reference.

*(This is the third code to that address this hour — the limit. A fourth
would say "Too many attempts. Please wait an hour and try again." If that
happens, use the 424242 command at the top after pressing Send.)*

### Step 9 — five wrong codes lock a submission

**Do:** Make one more request on http://localhost:3001/p/demo-clinic/rights
(any right) with **`you+lock@…`** as the email → **Send** → enter **`000000`**
five times.

**Expect:** tries left counts down 4, 3, 2, 1, then "**Too many wrong codes.
Please start again.**" with a **Start again** link. Even the real code from
the email no longer works.

---

## Part C — the clinic's register (as the CISO, normal window)

### Step 10 — the request arrived, labelled "Web form"

**Do:** Click **Rights & grievances**.

**Expect:**
- Your **DPR-2026-00N** and **GRV-2026-00N** at the top, each with a blue **Web form** chip.
- **No entry for the locked request** from Step 9 (it never reached the register).

### Step 11 — the request's page: the code was not the identity check

**Do:** Open the **DPR** entry. In *Response*, choose **Fulfilled**, today's date → record it.

**Expect:**
- *Details*: **Arrived by Web form** · Identifier given **Patient number DC-1001** · **Recorded by: The public form, email address confirmed — <today, time>**.
- *Response clock*: Received **today**, Respond by **today + 90 days**.
- Recording **Fulfilled** is refused until an identity check is recorded — the emailed code proved the address, not the person (Stage 2's rule stands). Do not record one; leave the request open.

**Then open the GRV entry. Expect:** *About an earlier request* is a link to
your DPR (it came from the same address).

### Step 12 — close the pages

**Do:** **Organisation** → *Public pages* → **Close public pages**. Then reload
http://localhost:3001/p/demo-clinic in the private window.

**Expect:**
- "**The public pages are closed.**" and the status says **Closed.** — the contact fields still filled in.
- The private window shows the **404** page.
- **Rights & grievances** still lists both web-form entries.

---

## Done

If every step matched, reply **"Stage 3a approved"** (or "Stage 3a approved
with changes: …"). Stop the app with **Ctrl + C** in its Terminal.
