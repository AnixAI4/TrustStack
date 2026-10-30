# TrustStack™ DPDP Compass — Assessment Logic, Industry Templates and ROPA Module

**Coverage:** Steps G–I  
**Purpose:** Assessment, scoring, evidence, gap logic, dynamic industry question engine and ROPA / Processing Activity Register module.

---

# Step G — Assessment, Scoring, Evidence and Gap Logic

## Core Principle

The platform should not only ask questions. It should decide:

- which questions apply,
- how responses are scored,
- how evidence affects scores,
- which gaps are created,
- which risks are critical,
- which actions should be recommended,
- how maturity improves during reassessment,
- and how AI can support without overriding business rules.

Core principle:

> The score should not depend only on what the organisation claims. It should depend on applicability, maturity, evidence, risk and review.

---

## Assessment Flow

```text
Organisation profile
    ↓
Industry selection
    ↓
Risk profile and scope wizard
    ↓
Core DPDP questions loaded
    ↓
Industry overlay questions loaded
    ↓
Conditional questions triggered
    ↓
Responses captured
    ↓
Evidence reviewed
    ↓
Adjusted score calculated
    ↓
Gaps and red flags generated
    ↓
Actions created
    ↓
Dashboard and report generated
    ↓
Reassessment performed
```

---

## 16-Domain Scoring Model

| No. | Domain | Code | Weight |
|---:|---|---|---:|
| 1 | Governance, accountability and DPDP ownership | GOV | 7 |
| 2 | Personal data discovery and inventory | INV | 8 |
| 3 | Records of Processing Activities / ROPA | ROPA | 6 |
| 4 | Purpose, lawful basis and data minimisation | PURPOSE | 7 |
| 5 | Notice management | NOTICE | 7 |
| 6 | Consent and consent withdrawal | CONSENT | 7 |
| 7 | Data Principal rights | RIGHTS | 7 |
| 8 | Grievance redressal and contact publication | GRIEVANCE | 5 |
| 9 | Retention, erasure and archival | RETENTION | 6 |
| 10 | Data accuracy and quality | ACCURACY | 4 |
| 11 | Security safeguards | SECURITY | 10 |
| 12 | Personal data breach readiness | BREACH | 8 |
| 13 | Vendor / Data Processor governance | VENDOR | 7 |
| 14 | Children’s data and guardian consent | CHILD | 4 |
| 15 | Cross-border transfer and cloud/SaaS risk | CROSSBORDER | 3 |
| 16 | SDF, DPIA, audit and AI/algorithmic risk readiness | SDF_AI | 4 |
|  | **Total** |  | **100** |

This should be stored in the database and versioned.

---

## Question Selection Logic

Questions should come from four major sources:

| Question type | Applies when | Example |
|---|---|---|
| Core DPDP questions | Every organisation | Governance, inventory, notice, security, breach. |
| Industry overlay questions | Based on industry | University admissions, BFSI KYC, healthcare patient records. |
| Conditional questions | Based on risk triggers | Children’s data, AI use, cloud, vendors. |
| Reassessment questions | Based on earlier gaps | Open gaps, outdated evidence, changed scope. |

Algorithm:

```text
Start with core question bank
    ↓
Add industry template questions
    ↓
Read scope wizard triggers
    ↓
Add conditional packs
    ↓
Generate system/vendor/department questions
    ↓
Deduplicate
    ↓
Create assessment question snapshot
    ↓
Lock question versions
```

---

## Applicability Logic

| Status | Meaning | Scoring treatment |
|---|---|---|
| Applicable | Question applies | Included in score. |
| Not Applicable | Does not apply with valid reason | Excluded after review. |
| Conditional | Depends on trigger | Included when condition true. |
| Unknown | Organisation cannot confirm | Treated as applicable risk until clarified. |

N/A for high-risk questions should require reviewer approval.

---

## Maturity Scoring

| Score | Meaning | Practical interpretation |
|---:|---|---|
| 0 | Not started | No awareness, process, owner or evidence. |
| 1 | Aware | Informal awareness, no structured process. |
| 2 | Draft / partial | Draft policy, partial process or inconsistent practice. |
| 3 | Defined | Approved policy/process exists. |
| 4 | Implemented | Process/control implemented with evidence. |
| 5 | Operational and monitored | Implemented, evidenced, periodically reviewed and improved. |

---

## Evidence Level Logic

Evidence directly caps scores.

