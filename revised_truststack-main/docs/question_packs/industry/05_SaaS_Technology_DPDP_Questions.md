# 05 — SaaS / Technology Platforms DPDP Questions
## TrustStack™ DPDP Compass — Industry Question Bank

**Industry:** SaaS / Technology Platforms / Software Product Companies / Cloud Applications / API Platforms / AI-enabled Products  
**Use in product:** Industry overlay on top of the Core 16-Domain DPDP Compass Assessment  
**Version:** v1.0  
**Prepared for:** TrustStack™ DPDP Compass assessment engine, consultant-led assessments, ROPA module, evidence review, dashboards/reports, and AI Assistant guidance

---

## 1. How to use this industry file

This file is an **industry overlay**. It should not replace the core DPDP Compass assessment.

The correct assessment design is:

```text
Core DPDP Compass 16-domain assessment
+ SaaS / Technology industry overlay
+ Conditional packs: vendors, sub-processors, cloud, API, AI, children, marketing, breach, cross-border
+ Organisation-specific dynamic questions for products, modules, tenants, systems, vendors and ROPA records
```

The SaaS / Technology overlay should be used for:

- B2B SaaS products,
- B2C software platforms,
- subscription web applications,
- mobile-first technology platforms,
- HRTech, MarTech, SalesTech, LegalTech, FinTech SaaS, HealthTech SaaS and EdTech SaaS,
- API platforms,
- developer platforms,
- workflow automation tools,
- analytics platforms,
- AI products and AI assistants,
- marketplace platforms,
- low-code/no-code platforms,
- cloud-hosted enterprise applications,
- customer-support platforms,
- CRM/ERP/HRMS/LMS-style product companies,
- managed technology service providers.

Important positioning:

> SaaS and technology platforms often process personal data continuously through user accounts, product telemetry, logs, support tickets, integrations, APIs, analytics, AI features, payment flows and sub-processors. DPDP Compass should therefore treat SaaS assessments as **API-heavy, tenant-sensitive, vendor-heavy, security-heavy and AI-risk-sensitive**.

---

## 2. Research and regulatory baseline used

This question bank is designed around the DPDP Compass framework and the practical SaaS/product operating environment in India.

### 2.1 DPDP baseline

The SaaS template must map to the same 16 domains used across all DPDP Compass assessments:

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

### 2.2 SaaS / Technology sector references to consider

These references should be used as **sector context**, not as a replacement for DPDP legal analysis:

| Reference area | Why it matters for DPDP Compass SaaS assessment |
|---|---|
| Digital Personal Data Protection Act, 2023 | Main legal baseline for processing digital personal data in India |
| Digital Personal Data Protection Rules, 2025 | Operational baseline for notice, safeguards, breach intimation, rights, children and other implementation areas |
| CERT-In Directions dated 28 April 2022 | Useful cyber incident reporting, log retention, time synchronisation and point-of-contact context where applicable |
| IT Intermediary Guidelines and Digital Media Ethics Code Rules, 2021 | Relevant only where the platform acts as an intermediary, enables user-generated content, social/community interaction or content hosting |
| OWASP API Security Top 10 | Useful for API security, object-level access control, authentication, authorization and excessive data exposure risks |
| OWASP Top 10 for LLM Applications | Useful for AI assistant, prompt injection, data leakage, RAG and model governance risks |
| ISO 27001 / SOC 2 / cloud security practices | Useful evidence references for enterprise SaaS trust, but not substitutes for DPDP assessment |
| Customer Data Processing Agreements / SaaS Terms | Important for Data Fiduciary/Data Processor role clarity and sub-processor transparency |

### 2.3 Important SaaS distinction

SaaS companies must distinguish between these roles:

| Role | Meaning in assessment |
|---|---|
| Platform as Data Fiduciary | The SaaS company determines purpose and means of processing its own users, prospects, employees or direct customers |
| Platform as Data Processor | The SaaS company processes personal data on behalf of business customers under contract |
| Platform as both | Common in B2B SaaS: processor for customer workspace data, fiduciary for account billing, product analytics, website visitors and support users |
| Customer admin role | Client administrators may configure access, upload users and control internal use |
| Sub-processor role | Cloud, AI, email, analytics, support, logging and payment vendors may process personal data for the SaaS provider |

The product should not assume one role automatically. It should ask questions to identify role per processing activity.

---

## 3. Typical SaaS / technology organisation types

| Organisation type | Examples | Assessment emphasis |
|---|---|---|
| B2B SaaS | HRMS, CRM, LMS, compliance tool, workflow platform | Processor role, customer tenant data, sub-processors, API security |
| B2C SaaS | Personal productivity app, consumer subscription app | Notice, consent, account data, deletion, marketing, mobile app tracking |
| API platform | Identity API, payment API, communication API, verification API | API security, logs, customer credentials, data minimisation, breach |
| AI SaaS | AI assistant, document AI, chatbot, AI analytics | AI data use, prompts, embeddings, model providers, human review |
| Marketplace platform | Buyer-seller/service provider marketplace | Multiple Data Principal groups, user-generated content, payments, disputes |
| Developer platform | SDK, API keys, logs, cloud tooling | developer data, telemetry, secrets, audit logs, sub-processors |
| Analytics platform | BI, marketing analytics, product analytics | event data, profiling, aggregated data, retention, consent linkage |
| HRTech SaaS | Applicant tracking, payroll, attendance, performance | employee/candidate data, customer processor role, retention, access |
| MarTech SaaS | Campaign automation, lead scoring, CRM enrichment | marketing consent, profiling, opt-out, data sources, vendor roles |
| Security SaaS | SIEM, vulnerability scanning, identity, monitoring | logs, employee/customer identifiers, security evidence, incident response |
| Cloud-hosted product company | ERP/CRM/portal/product suite | cloud location, access control, admin roles, operational monitoring |
| Low-code/no-code platform | App builder, automation platform | customer-built forms, unpredictable data collection, tenant controls |

---

## 4. Typical Data Principal groups

| Data Principal group | Examples |
|---|---|
| Platform users | Admins, end users, workspace users |
| Customer employees | Employees using customer workspace |
| Customer end customers | Data uploaded by business customers into SaaS product |
| Prospects/leads | Website visitors, demo requesters, trial users |
| Customer administrators | Tenant admins, billing admins, security admins |
| Developers | API users, integration developers, SDK users |
| Support requesters | Users raising tickets or chat requests |
| Community/forum users | Users posting content where community features exist |
| Payment users | Card/account/payment/contact data depending flow |
| Employees and contractors | Internal workforce data |
| Job applicants | Recruitment/applicant data |
| Partners/resellers | Channel users, implementation partners |
| Children/minors | Relevant for EdTech, gaming, creator platforms, learning or consumer apps |
| Visitors | Office visitors, event attendees, webinar participants |

