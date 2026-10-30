# University overlay vs core pack — overlap map and recommendation

**Purpose:** settle D-014's open question and execute D-029.1. The University file
holds **107** questions (`UNI-*`); the core pack holds **98** (`CORE_DPDP_V1`, from
the Excel `Question_Bank`). Loading both would give ~205 questions against the
**108** quoted in the PRD, the pitch deck and the ₹9.75–12L proposal.

**D-029.1 (Aniket, 2026-09-15):** the baseline stays **108 = 98 core + 10 University
overlay**. The other 97 University questions stay in the bank as an industry /
reference pool — conditional, assessor-visible or backlog — never stacked onto the
baseline.

This file classifies every one of the 107, reconciles the Excel `MU_Overlay`
U1–U10, and proposes the 10. **Prepared 2026-09-18. The 10 need Aniket's
confirmation before the University overlay is seeded** (SLICE_03 §0.5.1).

---

## 1. Method

Each `UNI-*` question was compared against all 98 core questions and placed in one
of five buckets:

| Bucket | Meaning | Seeding consequence |
|---|---|---|
| **exact overlap** | Core already asks this; the University wording adds no new control | Not seeded as an overlay question. Stays in the bank as reference |
| **partial overlap** | Core asks the generic version; University adds context, scope or a process list | Kept as an overlay **variant** in the reference pool. Core question scores |
| **unique** | No core equivalent — a real control gap | Overlay candidate |
| **conditional** | No core equivalent **and** only applies on a trigger | Overlay candidate; carries a `trigger_condition` |
| **future/advanced** | Beyond V1 readiness (design preference, maturity) | Backlog |

Comparison is by **control**, not wording: `UNI-ROPA-002` is exact overlap because
core `ROPA1.2`–`ROPA1.6` together ask for the same seven ROPA fields.

## 2. Totals

| Bucket | Count |
|---|---:|
| exact overlap | 28 |
| partial overlap | 38 |
| unique | 16 |
| conditional | 25 |
| future/advanced | 1 |
| **Total** | **108** |

**66 of 108 (61%) are already covered by core** — which is the evidence for
D-029.1: stacking the packs would have duplicated most of the assessment.

The file held 107 questions when this map was written; `UNI-GOV-009` was
authored on 2026-09-18 to carry Excel `MU_Overlay` U3 (§7), taking it to 108.
A question is `conditional` rather than `unique` when the authored `Trigger`
cell names a condition, whatever its relationship to core — so `UNI-INV-004`,
`UNI-VEN-007` and `UNI-AI-004` sit there despite having no core equivalent.

## 3. Classification — all 108

Columns: `UNI` code · primary domain · authored priority · bucket · closest core
question · one-line reason.

### 3.1 `GOV` — Governance, accountability and DPDP ownership

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-GOV-001 | P0 | exact | `G1.2` | Both ask for a formally nominated DPDP owner |
| UNI-GOV-002 | P1 | partial | `G1.3` | Core asks for the steering committee; UNI names admissions/exams/affiliated-college seats |
| UNI-GOV-003 | P1 | partial | `G1.4` | Core asks for accountable process owners; UNI names the nine university departments |
| UNI-GOV-004 | P1 | **unique** | — | Implementation roadmap with milestones and review cadence. `G1.7` covers budget only |
| UNI-GOV-005 | P1 | partial | `G1.6` | `G1.6` already names affiliated colleges; UNI asks whether they are in assessment scope |
| UNI-GOV-006 | P1 | **unique** | — | Approval authority for notices, consent text, retention schedules, vendor clauses, breach comms |
| UNI-GOV-007 | P2 | **unique** | — | Role-based DPDP training. **Core has no training question at all** |
| UNI-GOV-008 | P1 | exact | `G1.5` | Both ask for DPDP risk reporting to leadership |
| UNI-GOV-009 | P1 | conditional | — | **Authored 2026-09-18** for Excel `MU_Overlay` U3: standard DPDP templates (notices, consent text, grievance routes, data-sharing terms, evidence formats) available to affiliated colleges. Trigger: multi-campus/affiliated structure |