| Evidence level | Meaning | Maximum supported score |
|---|---|---:|
| E0 | No evidence | 1 |
| E1 | Informal evidence | 2 |
| E2 | Draft evidence | 2 |
| E3 | Approved document/process | 3 |
| E4 | Implementation evidence | 4 |
| E5 | Monitored/reviewed evidence | 5 |

Formula:

```text
Adjusted Score = minimum(Claimed Score, Evidence Supported Score)
```

Examples:

| Claimed score | Evidence level | Adjusted score |
|---:|---|---:|
| 5 | E0 | 1 |
| 4 | E2 | 2 |
| 3 | E3 | 3 |
| 4 | E4 | 4 |
| 5 | E5 | 5 |

---

## Domain Score Formula

```text
Domain Average = Sum of adjusted question scores / Number of applicable questions
Domain Weighted Score = (Domain Average / 5) × Domain Weight
```

Example:

- Domain: ROPA
- Weight: 6
- Applicable questions: 6
- Adjusted scores: 1, 2, 1, 0, 2, 1

```text
Domain Average = 7 / 6 = 1.17
Domain Weighted Score = (1.17 / 5) × 6 = 1.40 out of 6
```

---

## Overall Score Types

| Score type | Meaning |
|---|---|
| Raw Score | Score across all selected domains. |
| Applicable Score | Score after excluding reviewer-approved N/A. |
| Adjusted Score | Final score after evidence and red-flag caps. |
| Evidence Confidence Score | Strength of evidence behind responses. |

Evidence Confidence formula:

```text
Evidence Confidence Score = Average evidence level across applicable questions / 5 × 100
```

---

## Maturity Bands

| Adjusted score | Maturity level | Meaning |
|---:|---|---|
| 0–20 | Level 0 — Not Started | No structured DPDP readiness. |
| 21–40 | Level 1 — Aware | Awareness exists, controls informal. |
| 41–60 | Level 2 — Defined | Policies/processes emerging. |
| 61–75 | Level 3 — Implementing | Controls being implemented. |
| 76–90 | Level 4 — Operational | Controls active and evidenced. |
| 91–100 | Level 5 — Continuous Assurance | Controls monitored and improved. |

---

## Red-Flag Logic

Certain weaknesses should cap scores.

| Red flag | Suggested cap |
|---|---:|
| No DPDP owner or governance structure | 60 |
| No personal data inventory | 55 |
| No ROPA / processing activity register | 60 |
| No privacy notice at major collection points | 60 |
| No consent record where consent is required | 65 |
| No Data Principal rights workflow | 65 |
| No grievance mechanism/contact publication | 65 |
| No retention or erasure process | 65 |
| No reasonable security safeguards evidence | 60 |
| No breach response process | 65 |
| No vendor/Data Processor contract visibility | 70 |
| Children’s data processed without guardian-consent review | 50 |
| AI/analytics uses personal data without privacy review | 65 |
| Evidence confidence below 25% despite high claimed maturity | 60 |

Rule:

```text
If multiple red flags exist, final adjusted score cannot exceed the lowest applicable score cap.
```

---

## Gap Generation Logic

| Adjusted score | Gap generated? | Typical severity |
|---:|---|---|
| 0 | Yes | Critical / High |
| 1 | Yes | High |
| 2 | Yes | Medium / High |
| 3 | Usually improvement only | Low / Improvement |
| 4 | No unless evidence outdated | Improvement |
| 5 | No | None |

Gap algorithm:

```text
For each applicable response:
    If adjusted score <= 2:
        Create gap
        Assign domain
        Assign risk level
        Assign root cause
        Assign priority
        Link remediation
        Link evidence requirement
```

---

## Priority Logic

| Priority | Meaning | Suggested timeline |
|---|---|---|
| P0 | Critical and urgent | 15–30 days |
| P1 | High priority | 30–45 days |
| P2 | Medium priority | 45–90 days |
| P3 | Improvement item | 90–180 days |

---

## Remediation Action Logic

```text
Gap created
    ↓
Identify domain
    ↓
Identify root cause
    ↓
Fetch standard remediation action
    ↓
Assign default owner role
    ↓
Set priority and due date
    ↓
Define required evidence
    ↓
Create action task
```

Default owner mapping:

