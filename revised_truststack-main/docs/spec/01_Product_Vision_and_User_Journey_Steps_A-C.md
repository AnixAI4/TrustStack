# TrustStack™ DPDP Compass — Product Vision, User Journey and Functional Modules

**Coverage:** Steps A–C  
**Purpose:** Product vision, target users, business objectives, end-to-end platform workflow and module-wise functional requirements.

---

# Step A — Product Vision, Target Users and Business Objectives

## Product Name

# TrustStack™ DPDP Compass

## Full Product Positioning

**TrustStack™ DPDP Compass** is an end-to-end DPDP readiness, assessment, evidence, ROPA, remediation and assurance platform for Indian organisations.

It helps organisations move from informal DPDP awareness to structured, evidence-backed readiness.

The product should not be positioned as a form-filling tool. It should be positioned as:

> **An assessment-to-assurance platform for DPDP readiness.**

## Product Vision

> To become India’s trusted DPDP readiness and assurance platform that helps organisations understand, measure, prove and continuously improve their personal data protection maturity.

## Product Mission

TrustStack DPDP Compass should help organisations:

1. assess current DPDP readiness,
2. identify processing activities and data flows,
3. understand industry-specific DPDP risks,
4. collect evidence,
5. generate maturity scores,
6. identify gaps,
7. create remediation actions,
8. produce executive-ready reports,
9. conduct reassessments,
10. and gradually move toward continuous assurance.

## What the Product Should Be

| Product nature | Explanation |
|---|---|
| Assessment platform | It evaluates DPDP readiness across a structured framework. |
| Evidence-driven tool | Scores should depend on proof, not only claims. |
| ROPA-enabled system | Processing activities should be documented clearly. |
| Industry-aware platform | Different industries should receive relevant questions. |
| Consultant-friendly product | Anix AI / TrustStack consultants can run structured engagements. |
| API-first SaaS | Backend APIs can support multiple frontends later. |
| AI-assisted platform | AI helps guide users but does not certify compliance. |
| Reassessment-ready system | Improvement can be tracked over time. |

## What the Product Should Not Claim

| Do not claim | Safer positioning |
|---|---|
| “Automatically makes you DPDP compliant” | “Helps assess and improve DPDP readiness.” |
| “Provides final legal opinion” | “Provides assessment and operational guidance subject to legal review.” |
| “Certifies compliance” | “Generates readiness reports and evidence-backed maturity view.” |
| “Registered Consent Manager” | Only claim this if formally registered. |
| “No legal review required” | Legal review should be recommended for sensitive areas. |
| “AI decides compliance” | AI supports assessment; humans review and approve. |

---

# Target Users

## Primary Users

| User type | Need |
|---|---|
| CXO / Board / Dean / Principal / Director | Executive visibility, risk, roadmap and decisions required. |
| DPDP Programme Owner | Manage assessment, evidence, gaps, actions and reassessment. |
| Legal / Compliance | Review notice, consent, rights, grievance, retention, contracts. |
| CIO / CTO / IT Head | Systems, security, access, logs, breach readiness, cloud risk. |
| CISO / Security Team | Safeguards, breach playbook, evidence, incident response. |
| Procurement | Vendor / Data Processor register, contracts, DPDP clauses. |
| Department Owners | Provide process-specific answers and evidence. |
| Consultants | Run assessments, review evidence and prepare client reports. |
| Auditors / Reviewers | Review evidence and audit trail. |

## Priority Industries for Version 1

| Priority | Industry | Why important |
|---:|---|---|
| 1 | University / Higher Education | Complex data: students, parents, LMS, admissions, exams, vendors. |
| 2 | EdTech | Children’s data, learning analytics, apps, AI tutors, marketing. |
| 3 | BFSI | KYC, customer records, outsourcing, breach and security relevance. |
| 4 | Healthcare | Patient records, diagnostics, labs, vendors and sensitive workflows. |
| 5 | SaaS / Technology | Data Fiduciary / Processor distinction, cloud, logs, sub-processors. |
| 6 | Manufacturing | Employees, contractors, visitors, CCTV, biometric, HRMS. |
| 7 | Retail / E-commerce | Customer data, marketing, loyalty, logistics, app tracking. |
| 8 | General organisation | Generic DPDP readiness for other sectors. |

---

# Business Objectives

## Client Objectives

Clients should be able to use the platform to:

- understand their DPDP maturity,
- identify weak areas,
- collect evidence,
- map data-processing activities,
- prepare ROPA-style processing registers,
- manage DPDP gaps,
- assign owners and due dates,
- prepare reports for leadership,
- track improvement over time,
- and prepare for ongoing assurance.

## Anix AI / TrustStack Objectives

The platform should help Anix AI / TrustStack:

