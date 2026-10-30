# Slice 10 · Stage 5 — manual test, step by step

About **20 minutes**. Fourteen steps. Each one says **what to do** and **what
you should see**. Tick it off, or note what was different.

> **Re-test after R1–R6 (2026-10-16).** You approved Stage 5 with changes
> R1–R6 (D-096). They are built, and your laptop's database was rebuilt from
> scratch with them. **Do "Before you start", then only Part D at the end**
> (eight steps, about 15 minutes). Parts A–C below are updated to match, for
> reference — no need to repeat them. The migration goes to hosted only after
> you reply.

You test on your **laptop's own copy** of TrustStack (the local stack), not the
live site: an erasure, once recorded, is never deleted. You play four people.
The point of this stage: every processing activity has a retention clock the
database works out, an overdue erasure shows as exposure and as work, the
erasure is recorded once — and the AI risk register informs without ever
setting a status.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 5:
   ```bash
   git checkout slice/10-workflow-modules && git pull
   ```
   The Stage 5 migration (with R1–R6) and the seed are **already on your
   laptop's database** — Claude rebuilt it from scratch on 2026-10-16. **Do not run `pnpm db:migrate` or `pnpm db:seed` in a
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
| **Legal** | `legal@mumbai-university.example.com` | Legal User — writes both registers |
| **CISO** | `ciso@mumbai-university.example.com` | IT/Security Lead — owns ROPA-009's erasure action |
| **Admin** | `it.admin@mumbai-university.example.com` | Organisation Admin — records the Third-Schedule class |

---

## Part A — what the registers show (as the Dean, reading only)

### Step 1 — the retention register

**Do:** Sign in as **Dean** → **Retention** (new, in the nav).

**Expect:**
- Counts: **Schedules 10 · Erasure overdue 1 · No end recorded 1 · Erased 1**.
- **ROPA-009** "Event and webinar registration": red **Erasure overdue**. **ROPA-003**: amber **No end recorded**. **ROPA-008** "AI student chatbot": green **Erased**.
- The grey note: "…at least one year from the last day the data was processed (Rule 8(3))… During the year Rule 8(3) requires, the data is held only for the purposes in the Seventh Schedule — not used for the original purpose. The three-year period and the 48-hour notice of Rule 8(1)–(2) apply only to the classes in the Third Schedule."
- **No** "Add a retention schedule" button.

### Step 2 — an overdue schedule

**Do:** Click **Event and webinar registration**.

**Expect:**
- *When the data must go*: *The last day this data was processed (the purpose served)* **15 Feb 2025**, kept **12 months**, end date **15 Feb 2026**, and a red box: "The end date has passed and no erasure is recorded…".
- *Erasures*: "No erasure recorded." — and **no form** (the Dean reads only).
- *Actions*: "**Erase the February 2025 webinar registrations from the events mailing tool and the shared drive**", owner **MU IT/Security Lead**, open.

### Step 3 — the exposure it causes

**Do:** **Exposure** in the nav → open **head 7**.

**Expect:**
- Head 7 **Exposed**. Among its reasons: "**1 retention schedule is past its end date with no erasure recorded (s.8(7)).**" and "**1 retention schedule has no end date recorded, so its erasure cannot be shown to follow (s.8(7)).**"
- The model version reads **1.5.0**. **Head 4: Not applicable** (no SDF notification).

### Step 4 — the AI risk register

**Do:** **AI risk** in the nav.

**Expect:**
- **In the register 1 · In use 1 · Not reviewed in 12 months 1 · Track or target children 1 · …with no exemption recorded 0**.
- AI proctoring: *Tracks or targets children* **Yes**, "Exemption: **A3**" — no red warning.
- "**No Significant Data Fiduciary notification is recorded, so penalty head 4 does not apply. TrustStack never infers it.**"
- **AI proctoring** — "Review due", last reviewed **Never**. **No** "Add an AI system" button.

---

## Part B — the erasure, and who closes its action

### Step 5 — the action on the one list (as the CISO)

**Do:** Sign out → **CISO** → **Actions**.

**Expect:** The webinar action is listed under MU IT/Security Lead, with the source tag **Retention register**.

### Step 6 — the owner cannot close it alone (as the CISO)

**Do:** **Retention** → **Event and webinar registration** → in the action, set *Status* to **Closed** → **Save**.

**Expect:** Refused: "**Closing needs reviewed evidence attached to this action, the erasure recorded on its schedule by someone other than its owner, or approval by a reviewer who is not its owner.**" (An erasure counts only with the processors told, or none held the data — D-096.)

### Step 7 — the erasure is recorded (as Legal)