### 3.2 `INV` — Personal data discovery and inventory

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-INV-001 | P0 | partial | `DI1.1`, `DI1.3` | Core maps all collection points; UNI enumerates the university lifecycle |
| UNI-INV-002 | P1 | partial | `DI1.2` | `DI1.2` maps by Data Principal type and names applicant and student |
| UNI-INV-003 | P1 | partial | `DI1.2` | `DI1.2` names parent; UNI asks for separate guardian field mapping |
| UNI-INV-004 | P1 | conditional | — | Scholarship, caste/category, disability, income and reservation documents as a high-risk class. No core equivalent; India-specific. Trigger: scholarship/reservation data |
| UNI-INV-005 | P0 | **unique** | — | Examination and result data stores, answer-sheet and revaluation records inventoried |
| UNI-INV-006 | P1 | exact | `DI1.3` | `DI1.3` names HRMS; core covers employee data in the inventory |
| UNI-INV-007 | P1 | partial | `DI1.3`, `DI1.7` | Core names emails and spreadsheets; UNI adds shared drives and WhatsApp groups |

### 3.3 `ROPA` — Processing Activity Register

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-ROPA-001 | P0 | partial | `ROPA1.1` | Same control; UNI lists the eight university processes |
| UNI-ROPA-002 | P1 | exact | `ROPA1.2`–`ROPA1.6` | The same seven ROPA fields, asked as one question |
| UNI-ROPA-003 | P1 | conditional | — | LMS processing activities (logins, activity, analytics, integrations). Trigger: LMS |
| UNI-ROPA-004 | P1 | **unique** | — | Exam processing documented registration → results → revaluation → transcript → award publication |
| UNI-ROPA-005 | P1 | conditional | — | NAD/DigiLocker award publication workflow. Trigger: NAD/DigiLocker |
| UNI-ROPA-006 | P1 | conditional | — | Placement and recruiter CV-sharing workflows. Trigger: placements |
| UNI-ROPA-007 | P2 | conditional | — | Research participant data processing. Trigger: research participants |
| UNI-ROPA-008 | P1 | exact | `ROPA1.7` | Both trigger a ROPA review on a new system, vendor or AI tool |

### 3.4 `PURPOSE` — Purpose, lawful basis and minimisation

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-PUR-001 | P1 | partial | `P1.1` | Core asks purpose per data category; UNI scopes it to admission fields |
| UNI-PUR-002 | P1 | exact | `P1.4` | Both separate mandatory from optional fields |
| UNI-PUR-003 | P1 | partial | `P1.1` | Guardian-data purpose is an instance of the core control |
| UNI-PUR-004 | P1 | partial | `P1.5` | Core forbids use beyond the communicated purpose; UNI names exam function creep |
| UNI-PUR-005 | P1 | conditional | — | LMS analytics influencing academic intervention or profiling. Trigger: LMS analytics |
| UNI-PUR-006 | P2 | conditional | — | Alumni purposes split from fundraising and marketing. Trigger: alumni |
| UNI-PUR-007 | P1 | conditional | — | Scholarship/category/disability/income documents used only for defined purposes. Trigger: scholarship data |
| UNI-PUR-008 | P1 | conditional | — | AI tools barred from unrelated model training on student data. Trigger: AI tools |

### 3.5 `NOTICE` — Notice management

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-NOT-001 | P0 | partial | `N1.1` | Core requires notice at or before collection; UNI names the admission portal |
| UNI-NOT-002 | P1 | partial | `N1.1` | Multi-point notice coverage (ERP, LMS, hostel, library, placement, alumni, grievance) |
| UNI-NOT-003 | P1 | exact | `N1.2`, `N1.3` | Categories plus purpose in plain language |
| UNI-NOT-004 | P1 | exact | `N1.6` | Notice version control |
| UNI-NOT-005 | P2 | exact | `N1.5` | Notices in English and Indian languages |
| UNI-NOT-006 | P2 | conditional | — | Event, seminar, hackathon and FDP forms linked to notices. Trigger: events collect data |
| UNI-NOT-007 | P1 | conditional | — | Separate notice where AI proctoring, CCTV or biometrics are used. Trigger: proctoring/CCTV/biometric |

