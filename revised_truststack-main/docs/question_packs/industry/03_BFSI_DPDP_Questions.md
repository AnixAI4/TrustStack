# 03 — BFSI DPDP Compass Industry Assessment Questions

**Product:** TrustStack™ DPDP Compass  
**Industry overlay:** BFSI — Banking, NBFC, FinTech, Payments, Insurance, Capital Markets, Wealth and Lending  
**File purpose:** Detailed industry-specific DPDP assessment question bank to be used on top of the core 16-domain DPDP Compass assessment.  
**Recommended use:** Consultant-assisted assessment, platform seed data, dynamic question engine, ROPA templates, evidence review, dashboard/report design and AI Assistant grounding.

---

## 1. Important positioning note

This file is an **industry overlay**, not a replacement for the core TrustStack™ DPDP Compass assessment.

Every BFSI organisation should first go through the core 16-domain DPDP assessment:

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

This BFSI overlay adds sector-specific depth for banks, NBFCs, lending platforms, insurers, brokers, payment players, securities intermediaries and other financial services organisations.

**Legal caution:** This assessment supports DPDP readiness and evidence-based maturity evaluation. It is not a final legal opinion, statutory certification, RBI/SEBI/IRDAI compliance certification, or proof of DPDP compliance. Final legal interpretation, sectoral regulatory applicability and contractual sign-off should be reviewed by authorised counsel and qualified compliance professionals.

---

## 2. Research and regulatory basis used for this BFSI overlay

This question bank is based on three layers:

| Layer | How it is used in this file |
|---|---|
| DPDP Act 2023 and DPDP Rules 2025 | Core personal-data protection baseline: processing, notice, consent, rights, security safeguards, breach intimation, vendors, children’s data and governance. |
| BFSI operating reality | Customer onboarding, KYC, credit underwriting, payment channels, insurance claims, trading, wealth, outsourced agents, call centres, fraud/AML, collections, digital journeys and cloud/SaaS vendors. |
| Sectoral regulatory context | Used as an assessment overlay only, not as a replacement for specialist RBI/SEBI/IRDAI compliance reviews. |

Official sectoral references to keep in the product knowledge base:

| Reference area | Why relevant for DPDP Compass BFSI assessment |
|---|---|
| RBI Master Direction — KYC Direction, 2016, updated from time to time | KYC, customer due diligence, identity records, monitoring and customer data flows. |
| RBI Guidelines on Digital Lending, 2022 | Borrower consent, data privacy, lending service providers, digital lending app data collection and audit trails. |
| RBI Master Direction on Outsourcing of IT Services, 2023 | IT vendors, cloud, third-party service providers, outsourcing governance and risk management. |
| RBI Master Direction on IT Governance, Risk, Controls and Assurance Practices, 2023 | IT governance, controls, assurance, business continuity and audit practices. |
| RBI Digital Payment Security Controls / Cyber Resilience directions | Payment channels, digital payment security, cyber resilience and technology controls. |
| SEBI Cybersecurity and Cyber Resilience Framework for SEBI Regulated Entities, 2024 and later clarifications | Securities market intermediaries, cyber resilience, incident response and third-party/cloud controls. |
| IRDAI Information and Cyber Security Guidelines, 2023 | Insurance-sector cyber and information security expectations. |

**Product design rule:** DPDP Compass should mention sectoral references as “additional check areas” and “sector overlays”. It should not claim to fully certify RBI, SEBI or IRDAI compliance unless a separate specialist module is built and legally validated.

---

## 3. BFSI sub-sector coverage

The BFSI template should support the following sub-sector classification.

| Sub-sector code | Sub-sector | Typical examples |
|---|---|---|
| `bank_retail` | Retail banking | Savings accounts, current accounts, deposits, cards, mobile banking |
| `bank_corporate` | Corporate banking | Corporate accounts, trade finance, treasury, cash management |
| `nbfc_lending` | NBFC / HFC / MFI / lender | Personal loans, business loans, housing finance, microfinance |
| `digital_lending` | Digital lender / lending platform | Loan app, online lending, LSP-led journey |
| `payments` | Payments / wallet / payment aggregator / PSO | UPI, card processing, merchant payments, wallet, PPI |
| `insurance_life` | Life insurance | Policy issuance, underwriting, nominee, claims |
| `insurance_health_general` | Health/general insurance | Health claims, motor claims, hospital networks |
| `insurance_intermediary` | Broker / corporate agent / web aggregator | Lead generation, quotes, policy comparison, sales support |
| `capital_markets` | Securities intermediary | Broker, depository participant, RIA, RA, PMS, mutual fund distributor |
| `wealth_asset` | Wealth / asset management | Portfolio, investment suitability, risk profiling, advisory |
| `credit_bureau_related` | Credit bureau/user flows | Credit reports, bureau pulls, consent, dispute correction |
| `fintech_saas` | BFSI technology provider | Platform provider, processor, analytics, fraud, regtech, SaaS |

---

## 4. Typical Data Principal groups in BFSI

| Data Principal group | Examples |
|---|---|
| Prospects and leads | Website visitors, campaign leads, branch walk-ins, app leads |
| Retail customers | Account holders, borrowers, depositors, cardholders, wallet users |
| Corporate customers | Directors, authorised signatories, beneficial owners, employees using corporate banking |
| Borrowers | Individual borrowers, co-applicants, guarantors, references |
| Investors | Trading clients, demat account holders, mutual fund investors, advisory clients |
| Policyholders | Life/health/general insurance customers |
| Nominees and beneficiaries | Insurance nominees, bank nominees, claim beneficiaries |
| Claimants | Insurance claimants, third-party claimants |
| Merchants | Payment merchants, small businesses, shop owners |
| Agents/intermediaries | DSAs, recovery agents, insurance agents, brokers, POSP, relationship managers |
| Employees and candidates | Staff, contractors, call-centre agents, outsourced staff |
| Vendors and service-provider contacts | Vendor employees, support contacts, administrators |
| Minors | Minor bank accounts, student accounts, child insurance, education loans involving minors |
| Complainants | Customers raising grievances, ombudsman matters, disputes |

---

## 5. Typical personal data categories in BFSI

| Category | Examples |
|---|---|
| Identity data | Name, DOB, gender, PAN, Aadhaar-related references where applicable, CKYC ID, passport, voter ID, driving licence |
| Contact data | Address, mobile number, email, alternate phone, communication preferences |
| KYC data | Photograph, identity documents, address proof, video KYC recording, liveness checks, IPV details |
| Financial data | Income, bank account, salary, investments, assets, liabilities, credit exposure |
| Transaction data | Account transactions, card transactions, wallet transactions, trades, policy payments |
| Credit data | Credit bureau score, credit report, repayment history, defaults, collections notes |
| Risk and suitability data | Investment risk profile, affordability, suitability assessment, underwriting risk |
| Insurance data | Policy details, nominee, beneficiary, medical disclosures, claims documents, hospital bills |
| Health data | Health declarations, diagnostic reports, hospital records, pre-existing condition records |
| Device and digital data | IP address, device ID, app logs, browser metadata, geolocation, session data |
| Behavioural data | App journeys, clickstream, product interest, call disposition, lead score |
| Communication data | Calls, chats, emails, recorded conversations, complaints, support tickets |
| Security data | Login records, authentication events, fraud alerts, suspicious activity, CCTV |
| Employee data | HRMS, payroll, attendance, background verification, performance, access logs |
| Vendor data | Vendor contacts, service accounts, support users, relationship manager details |

---

## 6. Typical BFSI systems and applications

| System type | Examples |
|---|---|
| Core banking / lending systems | CBS, LOS, LMS, loan servicing, collections platform |
| Customer onboarding | Digital account opening, loan app, V-CIP, eKYC/CKYC connector |
| CRM and call centre | CRM, telephony, lead management, support ticketing |
| Payment systems | UPI, card management, payment gateway, wallet, PPI, merchant acquiring |
| Insurance systems | Policy administration, underwriting, claims, hospital/TPA integration |
| Capital market systems | Trading platform, back-office, demat, KYC, advisory, portfolio reporting |
| Risk/fraud/AML | AML monitoring, fraud engine, sanction screening, transaction monitoring |
| Data platforms | Data lake, warehouse, analytics, BI, campaign data mart |
| AI/ML systems | Credit scoring, fraud detection, recommendation, chatbot, robo-advisory |
| HR and workforce | HRMS, payroll, attendance, background verification, employee IAM |
| Vendor/SaaS tools | Cloud, email/SMS/WhatsApp, marketing automation, document e-sign, CRM SaaS |
| Security tools | IAM, SIEM, DLP, endpoint protection, vulnerability scanning, logging |
| Document management | KYC documents, loan documents, policy documents, statements, forms |