---

## 5. Typical personal data categories

| Data category | Examples |
|---|---|
| Account identity data | Name, email, mobile, username, password hash, MFA settings |
| Organisation/workspace data | company name, role, designation, department, tenant membership |
| Authentication and access data | login history, IP address, device, session, security logs |
| Product usage data | clicks, features used, events, telemetry, usage analytics |
| Support data | tickets, chat transcripts, call recordings, screenshots, attachments |
| Customer-uploaded data | files, documents, form submissions, records, imported datasets |
| API data | API keys, request metadata, payload logs where captured |
| Billing data | invoice, GST details, billing contact, payment reference |
| Marketing data | leads, campaign history, consent preferences, cookies, pixels |
| Communication data | email/SMS/WhatsApp logs, notification preferences |
| AI interaction data | prompts, uploaded files, model outputs, embeddings, feedback |
| Device/app data | device ID, app version, operating system, crash logs |
| Location data | approximate IP location, delivery or field-service location if collected |
| Employee data | HR, payroll, access, attendance, performance |
| Candidate data | CV, interview feedback, assessment records |
| Children’s data | age, grade, parent contact, learning/app usage where relevant |

---

## 6. Typical systems and applications to map

| System/application | Why it matters |
|---|---|
| SaaS product database | Core customer/user data |
| Identity/auth system | login, MFA, SSO, sessions, roles |
| Admin console | powerful internal access to tenant data |
| Customer admin panel | customer-controlled user and data management |
| API gateway | external and internal data access |
| Product analytics | event/telemetry data |
| Logging/observability tools | logs may contain personal data or secrets |
| Customer support platform | tickets, attachments, screenshots, chat transcripts |
| CRM | prospects, leads, customers, contacts |
| Marketing automation | campaigns, segmentation, consent and opt-out |
| Billing/subscription platform | invoices, payment references, billing contacts |
| Data warehouse/lake | replicated product/customer data |
| AI/ML platform | prompts, embeddings, model inference, training/evaluation data |
| Object storage | uploaded files, exports, reports, evidence |
| Email/SMS/WhatsApp service | customer communications |
| Integration platform | webhooks, iPaaS, customer connectors |
| Internal collaboration tools | Slack/Teams/email, shared docs, screenshots |
| HRMS/recruitment system | employee and candidate data |
| Security tools | SIEM, IAM, audit logs, endpoint/security alerts |

---

## 7. Typical vendors and sub-processors

| Vendor / sub-processor category | Examples to check |
|---|---|
| Cloud infrastructure | AWS, Azure, Google Cloud, OCI, regional CSPs |
| Database hosting | Managed PostgreSQL, MongoDB, data warehouse |
| Object storage/CDN | S3/R2/blob storage/CDN providers |
| Authentication provider | Auth0, Clerk, Firebase, Azure AD, Okta |
| Email/SMS/notification | SendGrid, SES, Twilio, WhatsApp providers |
| Customer support | Zendesk, Freshdesk, Intercom, HubSpot service tools |
| Product analytics | PostHog, Mixpanel, Amplitude, GA, telemetry tools |
| Error monitoring/logging | Sentry, Datadog, New Relic, LogRocket |
| AI providers | OpenAI, Anthropic, Google, Azure AI, private models |
| Payment/subscription | Razorpay, Stripe, Chargebee, Zoho Billing |
| CRM/marketing | Salesforce, HubSpot, Zoho, Mailchimp, marketing pixels |
| File processing/OCR | document extraction, virus scanning, PDF tools |
| Security vendors | VAPT, WAF, SIEM, endpoint, identity security |
| Cloud backup/DR | backup, replication, archive providers |
| Implementation partners | customer onboarding, support, managed services |
| Freelancers/contractors | product support, data migration, development access |

---

## 8. Key DPDP risks in SaaS / Technology platforms

| Risk area | What can go wrong |
|---|---|
| Role ambiguity | SaaS company does not know when it is Data Fiduciary vs Data Processor |
| Multi-tenant leakage | customer A data visible to customer B or wrong admin |
| API authorization weakness | IDOR/BOLA exposes personal data through object identifiers |
| Excessive logging | personal data, tokens or secrets captured in application logs |
| Support access risk | support/admin team accesses client tenant data without control |
| Sub-processor opacity | customers do not know cloud, AI, analytics or support vendors used |
| AI data leakage | prompts/uploads/customer records sent to AI provider without governance |
| Product analytics overcollection | unnecessary event capture, profiling and retention |
| Poor deletion | deleted user/customer data remains in backups/logs/warehouse indefinitely |
| Weak tenant offboarding | customer data not exported/deleted after subscription termination |
| Unclear notices | website/product/app notices do not explain product data use clearly |
| Consent confusion | marketing consent mixed with service communication or product terms |
| Cross-border uncertainty | cloud, CDN, AI and support tools store/process data outside India without review |
| Weak breach readiness | cyber incident process not mapped to DPDP personal-data breach workflows |
| Unsecured webhooks/integrations | customer connectors leak data or accept forged requests |
| Shadow AI/dev tools | engineering/support uses personal data in external tools without approval |

---

## 9. SaaS role-classification logic for DPDP Compass

The assessment should ask role-classification questions early.

| Processing activity | Likely role to review | Example |
|---|---|---|
| Website visitor/demo lead data | Data Fiduciary | SaaS company collects leads for sales |
| Direct trial user account | Data Fiduciary | user signs up directly with product |
| Customer workspace records uploaded by client | Data Processor or processor-like role | HRTech SaaS processes employees on behalf of client |
| Product telemetry for service improvement | Role to review | may be fiduciary or processor depending purpose and contract |
| Billing and invoices | Data Fiduciary | billing contact and payment records |
| Support tickets | Role to review | depends on ticket content and contract |
| AI feature using customer data | Role to review | depends on who determines purpose and model use |
| Employee/candidate data | Data Fiduciary | internal HR and hiring data |

### Role-classification question

> For each processing activity, has the organisation documented whether it acts as Data Fiduciary, Data Processor/service provider, or both, and does the contract/notice reflect this position?

---

## 10. Industry-specific assessment questions

The following questions are designed as a **SaaS / Technology overlay**. They should be added on top of the core DPDP questions and triggered based on organisation profile, product model, data flows, vendors and AI usage.

