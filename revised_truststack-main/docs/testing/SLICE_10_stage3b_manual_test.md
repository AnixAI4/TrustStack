# Slice 10 · Stage 3b — manual test, step by step

About **25 minutes**. Fifteen steps. Each one says **what to do** and **what
you should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack), not the
live site: a published notice and a consent record can never be deleted. You
play two people — the **clinic's admin**, and a **visitor to the clinic's
website**.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 3b:
   ```bash
   git checkout slice/10-workflow-modules && git pull
   ```
   The Stage 3b migration is **already on your laptop's database** (Claude
   applied and seeded it). **Do not run `pnpm db:migrate` or `pnpm db:seed` in a
   plain Terminal**: the project's `.env.local` points at the **live**
   database, so they would change hosted before you approve. (Claude runs them
   with the laptop's settings exported.)
4. Start the app:
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line — usually **http://localhost:3001**. If it prints
   another port, use that everywhere below **and** add `?app=http://localhost:<port>`
   to the demo website's address in Step 7.
5. In a **second Terminal**, in the same folder, start the stand-in for the
   clinic's own website (it serves one page, `docs/testing/consent-widget-demo.html`):
   ```bash
   python3 -m http.server 8090 --bind 127.0.0.1 --directory docs/testing
   ```
6. **Password for the staff user:** `ci-local-only-Passw0rd-not-secret`
7. Use a **normal window for the admin** and **private (incognito) windows for
   the visitor** — they must not share anything.

| Short name | Email | What they are |
|---|---|---|
| **CISO** | `ciso@mumbai-university.example.com` | **Organisation Admin of "Demo Clinic Network"** (the healthcare tenant on your laptop) |
| **Visitor** | — | Someone browsing the clinic's website. Never signs in. |

---

## Part A — the privacy notice (as the CISO, normal window)

### Step 1 — open the clinic's public pages again

**Do:** Sign in as **CISO** → choose **Demo Clinic Network** in the organisation
switcher → **Organisation** → *Public pages* (you closed them at the end of
Stage 3a; the contact is still filled in) → click into *Public address* and
**type** **`demo-clinic`** (the grey `demo-clinic-network` in an empty box is only
a suggestion — it is not saved unless you type; the **Use demo-clinic-network** button would fill it, but this test uses `demo-clinic`) → **Save public pages**.

**Expect:** "**Public pages saved.**" and the status "Open at **/p/demo-clinic** …".
If you save with the box empty, an **amber** note says the pages are **still closed** — type the address and save again.
Every later step that opens a `/p/…` page needs this.

### Step 2 — the new page, empty

**Do:** Click **Notice & consent** in the top menu.

**Expect:**
- A sentence citing **section 5, Rule 3**, **section 6**, **section 9(1)** and **Rules 10 and 11**.
- Six counts, all **0**: *People with a record · Consent given · Refused · Withdrawn · Given by a parent or guardian · …with no verification recorded*.
- *Privacy notice*: "**No notice is written yet.** …" and a **Write a new version** button.
- *Consent widget*: "**No widget version is published.** …", and below it "Write a notice first …".
- *Record a consent*: "A consent is recorded against a published widget version — publish one first."

### Step 3 — write the notice; see what Rule 3 asks for

**Do:** **Write a new version** → Language **English** · Title **`How the clinic uses your personal data`**.
In the first purpose: Key **`appointment_reminders`** · Title **`Appointment reminders`** — and stop.

**Expect:** An amber box listing what is missing, including
"*Say what "Appointment reminders" provides or enables (Rule 3(b)(ii)).*" and
"*Itemise the personal data "Appointment reminders" needs (Rule 3(b)(i)).*"
Under each *other means* box, the wording every notice shows regardless
(withdrawal; the request and grievance forms; the **Data Protection Board**).

**Then do:** What it provides or enables **`Text and email reminders before your appointments.`** ·
personal data, one per line: **`Name`**, **`Mobile number`**. **Add a purpose** →
Key **`health_newsletter`** · Title **`Health newsletter`** · **`A monthly newsletter on the clinic's services.`** ·
data **`Name`**, **`Email address`** → **Save draft**.

**Expect:**
- The amber box is gone; "*The itemised personal data, across every purpose: Name, Mobile number, Email address.*"
- Green "**Draft saved.**"; the heading reads "**English privacy notice — version 1 (draft)**".
- Buttons **Save draft · Publish version 1 · Discard the draft**.

### Step 4 — publish it; it can no longer change

**Do:** **Publish version 1**.

**Expect:**
- "**Version 1 is published.**" and "Published <today, time> by <your name>. A published version never changes."
- The form is gone: the notice is shown read-only — *The personal data we process (Rule 3(b)(i))*: **Name, Mobile number, Email address**, and both purposes.
- A button **Start a new version from this one**.

### Step 5 — the public notice page (private window, NOT signed in)

**Do:** Open a private window → **http://localhost:3001/p/demo-clinic**.

**Expect:** Besides *Make a request* and *Raise a grievance*, a third card
**Read our privacy notice**. Click it.

**Expect** (at `/p/demo-clinic/notice`):
- Title **How the clinic uses your personal data**, and "English · version 1 · published <today>".
- Five sections: **The personal data we process** (three items) · **Why we process it** (two purposes, each with its personal data) · **How to withdraw your consent** ("…open "Privacy choices" on our website…") · **How to exercise your rights** (links *make a request*, *raise a grievance*) · **How to complain to the Data Protection Board** ("…after first using our grievance redressal (section 13(3) of the Act)").
- The contact line at the bottom (Dr Meera Iyer, as in Stage 3a).

---

## Part B — the consent widget

### Step 6 — publish a widget version (as the CISO, normal window)

**Do:** Back on **Notice & consent** (reload). In *Consent widget*: Notice it
cites — **English v1 — Published** · tick **Appointment reminders** and
**Health newsletter** · Languages: English (greyed, always on), **Hindi** and
**Marathi** already ticked; the others say "(translation pending)" → **Save draft** → **Publish version 1**.

**Expect:**
- "**Live: version 1, citing the English notice v1 — offers appointment_reminders, health_newsletter.**" (or in the order you ticked them).
- A grey box with the snippet to paste: `<script src="http://localhost:3001/widget/consent-v1.js" data-org="demo-clinic" async></script>`.

### Step 7 — the clinic's website asks — nothing ticked (private window)

**Do:** New private window → **http://127.0.0.1:8090/consent-widget-demo.html**

**Expect:**
- A page titled **Demo Clinic** ("This page stands in for the clinic's own website…").
- A bar along the bottom: **We value your privacy**, then the two purposes, each with what it is for and "*Personal data: …*".
- **Both boxes unticked.**
- Buttons **Accept all · Reject all · Save my choices**, and "You can withdraw consent at any time. **Read the privacy notice**" (the link opens Step 5's page).

### Step 8 — choose one purpose

**Do:** Tick **Appointment reminders** only → **Save my choices**.

**Expect:** A dark note "**Your choices are saved.**"; the bar disappears; a
**Privacy choices** button sits bottom-left.

### Step 9 — withdraw, as easily as you gave it

**Do:** Reload the page.

**Expect:** No bar this time — only the **Privacy choices** button.

**Do:** Click **Privacy choices**.

**Expect:** The bar again, **Appointment reminders ticked**, and a red **Withdraw consent** button.

**Do:** **Withdraw consent**.

**Expect:** "**Your consent has been withdrawn.**" and the **Privacy choices** button again.

### Step 10 — Hindi, and a refusal

**Do:** Close **every** private window (while any one is open they share the
same memory, and the widget would remember you). Then open a new private
window → **http://127.0.0.1:8090/consent-widget-demo.html?lang=hi**

**Expect:**
- The title **हम आपकी गोपनीयता को महत्व देते हैं** and the buttons **सभी स्वीकार करें · सभी अस्वीकार करें · मेरी पसंद सहेजें**.
- The description and the purposes **still in English** — by design: only the earlier widget's Hindi phrases are used; nothing new was machine-translated.

**Do:** **सभी अस्वीकार करें** (Reject all).

**Expect:** The bar closes ("Your choices are saved." — in English, by design).

---

## Part C — the register, and children (as the CISO, normal window)

### Step 11 — what the widget recorded

**Do:** **Notice & consent** (reload).

**Expect:**
- Counts: People with a record **2** · Consent given **0** · Refused **1** · Withdrawn **1** · the other two **0**.
- *Latest choices*: **Consent refused**, **Consent withdrawn**, **Consent given** (appointment_reminders) — each "**The consent widget** · <time> · widget v1", each with a 12-character code (the pseudonymous key). **No name, no identifier anywhere.**

### Step 12 — a child's consent, not yet verified

**Do:** In *Record a consent*: identifier **`MRN-1001`** · Their choice **Consent given** ·
tick **appointment_reminders** · Whose consent **A child — the consent of a parent** ·
How verified **Not verified yet** · Where it is on file **`Paediatric form 1`** → **Record**.

**Expect:**
- "**Recorded.**"
- *Given by a parent or guardian* **1** and *…with no verification recorded* **1**, in red.
- At the top of *Latest choices*: "Consent given · appointment_reminders · **A child — the consent of a parent — no verification recorded**" (red) · "Recorded by staff (<your name>)".

*(Optional: choose* Whose consent: The Data Principal *— the "How verified" box disappears; a basis only fits a child or a ward.)*

### Step 13 — the exposure view says so (model 1.3.0)

**Do:** Click **Exposure** in the top menu → find head **3** (children's data).

**Expect:**
- Head 3 is **Exposed**.
- Among its reasons: "**1 consent given on behalf of a child or a person with disability has no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).**"
- The caveat at the bottom says "**exposure model 1.3.0**".

### Step 14 — record the verification; look the person up

**Do:** Back on **Notice & consent** → *Record a consent*: identifier **`MRN-1001`** ·
**Consent given** · **appointment_reminders** · **A child — the consent of a parent** ·
How verified **A virtual token mapped to identity and age, e.g. DigiLocker (Rule 10(1)(b)(ii))** ·
on file **`DigiLocker checked`** → **Record**.

**Expect:** *…with no verification recorded* back to **0**; *Given by a parent or guardian* still **1**.

**Do:** *Look up a person* → **`MRN-1001`** → **Find**.

**Expect:** "**Now: Consent given — appointment_reminders**", then two records, newest first: the one with the **DigiLocker** basis, then the unverified one. The first record was not changed — a verification is a new record.

**Then:** **Exposure** → head 3 no longer lists the reason from Step 13.

### Step 15 — a published notice never changes; close the pages

**Do:** **Notice & consent** → click the notice title → **Start a new version from this one**.

**Expect:** The form, filled in with version 1's words, headed "A new version of the privacy notice".

**Do:** Change the title to **`Our privacy notice`** → **Save draft**.

**Expect:** "**Draft saved.**", heading "**English privacy notice — version 2 (draft)**". In a private window, open **http://localhost:3001/p/demo-clinic/notice**: still **version 1**, the old title — a draft never reaches the public.

**Do:** **Discard the draft** → you are back on *Notice & consent*, which lists **English · v1 · Published** only. Then **Organisation** → *Public pages* → **Close public pages**, and reload the demo website and the notice page.

**Expect:** The notice page shows the **404** page; the demo website shows no bar and no button (the widget finds nothing to show).

---

## Done

If every step matched, reply **"Stage 3b approved"** (or "Stage 3b approved
with changes: …"). Stop the app with **Ctrl + C** in its Terminal, and the
demo website with **Ctrl + C** in the second one.
