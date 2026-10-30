# 09 — Public Sector DPDP Questions
## TrustStack™ DPDP Compass — Industry Question Bank

**Industry:** Public Sector / Government Departments / State Agencies / Municipal Corporations / Urban Local Bodies / Statutory Authorities / Regulators / Public Sector Undertakings / Government-linked Institutions  
**Use in product:** Industry overlay on top of the Core 16-Domain DPDP Compass Assessment  
**Version:** v1.0  
**Prepared for:** TrustStack™ DPDP Compass assessment engine, consultant-led assessments, ROPA module, evidence review, dashboards/reports, and AI Assistant guidance

---

## 1. How to use this industry file

This file is an **industry overlay**. It must not replace the core DPDP Compass assessment.

The correct assessment design is:

```text
Core DPDP Compass 16-domain assessment
+ Public Sector / Government-linked industry overlay
+ Conditional packs: citizen services, beneficiary/scheme data, Aadhaar/eKYC, DigiLocker/API integrations, open data/public disclosure, vendors/system integrators, field operations, children/vulnerable groups, AI/analytics, cloud/cross-border, breach
+ Organisation-specific dynamic questions for schemes, services, portals, departments, field offices, systems, vendors, public counters and ROPA records
```

The Public Sector overlay should be used for:

- Central and State Government departments;
- municipal corporations, urban local bodies, development authorities and district administrations;
- statutory authorities, boards, commissions and regulators;
- public sector undertakings and government-controlled corporations;
- government-linked service-delivery bodies;
- public-service portals, citizen-service centres and assisted-service models;
- government project implementation units and special-purpose digital missions;
- scheme, subsidy, benefit, certificate, license, permit, grievance, tax, utility and enforcement workflows.

Important positioning:

> Public-sector DPDP readiness is not only a technology or privacy-notice exercise. It is about accountable, secure and transparent handling of citizen, beneficiary, employee, vendor and public-service data across schemes, portals, field offices, vendors, APIs and published datasets.

---

## 2. Research and regulatory baseline used

This question bank is designed around the DPDP Compass framework, Indian public-sector operating reality and current government digital-service context.

### 2.1 DPDP baseline

The Public Sector template maps to the same 16 domains used across all DPDP Compass assessments:

| No. | Code | Domain | Weight |
|---:|---|---|---:|
| 1 | GOV | Governance, accountability and DPDP ownership | 7 |
| 2 | INV | Personal data discovery and inventory | 8 |
| 3 | ROPA | Records of Processing Activities / Processing Activity Register | 6 |
| 4 | PURPOSE | Purpose, lawful basis and data minimisation | 7 |
| 5 | NOTICE | Notice management | 7 |
| 6 | CONSENT | Consent and consent withdrawal | 7 |
| 7 | RIGHTS | Data Principal rights | 7 |
| 8 | GRIEVANCE | Grievance redressal and contact publication | 5 |
| 9 | RETENTION | Retention, erasure and archival | 6 |
| 10 | ACCURACY | Data accuracy and quality | 4 |
| 11 | SECURITY | Security safeguards | 10 |
| 12 | BREACH | Personal data breach readiness | 8 |
| 13 | VENDOR | Vendor / Data Processor governance | 7 |
| 14 | CHILD | Children's data and guardian consent | 4 |
| 15 | CROSSBORDER | Cross-border transfer and cloud/SaaS risk | 3 |
| 16 | SDF_AI | SDF, DPIA, audit and AI/algorithmic risk readiness | 4 |

### 2.2 Public-sector references to consider

These references should be treated as **sector context**, not as a substitute for legal advice, departmental legal review or government direction.

| Reference | Use in this public-sector overlay | URL |
|---|---|---|
| Digital Personal Data Protection Act, 2023 | Baseline law for digital personal data processing, roles, duties, consent/legitimate use, rights and penalties. | https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023-1.pdf |
| Digital Personal Data Protection Rules, 2025 | Operational rules for notice, safeguards, breach intimation, children, rights, grievance and Consent Manager regime. | https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025 |
| Guidelines for Indian Government Websites and Apps (GIGW 3.0) | Government website/app guidance; useful for privacy policy, accessibility, authenticity, lifecycle and digital-service design. | https://guidelines.india.gov.in/gigw3/ |
| GIGW Website Policies / Privacy Policy guidance | Useful for government portals collecting personal information through websites and apps. | https://guidelines.india.gov.in/website-policies/ |
| CERT-In Cyber Security Directions under Section 70B | Cyber incident reporting/logging/time synchronisation context for government systems and service providers. | https://www.cert-in.org.in/Directions70B.jsp |
| API Setu / Open API Policy and security responsibilities | Government API/data-sharing integration context; useful for interdepartmental and citizen-service APIs. | https://apisetu.gov.in/api-policy |
| DigiLocker FAQ and partner guidance | Citizen-consent based document access/share/verification context for public digital documents. | https://www.digilocker.gov.in/web/about/faq |
| UIDAI Aadhaar legal framework and regulations | Aadhaar authentication/offline verification/data-sharing context; useful for identity/eKYC flows. | https://www.uidai.gov.in/en/about-uidai/legal-framework/regulations.html |
| Open Government Data Platform policies | Open data publication context; useful for ensuring personal information is not disclosed through open data. | https://www.data.gov.in/policies |
| National e-Governance Division privacy policy | Example public digital-service privacy policy context for integrated Digital India ecosystem services. | https://negd.gov.in/privacy-policy/ |

### 2.3 Important assessment caution

Public-sector entities may process data under service-delivery, statutory, administrative, contractual, consent-based or certain legitimate-use contexts. DPDP Compass should **not automatically assume that all processing is exempt, lawful or consent-based**. The assessment should document purpose, necessity, authority, notice position, rights/grievance route, retention, safeguards, vendor contracts, breach readiness and evidence.

---

## 3. Public-sector DPDP context

Public authorities hold some of the broadest and most trust-sensitive datasets in India. They may collect personal data because citizens apply for services, benefits, certificates, subsidies, utilities, permissions, grievance redressal, employment, procurement participation or public interactions.

The risk profile is different from a private SaaS or e-commerce company because:

- citizens may have limited choice when dealing with public services;
- records can relate to vulnerable persons, households and entitlements;
- data may be shared across departments, vendors and field offices;
- public disclosure, RTI replies, dashboards and open data can unintentionally reveal personal data;
- systems often combine legacy applications, spreadsheets, vendor portals and new digital public infrastructure;
- breach impact can be large-scale and reputationally serious;
- outsourced operators, kiosks and system integrators may handle sensitive citizen data.

---

## 4. Typical Data Principal groups

| Data Principal group | Examples |
|---|---|
| Citizens / residents | Users of public services, portals, schemes, certificates and utilities |
| Applicants | License, permit, registration, property, tax, grievance, scholarship, pension and benefit applicants |
| Beneficiaries | Welfare, subsidy, DBT, ration, housing, health, education, labour and social protection beneficiaries |
| Children / students | Scholarship, nutrition, health, welfare, school or child-protection records |
| Parents / guardians | Guardian details, family relationships and consent/authorisation workflows |
| Senior citizens / persons with disabilities | Pension, support schemes, health/social care, accessibility requests |
| Farmers / workers / labourers | Agriculture, labour, welfare, occupational, field-survey and benefit records |
| Employees / officers | Government employees, public servants, pensioners, trainees and contractual workers |
| Vendors / contractors | Bidders, suppliers, consultants, service providers and agency personnel |
| Complainants / whistleblowers | Grievance, vigilance, complaints, appeals and case records |
| Visitors | Office entry, CCTV, gate passes and meeting records |
| Businesses / institutions | Proprietors, directors, authorised representatives and contact persons |

