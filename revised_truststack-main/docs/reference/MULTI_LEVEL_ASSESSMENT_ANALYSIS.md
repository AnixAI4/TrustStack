# Multi-level DPDP assessment — Pulse → Proof → Sentinel

**Owner:** Aniket Mhala · **Prepared by:** Claude · **Started:** 29 Oct 2026 ·
**Branch:** `docs/multi-level-assessment`

A professional, very simple, multi-level assessment that beats competitors.
It is built step by step, and each step waits for Aniket's approval.

| Step | Section | Status |
|---|---|---|
| 1 | Current state: what the app does today, what Pulse can reuse, constraints | ✅ Approved 29 Oct 2026 |
| 2 | Market research: competitors' DPDP assessments, compared with ours | ✅ Approved 29 Oct 2026 (revised Q1–Q4) |
| 3 | Design: levels, names, question sets, scoring, gaps, repeats, Pulse → Proof, guardrails | ✅ Approved 29 Oct 2026 (Q1–Q8) |
| 4 | Visuals by audience | ✅ Approved 29 Oct 2026 (Q1–Q5) · 4b production-grade visuals ✅ approved 29 Oct 2026 (Q1–Q5) |
| 5 | AI use cases and guardrails | ✅ Approved 29 Oct 2026 (Q1–Q6) |
| 6 | Simplicity check against `docs/UX_REVIEW.md` | ✅ Approved 29 Oct 2026 (Q1–Q5) |
| 7 | Implementation plan: placement next to Slice 12, slice prompt(s), decisions, tests | ✅ Approved 29 Oct 2026 (Q1–Q5) — **the combined programme is closed** (D-144) |

---

## 0. The brief, as agreed (29 Oct 2026)

**Aniket's idea:**
- **Level 1** is a fast assessment of every valid core and industry question, without evidence. It gives a score and gaps, can be repeated, and its progress is tracked.
- **Level 2** is today's evidence-based assessment.
- Both need catchy names, super-simple use, many visuals for different people, competitor research, and AI where it helps.