### 10.1 Governance, accountability and DPDP ownership — GOV

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-GOV-001 | Has the company assigned DPDP ownership for product, website, customer data, support data and internal HR data separately? | DPDP charter, owner matrix, RACI | CEO / Legal / Product |
| SAAS-GOV-002 | Has the company documented when it acts as Data Fiduciary and when it acts as Data Processor/service provider for each product module? | Data role matrix, DPA, product terms | Legal / Product |
| SAAS-GOV-003 | Are privacy and security requirements included in product management, sprint planning and release governance? | SDLC checklist, Jira workflow, release checklist | Product / Engineering |
| SAAS-GOV-004 | Is there a privacy review checkpoint before launching new product features, integrations, analytics or AI capabilities? | Privacy review form, feature approval records | Product / Legal / Security |
| SAAS-GOV-005 | Is DPDP accountability assigned for support operations and privileged internal access to customer tenants? | Support access SOP, access approval logs | Customer Success / Security |
| SAAS-GOV-006 | Are founders/CXOs periodically briefed on DPDP risk, breach readiness, vendor posture and high-risk processing? | Steering committee notes, dashboard, board pack | CEO / COO / CISO |
| SAAS-GOV-007 | Are product, engineering, support, sales and marketing teams trained on handling personal data in SaaS workflows? | Training records, policy acknowledgment | HR / Security |
| SAAS-GOV-008 | Does the company maintain a release-time privacy sign-off for customer-facing changes? | Release checklist, sign-off evidence | Product / Engineering |
| SAAS-GOV-009 | Are customer contractual commitments about privacy, data processing and sub-processors tracked centrally? | Contract obligation register | Legal / Sales Ops |
| SAAS-GOV-010 | Is there a named accountable owner for responding to Data Principal requests and customer privacy queries? | Responsibility note, helpdesk routing | Legal / Support |

### 10.2 Personal data discovery and inventory — INV

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-INV-001 | Has the company inventoried all personal data collected through website, trial signup, product, APIs, support and billing? | Data inventory, data map | Product / Data |
| SAAS-INV-002 | Are customer-uploaded data categories documented separately from platform user/account data? | Data-category register, schema map | Product / Engineering |
| SAAS-INV-003 | Are product telemetry, analytics events, logs and crash reports reviewed for personal data? | Event catalogue, telemetry map | Engineering / Data |
| SAAS-INV-004 | Are API payloads, webhooks and integration data flows included in the personal data inventory? | API data map, integration register | Engineering / Platform |
| SAAS-INV-005 | Are support tickets, attachments, screenshots and chat transcripts included in the inventory? | Support data map, helpdesk fields | Customer Support |
| SAAS-INV-006 | Are marketing, demo, webinar, CRM and sales data categories included in the inventory? | CRM fields, campaign tools | Sales / Marketing |
| SAAS-INV-007 | Are internal employee, contractor, developer and admin-access records included in the inventory? | HRMS/IAM logs inventory | HR / Security |
| SAAS-INV-008 | Are AI prompts, uploaded files, embeddings, model outputs and feedback captured in the inventory where AI features exist? | AI data-flow map, prompt logs policy | AI/Product/Data |
| SAAS-INV-009 | Are replicated data stores such as warehouses, backups, search indexes, caches and logs included? | Data architecture diagram | Engineering / Data |
| SAAS-INV-010 | Are personal data fields tagged in database schemas, event streams, API schemas and object-storage paths? | Data catalogue, schema annotation | Engineering / Data |

### 10.3 ROPA / Processing Activity Register — ROPA

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-ROPA-001 | Is there a ROPA record for customer/user account registration and login? | ROPA record, auth flow | Product / Legal |
| SAAS-ROPA-002 | Is there a ROPA record for customer workspace data processed through the SaaS product? | ROPA, product data-flow | Product / Engineering |
| SAAS-ROPA-003 | Is there a ROPA record for product telemetry, analytics and usage tracking? | ROPA, event catalogue | Data / Product |
| SAAS-ROPA-004 | Is there a ROPA record for customer support and troubleshooting access? | ROPA, support SOP | Support / Security |
| SAAS-ROPA-005 | Is there a ROPA record for API integrations and webhooks? | ROPA, API docs | Platform Engineering |
| SAAS-ROPA-006 | Is there a ROPA record for AI-assisted features, prompts, embeddings or model inference? | AI ROPA, model data flow | AI/Product |
| SAAS-ROPA-007 | Is there a ROPA record for marketing, lead generation and demo workflows? | ROPA, CRM/campaign records | Marketing / Sales |
| SAAS-ROPA-008 | Is there a ROPA record for billing, subscriptions and invoicing? | ROPA, billing system map | Finance / Sales Ops |
| SAAS-ROPA-009 | Are ROPA records linked to systems, vendors, notices, consents, retention rules and evidence? | ROPA linkage report | DPDP Owner |
| SAAS-ROPA-010 | Is ROPA updated when new product modules, integrations, AI tools or sub-processors are launched? | Change log, release sign-off | Product / Legal |

### 10.4 Purpose, lawful basis and data minimisation — PURPOSE

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-PUR-001 | Is every personal data field in signup, onboarding and profile pages mapped to a clear purpose? | Field-purpose matrix | Product / Legal |
| SAAS-PUR-002 | Are required and optional data fields separated in user onboarding? | UI screenshots, form design | Product |
| SAAS-PUR-003 | Are product telemetry events limited to what is needed for security, service operation, analytics or improvement? | Event catalogue, minimisation review | Data / Product |
| SAAS-PUR-004 | Are support teams prevented from requesting unnecessary personal data in tickets or chats? | Support scripts, ticket templates | Support |
| SAAS-PUR-005 | Are API logs designed to avoid storing full personal data payloads where metadata is sufficient? | Logging policy, sample logs | Engineering / Security |
| SAAS-PUR-006 | Are AI prompts/uploads limited to data required for the specific AI feature? | AI data minimisation checklist | AI/Product |
| SAAS-PUR-007 | Are marketing enrichment, profiling or lead scoring activities mapped to a clear purpose and review status? | CRM workflow, marketing assessment | Marketing / Legal |
| SAAS-PUR-008 | Are customer-uploaded datasets used only for contractual/service purposes unless separately authorised? | DPA, product terms, access logs | Legal / Product |
| SAAS-PUR-009 | Are data exports and reporting features designed to avoid unnecessary personal data exposure? | Export schema, report templates | Product / Engineering |
| SAAS-PUR-010 | Are test, demo and sandbox environments prohibited from using live personal data unless formally approved and protected? | SDLC policy, test-data policy | Engineering / Security |