---

## 5. Typical personal data categories

| Category | Examples |
|---|---|
| Identity data | Name, DOB, gender, photograph, Aadhaar-related data where applicable, PAN, voter ID, driving license |
| Contact data | Mobile, email, address, emergency contact |
| Family/household data | Family members, dependents, guardian/parent details, relationship data |
| Financial data | Bank account, payment reference, income, subsidy, tax, pension, DBT data |
| Socio-economic data | Caste/category, income certificate, BPL status, disability, occupation, landholding |
| Health/disability data | Medical certificate, disability certificate, vaccination, health scheme records |
| Education data | Student data, scholarship data, marksheets, certificates where public education/scholarship services apply |
| Land/property data | Property ownership, tax, building permission, address, geospatial linkage |
| Employment data | HRMS, payroll, service records, pension, transfers, leave, disciplinary records |
| Grievance/case data | Complaint narratives, attachments, case notes, enquiry findings |
| Vendor/procurement data | Bidder details, contact persons, bank/tax details, tender records |
| Access/security data | Login logs, CCTV, visitor logs, biometric attendance, office access logs |
| Device/API data | IP address, session logs, API tokens, service usage data |

---

## 6. Typical systems and applications

| System/application | DPDP relevance |
|---|---|
| Citizen service portal / e-District / state service portal | Applications, documents, certificates, service history |
| Municipal ERP / ULB systems | Property tax, water, licenses, building permissions, grievances |
| Scheme/beneficiary management system | Eligibility, benefits, DBT, welfare records |
| PFMS/DBT/payment integration | Bank/payment/beneficiary data |
| Aadhaar/eKYC/offline verification integration | Identity verification and audit trail |
| DigiLocker issuer/requester integration | Document issue, access and verification |
| API Setu / departmental APIs | Inter-system and interdepartmental data sharing |
| CPGRAMS/state grievance/local grievance system | Complaints, supporting documents and closure notes |
| HRMS/eOffice/file management | Employee records and administrative correspondence |
| eProcurement/GeM/CPPP/tender systems | Vendors, bidders, procurement records |
| GIS/field survey/mobile inspection apps | Geolocation, photos, household/property/site data |
| Call-centre/CRM/IVR/chatbot/WhatsApp system | Citizen support data and recordings |
| CMS/public website/mobile app | Forms, notices, privacy policy and analytics |
| Data warehouse/BI/dashboard/open data portal | Analytics, public reports, aggregated datasets |
| CCTV/visitor/access-control systems | Premises security and physical access records |

---

## 7. Typical vendors / Data Processors

| Vendor type | Examples |
|---|---|
| System integrator | Portal build, application maintenance, managed services |
| NIC/NICSI/state IT agency partner | Hosting, software, infrastructure or platform services |
| Cloud/SaaS provider | Hosting, storage, analytics, email/SMS, collaboration |
| CSC/kiosk/franchise operator | Assisted public-service delivery and document upload |
| Call-centre/BPO/helpline vendor | Citizen support, grievance handling, outreach |
| Data-entry/scanning/digitisation agency | Physical-to-digital records and indexing |
| Payment gateway/bank/payment aggregator | Fees, taxes, utility payments, DBT support |
| SMS/email/WhatsApp/IVR provider | Notifications and public communications |
| Aadhaar/eKYC/identity verification provider | Authentication/offline verification support where authorised |
| GIS/survey/field app vendor | Inspection, geotagging, beneficiary surveys |
| CCTV/access-control/biometric vendor | Premises and workforce access systems |
| Cybersecurity/VAPT/SOC vendor | Monitoring, audit, incident response |
| AI/analytics/chatbot vendor | Citizen-service chatbots, fraud detection, triage and prediction |

---

## 8. Key DPDP risks in public-sector environments

| Risk | Why it matters |
|---|---|
| Large-scale citizen data concentration | A single breach can affect lakhs or crores of individuals |
| Excessive form fields | Legacy forms may collect more data than the service requires |
| Aadhaar/identity-data misuse | Identity numbers and authentication flows require strict purpose and safeguards |
| Interdepartmental sharing without clarity | Data may move without documented purpose, owner or safeguards |
| Vendor/operator access | Contractors, field agents and call-centre staff may access sensitive data |
| Public disclosure/open data risk | Beneficiary lists, dashboards or RTI replies may expose personal data |
| Weak field-office controls | Local downloads, printouts and spreadsheets can bypass central controls |
| Legacy systems | Older portals may lack logs, masking, RBAC and retention controls |
| Children/vulnerable groups | Welfare, education, health and social schemes may process sensitive group data |
| AI/analytics without review | Eligibility, fraud, prioritisation and triage models can create unfairness or privacy risk |
| Breach-readiness gaps | Public communication, citizen notification and vendor coordination may be unclear |

---

## 9. Suggested public-sector ROPA records

| Suggested ROPA activity | Typical owner | Default risk |
|---|---|---|
| Citizen service registration and account creation | Citizen/applicant onboarding, profile creation, authentication and identity verification. | High |
| Certificate, permit and license application | Birth/death/residence/income/caste/property/trade/building/transport services. | High |
| Scheme/benefit/subsidy application and eligibility verification | Welfare, DBT, scholarship, pension, ration, livelihood or public finance schemes. | High |
| Grievance and complaint handling | Citizen complaints, escalation, case notes, documents and closure records. | High |
| Tax, fee, utility and payment processing | Municipal taxes, user fees, challans, utilities and payment gateway flows. | Medium |
| Aadhaar/eKYC/offline verification | Identity verification, eKYC, demographic sharing and authentication logs. | High |
| DigiLocker/API document issue and verification | Issuer/requester/verifier workflows, certificate publishing and document access. | High |
| RTI/public disclosure/open data publication | Publishing, disclosure, redaction, anonymisation and dataset release. | High |
| Field survey, inspection and enforcement | Mobile data collection, geotagging, photos, field notes and notices. | High |
| Public procurement and vendor management | Supplier/vendor details, bids, performance, contact details and contract documents. | Medium |
| Employee HRMS, payroll and service records | Officers, employees, pensioners, contractors and payroll records. | Medium |
| CCTV, visitor management and office access | Physical premises, public counters, security logs and visitor systems. | Medium |

---

## 10. Industry-specific assessment questions

The following questions are designed as the Public Sector overlay. They should be asked in addition to the core DPDP Compass assessment where applicable.