| Domain | Default owner |
|---|---|
| Governance | Executive Sponsor / DPDP Owner |
| Inventory | IT + Department Owners |
| ROPA | DPDP Owner + Process Owners |
| Purpose | Legal + Business Owner |
| Notice | Legal + Website/App Owner |
| Consent | Legal + IT/Product |
| Rights | Compliance + Operations |
| Grievance | Legal + Support |
| Retention | Legal + IT + Records Owner |
| Security | CISO / IT Security |
| Breach | IT Security + Legal |
| Vendor | Procurement + Legal + IT |
| Children | Legal + Business/Academic Owner |
| Cross-border | Legal + IT + Vendor Owner |
| SDF/AI | Leadership + Legal + AI/Data Owner |

---

## Reassessment Logic

Reassessment should measure improvement, not restart from zero.

```text
Load baseline assessment
    ↓
Load open gaps and actions
    ↓
Ask changed / weak / high-risk questions
    ↓
Request updated evidence
    ↓
Recalculate adjusted score
    ↓
Compare baseline vs current
    ↓
Explain score movement
    ↓
Generate revised roadmap
```

---

# Step H — Industry Template and Dynamic Question Engine

## Principle

> DPDP applicability is driven by actual personal data processing, not only by industry. Industry helps customise the assessment, but the platform must assess real processing activities, systems, vendors, users and risks.

---

## Question Engine Layers

| Layer | Question type | Example |
|---:|---|---|
| 1 | Core DPDP questions | Governance, inventory, notice, consent, rights, grievance, security, breach. |
| 2 | Industry template questions | University admissions, BFSI KYC, healthcare patient records. |
| 3 | Organisation-scope questions | ERP, HRMS, LMS, CRM, app, vendors, cloud. |
| 4 | Risk-triggered conditional questions | Children’s data, AI, cross-border, processors. |
| 5 | Reassessment questions | Open gaps, overdue actions, updated evidence. |

---

## Industry Classification

### Primary Industries

| Code | Industry |
|---|---|
| `university` | University / Higher Education |
| `edtech` | EdTech / Online Learning |
| `bfsi` | Banking, Financial Services and Insurance |
| `healthcare` | Healthcare / Hospital / Clinic / Diagnostics |
| `saas` | SaaS / Technology Platform |
| `manufacturing` | Manufacturing / Industrial |
| `retail_ecommerce` | Retail / E-commerce |
| `public_sector` | Public sector / government-linked institution |
| `professional_services` | Consulting / legal / accounting / advisory |
| `other` | General organisation |

### Secondary Risk Tags

| Risk tag | Example trigger |
|---|---|
| `children_data` | Under-18 student/user/customer data. |
| `large_scale_processing` | Large number of Data Principals. |
| `cloud_saas_processing` | ERP/CRM/LMS/HRMS/cloud vendor. |
| `cross_border_unknown` | Data location unknown. |
| `ai_processing` | AI chatbot, analytics, scoring or recommendation. |
| `high_vendor_dependency` | Multiple processors. |
| `sensitive_documents` | Identity, academic, financial, health documents. |
| `marketing_tracking` | Cookies, campaign tools, profiling. |
| `multi_location` | Branches, campuses, subsidiaries. |
| `public_facing_portal` | Website/app collects personal data. |

---

## Question Packs

| Question pack | When used |
|---|---|
| `CORE_DPDP_V1` | Every full assessment. |
| `UNIVERSITY_OVERLAY_V1` | Industry = University. |
| `EDTECH_OVERLAY_V1` | Industry = EdTech. |
| `BFSI_OVERLAY_V1` | Industry = BFSI. |
| `HEALTHCARE_OVERLAY_V1` | Industry = Healthcare. |
| `SAAS_OVERLAY_V1` | Industry = SaaS. |
| `MANUFACTURING_OVERLAY_V1` | Industry = Manufacturing. |
| `RETAIL_ECOMMERCE_OVERLAY_V1` | Industry = Retail/E-commerce. |
| `CHILDREN_DATA_V1` | Children’s data = Yes. |
| `VENDOR_PROCESSOR_V1` | Vendors/processors = Yes. |
| `CLOUD_CROSSBORDER_V1` | Cloud/SaaS/cross-border = Yes/Unknown. |
| `AI_RISK_V1` | AI/analytics/automation = Yes. |
| `MARKETING_TRACKING_V1` | Cookies/marketing/profiling = Yes. |
| `SDF_READINESS_V1` | Large-scale/high-risk processing. |

---

## Template Selection Flow