### 10.5 Notice management — NOTICE

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-NOT-001 | Is the website privacy notice clear for prospects, visitors, demo requesters and trial users? | Website notice, screenshots | Legal / Marketing |
| SAAS-NOT-002 | Is the in-product notice or privacy link visible during signup/onboarding? | Signup screenshots, notice version | Product / Legal |
| SAAS-NOT-003 | Does the notice explain key product data uses such as account management, support, analytics, security and billing? | Notice text, purpose table | Legal / Product |
| SAAS-NOT-004 | Does the notice explain AI-feature data use where AI is offered? | AI notice section, feature docs | Legal / AI/Product |
| SAAS-NOT-005 | Does the notice explain cookies, SDKs, analytics and marketing trackers where used? | Cookie notice, tracker list | Marketing / Legal |
| SAAS-NOT-006 | Does the notice identify how users can exercise rights or contact the organisation? | Notice contact section | Legal / Support |
| SAAS-NOT-007 | Are notice versions tracked and linked to product release dates? | Notice version history | Legal / Product |
| SAAS-NOT-008 | Are customer-specific or white-labelled deployments mapped to the right notice/terms responsibility? | Customer contracts, white-label terms | Legal / Customer Success |
| SAAS-NOT-009 | Are notices available at the actual collection points, not only in the footer? | UI screenshots, product flows | Product |
| SAAS-NOT-010 | Are material changes to privacy notice communicated to users/customers appropriately? | Change communication records | Legal / Customer Success |

### 10.6 Consent and consent withdrawal — CONSENT

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-CON-001 | Are consents captured where required through clear affirmative action rather than pre-ticked or bundled choices? | UI screenshots, consent logs | Product / Legal |
| SAAS-CON-002 | Are marketing consent preferences separated from account/service communications? | Preference centre, campaign settings | Marketing / Product |
| SAAS-CON-003 | Can users withdraw or change optional communication/marketing preferences easily? | Preference centre, unsubscribe logs | Marketing / Support |
| SAAS-CON-004 | Is consent status stored with timestamp, channel, version and purpose where consent is relied on? | Consent database/logs | Engineering / Legal |
| SAAS-CON-005 | Are consent records linked to the notice version shown at the time of collection? | Consent-notice linkage | Product / Engineering |
| SAAS-CON-006 | Are cookie, SDK or tracker choices captured and respected where consent/preference is required? | CMP/tool config, tracker scan | Marketing / Legal |
| SAAS-CON-007 | Are AI optional features enabled only after appropriate notice/consent/contract review where required? | Feature toggle records, legal review | Product / AI |
| SAAS-CON-008 | Are withdrawal requests propagated to downstream systems, marketing tools and support tools? | Workflow evidence, suppression list | Marketing / Engineering |
| SAAS-CON-009 | In B2B SaaS, is responsibility for obtaining end-user consent clearly allocated between customer and SaaS provider? | DPA, terms, customer admin guidance | Legal / Sales |
| SAAS-CON-010 | Are consent logs retained in a way that supports proof without retaining unnecessary personal data? | Consent retention policy | Legal / Engineering |

### 10.7 Data Principal rights — RIGHTS

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-RGT-001 | Is there a defined workflow for user access, correction, erasure and grievance requests? | Rights SOP, ticket categories | Legal / Support |
| SAAS-RGT-002 | Can account users access and correct basic profile/contact information? | Product screenshots | Product |
| SAAS-RGT-003 | Can the organisation locate user data across product DB, logs, support, CRM, billing and analytics tools? | Data map, search procedure | Engineering / Support |
| SAAS-RGT-004 | In B2B SaaS, is there a workflow to redirect or coordinate end-user requests with the business customer where appropriate? | DPA workflow, support SOP | Legal / Customer Success |
| SAAS-RGT-005 | Does deletion/erasure workflow cover active systems, backups, logs, warehouses and sub-processors where applicable? | Deletion SOP, data lifecycle map | Engineering / Legal |
| SAAS-RGT-006 | Are rights requests tracked with status, owner, due date and closure evidence? | Ticketing report, request register | Support / Legal |
| SAAS-RGT-007 | Are rights request responses reviewed for identity verification and data minimisation? | SOP, sample reviewed tickets | Support / Legal |
| SAAS-RGT-008 | Are customer admins provided with tools or guidance to support end-user data requests? | Admin docs, export/delete features | Product / Customer Success |

### 10.8 Grievance redressal and contact publication — GRIEVANCE

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-GRV-001 | Is a privacy/DPDP contact channel published on website and within product support routes? | Website/product screenshots | Legal / Support |
| SAAS-GRV-002 | Are privacy complaints distinguishable from normal product-support tickets? | Ticket categories, routing rules | Support |
| SAAS-GRV-003 | Are grievance response timelines, owners and escalation paths defined? | Grievance SOP, SLA report | Support / Legal |
| SAAS-GRV-004 | Are customer-facing support teams trained to identify privacy/data-protection complaints? | Training records, scripts | Support / HR |
| SAAS-GRV-005 | Are grievance records linked to product, account, evidence, ROPA or breach records where relevant? | Ticket linkage, audit trail | Support / Engineering |
| SAAS-GRV-006 | For intermediary/community platforms, are IT Rules grievance workflows reviewed separately where applicable? | Intermediary applicability note | Legal |
| SAAS-GRV-007 | Are unresolved or high-risk grievances escalated to legal/security leadership? | Escalation logs | Legal / CISO |

### 10.9 Retention, erasure and archival — RETENTION

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-RET-001 | Are retention periods defined for account data, customer workspace data, telemetry, logs, support tickets and billing records? | Retention schedule | Legal / Engineering |
| SAAS-RET-002 | Does customer offboarding trigger export, archival, deletion or contractual retention workflows? | Offboarding SOP, sample records | Customer Success / Engineering |
| SAAS-RET-003 | Are soft-deleted records purged or anonymised after defined retention periods? | DB lifecycle job, deletion logs | Engineering |
| SAAS-RET-004 | Are log retention periods defined separately for application logs, security logs, API logs and audit logs? | Logging policy, SIEM settings | Security / Engineering |
| SAAS-RET-005 | Are backup retention and restore processes documented, including deletion limitations? | Backup policy, DR evidence | Engineering / Security |
| SAAS-RET-006 | Are support-ticket attachments and screenshots automatically reviewed or deleted after retention expiry? | Helpdesk retention config | Support / Engineering |
| SAAS-RET-007 | Are AI prompts, embeddings and outputs subject to retention/deletion rules? | AI retention policy, vector DB config | AI / Engineering |
| SAAS-RET-008 | Are exported reports, CSV downloads and temporary files auto-deleted or controlled? | Export job config, storage lifecycle | Engineering / Security |

### 10.10 Accuracy and data quality — ACCURACY

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-ACC-001 | Can users or customer admins correct inaccurate profile or account data? | Product UI, admin docs | Product |
| SAAS-ACC-002 | Are imported customer records validated before processing or display? | Import validation rules | Engineering / Product |
| SAAS-ACC-003 | Are duplicate accounts, stale users and inactive memberships periodically reviewed? | User audit report | Customer Success / Security |
| SAAS-ACC-004 | Are billing/contact details kept current through customer-admin workflows? | Billing admin screenshots | Finance / Product |
| SAAS-ACC-005 | Are AI or analytics outputs labelled as recommendations where they may be inaccurate? | UI copy, AI output policy | Product / AI |
| SAAS-ACC-006 | Are correction requests propagated to integrated systems where appropriate? | Integration workflow | Engineering |