---

## 7. Typical vendors / Data Processors in BFSI

| Vendor type | Examples |
|---|---|
| KYC and identity providers | CKYC integration, V-CIP provider, document verification, liveness provider |
| Credit bureau / data providers | Credit bureau access, alternative data vendors, fraud databases |
| Lending service providers | LSPs, loan app partners, lead sourcing platforms |
| Payment processors | Payment gateway, UPI stack provider, card processor, wallet processor |
| Cloud and infrastructure | AWS, Azure, GCP, cloud SaaS, hosting provider, DR provider |
| Communication vendors | SMS, email, WhatsApp, IVR, call-centre platform |
| Collection and recovery vendors | Recovery agents, collection agencies, field agencies |
| Insurance ecosystem vendors | TPAs, hospitals, surveyors, claim processors, web aggregators |
| Capital market vendors | Trading technology, KYC agency, depository integrations, back-office provider |
| Analytics and AI vendors | Credit scoring, fraud AI, marketing analytics, chatbot, robo-advisor |
| Document vendors | e-sign, document storage, print/mail house, courier |
| HR vendors | Payroll, background verification, staffing, attendance/biometric |
| Security vendors | SOC/MSSP, SIEM, vulnerability testing, incident response, forensics |

---

## 8. Key BFSI DPDP risk themes

| Risk theme | Why it matters |
|---|---|
| Large-scale personal data processing | BFSI organisations often process large volumes of customer and transaction data. |
| KYC and document-heavy processing | Identity documents, photographs, V-CIP recordings and verification records require tight controls. |
| Outsourced agents and partners | DSAs, LSPs, recovery agents, TPAs, brokers and call centres create distributed accountability risks. |
| Digital journeys and apps | Apps may collect device, behavioural, contact, location or permissions data beyond what is necessary. |
| Consent traceability | BFSI journeys often combine service, marketing, bureau checks, digital lending and profiling consent. |
| Purpose creep | Data collected for KYC or service delivery may later be reused for analytics, marketing or cross-sell. |
| AI/ML and automated decisioning | Credit scoring, fraud, underwriting and recommendations require governance and human review. |
| Breach and fraud impact | Customer financial data exposure creates high trust, reputation and operational risk. |
| Vendor/cloud concentration | Critical third parties may process sensitive data and require strong contracts, monitoring and exit plans. |
| Retention complexity | BFSI retention may be driven by legal/regulatory/business requirements; erasure must be carefully managed. |
| Cross-border and group processing | Global groups, SaaS tools and cloud providers may involve data-location and transfer review. |
| Customer rights across distributed systems | Correction, grievance, erasure and access responses can be hard across CBS/LOS/LMS/CRM/data lake/vendors. |

---

## 9. Recommended BFSI dynamic question triggers

| Trigger code | Trigger condition | Question packs to add |
|---|---|---|
| `BFSI_KYC` | KYC, CKYC, eKYC, V-CIP or account opening selected | KYC, identity, document retention, access, vendor controls |
| `BFSI_DIGITAL_LENDING` | Digital lending, LSP, loan app or online borrower journey selected | Digital lending privacy, LSP governance, app permission, consent audit trail |
| `BFSI_PAYMENT` | Payment gateway, wallet, UPI, card or merchant acquiring selected | Payment data, fraud, transaction logs, customer alerts, security controls |
| `BFSI_INSURANCE` | Life/health/general insurance selected | Policyholder, nominee, claims, health/medical data, TPA/hospital vendors |
| `BFSI_CAPITAL_MARKET` | Broker, DP, RIA, RA, PMS, wealth, trading selected | Investor KYC, suitability, trading data, SEBI cyber overlay |
| `BFSI_COLLECTIONS` | Recovery/collections agents or field staff selected | Outsourced agent governance, call recordings, recovery notes, access limitation |
| `BFSI_AI_SCORING` | Credit score, underwriting, fraud, robo-advisory or profiling AI selected | AI governance, model inventory, human review, bias/fairness review, ROPA link |
| `BFSI_BUREAU` | Credit bureau pull, bureau reporting or dispute correction selected | Consent, purpose, correction, data accuracy, audit trail |
| `BFSI_MARKETING` | Campaign, cross-sell, lead scoring or DND/preference processing selected | Marketing consent, withdrawal, segmentation, data minimisation |
| `BFSI_CLOUD_VENDOR` | Cloud/SaaS/vendor critical system selected | Vendor, cross-border, access, logs, contract, resilience |
| `BFSI_MINOR` | Minor customer/policyholder/beneficiary selected | Guardian review, purpose limitation, consent/nominee safeguards |
| `BFSI_BREACH` | Prior incident, cyber finding or no breach playbook selected | Breach readiness, notification, forensics, evidence preservation |

---

## 10. Industry-specific DPDP assessment questions

The following questions are additional BFSI questions to be added to the core DPDP Compass question bank. They should be stored in the platform as editable, versioned question-bank records.

Recommended fields for database seed:

- `question_code`
- `question_text`
- `domain_code`
- `question_type`
- `trigger`
- `suggested_owner`
- `evidence_guidance`
- `risk_if_weak`
- `priority_hint`
- `ropa_link_required`

---

### 10.1 Governance, accountability and DPDP ownership — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-GOV-001` | Has the organisation formally assigned DPDP accountability for BFSI customer, investor, policyholder, borrower and employee data processing? | Mandatory | DPDP owner appointment, governance charter, committee minutes | CXO / Compliance | P0 |
| `BFSI-GOV-002` | Is DPDP governance integrated with existing compliance, information security, operational risk and internal audit governance? | Mandatory | Committee ToR, risk committee agenda, internal audit scope | Compliance / Risk | P1 |
| `BFSI-GOV-003` | Are business owners appointed for high-risk processing areas such as KYC, lending, payments, claims, trading, collections and marketing? | Mandatory | Process owner matrix, ROPA owner mapping | DPDP Owner | P0 |
| `BFSI-GOV-004` | Are DPDP responsibilities defined for branches, call centres, field agents, DSAs, LSPs, TPAs, brokers and outsourced teams? | Conditional: outsourced/branch/agent model | Outsourcing policy, agent contract, SOP, training logs | Compliance / Procurement | P1 |
| `BFSI-GOV-005` | Does senior management receive periodic DPDP readiness, evidence, breach and vendor-risk dashboards? | Mandatory for large BFSI | Board/risk committee dashboards, reporting cadence | Executive Sponsor | P1 |
| `BFSI-GOV-006` | Is there a documented decision process for new BFSI digital products involving personal data, such as loan apps, payment features, robo-advisory or AI scoring? | Conditional: digital products/AI | Product approval checklist, privacy review gate | Product / Compliance | P1 |
| `BFSI-GOV-007` | Are DPDP controls included in change-management and product-launch governance? | Conditional: digital/product changes | Change approval records, release checklist | IT / Product | P2 |
| `BFSI-GOV-008` | Does the organisation maintain an escalation route for DPDP risks discovered by branches, agents, outsourced teams or customer-service units? | Mandatory | Escalation SOP, helpdesk workflow, incident records | Operations / Compliance | P1 |

---

