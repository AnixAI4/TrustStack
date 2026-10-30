# Slice 10 · Stage 4b — manual test, step by step

About **25 minutes**. Fifteen steps. Each one says **what to do** and **what
you should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack), not the
live site: an accepted assessment can never be deleted. You play four people
**and the vendor** — the vendor in a **private window**, signed in as nobody.
The point of this stage: a vendor can answer for themselves, nothing they
submit counts until someone here accepts it, and **whoever sent them the link
is never the one who accepts it**.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 4b:
   ```bash
   git checkout slice/10-workflow-modules && git pull
   ```
   The Stage 4b migration and seed are **already on your laptop's database**
   (Claude applied them). **Do not run `pnpm db:migrate` or `pnpm db:seed` in a
   plain Terminal**: the project's `.env.local` points at the **live**
   database, so they would change hosted before you approve.
4. Start the app:
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line — usually **http://localhost:3001**. If it prints
   another port, use that everywhere below.
5. **Password for every user:** `ci-local-only-Passw0rd-not-secret`
6. To change person: **Sign out** (top right), then sign in as the next one.
7. **The vendor's emails go to a real address** — use your own (written
   *you@…* below). If one never arrives, the box at the end of the step gives a
   one-line Terminal fallback.

| Short name | Email | Who they are in Mumbai University |
|---|---|---|
| **Dean** | `dean@mumbai-university.example.com` | Executive Sponsor — reads only |
| **Legal** | `legal@mumbai-university.example.com` | Legal User — assesses, may review, **sends the links** |
| **Registrar** | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner — may review |
| **Admin** | `it.admin@mumbai-university.example.com` | Organisation Admin — may review |

*Your laptop's MU data already holds what your Stage 4a test did (the LMS
provider's v1 accepted). The counts below allow for it.*

---

## Part A — what a vendor's answers look like (the seeded proctoring vendor)

### Step 1 — the register (as the Dean)

**Do:** Sign in as **Dean** → **Processors**.

**Expect:**
- A new count **With the vendor 0**, beside **Awaiting review 1**.
- **AI proctoring vendor**: "**v1 awaiting review**".

### Step 2 — the vendor's page (as the Dean)

**Do:** Click **AI proctoring vendor**.

**Expect:**
- *Documents*: **proctoring-vendor-soc2-summary-SAMPLE.txt** — "uploaded … **by the vendor's respondent**", review: pending.
- *Assessments*: **Version 1 · Awaiting review · Risk 34 (Medium)** — "**Answered by the vendor** · started by MU Legal Counsel · **declared by Priya Menon (SAMPLE), Information Security Manager (SAMPLE)** · source: Answered by the vendor through the questionnaire link sent on 12 Oct 2026".

### Step 3 — the vendor's answers (as the Dean)

**Do:** Click **Version 1**.

**Expect:**
- *Source*: "Answered by the vendor — Answered by the vendor through the questionnaire link sent on 12 Oct 2026". *Submitted*: "**the vendor's respondent**, 13 Oct 2026 …".
- A grey box: "**Declared by the vendor's respondent — "These answers are accurate and complete." — signed Priya Menon (SAMPLE), Information Security Manager (SAMPLE)** … A declaration is the vendor's word, not evidence: the documents and the review are the check."
- Amber "**Claimed, no evidence: A3, D2.**"
- **A4**: "Yes · backed by proctoring-vendor-soc2-summary-SAMPLE.txt **(from the vendor)** · answered by **the vendor's respondent**". Every answer says "answered by the vendor's respondent".
- No Review box (the Dean reads only), no "Ask the vendor" panel (it is not a draft).

### Step 4 — the sender may not review (as Legal)

**Do:** Sign out → **Legal** → open the same page (Processors → AI proctoring vendor → Version 1).

**Expect:** A **Review** box saying only "**You sent this assessment to the vendor — someone else must review their answers.**" — no Accept, no Return.

### Step 5 — someone else accepts it (as the Registrar)