### 10.11 Security safeguards — SECURITY

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-SEC-001 | Is tenant isolation enforced at application, API and database/query level? | Architecture diagram, tests | Engineering / Security |
| SAAS-SEC-002 | Are object-level authorization controls tested to prevent IDOR/BOLA exposure? | API test results, pentest report | Engineering / Security |
| SAAS-SEC-003 | Are customer admin and internal admin roles separated with least-privilege access? | RBAC matrix, access review | Security / Product |
| SAAS-SEC-004 | Is privileged support access to customer tenant data approved, time-bound and logged? | Support access logs, approval workflow | Support / Security |
| SAAS-SEC-005 | Are API keys, tokens, secrets and webhook signing keys protected and rotated? | Secrets-management evidence | Engineering / Security |
| SAAS-SEC-006 | Are logs reviewed to avoid storing passwords, tokens, sensitive fields or excessive personal data? | Logging standard, sample logs | Engineering / Security |
| SAAS-SEC-007 | Is encryption used in transit and at rest for databases, object storage and backups? | Cloud configs, encryption evidence | Engineering / Security |
| SAAS-SEC-008 | Is MFA/SSO supported or planned for admin/high-privilege roles? | Auth settings, roadmap | Product / Security |
| SAAS-SEC-009 | Are vulnerability scans, dependency scans and penetration tests performed periodically? | VAPT report, CI logs | Security / Engineering |
| SAAS-SEC-010 | Are secure SDLC controls applied before production releases? | SDLC checklist, PR review logs | Engineering |
| SAAS-SEC-011 | Are production, staging, development and demo environments separated? | Environment diagram, access lists | Engineering |
| SAAS-SEC-012 | Is production data prohibited in lower environments unless approved and masked? | Test-data policy | Engineering / Legal |
| SAAS-SEC-013 | Are webhooks signed and verified before accepting data or triggering actions? | Webhook docs, code review | Platform Engineering |
| SAAS-SEC-014 | Are file uploads scanned, type-checked, size-limited and stored securely? | Upload policy, malware scan config | Engineering / Security |
| SAAS-SEC-015 | Are admin actions, exports, bulk downloads and high-risk configuration changes logged? | Audit log samples | Security / Engineering |
| SAAS-SEC-016 | Are security controls mapped to customer commitments such as SOC 2/ISO 27001 where claimed? | Compliance matrix | CISO / Legal |

### 10.12 Personal data breach readiness — BREACH

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-BR-001 | Does the incident response plan explicitly classify personal data breaches, not only system outages? | IR plan, breach annexure | CISO / Legal |
| SAAS-BR-002 | Does the breach playbook identify affected tenants, users, systems, vendors and data categories quickly? | Incident workflow, data map | Security / Engineering |
| SAAS-BR-003 | Are DPDP breach notification responsibilities coordinated with customer contractual notification obligations? | DPA, incident comms template | Legal / CISO |
| SAAS-BR-004 | Are CERT-In cyber incident reporting obligations reviewed where applicable? | CERT-In reporting SOP | CISO / Legal |
| SAAS-BR-005 | Are customer and Data Principal notification templates prepared for personal-data incidents? | Notification templates | Legal / Support |
| SAAS-BR-006 | Are security logs retained and searchable for incident investigation? | SIEM/log retention evidence | Security |
| SAAS-BR-007 | Are breach simulations/tabletop exercises conducted for multi-tenant data exposure? | Drill report | CISO / Engineering |
| SAAS-BR-008 | Are sub-processor breach notification obligations included in vendor contracts? | DPA/vendor contract clauses | Legal / Procurement |
| SAAS-BR-009 | Is there a decision tree for data breach vs security incident vs availability incident? | Incident classification matrix | CISO / Legal |
| SAAS-BR-010 | Are post-incident lessons linked to product backlog and security remediation? | Postmortem, Jira tickets | Engineering / Security |

### 10.13 Vendor / Data Processor governance — VENDOR

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-VEN-001 | Is there a complete register of sub-processors and vendors that process personal data? | Sub-processor register | Legal / Procurement |
| SAAS-VEN-002 | Are cloud infrastructure, database, logging, support, AI, analytics and payment vendors included in the register? | Vendor inventory | Engineering / Legal |
| SAAS-VEN-003 | Are vendor roles classified as processor, sub-processor, independent fiduciary/controller-like or unclear? | Vendor role matrix | Legal |
| SAAS-VEN-004 | Are DPDP/data-processing clauses included in customer and vendor agreements? | DPA, contract templates | Legal |
| SAAS-VEN-005 | Are sub-processor changes communicated to customers where contractually committed? | Notice process, sub-processor page | Legal / Customer Success |
| SAAS-VEN-006 | Are AI providers assessed for input/output retention, training use, data location and security? | AI vendor review | AI / Legal / Security |
| SAAS-VEN-007 | Are customer-support vendors restricted from unnecessary access to tenant data? | Support platform config | Support / Security |
| SAAS-VEN-008 | Are analytics/marketing tools reviewed for personal data collection, cookies and profiling? | Vendor privacy review | Marketing / Legal |
| SAAS-VEN-009 | Are subprocessors linked to ROPA records and product modules? | ROPA-vendor linkage | DPDP Owner |
| SAAS-VEN-010 | Are vendor security reviews performed before onboarding and periodically after onboarding? | Vendor risk assessment | Procurement / Security |
| SAAS-VEN-011 | Are vendors required to notify incidents/breaches within defined timelines? | Contract clauses | Legal / CISO |
| SAAS-VEN-012 | Are contractors/freelancers with production or customer-data access governed as vendors or workforce users? | NDA, access records | HR / Engineering |
| SAAS-VEN-013 | Is there an offboarding process for vendors with removal of access and return/deletion of data? | Vendor offboarding checklist | Procurement / Security |

### 10.14 Children’s data and guardian consent — CHILD

This pack is conditional. It should be triggered where the SaaS product is used by minors, students, children, family users, creator communities, gaming users, learning users or age-uncertain consumer users.

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-CHILD-001 | Does the product identify whether users/Data Principals may be below 18? | Age-gating process, user model | Product / Legal |
| SAAS-CHILD-002 | Is guardian/parental consent reviewed where children’s data is processed and required? | Consent workflow, legal review | Legal / Product |
| SAAS-CHILD-003 | Are children’s profiles, usage, behavioural data and AI interactions minimised? | Data minimisation review | Product / AI |
| SAAS-CHILD-004 | Are marketing, profiling, recommendations or advertising involving children reviewed? | Marketing/AI review | Legal / Marketing |
| SAAS-CHILD-005 | Are vendors processing children’s data separately identified and reviewed? | Vendor register, DPA | Procurement / Legal |
| SAAS-CHILD-006 | Can parent/guardian or authorised routes manage rights/requests where applicable? | Rights workflow | Support / Legal |
| SAAS-CHILD-007 | Is child-user data excluded from non-essential AI training/analytics unless lawfully reviewed? | AI data-use policy | AI / Legal |