### 10.2 Personal data discovery and inventory — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-INV-001` | Has the organisation inventoried all customer, borrower, investor, policyholder, merchant, agent and employee personal data categories? | Mandatory | Data inventory, system inventory, process maps | DPDP Owner / IT | P0 |
| `BFSI-INV-002` | Are KYC documents, V-CIP recordings, photographs and identity-verification artefacts separately identified in the inventory? | Trigger: KYC/V-CIP | KYC data map, document repository index | Compliance / Operations | P0 |
| `BFSI-INV-003` | Are financial, transaction, credit, underwriting, fraud and risk-profile data categories identified separately from basic identity/contact data? | Mandatory | Data classification register, data dictionary | Risk / Data Office | P1 |
| `BFSI-INV-004` | Are customer communication records such as calls, chats, emails, IVR recordings and WhatsApp messages included in the inventory? | Trigger: call centre/digital support | CRM/telephony data map, retention records | Customer Service | P1 |
| `BFSI-INV-005` | Are marketing leads, campaign data, cross-sell propensity scores and preference records included in the inventory? | Trigger: marketing/cross-sell | Campaign data map, CRM fields, preference register | Marketing / CRM | P1 |
| `BFSI-INV-006` | Are bureau reports, bureau scores, bureau enquiry records and dispute-correction flows inventoried? | Trigger: credit bureau | Bureau access logs, consent records, bureau process map | Credit / Risk | P1 |
| `BFSI-INV-007` | Are data lake, BI, reporting and analytics copies of customer data included in the inventory? | Trigger: data platform | Data lake catalogue, lineage, BI extract list | Data Office / IT | P0 |
| `BFSI-INV-008` | Are outsourced agent datasets, DSA lead lists, recovery-agent records and field-collection app data included in the inventory? | Trigger: agents/collections | Agent data list, field app data dictionary | Operations / Collections | P1 |
| `BFSI-INV-009` | Are insurance medical records, claims documents, nominee/beneficiary details and hospital/TPA shared data identified separately? | Trigger: insurance | Claims data map, TPA data flow, policy admin fields | Claims / Insurance Ops | P0 |
| `BFSI-INV-010` | Are payment instrument records, card tokens, wallet IDs, merchant records and UPI/payment transaction metadata inventoried? | Trigger: payments | Payment data map, gateway logs, tokenization records | Payments / IT | P1 |
| `BFSI-INV-011` | Are investor suitability, advisory, portfolio, demat and trading records included in inventory? | Trigger: capital markets/wealth | Trading/back-office field list, DP data map | Broking / Wealth Ops | P1 |
| `BFSI-INV-012` | Are employee, contractor, branch-user and privileged-admin personal data categories included in the inventory? | Mandatory | HRMS inventory, IAM user listing | HR / IT | P2 |

---

### 10.3 ROPA / Processing Activity Register — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-ROPA-001` | Does the organisation maintain ROPA records for each major BFSI process such as onboarding, KYC, lending, payments, claims, trading, CRM, collections and marketing? | Mandatory | ROPA register, process maps | DPDP Owner | P0 |
| `BFSI-ROPA-002` | Are ROPA records linked to systems such as CBS, LOS, LMS, CRM, V-CIP, data lake, payment gateway and document repositories? | Mandatory | ROPA-system linkage, system inventory | IT / Data Office | P0 |
| `BFSI-ROPA-003` | Are ROPA records linked to vendors and processors such as KYC providers, LSPs, bureaus, payment gateways, TPAs, cloud and call centres? | Trigger: vendors | ROPA-vendor linkage, vendor register | Procurement / Compliance | P0 |
| `BFSI-ROPA-004` | Does each ROPA record document purpose, data categories, Data Principal type, source, retention, safeguards and review date? | Mandatory | ROPA completeness score | DPDP Owner | P1 |
| `BFSI-ROPA-005` | Are AI/analytics/fraud/credit-score processing activities included as separate or linked ROPA records? | Trigger: AI/analytics | AI inventory, model register, ROPA entries | Risk / Data Science | P1 |
| `BFSI-ROPA-006` | Are cross-functional data flows, such as KYC data reused in lending, marketing, collections or analytics, visible in ROPA? | Mandatory | Data flow diagrams, ROPA linkage | Data Office / Compliance | P1 |
| `BFSI-ROPA-007` | Are branch-level, field-agent and outsourced processing activities included where they process customer personal data? | Trigger: branch/field/outsourcing | Branch SOP, agent process records | Operations | P2 |
| `BFSI-ROPA-008` | Are ROPA records periodically reviewed when new products, vendors, data fields or AI models are added? | Mandatory | Review logs, change tickets | DPDP Owner / Product | P1 |

---

### 10.4 Purpose, lawful basis and data minimisation — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-PUR-001` | Is each data category collected during onboarding and KYC mapped to a clear business, legal, regulatory or service purpose? | Trigger: onboarding/KYC | Field-purpose mapping, onboarding form review | Compliance / Product | P0 |
| `BFSI-PUR-002` | Are optional data fields clearly separated from mandatory fields in account opening, loan, insurance, investment or payment journeys? | Mandatory | Form screenshots, data dictionary | Product / Legal | P1 |
| `BFSI-PUR-003` | Has the organisation reviewed whether mobile app permissions, device data, contact list, location, SMS or storage access are truly necessary? | Trigger: mobile app/digital lending | App permission review, DPIA-style note | Product / IT / Legal | P0 |
| `BFSI-PUR-004` | Is data collected for KYC or service delivery prevented from being reused for marketing/cross-sell without appropriate review? | Mandatory | Purpose-use matrix, campaign controls | Marketing / Compliance | P1 |
| `BFSI-PUR-005` | Are credit bureau pulls limited to defined credit/underwriting purposes and supported by traceable consent or applicable review? | Trigger: credit bureau | Bureau pull logs, consent/audit trail | Credit / Compliance | P1 |
| `BFSI-PUR-006` | Are customer references, guarantor and co-applicant details collected only where necessary and with clear purpose explanation? | Trigger: lending | Loan form, guarantor notice/consent record | Credit / Legal | P1 |
| `BFSI-PUR-007` | Are health/medical data collected for insurance underwriting or claims limited to the required purpose and not reused without review? | Trigger: insurance health/life | Underwriting questionnaire, claims SOP | Insurance Ops / Legal | P0 |
| `BFSI-PUR-008` | Are transaction-monitoring, fraud and AML analytics purposes documented separately from customer servicing and marketing? | Trigger: fraud/AML | AML/fraud process notes, model inventory | Risk / Compliance | P1 |
| `BFSI-PUR-009` | Are call recordings and chat transcripts collected for defined purposes such as service quality, dispute resolution, audit or regulatory proof? | Trigger: call centre | Call recording notice, retention policy | Customer Service / Legal | P1 |
| `BFSI-PUR-010` | Are rejected, incomplete or abandoned applications retained only for justified and documented purposes? | Trigger: onboarding/lending | Abandoned application retention rules | Product / Compliance | P2 |

---

### 10.5 Notice management — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-NOT-001` | Are DPDP notices shown at customer onboarding points such as account opening, loan application, policy purchase, trading account creation and wallet sign-up? | Mandatory | Screenshots, form copies, notice versions | Legal / Product | P0 |
| `BFSI-NOT-002` | Are notices written in clear, plain language and understandable to retail customers, not only in legal terminology? | Mandatory | Notice text review, readability checklist | Legal / CX | P1 |
| `BFSI-NOT-003` | Are notice versions linked to specific journeys, systems and ROPA records? | Mandatory | Notice register, ROPA linkage | Legal / DPDP Owner | P1 |
| `BFSI-NOT-004` | Does the notice explain major data categories such as identity, KYC, financial, transaction, credit, device, communication and vendor-shared data? | Mandatory | Notice content review | Legal / Compliance | P0 |
| `BFSI-NOT-005` | Does the notice explain purposes separately for servicing, KYC, risk, fraud, marketing, analytics, regulatory reporting and customer support? | Mandatory | Purpose section in notice | Legal / Compliance | P1 |
| `BFSI-NOT-006` | Are notices available at digital and offline channels, including branches, assisted journeys, call-centre links and agent-led onboarding where applicable? | Trigger: offline/agent/channel | Branch forms, call-centre script, agent SOP | Operations / Legal | P1 |
| `BFSI-NOT-007` | Is a specific notice or privacy layer provided before collecting app/device permissions or high-risk data in digital lending/payment apps? | Trigger: app/digital lending | App screenshots, permission screen review | Product / Legal | P0 |
| `BFSI-NOT-008` | Are customers informed when data is shared with major categories of processors such as KYC vendors, bureaus, LSPs, TPAs, payment processors or cloud providers? | Trigger: vendor sharing | Notice text, vendor category mapping | Legal / Procurement | P1 |
| `BFSI-NOT-009` | Are notice updates versioned and communicated where processing purposes materially change? | Mandatory | Notice version history, communication records | Legal | P2 |
| `BFSI-NOT-010` | Are notices linked to rights/grievance channels and contact information for DPDP queries? | Mandatory | Notice footer, website/app contact page | Legal / Customer Service | P1 |

---

