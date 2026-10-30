# Slice 10.5 · Batch B5 — the public surfaces: manual test, step by step

About **20 minutes**. Eight steps. Each one says **what to do** and **what you
should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack). This
batch changes only what **Data Principals and vendors** see: the consent
widget, the public privacy pages, the not-found page, the vendor's
questionnaire link and the grievance receipt email. Nothing on the dashboard
changes. Try the public pages on your laptop **and** with the browser narrowed
to phone width.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Batch B5:
   ```bash
   git fetch && git checkout slice/10-5-b5-public && git pull && pnpm install
   ```
   Your laptop's database was rebuilt from scratch by Claude on 2026-10-17
   (the seed). **Do not run `pnpm db:migrate` or `pnpm db:seed` in a plain
   Terminal**: the project's `.env.local` points at the **live** database.
   (B5 has no migration anyway.)
4. Start the app:
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line — usually **http://localhost:3001**. If it prints
   another port, use that everywhere below.
5. In a **second** Terminal tab, in the same folder, serve the stand-in
   website for the consent widget (leave it running):
   ```bash
   python3 -m http.server 8090 --bind 127.0.0.1 --directory docs/testing
   ```
6. **Password for every user:** `ci-local-only-Passw0rd-not-secret`

| Short name | Email |
|---|---|
| **Admin** | `it.admin@mumbai-university.example.com` |
| **Legal** | `legal@mumbai-university.example.com` |

---

### Step 1 — open Mumbai University's public pages (setup)

**Do:** Sign in as **Admin** → **Organisation** → *Public pages*. Public address
**`mumbai-university`**, contact name **`Dr A. Kulkarni`**, contact email
**`dpo@mumbai-university.example.com`**, tick *This is our Data Protection
Officer* → **Save public pages**.

**Expect:** "Public pages saved." and "Open at /p/mumbai-university". (This
writes only to your laptop's database.)

### Step 2 — one name for the organisation (F5.2)

**Do:** In a **private window**, open **http://localhost:3001/p/mumbai-university**.

**Expect:** "MUMBAI UNIVERSITY" at the top and in the text. At the bottom,
the name appears once with its legal name in brackets: "**Mumbai University
(University of Mumbai)** answers every request and grievance within ninety
days…". No "University of Mumbai" on its own anywhere. **No** "← Back" link on
this page.

### Step 3 — a way back, and a button that says what happens (F5.3)

**Do:** Click **Make a request**.

**Expect:** Above the title, "**← Back to Mumbai University's privacy page**".
The button at the bottom reads "**Send — we'll email you a code**". Click the
back link → you are on the first page again. Do the same through **Raise a
grievance** and **Read our privacy notice** — both have the back link.

### Step 4 — one plain page for every dead link (F5.4)

**Do:** In the private window open each of these, one after another:
- **http://localhost:3001/p/no-such-organisation**
- **http://localhost:3001/p/Not_A_Slug/rights**
- **http://localhost:3001/v/not-a-real-token**

**Expect:** The **same** page every time: the navy shield, "**This page is not
available**", "The link may have expired or already been used, or the address
may not be right", and "If someone sent you this link, ask them for a new one…".
It never names an organisation and never says why. (Before this batch it was a
bare "404 — This page could not be found.")

### Step 5 — the consent widget names who is asking (F5.1)

**Do:** New private window → **http://127.0.0.1:8090/consent-widget-demo.html?org=mumbai-university**

**Expect:** The widget opens by itself: "We value your privacy", then
"**Mumbai University asks for your consent** to use your personal data for the
purposes below. Nothing is ticked…". **Accept all** and **Reject all** look
**exactly the same** (both filled navy); "Save my choices" is outlined. Nothing
is ticked. Click **Reject all** → "Your choices are saved."

### Step 6 — the vendor link, in the vendor's own words (F5.5)

**Do:** Back in your normal window, sign out → **Legal** → **Processors** →
**Payment gateway provider** → **Start a new version** → *Respondent's name*
**`Test Respondent`**, email **your own address** → **Send the link**.
Open the link from the email in a private window.

> **No email?** In a Terminal run this, then open
> `http://localhost:3001/v/ManualTestB5VendorLink000000000000000000000` in the private window:
> ```bash
> docker exec -i supabase_db_truststack psql -U postgres -d postgres -c "UPDATE vendor_assessment_links SET token_hash = encode(extensions.digest('ManualTestB5VendorLink000000000000000000000', 'sha256'), 'hex') WHERE id = (SELECT id FROM vendor_assessment_links WHERE revoked_at IS NULL AND submitted_at IS NULL ORDER BY created_at DESC LIMIT 1);"
> ```

**Expect:** "**Email me a code**" is a **filled navy** button (it was a plain
outlined one). The footer reads "Mumbai University (University of Mumbai) asks
its processors these questions…".

**Then do:** **Email me a code** → enter the code from the email → **Confirm**.

> **No code email?** Run this, then enter **424242**:
> ```bash
> docker exec -i supabase_db_truststack psql -U postgres -d postgres -c "UPDATE vendor_assessment_links SET code_hash = encode(extensions.digest(token_hash || ':424242', 'sha256'), 'hex') WHERE id = (SELECT id FROM vendor_assessment_links WHERE revoked_at IS NULL AND submitted_at IS NULL AND code_hash IS NOT NULL ORDER BY created_at DESC LIMIT 1);"
> ```

**Expect:** The questions speak **to the vendor**: "A3 Is **your company**
ISO/IEC 27001 certified?", "G4 Do **you** process **Mumbai University's** data
only on its documented instructions…?", section B "What personal data you
process for Mumbai University, and how." At the bottom, in the bar that stays on
screen as you scroll: "**44 of 44 questions answered**" (version 1's answers are
carried over) next to **Save** and **Sign and submit**. The declaration asks
"Your role at your company". Do not submit — just look.

**Then check the staff side:** in your normal window (Legal), the same
assessment still reads "Is the vendor ISO/IEC 27001 certified?" and "Do they
process data…" — the staff wording is unchanged.

### Step 7 — the grievance receipt email (F5.6)

**Do:** Open **http://localhost:3001/p/mumbai-university/grievance** in a
private window, fill the form with **your own email**, **Send — we'll email you
a code**, enter the code, confirm.

> **No code email?** Run this, then enter **424242**:
> ```bash
> docker exec -i supabase_db_truststack psql -U postgres -d postgres -c "UPDATE intake_submissions SET code_hash = encode(extensions.digest(id::text || ':424242', 'sha256'), 'hex') WHERE id = (SELECT id FROM intake_submissions WHERE confirmed_at IS NULL ORDER BY created_at DESC LIMIT 1);"
> ```

**Expect:** The receipt email ("Mumbai University received your grievance —
GRV-…") ends with: "**If you are not satisfied with how we respond to a
grievance, you may complain to the Data Protection Board of India, after first
using our grievance redressal (section 13(3) of the Act).**" (If no email
arrives on your laptop, look at the picture
`docs/testing/slice10_5-b5/after/U03-grievance-receipt-email.webp`.) A **request**
(Step 3's form) does not carry this line.

### Step 8 — close the public pages again (tidy up)

**Do:** As **Admin** → **Organisation** → *Public pages* → **Close public pages**.

**Expect:** "Closed." Open **http://localhost:3001/p/mumbai-university** →
the same "This page is not available" page as Step 4.

---

## When you are done

Stop the app and the stand-in website with **Ctrl+C** in their Terminal tabs.
Then reply **"Batch B5 approved"** (or "approved with changes: …").