### 10.1 Governance, accountability and DPDP ownership

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-GOV-001 | Has the department/authority formally appointed a DPDP programme owner for citizen, beneficiary, employee and vendor personal data? | Without clear ownership, public-service data protection remains fragmented across branches, IT vendors and field offices. | Appointment order, office note, committee constitution, role charter, responsibility matrix. | Head of Department / Secretary / Commissioner / CEO | P0 |
| PUB-GOV-002 | Is there a DPDP steering committee or governance forum covering legal, IT, programme, grievance, procurement, records and district/field representatives? | Public-sector processing is distributed; committee-level governance is needed to coordinate action and evidence. | Committee notification, meeting minutes, agenda, attendance, action tracker. | DPDP Owner / Administration | P0 |
| PUB-GOV-003 | Are all schemes, services, portals and citizen-facing processes owned by named business/process owners for DPDP accountability? | Scheme/service data often sits with programme teams while IT is outsourced; ownership must not be left only with the vendor. | Service owner register, department-wise process ownership map, portal ownership sheet. | Programme Heads / Department Owners | P1 |
| PUB-GOV-004 | Has the public authority documented whether it acts as Data Fiduciary, Data Processor, joint implementer, nodal agency, issuer, verifier, or service-delivery intermediary for each major service? | Role confusion is common where central, state, district, vendor and platform entities share data. | Role-classification matrix, MoU, scheme guidelines, service-level contracts, interdepartmental orders. | Legal / DPDP Owner | P0 |
| PUB-GOV-005 | Are district offices, zonal offices, municipal wards, citizen service centres and field units included in the DPDP governance scope? | Field-level collection and access are often the weakest points in citizen-service delivery. | Field office list, CSC/kiosk list, district circulars, training records, access review records. | Administration / District Coordination | P1 |
| PUB-GOV-006 | Does the organisation maintain a DPDP implementation roadmap with P0/P1 actions, owners, timelines and leadership review cadence? | A public authority needs a time-bound implementation programme, not only policy drafting. | Roadmap, action tracker, progress reports, leadership review minutes. | DPDP Programme Owner / PMO | P1 |
| PUB-GOV-007 | Are DPDP obligations built into new e-governance project approval, portal development, procurement and change-request processes? | Privacy controls must be embedded before a citizen portal or scheme database goes live. | Project approval checklist, procurement template, privacy/security checklist, change approval note. | IT / Procurement / Legal | P1 |
| PUB-GOV-008 | Are officers, outsourced operators, call-centre agents and field staff trained on handling citizen personal data, Aadhaar, documents, grievance records and breach reporting? | Human handling is a major risk in public-service workflows. | Training calendar, attendance, quiz records, SOP acknowledgement, refresher schedule. | HR / Administration / DPDP Owner | P1 |

### 10.2 Personal data discovery and inventory

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-INV-001 | Has the authority prepared an inventory of all citizen, beneficiary, applicant, employee, vendor and visitor personal data processed across schemes and services? | A public authority cannot protect or respond to requests if it does not know where personal data exists. | Personal data inventory, scheme-wise data map, application field list, database catalogue. | DPDP Owner / IT / Programme Heads | P0 |
| PUB-INV-002 | Are data fields in each citizen service form mapped to purpose, source, storage system, retention period and downstream sharing? | Government forms often collect excessive identity, family, income and document data. | Form-field inventory, purpose mapping, workflow/data-flow diagrams. | Programme Owner / Legal | P0 |
| PUB-INV-003 | Are high-risk identifiers such as Aadhaar number, PAN, bank account, mobile number, caste/category, income, disability, health, land/property and family details separately flagged? | These identifiers increase harm if leaked or misused. | Data-category taxonomy, high-risk field tagging, masking policy. | IT / Legal / Security | P0 |
| PUB-INV-004 | Are offline records that are digitised, scanned or entered into portals included in the personal data inventory? | DPDP scope can include offline data once digitised; digitisation vendors and scan repositories must be mapped. | Digitisation project records, scan folder inventory, data-entry SOP, vendor logs. | Records Department / IT | P1 |
| PUB-INV-005 | Are call-centre, grievance, helpline, WhatsApp, IVR and email interactions containing citizen personal data inventoried? | Unstructured channels often contain personal data and attachments outside core systems. | CRM/ticketing fields, call recording policy, email mailbox inventory, WhatsApp SOP. | Citizen Services / IT | P1 |
| PUB-INV-006 | Are public dashboards, open-data portals, RTI disclosures and published beneficiary lists reviewed to prevent accidental publication of personal data? | Public-sector transparency must be balanced against privacy and data minimisation. | Open-data review checklist, redaction SOP, published dataset register, RTI disclosure review. | Data Officer / Public Information Officer / Legal | P0 |
| PUB-INV-007 | Are personal data flows through Digital Public Infrastructure such as DigiLocker, API Setu, UMANG, Aadhaar authentication/offline verification or payment systems mapped? | Integrated e-governance creates data-sharing paths that must be visible. | Integration inventory, API list, consent logs, requester/issuer agreements, technical architecture. | IT / Integration Owner | P1 |
| PUB-INV-008 | Are legacy databases, spreadsheets, local office applications and shared drives containing citizen or employee data identified? | Public authorities often have unofficial/local copies that create hidden exposure. | Legacy application inventory, shared-drive scan, spreadsheet register, department declarations. | IT / Department Heads | P1 |

### 10.3 ROPA / Processing Activity Register

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-ROPA-001 | Is there a Processing Activity Register for each major scheme, service, license, permit, certificate, tax, grievance, procurement and HR process? | A process-level register turns the assessment into operational visibility. | ROPA register, service catalogue, scheme-wise process map. | DPDP Owner / Programme Heads | P0 |
| PUB-ROPA-002 | Does each ROPA record identify the Data Principal groups, data categories, purpose, legal/administrative basis, systems, vendors and retention rules? | Incomplete ROPA records cannot support assessment, rights handling or breach response. | ROPA export, completeness score, missing-field report. | DPDP Owner / Legal / IT | P0 |
| PUB-ROPA-003 | Are beneficiary-selection, eligibility verification and subsidy/benefit distribution activities separately recorded? | Benefit and welfare workflows process sensitive citizen and household data at scale. | Scheme ROPA records, DBT/PFMS flow, eligibility data map, approval workflow. | Programme Owner / Finance / IT | P0 |
| PUB-ROPA-004 | Are citizen-service portal workflows such as application, document upload, verification, approval, payment, certificate issue and appeal mapped end to end? | A citizen's personal data moves through multiple workflow stages and roles. | Service blueprint, portal workflow diagram, ROPA activity linkage. | Service Owner / IT | P1 |
| PUB-ROPA-005 | Are interdepartmental data-sharing activities documented with source department, receiving department, purpose, authority and safeguards? | Public authorities commonly share data between departments; uncontrolled reuse creates risk. | Interdepartmental MoUs, API records, data-sharing approvals, ROPA links. | Legal / Data Sharing Committee | P0 |
| PUB-ROPA-006 | Are field survey, inspection, verification and enforcement activities recorded as separate processing activities where they collect personal data? | Field teams may collect photos, geolocation, family details or documents outside central systems. | Survey app records, inspection forms, mobile app permissions, field SOP. | Field Operations / Programme Owner | P1 |
| PUB-ROPA-007 | Are records involving complaints, whistleblower inputs, vigilance, disciplinary proceedings or sensitive grievance narratives separately classified and access-controlled? | These records can expose citizens, employees and complainants to retaliation or harm. | Sensitive process ROPA records, access matrix, case-management SOP. | Vigilance / Legal / HR | P0 |
| PUB-ROPA-008 | Is each ROPA record linked to evidence, review date, owner and reassessment trigger? | ROPA must be maintained as a living register, not a one-time document. | ROPA dashboard, evidence links, last/next review dates, change log. | DPDP Owner | P1 |