```text
Select primary industry
    ↓
Load core DPDP template
    ↓
Load industry overlay template
    ↓
Read scope wizard answers
    ↓
Add conditional question packs
    ↓
Generate assessment preview
    ↓
Allow consultant/admin review
    ↓
Launch assessment
```

---

## Dynamic Rule Examples

### Children’s Data Trigger

```json
{
  "ruleCode": "TRIGGER_CHILDREN_DATA",
  "condition": {
    "field": "childrenDataProcessed",
    "operator": "equals",
    "value": true
  },
  "addQuestionPack": "CHILDREN_DATA_V1"
}
```

### University AI Proctoring Trigger

```json
{
  "ruleCode": "TRIGGER_UNIVERSITY_AI_PROCTORING",
  "condition": {
    "all": [
      { "field": "industryCode", "operator": "equals", "value": "university" },
      { "field": "aiUsageTypes", "operator": "contains", "value": "proctoring" }
    ]
  },
  "addQuestionPack": "AI_PROCTORING_UNIVERSITY_V1"
}
```

---

## University / Higher Education Template

### Typical Data Principal Types

- Applicants,
- students,
- parents/guardians,
- faculty,
- employees,
- alumni,
- vendors,
- visitors,
- research participants,
- affiliated college users.

### Typical Systems

- admission portal,
- student ERP / SIS,
- LMS,
- examination system,
- hostel system,
- library system,
- HRMS,
- payroll,
- website,
- payment gateway,
- email/SMS platform,
- AI proctoring/chatbot/analytics.

### University Overlay Questions

| Code | Question | Domain |
|---|---|---|
| `UNI-ADM-001` | Are privacy notices provided at admission data collection points? | NOTICE |
| `UNI-ADM-002` | Are applicant/student data fields mapped to clear admission purposes? | PURPOSE |
| `UNI-EXAM-001` | Is access to examination and result data restricted and logged? | SECURITY |
| `UNI-EXAM-002` | Are retention periods defined for exam records and result data? | RETENTION |
| `UNI-LMS-001` | Is LMS data processing mapped, including analytics and third-party access? | ROPA |
| `UNI-AFF-001` | Are data-sharing responsibilities with affiliated colleges defined? | VENDOR |
| `UNI-CHILD-001` | Are below-18 students identified and reviewed for guardian consent? | CHILD |
| `UNI-HR-001` | Are faculty and employee HRMS/payroll data mapped and protected? | INV / SECURITY |
| `UNI-AI-001` | Are AI proctoring/chatbots/analytics reviewed for personal-data risk? | SDF_AI |
| `UNI-GRV-001` | Is student-facing grievance or rights route published and tracked? | GRIEVANCE / RIGHTS |

---

## EdTech Template

| Code | Question | Domain |
|---|---|---|
| `EDT-STU-001` | Are student and parent data categories separately identified? | INV |
| `EDT-CHILD-001` | Are under-18 users identified and guardian-consent reviewed? | CHILD |
| `EDT-LRN-001` | Are learning analytics and performance data mapped in ROPA? | ROPA |
| `EDT-APP-001` | Are app permissions, cookies and SDKs reviewed? | NOTICE / CONSENT |
| `EDT-MKT-001` | Is marketing consent separated from service communication? | CONSENT |
| `EDT-AI-001` | Are AI tutors/recommendations reviewed? | SDF_AI |
| `EDT-VEN-001` | Are payment/video/analytics/cloud vendors mapped? | VENDOR |
| `EDT-RET-001` | Are inactive student account retention/deletion rules defined? | RETENTION |

---

## BFSI Template

| Code | Question | Domain |
|---|---|---|
| `BFSI-KYC-001` | Are KYC data fields mapped to purpose and retention rules? | PURPOSE / RETENTION |
| `BFSI-CUS-001` | Are customer data categories mapped across core systems and CRM? | INV |
| `BFSI-VEN-001` | Are outsourcing/technology vendors processing customer data reviewed? | VENDOR |
| `BFSI-SEC-001` | Are access controls, logs and monitoring implemented? | SECURITY |
| `BFSI-BR-001` | Is breach response integrated with cybersecurity incident response? | BREACH |
| `BFSI-MKT-001` | Is marketing consent separated from service/regulatory communication? | CONSENT |
| `BFSI-AI-001` | Are AI/analytics models using customer data reviewed? | SDF_AI |
| `BFSI-RGT-001` | Can Data Principal rights requests be fulfilled across systems? | RIGHTS |

