# 04 — Healthcare / Hospitals / Clinics / Diagnostics DPDP Questions
## TrustStack™ DPDP Compass — Industry Question Bank

**Industry:** Healthcare / Hospitals / Clinics / Diagnostics / Telemedicine / HealthTech  
**Use in product:** Industry overlay on top of the Core 16-Domain DPDP Compass Assessment  
**Version:** v1.0  
**Prepared for:** TrustStack™ DPDP Compass assessment engine, consultant-led assessments, ROPA module, evidence review, dashboard/report generation, and AI Assistant guidance

---

## 1. How to use this industry file

This file is an **industry overlay**. It should not replace the core DPDP Compass question bank.

The correct assessment design is:

```text
Core DPDP Compass 16-domain assessment
+ Healthcare industry overlay
+ Conditional packs: children, vendors, cloud, AI, telemedicine, ABDM, payments, marketing, breach
+ Organisation-specific dynamic questions for departments, systems, vendors and ROPA records
```

The healthcare overlay should be used for:

- hospitals,
- clinics,
- diagnostic centres,
- pathology labs,
- radiology/imaging centres,
- telemedicine providers,
- healthtech platforms,
- patient portals,
- home healthcare providers,
- wellness and preventive-health platforms,
- hospital chains,
- specialty centres,
- dental/eye/IVF/fertility clinics,
- pharmacies connected to clinical workflows,
- health insurance support desks or hospital TPA desks.

Important positioning:

> Healthcare organisations process some of the most sensitive categories of personal data from a practical risk perspective. DPDP Compass should therefore treat healthcare assessments as high-trust, evidence-heavy and breach-sensitive.

---

## 2. Research and regulatory baseline used

This question bank is designed around the DPDP Compass framework and the practical healthcare operating environment in India.

### 2.1 DPDP baseline

The DPDP Compass healthcare template should be mapped to the same 16 domains used across all industries:

1. Governance, accountability and DPDP ownership
2. Personal data discovery and inventory
3. ROPA / Processing Activity Register
4. Purpose, lawful basis and data minimisation
5. Notice management
6. Consent and consent withdrawal
7. Data Principal rights
8. Grievance redressal and contact publication
9. Retention, erasure and archival
10. Data accuracy and quality
11. Security safeguards
12. Personal data breach readiness
13. Vendor / Data Processor governance
14. Children’s data and guardian consent
15. Cross-border transfer and cloud/SaaS risk
16. SDF, DPIA, audit and AI/algorithmic risk readiness

### 2.2 Healthcare-sector references to consider

These references should be used as **sector context**, not as a replacement for DPDP legal analysis:

| Reference area | Why it matters for DPDP Compass healthcare assessment |
|---|---|
| Ayushman Bharat Digital Mission (ABDM) / Health Data Management Policy | Useful for digital health ecosystem, patient consented exchange, ABHA, HIP/HIU/HIE-CM, privacy-by-design and interoperability context |
| Electronic Health Record Standards for India, 2016 | Useful for EHR/EMR structure, interoperability, capture, storage, transmission and use of healthcare information |
| Telemedicine Practice Guidelines, 2020 | Useful for teleconsultation workflows, informed consent, medical records, privacy and security of patient records |
| Clinical Establishments Act / Rules and state clinical-establishment rules | Useful for hospital/clinic/lab registration and minimum operational standards context |
| Professional conduct/medical ethics norms | Useful for patient confidentiality and medical-record handling expectations |
| DPDP Act and Rules | Main privacy/data-protection baseline for digital personal data processing |

### 2.3 Important healthcare distinction

Healthcare assessment should distinguish between:

| Concept | Meaning |
|---|---|
| Clinical consent | Consent for treatment, procedure, surgery, diagnostics or medical decision-making |
| DPDP consent | Consent or valid basis for processing digital personal data |
| ABDM consent | Consent for exchange/access of health records through ABDM/HIE-CM flows where applicable |
| Insurance/TPA authorisation | Permission/authorisation for claims, billing or policy-related data flows |

These may overlap operationally but they should not be treated as identical.

---

## 3. Typical healthcare organisation types

| Organisation type | Examples | Assessment emphasis |
|---|---|---|
| Multi-specialty hospital | Inpatient, outpatient, emergency, surgery, ICU | High-volume patient data, EMR/HIMS, vendors, breach readiness |
| Clinic / polyclinic | OPD, prescriptions, small diagnostic tie-ups | Patient notice, records, appointment data, doctor access |
| Diagnostic lab | Pathology, radiology, sample collection | Lab reports, home collection, report sharing, lab systems |
| Telemedicine provider | Video consultation, chat, e-prescription | Patient identity, consent, recording, platform privacy, security |
| HealthTech app | App-based health services, tracking, AI | App data, AI, analytics, SDKs, cloud, consent |
| Hospital chain | Multiple locations, central systems | Multi-location governance, shared systems, central ROPA |
| Home healthcare | Nurse/physio/home sample collection | Field staff, mobile apps, logistics, patient confidentiality |
| Wellness provider | Preventive care, health risk assessments | Sensitive health profiles, marketing, wearable/app data |
| Pharmacy-linked platform | E-prescription, medicine delivery | Prescription data, delivery partners, payment, retention |
| IVF/fertility/specialty clinic | Fertility, genetics, reproductive health | High confidentiality, sensitive documents, retention, access control |

---

## 4. Typical Data Principal groups

| Data Principal group | Examples |
|---|---|
| Patients | OPD, IPD, emergency, teleconsultation, diagnostics |
| Patient attendants / caregivers | Family members, authorised representatives |
| Children / minors | Pediatric patients, neonatal records, vaccination records |
| Parents / guardians | Consent, billing, communication, patient support |
| Doctors | Consultants, visiting doctors, telemedicine RMPs |
| Nurses and clinical staff | Duty rosters, HR records, credentials |
| Employees | HRMS, payroll, attendance, performance |
| Contractors | Security, housekeeping, technicians, ambulance staff |
| Vendors | Lab partners, IT vendors, cloud/SaaS providers |
| Insurance / TPA users | Claims processing and documentation |
| Visitors | Visitor management, CCTV, access logs |
| Research participants | Clinical studies, surveys, health programmes |
| Donors | Blood donation, organ donation, charitable programmes |

---

## 5. Typical personal data categories

| Category | Examples | Risk level |
|---|---|---|
| Basic identity | Name, age, gender, mobile, email, address | Medium |
| Government identifiers | Aadhaar, PAN, passport, insurance ID, ABHA ID | High |
| Health data | Diagnosis, symptoms, treatment, prescriptions, lab reports, imaging | High |
| Emergency/contact data | Attendant details, next of kin, emergency contacts | Medium/High |
| Financial/billing data | Bills, payment references, insurance details, TPA data | High |
| Appointment data | Doctor, specialty, date/time, visit reason | Medium/High |
| Clinical notes | Doctor notes, nursing notes, discharge summary | High |
| Medication data | Drug prescriptions, allergies, medication history | High |
| Device/wearable data | Heart rate, glucose, sleep, activity, remote monitoring | High |
| Telemedicine data | Video/chat logs, recordings, e-prescriptions | High |
| Biometric data | Biometric attendance, patient identification where used | High |
| CCTV/visitor data | Video, visitor logs, access records | Medium/High |
| Children’s data | Pediatric records, vaccination, guardian details | High |
| Research data | Study data, trial records, survey responses | High |
| Grievance data | Complaints, incident details, patient concerns | Medium/High |

---

## 6. Typical healthcare systems and applications

| System/application | DPDP relevance |
|---|---|
| Hospital Information Management System (HIMS/HMIS) | Core patient, OPD/IPD, billing and clinical data |
| Electronic Medical Record / Electronic Health Record | Clinical records, prescriptions, treatment history |
| Laboratory Information Management System (LIMS) | Lab orders, samples, reports, integrations |
| Radiology Information System / PACS | Imaging reports, DICOM images, diagnostic data |
| Appointment system | Patient scheduling and communication |
| Patient portal / mobile app | Patient login, reports, consent, profile, communication |
| Telemedicine platform | Video/chat consults, prescriptions, recordings |
| Pharmacy system | Prescription and medicine data |
| Billing and TPA/insurance system | Claims, bills, payer/insurer data |
| CRM/call centre system | Patient enquiries, follow-ups, complaints |
| HRMS/payroll | Employee and doctor data |
| Biometric attendance | Staff identity/attendance data |
| CCTV / visitor management | Facility security and visitor records |
| Ambulance dispatch system | Patient and emergency location data |
| Cloud storage / document management | Scanned reports, documents, consent forms |
| AI diagnostics / triage / chatbot | Automated processing of patient data |
| ABDM integration layer | ABHA, HIP/HIU, consented health-record exchange |

---