### 10.4 Purpose, lawful basis and data minimisation

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-PUR-001 | Is every personal data field collected through a public service linked to a clearly documented service, scheme, statutory, administrative or public-interest purpose? | Public authorities should avoid collecting data simply because older forms requested it. | Purpose map, form-field justification, scheme/service order, legal review note. | Programme Owner / Legal | P0 |
| PUB-PUR-002 | Are forms reviewed to remove excessive fields such as unnecessary Aadhaar, family details, caste/category, income, bank or document data? | Data minimisation reduces breach impact and citizen burden. | Form rationalisation report, revised forms, before/after field list. | Legal / Programme Owner | P0 |
| PUB-PUR-003 | Where a benefit, service, certificate, license or permit is provided by the State or its instrumentality, is the basis and necessity of processing documented? | Government-service processing still needs documented purpose, necessity and governance discipline. | Service rules, scheme guidelines, administrative orders, data-processing basis note. | Legal / Department Secretary / Programme Owner | P0 |
| PUB-PUR-004 | Is reuse of citizen data for analytics, surveys, campaigns, cross-scheme targeting or policy planning separately reviewed and documented? | Secondary use creates transparency, proportionality and public-trust risks. | Analytics approval note, de-identification review, data-sharing approval, DPIA-style note. | Data/Analytics Team / Legal | P1 |
| PUB-PUR-005 | Are mandatory and optional data fields clearly separated in citizen-facing forms and portals? | Citizens should not be forced to provide non-essential data to receive a public service. | Form screenshots, field configuration, validation rules, service design notes. | Portal Owner / UX / Legal | P1 |
| PUB-PUR-006 | Are Aadhaar/eKYC/offline verification flows used only where authorised and necessary for the specific service? | Aadhaar-related processing has specific legal and trust implications. | Aadhaar use approval, UIDAI authorisation/arrangement where applicable, consent screens, authentication logs. | Legal / IT / Service Owner | P0 |
| PUB-PUR-007 | Are citizen documents collected only once where trusted digital document retrieval through DigiLocker or authorised API integration is feasible? | Repeated document uploads increase duplication, storage and breach risk. | DigiLocker integration plan, API architecture, document minimisation checklist. | IT / Service Design | P2 |
| PUB-PUR-008 | Are internal notes, eligibility comments and rejection reasons limited to relevant service facts and free of unnecessary personal remarks? | Subjective notes in government workflows can create unfairness, privacy harm and disclosure risk. | Case-note SOP, sample review, officer training, workflow guidance. | Programme Owner / Administration | P2 |

### 10.5 Notice management

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-NOT-001 | Does every citizen-facing website, app, portal, kiosk, form and counter process display or provide a clear privacy notice at or before data collection? | Citizens must understand what data is collected and why at the point of collection. | Portal screenshots, physical form notices, kiosk scripts, mobile app screens. | Legal / Portal Owner / Citizen Services | P0 |
| PUB-NOT-002 | Does the notice explain personal data collected, purpose, withdrawal/rights route where applicable, grievance/contact details and complaint route in clear language? | A generic website privacy page is insufficient for complex public-service collection. | Notice template, legal review, multilingual notice versions, GIGW/privacy-policy alignment. | Legal / Communications | P0 |
| PUB-NOT-003 | Are notices available in languages appropriate for the citizens served, especially for state/local body services? | Public-service access should not depend on English-only privacy text. | Language versions, website/app language switch, field office notice boards. | Communications / Citizen Services | P1 |
| PUB-NOT-004 | Are notices specific to high-volume services such as certificates, licenses, taxes, grievances, benefits, utilities and municipal services? | One umbrella notice may not clearly cover service-specific data use. | Service-specific privacy notices, portal page mapping, notice register. | Service Owner / Legal | P1 |
| PUB-NOT-005 | Are privacy notices version-controlled and linked to the forms, systems and ROPA records they support? | Versioning helps prove which notice was active when data was collected. | Notice register, version history, ROPA linkage, release notes. | Legal / IT | P1 |
| PUB-NOT-006 | Are notices updated when new APIs, vendors, analytics, AI tools, service channels or data-sharing arrangements are introduced? | Changes in processing must be reflected in citizen-facing transparency. | Change request, notice update approval, new vendor/API records. | Change Advisory Board / Legal | P1 |
| PUB-NOT-007 | Are assisted-channel operators at CSCs, kiosks, call centres or counters trained to explain basic privacy notice points to citizens? | Assisted service channels may collect data from citizens with low digital literacy. | Operator script, training record, SOP, QA sample. | Citizen Services / Vendor Manager | P1 |
| PUB-NOT-008 | Are notices displayed for CCTV, visitor management, biometric attendance and access-control systems at government offices and facilities? | Physical premises also create digitised personal data processing. | CCTV signage, visitor notice, biometric attendance notice, access control policy. | Administration / Security | P1 |

### 10.6 Consent and consent withdrawal

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-CON-001 | Where processing is based on consent, is consent captured as a clear affirmative action and linked to the relevant purpose? | Consent must be meaningful and purpose-specific where used. | Consent UI screenshots, consent logs, timestamp, purpose mapping. | Legal / IT / Service Owner | P0 |
| PUB-CON-002 | Are consent and service-eligibility flows separated where the service can be provided without optional uses such as campaigns, surveys or marketing-like outreach? | Citizens should not be forced into optional communication or analytics uses for essential services. | Form design, consent preference settings, communication opt-in logs. | Legal / Portal Owner | P1 |
| PUB-CON-003 | Can citizens withdraw consent where consent is the applicable basis, and is the consequence of withdrawal clearly explained? | Withdrawal must be operationally feasible where consent is relied upon. | Withdrawal form/link, SOP, workflow screenshots, request logs. | Citizen Services / Legal / IT | P1 |
| PUB-CON-004 | Are Aadhaar authentication/eKYC or DigiLocker requester flows designed to capture explicit permission/authorisation where required by the respective platform rules? | Identity/document access flows usually require explicit user authorisation and auditable records. | Aadhaar/eKYC consent screen, DigiLocker requester logs, API consent logs. | IT / Identity Integration Owner | P0 |
| PUB-CON-005 | Are consent records searchable by citizen/service/application ID without exposing unnecessary personal data to operators? | Consent proof should be available while still limiting operator access. | Consent database schema, access controls, masked UI, audit logs. | IT / DPDP Owner | P1 |
| PUB-CON-006 | Are consent records retained only for the period required to prove processing history and handle disputes? | Consent logs are also personal data and should be governed. | Consent retention schedule, archival SOP, deletion rules. | Legal / Records / IT | P2 |
| PUB-CON-007 | Are paper or offline consents digitised, indexed and controlled when service delivery happens through counters or field camps? | Hybrid public-service delivery often creates paper consent/evidence fragments. | Scanned consent workflow, indexing rules, access controls, retention plan. | Citizen Services / Records | P1 |