---

## Healthcare Template

| Code | Question | Domain |
|---|---|---|
| `HLTH-PAT-001` | Are patient registration and clinical data categories mapped? | INV |
| `HLTH-LAB-001` | Are lab, diagnostic and report-sharing workflows documented? | ROPA |
| `HLTH-CONS-001` | Are patient-facing notices and consent flows appropriate? | NOTICE / CONSENT |
| `HLTH-VEN-001` | Are lab, software, cloud and billing vendors mapped? | VENDOR |
| `HLTH-SEC-001` | Are patient records protected by role-based access? | SECURITY |
| `HLTH-BR-001` | Is breach response prepared for patient-data exposure? | BREACH |
| `HLTH-RET-001` | Are patient record/report retention rules defined? | RETENTION |
| `HLTH-AI-001` | Are AI diagnostics/triage/chatbots reviewed? | SDF_AI |

---

## SaaS / Technology Template

| Code | Question | Domain |
|---|---|---|
| `SAAS-ROLE-001` | Has the organisation classified when it is Data Fiduciary vs Data Processor? | GOV / VENDOR |
| `SAAS-CUST-001` | Are customer/user data mapped across product, support, analytics and logs? | INV |
| `SAAS-SUB-001` | Are cloud, analytics, email and support sub-processors identified? | VENDOR |
| `SAAS-LOG-001` | Are application logs reviewed for personal data exposure? | SECURITY |
| `SAAS-API-001` | Are APIs protected against unauthorised personal data access? | SECURITY |
| `SAAS-SUP-001` | Is support-team access to customer data controlled and logged? | SECURITY |
| `SAAS-CB-001` | Is customer data location and cross-border processing known? | CROSSBORDER |
| `SAAS-AI-001` | Are AI features using client/user data reviewed? | SDF_AI |

---

## Manufacturing Template

| Code | Question | Domain |
|---|---|---|
| `MFG-HR-001` | Are employee, contractor and payroll data categories mapped? | INV |
| `MFG-CON-001` | Are contractor and plant-worker onboarding flows documented? | ROPA |
| `MFG-ACC-001` | Are plant access, visitor logs, CCTV or biometric systems reviewed? | SECURITY / PURPOSE |
| `MFG-VEN-001` | Are payroll, attendance, security and staffing vendors mapped? | VENDOR |
| `MFG-RET-001` | Are retention periods defined for employee/contractor/visitor records? | RETENTION |
| `MFG-GRV-001` | Is there a route for employees/contractors to raise data grievances? | GRIEVANCE |
| `MFG-AI-001` | Are AI/IoT/workforce analytics tools reviewed? | SDF_AI |
| `MFG-MULTI-001` | Are multi-plant or branch data flows mapped? | ROPA |

---

## Retail / E-commerce Template

| Code | Question | Domain |
|---|---|---|
| `RET-CUS-001` | Are customer data categories mapped across website, app, CRM and support? | INV |
| `RET-NOT-001` | Are notices provided at checkout, sign-up, loyalty and app points? | NOTICE |
| `RET-MKT-001` | Is marketing consent separated from order/service communication? | CONSENT |
| `RET-LOG-001` | Are logistics and delivery partners mapped? | VENDOR |
| `RET-APP-001` | Are cookies, SDKs and app permissions reviewed? | NOTICE / CONSENT |
| `RET-RGT-001` | Can customers raise access/correction/erasure/grievance requests? | RIGHTS |
| `RET-BR-001` | Is breach response prepared for customer/order data exposure? | BREACH |
| `RET-AI-001` | Are recommendation engines and profiling reviewed? | SDF_AI |

---

## Conditional Question Packs

### Children’s Data Pack

Triggered when children’s data is processed or unknown.

| Code | Question | Domain |
|---|---|---|
| `CHILD-001` | Does the organisation identify whether Data Principals are below 18? | CHILD |
| `CHILD-002` | Is guardian/parental consent reviewed where required? | CHILD |
| `CHILD-003` | Are child-data purposes documented and limited? | PURPOSE |
| `CHILD-004` | Are tracking, behavioural monitoring or targeted advertising risks reviewed? | CHILD |
| `CHILD-005` | Are vendors processing children’s data identified? | VENDOR |
| `CHILD-006` | Is evidence maintained for age/guardian workflows? | EVIDENCE |