### 10.6 Consent and consent withdrawal — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-CON-001` | Are consent requests separated by purpose where required, especially for marketing, bureau checks, data sharing, optional services and profiling? | Mandatory | Consent screen, consent matrix | Legal / Product | P0 |
| `BFSI-CON-002` | Can the organisation prove which notice version and consent text was shown to the customer at the time of consent? | Mandatory | Consent logs, notice version linkage | IT / Compliance | P0 |
| `BFSI-CON-003` | Are consent records linked to customer ID, product, purpose, channel, timestamp and source system? | Mandatory | Consent database schema, audit logs | IT / Product | P1 |
| `BFSI-CON-004` | Is consent withdrawal available through comparable and practical channels, such as app, web, branch, call centre or email? | Mandatory where consent used | Withdrawal workflow, tickets | Customer Service / IT | P1 |
| `BFSI-CON-005` | Does withdrawal stop or modify downstream processing where required, including marketing, analytics or optional data sharing? | Trigger: withdrawal | Workflow evidence, downstream suppression logs | Product / Data Office | P1 |
| `BFSI-CON-006` | Is marketing consent separated from mandatory service, regulatory, risk or transactional communication? | Trigger: marketing | Campaign consent preference centre | Marketing / Legal | P0 |
| `BFSI-CON-007` | Are bureau-check, credit-risk and alternate-data consents traceable in lending journeys? | Trigger: lending/bureau | Loan journey logs, consent artefact | Credit / IT | P1 |
| `BFSI-CON-008` | Are LSP/DSA/partner journeys prevented from capturing bundled, vague or pre-ticked consents? | Trigger: LSP/DSA | Partner screen review, audit trail | Digital Lending / Compliance | P0 |
| `BFSI-CON-009` | Are insurance health declarations, nominee details and claim-related consents managed and stored separately where required? | Trigger: insurance | Proposal form, claims form, consent logs | Insurance Ops / Legal | P1 |
| `BFSI-CON-010` | Are consent receipts, records or logs retained for the period needed to prove consent and handle disputes? | Mandatory where consent used | Consent retention settings, archive records | IT / Compliance | P1 |
| `BFSI-CON-011` | Are consent preference changes propagated across CRM, campaign tools, call centres, mobile app and data lake? | Trigger: multi-system | Preference sync logs, suppression lists | CRM / Data Office | P1 |
| `BFSI-CON-012` | Is there a process to review whether certain processing relies on consent or another legally reviewed basis, without overusing consent unnecessarily? | Mandatory | Legal basis matrix, compliance memo | Legal / Compliance | P2 |

---

### 10.7 Data Principal rights — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-RGT-001` | Can customers raise DPDP rights requests through accessible channels such as web, app, branch, call centre or email? | Mandatory | Rights request workflow, contact page | Customer Service / Legal | P1 |
| `BFSI-RGT-002` | Can the organisation locate customer data across CBS/LOS/LMS/CRM/payment/insurance/trading/data lake systems to respond to rights requests? | Mandatory | Data location map, DSAR workflow | IT / DPDP Owner | P0 |
| `BFSI-RGT-003` | Is there an identity-verification process before fulfilling access, correction or erasure requests? | Mandatory | Rights SOP, verification checklist | Customer Service / Security | P1 |
| `BFSI-RGT-004` | Are correction requests propagated to downstream systems, vendors, bureaus or partners where applicable? | Trigger: bureau/vendor | Correction workflow, bureau dispute logs | Operations / Compliance | P1 |
| `BFSI-RGT-005` | Are erasure requests assessed against regulatory, legal, contractual, fraud, AML, tax, claims or dispute-retention obligations? | Mandatory | Erasure review matrix, legal review log | Legal / Compliance | P0 |
| `BFSI-RGT-006` | Are rights requests tracked with status, owner, due date, response and evidence of closure? | Mandatory | Rights request register | DPDP Owner / Customer Service | P1 |
| `BFSI-RGT-007` | Are rights requests from nominees, beneficiaries, claimants, co-applicants or guarantors handled through appropriate verification and authority checks? | Conditional: nominee/beneficiary/guarantor | Claim/nominee SOP, authorisation checklist | Legal / Operations | P1 |
| `BFSI-RGT-008` | Are customer disputes involving inaccurate financial/credit/transaction data integrated with correction rights workflows? | Trigger: credit/transaction disputes | Dispute workflow, correction logs | Operations / Risk | P1 |
| `BFSI-RGT-009` | Is there a process to explain to customers when a requested deletion cannot be completed due to applicable retention obligations? | Mandatory | Response templates, legal basis matrix | Legal / Customer Service | P1 |
| `BFSI-RGT-010` | Are branch, call-centre and agent staff trained to route DPDP rights requests correctly? | Trigger: distributed channels | Training logs, scripts | Operations / Training | P2 |

---

### 10.8 Grievance redressal and contact publication — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-GRV-001` | Is DPDP-related grievance/contact information prominently published on website, app and key customer communications? | Mandatory | Website/app screenshot, notice footer | Legal / Customer Service | P0 |
| `BFSI-GRV-002` | Are DPDP grievances classified separately from service complaints, fraud complaints, loan disputes and regulatory grievances? | Mandatory | Complaint taxonomy, CRM codes | Customer Service / Compliance | P1 |
| `BFSI-GRV-003` | Is there a defined internal owner and SLA for DPDP grievances? | Mandatory | Grievance SOP, SLA dashboard | Customer Service / DPDP Owner | P1 |
| `BFSI-GRV-004` | Are complaints involving consent misuse, unwanted marketing, inaccurate credit reporting or unauthorised data sharing tracked as DPDP risks? | Mandatory | Complaint register, root-cause report | Compliance / Risk | P1 |
| `BFSI-GRV-005` | Are complaints received through branches, agents, DSAs, LSPs, brokers, TPAs or call centres routed into a central grievance workflow? | Trigger: third-party channels | Escalation SOP, partner training | Operations / Vendor Mgmt | P1 |
| `BFSI-GRV-006` | Are unresolved or repeated DPDP grievances reported to governance forums? | Mandatory | Governance dashboard, escalation report | DPDP Owner | P2 |
| `BFSI-GRV-007` | Are grievance responses reviewed for consistency, accuracy and avoidance of excessive disclosure? | Mandatory | Response review samples | Legal / Customer Service | P2 |
| `BFSI-GRV-008` | Are DPDP grievance metrics included in executive dashboard and reassessment? | Mandatory | Dashboard screenshot, report section | DPDP Owner | P2 |

---

### 10.9 Retention, erasure and archival — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-RET-001` | Is there a retention schedule for customer, KYC, transaction, loan, policy, claim, trading and employee records? | Mandatory | Retention policy, schedule | Legal / Records / IT | P0 |
| `BFSI-RET-002` | Are retention rules mapped to systems such as CBS, LOS, LMS, CRM, document repositories, call recordings and data lakes? | Mandatory | System-retention matrix | IT / Records | P1 |
| `BFSI-RET-003` | Are rejected, abandoned, incomplete or expired applications deleted or archived according to defined rules? | Trigger: onboarding/loan/policy | Workflow config, purge logs | Product / IT | P2 |
| `BFSI-RET-004` | Are V-CIP recordings, KYC documents and identity-verification artefacts retained only according to approved retention rules? | Trigger: KYC/V-CIP | KYC retention schedule, repository lifecycle settings | Compliance / IT | P1 |
| `BFSI-RET-005` | Are call recordings, chat logs, WhatsApp conversations and email records covered by retention rules? | Trigger: call centre/digital support | Telephony/CRM retention settings | Customer Service / IT | P1 |
| `BFSI-RET-006` | Are marketing leads and campaign data purged or suppressed after expiry, withdrawal or inactivity? | Trigger: marketing | CRM/campaign purge logs, suppression list | Marketing / IT | P1 |
| `BFSI-RET-007` | Are data lake, BI extracts and analytics datasets included in retention and deletion processes? | Trigger: data lake/analytics | Data retention rules, purge scripts | Data Office / IT | P0 |
| `BFSI-RET-008` | Are deletion requests reconciled with legal/regulatory retention obligations before execution? | Mandatory | Erasure workflow, legal review matrix | Legal / IT | P0 |
| `BFSI-RET-009` | Are vendor-held records deleted or returned after purpose completion, contract exit or retention expiry? | Trigger: vendors | Vendor exit checklist, deletion certificate | Procurement / Legal | P1 |
| `BFSI-RET-010` | Are archival records access-controlled and periodically reviewed, rather than left open to operational users? | Mandatory | Archive access list, review logs | IT / Records | P1 |

---

### 10.10 Accuracy and data quality — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-ACC-001` | Are processes defined to update customer contact, identity, bank, nominee, beneficiary and KYC details accurately? | Mandatory | Update SOP, customer request workflow | Operations / Compliance | P1 |
| `BFSI-ACC-002` | Are correction requests propagated to downstream systems such as CRM, LMS, collections, data lake, bureau reporting and campaign tools? | Mandatory | Data sync logs, correction workflow | IT / Data Office | P1 |
| `BFSI-ACC-003` | Are credit bureau disputes and correction workflows linked to DPDP accuracy controls? | Trigger: bureau | Bureau dispute register, correction evidence | Credit / Risk | P1 |
| `BFSI-ACC-004` | Are duplicate customer profiles, stale contact records and outdated KYC documents monitored and corrected? | Mandatory | Data quality reports, KYC refresh dashboard | Operations / Data Office | P2 |
| `BFSI-ACC-005` | Are model inputs for credit/fraud/underwriting periodically checked for accuracy and freshness? | Trigger: AI/analytics | Model input validation, data-quality checks | Risk / Data Science | P1 |
| `BFSI-ACC-006` | Are nominee, beneficiary and claim records verified before decision-making or payout? | Trigger: insurance/claims/nominee | Verification SOP, claims checklist | Operations / Legal | P1 |