### 10.7 Data Principal rights

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-RGT-001 | Is there a documented process for citizens, employees, vendors and other Data Principals to exercise DPDP rights in relation to public-service data? | Rights handling requires a route, owner, identity verification and backend access to records. | Rights SOP, request form, workflow, responsibility matrix. | DPDP Owner / Legal / Citizen Services | P0 |
| PUB-RGT-002 | Can the authority locate citizen data across portals, departments, field offices, vendors and archived records when a rights request is received? | Public-service data is often fragmented across systems and offices. | Data locator map, ROPA link, system owner list, case test. | IT / Records / Programme Owners | P0 |
| PUB-RGT-003 | Is identity verification for rights requests proportionate and not more intrusive than necessary? | Rights processes should not collect excessive additional identity documents. | Rights-request verification SOP, sample cases, minimisation review. | Legal / Citizen Services | P1 |
| PUB-RGT-004 | Are correction/update requests routed to the authoritative source system rather than patched only in downstream copies? | Incorrect citizen data in source systems can affect entitlements, certificates or services. | Master data policy, update workflow, audit trail, system integration map. | IT / Service Owner | P1 |
| PUB-RGT-005 | Can the organisation explain when erasure is possible and when retention is required due to law, scheme records, audit, public finance or archival obligations? | Public records may have retention obligations; the answer must be structured and explainable. | Erasure decision matrix, legal note, records schedule, request logs. | Legal / Records Officer | P1 |
| PUB-RGT-006 | Are rights requests linked to grievance/citizen-service ticketing systems for tracking and reporting? | Citizens need visibility and the organisation needs accountability. | Ticket workflow, SLA dashboard, request register. | Citizen Services / IT | P1 |
| PUB-RGT-007 | Are requests from vulnerable groups, senior citizens, persons with disabilities and low-digital-literacy citizens supported through assisted channels? | Public-sector DPDP implementation must be inclusive and practical. | Assisted-channel SOP, accessibility design, call-centre scripts, helpdesk records. | Citizen Services / Accessibility Officer | P2 |
| PUB-RGT-008 | Are rights-request outcomes reviewed periodically to identify systemic data-quality, access or retention problems? | Patterns in requests can reveal governance failures. | Monthly reports, root-cause analysis, improvement actions. | DPDP Owner / Quality | P2 |

### 10.8 Grievance redressal and contact publication

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-GRV-001 | Is a DPDP-related grievance/contact channel published prominently on portals, apps, forms and office notices? | Citizens need a clear route for privacy and data-handling concerns. | Website/app screenshot, form footer, office display, privacy notice. | Citizen Services / Communications | P0 |
| PUB-GRV-002 | Is the DPDP grievance route integrated with existing public grievance systems without losing privacy-specific classification? | Government entities may already use CPGRAMS/state/municipal grievance systems; privacy requests need classification and tracking. | Grievance category mapping, workflow configuration, ticket examples. | Grievance Officer / IT | P1 |
| PUB-GRV-003 | Are grievance timelines, escalation paths and closure responsibilities defined and monitored? | Unclear ownership can result in missed response windows and citizen dissatisfaction. | Grievance SOP, SLA dashboard, escalation matrix, closure reports. | Grievance Officer / DPDP Owner | P1 |
| PUB-GRV-004 | Are grievances containing sensitive personal details, allegations or documents access-controlled and masked where possible? | Grievance narratives may include health, finance, family or caste/category details. | Access matrix, masking configuration, case-management controls. | Grievance Officer / IT Security | P0 |
| PUB-GRV-005 | Are operator comments and closure notes reviewed to avoid unnecessary disclosure, bias or excessive personal details? | Poorly written case notes can create secondary privacy and fairness risks. | Sample review, SOP, training record, QA checklist. | Grievance Officer / Quality | P2 |
| PUB-GRV-006 | Are unresolved privacy grievances escalated to legal/compliance leadership with supporting evidence? | Complex cases may need legal interpretation and leadership decision. | Escalation log, review minutes, legal opinions, case files. | Legal / DPDP Owner | P1 |
| PUB-GRV-007 | Are grievance metrics included in leadership DPDP dashboards and periodic reviews? | Leadership should see unresolved privacy-risk patterns. | Monthly dashboard, review minutes, action register. | DPDP Owner / PMO | P2 |

### 10.9 Retention, erasure and archival

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-RET-001 | Is there a records retention schedule for citizen-service applications, certificates, permits, licenses, tax/payment records, grievance records, benefits data and HR/vendor data? | Public authorities need retention logic that balances service need, law, audit and privacy. | Records retention schedule, legal review, scheme-wise retention matrix. | Records Officer / Legal / Programme Owners | P0 |
| PUB-RET-002 | Are retention periods configured in portals, databases, document repositories and scan archives where technically feasible? | A policy without system enforcement will not reduce data exposure. | System configuration, archive workflow, deletion logs, backup retention settings. | IT / Records | P1 |
| PUB-RET-003 | Are rejected, withdrawn, duplicate or abandoned applications handled with defined retention and deletion rules? | Not all applications need indefinite retention. | Application-status retention rules, deletion SOP, sample audit. | Service Owner / Records | P1 |
| PUB-RET-004 | Are physical records that are scanned/digitised either retained, archived or disposed under documented rules? | Digitisation can create duplicate data stores unless lifecycle is defined. | Scanning SOP, physical record disposal register, archival policy. | Records / Administration | P1 |
| PUB-RET-005 | Are vendor copies, field-office exports, spreadsheets and downloaded reports subject to retention and secure deletion rules? | Local copies and vendor extracts are common leakage points. | Vendor return/deletion certificate, local-file SOP, endpoint DLP/logs. | IT / Vendor Manager | P1 |
| PUB-RET-006 | Are open-data/public-disclosure datasets reviewed before publication and periodically revalidated to ensure personal data is not retained online unnecessarily? | Published data may remain searchable long after the purpose has ended. | Open-data approval workflow, takedown SOP, dataset review logs. | Open Data Officer / Legal | P0 |
| PUB-RET-007 | Are backups, logs and audit trails governed with retention periods aligned to security, audit and legal needs? | Backups and logs can preserve personal data after deletion from active systems. | Backup retention policy, log retention configuration, purge records. | IT Security / Records | P1 |

### 10.10 Data accuracy and quality

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-ACC-001 | Are citizen data fields used for eligibility, certificates, licenses, permits, benefits or payments validated against authoritative source records where appropriate? | Incorrect data can lead to denial of service, wrong benefit, or incorrect certificate. | Validation rules, source-system linkage, verification SOP. | Service Owner / IT | P1 |
| PUB-ACC-002 | Are correction workflows available for citizens to update incorrect contact, identity, address, bank or eligibility information? | Public-service data must remain accurate where it affects individuals. | Correction request workflow, update logs, approval records. | Citizen Services / Programme Owner | P1 |
| PUB-ACC-003 | Are data-entry operators and field staff trained to avoid transcription errors and unauthorised changes? | Manual entry remains common in public-service environments. | Training records, maker-checker controls, data-quality audit. | Administration / Quality | P2 |
| PUB-ACC-004 | Are duplicate citizen profiles, beneficiary records or application records detected and resolved with controlled procedures? | Duplicate records increase fraud, error and privacy risk. | Duplicate-detection reports, merge SOP, audit trail. | IT / Programme Owner | P1 |
| PUB-ACC-005 | Are data-quality issues from integrated sources, APIs or other departments tracked and corrected at source? | Downstream correction alone may not fix systemic errors. | Data-quality dashboard, API error logs, source correction tickets. | Data Governance / IT | P2 |
| PUB-ACC-006 | Are certificate, license, permit or benefit records checked before publication or sharing with DigiLocker/API/requesters? | Published or shared official records must be accurate and authorised. | Issuer review workflow, approval logs, sample verification. | Service Owner / Issuer Admin | P1 |
| PUB-ACC-007 | Are AI/analytics outputs used for eligibility, fraud detection or prioritisation validated for data quality and human review? | Bad input data can produce unfair or incorrect automated outputs. | Model validation note, sample review, exception handling, human review SOP. | Analytics Owner / Legal | P1 |