### Vendor / Data Processor Pack

| Code | Question | Domain |
|---|---|---|
| `VEN-001` | Is there a register of vendors processing personal data? | VENDOR |
| `VEN-002` | Are Data Processor roles and responsibilities contractually defined? | VENDOR |
| `VEN-003` | Are sub-processors identified where applicable? | VENDOR |
| `VEN-004` | Are security obligations included in processor contracts? | SECURITY / VENDOR |
| `VEN-005` | Are vendor reviews conducted periodically? | VENDOR |
| `VEN-006` | Are high-risk vendors linked to ROPA records? | ROPA / VENDOR |

### AI / Analytics Risk Pack

| Code | Question | Domain |
|---|---|---|
| `AI-001` | Are AI systems using personal data identified? | SDF_AI |
| `AI-002` | Is the purpose of AI processing documented? | PURPOSE |
| `AI-003` | Is personal data minimised before use in AI tools? | PURPOSE |
| `AI-004` | Are AI vendors or APIs processing personal data mapped? | VENDOR |
| `AI-005` | Are prompts, uploads or logs reviewed for personal data exposure? | SECURITY |
| `AI-006` | Is human review required for AI-generated decisions? | SDF_AI |
| `AI-007` | Is AI usage included in ROPA/data-flow records? | ROPA |

---

# Step I — ROPA / Processing Activity Register Module

## Positioning

Use the product label:

# ROPA / Processing Activity Register

This is a practical DPDP readiness artifact. It should not be overclaimed as a statutory GDPR-style ROPA requirement, but it is central to demonstrating processing visibility.

---

## ROPA Objective

> To help organisations identify, document, review and maintain records of major personal data processing activities across departments, systems, vendors and business processes.

The ROPA module should answer:

| Question | Why it matters |
|---|---|
| What personal data is processed? | Data visibility. |
| Whose data is processed? | Data Principal clarity. |
| Why is it processed? | Purpose clarity. |
| Which department owns it? | Accountability. |
| Which systems store or use it? | Technology mapping. |
| Which vendors/processors are involved? | Processor governance. |
| Is notice/consent linked? | Transparency and consent traceability. |
| How long is data retained? | Retention and erasure. |
| What safeguards exist? | Security and risk control. |
| Is the process reviewed? | Continuous governance. |

---

## ROPA Workflow

```text
Scope wizard completed
    ↓
System suggests likely processing activities
    ↓
User creates or imports ROPA records
    ↓
Department/process owner fills details
    ↓
Systems, vendors, notices, consents and evidence linked
    ↓
Legal/compliance reviews purpose and basis
    ↓
IT/security reviews safeguards
    ↓
ROPA completeness score calculated
    ↓
Gaps and actions generated
    ↓
ROPA approved or marked for improvement
    ↓
Periodic review and reassessment begins
```

---

## ROPA Creation Methods

| Method | Description | MVP priority |
|---|---|---:|
| Manual entry | User fills ROPA form directly. | High |
| Excel import | Upload existing processing register. | High |
| Scope wizard generation | Suggest records from departments/systems. | High |
| Assessment response generation | Weak inventory answers trigger suggestions. | Medium |
| AI-assisted draft | AI drafts ROPA from process description. | High |
| Consultant-assisted creation | Consultant creates records during assessment. | High |
| API import | Import from ERP/LMS/CRM/GRC. | Future |

---

## ROPA Record Lifecycle

| Status | Meaning |
|---|---|
| Draft | Created but incomplete. |
| In Progress | Owner filling details. |
| Submitted for Review | Ready for review. |
| Needs Clarification | Reviewer asks for correction. |
| Approved | Accepted for current assessment. |
| Active | Live processing activity. |
| Under Reassessment | Being reviewed due to change. |
| Archived | No longer active. |
| Reopened | Previously approved record needs correction. |

---

## Core ROPA Fields

### Basic Identification

| Field | Required | Example |
|---|---|---|
| ROPA ID | Yes | ROPA-ADM-001 |
| Processing activity name | Yes | Online admission application |
| Description | Yes | Collection and processing of applicant data. |
| Department | Yes | Admissions |
| Process owner | Yes | Admissions Head |
| Business process category | Yes | Admissions / HR / Customer onboarding |
| Status | Yes | Draft / Active / Approved |
| Version | Yes | v1.0 |
| Next review date | Yes | 31 Dec 2026 |