## 7. Typical vendors / Data Processors

| Vendor type | Examples | DPDP check |
|---|---|---|
| HIMS/EMR vendor | Hospital software provider | Contract, data location, access, support access |
| Cloud provider | AWS/Azure/GCP/other | Hosting region, security, backup, access |
| Lab partner | Outsourced diagnostics | Report sharing, patient data, agreements |
| TPA/insurance processor | Claims processing | Purpose, sharing, retention, contract |
| Payment gateway | Online/offline payments | Payment data, security, retention |
| Telemedicine platform | Video/chat/e-prescription | Consent, recordings, access, security |
| SMS/email/WhatsApp vendor | Appointment/report alerts | Contact data, message content, opt-out |
| CRM/call centre vendor | Patient support | Access control, scripts, logs, confidentiality |
| Home sample collection partner | Field collection | Patient/sample data, mobile app security |
| Ambulance service partner | Emergency response | Location/health data, access logs |
| Document scanning vendor | Digitisation | Confidentiality, deletion after scan |
| IT support/MSP | System administration | Privileged access, audit logs |
| Cybersecurity vendor | Monitoring, incident response | Access to logs and systems |
| AI/analytics vendor | AI triage/diagnostics/profiling | Model risk, data sharing, retention |
| Marketing platform | Campaigns and tracking | Consent, unsubscribes, segmentation |

---

## 8. Key DPDP risk themes in healthcare

| Risk theme | Why it matters |
|---|---|
| Health data sensitivity | Health information can cause significant harm if misused or exposed |
| Fragmented systems | HIMS, LIMS, pharmacy, billing, TPA, CRM and telemedicine may be disconnected |
| Doctor/department access | Broad clinical access can create confidentiality and access-control issues |
| Report sharing | Lab/radiology reports may be sent through insecure channels |
| Attendant/guardian sharing | Data may be shared with family or attendants without clear authority |
| Telemedicine | Video/chat/recording/e-prescription workflows add privacy and security risks |
| Insurance/TPA | Claims processing creates external data-sharing flows |
| Vendors | HIMS, cloud, call centre, lab and IT vendors may process patient data |
| Children’s health data | Pediatric/minor patient data requires guardian review and extra care |
| Breach readiness | Healthcare data breach response must be rapid and patient-sensitive |
| AI diagnostics/triage | AI systems may use personal/health data and influence care decisions |
| Research/analytics | Secondary use of health data requires careful purpose and de-identification review |

---

## 9. Healthcare-specific assessment question bank

### Question table legend

| Field | Meaning |
|---|---|
| Type | Mandatory, Conditional, High-risk, Evidence-heavy, ROPA-linked, AI-linked, Vendor-linked |
| Priority | P0 = immediate, P1 = high, P2 = medium, P3 = improvement |
| Owner | Suggested business owner for implementation |

---

## 9.1 Governance, accountability and DPDP ownership — GOV

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-GOV-001 | Has the healthcare organisation appointed a DPDP/privacy owner responsible for patient data, staff data and vendor data? | Mandatory | Appointment note, governance charter | DPDP activities remain fragmented | CXO / Compliance | P0 |
| HLTH-GOV-002 | Is there a privacy governance committee involving clinical, IT, legal, operations, billing, HR and vendor management teams? | Mandatory | Committee ToR, meeting minutes | Patient data risks not reviewed across functions | CEO/COO | P1 |
| HLTH-GOV-003 | Are department-level owners defined for OPD, IPD, emergency, lab, pharmacy, radiology, billing, insurance, HR and telemedicine data? | Mandatory | Responsibility matrix | No accountability for data lifecycle | COO / DPDP Owner | P1 |
| HLTH-GOV-004 | Is patient-data protection included in hospital risk management, quality, accreditation or clinical governance meetings? | Evidence-heavy | Risk register, meeting agenda | Privacy treated as only IT/legal topic | Risk / Quality | P2 |
| HLTH-GOV-005 | Are clinicians and staff trained on confidentiality, secure report sharing and DPDP basics? | Mandatory | Training records, attendance | Unauthorised sharing through staff practices | HR / Medical Director | P1 |
| HLTH-GOV-006 | Does the organisation distinguish clinical consent, DPDP consent, ABDM consent and insurance/TPA authorisations? | High-risk | Consent policy, SOP | Wrong consent model applied | Legal / Medical Director | P0 |
| HLTH-GOV-007 | Are privacy responsibilities included in contracts or appointment letters of visiting doctors, consultants and outsourced clinical staff? | Conditional | Consultant contracts, HR policy | Non-employee access not governed | HR / Legal | P1 |
| HLTH-GOV-008 | Are privacy, security and confidentiality responsibilities defined for franchise/branch hospitals or clinics in the same group? | Conditional | Group policy, branch SOP | Multi-location inconsistency | Corporate Compliance | P1 |
| HLTH-GOV-009 | Is there a documented escalation route for patient-data privacy incidents? | Mandatory | Incident escalation matrix | Delayed response to breach/complaint | DPDP Owner / CISO | P0 |
| HLTH-GOV-010 | Is there board/management visibility of patient-data risk, evidence confidence and remediation progress? | Evidence-heavy | Dashboard, board note | Leadership cannot prioritise resources | Executive Sponsor | P2 |

---

## 9.2 Personal data discovery and inventory — INV

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-INV-001 | Has the organisation identified all patient data collection points across OPD, IPD, emergency, lab, radiology, pharmacy, billing and telemedicine? | Mandatory | Data inventory, process map | Unknown data collection | DPDP Owner / Operations | P0 |
| HLTH-INV-002 | Are patient identity fields, contact details, health records, prescriptions, reports, images and billing data separately categorised? | Mandatory | Data-category register | Poor purpose/retention/security mapping | Compliance / IT | P1 |
| HLTH-INV-003 | Are scanned documents such as prescriptions, identity proof, insurance cards and consent forms inventoried? | Evidence-heavy | Document repository index | Hidden sensitive documents | Records / IT | P1 |
| HLTH-INV-004 | Are lab samples, test requests and reports mapped across ordering, collection, processing, reporting and sharing? | ROPA-linked | LIMS data map | Lab data leakage/incorrect sharing | Lab Head | P1 |
| HLTH-INV-005 | Are radiology images, PACS records and diagnostic notes included in the inventory? | Conditional | PACS/RIS inventory | Imaging data overlooked | Radiology / IT | P1 |
| HLTH-INV-006 | Are patient call recordings, chat logs, support tickets and WhatsApp communications inventoried? | Conditional | CRM/call centre records | Uncontrolled communication data | Customer Support / IT | P1 |
| HLTH-INV-007 | Is telemedicine data such as video, chat, prescriptions and consultation notes inventoried? | Conditional | Telemedicine workflow map | Missing high-risk digital channel | Telemedicine Owner | P0 |
| HLTH-INV-008 | Are employee, doctor, nurse, contractor and visiting-consultant records inventoried? | Mandatory | HRMS inventory | Workforce data ignored | HR | P2 |
| HLTH-INV-009 | Are CCTV, visitor management, access-control and biometric attendance data inventoried? | Conditional | Facility/security inventory | Security systems overlooked | Admin / Security | P2 |
| HLTH-INV-010 | Are ABHA, ABDM/HIP/HIU integration and health-record exchange data fields inventoried where applicable? | Conditional | ABDM integration documentation | Consent/exchange risks missed | Digital Health / IT | P0 |
| HLTH-INV-011 | Are data flows to insurance companies, TPAs, employers, government schemes or corporate health programmes identified? | Vendor-linked | Sharing register | External disclosures unknown | Billing / TPA Desk | P1 |
| HLTH-INV-012 | Are third-party analytics, marketing, app SDKs or website trackers collecting patient/prospect data identified? | Conditional | Cookie/SDK inventory | Hidden tracking/profiling | Marketing / IT | P2 |

---