**Do:** Sign out → **Registrar** → same page → leave *Review by* as it is → **Accept**.

**Expect:** Status **Accepted**; *Reviewed* "Registrar (DPDP Programme Owner), {now}". Back on **Processors**: **Awaiting review 0**.

---

## Part B — send a link, and answer as the vendor (the payment gateway's version 2)

### Step 6 — start a new version and send it (as Legal)

**Do:** Sign out → **Legal** → Processors → **Payment gateway provider** → **Start a new version**.

**Expect:** Version 2, **Draft**, the answers of version 1 already filled in, and a new panel **"Ask the vendor to answer"** with *Respondent's name* and *Their work email address*.

**Then do:** Name **`Test Respondent`**, email **you@…** → **Send the link**.

**Expect:**
- Green: "**Link emailed to you@… It works for 14 days.**"
- The panel turns blue: "**With the vendor:** sent to Test Respondent (you@…) by MU Legal Counsel on {now} · open until {14 days on} · not yet opened. While the link is open only the vendor can change the answers. …" and a **Revoke the link** button.
- *Source*: "Answered by the vendor — not yet stated". **No Save, no Submit** — the questions show their answers but cannot be changed.
- Processors: **With the vendor 1**; the payment gateway's row has a blue "**With the vendor**".

### Step 7 — the email (you, as the vendor)

**Expect** (within a minute, in your inbox): subject "**Mumbai University asks you to complete a processor questionnaire**" — "Dear Test Respondent, Mumbai University asks you to answer its processor questionnaire about **Payment gateway provider** …", an **Open the questionnaire** button, "works until {date, time} IST", the declaration it will ask you to sign, and "do not forward it".

**Do:** Copy the button's link. Open a **private window** (Safari: ⇧⌘N; Chrome: ⇧⌘N) and paste it.

> **No email?** In a second Terminal run this, then open
> `http://localhost:3001/v/ManualTest4bVendorLink000000000000000000000` in the private window:
> ```bash
> docker exec -i supabase_db_truststack psql -U postgres -d postgres -c "UPDATE vendor_assessment_links SET token_hash = encode(extensions.digest('ManualTest4bVendorLink000000000000000000000', 'sha256'), 'hex') WHERE id = (SELECT id FROM vendor_assessment_links WHERE revoked_at IS NULL AND submitted_at IS NULL ORDER BY created_at DESC LIMIT 1);"
> ```

### Step 8 — confirm it is you (the vendor, private window)

**Expect:** "**MUMBAI UNIVERSITY** · Processor questionnaire — Payment gateway provider"; "Mumbai University asks you, Test Respondent, to answer its processor questionnaire about **Payment gateway provider** … The link works until …"; your address **masked** (e.g. "yo\*\*\*\*@…"); **Email me a code**. No questions yet.

**Do:** **Email me a code** → type **`000000`** → **Confirm**.

**Expect:** Green "We sent a code to yo\*\*\*\*@…"; after the wrong code, red "**That code is not right. Check the email and try again. 4 tries left.**"

**Then do:** Type the **real code** from the email (subject "Your code for Mumbai University's questionnaire: NNNNNN") → **Confirm**.

**Expect:** The questionnaire opens: "Answering as Test Respondent (yo\*\*\*\*@…) for Mumbai University …", **Your documents**, sections A–G, the declaration, and **Save** / **Sign and submit** at the bottom.

> **No code email?** Ask for one on the page first, then run (and enter **424242**):
> ```bash
> docker exec -i supabase_db_truststack psql -U postgres -d postgres -c "UPDATE vendor_assessment_links SET code_hash = encode(extensions.digest(token_hash || ':424242', 'sha256'), 'hex') WHERE id = (SELECT id FROM vendor_assessment_links WHERE revoked_at IS NULL AND submitted_at IS NULL AND code_hash IS NOT NULL ORDER BY created_at DESC LIMIT 1);"
> ```

### Step 9 — what the vendor sees (the vendor)