### 3.6 `CONSENT` — Consent and withdrawal

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-CON-001 | P1 | partial | `P1.2`, `C1.2` | Core maps each activity to a basis; UNI lists the university consent surfaces |
| UNI-CON-002 | P1 | exact | `C1.1`, `C1.3` | Clear affirmative action, no pre-ticked or bundled consent |
| UNI-CON-003 | P1 | exact | `C1.5` | Withdrawal where processing is consent-based |
| UNI-CON-004 | P1 | exact | `C1.4` | Consent records with ID, purpose, notice version and timestamp |
| UNI-CON-005 | P2 | conditional | — | Separate consent for placement CVs, alumni outreach and event photos/videos. Trigger: placements/alumni/events |
| UNI-CON-006 | P2 | conditional | — | Research consent reviewed separately. Trigger: research |
| UNI-CON-007 | P0 | exact | `CH1.3` | Guardian consent — core asks it in the `CHILD` domain |

### 3.7 `RIGHTS` — Data Principal rights

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-RGT-001 | P1 | partial | `R1.1` | Core defines the access route; UNI enumerates the six requester groups |
| UNI-RGT-002 | P1 | **unique** | — | Workflow to find the requester's data across ERP, LMS, exam, HRMS, hostel, placement and alumni. Core never asks how the data is located |
| UNI-RGT-003 | P1 | **unique** | — | Academic-record corrections separated from profile corrections and routed to the exam authority |
| UNI-RGT-004 | P1 | partial | `R1.3` | `R1.3` already requires legal-retention checks on erasure |
| UNI-RGT-005 | P1 | exact | `R1.5`, `R1.6` | Rights requests logged with identity check, decision and closure |

### 3.8 `GRIEVANCE` — Grievance redressal and contact publication

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-GRV-001 | P1 | exact | `GR1.1`, `GR1.3` | Contact published and visible on website, app and portal |
| UNI-GRV-002 | P1 | **unique** | — | Privacy grievances integrated with the university's statutory student grievance machinery without conflating the two |
| UNI-GRV-003 | P2 | partial | — | Same control as `UNI-GRV-002`; merge the two (categorisation is how integration is evidenced) |
| UNI-GRV-004 | P1 | exact | `GR1.4`, `GR1.5` | Timelines, escalation and closure tracking |
| UNI-GRV-005 | P1 | **unique** | — | Grievance records themselves protected — they hold complaint and identity detail |

### 3.9 `RETENTION` — Retention, erasure and archival

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-RET-001 | P1 | **unique** | — | Retention for applicant records and **rejected applications** — a university over-retention risk core never names |
| UNI-RET-002 | P1 | **unique** | — | Academic records, marksheets, transcripts and degrees: documented retention and archival. The permanent-record vs erasure tension |
| UNI-RET-003 | P1 | conditional | — | LMS logs, class recordings and proctoring recordings retention. Trigger: LMS/proctoring |
| UNI-RET-004 | P2 | conditional | — | Hostel, transport, medical, counselling and welfare records. Trigger: hostel/welfare services |
| UNI-RET-005 | P2 | conditional | — | Placement CVs and recruiter feedback. Trigger: placements |
| UNI-RET-006 | P2 | partial | `RE1.6` | Core reviews old and inactive records periodically |
| UNI-RET-007 | P1 | **unique** | — | Backup and archive copies covered when erasure or expiry runs. Not in core |