**Do:** Sign out → **Legal** → **Retention** → **Event and webinar registration**. In *Erasures*: *Erased on* = **yesterday**, *How* = **Deleted from the systems that held it**, *Processors told* = **Yes** → **Record the erasure**.

**Expect:**
- The badge turns green: **Erased**; the red box is gone.
- The erasure is listed: "**Recorded by MU Legal Counsel** on {today}".
- There is no way to edit or delete it. (Legal is not offered "Mark as recorded in error" on their own erasure — someone else is.)

### Step 8 — now the owner can close it (as the CISO)

**Do:** Sign out → **CISO** → same page → set the action to **Closed** → **Save**.

**Expect:** The action shows **Closed** — "…**on an erasure recorded by someone else**".

### Step 9 — the exposure moves (as the Dean)

**Do:** Sign out → **Dean** → **Exposure** → head 7.

**Expect:** The "past its end date with no erasure recorded" reason is **gone**. *(Head 7 may now read "Not yet assessed" or "Partially mitigated", depending on what your earlier tests left on MU — what matters is that the overdue erasure no longer sets it Exposed.)*

---

## Part C — changing a schedule, the AI register, the Third-Schedule class

### Step 10 — Rule 8(3)'s floor, and recording an end (as Legal)

**Do:** Sign out → **Legal** → **Retention** → **Student ERP / SIS lifecycle management** (ROPA-003) → **Change the schedule**. Set *Kept for* to **6** → **Save**.

**Expect:** The form refuses it (the box says at least 12 — "Rule 8(3)").

**Then do:** Set *Kept for* back to **84**, *The last day this data was processed (the purpose served)* = **30 Jun 2025** → **Save**.

**Expect:** End date **30 Jun 2032**; the badge reads **Retained**. Back on the register: **No end recorded 0**.

### Step 11 — a review is recorded (as Legal)

**Do:** **AI risk** → **AI proctoring** → **Change or record a review** → *Last reviewed* = **yesterday** → **Save**.

**Expect:** *Last reviewed*: yesterday, "**Recorded by MU Legal Counsel**", "Next review by … (a TrustStack default)". The "Review due" badge is gone.

### Step 12 — another AI use (as Legal)

**Do:** **AI risk** → **Add an AI system**: *Name* **Student chatbot**, *AI use* **Chatbot**, *What it is for* "Answers student queries", *The personal data it uses* "Name, enrolment number, chat messages" → **Save**.

**Expect:** **In the register 2**, **Not reviewed in 12 months 1**. Head 4 on the Exposure page is still **Not applicable**.

### Step 13 — the Third-Schedule class (as the Admin)

**Do:** Sign out → **Admin** → **Organisation**. In **Third-Schedule class (Rule 8(1))**: choose **E-commerce entity with at least two crore registered users in India** → **Save**. Then **Retention** → any schedule → **Change the schedule** → open *What ends the retention*.

**Expect:**
- The Organisation box: "Recorded: E-commerce entity…". The Retention page shows an amber note: "Recorded as a Third-Schedule class… Rule 8(1)'s three-year period and Rule 8(2)'s 48-hour notice apply."
- The list now offers **Three years without contact (Third Schedule)**; choosing it shows the Third Schedule's note (13 November 2025, the user account and virtual-token exceptions).

**Then do:** **Cancel**, go back to **Organisation**, choose **None of these** → **Save**.

**Expect:** "None recorded. Rule 8(1)–(2) do not apply." (MU is not an e-commerce entity.)

### Step 14 — the Dean cannot record a class

**Do:** Sign out → **Dean** → **Organisation**.

**Expect:** The Third-Schedule box shows "None recorded…" and "**Only an Organisation Admin or consultant can record a class.**" — no Save.

---

## Part D — the re-test after R1–R6 (about 15 minutes)

Start from a fresh database (Claude rebuilt it): **do these, not Parts A–C**.
Same four people, same password.

### D1 — the overview's Retention section (R6, as the Dean)

**Do:** Sign in as **Dean**. You land on the **Overview**. Scroll to **Retention and erasure**.

**Expect:**
- **Erasures overdue 1** (in red) · **Ending in 30 days 0** · **No end recorded 1**.
- Below: "**ROPA-009** — erasure overdue since 15 Feb 2026", and the link **Open the retention register →**.

### D2 — the start date and the note (R1, as the Dean)

**Do:** **Retention**. Read the grey note. Then open **Event and webinar registration** (ROPA-009).

**Expect:**
- The note says "…at least one year from **the last day the data was processed** (Rule 8(3))…" and "**During the year Rule 8(3) requires, the data is held only for the purposes in the Seventh Schedule — not used for the original purpose.**"
- In *When the data must go*, the first box is headed "**The last day this data was processed (the purpose served)**" — **15 Feb 2025**.