### 10.15 Cross-border transfer and cloud/SaaS risk — CROSSBORDER

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-CB-001 | Is the data location known for production database, storage, backups, logs, CDN and analytics systems? | Cloud architecture, region config | Engineering / Security |
| SAAS-CB-002 | Is the data location known for AI providers, embeddings, support tools and observability tools? | Vendor docs, AI config | Engineering / AI |
| SAAS-CB-003 | Are cross-border transfers reviewed before adding cloud regions, CDN, global support or new vendors? | Change review checklist | Legal / Engineering |
| SAAS-CB-004 | Are customer contracts clear about hosting regions, sub-processors and data transfer responsibility? | DPA, order form | Legal / Sales |
| SAAS-CB-005 | Can enterprise customers choose region or residency options where commercially offered? | Product docs, deployment config | Product / Engineering |
| SAAS-CB-006 | Is support access from outside India reviewed and logged where applicable? | Support access logs, policy | Support / Security |
| SAAS-CB-007 | Are backup, DR and failover regions included in data-location review? | DR architecture | Engineering |
| SAAS-CB-008 | Are government/public-sector customers checked for separate cloud/data-hosting requirements? | Customer-specific assessment | Sales / Legal / Cloud |
| SAAS-CB-009 | Are cross-border assumptions updated when vendors change their infrastructure or subprocessors? | Vendor change review | Procurement / Legal |

### 10.16 SDF, DPIA, audit and AI/algorithmic risk readiness — SDF_AI

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-AI-001 | Has the company inventoried all AI/ML features using personal data, including prompts, embeddings and analytics models? | AI inventory | AI/Product/Data |
| SAAS-AI-002 | Are AI inputs and outputs reviewed for personal data leakage, confidential data and customer data exposure? | AI risk assessment | AI / Security |
| SAAS-AI-003 | Are customer data, prompts or uploaded files excluded from model training unless contractually and legally authorised? | AI provider settings, policy | AI / Legal |
| SAAS-AI-004 | Is there a prompt-injection and RAG security control for AI assistant/document features? | AI security test evidence | AI / Security |
| SAAS-AI-005 | Are automated recommendations, scoring or decisions labelled and subject to human review where appropriate? | Product UI, review workflow | Product / Legal |
| SAAS-AI-006 | Are AI vendors assessed for data retention, logging, subprocessors, data location and deletion options? | AI vendor assessment | Procurement / AI / Legal |
| SAAS-AI-007 | Are embeddings/vector stores tenant-isolated and covered by deletion/retention workflows? | Vector DB architecture | AI / Engineering |
| SAAS-AI-008 | Are model evaluation datasets free of unauthorised real personal data? | Evaluation data policy | AI / Data |
| SAAS-AI-009 | Is a DPIA-style review conducted for high-risk AI features, profiling or large-scale analytics? | AI/DPIA review form | Legal / AI / Product |
| SAAS-AI-010 | Is there an audit trail of AI feature changes, prompt template versions and model provider changes? | AI changelog, prompt versioning | AI / Engineering |
| SAAS-AI-011 | If the organisation may qualify as Significant Data Fiduciary in future, is it preparing for audits/DPIA governance? | SDF readiness note | Legal / Leadership |
| SAAS-AI-012 | Are customer-facing AI explanations clear about limitations and human-review responsibilities? | UI copy, terms | Product / Legal |

---

## 11. SaaS-specific ROPA / Processing Activity Register templates

The platform should suggest these ROPA records when the SaaS/Technology industry template is selected.

| ROPA activity | Default risk | Domains linked |
|---|---|---|
| Website visitor and demo request management | Medium | Notice, consent, marketing, retention |
| Trial signup and account creation | Medium | Notice, consent, security, retention |
| User authentication and access management | High | Security, ROPA, breach |
| Customer workspace data processing | High | ROPA, vendor, security, rights |
| Customer admin user management | Medium | Governance, security, rights |
| Product telemetry and feature usage analytics | Medium/High | Purpose, notice, consent, retention |
| Application logs and error monitoring | High | Security, retention, breach |
| API request processing | High | Security, ROPA, breach |
| Webhook event delivery | High | Security, vendor, breach |
| Customer support ticket handling | Medium/High | ROPA, rights, security, retention |
| Support screen-share / troubleshooting access | High | Security, governance, evidence |
| Billing and subscription management | Medium | Notice, retention, vendor |
| CRM and sales lead management | Medium | Notice, consent, retention |
| Email/SMS/WhatsApp notification workflows | Medium | Consent, vendor, retention |
| Marketing campaign and newsletter management | Medium | Consent, notice, vendor |
| Cookie/SDK/product analytics tracking | Medium/High | Notice, consent, vendor |
| Customer data import/export | High | Security, rights, retention |
| Data warehouse / BI replication | High | Inventory, purpose, security |
| AI assistant prompt processing | High | AI, security, vendor, cross-border |
| Document AI / OCR processing | High | AI, vendor, security |
| Embeddings and vector search | High | AI, retention, deletion, tenant isolation |
| Model evaluation and feedback | Medium/High | AI, purpose, minimisation |
| Customer offboarding and data deletion | High | Retention, rights, evidence |
| Backup and disaster recovery processing | Medium/High | Security, retention |
| Security monitoring and SIEM processing | Medium | Security, breach |
| Internal employee HRMS and payroll | Medium | Inventory, retention, security |
| Candidate recruitment processing | Medium | Notice, retention, vendor |
| Contractor/developer access management | Medium/High | Security, governance |
| Community/forum user interaction | Conditional High | Notice, grievance, IT Rules context |
| Mobile app crash analytics | Medium | Inventory, consent, retention |

---

## 12. Evidence checklist for SaaS / Technology assessments

### 12.1 Governance evidence

| Evidence item | Supports |
|---|---|
| DPDP/privacy ownership charter | Governance score |
| Data Fiduciary/Data Processor role matrix | SaaS role clarity |
| Privacy-by-design checklist | Product governance |
| Release sign-off checklist | SDLC control |
| Privacy/security steering committee minutes | Leadership oversight |
| Team training records | Awareness and accountability |

### 12.2 Product and data evidence