- productise DPDP consulting,
- reduce manual assessment effort,
- create repeatable methodology,
- generate professional reports faster,
- support multiple industries,
- create recurring reassessment revenue,
- build a future SaaS business,
- enable partner/consultant-led delivery,
- and later evolve into Sentinel-style continuous assurance.

---

# MVP Scope

## MVP Must Include

| Module | MVP need |
|---|---|
| Organisation registration | Register client organisation as tenant. |
| Industry selection | Select industry template. |
| Scope wizard | Capture departments, systems, vendors, children’s data, AI and cloud risk. |
| RBAC | Assign users and roles. |
| Dynamic question engine | Generate relevant questions. |
| Assessment workspace | Answer, save, submit and review questions. |
| Evidence repository | Upload, link and review evidence. |
| ROPA module | Create Processing Activity Register records. |
| Scoring engine | Evidence-capped 16-domain maturity score. |
| Gap register | Auto-generate gaps from weak responses. |
| Action tracker | Convert gaps into owner-wise actions. |
| Executive dashboard | Show maturity, risks and decisions. |
| Reports | PDF/DOCX/XLSX exports. |
| AI Assistant basic | Explain questions, suggest evidence, draft ROPA, explain gaps. |
| Audit logging | Track sensitive actions. |
| Reassessment basic | Compare improvement after remediation. |

## Out of MVP

| Excluded item | Reason |
|---|---|
| Full autonomous compliance agent | Too risky. |
| Statutory Consent Manager capability | Separate regulatory regime. |
| Full legal opinion automation | Needs authorised legal review. |
| Deep ERP/LMS/CRM integrations | Phase 2/3. |
| Mobile app | Not needed initially. |
| Full white-label partner portal | Later commercial phase. |
| Advanced benchmarking | Needs larger dataset. |
| SSO/SAML | Enterprise phase. |
| Automated evidence verification | Needs careful governance. |

---

# Step B — End-to-End User Journey and Platform Workflow

## Platform Workflow Summary

The platform should guide the user through a complete DPDP readiness journey:

```text
Organisation registration
    ↓
Industry and risk profiling
    ↓
Scope configuration
    ↓
Dynamic assessment generation
    ↓
User assignment and collaboration
    ↓
Assessment response
    ↓
Evidence upload and review
    ↓
ROPA / Processing Activity Register
    ↓
Scoring and maturity calculation
    ↓
Gap and risk generation
    ↓
Remediation action tracker
    ↓
Dashboard and reports
    ↓
Reassessment and continuous improvement
```

---

## Stage 1 — Landing, Login and Account Creation

Users should enter through a secure login system. The platform should support organisation-level access and multiple roles.

Key requirements:

- secure login,
- email verification,
- password reset,
- organisation switcher,
- role-based landing dashboard,
- onboarding for new organisation.

---

## Stage 2 — Organisation Registration

A consultant or organisation admin registers the organisation.

Fields:

| Field | Example |
|---|---|
| Organisation name | ABC University |
| Legal name | ABC University Trust |
| Organisation type | University / company / LLP / trust |
| Industry | University / EdTech / BFSI |
| Website | Client website |
| Headquarters | Mumbai, India |
| Employee count | 1,200 |
| Estimated Data Principals | 250,000 |
| Consultant-assisted | Yes/No |

Output:

- tenant created,
- organisation ID assigned,
- default settings created,
- organisation admin assigned.

---

## Stage 3 — Industry Classification and Risk Profiling

The platform captures primary industry and secondary risk tags.

Examples of secondary tags:

- children’s data,
- large-scale processing,
- cloud/SaaS processing,
- cross-border unknown,
- AI processing,
- vendor dependency,
- marketing tracking,
- public-facing portal,
- multi-location operations.

This allows dynamic question selection.

---

## Stage 4 — Scope Configuration Wizard

The scope wizard captures the organisation’s actual processing environment.

Key inputs:

| Area | Examples |
|---|---|
| Data Principal types | Students, customers, employees, parents, vendors. |
| Departments | HR, IT, Admissions, Exams, Procurement. |
| Systems | ERP, LMS, HRMS, CRM, website, mobile app. |
| Vendors | Cloud provider, LMS vendor, payroll vendor. |
| Children’s data | Yes / No / Unknown. |
| AI usage | Chatbot, analytics, scoring, proctoring. |
| Cloud/cross-border | India / outside India / unknown. |
| Marketing/cookies | Yes / No / unknown. |

Output:

- risk profile,
- applicable question packs,
- recommended assessment scope,
- assessment preview.

---

## Stage 5 — Dynamic Assessment Generation

The system generates an assessment using:

1. core DPDP questions,
2. industry overlay questions,
3. conditional question packs,
4. system-level questions,
5. vendor-level questions,
6. department-level questions.