## 9.3 ROPA / Processing Activity Register — ROPA

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-ROPA-001 | Has the organisation created ROPA records for major patient-data processing activities? | Mandatory | ROPA register | No processing visibility | DPDP Owner | P0 |
| HLTH-ROPA-002 | Are OPD registration, appointment booking and consultation workflows recorded as processing activities? | ROPA-linked | ROPA entries | Front-office processing not mapped | Operations | P1 |
| HLTH-ROPA-003 | Are IPD admission, bed allocation, clinical notes, discharge and billing recorded in ROPA? | ROPA-linked | IPD ROPA | Inpatient lifecycle not mapped | Medical Records / Operations | P1 |
| HLTH-ROPA-004 | Are lab testing and report-sharing workflows recorded in ROPA? | ROPA-linked | LIMS ROPA | Lab sharing and retention unclear | Lab Head | P1 |
| HLTH-ROPA-005 | Are radiology/imaging workflows and PACS integrations recorded in ROPA? | Conditional | RIS/PACS ROPA | Diagnostic images overlooked | Radiology / IT | P1 |
| HLTH-ROPA-006 | Are pharmacy/e-prescription/medicine delivery workflows recorded in ROPA? | Conditional | Pharmacy ROPA | Prescription data risk | Pharmacy Head | P2 |
| HLTH-ROPA-007 | Are insurance/TPA/claims processing records documented in ROPA? | Conditional | Claims ROPA | Excessive external sharing | Billing / TPA | P1 |
| HLTH-ROPA-008 | Are telemedicine consultation workflows recorded in ROPA, including platform, recordings and prescriptions? | Conditional | Telemedicine ROPA | Digital consultation risk hidden | Telemedicine Owner | P0 |
| HLTH-ROPA-009 | Are ABDM health-record exchange flows recorded as processing activities where applicable? | Conditional | ABDM ROPA | Patient consented exchange not governed | Digital Health / IT | P0 |
| HLTH-ROPA-010 | Are HRMS, biometric attendance and contractor records documented in ROPA? | Mandatory | HR/contractor ROPA | Workforce data gaps | HR / Admin | P2 |
| HLTH-ROPA-011 | Are AI-enabled triage, diagnosis support, chatbot or analytics workflows recorded in ROPA? | AI-linked | AI ROPA entries | AI processing outside governance | AI/Data Owner | P0 |
| HLTH-ROPA-012 | Is each ROPA record linked to purpose, data categories, systems, vendors, retention, safeguards and evidence? | Evidence-heavy | ROPA completeness report | Register exists but is not usable | DPDP Owner | P1 |

---

## 9.4 Purpose, lawful basis and data minimisation — PURPOSE

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-PUR-001 | Is the purpose of patient data collection clearly documented for registration, diagnosis, treatment, billing and follow-up? | Mandatory | Purpose register, forms | Vague or excessive processing | Legal / Operations | P0 |
| HLTH-PUR-002 | Are data fields in patient registration forms reviewed for necessity? | Mandatory | Form review, data minimisation checklist | Excessive patient data collection | Operations / Legal | P1 |
| HLTH-PUR-003 | Are identity documents collected only where necessary for treatment, billing, insurance or statutory reasons? | High-risk | Data field justification | Overcollection of IDs | Legal / Front Office | P1 |
| HLTH-PUR-004 | Is patient data collected for clinical purposes separated from data collected for marketing, wellness campaigns or analytics? | High-risk | Purpose matrix | Unclear secondary use | Legal / Marketing | P0 |
| HLTH-PUR-005 | Are lab/radiology reports shared only for defined clinical, patient, billing or authorised purposes? | High-risk | Report sharing SOP | Unauthorised disclosure | Lab/Radiology | P1 |
| HLTH-PUR-006 | Is patient data used for research, training or case studies only after appropriate review and de-identification/consent checks? | Conditional | Research SOP, ethics review | Secondary-use risk | Research / Ethics Committee | P0 |
| HLTH-PUR-007 | Are corporate health check-up and employer-sponsored health data flows limited to agreed purposes? | Conditional | Corporate agreement, purpose note | Employer over-disclosure | Corporate Health / Legal | P1 |
| HLTH-PUR-008 | Are telemedicine recordings or transcripts collected only when necessary and disclosed clearly? | Conditional | Telemedicine policy, consent screen | Recording risk | Telemedicine / Legal | P0 |
| HLTH-PUR-009 | Are AI/analytics use cases reviewed for purpose limitation before using patient data? | AI-linked | AI review note | Uncontrolled AI use | AI/Data Owner | P0 |
| HLTH-PUR-010 | Is there a review process to remove obsolete fields from patient forms, app screens and portals? | Evidence-heavy | Periodic form review records | Data minimisation not operationalised | DPDP Owner | P2 |

---

## 9.5 Notice management — NOTICE

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-NOT-001 | Is a clear patient privacy notice available at OPD/IPD registration and major data collection points? | Mandatory | Notice, screenshots, posters | Patients not informed | Legal / Operations | P0 |
| HLTH-NOT-002 | Does the notice describe what personal and health data is collected and why? | Mandatory | Notice content review | Notice not meaningful | Legal | P0 |
| HLTH-NOT-003 | Is the notice available on the hospital website, patient portal and mobile app where data is collected online? | Conditional | Web/app screenshots | Digital collection not covered | Legal / IT | P1 |
| HLTH-NOT-004 | Are separate notices or just-in-time disclosures provided for telemedicine, recordings, chat and e-prescriptions? | Conditional | Telemedicine UX/screens | Patients unaware of digital data use | Telemedicine / Legal | P0 |
| HLTH-NOT-005 | Are lab/radiology report sharing practices explained to patients at collection or report delivery points? | Conditional | Lab notice, sample collection forms | Report sharing surprises | Lab/Radiology | P1 |
| HLTH-NOT-006 | Does the notice explain rights request routes and grievance contact details? | Mandatory | Notice review | Rights/grievance not accessible | Compliance | P1 |
| HLTH-NOT-007 | Is notice text available in languages suitable for patient population, where practical? | Evidence-heavy | Notice language versions | Patients may not understand | Operations / Legal | P2 |
| HLTH-NOT-008 | Are notices version-controlled and linked to processing activities/ROPA records? | Evidence-heavy | Notice register | Cannot prove notice history | Legal / DPDP Owner | P1 |
| HLTH-NOT-009 | Is notice shown before or at the point of digital data collection through forms, apps or portals? | Conditional | UI screenshots | Late/invisible notice | Product/IT | P1 |
| HLTH-NOT-010 | Are notice updates communicated where materially relevant to patients/users? | Evidence-heavy | Update log, communication template | Outdated transparency | Legal / Communications | P2 |

---

## 9.6 Consent and consent withdrawal — CONSENT

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-CON-001 | Are DPDP consent requirements distinguished from clinical/procedure consent forms? | High-risk | Consent matrix | Treatment consent mistaken for data consent | Legal / Medical Director | P0 |
| HLTH-CON-002 | Are consent records captured where consent is used for digital personal-data processing? | Mandatory | Consent logs/screens | Cannot prove consent | Legal / IT | P0 |
| HLTH-CON-003 | Is withdrawal of consent supported where processing is based on consent and withdrawal is legally/practically applicable? | Mandatory | Withdrawal workflow | Non-compliance with withdrawal expectations | Legal / IT | P1 |
| HLTH-CON-004 | Are separate consents captured for marketing, health packages, wellness campaigns or promotional communication? | Conditional | Marketing consent log | Unwanted marketing using patient data | Marketing / Legal | P0 |
| HLTH-CON-005 | Are consents for sharing reports with attendants, employers, insurers or third parties clearly captured or otherwise legally reviewed? | High-risk | Authorisation forms, consent logs | Unauthorised disclosure | Operations / Legal | P0 |
| HLTH-CON-006 | Are ABDM/HIE-CM consent flows understood and documented where the organisation participates as HIP/HIU? | Conditional | ABDM integration notes | Incorrect health-record exchange | Digital Health / IT | P0 |
| HLTH-CON-007 | Are telemedicine consents captured for consultation mode, records, prescriptions and recordings where relevant? | Conditional | Telemedicine consent screen/SOP | Digital-consultation privacy risk | Telemedicine Owner | P0 |
| HLTH-CON-008 | Are parental/guardian consents reviewed for minor patients where required? | Children | Guardian consent records | Minor data risk | Pediatrics / Legal | P0 |
| HLTH-CON-009 | Is consent history linked to patient profile or processing activity where technically possible? | Evidence-heavy | System screenshots | Difficult to prove consent | IT / HIMS Owner | P1 |
| HLTH-CON-010 | Are consent preferences honoured across CRM, call centre, WhatsApp/SMS/email and marketing tools? | Conditional | Preference centre, suppression list | Consent withdrawal not operationalised | Marketing / IT | P1 |

---