### 3.10 `ACCURACY` — Accuracy and data quality

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-ACC-001 | P0 | **unique** | — | Marks, credits, grades and award records verified accurate **before publication or sharing**. Core `A1.1`–`A1.3` are generic quality controls |
| UNI-ACC-002 | P1 | **unique** | — | Academic-record corrections logged with maker-checker approval |
| UNI-ACC-003 | P2 | exact | `A1.4` | Corrections propagated to downstream systems |
| UNI-ACC-004 | P1 | conditional | — | NAD/DigiLocker awards validated by authorised staff before upload. Trigger: NAD/DigiLocker |
| UNI-ACC-005 | P2 | partial | `A1.5`, `RE1.6` | Duplicate and stale record review |

### 3.11 `SECURITY` — Security safeguards

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-SEC-001 | P0 | partial | `S1.2` | Core requires RBAC; UNI names the six university systems |
| UNI-SEC-002 | P0 | **unique** | — | Exam and result systems: maker-checker, restricted access and audit logs. The university's defining security control; §12 red flag |
| UNI-SEC-003 | P1 | partial | `S1.4` | Core monitors and reviews access logs |
| UNI-SEC-004 | P1 | partial | `S1.3` | `S1.3` already logs downloading and exporting |
| UNI-SEC-005 | P1 | **unique** | — | Shared-drive and cloud folders holding student data under access control and periodic review. §12 red flag |
| UNI-SEC-006 | P1 | exact | `S1.1`, `S1.5` | Backups encrypted and protected |
| UNI-SEC-007 | P1 | conditional | — | CCTV, biometric and access-control systems secured with retention and vendor controls. Trigger: CCTV/biometric |
| UNI-SEC-008 | P2 | partial | — | Email/WhatsApp/shared-link restraint — same control as `UNI-SEC-005` plus `UNI-INV-007` |
| UNI-SEC-009 | P1 | exact | `S1.6` | Privileged access reviewed and revoked on role change |

### 3.12 `BREACH` — Personal data breach readiness

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-BR-001 | P0 | partial | `B1.1` | Core requires the playbook; UNI names university incident types |
| UNI-BR-002 | P0 | partial | `B1.3`, `B1.5` | Core assigns Board-intimation and 72-hour reporting owners |
| UNI-BR-003 | P1 | partial | `B1.6` | Core requires a drill; UNI supplies the university scenario list |
| UNI-BR-004 | P1 | exact | `V1.4` | Vendor breach-notification obligation |
| UNI-BR-005 | P1 | partial | `RE1.5` | Core retains logs for breach investigation |

### 3.13 `VENDOR` — Vendor / Data Processor governance

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-VEN-001 | P0 | exact | `V1.1` | Processor register |
| UNI-VEN-002 | P1 | partial | `V1.1` | Same register; UNI supplies the university vendor taxonomy |
| UNI-VEN-003 | P1 | exact | `V1.2`–`V1.4` | Contract obligations: purpose, security, breach, retention, deletion |
| UNI-VEN-004 | P1 | exact | `V1.5` | Sub-processors, cloud locations and cross-border reviewed |
| UNI-VEN-005 | P1 | partial | `S1.6`, `V1.3` | Vendor access minimised and revoked |
| UNI-VEN-006 | P2 | partial | `V1.1` | Payment, SMS/email/WhatsApp and event platforms are processors under `V1.1` |
| UNI-VEN-007 | P1 | conditional | — | Affiliated colleges, franchise centres and partners classified as independent fiduciary, joint participant or processor. `G1.6` assigns responsibility but never classifies the relationship. Trigger: affiliated/partner model |

### 3.14 `CHILD` — Children's data and guardian consent

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-CHILD-001 | P0 | partial | `CH1.1`, `CH1.2` | Core asks whether under-18s are processed and how age is established |
| UNI-CHILD-002 | P0 | exact | `CH1.3` | Verifiable guardian consent |
| UNI-CHILD-003 | P1 | conditional | — | LMS, hostel, transport, counselling and welfare services reviewed for minor data. Trigger: minors |
| UNI-CHILD-004 | P0 | partial | `CH1.4` | Core bars tracking and behavioural monitoring of children. **See §6: `CH1.4` still needs the Fourth Schedule Part A(3) carve-out** |
| UNI-CHILD-005 | P2 | partial | `P1.5`, `UNI-PUR-003` | Guardian contact used only for defined purposes |
| UNI-CHILD-006 | P1 | exact | `CH1.5` | Vendors processing children's data under enhanced review |