Question versions are locked into the assessment snapshot.

---

## Stage 6 — User Assignment and Collaboration

Questions and actions can be assigned to different users.

Examples:

| Domain | Default owner |
|---|---|
| Governance | DPDP Owner / Executive Sponsor |
| Notice | Legal / Compliance |
| Security | IT / CISO |
| Vendor | Procurement / Legal / IT |
| ROPA | DPDP Owner + Process Owners |
| Breach | IT Security + Legal |
| Children’s data | Legal + Business/Academic Owner |

---

## Stage 7 — Assessment Response Workflow

Users answer each question with:

- applicability,
- score 0–5,
- comments,
- evidence links,
- owner notes,
- review status.

A response can move through:

```text
Draft → Submitted → Under Review → Approved / Clarification Requested / Rejected
```

---

## Stage 8 — Evidence Upload and Review

Evidence should be uploaded securely and linked to:

- assessment responses,
- ROPA records,
- gaps,
- remediation actions,
- vendors,
- reports.

Evidence levels:

| Level | Meaning |
|---|---|
| E0 | No evidence |
| E1 | Informal evidence |
| E2 | Draft evidence |
| E3 | Approved document/process |
| E4 | Implementation evidence |
| E5 | Monitored/reviewed evidence |

---

## Stage 9 — ROPA / Processing Activity Register

The ROPA module captures processing activities across departments, systems and vendors.

Typical ROPA record fields:

- processing activity name,
- department,
- process owner,
- Data Principal types,
- data categories,
- purpose,
- DPDP basis/legal review note,
- collection source,
- systems,
- vendors,
- notice/consent link,
- retention,
- safeguards,
- children/cross-border/AI flags,
- evidence,
- risk rating,
- review date.

---

## Stage 10 — Scoring and Maturity

The platform calculates:

- raw score,
- applicable score,
- evidence-adjusted score,
- evidence confidence,
- domain scores,
- red flags,
- maturity level.

Maturity levels:

| Score | Level |
|---:|---|
| 0–20 | Level 0 — Not Started |
| 21–40 | Level 1 — Aware |
| 41–60 | Level 2 — Defined |
| 61–75 | Level 3 — Implementing |
| 76–90 | Level 4 — Operational |
| 91–100 | Level 5 — Continuous Assurance |

---

## Stage 11 — Gaps and Remediation Actions

Low scores, weak evidence and red flags generate gaps and remediation actions.

Each gap should have:

- domain,
- risk level,
- root cause,
- recommended fix,
- owner,
- due date,
- evidence required,
- status.

Each action should move through:

```text
Open → Assigned → In Progress → Evidence Submitted → Under Review → Closed
```

---

## Stage 12 — Dashboard and Reports

Key outputs:

- executive dashboard,
- 16-domain scorecard,
- evidence dashboard,
- ROPA dashboard,
- risk heatmap,
- gap/action tracker,
- vendor dashboard,
- breach dashboard,
- AI-risk dashboard,
- reassessment dashboard,
- PDF/DOCX/XLSX reports.

---

## Stage 13 — Reassessment

Reassessment compares baseline and current maturity.

It should focus on:

- open gaps,
- closed actions,
- outdated evidence,
- new systems,
- new vendors,
- new AI use cases,
- changed processing activities.

---

# Step C — Module-wise Functional Requirements

## Final Module List

| No. | Module | Purpose |
|---:|---|---|
| 1 | Authentication, Tenant and User Management | Secure login, organisation context and users. |
| 2 | Organisation Registration and Profile | Register organisations and industry. |
| 3 | Industry Classification and Scope Wizard | Capture scope and risk triggers. |
| 4 | Question Bank and DPDP Control Library | Manage questions, controls and legal/control guidance. |
| 5 | Dynamic Assessment Engine | Generate applicable assessments. |
| 6 | Response and Collaboration Workspace | Capture responses, assignments and reviews. |
| 7 | Evidence Repository | Upload, link and review evidence. |
| 8 | ROPA / Processing Activity Register | Document processing activities. |
| 9 | Scoring and Maturity Engine | Calculate maturity scores and evidence confidence. |
| 10 | Gap and Risk Register | Generate and manage gaps. |
| 11 | Remediation Action Tracker | Convert gaps into owner-wise tasks. |
| 12 | AI Assistant and Knowledge Layer | Explain, guide, draft and recommend safely. |
| 13 | Dashboard and Analytics | Executive and operational visibility. |
| 14 | Report and Export Engine | Generate PDF/DOCX/XLSX outputs. |
| 15 | Reassessment and Continuous Improvement | Track improvement. |
| 16 | Admin, Audit, Security and Integration APIs | Platform governance, audit, APIs. |

---

## Module 1 — Authentication, Tenant and User Management