### 10.11 Security safeguards

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-SEC-001 | Are access controls implemented for citizen, beneficiary, grievance, payment, HR, vendor and sensitive case-management systems? | Unauthorised access to public-service systems can expose large-scale citizen data. | RBAC matrix, IAM exports, user access review, privileged access list. | IT Security / System Owners | P0 |
| PUB-SEC-002 | Are role-based permissions separated for maker, checker, approver, viewer, administrator, field officer and vendor operator roles? | Segregation prevents misuse and unauthorised changes. | Role matrix, workflow configuration, audit logs, sample transactions. | IT / Process Owner | P0 |
| PUB-SEC-003 | Are Aadhaar, bank, health, caste/category, disability, grievance and other high-risk fields masked or minimised in dashboards, exports and operator screens? | High-risk identifiers should not be exposed to every user. | Masking screenshots, data classification policy, export controls. | IT Security / Data Owner | P0 |
| PUB-SEC-004 | Are strong authentication, MFA for admins, password policy and session-timeout controls implemented for portals and back-office systems? | Government portals are high-value targets and often accessed from shared environments. | IAM policy, MFA configuration, session settings, admin login logs. | IT Security | P0 |
| PUB-SEC-005 | Are logs maintained for access, downloads, approvals, data changes, API calls, admin actions and vendor/operator activity? | Audit trails are essential for investigation, accountability and breach assessment. | Application logs, SIEM/log archive, API gateway logs, database audit logs. | IT Security / System Owner | P0 |
| PUB-SEC-006 | Are public websites and apps tested for OWASP-style vulnerabilities, access-control flaws and secure configuration before release? | Citizen portals are exposed to the internet and handle documents/payments. | VAPT report, STQC/security audit certificate, remediation report, release checklist. | IT Security / Vendor | P0 |
| PUB-SEC-007 | Are documents uploaded by citizens scanned for malware and stored with controlled access? | File upload portals can become a malware and data exposure vector. | Malware scan logs, storage access policy, quarantine process. | IT Security / Portal Vendor | P1 |
| PUB-SEC-008 | Are data exports restricted, watermarked, logged and periodically reviewed? | Bulk exports from public systems can cause major leaks. | Export permission matrix, download logs, DLP alerts, review minutes. | IT Security / Data Owner | P0 |
| PUB-SEC-009 | Are backups encrypted, access-controlled and periodically tested for restoration? | Backups can contain complete citizen datasets and must be protected. | Backup policy, encryption setting, restore test report, access list. | IT Operations | P1 |
| PUB-SEC-010 | Are endpoint, kiosk, field-device and shared-counter environments controlled to prevent local storage, screenshots, printing or unauthorised copying of citizen data? | Assisted public-service channels often use shared devices and local printing/scanning. | Endpoint policy, kiosk hardening checklist, print logs, device inventory. | IT / Field Operations | P1 |

### 10.12 Personal data breach readiness

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-BR-001 | Does the authority have a personal data breach response playbook covering citizen data, public portals, vendors, field offices and cloud/API integrations? | Breach response must be specific to personal data and public-service impact. | Breach SOP, escalation matrix, incident classification criteria. | IT Security / Legal / DPDP Owner | P0 |
| PUB-BR-002 | Does the playbook identify who assesses affected Data Principals, affected services, evidence preservation, containment and communications? | Public-sector breaches need coordinated technical, administrative and citizen-communication response. | Incident roles, RACI, communication templates, investigation checklist. | Incident Response Team | P0 |
| PUB-BR-003 | Are breach-intimation templates prepared for affected citizens/Data Principals and the Data Protection Board where required? | The organisation should not draft notifications for the first time during a crisis. | Notification templates, legal review, translation readiness. | Legal / Communications | P0 |
| PUB-BR-004 | Are CERT-In incident reporting obligations and DPDP breach workflows mapped together where applicable? | Cyber incident and personal data breach obligations may overlap but are not identical. | CERT-In reporting SOP, DPDP breach SOP, integrated incident flow. | CISO / Legal | P0 |
| PUB-BR-005 | Are vendors, system integrators, cloud providers and call centres contractually required to report suspected data incidents quickly? | Public authorities may learn of incidents through vendors; late notice increases harm. | Vendor contracts, breach-notification clauses, incident-report SLA. | Procurement / Legal / IT | P0 |
| PUB-BR-006 | Are breach drills or tabletop exercises conducted for a citizen-portal data leak, API abuse, bulk export, ransomware or misdirected report scenario? | Tabletop exercises reveal gaps before a real event. | Drill script, attendance, lessons learned, remediation actions. | IT Security / DPDP Owner | P1 |
| PUB-BR-007 | Are call-centre, field-office and public relations teams trained to handle citizen enquiries after a data incident? | Public trust and citizen guidance are critical after public-sector incidents. | Training material, call scripts, FAQ template, communication plan. | Communications / Citizen Services | P1 |
| PUB-BR-008 | Are post-incident reviews translated into control improvements, vendor action and reassessment updates? | Incident learning should improve the DPDP Compass score and operating controls. | Post-incident report, CAPA tracker, reassessment record. | DPDP Owner / PMO | P2 |

### 10.13 Vendor / Data Processor governance

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-VEN-001 | Is there a complete register of vendors, system integrators, MSPs, cloud/SaaS providers, call centres, CSC/kiosk operators, data-entry agencies and BPO partners processing personal data? | Public-sector delivery frequently depends on contractors who access citizen data. | Vendor processor register, contract list, procurement records. | Procurement / IT / DPDP Owner | P0 |
| PUB-VEN-002 | Do vendor contracts define personal data handling, confidentiality, security safeguards, breach notification, sub-processing, audit rights, retention and deletion/return requirements? | Generic service contracts may not adequately govern personal data. | Contract clauses, DPA/addendum, legal review checklist. | Legal / Procurement | P0 |
| PUB-VEN-003 | Are government procurement templates, RFPs and work orders updated to include DPDP, privacy, security and evidence obligations? | DPDP controls should be built into new procurements rather than negotiated later. | RFP clauses, GeM/CPP bid documents, standard terms, evaluation criteria. | Procurement / Legal | P1 |
| PUB-VEN-004 | Are vendors restricted to processing personal data only for the assigned public-service purpose and not for analytics, product improvement or reuse without authorisation? | Vendors should not reuse citizen data for unrelated purposes. | Contract restriction, vendor declaration, audit report. | Procurement / Legal | P0 |
| PUB-VEN-005 | Are vendor user accounts created, reviewed and revoked through a controlled process? | Former vendor staff and generic accounts are major public-sector access risks. | Vendor account list, access review, onboarding/offboarding logs. | IT Security / Vendor Manager | P0 |
| PUB-VEN-006 | Are vendor-hosted systems, cloud services and third-party platforms subject to security audit, VAPT, logging and incident reporting requirements? | Public authorities need evidence of vendor safeguards. | Security certificate, VAPT report, log retention, monitoring report. | IT Security / Vendor | P1 |
| PUB-VEN-007 | Are subcontractors and field agents used by vendors disclosed and approved where they access citizen data? | Uncontrolled subcontracting can create invisible data processors. | Subcontractor list, approval notes, access logs, contractual flow-down clauses. | Procurement / Vendor Manager | P1 |
| PUB-VEN-008 | Are vendor exit, contract expiry and project closure processes designed to return/delete citizen data and revoke access? | Legacy vendor copies often persist after projects end. | Exit checklist, data deletion certificate, access revocation log, handover records. | Procurement / IT / Records | P1 |

