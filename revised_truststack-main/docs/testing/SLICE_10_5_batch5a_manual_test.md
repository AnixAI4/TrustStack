# Slice 10.5 · Batch B5a — the processor questionnaire in sections: manual test, step by step

About **15 minutes**. Eight steps. Each one says **what to do** and **what you
should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack). This
batch changes one thing you asked for (D-107, N1): the **processor
questionnaire** — the vendor's link page and the staff page — is no longer one
long page of 44 questions. Each section (A–G) is its own tab, with "answered x
of n" on it, **Next** saves and moves on, and a last tab holds the review (and,
for the vendor, the declaration and **Sign and submit**). Try it on your laptop
**and** with the browser narrowed to phone width.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Batch B5a (no new packages, no migration):
   ```bash
   git fetch && git checkout slice/10-5-b5a-questionnaire && git pull
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
5. **Password:** `ci-local-only-Passw0rd-not-secret` — you play **Legal**
   (`legal@mumbai-university.example.com`) and the vendor.

---

## Part A — the vendor's link page

### Step 1 — send the vendor a link (setup)

**Do:** Sign in as **Legal** → **Processors** → **Payment gateway provider** →
**Assessments** tab → **Start a new version** → under *Ask the vendor to answer*:
respondent's name **`Test Respondent`**, email **your own address** → **Send the link**.
Open the link from the email in a **private window**.

> **No email?** In a Terminal run this, then open
> `http://localhost:3001/v/ManualTestB5aVendorLink00000000000000000000` in the private window:
> ```bash
> docker exec -i supabase_db_truststack psql -U postgres -d postgres -c "UPDATE vendor_assessment_links SET token_hash = encode(extensions.digest('ManualTestB5aVendorLink00000000000000000000', 'sha256'), 'hex') WHERE id = (SELECT id FROM vendor_assessment_links WHERE revoked_at IS NULL AND submitted_at IS NULL ORDER BY created_at DESC LIMIT 1);"
> ```

**Then do:** **Email me a code** → enter the code from the email → **Confirm**.

> **No code email?** Run this, then enter **424242**:
> ```bash
> docker exec -i supabase_db_truststack psql -U postgres -d postgres -c "UPDATE vendor_assessment_links SET code_hash = encode(extensions.digest(token_hash || ':424242', 'sha256'), 'hex') WHERE id = (SELECT id FROM vendor_assessment_links WHERE revoked_at IS NULL AND submitted_at IS NULL AND code_hash IS NOT NULL ORDER BY created_at DESC LIMIT 1);"
> ```

**Expect:** Under *Your documents*, a row of **pills**: **A · Company 5/5** ·
**B · Data handling 7/7** · **C · Security 8/8** · **D · Sub-processors 6/6** ·
**E · Residency 6/6** · **F · Incidents 6/6** · **G · DPDP duties 6/6** ·
**Review and send** (version 1's answers are carried over, so every badge is
**green**). **A** is selected and only **section A's** six questions show — not
all 44. All eight pills are visible at once (no sideways scrolling).

### Step 2 — one section at a time

**Do:** Click **C · Security**. Then click **Next: D. Sub-processors** at the
bottom of section C.

**Expect:** Only section C's eight questions show. **Next** shows a green
"**Saved.**" and moves you to **D** (the page scrolls back up to the pills).
**Back** at the bottom of D returns to C.

### Step 3 — an unanswered question shows on its section

**Do:** In **A · Company**, set **A2** (*How long has your company been
operating?*) back to **Choose…**.

**Expect:** The **A** pill changes to **4/5** (grey, not green), and the bar at
the bottom says **43 of 44 questions answered**.

### Step 4 — the review, the declaration and the one Submit

**Do:** Click **Review and send**.

**Expect:** "**Before you send**": one line per section — **A. Company and
certifications — 4 of 5 answered · still to answer: A2** in dark text, the others
green "… of … answered". If a "yes" claims a document with none cited, an amber
line names those questions. Below it, the **Declaration** (your name, your role,
the tick box) and **Sign and submit**, which stays disabled until the role is
filled and the box ticked. **Do not submit.**

**Then do:** Press **Save** in the bar at the bottom, then reload the page.

**Expect:** You are still on **Review and send** (the tab is kept in the
address, `#review`), and section A still reads **4 of 5 · still to answer: A2**
— the saved answers and the badges agree.

### Step 5 — on a phone

**Do:** Make the private window narrow (phone width) and look at the pills.

**Expect:** The pills **wrap onto three or four lines**; every section is still
visible and tappable. **Next** and **Back** sit under each section; **Save** stays
in the bar at the bottom.

---

## Part B — the staff page

### Step 6 — the same sections for staff

**Do:** In your normal window (Legal), open the assessment you started
(**Processors** → **Payment gateway provider** → **Assessments** → **Version 2**).

**Expect:** The same pills — **A · Company … G · DPDP duties · Review** — with
"x/n" badges, under the summary and the *Ask the vendor to answer* panel. While
the vendor's link is open the answers are read-only here; the questions keep the
staff wording ("Is **the vendor** ISO/IEC 27001 certified?").

### Step 7 — the staff review tab

**Do:** Click **Review**.

**Expect:** One line per section — "answered x of n", what is still to answer,
and any **claimed, no evidence** question by its code (e.g. C4). A line under it
says the answers are read-only while the link is open.

### Step 8 — tidy up

**Do:** On the staff page press **Revoke the link** (confirm), then **Discard**
at the bottom (confirm).

**Expect:** The vendor's private window now shows "This page is not available"
on reload. You are back on the processor page, which shows version 1 only.
(Claude also rebuilds your local database to the clean seed after your test.)

---

## When you are done

Stop the app with **Ctrl + C**. If everything matched, reply **"Batch B5a
approved"** (or "approved with changes: …"). Then **Batch B1** starts in a new
window with "Start Slice 10.5 Batch B1".