### 3.15 `CROSSBORDER` — Cross-border transfer and cloud/SaaS risk

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-CB-001 | P1 | partial | `CB1.1` | Core asks whether data sits outside India |
| UNI-CB-002 | P1 | partial | `CB1.2` | Core identifies foreign SaaS, cloud, analytics, LMS and AI vendors by name |
| UNI-CB-003 | P1 | exact | `CB1.3` | Contract terms for location, foreign access and sub-processors |
| UNI-CB-004 | P2 | future | — | Hosting-region *preference* for high-risk processes — a design maturity question, not a V1 readiness check |
| UNI-CB-005 | P1 | conditional | — | Student data exported to foreign universities, exchange partners and accreditation bodies. Trigger: international collaborations |

### 3.16 `SDF_AI` — SDF, DPIA, audit and AI/algorithmic risk

| UNI | Pri | Bucket | Closest core | Reason |
|---|---|---|---|---|
| UNI-AI-001 | P1 | partial | `SDF1.5` | Core reviews AI systems for privacy risk; UNI asks for the inventory behind it |
| UNI-AI-002 | P1 | conditional | — | Admissions/support chatbots reviewed for capture and retention. Trigger: chatbot |
| UNI-AI-003 | P0 | conditional | — | AI proctoring reviewed for proportionality, notice, access, retention, bias and vendor controls. §12 red flag; `UNIVERSITY_AI_PROCTORING_V1` already selected by `selectQuestionPacks()`. Trigger: proctoring |
| UNI-AI-004 | P1 | conditional | — | Rules for faculty and staff using GenAI on student submissions, exam scripts, theses and research data. Trigger: GenAI use possible |
| UNI-AI-005 | P1 | partial | `SDF1.6` | Core reviews high-impact automated decisions for fairness and explainability |
| UNI-AI-006 | P1 | partial | `SDF1.3` | Core requires DPIA readiness for high-risk processing |
| UNI-AI-007 | P2 | exact | `SDF1.4`, `V1.6` | Periodic audit of controls, systems and vendors |
| UNI-AI-008 | P2 | exact | `SDF1.1` | SDF readiness assessed for the future. Note D-028: the platform never *infers* SDF status |

---

## 4. Recommendation — the 10 University overlay questions

Selected from the `unique` and `conditional` buckets, one per domain, weighted
towards P0/P1 and towards the red flags the University file's §12 already names.
Five are `unique` (always asked); five are `conditional` and carry a trigger —
of those, four have a trigger the Slice 2 scope can decide and `UNI-INV-004`
(scholarship/reservation data) does not, so it shows as Potentially Applicable.

| # | Code | Domain | Pri | Bucket | Why it earns a baseline slot | Excel `MU_Overlay` |
|---|---|---|---|---|---|---|
| 1 | `UNI-SEC-002` | `SECURITY` | P0 | unique | Exam/result maker-checker, restricted access and audit logs. §12 red flag; nothing in core reaches exam systems | **U4** |
| 2 | `UNI-ACC-001` | `ACCURACY` | P0 | unique | Marks, credits, grades and awards verified before publication. A wrong published award is the university's highest-impact accuracy failure | — |
| 3 | `UNI-AI-003` | `SDF_AI` | P0 | conditional | AI proctoring proportionality, notice, retention, bias and vendor review. §12 red flag; trigger already wired in Slice 2 | — |
| 4 | `UNI-VEN-007` | `VENDOR` | P1 | conditional | Affiliated colleges and partners classified as independent / joint / processor. The University's hardest governance call | **U2** |
| 5 | `UNI-RET-002` | `RETENTION` | P1 | unique | Academic records, marksheets, transcripts and degrees — documented retention and archival against a statutory permanent-record duty | — |
| 6 | `UNI-RGT-003` | `RIGHTS` | P1 | unique | Academic-record corrections routed to the exam authority, not the profile-edit queue | **U7** |
| 7 | `UNI-INV-004` | `INV` | P1 | conditional | Scholarship, caste/category, disability, income and reservation documents as a high-risk class. India-specific and absent from core | **U5** |
| 8 | `UNI-ROPA-004` | `ROPA` | P1 | unique | Exam processing documented end to end: registration → results → revaluation → transcript → award publication | **U1** (part) |
| 9 | `UNI-CHILD-003` | `CHILD` | P1 | conditional | Minors across LMS, hostel, transport, counselling and welfare — the services where a university actually touches under-18s. Trigger: minors | — |
| 10 | `UNI-NOT-007` | `NOTICE` | P1 | conditional | Separate notice where AI proctoring, CCTV or biometrics are used. Trigger: proctoring/CCTV/biometric | **U6** (part) |

