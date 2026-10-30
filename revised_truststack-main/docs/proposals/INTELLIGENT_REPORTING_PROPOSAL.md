# TrustStack Intelligence — proposal for approval

**Status:** APPROVED by Aniket 2026-10-04 (decisions 0–5 all yes). Decision 0
is built and live (D-071, PR #23, `f5986f1`). The rest is specified in
`docs/slices/SLICE_09_reports.md` (approved 2026-10-04), whose §6.2 corrects
this proposal's §2.1 mapping column after a recheck against the Act. **Where
the two differ, SLICE_09 governs.** This file is the historical record of
the proposal.
**Written:** 2026-10-04, after Slice 8 (PR #23), against the DPDP Act 2023
(Schedule, s.8, s.9, s.10, s.27–s.33, s.37) and the DPDP Rules 2025 in
`docs/legal/`, the spec's Step K, and the Step 13 sample report.
**Applies to:** every client, in every sector. Mumbai University is only the
worked example.

---

## What you asked me to do (in my words)

1. **Finish the black box properly.** Clients must not see the question bank's
   internals (pack codes, trigger rules, draft content), and that has to hold
   at the most secure layer, not only on screen — because this is a
   data-protection product.
2. **Replace the "maturity scorecard" report with an intelligent reporting
   system.** Leaders don't act on "Level 1 — Aware". They act on **how close
   they are to a penalty, roughly how large it could be, what retires that
   exposure fastest, and whether they'll be ready by the deadline.** That
   means:
   - different reports and dashboards for different stakeholders (Board, CFO,
     DPO, CISO, legal, department heads, auditors, consultants);
   - **intelligence**: what changed, what's slipping, what matters most;
   - **prediction**: where will we be on 13 May 2027 at the current pace;
   - it must work for any organisation in any sector, simple to read and
     executive in style.
3. **Get your approval at every step**: this proposal first, then the
   re-scoped Slice 9 prompt, then each build stage.

---

## 0. The black box — what I found and what I recommend

**Finding (probed on the local stack, 2026-10-04).** Our API hides the bank
from clients, but the database's own REST endpoint does not. The Supabase URL
and anon key ship in the browser by design, so any signed-in user can query
the database directly with their own login token. The MU Dean and BML's admin
each read **all 20 packs (15 still draft)** and the questions' **trigger rules**
that way, and the Dean read his own assessment's pack codes and trigger
reasons. **No other organisation's data was exposed**: tenant isolation holds,
and the bank is reference content, not client data. But "a black box to the
client" is not true today at the layer an attacker would use.

| Option | What it is | Security | Verdict |
|---|---|---|---|
| A. Hide in the UI | today before Slice 8 | none | ✗ |
| B. Trim the API response | what Slice 8 did for the bank routes; extend to the assessment questions API | the API only — PostgREST bypasses it | ✗ not enough on its own |
| **C. Deny by default in the database, plus allow-listed API shapes** | the database refuses the read unless the role is entitled; the API also returns only allow-listed fields | **both layers; nothing leaks through a new column or a direct call** | **✓ recommended** |

**Option C, concretely (built as D-071, live since 2026-10-04):**
1. **Bank tables** (`question_packs`, `questions`, `question_versions`):
   readable only by someone holding `question.read_bank` in an active
   membership. The 16-domain weights (`dpdp_domains`) stay readable, since
   clients see them.
2. **Generation keeps working for clients** who may generate (Programme
   Owner, Organisation Admin): it reads the bank through ONE locked-down
   database function that checks `assessment.write` for that organisation and
   returns only approved, generatable packs. It never returns draft or
   reference content.
3. **The client's own snapshot** (`assessment_questions`): the provenance
   columns (`pack_code`, `included_reason`) are withdrawn from client roles by
   column privilege. Anix staff read them through a function that checks
   `question.read_bank`.
4. **The client's "question sets" page** is built from its own assessment
   snapshot, not the bank.
5. **Allow-list response shapes** for every client-facing route
   (deny-by-default), so a column added later is never exposed by accident.
6. **Tests that attack the database directly** with a client's token (the
   bypass I used above), in the RLS suite and the route sweep. They must be
   refused.

**Decision 0 →** Approve Option C, and should it land in PR #23 before merge? *(Recommended: yes and yes.)*

---

## 1. Design principles for the reporting system

1. **Exposure, not maturity, on the front page.** Maturity scores stay
   underneath as evidence; leaders see penalty exposure, deadlines and decisions.
2. **Every number traceable.** Each figure links to the answers, evidence,
   register entries and actions behind it, read from what the engine and the
   database stored. Same rule as Slices 5–8: no number invented in a report.
3. **Honest about uncertainty.** The Act sets ceilings ("may extend to"). The
   Data Protection Board decides an amount only if it finds a breach
   *significant* (s.33(1)), weighing seven factors (s.33(2)). No enforcement
   history exists yet. So we show **statutory ceilings as fact**, and the
   organisation's **position** within them as an indicative, explained,
   versioned model. Never "you will pay ₹X".
4. **Sector-agnostic by construction.** Everything is computed from the scope
   (industry, data types, volumes, children, processors, AI, cross-border),
   the register and the assessment. A hospital, an NBFC, an e-commerce
   company, a manufacturer and a university get the same machinery with
   their own facts.
5. **One page for the Board, drill-down for everyone else.**
6. **Readiness language, never certification** (D-011): the caveat on every
   output. Never infer Significant Data Fiduciary status (D-028).
7. **Privacy of the reports themselves.** Reports are tenant data: stored
   under the tenant's path, versioned, never overwritten, downloaded only by
   short-lived signed URLs, every download logged. No cross-client
   benchmarking without explicit consent and anonymity thresholds.

---

## 2. The core idea: the DPDP Penalty Exposure model

### 2.1 The seven Schedule heads (statutory, from the Act)

| # | Breach of | Ceiling ("may extend to") | Mostly evidenced by (Compass domains and register) |
|---|---|---|---|
| 1 | Reasonable security safeguards to prevent a breach — s.8(5) | **₹250 crore** | Security safeguards; Rule 6 checklist on register records; processor safeguards (contracts, s.8(2)) |
| 2 | Notice of a personal data breach to the Board and Data Principals — s.8(6) | **₹200 crore** | Breach response (72-hour Board report, Rule 7); breach module (Slice 10) |
| 3 | Additional obligations for children — s.9 | **₹200 crore** | Children's data; register records with children's data, parental consent, tracking |
| 4 | Additional obligations of a Significant Data Fiduciary — s.10 | **₹150 crore** | **Only if the Central Government notifies the organisation as an SDF.** We never infer it (D-028) |
| 5 | Duties of a Data Principal — s.15 | ₹10,000 | Not a fiduciary obligation: not shown as exposure |
| 6 | A voluntary undertaking accepted by the Board — s.32 | as the original breach | Tracked once an undertaking exists (future) |
| 7 | Any other provision of the Act or Rules | **₹50 crore** | Governance, inventory, register, purpose, notice, consent, rights, grievance (90 days, Rule 14), retention (Rule 8), accuracy, processor contracts, cross-border |

**Beyond the fine:** under **s.37**, after penalties in **two or more
instances**, the Central Government may order public access to the
organisation's service **blocked**. That is an operational and reputational
risk executives must see.

### 2.2 What the model shows per head (every organisation, every sector)

- **Applies to you?** From the scope. For example, head 3 does not apply if
  the scope declares no children's data. Head 4 shows "applies only if
  notified".
- **Exposure status**: **Exposed** (a critical control is missing or a red
  flag fires in a mapped area) · **Partially mitigated** · **Mitigated**
  (evidence-backed) · **Not applicable**. Derived from stored adjusted
  scores, evidence levels, open register gaps and open actions mapped to that
  head.
- **Indicative position within the ceiling**: lower, middle or upper third,
  e.g. "upper third: ₹167–250 crore". Driven only by the s.33(2) factors we
  can observe:
  (a, b) gravity and type of data (children, health, financial, ID
  documents, scale of Data Principals) from the scope and register;
  (e) mitigation: actions under way, evidence, a tested breach playbook;
  (c) repetition: incidents (Slice 10 breach register).
  Each position states its reasons in plain words.
- **Deadline**: whether the obligation is in force (most from **13 May
  2027**; Consent Manager rules from **13 Nov 2026**), and days remaining.
- **Exposure retired over time**: a stored history, so the Board sees
  exposure falling as actions close.

### 2.3 The headline numbers an executive gets

- **"Statutory ceilings on obligations where you are exposed today: up to
  ₹700 crore across 4 heads."** Labelled as ceilings, not a predicted fine.
  Penalties are per breach, so combined ceilings show what is at stake, not
  what will be levied.
- **"Your indicative position: upper third on security safeguards, middle on
  breach notification…"**
- **"Days to 13 May 2027: 221. Forecast exposure-free date: 12 Aug 2027 (91
  days late) at the current pace."**
