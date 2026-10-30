# Slice 10 · Stage 4a — manual test, step by step

About **25 minutes**. Fifteen steps. Each one says **what to do** and **what
you should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack), not the
live site: an accepted assessment can never be deleted. You play four people,
because the point of this stage is that **the person who enters an assessment
is never the person who accepts it**.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 4a:
   ```bash
   git checkout slice/10-workflow-modules && git pull
   ```
   The Stage 4a migration is **already on your laptop's database** (Claude
   applied and seeded it). **Do not run `pnpm db:migrate` or `pnpm db:seed` in a
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

| Short name | Email | Who they are in Mumbai University |
|---|---|---|
| **Dean** | `dean@mumbai-university.example.com` | Executive Sponsor — reads only |
| **Registrar** | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner — **entered the LMS provider's assessment** |
| **Legal** | `legal@mumbai-university.example.com` | Legal User — may review |
| **CISO** | `ciso@mumbai-university.example.com` | IT/Security here; **Organisation Admin of "Demo Clinic Network"** |

---

## Part A — Mumbai University: reading, the second person, frozen

### Step 1 — the register (as the Dean)

**Do:** Sign in as **Dean** → click **Processors** in the top menu.

**Expect:**
- A sentence citing **section 8(2)** and **Rule 6(1)(f)**.
- Counts: **Processors 3** · **No contract with DPDP clauses recorded 2** (red) · **Never assessed 2** · **Awaiting review 1** · **Assessment out of date 0**.
- The note: "*The risk score is TrustStack's indicator, 0–100, higher is riskier — not a statutory measure and not a compliance status.*"
- **AI proctoring vendor** and **LMS provider** carry a red "**No contract with DPDP clauses recorded**"; the LMS provider also "**v1 awaiting review**".
- **Payment gateway provider**: Accepted assessment "**v1 · risk 16 (Low)**", review by **15 Sep 2027**.

### Step 2 — an accepted assessment and its documents (as the Dean)

**Do:** Click **Payment gateway provider**.

**Expect:**
- *Contract*: Yes · Yes · no red note. The selects are greyed (the Dean cannot edit them).
- *Documents*: **payment-gateway-dpa-SAMPLE.txt** (review: adequate) and **payment-gateway-iso27001-certificate-SAMPLE.txt** (review: pending). No "Attach document" (the Dean cannot attach).
- *Assessments*: **Version 1 · Accepted · Risk 16 (Low)** — "Entered by staff · started by MU IT/Security Lead · source: The vendor's completed security questionnaire of 2 Sep 2026, and its signed DPA · accepted by MU Legal Counsel on 15 Sep 2026 … · review by 15 Sep 2027". No "Start" button.

**Then do:** Click **Version 1**.

**Expect:** Status **Accepted**; *Reviewed* "MU Legal Counsel, 15 Sep 2026 …". The amber box "**Claimed, no evidence: C4.** …". In the questions: **A3** "Yes · backed by payment-gateway-iso27001-certificate-SAMPLE.txt"; **C4** "Yes · claimed, no evidence"; **G1** "Yes · backed by payment-gateway-dpa-SAMPLE.txt"; **E4** "Not applicable — No cross-border transfer: …". No form, no Save.

### Step 3 — an assessment awaiting review (as the Dean)

**Do:** Back to **Processors** → **LMS provider** → **Version 1**.

**Expect:**
- Status **Awaiting review** · Risk **37 (Medium)** · *Submitted* "Registrar (DPDP Programme Owner), 9 Oct 2026 …".
- "**Claimed, no evidence: A3, C4, G1.** …"
- A blue box "**For the reviewer — answers that disagree with the vendor register (or with each other):**" with **three** lines: E1 vs E2 (stored in India vs Asia-Pacific); "no sub-processors" vs "sub-processors not known"; "a signed contract with DPDP clauses is in place" vs the register's missing clauses. "*Nothing is changed automatically …*"
- **No Review section** — the Dean cannot review.

### Step 4 — the person who entered it cannot review it (as the Registrar)

**Do:** Sign out → sign in as **Registrar** → **Processors** → **LMS provider** → **Version 1**.

**Expect:** A *Review* section saying only "**You entered or answered this assessment — someone else must review it.**" — no Accept, no Return.

### Step 5 — Legal returns it (as Legal)

**Do:** Sign out → sign in as **Legal** → same page (**Processors** → **LMS provider** → **Version 1**). In *Review*, click **Return for changes** with the box empty.

**Expect:** A red "**Say why it is returned.**"

**Then do:** Type **`E1 and E2 disagree; and G1 claims a DPDP contract the register says has no DPDP clauses — check both.`** → **Return for changes**.

**Expect:** Status **Returned for changes**; an orange line "Returned for changes: E1 and E2 disagree; …"; *Returned* "MU Legal Counsel, <now>". The questions become a form — Legal may enter answers too — but **do not change or save anything as Legal**: whoever answers a question can no longer review it.

### Step 6 — the Registrar corrects and resubmits (as the Registrar)

**Do:** Sign out → **Registrar** → the LMS provider's **Version 1**. The questions are now a form.
In **E2** choose **India**; in **G1** choose **No**. Click **Save**.