**Ten distinct domains**, so the overlay lifts one domain each rather than
concentrating on exams. Under D-014 all ten score into the existing 16 domains;
domain weights stay at 100.

### 4.1 Alternates, if a swap is wanted

| Code | Domain | Pri | Trade-off |
|---|---|---|---|
| `UNI-RGT-002` | `RIGHTS` | P1 | "Which systems hold this requester's data" — the real DSR bottleneck. Swap for #6 if operational readiness matters more than correction governance |
| `UNI-SEC-005` | `SECURITY` | P1 | Shared-drive student data. §12 red flag; pairs with `UNI-INV-007`. Swap for #1 only if exam controls are covered elsewhere |
| `UNI-AI-004` | `SDF_AI` | P1 | GenAI rules for faculty. Current and fast-moving; swap for #3 if proctoring is rare in the pilot base. **Now in the conditional pool**, so it is shown as Potentially Applicable rather than left unasked |
| `UNI-CON-005` | `CONSENT` | P2 | Media/CV/alumni consent flows — reconciles Excel **U10**. Swap for #10 if event publicity is the bigger live risk |

## 5. Excel `MU_Overlay` U1–U10 — reconciliation

| U | Excel question | Resolved to | Status |
|---|---|---|---|
| U1 | Admissions, exam, ERP, LMS, HRMS, payment, grievance mapped as separate DPDP processes | `UNI-ROPA-001` (partial of core `ROPA1.1`) + **`UNI-ROPA-004`** (#8) | Covered |
| U2 | Affiliated colleges classified per data flow | **`UNI-VEN-007`** (#4) | Covered |
| U3 | Standard DPDP templates available for affiliated colleges | **`UNI-GOV-009`** — authored 2026-09-18 | Resolved: option 1 of §7, in the conditional pool |
| U4 | Examination data access rights restricted and logged | **`UNI-SEC-002`** (#1) | Covered |
| U5 | Scholarship, category, concession and identity documents under stronger access controls | **`UNI-INV-004`** (#7) + core `S1.2` + `UNI-PUR-007` (conditional) | Covered; the access-control half rests on core `S1.2` |
| U6 | Students and parents clearly informed during admissions and the student lifecycle | `UNI-NOT-001`, `UNI-NOT-002` (partials of core `N1.1`) + **`UNI-NOT-007`** (#10) | Covered by core plus the surveillance-notice slot |
| U7 | Standard process for student correction requests across university and affiliated colleges | **`UNI-RGT-003`** (#6) + `UNI-ACC-002` (reference) | Covered |
| U8 | Research projects involving personal data assessed separately | `UNI-ROPA-007`, `UNI-CON-006` (conditional pool) | Covered conditionally — fires on the `research_participant` Data Principal type |
| U9 | Events, webinars and competitions collecting only necessary data | `UNI-NOT-006`, `UNI-PUR-002` | Covered conditionally |
| U10 | Photos, videos and testimonials governed by consent and purpose clarity | `UNI-CON-005` (conditional pool; alternate in §4.1) | Covered conditionally |

All ten now reconcile into the University pack. U3 was the one genuinely new
question the Excel overlay held; Aniket chose §7 option 1 on 2026-09-18, so it
was authored into the Markdown as `UNI-GOV-009` (D-013: the Markdown is the
source of truth) and the baseline stays at 108.

## 6. Findings that belong to the **core** pack, not this overlay

Five University questions are `unique` against core but are **not
university-specific** — they are gaps in `CORE_DPDP_V1` that every industry
would want. Seeding them as University overlay questions would hide a core defect
behind an industry pack, so they are recommended for a future `CORE_DPDP_V2`
instead of an overlay slot:

| University question | Core gap it exposes |
|---|---|
| `UNI-GOV-007` | **No core question on DPDP training or awareness at all** |
| `UNI-GOV-006` | No approval authority for notices, consent text, retention schedules, vendor clauses, breach comms |
| `UNI-GOV-004` | No DPDP implementation roadmap (`G1.7` covers budget only) |
| `UNI-RET-007` | Erasure and retention expiry never reach backups and archives |
| `UNI-GRV-005` | Grievance records are not themselves protected as sensitive |

This adds to the four core gaps against the Rules text already logged in
`docs/QUESTION_FORMAT.md` (8(3)/6(e) one-year log floor · 14(3) 90-day grievance
SLA · s.9 contact in every rights response · 3(c) Board complaint route) and the
**Fourth Schedule Part A(3)** carve-out that `CH1.4` should encode — which
`UNI-CHILD-004` runs straight into. Nine core content items, none blocking the MU
pilot, all needed before general availability.

## 7. Excel `MU_Overlay` U3 — resolved

**"Are standard DPDP templates available for affiliated colleges?"** had no
equivalent among the 107. Options put to Aniket on 2026-09-18:

1. **Author it as `UNI-GOV-009`**, conditional on an affiliated structure — the
   baseline stays at 108. ✅ **Chosen.**
2. Give it a baseline slot, swapping out #10 `UNI-NOT-007`.
3. Drop it — treat template provision as a delivery artefact of the Anix AI
   engagement rather than an assessment question.

It is authored in `01_University_Higher_Education_DPDP_Questions.md` §8.1 and
assigned to `UNIVERSITY_CONDITIONAL_V1`. Its trigger, multi-campus/affiliated
structure, maps to the wizard's `multiLocation` answer, so it fires for Mumbai
University.

## 8. Where all 108 end up

| Pack | Count | What happens |
|---|---:|---|
| `UNIVERSITY_HIGHER_ED_V1` — tier `overlay`, the confirmed **10** (5 `unique` + 5 `conditional`) | **10** | Selected for every University assessment; the 5 conditional ones are included on their trigger, or shown as Potentially Applicable when it cannot be decided |
| `UNIVERSITY_AI_PROCTORING_V1` — tier `conditional` | 1 | `UNI-RET-003` (LMS, class-recording and proctoring retention). Selected only when the scope reports proctoring |
| `UNIVERSITY_CONDITIONAL_V1` — tier `conditional` | 19 | Selected for every University assessment; each question's own trigger decides. For Mumbai University 15 are included and 4 are excluded |
| `UNIVERSITY_REFERENCE_V1` — tier `reference` | 78 | The 28 exact overlaps, the 38 partial-overlap variants, the 11 unique-but-unselected (5 of them core gaps, §6) and `UNI-CB-004`. In the bank and browsable, never generated |
| **Total** | **108** | |

Nothing is deleted. All 108 stay parsed from the authored Markdown (D-013) and
loaded into `question_versions`; the pack tier and each question's
`included_reason` decide what reaches an assessment.

**Mumbai University's baseline, generated:** 124 questions — 98 core (70
mandatory, 6 on the vendors trigger, 22 Potentially Applicable), the 10
confirmed overlay questions, 15 of the 19 conditional-pool questions, and
`UNI-RET-003` from the proctoring pack. All 16 domains are covered and the
weights still total 100.