---

### 10.11 Security safeguards — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-SEC-001` | Are BFSI systems containing personal data protected by role-based access control and least privilege? | Mandatory | RBAC matrix, access review logs | CISO / IT | P0 |
| `BFSI-SEC-002` | Are privileged access rights to CBS, LOS, LMS, CRM, payment, insurance, trading and data lake systems reviewed periodically? | Mandatory | Privileged access review, IAM report | CISO / IT | P0 |
| `BFSI-SEC-003` | Are access logs maintained and monitored for systems containing customer financial, KYC, transaction and claims data? | Mandatory | SIEM/log samples, monitoring dashboard | Security Operations | P0 |
| `BFSI-SEC-004` | Are KYC documents, V-CIP recordings, claims records and financial documents encrypted or protected against unauthorised access? | Trigger: document-heavy flows | Encryption config, DMS access controls | IT / Security | P0 |
| `BFSI-SEC-005` | Are customer data exports restricted, logged and approved before download or sharing? | Mandatory | DLP policy, export logs, approval workflow | Security / Operations | P1 |
| `BFSI-SEC-006` | Are call-centre and outsourced users prevented from downloading, copying or misusing customer data? | Trigger: call centre/outsourcing | VDI controls, masking, access restrictions | IT / Operations | P1 |
| `BFSI-SEC-007` | Is sensitive customer data masked in support screens, logs, reports and non-production environments? | Mandatory | Masking policy, screenshots, test data policy | IT / Security | P1 |
| `BFSI-SEC-008` | Are APIs handling customer, transaction or payment data protected with authentication, authorisation, rate limiting and monitoring? | Trigger: APIs/platforms | API gateway config, API test reports | Engineering / Security | P0 |
| `BFSI-SEC-009` | Are mobile apps and digital journeys tested for insecure data storage, excessive permissions and insecure APIs? | Trigger: mobile app | VAPT reports, mobile app security assessment | AppSec / Product | P0 |
| `BFSI-SEC-010` | Are data lake and analytics environments secured with access control, lineage and personal-data minimisation? | Trigger: data lake | Data lake access matrix, lineage, masking | Data Office / Security | P1 |
| `BFSI-SEC-011` | Are backup, restoration, business continuity and disaster recovery controls tested for systems processing personal data? | Mandatory | DR test report, backup restore records | IT / BCP | P1 |
| `BFSI-SEC-012` | Are vendor users and support engineers accessing production systems subject to approval, logging and time-bound access? | Trigger: vendors | Vendor access logs, JIT access approvals | IT / Vendor Mgmt | P1 |
| `BFSI-SEC-013` | Is personal data prevented from appearing in application logs, debug logs, analytics events or error traces? | Trigger: apps/APIs | Log review, redaction config | Engineering / Security | P1 |
| `BFSI-SEC-014` | Are non-production datasets anonymised, masked or synthetic before use by development, testing or vendors? | Mandatory | Test data policy, masking report | IT / Engineering | P1 |
| `BFSI-SEC-015` | Are fraud, AML and transaction monitoring systems protected from unauthorised viewing of sensitive customer activity? | Trigger: fraud/AML | Access review, system logs | Risk / Security | P1 |
| `BFSI-SEC-016` | Are encryption keys, secrets, API tokens and service credentials stored securely and rotated? | Mandatory | Secret manager config, key rotation logs | Security / DevOps | P1 |

---

### 10.12 Personal data breach readiness — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-BR-001` | Does the organisation have a DPDP-specific personal data breach response playbook integrated with cyber incident response? | Mandatory | Breach SOP, incident response plan | CISO / Legal | P0 |
| `BFSI-BR-002` | Does the playbook identify how to assess whether customer, financial, KYC, payment, policy, claim or employee data has been affected? | Mandatory | Breach assessment checklist | CISO / DPDP Owner | P0 |
| `BFSI-BR-003` | Are Data Principal notification templates prepared for BFSI breach scenarios? | Mandatory | Customer notification templates | Legal / Communications | P0 |
| `BFSI-BR-004` | Is Board/regulatory notification support mapped for DPDP and sectoral regulators where applicable? | Mandatory | Notification matrix, legal review | Compliance / Legal | P0 |
| `BFSI-BR-005` | Are third-party and vendor breach notification obligations included in contracts and incident playbooks? | Trigger: vendors | Contract clauses, vendor incident SOP | Procurement / Legal / Security | P1 |
| `BFSI-BR-006` | Are breach scenarios tested for loan app exposure, customer data export, payment data leakage, cloud misconfiguration and call-centre misuse? | Mandatory | Tabletop exercise report | CISO / IT | P1 |
| `BFSI-BR-007` | Are incident evidence, logs, forensic records and decision timelines preserved? | Mandatory | Evidence preservation SOP, incident log | Security Operations | P1 |
| `BFSI-BR-008` | Are customer service teams trained to respond to breach-related customer queries without disclosing excessive information? | Mandatory | Training logs, scripts | Customer Service / Legal | P2 |
| `BFSI-BR-009` | Does the breach process include a vendor coordination checklist for KYC, payment, cloud, LSP, TPA and call-centre incidents? | Trigger: vendors | Vendor contact list, escalation matrix | Vendor Mgmt / CISO | P1 |
| `BFSI-BR-010` | Are post-incident corrective actions tracked through the DPDP Compass gap/action module? | Mandatory | Incident RCA, action tracker | CISO / DPDP Owner | P2 |

---

### 10.13 Vendor / Data Processor governance — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-VEN-001` | Is there a vendor/Data Processor register covering KYC providers, LSPs, DSAs, bureaus, payment processors, TPAs, brokers, cloud, call centres and IT vendors? | Mandatory | Vendor register, data processor classification | Procurement / Compliance | P0 |
| `BFSI-VEN-002` | Is each vendor mapped to processing purpose, data categories, systems, ROPA records and risk rating? | Mandatory | Vendor data map, ROPA linkage | Procurement / DPDP Owner | P0 |
| `BFSI-VEN-003` | Do vendor contracts include personal-data processing, confidentiality, security, breach notification, audit, sub-processor and exit/deletion obligations? | Mandatory | Contract review checklist, DPDP addendum | Legal / Procurement | P0 |
| `BFSI-VEN-004` | Are lending service providers, recovery agents, DSAs and outsourced call centres subject to privacy and conduct controls? | Trigger: outsourced sales/collections | LSP/agent contracts, training, monitoring | Business / Compliance | P0 |
| `BFSI-VEN-005` | Are cloud and SaaS providers reviewed for data location, access, encryption, logging, support access and exit controls? | Trigger: cloud/SaaS | Cloud risk review, architecture notes | IT / Security / Legal | P1 |
| `BFSI-VEN-006` | Are vendor due diligence and periodic reviews risk-based and evidence-backed? | Mandatory | Vendor review report, security questionnaire | Procurement / Security | P1 |
| `BFSI-VEN-007` | Are vendor users accessing production systems uniquely identified, time-bound and logged? | Trigger: vendor access | Vendor IAM logs, access approvals | IT / Security | P1 |
| `BFSI-VEN-008` | Are sub-processors and downstream service providers known for major vendors? | Trigger: vendor sub-processing | Sub-processor list, contract schedule | Procurement / Legal | P1 |
| `BFSI-VEN-009` | Is there an exit plan to return/delete customer data when vendor contracts end? | Mandatory for processors | Exit checklist, deletion certificate | Procurement / IT | P1 |
| `BFSI-VEN-010` | Are vendor incidents, SLA breaches and privacy failures tracked and escalated? | Mandatory | Vendor incident register | Vendor Mgmt / Risk | P2 |
| `BFSI-VEN-011` | Are credit bureau, payments, TPA/hospital and market-infrastructure data-sharing relationships classified correctly as processor/recipient/regulatory flow? | Conditional by sub-sector | Data-sharing map, legal classification | Legal / Compliance | P1 |
| `BFSI-VEN-012` | Are outsourced development/testing teams prevented from receiving live personal data unless formally approved and protected? | Trigger: outsourced IT | Test data policy, vendor contract | IT / Security / Legal | P1 |