**Six refinements, agreed by Aniket ("yes fold these six refinements"):**
1. **Pulse is short and adaptive:** about 30–40 key questions (2–3 per domain + industry), with more switched on only when an answer calls for them, and the time shown up front (~30 minutes). Every applicable question is still asked, in Proof.
2. **Plain answers**, not yes/no: *Not started · Started · Written down · In use · Checked regularly* (the brief's wording; the six approved words are in Step 3.2, and Step 6 S1 makes them the only set). **"I don't know"** is a valid answer that counts as a risk (D-026) and becomes a task. A few one-line "how do you know?" spot checks are included, with no upload.
3. **One journey, two depths:** Pulse answers become Proof's starting claims, and each domain is upgraded from *declared* to *proven* one at a time as evidence arrives. No double work.
4. **Pulse ends with action:** "your five most important actions this month", each with an owner, the 13 May 2027 deadline and the ₹ exposure. The score comes second.
5. **Team Pulse and workshop mode:** each department answers only its part (~10 minutes), and disagreement between departments is a finding. A consultant can also fill Pulse live in a workshop.
6. **The headline visual is declared vs proven** ("you say 72; you can prove 41"), plus "what changed since last time" on every repeat.

**Working names (confirmed in Step 3):** **DPDP Compass™ Pulse** ("where we stand", self-declared) →
**DPDP Compass™ Proof** ("what we can show", evidence-backed) → **Sentinel™** ("still on track", daily).

**The prompt in use:**

```text
ROLE: DPDP law and Rules 2025 expert, simplicity-first product designer, senior architect for TrustStack
(AnixAI). Work step by step; stop for Aniket's approval after every step.
GOAL: a multi-level assessment that is professional, super simple, useful and better than competitors:
  Pulse (short, adaptive, self-declared, repeatable, ends in actions) → Proof (evidence-backed, upgraded
  domain by domain from Pulse) → Sentinel (daily). Team Pulse + workshop mode. Visuals for Board, DPO,
  department owner, consultant, auditor. AI where it helps; AI never scores, approves or certifies.
INPUTS: revised_truststack code (packages/core assessment, engine, scoring, gaps, questions, packs,
  triggers; the assessment pages and SQL), CLAUDE.md invariants, DECISIONS (D-026, D-035, D-038–D-058,
  D-069, D-114), SLICE_12, the old app's M1, the Excel MVP, CONSOLIDATED_FEATURE_ANALYSIS.md, docs/legal.
STEPS: 1 current state · 2 market research · 3 design · 4 visuals (HTML mock-ups) · 5 AI · 6 simplicity ·
  7 implementation plan (placement vs Slice 12; prompts; SLICES/STATE/DECISIONS/register/tracker).
RULES: plain language; legally exact (Gazette-checked citations); never "compliant"/"certified";
  self-declared results labelled so and never blended with evidence-backed ones; store each step in this
  file, commit, push, update the tracker every step.
```

---

## Step 1 — Current state: what exists, what Pulse can reuse, what constrains it

**Read on 29 Oct 2026:**
- **New app:** `packages/core/src/{scoring,engine,assessment,assessment-display,gaps,questions,packs,scope}.ts`; `apps/web/lib/assessments/*`; the assessment pages; the Prisma schema; the Slice 5 and Slice 6 migrations; the local question bank.
- **Old app:** `src/lib/assessment-questions.ts` and `src/lib/ai/{compass-scorer,gap-generator}.ts`.
- **Plans:** the Slice 12 prompt.

### 1.1 How today's assessment works (the future "Proof")

| Part | Today | Where |
|---|---|---|
| Questions | Chosen from the client's scope: **98 core** + the industry overlay + risk packs, frozen as a snapshot per assessment (D-035) | `generate.ts`, `set_assessment_questions` |
| An answer | Applicable / not applicable (with a reason); **claimed maturity 0–5**; notes; who answered and when | `assessment_responses` |
| Evidence | Uploaded, then **reviewed by someone else** (D-043); the reviewed level E0–E5 is **derived by the database** (D-044) | `evidence`, `evidence_links` |
| The cap | **adjusted = min(claimed, cap for the evidence level)**: E0→1 · E1→2 · E2→2 · E3→3 · E4→4 · E5→5 | `scoring.ts` `adjustedScore` |
| Score | 16 domains, weights = 100; domain = (avg adjusted ÷ 5) × weight; red flags cap the total (e.g. children's data → 50); a band for the percentage | `engine.ts` `scoreAssessment` |
| Live vs final | **Live** score recomputed on every read; **finalised** score frozen by the SQL function `finalise_assessment` and never moves (D-035) | `lib/assessments/score.ts` |
| Gaps | Derived **in SQL** from the stored **adjusted** score: a gap opens at **≤ 3** (D-054); severity and P0–P3 from it; actions on the one list | the Slice 6 migration |
| Statuses | draft → in progress → submitted → finalised | `ASSESSMENT_STATUSES` |
| Types | `baseline`, `reassessment` (Slice 12 adds modes) | `ASSESSMENT_TYPES` |
| Answer words | The 0–5 scale already has plain names: *Not started · Aware · Draft or partial · Defined · Implemented · Operational and monitored* (D-114) | `assessment-display.ts` `CLAIM_LEVELS` |

### 1.2 The core problem Pulse solves — confirmed in the code

**Without evidence, every answer is capped at 1** (E0 → 1). An assessment
answered with no evidence therefore scores near the floor, and **every
question becomes a gap**, because adjusted 1 ≤ 3. Today's assessment *cannot*
serve as a quick "where are we?" check. That's not a bug: it's the
evidence-first doctrine working as designed. Pulse needs its own,
clearly-labelled **declared** rule.

### 1.3 What Pulse can reuse — more than expected

| Reuse | Why it fits |
|---|---|
| **The scoring engine as it is.** `scoreDomain`/`scoreAssessment` take a **pluggable cap rule** (`EngineOptions.capRule`, today used only by the Excel parity test). A **declared rule** `(claimed) → claimed` gives a Pulse score with the **same 16 domains, weights, red flags and bands**, so Pulse and Proof are directly comparable | `engine.ts` lines 50–61, 428–439 |
| **The question bank's metadata.** Every question version has **priority** (core: 14 P0 · 57 P1 · 27 P2), **criticality**, **suggested owner**, **legal/control basis**, **risk if weak**, **recommended fix**, **trigger condition** | `question_versions` |
| **Scope → question selection** (core + industry overlay + risk packs) | `scope.ts`, `generate.ts` |
| **The plain 0–5 names** (D-114): close to the agreed plain answers | `CLAIM_LEVELS` |
| **Gaps → actions**, the ₹ exposure model, the 13 May 2027 forecast | Slices 6, 9 |
| **AI explain helpers** for a question, a gap or a score (Slice 11) | `ai-tasks.ts` |

### 1.4 What Pulse needs that doesn't exist yet

| Need | Today | Implication |
|---|---|---|
| A **declared score** stored and shown separately | Only the adjusted (evidence-capped) score exists | A second, labelled score; **never blended** with the evidence-backed one (as D-069 keeps frozen and provisional apart). A product rule change: needs a decision (Step 3) |
| **Declared gaps** | Gaps are derived only from adjusted ≤ 3, in SQL | Either a "declared gap" kind or Pulse gaps worked out from claimed ≤ 3, labelled "self-declared" |
| **A short Pulse question set** | Every applicable question is generated | A "Pulse" marker per question (2–3 per domain). **Five domains have no P0 question** (accuracy, cross-border, purpose, retention, rights), so "all P0" won't do; a deliberate pick, reviewed once |
| **"I don't know"** | Not an answer option | A new answer state that counts as risk (D-026) and opens a task |
| **Assigning questions to people** (Team Pulse) | Only a free-text *suggested owner* | Per-question assignee, and a "my questions" view for department owners |
| **Several answers to one question** (to show disagreement) | One response per question | A small extension, or Team Pulse records one answer per department |
| **Domain-by-domain "proven" state** | One assessment status for everything | A per-domain state: *declared · being proven · proven* |
| **Repeat runs, trend, carry-forward** | — | **Overlaps Slice 12** (reassessment: carry-forward, versions V1–V5, trend). Pulse and Slice 12 should be planned **together** (Step 7) |
| **Workshop mode** | — | A consultant-led fast-entry view (keyboard-first, notes) |

### 1.5 Lessons from the old app's quick assessment (M1)

| What it did | Lesson for Pulse |
|---|---|
| 45 scored + 8 industry questions (for fintech, health and edtech only), **yes / no / partial** | Fast; but three answers lose meaning ("partial" = half). The 0–5 plain scale is better |
| Points added up to a 0–100 Compass Score, maturity 1–5, risk tier | The same idea as Pulse, but its own engine. **Reuse the new engine** so Pulse and Proof compare |
| **Facts scored as maturity:** "Do you process children's data?" earned points for "yes" | **A legal-logic flaw.** Whether something applies (scope) must never be mixed with how mature a control is. Pulse keeps *applicability* and *maturity* apart, as the new app does |
| AI wrote the gap report directly | The new app's rule stands: AI explains and drafts, a person decides; gaps are derived, never written by AI |
| No evidence, no proof, no trend | Pulse adds the trend and the bridge to Proof |

### 1.6 Constraints Pulse must respect (CLAUDE.md invariants and decisions)

- **Weights total exactly 100;** a domain with nothing applicable leaves the denominator (D-038, D-050).
- **The evidence-backed (adjusted) score stays the only "readiness" figure** in Board-grade reports; the declared score is labelled "self-declared", every time.
- **Finalised snapshots are immutable** (D-035); a Pulse run is its own snapshot.
- **Gaps are derived, never hand-written** (D-058); the AI never scores, closes gaps or certifies.
- **Red flags fire at ≤ 2** (D-046), and **unknown behaves as risk** (D-026).
- **Every new tenant table needs RLS, audit, Org A / Org B tests** (the Slice Contract).

### 1.7 Step 1 conclusions

1. **Pulse is very feasible.** The engine, the questions and their metadata are reusable; the main new pieces are a **declared score**, a **Pulse question marker**, **"I don't know"**, **assignment**, and **per-domain proven state**.
2. **Pulse and Slice 12 overlap** (repeat runs, carry-forward, trend). Step 7 should decide whether Pulse goes **before**, **inside** or **after** Slice 12. My early view: **design them together and build Pulse first**, because Pulse is the more frequent journey and Slice 12's carry-forward then serves both.
3. **Pulse inherits the pack gap from the consolidated analysis:** only Core + University packs are approved, so Pulse's industry questions for BFSI or health wait on Packs I (Slice 12.5).
4. **One legal-logic lesson from the old app:** never score "does it apply" as maturity.

**Approved (Aniket, 29 Oct 2026):** "Step 1 approved."

---

## Step 2 — How competitors assess DPDP readiness, and where we can lead

**Method (29 Oct 2026).** Web research on free readiness tools, platform
assessments, consultant gap assessments and maturity frameworks. Four pages
were read in full: Tsaaro, Neostra, dpdpact.co.in (KavachOne) and
SaralPrivacy. **Caveat:** these are almost all vendor pages; features are as
the vendors describe them, not tested.

### 2.1 Four kinds of DPDP assessment on the market

| Kind | Examples | Length and time | What you get | Evidence? |
|---|---|---|---|---|
| **A. Free quick checks** (lead magnets) | **Cloudcyber** 12 Q · **Ringsafe** 20 Q, 5 sections · **BSA** 40 Q (startups), category scores, downloadable report · **Tsaaro** 45 Q, 9 domains, ~10 min, scale *Nascent → Emerging → Established → Managed → Leading* · **SaralPrivacy** 3–5 min, sector-specific, score 0–100, risk category, **top 3 gaps**, next steps, a checklist · Consentin quiz (awareness) · Seqrite preparedness score | 12–45 questions, **3–10 minutes** | A score, a band, a few gaps, an invitation to talk to sales | No |
| **B. Platform assessments** | **Neostra**: a weighted 33-point template, Security 25 %, Governance and Transparency 20 % each; N/A excluded; **"passing mark 70"**; evidence and an owner per answer; failed control → task; **quarterly reassessment with evidence carried forward**; ROPA from inventory; DPIA workflows · **OneTrust**: a 4-stage maturity model, free self-assessment, *Maturity & Planning* with tasks per question or gap and **maturity graphs that update as tasks close**, benchmarking, 250+ templates · **Sprinto**: evidence pulled from integrations · **Privy, GoTrust**: risk and gap assessments, DPO copilot · **Mitigata (Gordon AI), Axiom**: AI "gap scans" and answer mapping (claims) | Template-driven, weeks | A dashboard score, gaps as tasks, repeat cycles | Yes, attached per answer; **none found that caps the score by reviewed evidence** |
| **C. Consultant gap assessments** | **KavachOne (dpdpact.co.in)**: each control rated on **existence, effectiveness and evidence**; 8 domains, 80+ checkpoints; bands up to **"86–100 % Compliant"**; 6 deliverables incl. **penalty exposure analysis** and a **12-week plan**; 5–7 business days · boutiques 1–3 weeks · Glocert ("an attestation, not a certificate") · Big-4 (no public method found) | 1–3 weeks | A scorecard, gap register, roadmap, a report | Reviewed by the consultant, offline |
| **D. Frameworks** | **DSCI DAF-P** (9 practice areas; members only) · OneTrust's maturity model · NIST templates (rate, evidence, owner per gap) | — | A structure, not a product | Varies |

### 2.2 What this tells us

1. **A quick score is a commodity.** At least seven free tools give one in under 10 minutes. **Pulse can't win by being a quiz.** It wins by what happens next: industry depth, actions with owners, the ₹ and deadline, the trend, the team, and the bridge to Proof.
2. **Evidence-backed assessment exists, but evidence is attached, not decisive.** Neostra and KavachOne collect proof per answer, and KavachOne rates evidence as one of three dimensions. **We found no one whose score is capped by evidence reviewed by someone else**, our D-043/D-044 rule. That is still our edge, and Proof keeps it.
3. **Nobody shows "declared vs proven" side by side.** It's the clearest message we can give a Board, and no competitor page shows it.
4. **Department routing is rare.** OneTrust lets tasks be assigned per question; we found **no Indian DPDP tool with team answering**, and none that shows **disagreement between departments**.
5. **Repeat and trend are expected in platforms.** Neostra runs quarterly reassessments with carry-forward; OneTrust's graphs update as tasks close. Slice 12 + Pulse must match this and go further ("what changed since last time").
6. **Penalty exposure appears only as a consultant deliverable** (KavachOne). Ours is live, model-based and tied to the Schedule.
7. **Overclaims are common:** a **"Compliant"** band (KavachOne), a **"passing mark 70"** (Neostra). Both invite "we passed DPDP". **We never use pass/fail or "compliant"** (D-011; analysis §7.2).
8. **AI claims are vague.** "AI gap scans" and "auto-answer" (Mitigata, Axiom) are unverified. A credible AI story is narrower: explain, suggest, spot contradictions, draft. **A person always confirms.**
9. **Time expectations are set by the free tools:** 3–10 minutes. Pulse's ~30–40 questions should promise **~20 minutes**, show progress, save and resume, and let each department do its 10 minutes.

### 2.3 Side by side — TrustStack (planned) vs the market

| Capability | Free quick checks (A) | Platform assessments (B) | Consultant (C) | **TrustStack Pulse → Proof** |
|---|---|---|---|---|
| Industry-specific questions | Some (SaralPrivacy "sector-specific") | Templates | Consultant's judgement | ✅ 10 packs, 1,429 questions (Packs I first) |
| Plain answers + "I don't know" | Yes/no mostly | Template answers | Interview | ✅ planned |
| Short first level with time shown | ✅ | — | — | ✅ Pulse ~20 min |
| Evidence decides the score | ❌ | ❌ attached only | Offline, by the consultant | ✅ **Proof: reviewed evidence caps the claim** |
| **Declared vs proven, side by side** | ❌ | ❌ | ❌ | ✅ **headline visual** |
| Upgrade domain by domain | — | — | — | ✅ planned |
| Gaps → actions with owners | Top 3 gaps | ✅ | Roadmap document | ✅ (Slice 6), Pulse ends with the top 5 actions |
| **₹ penalty exposure + 13 May 2027 forecast** | ❌ | ❌ | A one-off analysis | ✅ live (Slice 9) |
| Repeat runs and trend | ❌ | ✅ (quarterly) | Next engagement | ✅ Slice 12 + "what changed since last time" |
| **Team answering + disagreement** | ❌ | Task assignment (OneTrust) | Workshops | ✅ planned (Team Pulse) |
| Consultant workshop mode | — | — | ✅ offline | ✅ planned, in-platform |
| Legal citations per question | Rarely | Some | In the report | ✅ every question has a legal / control basis |
| AI | — | Copilot claims | — | ✅ explain, coach, contradictions, drafts; never scores |
| Continuous after assessment | — | Sprinto (security-led) | — | ✅ Sentinel |
| Honest wording | Varies | "Passing mark" | "Compliant" band | ✅ never "compliant", "certified" or "pass" |

### 2.4 Ideas worth borrowing

| From | Idea | How it fits us |
|---|---|---|
| Tsaaro | A **named 5-step maturity scale** | We already have plain names (D-114). Step 3 tunes the words for Pulse |
| KavachOne | **Existence, effectiveness, evidence** | Pulse asks *existence* (the plain answer) + one "how do you know?" for *effectiveness*; Proof adds *evidence* |
| OneTrust | **Progress that updates as actions close** | Between Pulse runs, the dashboard shows expected movement from closed actions, labelled "expected, not yet re-assessed" |
| Neostra | **Quarterly cycle with carry-forward** | Slice 12's delta mode; a suggested cadence, never imposed (Slice 12 §4.12) |
| SaralPrivacy | **Top gaps + a short checklist** | Our "five actions this month" + the **evidence checklist** for Proof |
| KavachOne | **A 12-week plan** as a deliverable | Our 30/60/90 roadmap (Slice 6), shown at the end of Pulse |
| OneTrust, IDfy/MIT study | **Benchmarks** | Parked until 20+ assessments per sector (F-20); designed for now |

### 2.5 Things to avoid

- **Pass/fail and "compliant" bands.** Readiness bands only, with plain words.
- **A long quiz with no next step.** Pulse always ends in actions and the route to Proof.
- **Mixing "does it apply" with maturity** (the old app's lesson, Step 1 §1.5).
- **AI that answers for the client.** It suggests; a person confirms.
- **Hiding the method.** Our weights and rules are explainable on screen ("why this score").

### 2.6 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | Pulse length: **~35 questions, promised as "about 20 minutes"**, with progress, save and resume | **Yes** (between the free tools' 10 minutes and a real picture) |
| Q2 | **No pass/fail, no "compliant" band**: readiness bands and plain words only | **Yes** (reaffirms D-011) |
| Q3 | **Pulse lives inside the platform** for clients (and consultant-led trials), **not** as a public free quiz | **Yes** (respects your 28 Oct decision on scanners and health checks, F-49) |
| Q4 | Borrow: progress expected from closed actions (labelled), top 5 actions + evidence checklist, existence/effectiveness in Pulse, benchmarks designed now and switched on at 20+ assessments per sector | **Yes** |

**Sources** (searched 29 Oct 2026; vendor-written unless marked):
- **Free quick checks:**
  - [Tsaaro self-assessment](https://tsaaro.com/dpdp-self-assessment-form)
  - [SaralPrivacy assessment](https://saralprivacy.com/assessment) · [Business Standard on SaralPrivacy](https://www.business-standard.com/content/press-releases-ani/dpdpa-compliance-pressure-builds-saralprivacy-launches-free-readiness-assessment-to-help-indian-businesses-map-privacy-gaps-126060200614_1.html)
  - [Cloudcyber 12 Q](https://cloudcyber.co.in/tools/dpdp-readiness)
  - [Ringsafe](https://ringsafe.in/dpdp-assessment/)
  - [BSA 40 Q](https://www.bhavyasharmaandassociates.com/free-dpdp-act-assessment-tool-indian-startups/)
  - [Consentin quiz](https://www.consent.in/quiz)
- **Platforms:**
  - [Neostra governance](https://neostra.io/platform/governance)
  - [OneTrust maturity self-assessment](https://www.onetrust.com/resources/onetrust-data-privacy-maturity-model-self-assessment-interactive-tool/)
  - [OneTrust maturity planning](https://www.onetrust.com/news/onetrust-maturity-planning-and-program-benchmarking-privacytech19/)
  - [Sprinto DPDP](https://sprinto.com/frameworks/dpdp/)
  - [Progressive — platform comparison](https://www.progressive.in/best-dpdp-compliance-platform)
  - [Mitigata DPDP](https://mitigata.com/compliance/dpdp)
  - [Axiom](https://axiom-app-dke.pages.dev/)
- **Consultants:**
  - [dpdpact.co.in gap assessment](https://dpdpact.co.in/dpdp-gap-assessment/)
  - [Glocert](https://www.glocertinternational.com/resources/articles/dpdpa-compliance-assessment-and-attestation/)
  - [CyberSigma](https://cybersigmacs.com/dpdp-gap-assessment/)
- **Frameworks:**
  - [DSCI DCPLA contents](https://www.dsci.in/files/content/documents/2023/Table_of_Contents-DCPLA.pdf)
  - [IDfy / MIT SMR privacy maturity study](https://www.mitsloanme.com/?p=11059)

*(Aniket, 29 Oct 2026: "I will come on these Q1 to Q4 decisions later": held while Phase I, the
business models, was done. Revisited in 2.7.)*

### 2.7 The Step 2 decisions, revisited after Phase I (29 Oct 2026)

Phase I (`BUSINESS_MODEL_ANALYSIS.md`, B1–B7, approved) changes **who runs
Pulse**: thousands of professionals with their clients, small businesses on
their own (Essentials), and AnixAI with enterprises. That changes the
decisions as follows.

| # | Original question | What Phase I changes | Revised recommendation |
|---|---|---|---|
| Q1 | Pulse ~35 questions, "about 20 minutes" | A CA sits with a client once; Team Pulse splits the time further (~10 min each) | **Keep: ~35 core + industry picks, "about 20 minutes"** |
| Q2 | No pass/fail, no "compliant" band | Partners white-label reports. They **must not be able to edit** the result wording into a "pass" (B2, D-011) | **Keep, and lock it:** result wording fixed in the templates; partners change only name and logo |
| Q3 | Pulse inside the platform, not a public quiz | Pulse now reaches people via professionals (Route A) and self-serve Essentials sign-up (P-5) | **Keep, no anonymous quiz.** Add: **the first Pulse is free after sign-up** (a signed-in organisation, not anonymous), the trial for Route B. Consistent with "no free scanner" (F-49): it needs an account and stays in the product |
| Q4 | Borrow: progress from closed actions, top-5 actions + evidence checklist, existence/effectiveness, benchmarks later | Partners need the action list and checklist most; benchmarks get data faster with many partners | **Keep all**; benchmarks switch on per sector at **20+ finalised Pulses** (not Proofs), labelled "self-declared peers" |

**Approved (Aniket, 29 Oct 2026):** "Step 2 and Step 3 approved with your recommendations (revised Step 2 Q1–Q4 …)".


---

## Step 3 — The design: Pulse → Proof → Sentinel

**Built on:**
- **Step 1:** what the code allows.
- **Step 2:** the market.
- **The six agreed refinements.**
- **Phase I:** professionals, Team Pulse, white-label, practice packs, the certification practical.

**Every rule here respects the CLAUDE.md invariants** (Step 1 §1.6).

### 3.1 The three levels, in one picture

```
            DPDP Compass™ PULSE                 DPDP Compass™ PROOF               SENTINEL™
            "Where do we stand?"                "What can we show?"               "Are we still on track?"
 Who        anyone: owner, CA, DPO, team        DPO + owners + reviewer           everyone (Essentials) → tiers
 How long   ~20 minutes (or ~10 per person)     weeks, domain by domain           every day
 Answers    plain words + "I don't know"        the same answers + evidence       facts from the registers
 Score      DECLARED (self-declared, labelled)  PROVEN (evidence-capped, D-044)   status line, no score
 Gives      5 actions this month, ₹, deadline,  defensible readiness, Board       alerts, ledger, posture
            evidence checklist                  reports, proven domains           as of [date]
            ─────────── answers carry forward ───────────►  ─────── registers feed ───────►
```

**Names:** **DPDP Compass™ Pulse** · **DPDP Compass™ Proof** · **Sentinel™** (Q1).
One journey. A client can stop at Pulse, prove one domain at a time, and
switch on Sentinel when ready.

### 3.2 Pulse — the questions

| Part | Rule |
|---|---|
| **Core Pulse set (~32)** | **2 questions per domain** (16 domains) chosen from the 98 core questions: **every question that can fire a red flag**, then the highest priority, then the widest legal basis. **Hand-picked once, reviewed by Aniket and counsel**, stored as a `pulse` marker on the question version. Five domains have no P0 question (Step 1), so picking is deliberate |
| **Industry picks (3–6)** | From the approved industry pack (University today; BFSI and Healthcare after Packs I), chosen by the same pack factory step |
| **Follow-ups (0–8)** | Only from **scope**, never from answers: children's data, AI on personal data, cross-border, SDF readiness switch on their 1–2 Pulse questions. Keeps the length predictable |
| **Applicability** | Comes from **scope first** (as today). A Pulse question can be marked "not for us" **only with a reason** (D-038 rule kept). **Pulse never asks "do you have children's data?" as a scored question** (the old app's flaw, Step 1 §1.5) |
| **Each question shows** | Plain question · why it matters (risk if weak) · the provision it rests on · a ✦ explain button (Slice 11) |

**The answer options.** These are the plain-word versions of the 0–5 scale (D-114), so Pulse and Proof stay comparable:

| Pulse answer | Maps to | Meaning shown |
|---|---|---|
| **Not started** | 0 | Nothing in place yet |
| **Aware** | 1 | We know we must, nothing written |
| **Written down** | 2 | A draft or partial process |
| **Approved** | 3 | An approved policy or process |
| **In use** | 4 | Working in practice |
| **Checked regularly** | 5 | In use, reviewed and improved |
| **I don't know** | — | **Counted as 0 in the declared score and listed as an unknown**, which becomes a task to find out (D-026: unknown behaves as risk) |

**Spot checks: "How do you know?"** One question per domain, on the
red-flag questions only. One tap: *We have a document · We have records or
logs · Someone told me · Not sure*. **They don't change the score.** They
feed (a) a **"how sure are we" indicator** per domain and (b) the **evidence
checklist** for Proof.

### 3.3 Pulse — the score and the findings

| Item | Rule |
|---|---|
| **Declared score** | **The same engine** (`scoreAssessment`) with the **declared rule** `(claimed) → claimed` (Step 1 §1.3): the same 16 domains, weights = 100, applicable weight, **red-flag caps** (firing at claimed ≤ 2), bands. Always labelled **"self-declared"**. Stored as a frozen Pulse snapshot (D-035) |
| **Bands** | The existing readiness bands (D-114 names), **never pass/fail or "compliant"** (Q2) |
| **"How sure are we"** | Per domain: share of spot checks answered with a document or records. Shown as words (*sure · partly sure · not sure*), not a number |
| **Declared gaps** | Derived from **claimed ≤ 3**, the same threshold as Proof's gaps (D-054), with the same severity and priority rules, **in SQL**; labelled "self-declared" |
| **The five actions this month** | **Ranked by rule, not AI:** red flags first, then P0, then the exposure head with the largest Schedule ceiling, then legal clocks before 13 May 2027. The person ticks which to keep; kept actions go to **the one actions list** (source "Pulse", D-067). The rest stay as findings, not tasks, so nobody is flooded |
| **Exposure and deadline** | Pulse findings feed the exposure view as **"declared position"**, a separate label from the evidence-backed exposure, never blended (D-069 spirit). The 13 May 2027 countdown shows on the result |

### 3.4 Repeat Pulses — progress without gaming

- **Each Pulse is its own frozen snapshot.** The trend line shows every Pulse (declared) and every finalised Proof (proven) on one chart, in two clearly different styles.
- **Starting a new Pulse pre-fills the last answers**, but each domain must be **confirmed** ("nothing changed" or edited). No silent copy-forward. This reuses Slice 12's carry-forward.
- **"What changed since last time"** lists the answers that moved, the actions closed in between, and the unknowns resolved.
- **Expected progress:** between Pulses, closed actions show an **"expected" movement**, dotted and labelled "not yet re-checked" (borrowed from OneTrust, Step 2).
- **Suggested rhythm:** monthly for the first quarter, then quarterly. Offered, never imposed (Slice 12 §4.12).

### 3.5 Team Pulse and workshop mode

| Mode | How it works |
|---|---|
| **Solo** | One person answers everything (~20 min) |
| **Team Pulse** | A coordinator assigns **domains** (not single questions) to people, with suggested owners from the bank (IT → security and breach; HR → employee data; admissions → notice and consent…). Each person sees **only their part** (~10 min). **Two people may answer the key red-flag questions independently.** If they disagree by 2+ levels, it's shown as a **finding** ("IT says In use, HR says Aware") and the coordinator settles it; the settled answer counts |
| **Workshop** | A consultant or professional fills Pulse **live with the client**: one domain per screen, keyboard-first, notes per question, a timer; the client's attendees recorded |

### 3.6 From Pulse to Proof — one domain at a time

1. **"Prove this domain"** on any domain of a Pulse result.
2. It opens (or extends) the organisation's **Proof assessment** with **all** applicable questions for that domain. The Pulse answers are **pre-filled as claims, marked "from Pulse, please confirm"**.
3. An **evidence checklist** for the domain is generated **from the question bank's evidence guidance** and the Pulse spot checks, with suggested owners (rule-based; the AI may word it, Step 5).
4. **Domain states** on the overview: **Declared** (Pulse only) → **Being proven** (evidence requested or uploaded, not yet all reviewed) → **Proven** (every applicable question answered with reviewed evidence). Proven means the score is evidence-backed; **it never means "compliant"**.
5. **Proof's rules are unchanged:** the evidence cap, a reviewer other than the uploader (D-043), red flags, gaps at ≤ 3, finalised snapshots.

**The headline visual (Step 4):** per domain, **declared bar vs proven bar**,
and overall "**You say 72; you can prove 41**", with the domains furthest
apart first.

### 3.7 Sentinel's link

- **Sentinel Essentials runs for everyone from the first Pulse** (legal clocks from the registers, Step 3 of the consolidated analysis).
- **REVIEW-01** (re-check readiness) uses the **last Pulse or Proof date**.
- A material change (a new processor, AI system or breach) **suggests a domain re-Pulse** (event-triggered, Slice 12 §4.4).

### 3.8 The partner view (Phase I)

| Need | Design |
|---|---|
| A professional's clients | The partner workspace (P-2) lists every client's **latest Pulse: declared score, unknowns, top action, days since last Pulse**, and declared vs proven where Proof exists |
| White-label | The Pulse result and report carry the partner's name and logo (P-9). **The result wording is locked** (Q2) |
| Workshop mode | The default for professionals |
| The certification practical | Level 1 = run Pulse in the demo organisation and produce the five actions; Level 2 = prove two domains from a given evidence set (B4.2) |
| Practice-pack metering | **A client organisation counts once it has a Pulse** (P-4) |

### 3.9 Legal guardrails (built in, tested)

1. **"Self-declared"** appears on every Pulse score, chart, export and share. A Pulse score **never appears as "readiness"** in a Board-grade report; there it is "declared position", next to the proven figure.
2. **Never "compliant", "certified" or "pass"**, in any edition or white-label (D-011, Q2).
3. **Applicability comes from scope**; "not for us" needs a reason; facts are never scored as maturity.
4. **Gaps, actions and scores are derived by rules** (SQL / core). **The AI never scores, never picks the five actions, never closes gaps** (CLAUDE.md invariants).
5. Every Pulse question shows its **provision**, checked against the Gazette text.
6. **SDF status is never inferred** from Pulse answers (D-028).
7. Snapshots are immutable (D-035); the declared rule is a **new, documented product rule** with its own decision entry and tests, never used for Proof.

### 3.10 Data model sketch (for the slice prompt)

```
 assessments.assessment_type        + 'pulse'          (baseline | reassessment | pulse)
 assessments.pulse_mode             solo | team | workshop
 question_versions.pulse_rank       null | 1..n        (the hand-picked Pulse set; industry picks too)
 assessment_responses.answer_state  answered | unknown | not_applicable      (unknown → declared 0, a task)
 assessment_responses.spot_check    document | records | told | not_sure | null
 assessment_score_snapshots.kind    proven | declared   (same engine; never blended)
 assessment_domain_assignees        (assessment, domain, user)                    ── Team Pulse
 assessment_response_inputs         (response, user, claimed, answer_state)       ── independent answers, disagreement
 gap_actions.source                 + 'pulse'
 organization_domain_states (view)  declared | being_proven | proven per domain   ── derived, never stored by hand
```

All tenant tables follow the Slice Contract (RLS, audit, Org A / Org B tests).
The declared rule lives in `packages/core` next to `SPEC_CAP_RULE`, with a
mirror test in SQL.

### 3.11 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | Names: **DPDP Compass™ Pulse · DPDP Compass™ Proof · Sentinel™** | **Yes** |
| Q2 | Pulse set: **2 per domain (~32) + 3–6 industry picks + scope-only follow-ups**, hand-picked once and reviewed by you and counsel | **Yes** |
| Q3 | Answers: **Not started · Aware · Written down · Approved · In use · Checked regularly · I don't know** (unknown = 0 + a task); spot checks on red-flag questions only, not scored | **Yes** |
| Q4 | **Declared score** = the same engine with the declared rule, always labelled; **declared gaps** at claimed ≤ 3; **five actions ranked by rule** and kept by the person | **Yes** |
| Q5 | Repeat Pulses **pre-fill but require per-domain confirmation**; "what changed"; expected progress dotted | **Yes** |
| Q6 | **Team Pulse by domain**, two independent answers on red-flag questions, disagreement as a finding; **workshop mode** | **Yes** |
| Q7 | **Prove domain by domain** with pre-filled claims and an evidence checklist; domain states Declared → Being proven → Proven | **Yes** |
| Q8 | The **legal guardrails** in 3.9, tested in CI | **Yes** |

**Approved (Aniket, 29 Oct 2026):** "Step 2 and Step 3 approved with your recommendations (revised Step 2
Q1–Q4 and Step 3 Q1–Q8)."


---

## Step 4 — Visuals by audience

**The mock-up:** [`assessment_visuals/PULSE_PROOF_VISUALS.html`](assessment_visuals/PULSE_PROOF_VISUALS.html).
- Opens in any browser, with no sign-in.
- One tab per audience; the answer buttons on the *Department owner* tab are clickable.
- **Sample data:** a fictional "Sahyadri Co-operative Bank"; nothing in it is a real result.
- Light and dark themes; works at phone width.

### 4.1 One visual language everywhere

| Rule | Why |
|---|---|
| **Declared = orange, Proven = blue** (revised in Step 4b.2a; first drafted as purple dashed / green solid). Never swapped, never mixed in one bar; told apart by **label and position as well as colour** | A reader can tell self-declared from evidence-backed at a glance, on every screen and every report (Step 3 guardrail 1) |
| **Expected = dotted** (movement from closed actions, not yet re-checked) | Honest about what isn't measured yet |
| **No red/green "pass/fail"** and no traffic-light "compliant" tile | Never "compliant" or "pass" (D-011, Step 2 Q2) |
| The **answer colour scale** follows the six plain answers (Not started → Checked regularly) | The same words in the question, the strip and the report |
| Every figure says **what it is and its date** ("Declared (Pulse, 12 Oct 2026) — self-declared") | No orphan numbers |
| **Penalty figures are labelled "ceiling", never "fine"** | The Schedule sets maximums, not predictions |

### 4.2 Six views, six messages

| Audience | The one message | What's on it | Where it lives in the product |
|---|---|---|---|
| **Board** | **"You say 72. You can prove 41."** | Declared vs proven, days to 13 May 2027, a trend (declared dashed, proven solid, expected dotted), domains furthest apart, penalty ceilings in play, **three decisions** | Overview + a new **page in the Exposure Brief** (Board PDF) |
| **DPO** | "What to do this month" | **The five actions** (ranked by rule, with owner, due date, provision, ceiling), "what changed since last Pulse", the **16-domain strip** (declared colour + Declared / Being proven / Proven + how sure), **unknowns**, **team disagreements** | The Pulse result + the assessment overview |
| **Department owner** | "Your part: about 10 minutes" | Only their questions, the six plain answers + "I don't know", why it matters + the provision, ✦ Explain, **the evidence they'll owe**, their actions | Team Pulse "my questions" screen |
| **Client (Pulse result)** | "Start here: five actions" | **White-label header** (the partner's name, "powered by TrustStack"), the five actions **first**, the declared score with "self-declared, not verified", unknowns, area bars, the **Pulse → Proof → Sentinel ladder** | Pulse result page + PDF |
| **Professional** | "Your clients at a glance" | Pack usage (18 of 25), average declared, clients due for a Pulse, a **client table** (declared, sparkline, proven, unknowns, top action, days since Pulse; overdue in amber) | The partner workspace (P-2) |
| **Auditor / inquiry** | "Only what is proven" | The proven score and its finalised date, reviewed evidence count (reviewer ≠ uploader), **evidence coverage by domain**, **the Sentinel ledger check** | Proof view + the evidence pack |

### 4.3 How the visuals keep it simple

- **Actions before scores** on every working screen (DPO, client, owner). Scores lead only on the Board view.
- **One chart per question.** No dashboard of twelve tiles.
- **Plain labels on every chart**; numbers in words where it helps ("31 points of claims not yet backed").
- **Phone-friendly:** tables scroll inside their card; cards stack.
- **Accessible:** declared vs proven is told apart by **line style as well as colour**; every chart has a text label; keyboard focus is visible.

### 4.4 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | The **visual language** in 4.1 (purple dashed = declared, green solid = proven, dotted = expected; no pass/fail colours; "ceiling", never "fine") | **Yes** |
| Q2 | The **six audience views** and their single messages (4.2) | **Yes** |
| Q3 | The Board headline **"You say X. You can prove Y."** plus **three decisions**, as a new page in the Exposure Brief | **Yes** |
| Q4 | The **professional's client table** columns (declared, trend, proven, unknowns, top action, days since Pulse) | **Yes** |
| Q5 | **Actions before scores** on every working screen | **Yes** |

**Approved (Aniket, 29 Oct 2026):** "I approved as recommended by you." **And:** "I want visuals very
professional and advanced … I don't want mock-ups, I want real production-grade visuals to understand the
assessment journey and overall journey through our platform." → Step 4b.


---

## Step 4b — Production-grade, data-driven visuals

**Aniket (29 Oct 2026):** "I want visuals very professional and advanced … real production-grade visuals
to understand the assessment journey and overall journey through our platform."

### 4b.1 What was built — real data, the product's own engine

| | |
|---|---|
| **The report** | [`assessment_visuals/VISUAL_JOURNEY_REPORT.html`](assessment_visuals/VISUAL_JOURNEY_REPORT.html): a headline figure, **8 stat tiles, 10 charts, a status table and a live journey map**; light and dark themes, phone width, hover tooltips, and a **Table view on every chart** |
| **The generator** | `tools/visual_report.mjs` + `tools/visual_report_template.html`. Run: `pnpm --filter @truststack/core build && node tools/visual_report.mjs` |
| **The assessment data** | **The validated Excel MVP baseline** (Mumbai University, **98 real answers**, the scoring oracle in `packages/db/question-bank/workbook-sample.json`) scored by **TrustStack's own engine** (`scoreAssessment`, engine 1.0.0): **proven** with the product's evidence cap (D-045), **declared** with the Pulse rule (Step 3 Q4). It reproduces the parity figures exactly: proven **25.3**, evidence confidence **24 %**, **10 critical / 52 high**, **red-flag ceiling 50** |
| **The journey data** | The **local demo tenant's registers** (Mumbai University seed: 10 processing records, rights requests, a breach, processors, 10 retention schedules, actions, notices, consents), read read-only from the local database, **never hosted** |
| **Charts library** | **Apache ECharts 5.5.0** (open source, Apache-2.0), from cdnjs with a jsDelivr fallback; needs internet to draw, and says so plainly when offline |
| **Every chart carries** | A title, **a one-line finding computed from the data** (never typed), and its **source** |

### 4b.2 The visuals, and why each earns its place

**Revised 29 Oct 2026 after Aniket's review:** "the quality of current charts generated is not that good …
it should not create a bad impression about our platform." The first draft used radar, Sankey, treemap,
waterfall and donut charts. Each was replaced by a form that is easier to read accurately (4b.2a).

**1 · The assessment**

| # | Visual | Form | What it tells you (from the real data) |
|---|---|---|---|
| — | **Headline + 8 tiles** | Hero number and stat tiles | Proven 25.3 / 100 (Aware, evidence confidence 24 %); declared 26.1; 7 red flags; 10 critical, 52 high; 49.7 points to 75; 196 days to 13 May 2027; 1.8 points a week; 5 of 98 answers over-claimed |
| A1 | **Where the score sits** | Bullet on the six readiness bands (labelled with ranges) + red-flag ceiling marker | Proven 25.3 and declared 26.1 sit in *Aware* (20–40); the ceiling (50) is above, so it doesn't bite yet |
| A2 | **Declared and proven, by domain** | Dumbbell, sorted, with a dashed 75 % target line | Claims and proof coincide in 15 of 16 domains; the widest gap is Accuracy (60 % declared vs 40 % proven) |
| A3 | **Points to reach the target** | Sorted horizontal bars, value-labelled | 49.7 points in all; Breach (+4.9), Data inventory (+4.6), Processors (+4.1) hold the most |
| A4 | **Gaps by domain and severity** | Stacked bars (severity colours + legend) and P0–P3 chips | 98 gaps; Breach carries the most severe mix; P0 10 · P1 52 · P2 36 · P3 0 |
| A5 | **Claims against evidence** | Heatmap: claimed level × evidence level, one blue scale, counts in cells | 93 of 98 answers sit within what their evidence supports; 5 claim more and are capped |
| A6 | **Who owns the gaps** | Ranked bars by the bank's suggested owner | Legal 41, IT 26: who gets the first actions |
| A7 | **The pace needed by 13 May 2027** | Dashed projection line with target, ceiling and deadline lines | About **1.8 proven points a week**, **labelled a projection, not a forecast** |

**2 · The journey through the platform**

| # | Visual | Form | What it tells you |
|---|---|---|---|
| B1 | **Where this organisation is on the journey** | Nine-stage stepper (Scope → Pulse → Proof → Act → Registers → Notice & consent → Report → Sentinel → Reassess), each status **read from the records** | Done / in progress / not started, with the live count behind each stage |
| B2 | **Processing records: completeness and risk** | Sorted bars + risk shown as a coloured dot **and a word** | Completeness 62–80; 8 of 10 high or above; 9 with no lawful basis decided |
| B3 | **Legal clocks** | Bars as % of the legal limit, with a "Legal limit" line | Rights 90 days (R.14(3)), Board report 72 h (R.7); all 3 met, the closest at 75 % |
| B4 | **Processors under contract** | Status table (icon + words) — three rows read better as a table | 1 of 3 has DPDP clauses: a Sentinel VENDOR-01 finding |
| B5 | **Retention: due for erasure** | Dot plot against a "Today" line; overdue dots in the critical colour, labelled | **2 records are past their erasure date (ROPA-008, ROPA-009)**; the Rule 8(2) 48-hour notice applies to each |

The review caught an accuracy error in the first draft: B5 counted the two overdue records as "due within
six months". The finding now separates overdue from upcoming.

### 4b.2a The quality standard every chart now meets

| Standard | What it means in practice |
|---|---|
| **The form fits the question** | Bars, dots and lines for comparisons; **no radar, Sankey, treemap, waterfall or donut** for small comparisons, because they are hard to read accurately |
| **A tested colour palette** | Proven = blue `#2a78d6`, declared = orange `#eb6834` (dark mode `#3987e5` / `#d95926`). Checked with a palette validator for colour-blind separation (ΔE 24.7 light, 26.8 dark), lightness and contrast. Bands use one blue scale, light to dark |
| **Severity colours are reserved** | Critical / high / medium / good are used only for severity and status, and **always with a word or icon**, never colour alone |
| **Clean marks** | Thin bars (≤ 24 px, rounded ends), 2 px lines, markers ≥ 8 px with a surface ring, hairline grid, one axis per chart (never two scales) |
| **Every chart carries** | Title · one-line finding **computed from the data** · chart · source line · **Table view** (the same numbers as a table, for screen readers and audit) |
| **Checked by eye** | Every chart rendered and inspected in light and dark for clipped or colliding labels before release |

### 4b.3 An honest finding from real data

In MU's consultant-scored baseline, **declared and proven are almost equal**
(26.1 vs 25.3), because the answers were scored against evidence. The
**"you say X, you can prove Y"** gap is expected from **self-run Pulses**, and
these visuals will show it as soon as real Pulse data exists. **No figure was
invented to make the story bigger.**

### 4b.4 The full catalogue for the product (beyond this set)

The same engine and readers support further production visuals, to be built as
components (Step 7):

| For | Visual | Feeds on |
|---|---|---|
| Repeat Pulses | **Slope chart** Pulse-to-Pulse per domain; **"what changed" diff table** | Pulse snapshots (F-69) |
| Board | **Exposure bars** (₹ ceiling by head, sorted, labelled with position) and the **what-if** slider (already in Slice 9) | Exposure model 1.7.0 |
| DPO | **Burn-up** of actions closed vs planned to 13 May; **owner workload heatmap** (owner × week) | The one actions list |
| Proof | **Evidence ageing** (histogram by days to expiry); **review queue funnel** (uploaded → reviewed → accepted) | Evidence + Slice 13 expiry |
| Sentinel | **Control status timeline** (23 controls × days: pass / attention / failing); **ledger verification badge** | Sentinel (13.5) |
| Team Pulse | **Disagreement matrix** (people × questions, gap in levels) | Team Pulse inputs |
| Professional | **Portfolio scatter** (clients by declared × proven, size = exposure); **practice cohort retention** | Partner workspace (P-2) |
| AnixAI | **Partner network funnel** (registered → certified → active → Distinguished); **revenue by stream** (B3 R1–R16) | Console (Slice 14), billing |
| Benchmarks (later) | **Peer distribution** (box plot of declared scores in a sector, the client marked) | 20+ Pulses per sector |

### 4b.5 How these become product features

- **One charts library for the product: Apache ECharts** (open source, self-hostable: bundled into the app, no CDN in client-hosted installs). It needs a DECISIONS entry under the stack rule in CLAUDE.md.
- **Charts read through the routes' own readers and add no arithmetic** (D-069). The generator already follows this: every number comes from `scoreAssessment` or a register row.
- **Each chart a component** with the same anatomy: title · one-line finding (computed) · chart · source line · "self-declared / proven" label.
- **The same components render on screen and in the PDF reports** (Slice 9 report store), so the Board sees in print what the DPO sees on screen.

### 4b.6 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | Adopt **Apache ECharts** as the product's charts library (bundled, so client-hosted works offline) | **Yes** (a DECISIONS entry at build time) |
| Q2 | The **visuals** in 4b.2 (revised set) as the first production set, plus the catalogue in 4b.4 as the backlog | **Yes** |
| Q3 | Every chart: **computed finding + source line + declared/proven label**; no typed numbers | **Yes** |
| Q4 | Keep `tools/visual_report.mjs` as a **living demo and sales asset** (regenerated from real data), until the in-product components exist | **Yes** |
| Q5 | The **quality standard** in 4b.2a for every chart in the product, including the colour change (proven blue, declared orange) that replaces Step 4 Q1's purple/green | **Yes** |

**To approve:** reply "Step 4b approved" (with your answers to Q1–Q5), or "…with changes: …".

**Approved (Aniket, 29 Oct 2026):** "Step 4b approved with your recommendations (Q1–Q5). Start Step 5."

---

## Step 5 — AI use cases and guardrails

**The principle, unchanged since Slice 11:** *the AI explains and drafts; rules decide; a person confirms.*
The AI never scores, never answers for the client, never picks the five actions, never closes a gap,
never approves evidence and never certifies (CLAUDE.md invariants; Step 3 guardrail 4).

### 5.1 What exists today (Slice 11, live)

| | In the code |
|---|---|
| **10 AI tasks** | 4 explain helpers (question, evidence, gap, score) and 6 drafts (ROPA entry, breach intimation, rights reply, privacy notice, notice translation, report narrative): `packages/core/src/ai-tasks.ts` |
| **Guardrails in code** | Personal-data scrub (email, phone, Aadhaar, PAN), allow-listed fields only, question-bank internals stripped, prompt-injection detection on uploaded evidence, **wording rules** (no "certifies", "approves evidence", "closes gap", "changes score"; no TrustStack target presented as the law), **numbers check** (every number in a narrative must exist in the source): `ai-guardrails.ts`, `ai-drafts.ts` |
| **Switches** | Off by default; the `AI_ENABLED` kill switch; on per organisation only with a contract reference; **held off for `bfsi` and `healthcare`** until counsel signs off (s.16(2)) and **for SDFs** (Rule 13(4)) |
| **Limits and audit** | Per person, per organisation and monthly token limits; audited as the person, never the text; a 40-case reference-answer test |
| **Provider** | Claude behind a provider interface; a client-hosted install can point to its own endpoint (`ANTHROPIC_BASE_URL`) or run with AI off |

**So Step 5 adds no new safety machinery.** It adds a few new tasks that reuse the gateway.

### 5.2 What the market does with AI (checked 29 Oct 2026)

| Product | AI claim | What it tells us |
|---|---|---|
| **"DPDP Compass"** (CA use case on ICAI's AI portal, by an individual CA) | A 5-step questionnaire goes to Claude, which **writes the whole gap report** with Critical/High/Medium/Low ratings, **flags SDF risk signals**, drafts notices and DPAs; a chat assistant; editable before download | The AI decides the gaps and hints at SDF status; no scoring method, no evidence, no stated guardrails. **We do the opposite:** rules derive gaps; SDF status is never inferred (D-028) |
| **ComplyDP** | Scans websites, maps data flows, finds gaps, writes an action plan; a free report | A scanner-led lead magnet (we decided: no free scanner) |
| **Cross Identity VISHWAAS AI** | "AI platform for DPDP"; a free lifetime licence offer that closed 30 Jun 2026 | Price pressure from free AI tools |
| **Mitigata (Gordon AI), Axiom** (Step 2) | "AI gap scans", auto-answers | Unverified claims; AI answers for the client |
| **Open-source "DPDP Copilot"** | Claude classifies rights requests and drafts replies with an evidence trail | The same pattern as our rights draft |

**The lesson:** competitors sell "AI does the assessment". That is fast but **not defensible in front of the
Board or the Data Protection Board**. Our pitch: **"AI helps you answer; the rules score; you can show your
working."** Every AI sentence is a draft with a named person who accepted it.

> **Name clash to check:** the ICAI use case uses the name **"DPDP Compass"**, the same as our
> **DPDP Compass™ Pulse / Proof**. Before launch, counsel should run a trade-mark search and decide whether
> to file, keep or rename (for example "TrustStack Pulse / Proof"). Source: [ICAI AI use cases, id 304](https://ai.icai.org/usecases_details.php?id=304).

### 5.3 Where AI helps Pulse, Proof, Sentinel and partners

Rated by value to the person and by risk. **Reuse** = an existing task with a new screen.

| # | Who | The help | AI does | Rules / the person do | Task | Value · Risk |
|---|---|---|---|---|---|---|
| AI-1 | Anyone answering Pulse | **"What does this mean for us?"** on each question, with what each answer (*Not started* → *Checked regularly*, Step 3.2) looks like in practice | Explains in plain words, in the person's language | The person picks the answer | **Reuse** `question_helper` (adds the six answer examples to its context) | High · Low |
| AI-2 | Anyone answering Pulse | **"Does my one-line 'how do you know?' support my answer?"** on the spot checks | Says whether the sentence supports the level chosen, and what would | The answer is **never changed**; a mismatch is shown as a hint only | **New** `spotcheck_helper` (explain) | High · Low |
| AI-3 | DPO | **"How to start"** for each of the five actions: first three steps, who to involve, what evidence will close it | Drafts a short plan | **Rules pick the five actions** (Step 3); the DPO edits and accepts | **New** `action_plan_draft` (draft) | High · Medium |
| AI-4 | DPO / consultant | **Team Pulse disagreements:** why two departments may differ, and three questions to settle it in the workshop | Explains | Disagreement is **found by rules** (answers differ by ≥ 2 levels); the meeting decides | **New** `disagreement_helper` (explain); people's names not sent | Medium · Low |
| AI-5 | Domain owner (Pulse → Proof) | **Evidence checklist in plain words** for a domain being upgraded | Words the items | **The items come from the question bank's evidence guidance** (rule-based); the owner accepts | **New** `evidence_checklist_draft` (draft) | High · Low |
| AI-6 | Reviewer (Proof) | **"Is this evidence enough?"** | Reads the document as **untrusted input** and says what it seems to cover and miss | **The reviewer accepts or rejects; never the AI** (D-056) | **Reuse** `evidence_helper` | High · Medium |
| AI-7 | Board | **The Board page narrative:** "You say X. You can prove Y." plus three decisions | Writes the words around **server-inserted numbers** | Numbers check; "self-declared" / "proven" labels forced by the server; a person accepts | **Reuse** `report_narrative_draft` (new section) | High · Medium |
| AI-8 | Owner / Sentinel | **Explain a failing Sentinel control** and draft fix steps | Explains and drafts | **The control result is computed** (Sentinel rules) | **New** `sentinel_helper` (Slice 13.5) | High · Low |
| AI-9 | Certified professional | **Client summary letter** after a Pulse or Proof, white-labelled | Drafts a letter from the result | **The professional reviews and signs**; no "compliant", no fee or referral wording (Step B2) | **New** `client_letter_draft` (draft, legal flag on) | High · Medium |
| AI-10 | Anyone | **Ask DPDP** (TrustChat): DPDP questions with section references, on the landing page and in-app | Answers from the Gazette corpus with checked citations | Never about the visitor's own compliance status; no personal data asked | **Reuse** corpus; Track M | Medium · Medium |

**Deliberately not AI:**
- **The score, the band, the gaps, the five actions, the red flags, the penalty ceilings**: all rules (D-054, D-058, Step 3).
- **The one-line findings on charts**: computed (Step 4b Q3). An AI sentence could misstate a number.
- **"I don't know" routing**: the question bank already names the owner; a rule is simpler.
- **Pre-filling Pulse answers** from documents or a website scan: that is the competitor "auto-answer". It would make a self-declared score not even self-declared.
- **SDF likelihood**: never inferred (D-028).

### 5.4 The new guardrails these tasks need

All reuse the Slice 11 gateway; each is a small addition with a test.

| # | Guardrail | Why |
|---|---|---|
| G1 | **Label lock:** any AI text that mentions a declared score must say "self-declared"; any proven score, "evidence-backed". Enforced as a wording rule | Declared and proven never blend (Step 3 guardrail 1) |
| G2 | **Number lock** extends to the Board page, action plans and client letters: every figure must exist in the source set | No invented numbers |
| G3 | **No answer changes:** the spot-check and evidence helpers have no write path to answers, levels or reviews (no tool that writes, D-124 4.4) | The AI never answers for the client |
| G4 | **Team Pulse privacy:** department names only; people's names and free-text comments scrubbed before sending | Only what is necessary is processed (s.6(1) necessity; Rule 6 safeguards); nothing personal is needed |
| G5 | **Professional letters:** forbidden words added ("certified compliant", "guarantee", "commission", "referral fee"); the professional's name is a placeholder the platform fills | B2 professional-conduct rules |
| G6 | **Product fully usable with AI off.** Every AI button has a plain non-AI path (the static "why it matters" text, the rule-based checklist) | BFSI and healthcare, our first markets, are **held off** until counsel signs off; client-hosted installs may never turn it on |
| G7 | **The reference set grows by 4 cases per new task** (good answer, over-claim, injection attempt, wrong-label trap) | §4.13 test |

### 5.5 The legal footing (as a DPDP expert)

- **The fiduciary stays responsible** (s.8(1)): an AI draft does not shift responsibility; hence "a person accepts" on every draft.
- **Cross-border** (s.16; Rule 15 from **13 May 2027**): the AI provider is a sub-processor outside India. No s.16(1) restriction is notified (D-124, secondary sources; counsel to confirm against the Gazette). **Re-check at Step 7 and every slice.**
- **Sector rules** (s.16(2)): RBI's FREE-AI framework (Aug 2025) for regulated entities is why `bfsi` stays held until counsel signs off. **For the banking go-to-market, the sale must not depend on AI.**
- **SDFs** (Rule 13(3) algorithmic due diligence; Rule 13(4) data localisation): SDF tenants stay held.
- **India AI Governance Guidelines** (MeitY, 5 Nov 2025; "People First": human oversight): our human-accepts design matches. Not binding law; read from secondary summaries ([Inc42](https://inc42.com/buzz/meity-unveils-ai-governance-framework), [S.S. Rana](https://ssrana.in/articles/meity-unveils-indias-approach-towards-regulating-artificial-intelligence/)).
- **Never "AI audit" or "AI-certified"** in marketing (D-011).

### 5.6 Cost and plans

- Explain tasks run at low effort, drafts at medium (Slice 11). A Pulse with a dozen helper uses is a small share of the existing monthly allowance.
- **Recommendation:** AI included in every paid plan within the monthly allowance (no separate AI fee). Easier to sell, matches B1's "fee follows the modules". Heavy use hits the existing limit message. Revisit with real usage in Phase III cost-model reconcile.

### 5.7 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | The **10 use cases** in 5.3: 4 reuse existing tasks, 6 new (`spotcheck_helper`, `action_plan_draft`, `disagreement_helper`, `evidence_checklist_draft`, `sentinel_helper`, `client_letter_draft`) | **Yes** — build AI-1, 2, 3, 5, 7 with Pulse; AI-4 with Team Pulse; AI-8 with Sentinel; AI-9 with the partner workspace |
| Q2 | The **"deliberately not AI"** list, including **no auto-answer** from documents or scans | **Yes** |
| Q3 | Guardrails **G1–G7**, especially **G6: the product sells and works fully with AI off** | **Yes** |
| Q4 | Positioning: **"AI helps you answer; the rules score; you can show your working"**, never "AI audit" | **Yes** |
| Q5 | **AI included** in paid plans within the monthly allowance | **Yes** |
| Q6 | Ask counsel for a **trade-mark search on "DPDP Compass"** (clash with the ICAI use case) before launch | **Yes** |

**To approve:** reply "Step 5 approved" (with your answers to Q1–Q6), or "…with changes: …".

**Approved (Aniket, 29 Oct 2026):** "Step 5 approved with your recommendations (Q1–Q6). Start Step 6."

---

## Step 6 — Simplicity check against `docs/UX_REVIEW.md`

**How:** each **planned** surface from Steps 3–5 is walked as a non-lawyer would meet it and scored on the
rubric's 11 checks (R1–R11, `docs/UX_REVIEW.md` §1). This is a review on paper, before code; each surface
is scored again on screen at its slice gate (UX rule 1). A 🟡 or ❌ here becomes a **design fix (S-n)**
that goes into the Step 7 slice prompt, so it is built right the first time.

### 6.1 Three inconsistencies found in our own plan (R9)

| # | Found | Fix |
|---|---|---|
| **S1** | **Three different sets of answer words.** The brief (§0) says *Not started · Started · Written down · In use · Checked regularly*; Step 3.2 (approved) says *Not started · Aware · Written down · Approved · In use · Checked regularly*; the live Proof screen (`CLAIM_LEVELS`, D-114) says *Not started · Aware · Draft or partial · Defined · Implemented · Operational and monitored*. A person who moves from Pulse to Proof would meet the same 0–5 scale under two sets of names | **One set everywhere: Step 3.2's six words**, in Pulse **and** Proof. The numbers 0–5, the meanings and the evidence cap do not change. Proof's meaning line keeps "with evidence" at 4 and 5. A copy change, not a rule change (UX rule 3), recorded as a DECISIONS entry because it touches `CLAIM_LEVELS`. "Defined" then means only a band, never an answer (the clash the code comment in `assessment-display.ts` warns about) |
| **S2** | **Two time promises:** "~30 minutes" (§0) and "~20 minutes" (Steps 2–3) | **"About 20 minutes"** everywhere (Team Pulse: "about 10 minutes for your part"). The screen shows the live estimate from the questions left |
| **S3** | The brief still lists the 5-word scale | §0 is the brief as given; Step 3.2 governs. A note is added there |

### 6.2 The first ten minutes, step by step

A new DPO at a co-operative bank, never trained in DPDP:

| Step | What they see | Clicks | Check |
|---|---|---|---|
| 1 | Overview: **"Start here: your Pulse — about 20 minutes. You'll get your five most important actions."** One primary button | 1 | R1 R2 ✅ |
| 2 | If scope is not done: **five scope questions inline** (industry, children's data, cross-border, AI on personal data, rough number of people), not the separate nine-question wizard | 5 | **S4** (U08 is 🟡 R11 today) |
| 3 | **Solo or with your team?** Two cards, Solo pre-selected | 1 | R6 ✅ |
| 4 | One domain per screen; per question: the plain question, the six answers + "I don't know" as large buttons, "Why this matters" folded, the provision in grey, ✦ Explain. **No question codes** | ~38 answers | **S5** (U11 still shows codes) |
| 5 | On red-flag questions only: **"How do you know?"** one tap | ~10 | R6 ✅ |
| 6 | Progress always visible: **"Domain 4 of 16 · 12 of 38 answered · about 13 minutes left"**; autosave; resume from the overview | 0 | R8 R11 ✅ |
| 7 | **Result:** five actions first, then the score | 1 per kept action | see 6.4 |

**About 55 taps in about 20 minutes**, with no typing required. The competitors' free checks take 3–10
minutes but give no actions (Step 2); ours ends in a plan.

### 6.3 Every planned surface, scored (paper review)

Scores R1 → R11, as designed **after** the S-fixes are applied. Before the fixes, the marks were weaker where noted.

| ID | Surface | Who | Score (R1–R11) | Was weaker on, before the fix |
|---|---|---|---|---|
| U48 | **Start a Pulse** (overview card + mode choice + inline scope) | DPO, owner, CA | ✅✅✅✅✅✅✅✅✅✅✅ | R6 (separate scope wizard) → S4 |
| U49 | **Answering a Pulse** (solo) | Anyone | ✅✅✅✅✅✅✅✅✅✅✅ | R3 (question codes) → S5; R9 (answer words) → S1 |
| U50 | **Pulse result** | DPO, owner | ✅✅✅✅✅✅✅✅✅✅✅ | R3, R8 (too many ideas at once) → S6, S7 |
| U51 | **Repeat Pulse: confirm a domain** + "what changed" | DPO | ✅✅✅✅✅✅✅✅✅✅✅ | R6 (16 confirmations) → S8 |
| U52 | **Team Pulse: coordinator** (assign domains, chase, settle disagreements) | DPO | ✅✅✅✅✅🟡✅✅✅✅✅ | R6 🟡: assigning 16 domains by hand → S9 (suggested owners pre-filled; one "Send all") |
| U53 | **Team Pulse: "my part"** | Department owner | ✅✅✅✅✅✅✅✅✅✅✅ | R10 (owners answer on phones) → S10 |
| U54 | **Workshop mode** | Professional | ✅✅✅✅✅✅✅✅✅🟡✅ | R10 🟡: keyboard-first is right on a laptop; projected screens need large type → S11 |
| U55 | **Prove this domain** (checklist, domain states) | DPO, owners, reviewer | ✅✅✅✅✅✅✅✅✅✅✅ | R3 ("declared", "proven" unexplained) → S6 |
| U56 | **Board page in the Exposure Brief** ("You say X. You can prove Y.") | Board | ✅✅✅✅✅✅✅✅✅✅✅ | R4 (Pulse figure looked like readiness) → guardrail 3.9.1 |
| U57 | **Professional's client table** | Professional | ✅✅✅✅✅✅✅✅✅✅🟡 | R11 🟡: 25+ clients needs paging, search and sort (the standard `<DataTable>`) → noted for the partner slice |
| U58 | **Pulse PDF, white-label** | Client, professional | ✅✅✅✅✅✅✅✅✅✅✅ | R9 (partner logo vs locked wording) → wording locked (3.8) |
| U59 | **AI helpers on Pulse** (AI-1, 2, 3, 5) | Anyone with AI on | ✅✅✅✅✅✅✅✅🟡✅✅ | R9 🟡: the U45 lesson ("Why this score?" on 16 rows is busy) → S12 |

### 6.4 The design fixes (S4–S12) for the slice prompt

| # | Fix | Rubric |
|---|---|---|
| **S4** | **Inline minimum scope** inside Pulse (five questions, the ones that switch follow-ups on); the full scope wizard stays for Proof and settings | R6 |
| **S5** | **No question codes** on any Pulse screen, export or PDF (the code stays in the audit, the bank and the consultant's question-bank view). Also closes U11's 🟡 R3 for Proof | R3 |
| **S6** | **Two words glossed once, everywhere:** *Declared* = "what you told us"; *Proven* = "what your evidence shows". Same tooltip, same words on screen, in PDFs and in the AI's text (Step 5 G1) | R3 R9 |
| **S7** | **The Pulse result in three layers:** (1) the five actions with owner and date; (2) the declared score, "self-declared", the band, days to 13 May 2027; (3) folded: domains, unknowns, how sure, red flags, exposure. A red-flag hold reads **"Your score is held at 50 until these two things are in place"**, never "capped" | R3 R8 |
| **S8** | **Repeat Pulse:** "Nothing changed in these 12 domains — confirm all" plus the 4 that changed, rather than 16 separate confirmations. Each domain is still confirmed explicitly (Step 3 Q5), only in one tap | R6 |
| **S9** | **Team Pulse:** owners pre-filled from the bank's suggested owner by role; one "Send all"; a reminder after 3 days; a disagreement shows both answers side by side with one **"Settle"** button | R6 R2 |
| **S10** | **Phone-first answering** for "my part": one question per screen, large answer buttons, works at 375 px | R10 |
| **S11** | **Workshop view:** large type, one question per screen, hide the side menu, keyboard 0–5 and U for "I don't know" | R10 |
| **S12** | **AI buttons:** one ✦ per question (not per row of a table), and none on the result's scores (Step 5 keeps the score rule-based) | R9 |

### 6.5 What we chose not to simplify (and why)

| Kept | Why |
|---|---|
| **"I don't know" counts as 0** | D-026: unknown behaves as risk. The plain line: "We count it as not started until someone finds out — it's on your list." |
| **"Self-declared" on every Pulse figure** | Legal guardrail 3.9.1; a Board must never mistake it for evidence |
| **The provision under each question** | R4 (exact law); shown in grey, folded on a phone |
| **Six answer levels, not three** | Pulse and Proof must share the 0–5 scale (D-114) so a domain can be upgraded without re-answering |
| **Two independent answers on red-flag questions in Team Pulse** | Disagreement is a finding the Board needs to see |

### 6.6 Where this goes

- **`docs/UX_REVIEW.md`** gets rows U48–U59 marked 🔲 (planned) at Step 7, with these paper scores as the target. Each is scored again on screen at its slice gate.
- **S1** (one set of answer words) and **S5** (no question codes) also touch the live Proof screens, so they go into the first Pulse slice as a small, separate batch with its own manual test, never folded silently (UX rule 2).

### 6.7 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | **S1: one set of answer words** for Pulse and Proof (*Not started · Aware · Written down · Approved · In use · Checked regularly* + *I don't know*), replacing Proof's current names; numbers and rules unchanged | **Yes** |
| Q2 | **S2: "about 20 minutes"** as the single time promise (Team Pulse: about 10 minutes per person) | **Yes** |
| Q3 | **S4: five scope questions inline** in Pulse instead of sending a first-time user to the scope wizard | **Yes** |
| Q4 | **S5–S12** as design rules in the Pulse slice prompt (no codes; two glossed words; the three-layer result; one-tap repeat confirm; Team Pulse pre-assigned; phone-first; workshop view; one ✦ per question) | **Yes** |
| Q5 | The **"not simplified"** list in 6.5 stays as is | **Yes** |

**To approve:** reply "Step 6 approved" (with your answers to Q1–Q5), or "…with changes: …".

**Approved (Aniket, 29 Oct 2026):** "Step 6 approved with your recommendations (Q1–Q5). Start Step 7."

---

## Step 7 — The implementation plan (Phase III: the combined programme)

### 7.1 Where Pulse goes in the build order

Three facts decide it:
1. **Wave 1 professionals start in Dec–Jan, and Pulse is their critical dependency** (B7.5): without it
   they have only the long evidence-based assessment.
2. **Pulse reuses Slice 12's carry-forward** for repeat Pulses (S8), so it must come after Slice 12.
3. **A `consultant` role already exists** ("runs assessments for the client organisations they are
   assigned to"), so wave 1 needs **no partner features** before Pulse: workshop mode on the consultant
   role is enough.

| Option | Order | Effect |
|---|---|---|
| **A (recommended)** | 12 → **12.3 Pulse** → 12.5 Packs I → 13 → 13.5 → 14 launch → 15 | Pulse live on the site by ~20 Nov, in time to rehearse wave 1; **launch moves from mid-Dec to ~23 Dec 2026** |
| B | Fold Pulse into Slice 12 | One very large slice; Slice 12's prompt is written and ready, so this reopens it |
| C | Pulse after launch (Phase B, Jan) | Launch stays mid-Dec, but wave 1 runs without Pulse — the cohort's value drops |

**Packs I content runs in parallel:** the overlap maps and counsel's review of BFSI and Healthcare are
content and legal work, not code, so they start on 9 Nov; only Packs I's code waits for 12.3.

### 7.2 The updated timeline (targets)

| Slice | What | Dates |
|---|---|---|
| 12 | Reassessment (+ Sentinel S1 card) | 2–6 Nov 2026 (unchanged) |
| **12.3** | **Pulse** (3 stages) | **9–20 Nov 2026** |
| 12.5 | Packs I (+ each pack's Pulse picks) | 21–27 Nov (content from 9 Nov) |
| 13 | Hardening + launch readiness | 28 Nov–5 Dec |
| 13.5 | Sentinel S2–S3 | 7–14 Dec |
| 14 | Console + licensing → **production launch** | 15–23 Dec |
| 15 | Client-hosted | 4–22 Jan 2027 |
| M | Landing pages + chatbot (parallel) | Nov 2026 |
| Phase B | PK1–PK5, Packs II/III, multi-entity, Sentinel S4 … | Jan–Apr 2027, before **13 May 2027** |

Everything is still ahead of 13 May 2027 (Rule 1(4) of G.S.R. 846(E): Rules 3, 5–16, 22, 23 commence
eighteen months after publication). Rule 4 (Consent Managers) commences 13 Nov 2026 (Rule 1(3)); it does
not touch Pulse.

### 7.3 The partner build packages (Phase I) in sequence

| Package | When | Why then |
|---|---|---|
| **Wave 1 (no package)** | Dec–Jan | Today's platform + the `consultant` role + Pulse workshop mode; certificates manual; courses on Teams |
| **PK2 — Pulse for partners** (white-label P-9, P-15) | Phase B, Jan 2027 | Needs Pulse (12.3) and licensing (14) |
| **PK1 — Partner foundations** (partner org type, engagements visible and removable by the client, P-1/2/3/8/10) | Phase B, Jan 2027 | Before practice packs; wave 1 manages without it |
| **PK3 — Entitlements, sign-up, billing** | Wave 2, Feb–Apr 2027 | After Slice 14's licensing (F-67, F-68) |
| **PK4 — Academy and directory** | Wave 2, Feb–Apr 2027 | Needs PK1 and PK3 (paid courses) |
| **PK5 — Partner console and quality** | Mar–Apr 2027 | Needs Slice 14's console and PK1 |

Each package gets its own slice prompt, written by the Sync Step of the slice before it.

### 7.4 What was written in this step

| File | Change |
|---|---|
| `docs/slices/SLICE_12_3_pulse.md` | **New full prompt**: §4's fourteen decisions from Steps 3–6, three stages and gates, tests, pitfalls |
| `docs/SLICES.md` | Row 12.3 added (proposed); 12.5, 13, 13.5, 14, 15 dates moved |
| `docs/slices/SLICE_12_reassessment.md` | Must-not-be-lost: keep `assessment_type` open to `'pulse'`, the revisit rule reusable, carry-forward confirmable per domain. Nothing else changes; still awaiting "SLICE_12 approved" |
| `docs/slices/SLICE_12_5_packs_i.md`, `SLICE_13_5_sentinel.md`, `SLICE_14_*.md` | New targets; Packs I names each pack's Pulse picks |
| `docs/DECISIONS.md` | **D-143**: Phase I and Steps 1–6 recorded. Step 7 becomes D-144 on approval |
| `docs/STATE.md` | The start-here box: Step 7 awaiting approval; the branch to merge |
| `docs/UX_REVIEW.md` | Rows **U48–U59** (planned, 🔲) with Step 6's target scores |
| `docs/reference/feature_register.json` | F-69 placed in Slice 12.3 |

### 7.5 Still open (not code)

| Item | Who |
|---|---|
| **The Pulse question list** (~32 + University picks) for approval before Stage 1 merges | Aniket + counsel |
| Counsel: professional-rules opinion (B2), trade-mark search "DPDP Compass", s.16 / Rule 15 re-check, AI sub-processor A1 | Counsel |
| The cost model (`company_formation/08_Cost_Model.xlsx`): add the partner and Academy lines (Phase I B6) | A separate task, confidential, outside the repo |
| Merge `docs/multi-level-assessment` into `main` (documents only; CI skips heavy jobs) | After this approval |

### 7.6 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | **Option A:** Pulse as **Slice 12.3**, right after Slice 12; launch moves to **~23 Dec 2026** | **Yes** |
| Q2 | The **Slice 12.3 prompt** as written (three stages; S1 and S5 on the live Proof screens as their own batch) | **Yes**, then "SLICE_12_3 approved" when Slice 12 is merged |
| Q3 | **Wave 1 on the `consultant` role + workshop mode**; partner packages in the order of 7.3 | **Yes** |
| Q4 | **Packs I content and counsel work start 9 Nov**, in parallel with 12.3 | **Yes** |
| Q5 | **Merge** the `docs/multi-level-assessment` branch into `main` after this approval | **Yes** |

**To approve:** reply "Step 7 approved" (with your answers to Q1–Q5), or "…with changes: …". That closes
the combined programme (Phase I, II and III).

**Approved (Aniket, 29 Oct 2026):** "Step 7 approved with your recommendations (Q1–Q5). The combined programme is closed. Merge the branch." Recorded as D-144.