**Expect:**
- Every answer from version 1 is already chosen. **A3** and **G1**: the document box shows "**A document the organisation already holds**" — the file's name is not shown.
- **C4** ("independent penetration testing") says "Yes" and, in amber, "**Claimed, no evidence** …".
- No score, no flags, no reviewer anywhere on the page.

### Step 10 — upload, cite, change an answer, save (the vendor)

**Do:** Under **Your documents**, choose the file
`docs/testing/sample-vendor-dpa-SAMPLE.txt` from the project folder.

**Expect:** Green "**sample-vendor-dpa-SAMPLE.txt uploaded. Cite it on the answer it backs.**", and it is listed under *Your documents*.

**Then do:** On **C4**, choose **sample-vendor-dpa-SAMPLE.txt** in its document box (the amber line goes). On **C1** ("encrypted in transit") choose **No**. → **Save**.

**Expect:** Green "**Saved.**" Reload the page: C1 is still **No**, C4 still cites your file.

### Step 11 — sign and submit (the vendor)

**Do:** In **Declaration**: *Your name* is already "Test Respondent"; *Your role* **`Test respondent`**. Note **Sign and submit** is greyed. Tick "**These answers are accurate and complete.**" → **Sign and submit**.

**Expect:** Green "**Thank you — your answers were submitted on {now}.** Mumbai University will review them. Nothing is final until it does … This link no longer works."

**Then do:** Reload the page.

**Expect:** The "**404 — This page could not be found**" page, exactly as for a link that never existed. Close the private window.

### Step 12 — what the organisation sees (as Legal, normal window)

**Do:** Reload Legal's version 2 page.

**Expect:**
- Status **Awaiting review** · Risk **17 (Low)** · *Source* "Answered by the vendor — Answered by the vendor through the questionnaire link sent on {today}" · *Submitted* "the vendor's respondent, {now}".
- The grey declaration box: "… signed **Test Respondent, Test respondent**, {now} …".
- **No amber "Claimed, no evidence"** box any more (C4 is now backed).
- **C1**: "No · answered by **the vendor's respondent**". **C4**: "Yes · backed by sample-vendor-dpa-SAMPLE.txt **(from the vendor)** · answered by the vendor's respondent". **A3**: "Yes · backed by payment-gateway-iso27001-certificate-SAMPLE.txt · answered by MU Legal Counsel" (carried forward, unchanged).
- The **Review** box: "**You sent this assessment to the vendor — someone else must review their answers.**"
- The vendor's page lists **sample-vendor-dpa-SAMPLE.txt** — "uploaded … by the vendor's respondent", review: pending.

### Step 13 — accept it (as the Admin)

**Do:** Sign out → **Admin** → Processors → Payment gateway provider → **Version 2** → **Accept**.

**Expect:** **Accepted**; reviewed by "MU Organisation Admin". Processors: the payment gateway's *Accepted assessment* is now "**v2 · risk 17 (Low)**"; **With the vendor 0**.

---

## Part C — revoking a link

### Step 14 — send, then revoke (as Legal)

**Do:** Sign out → **Legal** → Processors → **LMS provider** → **Start a new version** → in the panel send a link to **you@…** → then **Revoke the link** → **OK**.

**Expect:**
- Green "**Link revoked. You can change the answers again.**"; the **Save** / **Submit for review** buttons are back; *Source* "Entered by staff …".
- Under the panel, the history line: "{time} — to Test Respondent by MU Legal Counsel: **Revoked** (MU Legal Counsel, {time})".

**Then do:** Open the link from that email in a private window.

**Expect:** The same **404** page — a revoked link is no different from one that never existed.

### Step 15 — tidy up (as Legal)

**Do:** Back on LMS provider version 2 → **Discard** → **OK**.

**Expect:** Back on the LMS provider's page; version 2 is gone, version 1 still **Accepted**.

---

## Done

If every step matched, reply **"Stage 4b approved"** (or "Stage 4b approved
with changes: …"). Stop the app with **Ctrl + C** in its Terminal.