---

### 10.14 Children’s data and guardian consent — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-CHD-001` | Does the organisation identify whether any customer, borrower, investor, policyholder, nominee or beneficiary is below 18? | Trigger: minors possible | Age-capture field, customer profile | Product / Operations | P1 |
| `BFSI-CHD-002` | Are minor accounts, child insurance products, education loans involving minors and nominee/beneficiary records reviewed for guardian consent requirements? | Trigger: minors | Product/legal review note | Legal / Product | P0 |
| `BFSI-CHD-003` | Are marketing, profiling or behavioural tracking activities restricted or reviewed for minors? | Trigger: minor + marketing | Marketing suppression rules, consent logic | Marketing / Legal | P0 |
| `BFSI-CHD-004` | Are minor-related data fields minimised and purpose-limited? | Trigger: minors | Field-purpose mapping | Product / Legal | P1 |
| `BFSI-CHD-005` | Are vendors processing children’s/minor data identified and contractually controlled? | Trigger: minors + vendors | Vendor map, DPDP clauses | Procurement / Legal | P1 |
| `BFSI-CHD-006` | Are rights requests or corrections involving minor/guardian relationships verified carefully before disclosure or update? | Trigger: minors | Verification SOP, request workflow | Operations / Legal | P1 |

---

### 10.15 Cross-border transfer and cloud/SaaS risk — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-CB-001` | Does the organisation know where customer, KYC, transaction, policy, claims, trading and employee data is stored and processed? | Mandatory | Data-location register, cloud region list | IT / Legal | P0 |
| `BFSI-CB-002` | Are cloud, SaaS, AI, communication, CRM, analytics and support vendors reviewed for data location and cross-border processing? | Trigger: cloud/SaaS | Vendor data-location questionnaire | Procurement / IT | P1 |
| `BFSI-CB-003` | Are group-company, global support or offshore operations involving Indian customer data mapped and reviewed? | Trigger: group/offshore | Intra-group data transfer map | Legal / Compliance | P1 |
| `BFSI-CB-004` | Are cross-border data flows linked to ROPA records and vendor contracts? | Trigger: cross-border | ROPA links, DPA clauses | Legal / DPDP Owner | P1 |
| `BFSI-CB-005` | Are remote vendor support sessions controlled to prevent unauthorised data export or screen capture? | Trigger: vendor support | Remote access logs, JIT approvals | IT / Security | P1 |
| `BFSI-CB-006` | Are SaaS admin consoles restricted to approved roles and monitored? | Trigger: SaaS | Admin access logs, role review | IT / Security | P1 |
| `BFSI-CB-007` | Are contractual safeguards, access controls, encryption and incident notification obligations documented for cross-border/cloud processing? | Trigger: cloud/cross-border | Contracts, cloud architecture, security evidence | Legal / Security | P1 |

---

### 10.16 SDF, DPIA, audit and AI/algorithmic risk readiness — BFSI overlay

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| `BFSI-AI-001` | Does the organisation maintain an inventory of AI/ML/analytics systems using personal data, such as credit scoring, fraud detection, underwriting, robo-advisory, lead scoring or chatbots? | Trigger: AI/analytics | AI inventory, model register | Data Science / Risk | P0 |
| `BFSI-AI-002` | Is each AI/ML processing activity linked to purpose, data categories, ROPA, vendors and business owner? | Trigger: AI/analytics | ROPA link, model documentation | Data Science / DPDP Owner | P1 |
| `BFSI-AI-003` | Are AI model inputs minimised and checked for unnecessary identity, transaction, health or financial data? | Trigger: AI/analytics | Feature list, data minimisation review | Data Science / Legal | P1 |
| `BFSI-AI-004` | Is there human review for high-impact decisions such as loan rejection, claim rejection, fraud action, account restriction or investment recommendation? | Trigger: automated decisions | Decision workflow, manual review records | Risk / Business | P0 |
| `BFSI-AI-005` | Are third-party AI APIs, scoring vendors, fraud vendors and chatbot providers reviewed as Data Processors or service providers where applicable? | Trigger: AI vendors | Vendor contract, model/service review | Procurement / Legal / Security | P1 |
| `BFSI-AI-006` | Are prompts, uploaded documents and AI logs prevented from exposing customer financial, KYC, claim or transaction data unnecessarily? | Trigger: GenAI/internal AI tools | AI usage policy, DLP controls | CISO / Data Office | P0 |
| `BFSI-AI-007` | Are model outputs and decision reasons logged sufficiently for customer dispute, audit and internal review? | Trigger: AI/decisioning | Model output logs, decision audit trail | Risk / Data Science | P1 |
| `BFSI-AI-008` | Are periodic privacy, bias, explainability and performance reviews conducted for models that use personal data? | Trigger: high-risk AI | Model review minutes, validation reports | Model Risk / Data Science | P1 |
| `BFSI-AI-009` | Is AI usage included in internal audit, risk assessment or governance reporting? | Trigger: AI/analytics | Audit plan, governance dashboard | Internal Audit / Risk | P2 |
| `BFSI-AI-010` | If the organisation is likely to be classified as a Significant Data Fiduciary, is there readiness for DPIA-style review, audit and algorithmic due diligence obligations? | Trigger: large-scale/high-risk | SDF readiness assessment, DPIA template | Legal / Compliance / Risk | P1 |

---

## 11. Process-specific BFSI assessment packs

These process packs should be added dynamically based on sub-sector and scope wizard answers.

---

### 11.1 Customer onboarding and KYC pack

| Code | Question | Domain | Evidence |
|---|---|---|---|
| `BFSI-KYC-001` | Are all customer onboarding data fields mapped to purpose, source system and retention rule? | PURPOSE / INV | Onboarding form, field-purpose map |
| `BFSI-KYC-002` | Are KYC document uploads protected with access controls, encryption and download restrictions? | SECURITY | DMS controls, access logs |
| `BFSI-KYC-003` | Are V-CIP recordings and liveness records stored with restricted access and defined retention? | SECURITY / RETENTION | V-CIP storage policy, access log |
| `BFSI-KYC-004` | Are KYC vendors and CKYC integrations documented in vendor register and ROPA? | VENDOR / ROPA | Vendor contract, API integration map |
| `BFSI-KYC-005` | Is notice shown before KYC data/documents are collected? | NOTICE | Screenshots, notice version |
| `BFSI-KYC-006` | Are rejected/incomplete applications handled according to defined retention/deletion rules? | RETENTION | Abandoned application policy |
| `BFSI-KYC-007` | Are KYC refresh and update workflows linked to accuracy controls? | ACCURACY | KYC update SOP, customer update logs |
| `BFSI-KYC-008` | Are staff and outsourced users prevented from extracting KYC documents in bulk? | SECURITY | DLP/export restriction logs |

---

### 11.2 Digital lending and LSP pack

| Code | Question | Domain | Evidence |
|---|---|---|---|
| `BFSI-DL-001` | Are lending service providers and loan apps listed in the vendor/Data Processor register? | VENDOR | LSP register, contracts |
| `BFSI-DL-002` | Is borrower data collection need-based and limited to the lending purpose? | PURPOSE | App permissions review, loan form |
| `BFSI-DL-003` | Is prior consent captured with timestamp, purpose and audit trail for borrower data collection where applicable? | CONSENT | Consent logs, journey events |
| `BFSI-DL-004` | Are app permissions such as contacts, location, SMS or storage reviewed and minimised? | PURPOSE / SECURITY | App permission scan, product review |
| `BFSI-DL-005` | Are recovery/collection agents controlled for customer data access and conduct? | VENDOR / SECURITY | Agent SOP, field app access logs |
| `BFSI-DL-006` | Can borrowers access grievance and withdrawal/preference channels easily? | RIGHTS / GRIEVANCE | App screenshots, grievance workflow |
| `BFSI-DL-007` | Are rejected leads and alternate-data inputs purged or retained under approved rules? | RETENTION | Retention configuration |
| `BFSI-DL-008` | Are credit scoring models using personal data reviewed for privacy and human oversight? | SDF_AI | Model review, decision workflow |

---

### 11.3 Payments, cards, wallets and merchant acquiring pack