### Data Principal and Personal Data

| Field | Required | Example |
|---|---|---|
| Data Principal type | Yes | Applicant, student, parent. |
| Personal data categories | Yes | Name, DOB, mobile, email. |
| High-risk document types | Conditional | ID proof, marksheet, category certificate. |
| Children’s data involved | Yes | Yes/No/Unknown. |
| Guardian/parent data involved | Conditional | Yes. |
| Estimated data volume | Optional | 50,000 applicants/year. |
| Data sensitivity/risk level | Yes | High. |

### Purpose and DPDP Basis

| Field | Required | Example |
|---|---|---|
| Purpose of processing | Yes | Admission eligibility and communication. |
| Purpose category | Yes | Service delivery/statutory/marketing. |
| Data necessary for purpose? | Yes | Yes/No/Partial. |
| Excess data suspected? | Yes | Unknown. |
| DPDP basis/legal basis note | Yes | Consent / legitimate use / legal review required. |
| Legal review required | Auto/manual | Yes. |
| Legal review status | Conditional | Pending / Reviewed / Approved. |

### Collection, Notice and Consent

| Field | Required | Example |
|---|---|---|
| Collection source | Yes | Website, portal, paper form. |
| Collection method | Yes | Online form / upload / API. |
| Notice required? | Yes | Yes. |
| Notice linked? | Yes | No. |
| Linked notice ID | Conditional | NOTICE-ADM-001. |
| Consent required? | Yes | To be reviewed. |
| Consent captured? | Conditional | Partial. |
| Withdrawal mechanism available? | Conditional | No. |
| Consent proof available? | Conditional | Partial. |

### Systems and Vendors

| Field | Required | Example |
|---|---|---|
| Systems involved | Yes | Admission portal, ERP. |
| Hosting model | Yes | On-premise / cloud / SaaS. |
| Data location known? | Yes | Unknown. |
| Access control defined? | Yes | Partial. |
| Logging enabled? | Yes | Unknown. |
| Vendor involved? | Yes | Yes. |
| Vendor role | Conditional | Data Processor / unknown. |
| Contract exists? | Conditional | Yes/No/Unknown. |
| DPDP clauses included? | Conditional | Unknown. |
| Sub-processors known? | Conditional | Unknown. |

### Retention, Security and AI

| Field | Required | Example |
|---|---|---|
| Retention period defined? | Yes | Partial. |
| Retention period | Conditional | As per academic/legal schedule. |
| Erasure trigger | Conditional | Purpose complete / withdrawal / retention expiry. |
| Security safeguards | Yes | RBAC, encryption, logs. |
| Security evidence linked | Yes | No. |
| AI involved? | Yes | Yes/No/Unknown. |
| AI use case | Conditional | Proctoring, chatbot, analytics. |
| Human review exists? | Conditional | Partial. |
| DPIA-style review done? | Conditional | No. |

---

## ROPA Completeness Score

| Area | Weight |
|---|---:|
| Processing activity identity | 8 |
| Department and owner | 8 |
| Data Principal type | 8 |
| Personal data categories | 10 |
| Purpose and DPDP basis note | 10 |
| Collection source | 6 |
| Systems involved | 8 |
| Vendors/processors involved | 8 |
| Notice/consent linkage | 8 |
| Retention and erasure | 8 |
| Security safeguards | 8 |
| Risk rating and review date | 6 |
| Evidence linkage | 4 |
| **Total** | **100** |

Bands:

| Score | Band | Meaning |
|---:|---|---|
| 0–30 | Incomplete | Not usable for readiness. |
| 31–60 | Basic | Initial visibility only. |
| 61–80 | Usable | Good for assessment and review. |
| 81–100 | Strong | Evidence-backed, review-ready. |

---

## ROPA Risk Factors

| Risk factor | Impact |
|---|---|
| Children’s data involved | Increases risk. |
| Large number of Data Principals | Increases risk. |
| High-risk documents | Increases risk. |
| Multiple vendors/processors | Increases risk. |
| Cross-border/cloud unknown | Increases risk. |
| AI/automated processing | Increases risk. |
| No notice linked | Increases risk. |
| No retention rule | Increases risk. |
| No security evidence | Increases risk. |
| No owner/review date | Increases risk. |

---

## ROPA Gap Generation