## 9.7 Data Principal rights — RIGHTS

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-RGT-001 | Is there a defined process for patients to request access to their personal data/records where applicable? | Mandatory | Rights SOP, request form | Patients cannot exercise rights | Compliance / Medical Records | P1 |
| HLTH-RGT-002 | Are correction requests for demographic details, contact details or administrative errors supported? | Mandatory | Correction workflow | Inaccurate patient data | Front Office / IT | P1 |
| HLTH-RGT-003 | Is correction of clinical records handled through an appropriate medical review process rather than casual editing? | High-risk | Clinical amendment SOP | Clinical record integrity risk | Medical Director / Records | P0 |
| HLTH-RGT-004 | Are rights requests routed across HIMS, LIMS, PACS, billing, CRM and telemedicine systems? | Evidence-heavy | System workflow, ticket logs | Incomplete response | IT / DPDP Owner | P1 |
| HLTH-RGT-005 | Are requests from authorised representatives/attendants validated before records are shared? | High-risk | Authorisation validation process | Unauthorised disclosure | Medical Records / Legal | P0 |
| HLTH-RGT-006 | Are erasure/deletion requests evaluated against medical-record retention and legal obligations? | Mandatory | Rights SOP with retention exceptions | Improper deletion or refusal | Legal / Records | P1 |
| HLTH-RGT-007 | Is there a mechanism to track rights requests, owners, due dates and closure evidence? | Mandatory | Ticketing log/dashboard | Missed/late responses | DPDP Owner | P1 |
| HLTH-RGT-008 | Are patient portal rights/self-service features tested for identity verification and secure access? | Conditional | Portal test, access logs | Wrong patient access | IT/Product | P0 |
| HLTH-RGT-009 | Are staff trained to distinguish patient record requests from ordinary service requests? | Evidence-heavy | Training material, SOP | Misrouting of privacy requests | HR / Records | P2 |
| HLTH-RGT-010 | Are rights request trends reported to management? | Evidence-heavy | Monthly dashboard | No governance feedback loop | DPDP Owner | P3 |

---

## 9.8 Grievance redressal and contact publication — GRIEVANCE

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-GRV-001 | Is a privacy/data-protection contact published on website/app and patient-facing documents? | Mandatory | Website screenshot, notice | Patients cannot raise data concerns | Compliance / Legal | P0 |
| HLTH-GRV-002 | Is there a defined grievance workflow for patient-data complaints? | Mandatory | Grievance SOP | Complaints unmanaged | Compliance / Patient Relations | P1 |
| HLTH-GRV-003 | Are patient grievances, data-rights requests and clinical complaints classified separately while allowing linked handling? | Evidence-heavy | Ticket categories | Privacy issues lost in clinical complaints | Patient Relations / DPDP Owner | P1 |
| HLTH-GRV-004 | Are escalation paths defined for complaints involving report disclosure, wrong recipient, breach, employee misconduct or vendor error? | High-risk | Escalation matrix | Delayed incident response | Compliance / CISO | P0 |
| HLTH-GRV-005 | Are grievances linked to evidence and closure notes? | Mandatory | Ticket logs | Cannot prove resolution | Patient Relations | P1 |
| HLTH-GRV-006 | Are front-office, call-centre and patient-relations teams trained to identify DPDP/privacy grievances? | Evidence-heavy | Training records | Complaints missed | HR / Patient Relations | P2 |
| HLTH-GRV-007 | Is grievance performance visible to the DPDP owner and leadership? | Evidence-heavy | Dashboard/report | No oversight | DPDP Owner | P2 |
| HLTH-GRV-008 | Are grievances related to ABDM/data exchange routed to the appropriate digital health owner where applicable? | Conditional | ABDM grievance workflow | ABDM complaints mishandled | Digital Health Owner | P1 |

---

## 9.9 Retention, erasure and archival — RETENTION

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-RET-001 | Is there a documented retention schedule for OPD, IPD, emergency, lab, radiology, billing, insurance and pharmacy records? | Mandatory | Retention schedule | Over-retention or premature deletion | Records / Legal | P0 |
| HLTH-RET-002 | Are retention rules mapped to systems such as HIMS, LIMS, PACS, CRM, patient portal and telemedicine platform? | Evidence-heavy | System-retention matrix | Policy not implemented | IT / Records | P1 |
| HLTH-RET-003 | Are medical-record retention requirements legally reviewed before erasure/deletion requests are fulfilled? | High-risk | Legal review note | Improper deletion of medical record | Legal / Medical Records | P0 |
| HLTH-RET-004 | Are telemedicine recordings, chat transcripts and e-prescriptions assigned retention periods? | Conditional | Telemedicine retention policy | Digital records retained indefinitely | Telemedicine / IT | P1 |
| HLTH-RET-005 | Are lab samples, test orders, reports and source data assigned retention/archival rules? | Conditional | Lab retention SOP | Laboratory record risk | Lab Head | P1 |
| HLTH-RET-006 | Are radiology images and diagnostic reports governed by archival, retrieval and deletion policies? | Conditional | PACS retention settings | High-cost/high-risk retention | Radiology / IT | P1 |
| HLTH-RET-007 | Are insurance/TPA claim documents retained only for defined business/legal periods? | Conditional | Claims retention policy | Over-retention of claim data | Billing / TPA | P1 |
| HLTH-RET-008 | Is inactive patient portal/app account data reviewed for retention or deactivation? | Conditional | App retention settings | Dormant-account risk | Product / IT | P2 |
| HLTH-RET-009 | Are backups included in retention and deletion planning? | Evidence-heavy | Backup policy | Deleted data remains indefinitely | IT / CISO | P1 |
| HLTH-RET-010 | Is there an auditable deletion or archival workflow with approvals and logs? | Mandatory | Deletion logs, approval workflow | No proof of erasure | IT / Records | P1 |

---

## 9.10 Data accuracy and quality — ACCURACY

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-ACC-001 | Are patient identity and contact details verified at registration and major encounters? | Mandatory | Registration SOP | Wrong patient/report errors | Front Office | P1 |
| HLTH-ACC-002 | Are duplicate patient records detected and merged through controlled workflow? | Evidence-heavy | Duplicate management SOP | Fragmented clinical records | HIMS Owner / Records | P1 |
| HLTH-ACC-003 | Are lab/radiology reports linked to correct patient identifiers before release? | High-risk | Report verification SOP | Wrong-report disclosure/harm | Lab/Radiology | P0 |
| HLTH-ACC-004 | Are corrections to clinical records tracked with audit trail rather than overwritten silently? | High-risk | EMR audit logs | Record integrity failure | Medical Records / IT | P0 |
| HLTH-ACC-005 | Are ABHA/ABDM identifiers validated and linked correctly where used? | Conditional | ABDM linking records | Wrong record exchange | Digital Health / IT | P1 |
| HLTH-ACC-006 | Are insurance/TPA details verified before claim documents are shared? | Conditional | Claims verification checklist | Data sent to wrong payer/TPA | Billing / TPA | P1 |
| HLTH-ACC-007 | Are patient communication preferences and contact changes updated across systems? | Evidence-heavy | CRM/HIMS sync rules | Misdelivery of reports/messages | Operations / IT | P1 |
| HLTH-ACC-008 | Are AI/analytics datasets checked for data quality and bias where patient data is used? | AI-linked | Data quality review | Poor AI outputs and privacy risk | AI/Data Owner | P1 |

---

## 9.11 Security safeguards — SECURITY

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-SEC-001 | Are role-based access controls implemented for HIMS/EMR, LIMS, PACS, billing and patient portal systems? | Mandatory | RBAC matrix, screenshots | Excessive access to patient data | CISO / IT | P0 |
| HLTH-SEC-002 | Are privileged/admin access rights reviewed periodically? | Mandatory | Access review records | Insider/privilege misuse | CISO / IT | P1 |
| HLTH-SEC-003 | Are doctors, nurses, lab staff, billing staff and call-centre agents given access based on role and need? | Mandatory | Role mapping | Broad clinical data exposure | Medical Director / IT | P1 |
| HLTH-SEC-004 | Are patient records encrypted or otherwise protected at rest and in transit where technically feasible? | Evidence-heavy | Architecture/security evidence | Patient data exposure | CISO / IT | P0 |
| HLTH-SEC-005 | Are access logs enabled for patient record views, edits, downloads and report releases? | Evidence-heavy | Audit log screenshots | No misuse detection | IT / CISO | P0 |
| HLTH-SEC-006 | Are lab/radiology reports protected during email/SMS/WhatsApp/portal delivery? | High-risk | Secure delivery SOP | Report leakage | Lab/Radiology / IT | P0 |
| HLTH-SEC-007 | Are remote access/support sessions by HIMS/EMR vendors controlled and logged? | Vendor-linked | Vendor access logs | Uncontrolled vendor access | IT / Vendor Mgmt | P0 |
| HLTH-SEC-008 | Are telemedicine sessions protected through secure access, identity verification and controlled recording? | Conditional | Telemedicine security settings | Digital consultation breach | Telemedicine / IT | P0 |
| HLTH-SEC-009 | Are backups tested and protected against ransomware or accidental deletion? | Evidence-heavy | Backup test reports | Business continuity risk | IT / CISO | P1 |
| HLTH-SEC-010 | Are endpoint, network and Wi-Fi controls adequate in clinical and public areas? | Evidence-heavy | Security review report | System compromise | IT / CISO | P1 |
| HLTH-SEC-011 | Are CCTV, biometric and access-control systems secured and access-limited? | Conditional | Admin access list, retention settings | Facility surveillance data risk | Admin / Security | P2 |
| HLTH-SEC-012 | Are APIs/integrations between HIMS, LIMS, PACS, patient portal, ABDM and vendors secured and monitored? | Conditional | API security evidence | Integration data leakage | IT / App Owner | P0 |
| HLTH-SEC-013 | Are mobile devices/tablets used by doctors, home-care staff or sample-collection teams secured? | Conditional | MDM policy, device controls | Field data leakage | IT / Operations | P1 |
| HLTH-SEC-014 | Are data exports from HIMS/LIMS/PACS restricted, approved and logged? | High-risk | Export logs, approval workflow | Bulk patient-data leakage | IT / Records | P0 |