| Code | Question | Domain | Evidence |
|---|---|---|---|
| `BFSI-PAY-001` | Are payment transaction data, card/wallet identifiers, merchant data and device metadata inventoried? | INV | Payment data dictionary |
| `BFSI-PAY-002` | Are payment APIs protected against unauthorised personal-data access? | SECURITY | API gateway config, VAPT report |
| `BFSI-PAY-003` | Are fraud monitoring and transaction analytics purposes documented? | PURPOSE / ROPA | Fraud monitoring ROPA |
| `BFSI-PAY-004` | Are payment processors, gateways, network partners and outsourced support vendors mapped? | VENDOR | Vendor register |
| `BFSI-PAY-005` | Are transaction alerts and service communications separated from marketing communication preferences? | CONSENT | Communication preference matrix |
| `BFSI-PAY-006` | Are payment-related breach scenarios included in breach playbooks and drills? | BREACH | Tabletop drill report |
| `BFSI-PAY-007` | Are merchant onboarding records and authorised signatory data protected? | SECURITY / INV | Merchant onboarding SOP |
| `BFSI-PAY-008` | Are chargeback, dispute and refund workflows linked to accuracy and rights processes? | RIGHTS / ACCURACY | Dispute workflow |

---

### 11.4 Insurance pack

| Code | Question | Domain | Evidence |
|---|---|---|---|
| `BFSI-INS-001` | Are policyholder, proposer, life assured, nominee, beneficiary and claimant data mapped separately? | INV | Insurance data inventory |
| `BFSI-INS-002` | Are health declarations and medical records classified as high-risk data requiring tighter controls? | SECURITY | Health data controls, restricted access |
| `BFSI-INS-003` | Are proposal, underwriting and claim purposes clearly explained in notices? | NOTICE / PURPOSE | Proposal form, privacy notice |
| `BFSI-INS-004` | Are TPAs, hospitals, labs, surveyors, brokers and web aggregators mapped as vendors/recipients/processors as applicable? | VENDOR | TPA/vendor register |
| `BFSI-INS-005` | Are claim documents, medical reports and investigation notes retained and deleted according to approved rules? | RETENTION | Claims retention schedule |
| `BFSI-INS-006` | Are AI/analytics tools used for underwriting, fraud or claim triage reviewed for privacy risk? | SDF_AI | AI review, model documentation |
| `BFSI-INS-007` | Are nominee/beneficiary requests verified before disclosure or update? | RIGHTS / ACCURACY | Nominee verification SOP |
| `BFSI-INS-008` | Are agent/broker-led data collection journeys governed and monitored? | VENDOR / NOTICE | Agent scripts, partner controls |

---

### 11.5 Capital markets, broking and wealth pack

| Code | Question | Domain | Evidence |
|---|---|---|---|
| `BFSI-CAP-001` | Are investor KYC, demat, trading, portfolio, advisory and suitability data mapped? | INV / ROPA | Investor data inventory |
| `BFSI-CAP-002` | Are trading apps, back-office systems, CRM and depository integrations included in data-flow maps? | ROPA | System/data-flow diagram |
| `BFSI-CAP-003` | Are investor notices available during account opening, app onboarding and advisory onboarding? | NOTICE | App screenshots, forms |
| `BFSI-CAP-004` | Are risk-profiling and suitability questionnaires limited to required investment-advisory purposes? | PURPOSE | Suitability form review |
| `BFSI-CAP-005` | Are marketing/cross-sell communications separated from mandatory service/transaction communications? | CONSENT | Preference centre, campaign controls |
| `BFSI-CAP-006` | Are SEBI-regulated cyber/security control obligations mapped as additional security overlay where applicable? | SECURITY | CSCRF mapping, cyber audit report |
| `BFSI-CAP-007` | Are third-party trading technology, back-office, KYC, cloud and communication vendors mapped? | VENDOR | Vendor register |
| `BFSI-CAP-008` | Are investor grievances related to data accuracy, unauthorised sharing or marketing misuse routed to DPDP workflow? | GRIEVANCE / RIGHTS | Complaint workflow |

---

### 11.6 Collections and recovery pack

| Code | Question | Domain | Evidence |
|---|---|---|---|
| `BFSI-COL-001` | Are recovery agents and collection agencies mapped as vendors/processors where they access borrower personal data? | VENDOR | Collection vendor register |
| `BFSI-COL-002` | Is borrower data shared with recovery agents limited to what is necessary for recovery purpose? | PURPOSE | Data-sharing template, field app fields |
| `BFSI-COL-003` | Are recovery notes, call recordings and field visit records protected and retained appropriately? | SECURITY / RETENTION | Collections system access controls |
| `BFSI-COL-004` | Are agents trained not to misuse borrower contacts, references or family information? | GOV / VENDOR | Training logs, code of conduct |
| `BFSI-COL-005` | Are complaints about data misuse by recovery agents escalated as DPDP/vendor-risk events? | GRIEVANCE / VENDOR | Complaint categorisation, RCA |
| `BFSI-COL-006` | Are vendor users disabled promptly after engagement termination? | SECURITY | IAM offboarding logs |

---

## 12. Suggested BFSI ROPA records

The following ROPA templates should be available in the BFSI template engine.

| ROPA activity | Sub-sector | Default risk | Key Data Principals | Systems/vendors to map |
|---|---|---|---|---|
| Retail customer account opening | Banking | High | Applicant, customer, nominee | CBS, onboarding portal, CKYC, KYC vendor |
| Customer KYC and periodic KYC refresh | Banking/NBFC/Markets/Insurance | High | Customer, beneficial owner, authorised signatory | KYC system, CKYC, V-CIP vendor |
| Digital loan application and underwriting | NBFC/Digital lending | High | Borrower, co-applicant, guarantor | LOS, bureau, LSP, loan app |
| Credit bureau enquiry and reporting | Lending/BFSI | High | Borrower/customer | Bureau API, LOS, LMS |
| Loan servicing and collections | Lending/NBFC/Bank | High | Borrower, guarantor, references | LMS, collections app, recovery agency |
| Payment transaction processing | Payments/Bank | High | Customer, merchant, cardholder | Payment gateway, switch, fraud engine |
| Card issuance and card transaction monitoring | Bank/Payments | High | Cardholder | Card platform, processor, fraud engine |
| Wallet/PPI onboarding and transaction processing | Payments | High | Wallet user, merchant | Wallet system, KYC provider, payment processor |
| Insurance proposal and underwriting | Insurance | High | Proposer, life assured, nominee | Policy admin, medical vendor, agent platform |
| Insurance claims processing | Insurance | High | Policyholder, claimant, beneficiary | Claims platform, TPA, hospital, surveyor |
| Health insurance medical records processing | Insurance | Critical/High | Policyholder, claimant, patient | TPA, hospital, claims system |
| Trading/demat account opening | Capital markets | High | Investor, authorised signatory | Trading app, KYC system, depository integration |
| Investment advisory risk profiling | Wealth/Advisory | Medium/High | Investor/client | Advisory CRM, portfolio tool |
| Customer service and complaint handling | All BFSI | Medium/High | Customer, complainant | CRM, call centre, telephony vendor |
| Marketing and cross-sell campaigns | All BFSI | Medium/High | Prospect, customer | CRM, campaign platform, analytics |
| Fraud and AML transaction monitoring | All BFSI | High | Customer, transaction party | Fraud engine, AML system, data lake |
| AI credit scoring / underwriting | Lending/BFSI | High | Borrower/applicant | Model platform, LOS, data lake, AI vendor |
| Data lake and analytics processing | All BFSI | High | Customers/investors/policyholders | Data lake, BI, analytics vendors |
| Employee HRMS and payroll | All BFSI | Medium | Employee, contractor | HRMS, payroll vendor |
| Vendor support and remote access | All BFSI | High | Customers indirectly exposed | ITSM, remote access, vendors |
| Breach and security incident management | All BFSI | High | Affected Data Principals | SIEM, incident management, forensics |

---

## 13. BFSI evidence checklist

Use this checklist during the assessment and evidence review.

### 13.1 Governance evidence

- DPDP owner appointment note
- DPDP governance charter
- Board/risk/compliance committee minutes
- Privacy steering committee agenda
- DPDP responsibility matrix
- Internal audit plan covering DPDP/privacy controls
- Product-launch privacy review checklist

### 13.2 Data inventory and ROPA evidence

- Data inventory / data dictionary
- System inventory and application register
- ROPA / Processing Activity Register
- Data-flow diagrams for onboarding/KYC/lending/payments/insurance/trading
- Data lake lineage and BI extract register
- Vendor data-flow mapping
- API data-flow diagrams

### 13.3 Notice and consent evidence

- Website/app privacy notice screenshots
- Onboarding journey screenshots
- Consent text and consent logs
- Notice version history
- Withdrawal workflow screenshots
- Marketing preference centre
- Call-centre scripts mentioning notice/recording
- Agent/broker/DSA onboarding scripts