- **"Top 5 actions that retire the most exposure"**, with owner and due date.
- **s.37 flag**: "two penalties can lead to blocking of your service".

**Guardrails (non-negotiable):** the model is versioned (like the ROPA risk
model), every output carries the D-011 caveat plus "indicative position within
a statutory ceiling, not a prediction of any decision of the Data Protection
Board", and **counsel signs off the head mapping and the positioning rules
before launch** (a launch blocker, as with the ROPA risk model).

**Decision 1 →** Show the indicative position within the ceiling as a rupee band?
*(Recommended: **yes, as a band (thirds of the ceiling) with reasons**, behind
counsel sign-off. The safer alternative is ceilings plus an exposure status
only, with no rupee band.)*

---

## 3. Intelligence and prediction (explainable, no black-box AI)

Each tenant has too little history for machine learning to be trustworthy, so
every prediction is a transparent calculation that shows its working.

| Capability | What it tells you | How |
|---|---|---|
| **Deadline forecast** | "At the current pace the critical work closes on 12 Aug 2027, 91 days after 13 May 2027. To make it you need 6 closures a week; you are at 3.5." | Trailing 4–8-week closure rate against remaining actions by priority; a confidence range from simulating past weekly throughput |
| **Exposure at commencement** | Which heads will still be exposed on 13 May 2027 if nothing changes | Forecast applied to each head's mapped actions |
| **Leverage ranking** | "These 10 actions retire 60% of your exposure" | Each open action weighted by its head's ceiling × the control's criticality |
| **What-if simulator** | "Close these 5 → security moves from upper to middle third; forecast moves 40 days earlier" | Re-run the exposure and forecast rules on a hypothetical set |
| **Slippage early warning** | Actions and owners likely to miss dates | Overdue history, owner load, Blocked status, no evidence attached, due within 14 days |
| **What changed** | A weekly digest: exposure up or down, new gaps, closures, overdue, evidence rejected | Diff of stored snapshots |
| **Evidence decay** (after Slice 13's expiry work) | Evidence that will go stale before the deadline | Expiry dates against the deadline |
| **Anomalies** | Spikes in rejected evidence, reopened actions, one owner with 40% of the work | Simple thresholds, explained |
| **Sector benchmark** (Slice 14+, opt-in only) | "Hospitals of your size are typically further along on breach readiness" | Aggregated across consenting clients, never fewer than 5 per group, no client identifiable |

In Slice 11, AI may **narrate** these (a plain-English summary for the Board),
under the existing guardrails: it may not certify, change a number, or see
another client's data.

---

## 4. The catalogue: dashboards (live, in the app) and reports (stored, versioned)

| Stakeholder | Dashboard (live) | Report (point in time) | The question it answers |
|---|---|---|---|
| **Board, CEO, Executive Sponsor** | **Exposure Command Centre**: ceilings at stake, exposure per head, deadline countdown, forecast, top 5 actions, s.37 flag | **DPDP Exposure Brief**: 1 page PDF, monthly | "How close are we to a fine, how big could it be, and are we on track?" |
| **CFO, Risk / Audit Committee** | Exposure trend and risk register view | **Penalty Exposure & Risk Register**: per head, with s.33(2) factors and trend; feeds the enterprise risk register (not accounting advice) | "What should the risk register say, and is it falling?" |
| **DPO / DPDP Programme Owner** | **Programme Control**: velocity, forecast, blockers, overdue by owner, evidence pipeline, what changed | **Programme Status Report**: fortnightly | "Are we moving fast enough, and where is it stuck?" |
| **Department / process owners** (Admissions, HR, Patient Services, Retail Ops…) | **My obligations**: my actions, my register records, my evidence asks | **Owner Action Pack**: weekly, per owner | "What do I personally owe, by when?" |
| **CISO / IT** | **Safeguards & Breach Readiness**: heads 1 and 2 (₹450 cr combined ceilings), Rule 6 checklist across records, 72-hour readiness | **Security & Breach Exposure Report** | "Would we survive a breach inquiry?" |
| **Legal / Counsel** | Lawful-ground positions, notices, consent, children, processor contracts — items marked "for counsel" | **Legal Position Pack** | "What do we need to sign off, and where are we exposed legally?" |
| **Procurement** | **Processor exposure**: processors without contracts, records they touch | **Processor Exposure Report** | "Which vendors put us at risk?" |
| **Auditor / reviewer; a Board inquiry (s.28)** | Evidence strength, stale evidence, audit trail | **Regulator-Ready Evidence Pack**: index of every artefact by obligation, the audit trail, an as-of snapshot. Mitigation evidence is a s.33(2)(e) factor | "If the Board asked tomorrow, can we prove reasonable safeguards?" |
| **Children's data owners** (education, edtech, paediatric health, gaming, retail) | Children's exposure: records, parental consent, tracking | in the Exposure Brief and Legal Pack | "Head 3 is ₹200 cr: are we covered?" |
| **Anix consultant** | Portfolio across clients (Slice 14 console) | Engagement close-out report | "Which client needs me this week?" |
| **Operational exports** | — | Gap & Action Tracker (XLSX), ROPA Register (XLSX), Evidence Index (XLSX) | Working files for teams |

The maturity scorecard survives only as an **appendix** to the DPO's report,
and as the existing in-app scorecard.

---

## 5. How reports are produced and protected

- **Formats**: PDF for narrative reports, XLSX for working files. DOCX only
  if you want editable deliverables.
- **Cadence**: on demand now; scheduled email delivery in Slice 13 (Board
  monthly, DPO fortnightly, owners weekly).
- **Frozen artefacts**: a stored report never changes. Regenerating makes a
  new version. Each one records the date, the score snapshot, the model
  versions, and whether the register gaps were current.
- **Security**: the tenant's own storage path, a private bucket, signed
  download links that live 60 seconds, every download audited, no delete by
  users (same rules as evidence).
- **Plain language**: no question codes, pack codes or trigger rules in any
  client output (the black box).

---

## 6. Phasing — what is honest to build when

Some data does not exist yet: breaches, rights requests and grievances arrive
with Slice 10. So:

| Slice | Delivers |
|---|---|
| **9 (re-scoped) — Intelligence foundation** | The exposure model (head mapping as data, counsel-reviewable), the exposure engine with stored history, the deadline forecast, leverage ranking and what-if, the report store. Flagships: **Exposure Command Centre** (dashboard), **DPDP Exposure Brief** (Board PDF), **Programme Status Report** (DPO), **Owner Action Pack**, **Regulator-Ready Evidence Pack**, plus the three XLSX exports |
| 10 — Workflow modules | Each module feeds its head: breach (head 2, the 72-hour clock), children and consent, rights and grievance SLAs (head 7), processors (head 1/7). Adds the **Security & Breach**, **Legal Position** and **Processor Exposure** reports |
| 11 — AI assistant | Plain-English narration of any report; questions over the report ("why is security upper third?") |
| 12 — Reassessment | Exposure and readiness trend across cycles; "improvement since baseline" |
| 13 — Hardening | Scheduled delivery, evidence expiry and decay predictions, slippage alerts by email |
| 14 — Console | Consultant portfolio; opt-in anonymised sector benchmarks |

Slice 9 is likely **3 sessions** instead of 2.

**Decision 2 →** Approve this phasing, with the Slice 9 flagship list above? *(Recommended: yes.)*

---

## 7. What needs a human sign-off before launch

1. **Counsel**: the mapping of controls to the seven Schedule heads, and the
   rules that place an organisation in the lower, middle or upper third.
   Versioned, like the ROPA risk model.
2. **Counsel**: the exact wording of the exposure caveat.
3. **You**: the Board brief's layout, once the first draft exists.

---

## 8. Your decisions, in one place

| # | Decision | My recommendation |
|---|---|---|
| 0 | Black-box fix: Option C, landed in PR #23 before merge | **Yes, yes** |
| 1 | Indicative rupee band (thirds of the ceiling, with reasons), behind counsel sign-off | **Yes** (alternative: ceilings + status only) |
| 2 | Phasing: Slice 9 = intelligence foundation + the five flagships + three exports | **Yes** |
| 3 | Formats: PDF + XLSX now, DOCX later only if wanted | **PDF + XLSX** |
| 4 | Predictions: transparent calculations only, no machine learning until there is enough data | **Yes** |
| 5 | Benchmarks only opt-in, ≥ 5 organisations per group, Slice 14+ | **Yes** |

## 9. The approval steps from here

1. **This proposal** → you approve, change or reject decisions 0–5.
2. **Black-box fix** (if Decision 0 = yes) → I build it on PR #23, show you
   the test proving a client token is refused at the database, then you merge.
3. **Re-scoped SLICE_09 prompt** → I rewrite it from your approved
   decisions, with the exposure model's head mapping as a table for you to
   review → you approve.
4. **Build stage 1**: the exposure model and engine, then I show you MU and a
   second-sector example (e.g. a hospital tenant) → you approve.
5. **Build stage 2**: forecast, leverage ranking, what-if → you approve.
6. **Build stage 3**: the Exposure Command Centre and the Board brief → you
   approve the layout.
7. **Build stage 4**: the DPO report, owner pack, evidence pack and exports →
   PR, CI, your merge.