---

## 9.12 Personal data breach readiness — BREACH

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-BR-001 | Does the organisation have a personal data breach response playbook covering patient data? | Mandatory | Breach SOP/playbook | Delayed or incomplete response | CISO / Legal | P0 |
| HLTH-BR-002 | Does the playbook define what constitutes a patient-data breach, including wrong-report delivery and unauthorised record access? | Mandatory | Incident classification matrix | Breaches not recognised | CISO / DPDP Owner | P0 |
| HLTH-BR-003 | Are breach roles defined across IT, legal, medical records, patient relations, operations and leadership? | Mandatory | RACI/escalation matrix | Confused incident handling | COO / CISO | P0 |
| HLTH-BR-004 | Are affected patient notification templates prepared and reviewed? | Evidence-heavy | Notification template | Delayed communication | Legal / Patient Relations | P1 |
| HLTH-BR-005 | Is regulatory/Board notification support workflow prepared for DPDP breach obligations? | Evidence-heavy | Board intimation checklist | Missed statutory timeline | Legal / Compliance | P0 |
| HLTH-BR-006 | Are vendors required to notify the hospital of security incidents involving patient data promptly? | Vendor-linked | Contract clause, vendor SOP | Late vendor breach notification | Legal / Procurement | P0 |
| HLTH-BR-007 | Has the organisation conducted a tabletop drill for patient-data breach scenarios? | Evidence-heavy | Drill report | Playbook untested | CISO / DPDP Owner | P1 |
| HLTH-BR-008 | Are logs preserved for investigation across HIMS, LIMS, PACS, portal and cloud systems? | Evidence-heavy | Log retention settings | No forensic evidence | IT / CISO | P1 |
| HLTH-BR-009 | Is there a playbook for ransomware affecting patient systems and reports? | High-risk | Ransomware playbook, backup test | Patient service disruption | CISO / IT | P0 |
| HLTH-BR-010 | Are wrong-recipient report shares treated as privacy incidents and recorded? | High-risk | Incident register | Repeated disclosure risk | Lab / Patient Relations | P1 |
| HLTH-BR-011 | Are breach simulations conducted with external vendors such as HIMS, cloud, call centre and lab partners? | Vendor-linked | Vendor drill evidence | Vendor roles unclear | CISO / Vendor Mgmt | P2 |
| HLTH-BR-012 | Are incident reports reviewed to update controls, training and ROPA records? | Evidence-heavy | Post-incident review | No learning loop | DPDP Owner / CISO | P2 |

---

## 9.13 Vendor / Data Processor governance — VENDOR

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-VEN-001 | Is there a register of healthcare vendors processing patient, employee or visitor data? | Mandatory | Vendor processor register | Vendor blind spots | Procurement / Legal | P0 |
| HLTH-VEN-002 | Are HIMS/EMR/LIMS/PACS vendors classified by data processed, access rights and hosting model? | Vendor-linked | Vendor data map | Core clinical vendors not governed | IT / Procurement | P0 |
| HLTH-VEN-003 | Do contracts with technology vendors include confidentiality, security, breach notification and processing-purpose controls? | Evidence-heavy | Contracts/DPDP addendum | Weak processor obligations | Legal / Procurement | P0 |
| HLTH-VEN-004 | Are cloud/SaaS vendors assessed for data location, backup, sub-processors and access controls? | Conditional | Cloud review, DPA | Cloud/cross-border uncertainty | IT / Legal | P0 |
| HLTH-VEN-005 | Are lab, radiology, pharmacy, ambulance and home-care partners assessed for patient-data handling? | Conditional | Partner contracts/SOPs | External patient-data leakage | Operations / Legal | P1 |
| HLTH-VEN-006 | Are TPAs, insurers and corporate health clients mapped as data recipients/processors/controllers depending on role? | Conditional | Data sharing matrix | Role confusion | Billing / Legal | P1 |
| HLTH-VEN-007 | Are call-centre/CRM vendors restricted from downloading/exporting patient records unless authorised? | Conditional | Access controls, contract | Bulk leakage from support | Customer Support / IT | P1 |
| HLTH-VEN-008 | Are marketing/communications vendors prohibited from using patient data beyond authorised communication? | Conditional | Contract, campaign SOP | Secondary marketing misuse | Marketing / Legal | P1 |
| HLTH-VEN-009 | Are AI diagnostic/chatbot/analytics vendors reviewed for data use, retention and model-training restrictions? | AI-linked | AI vendor assessment | Patient data used for training | AI/Data / Legal | P0 |
| HLTH-VEN-010 | Are vendor access reviews conducted periodically and when staff/vendor contracts end? | Evidence-heavy | Access review logs | Orphaned access | IT / Procurement | P1 |
| HLTH-VEN-011 | Are sub-processors disclosed or at least contractually controlled for critical SaaS vendors? | Conditional | Sub-processor list | Hidden data chains | Legal / Procurement | P1 |
| HLTH-VEN-012 | Is vendor risk integrated into the DPDP Compass dashboard and remediation tracker? | Evidence-heavy | Vendor dashboard | No follow-up | DPDP Owner | P2 |

---

## 9.14 Children’s data and guardian consent — CHILD

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-CHD-001 | Does the organisation identify minor/pediatric patients in registration and clinical systems? | Conditional/High-risk | Age/DOB fields, workflow | Child data not recognised | Pediatrics / IT | P0 |
| HLTH-CHD-002 | Are parent/guardian details captured and verified where required? | Conditional | Guardian fields, forms | Wrong guardian/authority | Front Office / Legal | P0 |
| HLTH-CHD-003 | Are consent and authorisation workflows defined for minor patient treatment-related data sharing? | Conditional | Consent/authorisation SOP | Unauthorised child-data sharing | Medical Director / Legal | P0 |
| HLTH-CHD-004 | Are vaccination, pediatric, neonatal and school-health programme records treated as high-risk processing? | Conditional | ROPA records | Child health records under-protected | Pediatrics / DPDP Owner | P1 |
| HLTH-CHD-005 | Are minor patient reports shared only through verified parent/guardian channels? | Conditional | Report-release SOP | Report sent to wrong recipient | Records / Lab | P0 |
| HLTH-CHD-006 | Are children’s data uses for marketing, wellness plans, research or analytics specifically reviewed? | Conditional | Legal/ethics review | Secondary use of child data | Legal / Research | P0 |
| HLTH-CHD-007 | Are pediatric telemedicine sessions and recordings subject to guardian-consent review? | Conditional | Telemedicine consent logs | Child telehealth risk | Telemedicine / Legal | P0 |
| HLTH-CHD-008 | Are vendors processing minor patient data identified and contractually controlled? | Vendor-linked | Vendor register | Child data with unmanaged vendors | Procurement / Legal | P1 |

---

## 9.15 Cross-border transfer and cloud/SaaS risk — CROSSBORDER

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-CB-001 | Does the organisation know where patient data is stored and processed across HIMS, EMR, LIMS, PACS, portal and cloud systems? | Mandatory | Data location register | Unknown data residency | IT / Legal | P0 |
| HLTH-CB-002 | Are cloud regions, backup locations and support-access locations documented for healthcare SaaS vendors? | Conditional | Vendor cloud documentation | Hidden cross-border access | IT / Procurement | P0 |
| HLTH-CB-003 | Are overseas telemedicine, teleradiology or remote specialist-review workflows identified? | Conditional | Process map, contracts | Cross-border medical data flows | Medical Director / Legal | P1 |
| HLTH-CB-004 | Are foreign AI/API vendors processing patient data reviewed for location, retention and training use? | AI-linked | AI vendor DPA/settings | Patient data leaves control | AI/Data / Legal | P0 |
| HLTH-CB-005 | Are integrations with global communication platforms, cloud drives or support tools reviewed for patient-data transfer? | Conditional | Tool inventory, DPA | Informal cross-border sharing | IT / Operations | P1 |
| HLTH-CB-006 | Is cross-border transfer status marked as Unknown until vendor documentation confirms location and access? | Evidence-heavy | Data location evidence | False assurance | DPDP Owner | P1 |
| HLTH-CB-007 | Are future government restrictions or sector expectations monitored through legal/compliance review? | Evidence-heavy | Legal update register | Outdated compliance posture | Legal | P2 |