Key requirements:

- secure login,
- organisation membership,
- active organisation selection,
- RBAC,
- invite users,
- deactivate users,
- audit user access.

Roles:

- Super Admin,
- Anix AI Consultant,
- Organisation Admin,
- Executive Sponsor,
- DPDP Programme Owner,
- Department Owner,
- Legal User,
- IT/Security User,
- Procurement User,
- Auditor/Reviewer.

---

## Module 2 — Organisation Registration and Profile

Requirements:

- register organisation,
- capture legal name and industry,
- capture data principal count,
- capture systems and departments,
- capture vendors and processing environment,
- support consultant-assisted engagements.

---

## Module 3 — Industry Classification and Scope Wizard

Requirements:

- select primary industry,
- select secondary risk tags,
- identify Data Principal types,
- identify systems,
- identify departments,
- identify vendors,
- capture children’s data,
- capture AI usage,
- capture cloud/cross-border risk,
- generate assessment preview.

---

## Module 4 — Question Bank and DPDP Control Library

Requirements:

- manage 16-domain question bank,
- create question versions,
- map questions to controls,
- map controls to DPDP obligations and operational guidance,
- define scoring hints,
- define evidence guidance,
- define remediation mapping,
- support industry overlays.

---

## Module 5 — Dynamic Assessment Engine

Requirements:

- generate assessment from core + industry + conditional questions,
- snapshot question versions,
- support reassessment question generation,
- generate system/vendor/department-level questions,
- support preview before launch,
- prevent old assessments from changing when templates change.

---

## Module 6 — Response and Collaboration Workspace

Requirements:

- answer questions,
- save drafts,
- submit responses,
- review responses,
- assign questions,
- comment,
- track history,
- mark applicability,
- require N/A reason.

---

## Module 7 — Evidence Repository

Requirements:

- signed upload URLs,
- secure object storage,
- evidence metadata,
- evidence links,
- evidence review,
- evidence status,
- evidence level E0–E5,
- signed download URLs,
- audit logs.

---

## Module 8 — ROPA / Processing Activity Register

Requirements:

- create/edit/archive ROPA records,
- link departments, systems and vendors,
- identify Data Principal types and data categories,
- link notices, consent, retention and safeguards,
- calculate completeness score,
- calculate risk rating,
- import/export Excel,
- AI-assisted draft,
- reviewer workflow.

---

## Module 9 — Scoring and Maturity Engine

Requirements:

- 16-domain 100-point scoring,
- 0–5 maturity scale,
- E0–E5 evidence scale,
- evidence caps,
- red flags,
- score caps,
- score snapshots,
- maturity level mapping,
- evidence confidence calculation.

---

## Module 10 — Gap and Risk Register

Requirements:

- generate gaps from weak responses,
- generate red flags,
- define risk levels,
- assign priority,
- map root cause,
- link evidence and actions,
- support gap closure/reopening.

---

## Module 11 — Remediation Action Tracker

Requirements:

- create action from gap,
- assign owner and due date,
- evidence required,
- action comments,
- review closure,
- overdue tracking,
- owner-wise dashboards.

---

## Module 12 — AI Assistant and Knowledge Layer

Requirements:

- backend-only AI Gateway,
- provider-agnostic model support,
- RAG over approved knowledge,
- tenant-scoped context,
- question explanation,
- evidence suggestion,
- ROPA draft,
- gap/action explanation,
- report summary draft,
- no legal certification,
- no score override,
- no evidence approval.

---

## Module 13 — Dashboard and Analytics

Requirements:

- executive dashboard,
- domain scorecard,
- evidence dashboard,
- ROPA dashboard,
- gap/action dashboard,
- vendor dashboard,
- breach dashboard,
- AI-risk dashboard,
- reassessment dashboard.

---

## Module 14 — Report and Export Engine

Requirements:

- executive PDF/DOCX report,
- detailed PDF/DOCX report,
- gap/action Excel,
- ROPA Excel/CSV,
- evidence index Excel,
- reassessment report,
- signed download links,
- versioning,
- legal caveat.

---

## Module 15 — Reassessment and Continuous Improvement

Requirements:

- clone baseline,
- focus on gaps/actions/outdated evidence,
- compare score movement,
- explain improvement,
- update roadmap.

---

## Module 16 — Admin, Audit, Security and Integration APIs

Requirements:

- admin question management,
- template governance,
- domain weights,
- control library,
- audit logs,
- API keys later,
- webhooks later,
- platform configuration.

---

# Step C Final Summary

The platform should be built as a modular, API-first, multi-tenant SaaS application with 16 core modules. The MVP must focus on the full journey from organisation registration to assessment, evidence, ROPA, scoring, gaps, dashboards, reports and AI guidance.