### D3 — children in the AI register (R5, as the Dean)

**Do:** **AI risk**, then click **AI proctoring**.

**Expect:**
- On the register: **Track or target children 1** · **…with no exemption recorded 0**; the row reads *Tracks or targets children* **Yes**, "Exemption: **A3**". No red box.
- On the page: "**Does it track, behaviourally monitor or target advertising at children? (s.9(3))** Yes — Exemption relied on (Fourth Schedule): **A3 — An educational institution — tracking for its educational activities or children's safety**".

### D4 — an incomplete erasure does not count (R2, as Legal)

**Do:** Sign out → **Legal** → **Retention** → **Event and webinar registration**. In *Erasures*: *Erased on* = **yesterday**, *How* = **Deleted from the systems that held it**, *Processors told* = **No — not yet** → **Record the erasure**.

**Expect:**
- The badge stays red **Erasure overdue**, with a second red tag "**Erasure incomplete — processors not told**".
- The red box now says the erasure recorded is incomplete — tell the processors, then record it again.
- The erasure is listed with the tag "Erasure incomplete — processors not told".
- **Overview**: still **Erasures overdue 1**, the line ending "(erasure incomplete — processors not told)".

### D5 — recorded again, complete (R2, as Legal)

**Do:** Same page. Record another erasure: *Erased on* = **yesterday**, *Processors told* = **Yes — every processor that held it was told to erase it** → **Record the erasure**.

**Expect:** The badge turns green **Erased**; the "incomplete" tag is gone. On your own erasures there is **no** "Mark as recorded in error" button — instead "You recorded this erasure: if it is wrong, someone else marks it as recorded in error."

### D6 — recorded in error, by someone else (R4, as the CISO)

**Do:** Sign out → **CISO** → **Retention** → **Event and webinar registration**. On the newest erasure (processors told: yes), click **Mark as recorded in error** → *Why it was recorded in error* = "**The events mailing tool still holds the list**" → **Mark as recorded in error**.

**Expect:**
- That erasure is **struck through**, tagged "**Recorded in error**", with "Marked as recorded in error by MU IT/Security Lead on {today}: The events mailing tool still holds the list".
- The badge is back to red **Erasure overdue** (the only other erasure is the incomplete one).
- **Exposure** → head 7: **Exposed** again, with "1 retention schedule is past its end date with no erasure recorded".
- Nothing can undo the mark — it is a record too.

### D7 — tracking children with no exemption (R5, as Legal)

**Do:** Sign out → **Legal** → **AI risk** → **Add an AI system**: *Name* **Student wellbeing app**, *What it is for* "Check-ins on student wellbeing", *The personal data it uses* "Name, mood check-ins, location during campus events", *Does it track, behaviourally monitor or target advertising at children?* = **Yes**, *exemption* = **None recorded** → **Save**.

**Expect:** A **red box**: "It tracks, monitors or targets advertising at children and no Fourth Schedule exemption is recorded: s.9(3) bars this unless an exemption applies (Rule 12)…"; **…with no exemption recorded 1** (in red); the row tagged "Children: no exemption recorded".

**Then do:** Click **Student wellbeing app** → **Change or record a review** → *The Fourth Schedule exemption relied on* = **B4 — Real-time location for the child's safety** → **Save**.

**Expect:** The red box is gone; the page reads "Exemption relied on (Fourth Schedule): B4 — Real-time location for the child's safety". *(Whether B4 really applies is counsel's call — the register only records what is relied on.)*

### D8 — the Third Schedule's own words (R3, as the Admin)

**Do:** Sign out → **Admin** → **Organisation** → Third-Schedule class = **E-commerce entity…** → **Save**. Then **Retention**.

**Expect:** The amber box adds: "Third Schedule: three years from the day the person last approached the organisation… read here as **13 November 2025**, the earlier date (counsel to confirm). Not counted against this period: data kept so the person can access their **user account**, or a **virtual token**… usable for money, goods or services."

**Then do:** Open any schedule → **Change the schedule** → *What ends the retention* = **Three years without contact (Third Schedule)**.

**Expect:** The same note appears under the form. **Cancel**. Go back to **Organisation** → **None of these** → **Save**.

---

## When you are done

Stop the app (`Ctrl+C` in its Terminal). Then reply **"Stage 5 re-test
passed"** (or say what looked wrong). Claude then applies
`20261017000000_retention_ai_risk` to hosted (25 migrations; additive — the
live site is unaffected) and Stage 6 starts in a new session.