---

## 9.16 SDF, DPIA, audit and AI/algorithmic risk readiness — SDF_AI

| Code | Assessment question | Type | Evidence to check | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| HLTH-AI-001 | Has the organisation identified all AI/ML/analytics tools using patient, clinical, imaging, lab or operational data? | AI-linked | AI inventory | Shadow AI use | AI/Data Owner | P0 |
| HLTH-AI-002 | Are AI triage, diagnosis support, radiology AI, chatbot and risk-scoring tools reviewed before deployment? | AI-linked/High-risk | AI review checklist | Patient harm/privacy risk | Medical Director / AI Owner | P0 |
| HLTH-AI-003 | Is personal data minimised, masked or de-identified before use in AI/analytics where feasible? | AI-linked | Data minimisation evidence | Excess data in AI systems | AI/Data / CISO | P1 |
| HLTH-AI-004 | Are prompts and document uploads into public AI tools controlled for patient data? | AI-linked/High-risk | AI usage policy, DLP controls | Staff may upload records to public AI | CISO / HR | P0 |
| HLTH-AI-005 | Is human review required for AI-generated clinical, triage, eligibility or patient-support outputs? | AI-linked/High-risk | Human review SOP | Automated decisions without review | Medical Director | P0 |
| HLTH-AI-006 | Are AI vendors restricted from training models on patient data unless explicitly authorised and reviewed? | AI-linked/Vendor | Contract clauses | Secondary use/model training risk | Legal / Procurement | P0 |
| HLTH-AI-007 | Are DPIA-style reviews performed for high-risk digital health, AI, telemedicine, ABDM or large-scale processing activities? | Evidence-heavy | DPIA templates/reports | High-risk projects not assessed | DPDP Owner / Legal | P1 |
| HLTH-AI-008 | Are periodic audits conducted for access logs, patient data exports, vendor access and AI tools? | Evidence-heavy | Audit reports | Controls not monitored | Internal Audit / CISO | P1 |
| HLTH-AI-009 | Are algorithmic systems tested for accuracy, bias, explainability and clinical safety before use? | AI-linked | Model validation records | Unsafe or discriminatory outputs | Clinical Governance / AI Owner | P1 |
| HLTH-AI-010 | If the organisation may qualify as a Significant Data Fiduciary in future, is there readiness for DPIA, audit and governance obligations? | Conditional | SDF readiness note | Future compliance gap | Executive Sponsor / Legal | P2 |

---

## 10. Suggested ROPA records for healthcare

These records should be suggested automatically by DPDP Compass when the healthcare industry is selected.

| ROPA code | Processing activity | Typical owner | Default risk | Mandatory fields to confirm |
|---|---|---|---|---|
| ROPA-HLTH-001 | OPD patient registration | Front Office | High | Data fields, notice, HIMS, retention |
| ROPA-HLTH-002 | Appointment booking and reminders | Operations | Medium | Contact data, SMS/WhatsApp vendor, opt-out |
| ROPA-HLTH-003 | Doctor consultation and clinical notes | Medical Records | High | EMR, access, retention, clinical amendments |
| ROPA-HLTH-004 | IPD admission and inpatient care | Operations / Nursing | High | Attendant data, bed system, nursing notes |
| ROPA-HLTH-005 | Emergency care registration | Emergency | High | Emergency contact, urgency, later notice process |
| ROPA-HLTH-006 | Discharge summary generation | Medical Records | High | Report sharing, doctor approval, retention |
| ROPA-HLTH-007 | Lab test ordering and sample collection | Lab | High | LIMS, sample ID, home collection vendor |
| ROPA-HLTH-008 | Lab report generation and delivery | Lab | High | Portal/email/WhatsApp, identity verification |
| ROPA-HLTH-009 | Radiology imaging and report workflow | Radiology | High | PACS/RIS, image retention, specialist access |
| ROPA-HLTH-010 | Pharmacy/e-prescription fulfilment | Pharmacy | Medium/High | Prescription data, medicine delivery, retention |
| ROPA-HLTH-011 | Billing and payment processing | Billing | Medium/High | Payment gateway, receipts, financial records |
| ROPA-HLTH-012 | Insurance/TPA claims processing | TPA Desk | High | Insurer sharing, documents, authorisation |
| ROPA-HLTH-013 | Patient portal/mobile app account | Digital/Product | High | Login, reports, consent, app permissions |
| ROPA-HLTH-014 | Telemedicine consultation | Telemedicine | High | Video/chat, recording, e-prescription |
| ROPA-HLTH-015 | ABDM health-record exchange | Digital Health | High | ABHA, HIP/HIU, consent artefact |
| ROPA-HLTH-016 | Patient grievance handling | Patient Relations | Medium/High | Complaint data, resolution, escalation |
| ROPA-HLTH-017 | Marketing/wellness campaign | Marketing | Medium/High | Consent, segmentation, unsubscribe |
| ROPA-HLTH-018 | Corporate health check-up programme | Corporate Health | High | Employer sharing, reports, purpose limitation |
| ROPA-HLTH-019 | Home healthcare visit | Home Care | High | Field app, location, staff access |
| ROPA-HLTH-020 | Ambulance/emergency transport | Emergency/Admin | Medium/High | Location, health status, dispatch system |
| ROPA-HLTH-021 | HRMS and payroll | HR | Medium | Employee data, vendor, retention |
| ROPA-HLTH-022 | Biometric attendance | HR/Admin | High | Biometric purpose, retention, access |
| ROPA-HLTH-023 | CCTV and visitor management | Admin/Security | Medium | Purpose, retention, access controls |
| ROPA-HLTH-024 | Research study / clinical research data | Research/Ethics | High | Consent/ethics, de-identification |
| ROPA-HLTH-025 | AI diagnostic/triage/chatbot processing | AI/Data Owner | High | AI vendor, human review, minimisation |

---

## 11. Evidence checklist for healthcare assessment

### 11.1 Governance evidence

| Evidence | Supports |
|---|---|
| DPDP/privacy owner appointment | Governance maturity |
| Privacy committee charter and minutes | Management oversight |
| Department owner matrix | Accountability |
| Staff confidentiality policy | Workforce control |
| Training records | Awareness and implementation |
| Privacy risk register | Ongoing governance |

### 11.2 Patient notice and consent evidence

| Evidence | Supports |
|---|---|
| OPD/IPD privacy notice | Notice at collection point |
| Website/app privacy notice | Digital transparency |
| Telemedicine privacy notice | Digital consultation transparency |
| Clinical consent form | Clinical consent tracking; not enough by itself for DPDP |
| DPDP consent records | Consent proof |
| Marketing consent and unsubscribe logs | Marketing processing control |
| Guardian consent forms | Minor patient data handling |
| ABDM consent flow screenshots | ABDM exchange governance where applicable |

### 11.3 System and security evidence

| Evidence | Supports |
|---|---|
| HIMS/EMR/LIMS/PACS system inventory | Data inventory |
| RBAC matrix | Access control |
| User access review | Least privilege |
| Access logs | Monitoring and audit |
| Export logs | Bulk data control |
| Encryption/backup evidence | Security safeguards |
| Vulnerability/security audit report | Security maturity |
| API integration diagram | Data-flow visibility |
| Vendor remote access logs | Processor/vendor access control |

### 11.4 ROPA and retention evidence

| Evidence | Supports |
|---|---|
| ROPA / processing register | Processing visibility |
| Data-flow diagrams | Processing lifecycle |
| Medical records retention schedule | Retention maturity |
| Deletion/archival SOP | Erasure control |
| Backup retention settings | Real lifecycle control |
| Records request SOP | Rights request handling |

### 11.5 Vendor evidence

| Evidence | Supports |
|---|---|
| Vendor register | Processor visibility |
| HIMS/EMR/LIMS contracts | Critical technology vendor control |
| Cloud/SaaS DPA or contract | Cloud processor control |
| TPA/insurer sharing agreements | External disclosure governance |
| Call centre contract | Patient support data control |
| AI vendor review | AI data risk |
| Sub-processor list | Downstream processing control |
| Vendor breach notification clause | Incident readiness |

### 11.6 Breach evidence

| Evidence | Supports |
|---|---|
| Personal data breach playbook | Breach readiness |
| Incident classification matrix | Breach identification |
| Escalation matrix | Ownership |
| Patient notification template | Affected Data Principal communication |
| Board/regulatory intimation checklist | DPDP readiness |
| Tabletop drill report | Operational readiness |
| Post-incident review | Continuous improvement |

---

## 12. Dynamic question triggers for healthcare