| Evidence item | Supports |
|---|---|
| Product data-flow diagram | Inventory and ROPA |
| Database schema/data dictionary | Data discovery |
| API documentation and payload samples | API data flows |
| Event/telemetry catalogue | Product analytics review |
| Admin and support access matrix | Security and governance |
| Product screenshots for notices/consents | Notice and consent evidence |
| Customer data export/delete workflow | Rights and retention |

### 12.3 Security evidence

| Evidence item | Supports |
|---|---|
| RBAC matrix | Access control |
| Tenant isolation test evidence | Multi-tenant security |
| VAPT / penetration test report | Security safeguards |
| OWASP API test results | API security |
| Secure SDLC policy | Security governance |
| Secrets-management policy | Technical safeguards |
| Logging and monitoring policy | Detection and breach response |
| Encryption configuration | Safeguards |
| Backup and DR evidence | Resilience |
| Incident response playbook | Breach readiness |

### 12.4 Vendor and AI evidence

| Evidence item | Supports |
|---|---|
| Sub-processor register | Vendor governance |
| Cloud architecture and region evidence | Cross-border/cloud review |
| Vendor contracts / DPAs | Processor governance |
| AI provider assessment | AI/vendor/cross-border risk |
| AI data-use policy | AI governance |
| Prompt/embedding retention policy | AI retention and deletion |
| Prompt-injection test results | AI safety |
| Model provider configuration screenshots | AI evidence |

### 12.5 Marketing and customer evidence

| Evidence item | Supports |
|---|---|
| Privacy notice and versions | Notice |
| Cookie/tracker scan | Notice/consent |
| Preference centre screenshots | Consent withdrawal |
| CRM field list | Inventory |
| Campaign consent logs | Consent proof |
| Unsubscribe suppression list evidence | Withdrawal |
| Customer contract templates | Role and vendor governance |

---

## 13. Dynamic question triggers for SaaS / Technology

The DPDP Compass engine should apply these triggers.

| Trigger | Condition | Add question pack |
|---|---|---|
| SaaS industry selected | `industryCode = saas` | `SAAS_TECH_OVERLAY_V1` |
| B2B product | `productModel contains B2B` | processor/customer-contract questions |
| B2C product | `productModel contains B2C` | direct notice/consent/rights questions |
| Multi-tenant architecture | `multiTenant = true` | tenant isolation, IDOR/BOLA, RBAC questions |
| API platform | `apiExternal = true` | API security, API logs, API key lifecycle questions |
| Webhooks/integrations | `integrations = true` | webhook security, third-party sharing, vendor mapping |
| Support access | `supportAccessToTenantData = true` | privileged access, approval and logging questions |
| Product analytics | `analyticsEvents = true` | telemetry, notice, minimisation, retention questions |
| Marketing tools | `marketingAutomation = true` | consent, tracker, CRM and opt-out questions |
| AI feature | `aiFeature = true` | AI risk, prompts, embeddings, vendor, RAG questions |
| LLM/RAG | `ragEnabled = true` | prompt injection, tenant-scoped vector, deletion questions |
| Customer uploads files | `fileUpload = true` | storage, malware, retention, access, AI extraction questions |
| Mobile app | `mobileApp = true` | SDK, permissions, crash analytics and app tracking questions |
| Children/minors possible | `childrenDataProcessed = true OR ageUnknown = true` | children’s data pack |
| Cloud hosted | `cloudHosted = true` | cloud/vendor/cross-border questions |
| Data location unknown | `dataLocationKnown = false OR unknown` | cross-border review questions |
| Community/content | `userGeneratedContent = true` | intermediary/grievance/content workflow review |
| Enterprise customers | `enterprisePlan = true` | DPA, sub-processor, SSO, audit log, data residency questions |
| Public-sector customers | `governmentCustomers = true` | India hosting/cloud procurement and security audit review |

---

## 14. Red flags and scoring considerations

| Red flag | Severity | Suggested score impact |
|---|---|---|
| No Data Fiduciary/Data Processor role matrix | High | Governance cap |
| No tenant isolation testing evidence | Critical | Security cap |
| API object-level authorization not tested | Critical | Security red flag |
| Internal support can access customer tenant data without approval/logging | Critical | Security/governance red flag |
| Customer data sent to AI provider without review | Critical | AI/vendor/cross-border red flag |
| No sub-processor register | High | Vendor cap |
| No product privacy notice at signup | High | Notice cap |
| Marketing consent bundled with product terms | High | Consent gap |
| No deletion/offboarding workflow for customer data | High | Retention/rights gap |
| Logs store raw personal data/tokens unnecessarily | Critical | Security/minimisation gap |
| No breach playbook for multi-tenant exposure | Critical | Breach cap |
| Cross-border data location unknown across cloud/AI/support tools | High | Cross-border gap |
| Production personal data used in dev/test environments | Critical | Security/minimisation gap |
| No ROPA for customer workspace data | High | ROPA cap |
| No AI prompt/embedding retention policy | High | AI/retention gap |
| Children’s data possible but no age/guardian review | Critical | Children’s data red flag |

### Scoring notes

| Condition | Scoring guidance |
|---|---|
| SaaS claims strong maturity but has no evidence | Apply evidence cap |
| SOC 2/ISO certificate exists | Useful evidence, but still map DPDP-specific notice, consent, rights, retention and vendor controls |
| Security controls exist but no DPDP breach process | Security may score higher, breach readiness remains weak |
| DPA exists but no vendor register | Contracting score partial; vendor governance weak |
| Product has AI feature but no AI data flow | AI/SDF readiness weak |
| Customer can delete account but logs/backups persist without policy | Retention score partial only |
| API platform has no BOLA/IDOR tests | Security red flag |

---

## 15. SaaS process dashboard additions

The SaaS dashboard should include process views in addition to the 16-domain maturity score.

| Process view | Metrics to show |
|---|---|
| Product account and authentication | RBAC, MFA/SSO, login logs, rights support |
| Customer workspace data | ROPA, tenant isolation, customer admin controls |
| API and integrations | API security, webhook verification, payload/log minimisation |
| Product analytics and telemetry | event inventory, notice, retention, minimisation |
| Support operations | privileged access, tickets, screenshots, access logs |
| Sub-processors and cloud | vendor register, DPA, data location, review status |
| AI features | AI inventory, prompts, embeddings, vendor review, prompt-injection tests |
| Customer offboarding | export, deletion, retention, backup policy |
| Marketing and CRM | consent, preference centre, cookie/tracker review |
| Breach readiness | multi-tenant exposure playbook, CERT-In/DPDP coordination, drills |

---

## 16. SaaS report additions

The SaaS DPDP Compass report should include these additional sections:

1. SaaS role-classification summary: fiduciary/processor/both.
2. Product data-flow overview.
3. Customer tenant isolation and privileged access summary.
4. API and integration privacy/security risk summary.
5. Product telemetry and analytics data-use review.
6. Support access and customer-data handling review.
7. Sub-processor and cloud data-location summary.
8. AI features, prompts, embeddings and model-provider review.
9. Customer offboarding and deletion readiness.
10. SaaS breach-readiness scenario assessment.
11. Enterprise/customer-contract evidence summary.
12. 30/60/90-day SaaS DPDP remediation roadmap.

---

## 17. UAT scenario for SaaS / Technology template

### 17.1 Demo organisation

**Organisation:** CloudApp Technologies Pvt. Ltd.  
**Product:** B2B workflow automation SaaS with AI assistant and API integrations  
**Customers:** Indian SMEs and mid-market enterprises  
**Deployment:** Cloud-hosted, multi-tenant  
**Risk triggers:** AI, cloud, sub-processors, APIs, support access, marketing, data location unknown

### 17.2 UAT flow

```text
1. Register CloudApp Technologies as SaaS / Technology organisation.
2. Select product model: B2B SaaS + AI-enabled workflow platform.
3. Add product modules: user management, workflow builder, AI assistant, reports, integrations.
4. Add Data Principal groups: customer admins, end users, prospects, support users, employees.
5. Add systems: product DB, auth, API gateway, logging, support desk, CRM, AI provider, object storage.
6. Add vendors: cloud provider, email provider, support tool, analytics tool, AI provider, payment provider.
7. Mark multi-tenant = true.
8. Mark AI feature = true.
9. Mark APIs/webhooks = true.
10. Mark support access to customer data = true.
11. Mark data location = partially known/unknown.
12. Generate assessment.
13. Confirm SaaS overlay, AI pack, API pack, vendor pack and cross-border pack are triggered.
14. Create ROPA records for account creation, customer workspace data, support, AI assistant and telemetry.
15. Upload sample evidence: DPA template, architecture diagram, RBAC matrix, privacy notice, incident playbook.
16. Calculate score and confirm evidence caps apply.
17. Generate gaps for no AI review, weak data-location evidence, incomplete ROPA and no tenant isolation test.
18. Generate executive dashboard and SaaS process dashboard.
19. Generate report and export gap/action tracker.
20. Run reassessment after adding tenant-isolation test evidence and sub-processor register.
```

### 17.3 UAT acceptance criteria

| Area | Expected result |
|---|---|
| Industry selection | SaaS overlay loads |
| Dynamic triggers | AI/API/cloud/vendor packs appear |
| Role classification | Fiduciary/processor questions appear |
| ROPA | SaaS-specific processing records suggested |
| Evidence | security, DPA, AI, API and support evidence accepted for review |
| Scoring | no evidence = caps score |
| Red flags | tenant isolation/API/AI/vendor red flags generated |
| Dashboard | SaaS process views visible |
| Report | SaaS role, sub-processor, AI and API sections included |

---

## 18. Notes for AI coding agent

When implementing this SaaS template in TrustStack DPDP Compass:

1. Add industry code: `saas_technology`.
2. Add template code: `SAAS_TECH_OVERLAY_V1`.
3. Add conditional packs:
   - `SAAS_API_SECURITY_V1`,
   - `SAAS_AI_RISK_V1`,
   - `SAAS_MULTI_TENANT_SECURITY_V1`,
   - `SAAS_SUPPORT_ACCESS_V1`,
   - `SAAS_SUBPROCESSOR_V1`,
   - `SAAS_TELEMETRY_ANALYTICS_V1`,
   - `SAAS_CUSTOMER_OFFBOARDING_V1`.
4. Ensure all questions map back to the 16 DPDP Compass domains.
5. Do not create a separate SaaS score outside the DPDP Compass score.
6. Add SaaS process dashboard as a drill-down view.
7. Add role-classification field at processing-activity/ROPA level.
8. Add data-location fields for cloud, logs, backups, AI providers and support tools.
9. Add tenant-isolation and API-security tests to the security/UAT suite.
10. Add AI prompt/embedding retention and prompt-injection evidence fields where AI is enabled.
11. Add sub-processor register and customer notification workflow as vendor-governance fields.
12. Treat public-sector/government SaaS customers as a conditional risk trigger.

---

## 19. Suggested database seed metadata

```json
{
  "industryCode": "saas_technology",
  "industryName": "SaaS / Technology Platforms",
  "templateCode": "SAAS_TECH_OVERLAY_V1",
  "templateVersion": "1.0",
  "coreTemplateRequired": true,
  "defaultQuestionPacks": [
    "CORE_DPDP_V1",
    "SAAS_TECH_OVERLAY_V1"
  ],
  "conditionalQuestionPacks": [
    "VENDOR_PROCESSOR_V1",
    "CLOUD_CROSSBORDER_V1",
    "AI_RISK_V1",
    "MARKETING_TRACKING_V1",
    "CHILDREN_DATA_V1",
    "SAAS_API_SECURITY_V1",
    "SAAS_MULTI_TENANT_SECURITY_V1",
    "SAAS_SUPPORT_ACCESS_V1"
  ],
  "defaultRiskTags": [
    "cloud_saas_processing",
    "vendor_dependency",
    "api_security",
    "tenant_isolation",
    "support_access",
    "cross_border_review",
    "ai_processing_if_enabled"
  ]
}
```

---

## 20. Final SaaS assessment design summary

| Area | Design decision |
|---|---|
| Industry file | SaaS / Technology Platforms |
| Main assessment pattern | Core DPDP + SaaS overlay + conditional API/AI/vendor/cloud packs |
| Highest-risk areas | tenant isolation, API authorization, support access, AI data use, sub-processors, breach readiness |
| Key ROPA areas | account signup, customer workspace data, API, support, telemetry, AI, billing, marketing, offboarding |
| Key evidence | DPA, sub-processor register, RBAC, tenant isolation tests, API security tests, privacy notice, AI policy, incident playbook |
| Dashboard additions | SaaS process dashboard, API/tenant risk, AI risk, sub-processor and cloud view |
| AI Assistant caution | no compliance certification, no AI data-use approval, no evidence approval |
| UAT scenario | B2B multi-tenant AI workflow SaaS |

---

## 21. Practical consultant note

For SaaS organisations, the most important discovery questions are:

1. Are you acting as Data Fiduciary, Data Processor, or both for each data flow?
2. What personal data enters the product, APIs, logs, support, analytics and AI features?
3. Who can access customer tenant data internally?
4. Which sub-processors touch customer or user data?
5. Where is the data stored, backed up, logged and analysed?
6. Can you delete/export customer data when required?
7. Can you detect and respond to multi-tenant personal data exposure?
8. Are AI prompts, embeddings and outputs governed?
9. Can you prove all of this with evidence?

These questions should drive the SaaS DPDP Compass assessment conversation.