### 10.14 Children's data and guardian consent

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-CHD-001 | Do schemes or services identify when children’s data is collected, such as education, scholarships, nutrition, health, sports, welfare, child protection or disability services? | Children’s data needs special assessment and guardian/parent workflow review where applicable. | Service inventory, age-field mapping, children-data flag, ROPA records. | Programme Owner / Legal | P0 |
| PUB-CHD-002 | Are parent/guardian details, authority and consent/permission workflows documented where children’s data is processed? | Public services may collect both child and guardian data; authority should be clear. | Guardian workflow, consent/authorisation records, form screenshots. | Legal / Service Owner | P0 |
| PUB-CHD-003 | Are child-related records protected against broad internal access and public disclosure? | Child welfare, education, health and protection records can be highly sensitive. | Access matrix, masking, report redaction, publication review. | IT Security / Child Welfare or Programme Owner | P0 |
| PUB-CHD-004 | Are vendors processing children’s data, such as education platforms, health providers, nutrition-system vendors or survey agencies, separately flagged and reviewed? | Vendor controls become more important where children’s data is involved. | Vendor register, contract clauses, ROPA linkage, security review. | Procurement / Legal / IT | P1 |
| PUB-CHD-005 | Are analytics, profiling or AI tools used on children’s data reviewed for potential harm, fairness and necessity? | Automated classification or targeting involving children requires careful governance. | DPIA-style note, AI review, model documentation, human review SOP. | Data/AI Owner / Legal | P1 |
| PUB-CHD-006 | Are reports, dashboards and public communications involving children aggregated or anonymised unless identifiable disclosure is legally authorised and necessary? | Published child-level data can create safety and dignity risks. | Dashboard design, anonymisation/redaction review, publication approval. | Programme Owner / Communications / Legal | P0 |

### 10.15 Cross-border transfer and cloud/SaaS risk

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-CB-001 | Is the hosting location of each public portal, database, SaaS tool, helpdesk, cloud storage and analytics platform known and documented? | Unknown hosting creates legal, security and procurement risk. | Cloud inventory, hosting-region details, vendor data-location declaration. | IT / Procurement | P1 |
| PUB-CB-002 | Are cross-border data transfers or foreign support access identified for cloud, SaaS, AI, support, analytics or cybersecurity tools? | Cross-border access can occur through support, backup, monitoring or API services. | Vendor architecture, support-access logs, cross-border assessment, contract clauses. | IT / Legal / Vendor Manager | P1 |
| PUB-CB-003 | Are data-location and support-access requirements included in RFPs, contracts and security approvals? | Public authorities should know where citizen data is stored and who can access it. | RFP terms, vendor declarations, data-location schedule. | Procurement / Legal / IT | P1 |
| PUB-CB-004 | Are API integrations with non-government or external platforms reviewed for data-transfer purpose, minimisation, logging and consent/authorisation where applicable? | Public-service APIs can create unintended onward sharing. | API agreement, API Setu integration records, API logs, approval note. | IT / Data Sharing Committee | P1 |
| PUB-CB-005 | Are backups, disaster recovery, telemetry, logs and AI prompts reviewed for possible storage or processing outside India? | Data may move through operational services even when the main database is in India. | Backup architecture, observability tool settings, AI provider data policy, DR plan. | IT Security / Cloud Owner | P1 |
| PUB-CB-006 | Are restrictions from applicable government, sectoral or contractual directions tracked before transferring personal data outside India? | Public-sector data may be subject to additional restrictions beyond the general DPDP assessment. | Legal review note, government direction register, contract compliance checklist. | Legal / Department Leadership | P1 |

### 10.16 SDF, DPIA, audit and AI/algorithmic risk readiness

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PUB-AI-001 | Has the authority identified all AI, analytics, scoring, triage, chatbot, fraud-detection, video analytics or decision-support systems using personal data? | AI use in public services can affect eligibility, priority, enforcement and citizen experience. | AI inventory, analytics tool list, ROPA links, vendor list. | Data/AI Owner / DPDP Owner | P0 |
| PUB-AI-002 | Are AI/analytics purposes documented and limited to authorised public-service objectives? | AI should not expand the purpose of data collection without review. | AI use-case note, approval record, purpose map, legal review. | AI/Data Team / Legal | P1 |
| PUB-AI-003 | Is there a DPIA-style or privacy-risk review for high-impact AI use cases such as beneficiary eligibility, fraud risk, enforcement prioritisation or grievance triage? | Automated support in government can affect access to services and public trust. | Privacy impact assessment, fairness review, human review workflow. | AI Governance / Legal / Programme Owner | P0 |
| PUB-AI-004 | Is human review available before adverse or high-impact decisions are made using AI/analytics outputs? | AI should support officials, not invisibly decide citizen entitlements or enforcement actions. | SOP, decision logs, override records, reviewer role matrix. | Programme Owner / Legal | P0 |
| PUB-AI-005 | Are AI prompts, uploaded files, embeddings, logs and outputs reviewed to prevent accidental exposure of citizen data to external AI tools? | Off-the-shelf AI tools can silently process sensitive public data. | AI usage policy, approved tools list, DLP controls, prompt logging/minimisation. | IT Security / AI Owner | P0 |
| PUB-AI-006 | Are datasets used for AI model development, analytics dashboards or policy planning de-identified, minimised and approved before use? | Analytics can often be performed without identifiable personal data. | Dataset approval, anonymisation/de-identification method, access logs. | Data Governance / Analytics Team | P1 |
| PUB-AI-007 | If the authority is classified or likely to be classified as Significant Data Fiduciary, are DPIA, audit and algorithmic due-diligence readiness measures being planned? | Large-scale or high-risk public-sector processing may require stronger governance readiness. | SDF readiness note, DPIA template, audit plan, algorithmic due diligence checklist. | Leadership / DPDP Owner / Legal | P1 |

---

## 11. Public-sector evidence checklist

| Evidence category | Examples |
|---|---|
| Governance | DPDP owner appointment, steering committee, governance charter, meeting minutes |
| Service catalogue | List of schemes, services, portals, field channels and public counters |
| Data inventory | Form-field map, database inventory, API inventory, data-flow diagrams |
| ROPA | Processing Activity Register, ROPA completeness report, owner/review records |
| Notices | Privacy notice, service-specific notices, multilingual notices, portal screenshots, form text |
| Consent/authorisation | Consent screens, DigiLocker/API authorisation logs, Aadhaar/eKYC consent records where applicable |
| Rights/grievance | Request SOP, grievance workflow, ticket logs, escalation matrix, response templates |
| Retention | Records retention schedule, archival rules, deletion logs, vendor deletion certificate |
| Security | RBAC, MFA, access logs, VAPT, STQC/security audit, encryption/masking, backup test |
| Breach | Incident response plan, CERT-In/DPDP mapping, citizen notification template, tabletop drill records |
| Vendor | Processor register, contracts, DPDP clauses, security reports, subcontractor list, exit checklist |
| Public disclosure/open data | Redaction checklist, dataset approval, RTI disclosure review, publication register |
| AI/analytics | AI inventory, DPIA-style review, data minimisation, human review SOP, model/vendor notes |