| Condition | Gap generated |
|---|---|
| No ROPA records | Critical ROPA gap. |
| Processing activity has no owner | Governance gap. |
| Personal data categories missing | Inventory gap. |
| Purpose vague/missing | Purpose/minimisation gap. |
| Vendor involved but not mapped | Vendor governance gap. |
| No notice linked where required | Notice gap. |
| Consent required but not linked | Consent gap. |
| No retention status | Retention gap. |
| No safeguards | Security gap. |
| Children’s data without review | Children’s data gap. |
| AI involved without review | AI-risk gap. |
| ROPA not reviewed by due date | Governance/reassessment gap. |

---

## AI-Assisted ROPA Creation

AI can help draft ROPA records but must not approve them.

AI can suggest:

- processing activity name,
- Data Principal types,
- data categories,
- purpose,
- systems to confirm,
- vendors to confirm,
- notice/consent review,
- retention information needed,
- security evidence,
- risk rating,
- missing fields.

AI output should remain:

```text
Draft → Human Review Required
```

---

## ROPA Import / Export

### Import Flow

```text
User uploads Excel
    ↓
System maps columns
    ↓
User confirms mapping
    ↓
System validates fields
    ↓
Invalid rows shown for correction
    ↓
Valid rows imported as draft ROPA records
    ↓
Completeness score calculated
    ↓
Missing-field gaps generated
```

### Export Formats

| Export | Format |
|---|---|
| ROPA register | Excel / CSV |
| ROPA executive summary | PDF |
| ROPA gaps | Excel |
| ROPA evidence index | Excel |
| ROPA audit trail | CSV / PDF |

---

## Industry-Specific ROPA Templates

### University

| Suggested activity | Default risk |
|---|---|
| Online admission application | High |
| Student ERP record management | High |
| Examination registration and result processing | High |
| LMS user account and learning analytics | High |
| Scholarship/category document processing | High |
| Faculty HRMS and payroll | Medium |
| Student grievance handling | Medium |
| AI proctoring / chatbot / analytics | High |

### EdTech

| Suggested activity | Default risk |
|---|---|
| Student registration | High |
| Parent/guardian onboarding | High |
| Learning analytics and progress tracking | High |
| AI tutor or recommendation engine | High |
| Payment and subscription processing | Medium |
| Marketing campaigns | Medium |
| App analytics and SDK tracking | High |

### BFSI

| Suggested activity | Default risk |
|---|---|
| Customer onboarding and KYC | High |
| Transaction monitoring | High |
| CRM and customer support | High |
| Vendor outsourcing | High |
| Fraud analytics / AI model processing | High |
| Employee HRMS/payroll | Medium |

### Healthcare

| Suggested activity | Default risk |
|---|---|
| Patient registration | High |
| Diagnostic/lab report processing | High |
| Doctor consultation records | High |
| Billing and insurance processing | Medium |
| Telemedicine consultation | High |
| AI triage/diagnostic support | High |

### SaaS

| Suggested activity | Default risk |
|---|---|
| User registration | Medium |
| Customer workspace management | High |
| Application logs and telemetry | Medium |
| Customer support access | High |
| API data processing | High |
| Sub-processor/cloud processing | High |
| AI feature processing | High |

---

## ROPA Dashboard Metrics

| Metric | Meaning |
|---|---|
| Total ROPA records | Processing activities documented. |
| Approved ROPA records | Reviewed and accepted. |
| Draft/incomplete records | Need work. |
| High-risk processing activities | Priority review items. |
| Records involving children’s data | Child-data risk visibility. |
| Records involving vendors | Processor visibility. |
| Records involving AI | AI/privacy risk visibility. |
| Unknown data location | Cross-border/cloud review need. |
| Missing retention | Retention gap. |
| Overdue review records | Governance gap. |

---

## Step I Summary

| Area | Decision |
|---|---|
| Module name | ROPA / Processing Activity Register |
| Purpose | Record major personal data processing activities. |
| Creation methods | Manual, Excel import, scope-generated, AI-assisted, consultant-assisted. |
| Core links | Department, system, vendor, notice, consent, evidence, gaps, actions. |
| Scoring | Completeness score out of 100. |
| Risk | Critical/high/medium/low based on data, vendor, AI, children, retention and safeguards. |
| AI role | Draft and guide only; human review required. |
| Dashboard | Completeness, risk, missing fields, owners and review status. |
| Export | Excel, CSV, PDF summary. |
| MVP status | Must-have core module. |