### 13.4 Vendor and outsourcing evidence

- Vendor register
- Vendor risk rating
- Data Processor classification
- Contracts and DPDP addenda
- Sub-processor list
- Security due diligence questionnaire
- Vendor access logs
- Vendor incident notification clause
- Exit/deletion certificate template

### 13.5 Security evidence

- RBAC matrix
- Privileged access review
- SIEM/log monitoring evidence
- Encryption configuration
- Data masking policy
- DLP/export-control logs
- API security report
- VAPT report
- DR/BCP test report
- Test data masking/anonymisation evidence

### 13.6 Breach readiness evidence

- Personal data breach response playbook
- Cyber incident response plan
- Data Principal notification template
- Board/regulatory notification matrix
- Vendor incident escalation matrix
- Tabletop drill report
- Incident RCA template
- Evidence preservation SOP

### 13.7 AI/analytics evidence

- AI/ML model inventory
- Feature/input data list
- Model risk review
- Human review workflow
- Vendor AI contract/security review
- AI usage policy for employees
- Prompt/data minimisation control
- Model validation and monitoring reports

---

## 14. BFSI red flags and score-cap guidance

These red flags should influence DPDP Compass scoring and executive dashboard.

| Red flag | Suggested severity | Suggested score cap |
|---|---:|---:|
| No DPDP owner for BFSI data processing | Critical | 60 |
| No customer/personal data inventory | Critical | 55 |
| No ROPA for major BFSI processes | Critical | 60 |
| No notice at onboarding/KYC/loan/policy/trading journeys | Critical | 60 |
| No consent audit trail where consent is used | Critical | 65 |
| App collects excessive permissions without review | Critical | 55 |
| No vendor/Data Processor register | Critical | 65 |
| LSP/agent/TPA/call-centre processing not controlled | High/Critical | 65 |
| No breach response playbook | Critical | 65 |
| No security evidence for KYC/financial data systems | Critical | 60 |
| No retention schedule for KYC/transaction/loan/policy records | High | 70 |
| AI credit/fraud/underwriting model without privacy review | High/Critical | 65 |
| Data lake/analytics copies not inventoried | Critical | 60 |
| Cross-border/cloud data location unknown for critical systems | High | 70 |
| Children/minor data without guardian/legal review | Critical | 50 |

---

## 15. BFSI dashboard additions

In addition to the standard DPDP Compass dashboards, BFSI reports should include a BFSI process view.

### 15.1 BFSI process dashboard

| Process | Metrics to show |
|---|---|
| Onboarding/KYC | Notice, consent, KYC document security, retention, vendor linkage |
| Digital lending | Consent audit trail, app permissions, LSP governance, bureau use, collections |
| Payments/cards/wallet | Transaction data, fraud monitoring, API security, payment processor vendors |
| Insurance | Proposal, underwriting, health data, claims, TPA/hospital/vendor sharing |
| Capital markets/wealth | Investor KYC, trading data, suitability, advisory, SEBI cyber overlay |
| CRM/call centre | Call recordings, support access, grievance, scripts, outsourced users |
| Marketing/cross-sell | Consent, preference, withdrawal, campaign suppression, profiling |
| Data lake/AI | ROPA, model inventory, AI review, data minimisation, access controls |
| Vendors/outsourcing | Contract status, DPDP clauses, incident clauses, sub-processors, review status |
| Breach readiness | Playbook, notifications, drills, vendor coordination, evidence preservation |

### 15.2 BFSI executive metrics

- DPDP Compass Score
- Evidence Confidence Score
- BFSI high-risk processing count
- KYC/document controls maturity
- Digital lending/app privacy risk score
- Vendor/LSP/processor risk count
- AI/analytics risk count
- Data lake visibility score
- Breach readiness score
- Open P0/P1 remediation actions

---

## 16. BFSI report additions

The Executive DPDP Readiness Report for BFSI should add:

1. BFSI data-processing landscape summary
2. KYC and onboarding readiness
3. Digital lending / app privacy review, where applicable
4. Vendor/LSP/outsourcing governance summary
5. Customer rights and grievance readiness
6. Data lake and analytics visibility
7. AI/algorithmic risk summary
8. Breach and cyber-privacy readiness
9. Sectoral regulatory overlay notes
10. Priority 30/60/90-day remediation roadmap

Suggested report language:

> “The organisation operates in a high-trust, data-intensive BFSI environment. DPDP readiness should therefore focus not only on privacy notices and policies, but also on customer data inventory, KYC/document governance, vendor/LSP controls, consent traceability, digital-channel minimisation, breach readiness, and AI/analytics oversight.”

---

## 17. BFSI UAT scenario

Use the following UAT scenario to test the BFSI template.

### Scenario: Digital lending NBFC with app, bureau, LSP and collections vendors

| Step | Expected system behaviour |
|---|---|
| Register organisation as NBFC / Digital Lending | BFSI template selected |
| Select processes: onboarding, KYC, bureau, loan underwriting, collections, marketing | BFSI lending packs loaded |
| Select vendors: LSP, bureau, payment gateway, cloud, SMS/WhatsApp, collection agency | Vendor and processor packs triggered |
| Select AI usage: credit scoring and fraud analytics | AI/algorithmic risk pack triggered |
| Select mobile app permissions | App permission/minimisation questions triggered |
| Generate assessment | Core + BFSI + Digital Lending + Vendor + AI + Cloud packs appear |
| Add ROPA records | Digital loan application, bureau check, loan servicing, collections, marketing, AI scoring |
| Upload evidence | Consent logs, app screenshots, LSP contract, model review, retention schedule |
| Calculate score | Evidence caps and red flags applied |
| Generate gaps | Missing consent audit trail, LSP clauses, app permission review, AI review, breach drill |
| Generate report | BFSI-specific executive report sections appear |
| Run reassessment | Closed actions improve score and evidence confidence |

---

## 18. Notes for AI coding agent

When implementing this BFSI template in TrustStack DPDP Compass:

1. Store every question as a versioned record.
2. Do not hardcode BFSI questions in frontend.
3. Use `industry_code = bfsi` and optional `sub_sector_code`.
4. Use dynamic triggers such as KYC, digital lending, payments, insurance, capital markets, vendors, cloud, AI, minors and marketing.
5. Map every industry question back to the 16 DPDP Compass domains.
6. Do not create a separate BFSI score outside the standard DPDP Compass score.
7. Create a BFSI process dashboard as an additional view.
8. Treat BFSI evidence as highly sensitive.
9. Apply strong tenant isolation and RBAC for all BFSI records.
10. AI Assistant may explain BFSI questions and draft ROPA, but must not certify RBI/SEBI/IRDAI/DPDP compliance.
11. Sectoral references should appear as “additional check areas”, not as statutory certification claims.
12. Use report caveats on every export.

---

## 19. Suggested database seed tags

| Tag | Meaning |
|---|---|
| `industry:bfsi` | Applies to BFSI overall |
| `subsector:banking` | Banking-specific |
| `subsector:nbfc` | NBFC/lending-specific |
| `subsector:digital_lending` | Digital lending and LSP-specific |
| `subsector:payments` | Payment/wallet/card/merchant-specific |
| `subsector:insurance` | Insurance-specific |
| `subsector:capital_markets` | SEBI-regulated market intermediaries |
| `trigger:kyc` | KYC/identity verification |
| `trigger:bureau` | Credit bureau use |
| `trigger:lsp` | Lending service provider |
| `trigger:collections` | Recovery and collections |
| `trigger:ai_scoring` | AI/ML decisioning or scoring |
| `trigger:cloud` | Cloud/SaaS processing |
| `trigger:marketing` | Campaign/cross-sell/profiling |
| `trigger:minor` | Minor/child data |
| `trigger:health_data` | Insurance/medical data |
| `evidence:high_sensitivity` | Strong evidence controls required |

---

## 20. Summary

The BFSI DPDP Compass overlay should make the assessment significantly sharper for financial organisations by focusing on:

- KYC and identity-data governance
- Customer onboarding and digital journeys
- Consent traceability and withdrawal
- Customer rights across distributed systems
- Vendor, LSP, DSA, TPA and cloud governance
- Data lake, analytics and AI/ML processing
- Credit bureau and dispute correction flows
- Payments, cards, wallets and transaction data
- Insurance health/claims data
- Capital market investor and trading data
- Breach readiness and security evidence
- Retention/erasure aligned with regulatory/legal requirements
- Evidence-backed maturity and executive remediation roadmap

This file should be used as the **BFSI industry overlay** in the TrustStack™ DPDP Compass platform.