**Expect:** "**Saved.**" The blue box now has **one** line (no sub-processors vs not known); "Claimed, no evidence: **A3, C4**"; Risk **35 (Medium)** — labelled "*(preview — derived again by the database on submission)*".

**Then do:** **Submit for review**.

**Expect:** Status **Awaiting review**, Risk **35 (Medium)** (no longer "preview"), and again "You entered or answered this assessment — someone else must review it."

### Step 7 — Legal accepts it (as Legal)

**Do:** Sign out → **Legal** → the LMS provider's **Version 1**. In *Review*, leave **Review by** as it is (one year from today) → **Accept**.

**Expect:** Status **Accepted**; *Reviewed* "MU Legal Counsel, <now> · review by <today next year>". The Review section is gone; the answers are read-only; no Save, no Discard.

**Then do:** **Processors**.

**Expect:** **Never assessed 1** · **Awaiting review 0**. The LMS provider: "v1 · risk 35 (Medium)", review by <today next year> — and **still** the red "No contract with DPDP clauses recorded": the answers say G1 "No", and the register agrees.

### Step 8 — a correction is a new version (as Legal)

**Do:** Click **LMS provider** → **Start a new version**.

**Expect:** A new page: **version 2 · Draft**, every question already filled from version 1 (Answered · not applicable · of = **41 · 3 · 44**).

**Then do:** Scroll to the bottom → **Discard** → **OK**.

**Expect:** Back on the LMS provider's page: only **Version 1 · Accepted**. Version 1 never changed.

---

## Part B — Demo Clinic Network: a new processor, its contract, a draft (as the CISO)

### Step 9 — add a vendor

**Do:** Sign out → **CISO** → choose **Demo Clinic Network** in the organisation switcher → **Scope** → the **Vendors** tab. Fill: Vendor name **`Clinic cloud records`** · Role **Data processor** · Contract in place? **Yes** · DPDP clauses in contract? **Unknown** · leave the rest → **Add**.

**Expect:** The vendor appears in the list.

### Step 10 — the contract

**Do:** **Processors**.

**Expect:** **Processors 1** · **No contract with DPDP clauses recorded 1** · **Never assessed 1**.

**Then do:** Click **Clinic cloud records**. In *Contract* set **It has DPDP clauses** to **Yes**, **Signed on** **01-08-2026**, **Review by** **01-07-2026** → **Save contract**.

**Expect:** A red "**The contract's review date is after the date it was signed.**"

**Then do:** **Review by** **01-08-2027** → **Save contract**.

**Expect:** "**Saved.**"; the red note about the missing contract is gone.

### Step 11 — attach the contract

**Do:** In *Documents* choose the file **`docs/testing/sample-vendor-dpa-SAMPLE.txt`** (in the project folder) → **Attach document**.

**Expect:** **sample-vendor-dpa-SAMPLE.txt** listed, "review: pending".

### Step 12 — a draft, and what blocks a submission

**Do:** **Start an assessment** → on the new page click **Submit for review** at the bottom.

**Expect:** A red "**Say where the answers came from (for example, "the vendor's email of 3 Oct 2026") before submitting.**"

**Then do:** In *Where did these answers come from?* type **`The vendor's email of 3 Oct 2026`** → **Submit for review** again.

**Expect:** "**44 questions are not answered or marked not applicable: A2, A3, …, G6.**"

### Step 13 — claimed, then evidenced

**Do:** In **G1** choose **Yes**.

**Expect:** Under it, amber: "**Claimed, no evidence: this scores as the risky answer until a document is cited.**"

**Then do:** **Save**.

**Expect:** Risk **100 (Critical)** (preview); "Claimed, no evidence: **G1**".

**Then do:** In G1's list "*The signed contract with its DPDP clauses — cite one of the vendor's documents*" choose **sample-vendor-dpa-SAMPLE.txt** → **Save**.

**Expect:** The amber line and the "Claimed, no evidence" box are gone; Risk **0 (Low)**.

### Step 14 — "not applicable" needs a reason

**Do:** On **D3** tick **Not applicable** and leave the reason empty → **Save**.

**Expect:** A red "**D3: say why it does not apply.**"

**Then do:** Type **`The vendor engages no sub-processors.`** → **Save**.

**Expect:** "**Saved.**"; *Answered · not applicable · of* = **1 · 1 · 44**.

### Step 15 — discard the draft

**Do:** **Discard** → **OK**.

**Expect:** Back on *Clinic cloud records*: "**This vendor has not been assessed.**" — the document stays.

---

## Part C — the exposure view (as the Registrar, Mumbai University)

**Do (optional, 1 minute):** Sign out → **Registrar** → **Exposure**. Read the first head ("*Reasonable security safeguards to prevent a personal data breach*") and the last ("*Any other provision of the Act or the Rules*").

**Expect:** Both **Partially mitigated**, and each lists "**2 processors have no contract with DPDP clauses recorded — …**" (head 1 ends "(Rule 6(1)(f))", head 7 "(s.8(2))"), beside "*Processing register: Processor without a valid contract (1 open gap).*" The footer's caveat says "**exposure model 1.4.0**".

---

## When you are done

Stop the app with **Ctrl+C**. Reply **"Stage 4a approved"** (or "Stage 4a
approved with changes: …"), or list what was different by step number.
