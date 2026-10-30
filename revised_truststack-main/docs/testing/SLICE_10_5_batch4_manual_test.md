# Slice 10.5 · Batch B4 — reports, exposure and emails: manual test, step by step

About **25 minutes**. Fourteen steps. Each one says **what to do** and **what you
should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack). This
batch changes how Exposure, the reports and the emails read, group and page. It
also changes **one model rule on purpose (Q1)**: the forecast now counts every
open action, as the Actions page does (exposure model **1.7.0**). No penalty
head's status, position or ceiling changes. The walk-through is
`docs/testing/SLICE_10_5_batch4_walkthrough.md`.

---

## Before you start (5 minutes, once)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Batch B4 (no new packages):
   ```bash
   git fetch && git checkout slice/10-5-b4-reports && git pull
   ```
   B4 has **one migration** (`20261019000000_exposure_model_1_7_0`). Claude has
   already applied it to your laptop's database and rebuilt that database from
   the seed (2026-10-19). **Do not run `pnpm db:migrate` or `pnpm db:seed` in a
   plain Terminal**: the project's `.env.local` points at the **live**
   database. The live site gets the migration only after you approve (Claude does
   it, right after the merge's deploy).
4. Start the app (if it is still running from before, stop it with Ctrl + C first):
   ```bash
   pnpm dev
   ```
   Wait for the `Local:` line, usually **http://localhost:3001**. If it prints
   another port, use that everywhere below.
5. **Password for everyone:** `ci-local-only-Passw0rd-not-secret`. You play:

   | Who | Email | Role |
   |---|---|---|
   | Registrar | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner (generates reports, records snapshots) |
   | Dean | `dean@mumbai-university.example.com` | Executive Sponsor (reads, writes nothing) |

   To change person: click the initials (top right) → **Sign out**.
6. The three emails, as they now look, are saved as files you can open in a
   browser: `docs/testing/slice10_5-b4/after/emails/` (and the old ones in
   `…/before/emails/`). Your laptop's copy does not send emails.

Everything you create in this test (a snapshot, reports) is on your laptop's copy
only; Claude rebuilds it afterwards.

---

## Part A — Exposure, as the Registrar

### Step 1 — the headline's one name (Q2)

**Do:** Sign in as the **Registrar**. On the overview, find the blue **DPDP
penalty exposure** strip.

**Expect:** Its first figure is labelled **Statutory ceilings at stake** (not
"…where you are exposed"), with the same ₹ figure as before (₹700 crore on the
seed).

### Step 2 — four tabs, no second heading (N3, F4.1, F4.2)

**Do:** Click **Open the Exposure Command Centre →** (or **Exposure** in the menu).

**Expect:**
- Under the top bar's **Exposure** there is **no** second "DPDP Exposure Command
  Centre" heading, just the "Provisional — based on …" line.
- Four tabs: **Where you stand · Penalty heads · What-if · History**. The first is
  open.
- The tiles: **Statutory ceilings at stake**, Penalty heads at stake, Days to 13
  May 2027, **Forecast — all work**. The forecast tile says "Not enough history to
  forecast yet." and under it **"4 actions open; 0.2 a week needed …"**. Before
  B4 it said "1 actions open".
- The s.37 line ("Two penalties can lead to blocking … (s.37)") is a **blue
  information note** under the tiles, not a red error box.
- The two caveats are at the bottom, and they stay there whichever tab you open.

### Step 3 — the same count as the Actions page (Q1)

**Do:** Open **Actions** in the menu. Note its count of open (outstanding)
actions. Go back to **Exposure**.

**Expect:** Actions shows **4** open: one from the assessment, one on the breach,
one on the grievance, one on the retention schedule. Exposure's forecast tile
says **4 actions open**: the same number. Before B4 the forecast left out the
breach, rights and retention actions.

### Step 4 — the penalty heads, head 7 in one line (N3, F4.4)

**Do:** Click the **Penalty heads** tab.

**Expect:**
- The tab's badge says **4** (the heads at stake).
- Five head cards, then the two heads that are not modelled.
- Head **7** ("Any other provision") lists its contract and retention reasons,
  then **one** line beginning **"Not yet answered:"** that names the eight areas
  separated by semicolons. Before, there were eight separate "… has not been
  answered yet." lines.
- Every status (Exposed, Partially mitigated, Not yet assessed, Not applicable)
  is the same as before B4.

### Step 5 — what-if (N3)

**Do:** Click the **What-if** tab.

**Expect:** The heading **The actions that retire the most exposure** and, on the
seed, **"No open action is on a penalty head at stake."** That is correct and
unchanged by B4. Only actions on a gap that counts against a head at stake are
ranked. MU's one assessment action is on Governance, an enabling control. The
register's gaps have not been generated yet. The breach, rights and retention
actions count in the forecast only and are never ranked (D-104.1). To see a
what-if run, do the **Optional last step** at the end, after Step 13: it adds
actions, so doing it here would change the counts Steps 6–11 expect.

### Step 6 — history, with the model per snapshot (N4, Q1)

**Do:** Click the **History** tab. Press **Record a snapshot now**.

**Expect:** The tab's badge shows **1**. The chart and, under it, a **table with
page controls** (Date · Ceilings at stake · Heads at stake · Basis · **Exposure
model** · Recorded by). The new row's model is **1.7.0**.

---

## Part B — the reports, as the Registrar

### Step 7 — three tabs, and "Which report do I need?" (F4.8)

**Do:** Open **Reports**.

**Expect:** Three tabs: **PDF reports · Working files · Stored**. The PDF tab
starts with a grey box, **Which report do I need?**, one line per audience
("Board, CEO and Executive Sponsor: DPDP Exposure Brief", "DPO and DPDP Programme
Owner: Programme Status Report", … seven lines). **Working files** has its own
box (three lines) and the three Excel cards.

### Step 8 — the Programme Status Report (Q1, Q2, F4.3, F4.5, F4.6)

**Do:** On **PDF reports**, press **Generate** on **Programme Status Report**.

**Expect:** The **Stored** tab opens by itself with the new report at the top, and
a green "… version 1 is ready" note. Press **Download** and open the PDF:
- Tile **Statutory ceilings at stake**.
- **Actions outstanding 4**, note **"From every register."**
- **Pace and forecast:** Critical and high **3**, All work **4**. Before:
  0 and 1.
- **What changed since the last snapshot:** "**No change since the snapshot of**
  … : ceilings at stake ₹700 crore; heads at stake 4." (Step 6's snapshot; nothing
  moved since). Not "went from ₹700 crore to ₹700 crore".
- **Remediation by owner and by window:** the Source table has **five** rows
  (Assessment 1, Processing register 0, Breach register 1, Rights and grievance
  register 1, Retention register 1), totalling 4.
- Head 7's reasons end with one "Not yet answered: …" line.
- **Appendix: Readiness scorecard:** the unanswered domains say **Not started**
  (not "Needs Work"). Governance, the one answered domain, keeps its own status.
- Page 3 holds the register **and** the scorecard, so no page in the middle is
  nearly empty (before, page 3 had the short register table alone). Page 4 is the
  two caveats and the notes, kept together.

### Step 9 — the Board's Exposure Brief (Q1)

**Do:** Back on **PDF reports**, generate the **DPDP Exposure Brief**. Download it.

**Expect:** One page. **Critical and high work finishes** says **Not enough
history**, not "Nothing outstanding" as before (3 High actions are open). The
Pace line says "Critical and high work: 3 outstanding; …". Head 7's "Main reason"
is its first reason, not one of eight "not answered" lines.

### Step 10 — the Processor Exposure Report (F4.4)

**Do:** Generate the **Processor Exposure Report** and download it.

**Expect:**
- The second tile is **Processors with no accepted assessment**.
- The heads section is titled **The penalty heads this report covers** (not
  "Penalty heads 1 and 7").
- Under **Contracts to fix**, a processor with no DPDP clauses needs: **"Amend the
  contract to carry DPDP clauses, then record it: …"**, citations kept.
- Under **Assessments to complete or renew**, MU's two processors read "Awaiting
  review" (their assessments are with a reviewer). A processor with **nothing**
  started would read **No accepted assessment**, not "Never assessed". The seed
  has none; the automated tests cover it.

(Optional: the **Security and Breach Report** and the **Legal Position Report**
also say "The penalty heads this report covers"; the Security report's head 1
areas say **Not started** where unanswered.)

### Step 11 — the Evidence Index (F4.7)

**Do:** Open the **Working files** tab. Generate the **Evidence Index**, download it,
and open it in Excel or Numbers.

**Expect:**
- **About** sheet, Notes: a line "Evidence level is the reviewer's rating of a
  file: E0 — No evidence; E1 — Informal evidence; … E5 — Evidence it is monitored
  and reviewed. …"
- **Evidence index** sheet: **Uploaded on** and **Reviewed on** are real dates
  (e.g. "19 Oct 2026", and sorting the column sorts by date).
- The file the proctoring vendor sent through the questionnaire link
  (`proctoring-vendor-soc2-summary-SAMPLE.txt`) shows **Uploaded by: The vendor
  (questionnaire link)**. It used to be blank.

---

## Part C — the emails

### Step 12 — navy, and the invitation's one line (F4.9)

**Do:** Open the files in `docs/testing/slice10_5-b4/after/emails/` in your browser
(double-click): `invite.html`, `intake-code.html`, `vendor-link.html`. Compare with
`…/before/emails/`.

**Expect:** The heading word and the button are the app's **navy**, not the old
purple-indigo; the code box is pale blue. The invitation has a new line under
"… has invited you to join …": **"When you accept, you will be asked to choose a
password; TrustStack then opens on the DPDP readiness work your role covers."**

---

## Part D — someone who only reads, and a phone

### Step 13 — the Dean (unchanged permissions)

**Do:** Sign out. Sign in as the **Dean**. Open **Reports**, then **Exposure** →
**History**.

**Expect:** Reports shows **PDF reports** (only "Generate my pack") and **Stored**.
There is **no Working files** tab and no other Generate. Exposure's History tab
has the history but **no "Record a snapshot now"**.

### Step 14 — a phone

**Do:** Make the window phone-narrow (or use the browser's device toolbar). Open
Exposure and Reports.

**Expect:** The tabs fit, or scroll sideways. The tiles stack. The history table
and the stored reports table page and scroll inside their box. Nothing runs off
the screen.

---

### Optional last step — a what-if that moves something (N3)

**Do:** As the Registrar, open **Processing register → More → Gaps and actions**
and press **Generate the register's gaps**. Then open **Exposure → What-if**, tick
the first ranked action and press **What if these 1 were closed?**

**Expect:** Ranked actions, each with its heads, severity, owner and due date. A
result box: "Ceilings at stake …", the heads that would move, the forecast
before and after, and "A what-if changes nothing." Nothing is saved.

---

## Tidy-up

- Stop the app with **Ctrl + C**.
- Steps 6 and 8–11 recorded a snapshot and generated reports (and the optional last step generated the register's gaps) on your laptop's
  copy only. Say **"rebuild the local database"** and Claude puts it back to the
  seed.
- Then tell Claude **"Batch B4 approved"**, or what to change. On approval Claude
  merges the PR, waits for the live site's deploy, **applies the 1.7.0 migration
  to the live database at once**, checks the generated types and the live site's
  signed-out pages, and closes Slice 10.5.