---

## 12. Dynamic question triggers for the DPDP Compass engine

| Trigger | Add question pack / checks |
|---|---|
| `government_service_portal = true` | Citizen portal notice, rights, security, breach, ROPA and accessibility checks |
| `beneficiary_or_scheme_data = true` | Eligibility, benefit, DBT, household, vulnerable-group and retention checks |
| `aadhaar_or_ekyc_used = true` | Aadhaar/eKYC/offline verification purpose, consent/authorisation, logs, masking and contract checks |
| `digilocker_or_api_setu_used = true` | Issuer/requester/API consent, lawful data sharing, logging, security and role clarity checks |
| `public_disclosure_or_open_data = true` | Redaction, anonymisation, publication approval, privacy review and takedown checks |
| `field_survey_or_inspection = true` | Mobile app, geolocation, photo, field-device, officer access and retention checks |
| `csc_kiosk_or_assisted_channel = true` | Operator training, notice delivery, document handling, local storage and vendor controls |
| `children_or_vulnerable_groups = true` | Children/vulnerable-group safeguards, guardian workflow, access control and publication controls |
| `vendor_operator_access = true` | Vendor contracts, access review, breach notice, deletion/return and subcontractor checks |
| `ai_analytics_or_chatbot = true` | AI inventory, DPIA-style review, human review, prompt/data minimisation and vendor checks |
| `cloud_saas_or_external_support = true` | Data-location, cross-border, backup, support-access and contractual safeguards |
| `legacy_or_local_spreadsheets = true` | Local-copy inventory, access control, retention and deletion checks |
| `high_volume_citizen_data = true` | SDF-readiness, DPIA/audit planning, stronger governance and breach-readiness checks |

---

## 13. Red flags and scoring considerations

| Red flag | Suggested severity | Score implication |
|---|---|---|
| No DPDP owner or governance forum for public-service data | Critical | Cap overall score at 60 |
| No citizen personal-data inventory | Critical | Cap overall score at 55 |
| No ROPA for major schemes/services | Critical | Cap overall score at 60 |
| Citizen portal collects data without clear notice | Critical | Cap relevant notice/purpose maturity |
| Aadhaar/eKYC used without documented purpose/authorisation/consent evidence | Critical | P0 legal/security review |
| Beneficiary lists or open data expose personal data unnecessarily | Critical | P0 publication/redaction remediation |
| No vendor processor register despite outsourced public-service delivery | High/Critical | Cap vendor maturity; generate P0/P1 actions |
| No breach response playbook for citizen data | Critical | Cap breach maturity |
| No access logs for high-volume citizen systems | Critical | Cap security maturity |
| Children/vulnerable-group data published or broadly accessible | Critical | P0 remediation |
| AI/analytics used for eligibility/enforcement without human review | High/Critical | P0/P1 AI governance action |
| Field/kiosk operators store documents locally without controls | High | P1 operational remediation |
| Unknown cloud/data location for citizen systems | High | P1 legal/IT review |

---

## 14. Dashboard and report additions for public sector

### 14.1 Public-sector process dashboard

| Process view | What to show |
|---|---|
| Citizen service portals | Notice, purpose, access, breach, evidence and ROPA maturity |
| Schemes/benefits | Eligibility data, DBT/payment data, family data, retention and vendor risk |
| Certificates/licenses/permits | Data collection, document upload, DigiLocker/API integration and accuracy |
| Grievance systems | Request handling, sensitive case data, SLA, escalation and access controls |
| Public disclosure/open data | Dataset review, redaction, publication approval and takedown readiness |
| Vendors/system integrators | Processor register, contract clauses, access and breach-notice obligations |
| Field operations | Survey/inspection app data, device controls, local copies and field staff training |
| AI/analytics | AI use cases, human review, DPIA-style review and personal-data minimisation |

### 14.2 Executive report additions

The executive report for public-sector clients should include:

- citizen trust and service-continuity implications;
- high-volume data and vulnerable-group risk;
- scheme/service-wise readiness;
- public portal and notice maturity;
- vendor/system-integrator exposure;
- public disclosure/open data risk;
- Aadhaar/DigiLocker/API integration observations;
- breach-readiness and public communication readiness;
- 30/60/90-day remediation plan.

---

## 15. UAT scenario for this industry

Use the following UAT story to test the Public Sector template:

```text
A State Urban Services Department runs a citizen portal for certificates, municipal services, property tax, grievances and permits.
It uses a system integrator, cloud hosting, SMS/email vendor, payment gateway, call centre, field inspection app and DigiLocker/API integrations.
The department processes citizen identity data, addresses, mobile numbers, property details, grievance attachments, payment references, vendor records and employee data.
Some services involve children, senior citizens, disability certificates or welfare schemes.
The department publishes dashboards and open-data reports.
The assessment should generate core + public-sector + vendor + public disclosure + API/DigiLocker + field operations + AI/cloud conditional questions.
```

Expected platform output:

- public-sector assessment questions generated;
- ROPA records suggested for citizen portal, certificates, grievances, permits, taxes, field inspection, vendor processing and open data;
- red flags for missing notices, missing vendor clauses, unknown data location and weak breach playbook;
- evidence checklist for portals, contracts, logs, notices, public disclosure and incident response;
- executive dashboard showing citizen-service risk and 30/60/90-day action plan.

---

## 16. Notes for AI coding agent

When implementing this industry overlay:

1. Treat this as `PUBLIC_SECTOR_OVERLAY_V1`.
2. Do not replace the core DPDP questions.
3. Map every question to one of the 16 DPDP Compass domains.
4. Add triggers for Aadhaar/eKYC, DigiLocker/API Setu, open data/public disclosure, CSC/kiosk, field survey, children/vulnerable groups, AI/analytics and high-volume citizen data.
5. Add ROPA templates for citizen service, scheme/benefit, license/permit, grievance, public disclosure, field survey and procurement processes.
6. Add dashboard process views for citizen services, schemes, vendors, public disclosure, APIs and field operations.
7. Use evidence-based scoring; do not allow high maturity without evidence.
8. AI Assistant may explain public-sector questions, suggest evidence and draft ROPA entries, but must not certify compliance or decide legal applicability.

---

## 17. File completion summary

| Item | Status |
|---|---|
| Industry context | Completed |
| Data Principal groups | Completed |
| Personal data categories | Completed |
| Systems and vendors | Completed |
| Key risks | Completed |
| Assessment questions | 121 questions |
| ROPA templates | Completed |
| Evidence checklist | Completed |
| Dynamic triggers | Completed |
| Red flags | Completed |
| Dashboard/report additions | Completed |
| UAT scenario | Completed |
| AI coding-agent notes | Completed |

**End of file.**