| Trigger field | Trigger condition | Add question pack |
|---|---|---|
| `industryCode` | healthcare | `HEALTHCARE_OVERLAY_V1` |
| `hasHIMS` | true | `HIMS_SECURITY_V1` |
| `hasEMR` | true | `EMR_RECORDS_V1` |
| `hasLIMS` | true | `LAB_DIAGNOSTICS_V1` |
| `hasPACS` | true | `RADIOLOGY_PACS_V1` |
| `telemedicineUsed` | true | `TELEMEDICINE_V1` |
| `patientPortalOrApp` | true | `PATIENT_PORTAL_APP_V1` |
| `abdmIntegrated` | true | `ABDM_HEALTH_DATA_EXCHANGE_V1` |
| `childrenDataProcessed` | true/unknown | `CHILDREN_HEALTH_DATA_V1` |
| `vendorsUsed` | true | `HEALTHCARE_VENDOR_PROCESSOR_V1` |
| `insuranceTpaSharing` | true | `TPA_INSURANCE_SHARING_V1` |
| `cloudHosted` | true | `CLOUD_CROSSBORDER_V1` |
| `crossBorderProcessingKnown` | unknown | `CROSSBORDER_REVIEW_V1` |
| `aiUsage` | true | `HEALTHCARE_AI_RISK_V1` |
| `marketingUsed` | true | `HEALTHCARE_MARKETING_V1` |
| `researchAnalyticsUsed` | true | `RESEARCH_ANALYTICS_V1` |
| `biometricAttendance` | true | `BIOMETRIC_ACCESS_CONTROL_V1` |
| `cctvVisitorManagement` | true | `CCTV_VISITOR_V1` |
| `homeHealthcare` | true | `HOME_HEALTHCARE_FIELD_DATA_V1` |

---

## 13. Conditional mini-packs to create in the product

### 13.1 Telemedicine mini-pack

Ask when `telemedicineUsed = true`.

| Code | Question | Domain |
|---|---|---|
| TEL-HLTH-001 | Are patients informed about telemedicine data processing before consultation? | NOTICE |
| TEL-HLTH-002 | Are video/chat recordings controlled and retained only as defined? | RETENTION |
| TEL-HLTH-003 | Are e-prescriptions protected and shared securely? | SECURITY |
| TEL-HLTH-004 | Are telemedicine vendors contractually controlled? | VENDOR |
| TEL-HLTH-005 | Are telemedicine data flows recorded in ROPA? | ROPA |
| TEL-HLTH-006 | Are doctor-patient identity checks defined for remote consultations? | ACCURACY / SECURITY |
| TEL-HLTH-007 | Is consent/authorisation captured for recording where applicable? | CONSENT |
| TEL-HLTH-008 | Are telemedicine breach scenarios included in the incident playbook? | BREACH |

### 13.2 Lab and diagnostics mini-pack

Ask when `hasLIMS = true` or organisation type includes lab/diagnostics.

| Code | Question | Domain |
|---|---|---|
| LAB-HLTH-001 | Is sample collection data mapped from order to report delivery? | ROPA |
| LAB-HLTH-002 | Are report-release controls designed to prevent wrong-recipient disclosure? | SECURITY |
| LAB-HLTH-003 | Are home sample collection staff and vendors governed? | VENDOR |
| LAB-HLTH-004 | Are report sharing channels secured? | SECURITY |
| LAB-HLTH-005 | Are lab report retention periods defined? | RETENTION |
| LAB-HLTH-006 | Are lab system access logs enabled? | SECURITY |
| LAB-HLTH-007 | Are panic/critical reports handled through controlled notification process? | PURPOSE / SECURITY |
| LAB-HLTH-008 | Are lab partner data-sharing arrangements documented? | VENDOR |

### 13.3 ABDM mini-pack

Ask when `abdmIntegrated = true`.

| Code | Question | Domain |
|---|---|---|
| ABDM-HLTH-001 | Is the organisation’s role as HIP/HIU or other ABDM participant documented? | GOV / ROPA |
| ABDM-HLTH-002 | Are ABHA collection/linking workflows documented? | INV / PURPOSE |
| ABDM-HLTH-003 | Are ABDM consent artefact flows understood and evidenced? | CONSENT |
| ABDM-HLTH-004 | Are health-record exchange APIs secured and logged? | SECURITY |
| ABDM-HLTH-005 | Are ABDM integration vendors/processors documented? | VENDOR |
| ABDM-HLTH-006 | Are patient grievances related to ABDM exchange routed appropriately? | GRIEVANCE |
| ABDM-HLTH-007 | Are ABDM data-flow records linked to ROPA? | ROPA |
| ABDM-HLTH-008 | Are sandbox/security audit or integration approval records maintained? | SECURITY / EVIDENCE |

### 13.4 Healthcare AI mini-pack

Ask when `aiUsage = true`.

| Code | Question | Domain |
|---|---|---|
| AI-HLTH-001 | Is the AI use case clinical, administrative, operational or marketing? | ROPA |
| AI-HLTH-002 | Does the AI use patient/health data directly or indirectly? | INV |
| AI-HLTH-003 | Is human review mandatory for AI-generated patient-facing or clinical outputs? | SDF_AI |
| AI-HLTH-004 | Are AI inputs, prompts and logs protected against patient data exposure? | SECURITY |
| AI-HLTH-005 | Are model-training restrictions included in AI vendor contracts? | VENDOR |
| AI-HLTH-006 | Has a DPIA-style risk review been performed? | SDF_AI |
| AI-HLTH-007 | Are outputs monitored for accuracy, bias and inappropriate recommendations? | SDF_AI |
| AI-HLTH-008 | Are patients informed where AI materially affects service interaction? | NOTICE |

---

## 14. Healthcare red flags and scoring considerations

| Red flag | Suggested score impact | Default gap priority |
|---|---|---|
| No patient data inventory across core systems | Cap overall score around 55 | P0 |
| No ROPA for OPD/IPD/lab/telemedicine workflows | Cap around 60 | P0 |
| No privacy notice at patient data collection points | Cap around 60 | P0 |
| Clinical consent used as substitute for all DPDP consent decisions | Cap around 65 | P0 |
| No breach playbook for patient data | Cap around 65 | P0 |
| No access logs for HIMS/EMR/LIMS/PACS | Cap around 60 | P0 |
| No vendor register for HIMS/cloud/lab/TPA/call-centre vendors | Cap around 70 | P0/P1 |
| Patient reports shared over unsecured channels without controls | Critical red flag | P0 |
| Minor patient data without guardian workflow review | Critical red flag | P0 |
| AI diagnostics/triage using patient data without human review/privacy review | Critical red flag | P0 |
| ABDM integration without documented consent/data-flow/security controls | High/critical | P0 |
| No retention schedule for medical and diagnostic records | High | P1 |
| No process for patient rights/record requests | High | P1 |
| High claimed score but evidence confidence below 25% | Cap around 60 | P1 |

---

## 15. Healthcare dashboard additions

DPDP Compass should show a healthcare process view in addition to the 16-domain scorecard.

### 15.1 Healthcare process dashboard

| Process | Linked domains | Dashboard metric |
|---|---|---|
| OPD / Registration | Notice, purpose, inventory, ROPA | Notice and data-field completeness |
| IPD / Clinical care | ROPA, security, retention, rights | Patient record governance |
| Lab / Diagnostics | Security, retention, vendor, breach | Report sharing risk |
| Radiology / PACS | Security, retention, access logs | Imaging-data control |
| Billing / TPA | Purpose, vendor, retention, rights | External disclosure risk |
| Telemedicine | Notice, consent, security, vendor | Digital consultation readiness |
| Patient portal/app | Notice, consent, security, rights | Portal/app privacy readiness |
| ABDM integration | Consent, security, ROPA, grievance | ABDM data-exchange readiness |
| AI / Analytics | AI risk, purpose, vendor, security | AI privacy readiness |
| HR / Contractors | Inventory, retention, security | Workforce data readiness |

### 15.2 Healthcare executive dashboard cards

| Card | Purpose |
|---|---|
| Patient Data Inventory Completion | Shows visibility across systems |
| ROPA Completion | Processing activity readiness |
| Clinical System Access Risk | HIMS/EMR/LIMS/PACS access maturity |
| Report Sharing Risk | Lab/radiology/patient portal delivery controls |
| Telemedicine Readiness | Digital consultation risk |
| ABDM Readiness | Health data exchange readiness |
| Vendor Processor Risk | HIMS/cloud/TPA/vendor control |
| Breach Readiness | Patient-data breach preparedness |
| AI Health Data Risk | AI tool governance |
| Evidence Confidence | Proof-backed maturity |

---

## 16. Healthcare report additions

The healthcare assessment report should include these extra sections:

1. Healthcare DPDP context
2. Patient data lifecycle map
3. OPD/IPD/lab/radiology/telemedicine processing view
4. HIMS/EMR/LIMS/PACS system-risk summary
5. Patient notice and consent review summary
6. Clinical consent vs DPDP consent observation
7. ROPA maturity for healthcare processes
8. Patient report sharing and communication risk
9. Vendor and processor risk summary
10. ABDM readiness section, if applicable
11. AI and health analytics risk section, if applicable
12. Breach readiness for patient data
13. 30/60/90-day healthcare remediation roadmap
14. Evidence index
15. Legal/assessment caveat

---

## 17. Suggested 30/60/90-day remediation roadmap for healthcare

### First 30 days — Foundation and high-risk controls

| Action | Owner |
|---|---|
| Appoint DPDP/privacy owner and governance committee | Executive Sponsor |
| Create patient data inventory across HIMS/EMR/LIMS/PACS/billing/portal | DPDP Owner + IT |
| Create top 10 healthcare ROPA records | DPDP Owner + Department Heads |
| Publish/update patient privacy notice | Legal + Operations |
| Create breach response playbook for patient data | CISO + Legal |
| Create critical vendor register | Procurement + IT |
| Review report sharing controls | Lab/Radiology + IT |

### Days 31–60 — Evidence and process operationalisation

| Action | Owner |
|---|---|
| Link notices, consents and ROPA records | Legal + DPDP Owner |
| Review access controls for HIMS/EMR/LIMS/PACS | IT + Medical Director |
| Add vendor DPDP/security clauses | Legal + Procurement |
| Define retention schedule | Records + Legal |
| Create rights and grievance workflow | Compliance + Patient Relations |
| Train staff on confidentiality and data sharing | HR + Medical Director |
| Conduct breach tabletop drill | CISO + Operations |

### Days 61–90 — Assurance and reassessment

| Action | Owner |
|---|---|
| Review evidence and close P0/P1 gaps | DPDP Owner |
| Complete ROPA for all major processes | Department Owners |
| Test rights request workflow | Compliance |
| Test report-release controls | Lab/Radiology |
| Review telemedicine/ABDM/AI workflows where applicable | Digital Health / AI Owner |
| Generate reassessment score | DPDP Owner + Consultant |
| Present board/management readiness report | Executive Sponsor |

---

## 18. UAT scenario for healthcare template

Create a demo tenant:

```text
Organisation: CarePlus Multi-Specialty Hospital
Industry: Healthcare
Departments: OPD, IPD, Emergency, Lab, Radiology, Pharmacy, Billing/TPA, IT, HR, Legal, Patient Relations
Systems: HIMS, EMR, LIMS, PACS, Billing, Patient Portal, Telemedicine Platform, HRMS, CRM
Vendors: HIMS vendor, cloud provider, lab partner, TPA, payment gateway, SMS/WhatsApp vendor, telemedicine platform, cybersecurity vendor
Risk triggers: Children’s data = Yes, Telemedicine = Yes, ABDM = Yes, AI = Yes, Cloud = Yes, Cross-border = Unknown
```

### UAT flow

1. Register CarePlus Hospital.
2. Select Healthcare industry.
3. Complete scope wizard.
4. Confirm OPD/IPD/lab/radiology/telemedicine/ABDM/AI triggers.
5. Generate assessment.
6. Verify healthcare overlay and mini-packs appear.
7. Assign questions to Legal, IT, Lab, Radiology, Telemedicine, Billing, HR and Procurement.
8. Submit sample responses with weak evidence.
9. Upload sample privacy notice, HIMS access matrix and draft breach SOP.
10. Create ROPA records for OPD registration, lab report delivery, telemedicine and TPA claims.
11. Calculate score and evidence confidence.
12. Generate gaps/actions.
13. Review healthcare process dashboard.
14. Generate executive report.
15. Close selected gaps.
16. Run 30-day reassessment.

### Expected UAT outputs

| Output | Expected result |
|---|---|
| Healthcare questions | Relevant and process-specific |
| Conditional packs | Telemedicine, ABDM, AI, children, vendor, cloud appear |
| ROPA | Healthcare process records generated |
| Evidence | Patient notice/security/breach/vendor evidence linked |
| Score | Evidence-capped and explainable |
| Gaps | Patient-data risks clearly visible |
| Dashboard | Healthcare process view useful to leadership |
| Report | Board-ready and healthcare-specific |

---

## 19. Notes for AI coding agent

Use this file to seed the healthcare industry template.

### Required seed objects

```json
{
  "industryCode": "healthcare",
  "templateCode": "HEALTHCARE_OVERLAY_V1",
  "questionPacks": [
    "HEALTHCARE_CORE_OVERLAY_V1",
    "HIMS_SECURITY_V1",
    "LAB_DIAGNOSTICS_V1",
    "RADIOLOGY_PACS_V1",
    "TELEMEDICINE_V1",
    "PATIENT_PORTAL_APP_V1",
    "ABDM_HEALTH_DATA_EXCHANGE_V1",
    "HEALTHCARE_VENDOR_PROCESSOR_V1",
    "CHILDREN_HEALTH_DATA_V1",
    "HEALTHCARE_AI_RISK_V1"
  ]
}
```

### Question import rules

- Each question must map to exactly one primary DPDP Compass domain.
- A question may have secondary tags such as `telemedicine`, `lab`, `abdm`, `ai`, `vendor`, `children`.
- High-risk questions should require evidence and reviewer approval before being marked not applicable.
- Healthcare template should generate ROPA suggestions automatically.
- AI Assistant must not provide clinical advice or legal certification.
- AI Assistant may explain DPDP/data-processing implications, evidence needs and ROPA drafts.

### Healthcare AI Assistant restrictions

The AI Assistant must not:

- provide medical diagnosis,
- override a doctor’s clinical judgment,
- certify DPDP compliance,
- approve evidence,
- close gaps,
- determine final legal basis,
- advise deletion of medical records without legal/clinical records review,
- use patient data outside the current tenant context.

---

## 20. Final healthcare template summary

| Area | Decision |
|---|---|
| Industry template | Healthcare / Hospitals / Clinics / Diagnostics |
| Use | Industry overlay on core DPDP assessment |
| Risk level | High |
| Key processes | OPD, IPD, emergency, lab, radiology, pharmacy, billing, TPA, telemedicine, patient portal, ABDM, AI |
| Key systems | HIMS, EMR, LIMS, PACS, CRM, billing, patient portal, telemedicine, HRMS |
| Key vendors | HIMS, cloud, lab, TPA, telemedicine, payment, CRM, AI, IT support |
| Mandatory mini-packs | Healthcare core, vendor, breach, security, ROPA |
| Conditional mini-packs | Telemedicine, ABDM, AI, children, lab, radiology, cloud, marketing |
| ROPA priority | Very high |
| Evidence priority | Very high |
| Breach readiness | P0 |
| First UAT scenario | CarePlus Multi-Specialty Hospital |
| MVP readiness | Suitable for product seed and consultant-led assessment |

---

## 21. Sources consulted for healthcare-specific context

The following sources were consulted as current healthcare-sector context. They should be used for product design and assessment context; final legal interpretation should be reviewed by counsel.

1. ABDM / National Health Authority FAQ and Health Data Management Policy pages — for ABDM, consent-based exchange, Health Information Exchange and Consent Manager, privacy-by-design and digital health ecosystem context.  
   - https://abdm.gov.in/FAQ  
   - https://abdm.gov.in/publications/policies_regulations/health_data_management_policy
2. PIB / MoHFW updates on ABDM — for health data exchange, consent, HIE-CM and ABDM security/sandbox context.  
   - https://www.pib.gov.in/PressReleasePage.aspx?PRID=2152537  
   - https://www.pib.gov.in/PressReleasePage.aspx?PRID=1942715
3. Telemedicine Practice Guidelines and PIB summary — for telemedicine norms including informed consent, medical records, privacy and security of patient records.  
   - https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1740756
4. Electronic Health Record Standards for India, 2016 / MoHFW and PIB summary — for capture, storage, transmission, use and interoperability of healthcare information.  
   - https://www.mohfw.gov.in/sites/default/files/EMR-EHR_Standards_for_India_as_notified_by_MOHFW_2016_0.pdf  
   - https://www.pib.gov.in/PressReleasePage.aspx?PRID=1515666
5. Clinical Establishments Act / Central Government Rules portal — for clinical establishment regulatory context and medical records standards references.  
   - https://clinicalestablishments.mohfw.gov.in/en/rules-central
6. NMC / Medical ethics references — for patient confidentiality and medical-record maintenance context.  
   - https://www.nmc.org.in/rules-regulations/code-of-medical-ethics-regulations-2002/1000/

---

## 22. Approval checkpoint

This file completes the healthcare industry overlay for DPDP Compass.

Recommended next industry file:

```text
05_SaaS_Technology_DPDP_Questions.md
```

