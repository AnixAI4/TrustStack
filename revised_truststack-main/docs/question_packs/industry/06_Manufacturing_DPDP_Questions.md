# 06 — Manufacturing / Industrial DPDP Questions
## TrustStack™ DPDP Compass — Industry Question Bank

**Industry:** Manufacturing / Industrial / Factory Operations / Engineering / Industrial Automation / Multi-plant Enterprises  
**Use in product:** Industry overlay on top of the Core 16-Domain DPDP Compass Assessment  
**Version:** v1.0  
**Prepared for:** TrustStack™ DPDP Compass assessment engine, consultant-led assessments, ROPA module, evidence review, dashboards/reports, and AI Assistant guidance

---

## 1. How to use this industry file

This file is an **industry overlay**. It should not replace the core DPDP Compass assessment.

The correct assessment design is:

```text
Core DPDP Compass 16-domain assessment
+ Manufacturing / Industrial industry overlay
+ Conditional packs: employee/contractor, biometric/CCTV, vendors, cloud, AI/analytics, OT/IIoT, breach, cross-border
+ Organisation-specific dynamic questions for plants, departments, systems, vendors, worker categories and ROPA records
```

The Manufacturing / Industrial overlay should be used for:

- manufacturing plants and factories,
- multi-plant industrial enterprises,
- engineering companies,
- automotive, auto components, chemicals, pharma manufacturing, textiles, FMCG, electronics, metals, energy-equipment and industrial goods,
- industrial automation and Industry 4.0 programmes,
- companies using shop-floor access control, CCTV, biometric attendance, visitor management, safety systems, payroll and contractor systems,
- companies with suppliers, dealers, distributors, logistics partners and service networks,
- organisations using MES, ERP, HRMS, WMS, TMS, EHS, CMMS, SCADA/OT/IIoT and workforce analytics systems.

Important positioning:

> Manufacturing organisations often assume DPDP is mainly relevant to consumer-facing digital businesses. In practice, manufacturing can process large volumes of personal data through employees, contract labour, apprentices, visitors, drivers, vendors, biometric attendance, CCTV, plant access, payroll, EHS, occupational health, logistics, dealer networks, warranty/service systems, AI/IoT analytics and cloud-based enterprise platforms.

---

## 2. Research and regulatory baseline used

This question bank is designed around the DPDP Compass framework and the practical manufacturing operating environment in India.

### 2.1 DPDP baseline

The Manufacturing template must map to the same 16 domains used across all DPDP Compass assessments:

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

### 2.2 Manufacturing / industrial sector references to consider

These references should be used as **sector context**, not as a replacement for DPDP legal analysis:

| Reference area | Why it matters for DPDP Compass manufacturing assessment |
|---|---|
| Digital Personal Data Protection Act, 2023 | Main legal baseline for processing digital personal data in India |
| Digital Personal Data Protection Rules, 2025 | Operational baseline for notice, safeguards, breach intimation, rights, children and other implementation areas |
| Factories Act, 1948 / state factory rules | Useful context because factories maintain worker, shift, health, safety, accident and inspection-related records |
| Labour Codes such as Code on Wages and Code on Social Security | Useful context for payroll, wage, social-security, employee and worker record retention; final applicability should be legally reviewed |
| CERT-In Directions dated 28 April 2022 | Useful cyber incident reporting, log retention, time synchronisation and point-of-contact context where applicable |
| NIST SP 800-82 Rev. 3 — Guide to Operational Technology Security | Useful context for industrial/OT security, especially where OT networks connect with IT systems that may process personal data |
| ISO 27001 / ISO 45001 / ISO 22301 / industrial security practices | Useful evidence references for information security, safety and continuity, but not substitutes for DPDP assessment |
| Vendor and contractor agreements | Important for payroll, staffing, security, transport, canteen, EHS, medical, cloud and IT/OT service providers |

### 2.3 Manufacturing-specific DPDP distinction

Manufacturing companies must distinguish between:

| Processing context | DPDP Compass implication |
|---|---|
| Employee and worker data | High-volume HR/payroll/attendance/access records; rights, retention, security and grievance workflows required |
| Contract labour data | Contractor agencies may act as vendors/processors; responsibility matrix and data sharing must be clear |
| Biometric attendance/access | High-risk because it may involve sensitive identity patterns, access logs and employee monitoring |
| CCTV/video surveillance | Purpose, notice, access, retention and security need special review |
| Occupational health and safety records | Medical/safety records require stronger access controls and purpose limitation |
| Visitors, drivers and logistics partners | Gate entry, identity proofs, vehicle details and access logs need notice, retention and security |
| Dealer/distributor/customer data | May introduce B2B2C or warranty/service processing beyond internal workforce data |
| IT/OT systems and Industry 4.0 | Connected plant systems, IIoT, analytics and AI may create new personal-data flows |
| Multi-plant structure | Each plant may have local processes, vendors and record practices, increasing inconsistency risk |

The product should not assume that manufacturing is low DPDP risk. Risk should be assessed based on actual data-processing activities.


---

## 3. Typical manufacturing organisation types

| Organisation type | Examples | Assessment emphasis |
|---|---|---|
| Single factory / plant | One-site manufacturing unit | workforce records, gate security, payroll, visitor logs, local vendors |
| Multi-plant manufacturer | plants in multiple states/cities | cross-location data sharing, central HRMS/ERP, plant-level ROPA, vendor standardisation |
| Automotive / auto components | OEMs, tier suppliers | employee/contractor records, supplier audits, dealer/service data, logistics drivers |
| Chemical / pharma manufacturing | process manufacturing | EHS, occupational health, incident records, vendor/security controls, regulatory record retention |
| Electronics / high-tech manufacturing | device/electronics assembly | access control, CCTV, clean-room entry, contractor access, IP/security monitoring |
| FMCG / consumer goods | factories, depots, distribution | employee, distributor, retailer, sales, logistics and consumer grievance/warranty data |
| Heavy engineering / industrial goods | projects, field service, warranty | customer contacts, service engineers, site visitors, contractor data |
| Textile / labour-intensive manufacturing | large workforce and contractors | high-volume worker records, attendance, payroll, grievance, shift/hostel/transport data |
| Export-oriented manufacturer | international buyers and auditors | cross-border sharing of contact/worker audit data, vendor audit evidence |
| Industry 4.0 / smart factory | IIoT, cameras, sensors, analytics | AI/analytics, workforce monitoring, OT/IT integration, security evidence |
| Manufacturing group with shared services | central HR/IT/procurement | shared HRMS, central systems, multi-entity data access, processor governance |

---

## 4. Typical Data Principal groups

| Data Principal group | Examples |
|---|---|
| Permanent employees | factory workers, supervisors, managers, engineers |
| Contract workers | agency workers, security staff, housekeeping, canteen, transport, maintenance |
| Apprentices and trainees | trainees, interns, shop-floor apprentices, skill-development participants |
| Job applicants | factory hiring candidates, campus candidates, lateral candidates |
| Visitors | auditors, buyers, inspectors, guests, vendors, interview candidates |
| Drivers and logistics personnel | truck drivers, transport vendors, delivery/pickup staff |
| Suppliers and vendor contacts | supplier employees, service engineers, maintenance engineers |
| Dealers and distributors | dealer contacts, channel partners, distributors, retailers |
| End customers | warranty/service users, complaint submitters, product registration users |
| Field-service users | customer contacts at sites, installation contacts |
| Emergency contacts / dependents | employee emergency contacts, family/dependent details for benefits |
| Medical / occupational health subjects | employees/workers undergoing medical checks, injury/accident records |
| Union/worker representatives | union contacts, worker committee members |
| Board/senior management | leadership contact, travel, approvals and governance data |
| Children/minors | rare but possible: apprentices below 18, dependent/benefit data, visitors, school/CSR programme participants |

---

## 5. Typical personal data categories

| Data category | Examples |
|---|---|
| Identity data | name, employee ID, contractor ID, government ID references, photograph |
| Contact data | mobile, email, address, emergency contact |
| Employment data | role, grade, department, shift, supervisor, joining/exit records |
| Payroll/wage data | salary, wage, bank account, PF/ESIC references, tax records |
| Attendance data | punch-in/out, shift, leave, overtime, biometric attendance logs |
| Access-control data | plant entry, gate pass, card access, restricted-area access logs |
| Visitor data | name, organisation, phone, ID proof reference, purpose of visit, host |
| CCTV/video data | footage, snapshots, access logs, monitoring records |
| Biometric data | fingerprint/face template, device ID, attendance template, access template |
| Health/safety data | medical fitness, incident/injury, occupational health reports, first-aid records |
| Training/certification data | safety training, skill matrix, certification, competency records |
| Contractor data | agency, contract role, work permit, background verification status |
| Vendor/dealer contact data | business contact, role, phone, email, bank/GST contact data where relevant |
| Customer/warranty data | name, contact, product serial, complaint, service history |
| Logistics data | driver name, phone, vehicle number, route, delivery timestamps |
| IT/security logs | username, IP address, endpoint, device, login, access logs |
| AI/analytics data | workforce productivity analytics, safety-camera analytics, model inputs/outputs |
| Geo/location data | vehicle route, field-service location, plant-zone movement if tracked |
| Grievance data | HR complaints, ethics hotline, worker grievance records |

---

## 6. Typical systems and applications to map

| System/application | Why it matters |
|---|---|
| HRMS | employee, payroll, leave, performance and lifecycle data |
| Payroll system | salary, wage, bank, tax, PF/ESIC and statutory records |
| Attendance system | biometric/punch-in/punch-out/shift/overtime data |
| Access control system | entry logs, role access, restricted areas, badge/card data |
| Visitor management system | visitor identity, host, visit purpose, photo/ID proof |
| CCTV/VMS | video footage, camera zones, access to surveillance data |
| ERP | employee, customer, vendor, dealer, order and logistics contact data |
| MES | shop-floor operator, production line and work-order data |
| EHS system | safety training, incidents, injuries, audits, medical/safety records |
| CMMS/maintenance system | service engineers, maintenance contractors, work permits |
| Contractor labour management system | contractor IDs, agency, attendance, compliance documents |
| Canteen/transport system | employee meal/route/passenger data, transport vendor data |
| Warehouse management system | warehouse staff, drivers, dispatch and logistics contacts |
| Transport management system | driver, route, vehicle, delivery and shipment data |
| CRM/dealer portal | dealer/distributor/customer contact and support data |
| Warranty/service system | product owners, complaints, service records |
| Learning/training system | safety training, skills matrix, certificates |
| IT service desk | tickets, employee data, screenshots, logs |
| IAM/SSO | user identities, access roles, login logs |
| Email/SMS/WhatsApp tools | employee/customer/vendor communications |
| Cloud/SaaS systems | HRMS, ERP, EHS, CRM, analytics, backup and collaboration |
| OT/SCADA/IIoT systems | may contain user IDs, operator logs, camera/sensor data and remote support access |
| AI/analytics platforms | workforce analytics, safety analytics, predictive maintenance, quality analytics |

---

## 7. Typical vendors and processors

| Vendor / processor category | Examples to check |
|---|---|
| Payroll processor | payroll bureau, statutory compliance provider |
| HRMS vendor | SaaS HR/payroll/leave/performance platform |
| Contractor staffing agencies | labour contractors, manpower suppliers |
| Security agency | gate security, visitor desk, CCTV monitoring |
| Biometric/access control vendor | attendance terminals, badge/card access systems |
| CCTV/VMS vendor | camera installation, video storage, monitoring support |
| Canteen vendor | employee meal/subsidy records |
| Transport vendor | bus/cab routes, employee passenger data, driver records |
| Medical/occupational health provider | medical tests, first aid, health camp records |
| Insurance/TPA provider | employee insurance/dependent/claim records |
| ERP/MES/EHS/CMMS vendor | enterprise systems and support access |
| Cloud provider | hosting, backup, disaster recovery, SaaS data storage |
| IT managed service provider | helpdesk, endpoint, server and network access |
| OT/automation vendor | remote support for SCADA/PLC/MES/IIoT systems |
| Logistics partner | driver, delivery, consignee/contact data |
| Dealer/distributor platform vendor | channel portal/customer service systems |
| Background verification agency | candidate/worker verification reports |
| Training provider | employee/worker training records |
| AI/analytics provider | video analytics, productivity analytics, predictive models |

---

## 8. Key DPDP risks in manufacturing

| Risk area | Why it is important |
|---|---|
| “Only HR data” assumption | Many plants process contractor, visitor, CCTV, biometric, logistics and vendor data outside HR |
| Contract labour visibility | Personal data may be held by both factory and labour contractor, with unclear responsibility |
| Biometric overcollection | Biometric attendance/access may be used without clear purpose, retention or safeguards |
| CCTV and surveillance creep | Cameras may capture employees, visitors and contractors beyond security purpose |
| Plant-wise inconsistency | Each plant may maintain different registers, forms, vendors and retention practices |
| Legacy registers and digitisation | Paper registers may be scanned/uploaded into uncontrolled shared drives |
| Shared drives and WhatsApp | Employee/worker IDs, payslips, rosters and medical data may be shared informally |
| Vendor contracts weak | Security, contractor, payroll and IT vendors may process data without DPDP clauses |
| OT/IT convergence | Remote vendor access, operator logs and plant systems may become privacy and security risks |
| EHS/medical data access | Injury, fitness and medical records require tight access and retention control |
| Logistics data | Driver and transport data may be collected and shared with multiple parties |
| AI and video analytics | Workforce monitoring, safety analytics and productivity scoring need purpose and fairness review |
| Breach readiness | Manufacturing may focus on safety incidents but not DPDP personal-data breach response |
| Rights/grievance gaps | Workers/contractors may not know how to exercise data rights or raise privacy complaints |
| Cross-border reporting | Global HQ, buyers or auditors may receive employee/worker data or audit records |

---

## 9. Industry-specific assessment questions

Use the following questions as the **Manufacturing / Industrial overlay**. These questions should map into the 16 DPDP Compass domains and should be combined with the core assessment.

### 9.1 Governance, accountability and DPDP ownership

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-GOV-001 | Has the organisation appointed a DPDP programme owner responsible for all plants, offices and shared-service units? | Mandatory | Appointment note, governance charter, steering committee minutes | DPDP remains HR/IT-only without cross-functional ownership | CXO / Compliance | P0 |
| MFG-GOV-002 | Is there a plant-wise DPDP responsibility matrix covering HR, security, EHS, IT, procurement, operations, logistics and administration? | Mandatory | RACI matrix, plant DPDP coordinator list | Plant-level gaps remain invisible | DPDP Owner | P0 |
| MFG-GOV-003 | Are contract-worker data responsibilities defined between the company and labour contractors? | High-risk | Contractor agreement, data-sharing responsibility note | Unclear accountability for contractor personal data | HR + Legal + Procurement | P1 |
| MFG-GOV-004 | Does the organisation maintain a DPDP governance cadence for plants and corporate office? | Mandatory | Meeting minutes, action tracker, review calendar | No sustained execution after baseline assessment | DPDP Owner | P1 |
| MFG-GOV-005 | Are privacy responsibilities included in plant security, HR, EHS, IT and procurement SOPs? | Mandatory | Updated SOPs, training deck, process owners | DPDP is not embedded into operating processes | Process Owners | P1 |
| MFG-GOV-006 | Is there a defined approval process for new data collection at plant gates, HR, EHS, canteen, transport, CCTV and biometric systems? | High-risk | Change approval workflow, privacy checklist | New data collection begins without purpose/evidence review | Compliance + IT + Plant Head | P1 |
| MFG-GOV-007 | Are plant heads and department heads accountable for remediation actions assigned by DPDP Compass? | Mandatory | Action tracker, owner sign-off, governance minutes | Assessment gaps do not convert into closure | Plant Head | P1 |
| MFG-GOV-008 | Does the organisation maintain a central view of DPDP maturity across plants and business units? | Dashboard-linked | Executive dashboard, plant-wise scorecard | Leadership cannot prioritise risk by plant | Executive Sponsor | P2 |

### 9.2 Personal data discovery and inventory

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-INV-001 | Has the organisation identified all personal data collected from employees, contractors, apprentices, visitors, drivers, vendors, dealers and customers? | Mandatory | Data inventory, department interviews, system list | Large categories of personal data remain unknown | DPDP Owner + Departments | P0 |
| MFG-INV-002 | Are plant gate, access-control, CCTV and visitor-management data included in the inventory? | High-risk | Security system inventory, gate registers, CCTV map | Security-admin data is missed | Security + Admin | P0 |
| MFG-INV-003 | Are biometric attendance and access-control data fields documented separately from general attendance data? | High-risk | Biometric system field list, device configuration, vendor documentation | Biometric data is treated casually | HR + IT + Security | P0 |
| MFG-INV-004 | Are EHS, medical, incident, accident and occupational-health records included in the inventory? | High-risk | EHS record list, medical-room register, incident system export | Health/safety records remain outside privacy review | EHS + HR | P1 |
| MFG-INV-005 | Are all HRMS, payroll, attendance, contractor-management and training systems mapped? | Mandatory | Application register, system screenshots, owner list | Core workforce systems are not visible | HR + IT | P0 |
| MFG-INV-006 | Are dealer, distributor, warranty, customer complaint and field-service personal data categories inventoried? | Conditional | CRM/dealer portal/warranty system data map | External/customer data is missed | Sales + Service | P1 |
| MFG-INV-007 | Are shared drives, spreadsheets, WhatsApp groups and email-based worker data exchanges identified? | High-risk | Sampling exercise, departmental data discovery notes | Uncontrolled copies of personal data persist | IT + Departments | P1 |
| MFG-INV-008 | Are OT/MES/IIoT/operator logs reviewed for user IDs, names, access logs or camera data? | Conditional | MES/OT log samples, system owner interview | OT-adjacent personal data is missed | IT + OT + Plant Engineering | P1 |

### 9.3 ROPA / Processing Activity Register

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-ROPA-001 | Is a Processing Activity Register maintained for each major plant and corporate/shared-service process? | Mandatory | ROPA register, plant-wise processing list | No lifecycle view of personal data processing | DPDP Owner | P0 |
| MFG-ROPA-002 | Are ROPA records created for employee lifecycle, contractor onboarding, attendance, payroll, gate access, CCTV and visitor management? | Mandatory | ROPA entries for core workforce/security processes | Key processing activities are missing | HR + Security + DPDP Owner | P0 |
| MFG-ROPA-003 | Does each ROPA record link purpose, data categories, systems, vendors, retention and evidence? | Mandatory | ROPA detail fields, evidence links | ROPA exists but is not actionable | Process Owner | P1 |
| MFG-ROPA-004 | Are plant-level variations in forms, registers, vendors and retention practices reflected in ROPA? | High-risk | Plant-wise comparison, local process notes | Head-office ROPA misses plant reality | Plant Coordinators | P1 |
| MFG-ROPA-005 | Are ROPA records maintained for health, safety and incident management data? | High-risk | EHS ROPA entries, medical record mapping | Sensitive worker-safety records are under-governed | EHS + Legal | P1 |
| MFG-ROPA-006 | Are dealer/distributor/warranty/customer-service processing activities included where the company handles end-customer data? | Conditional | CRM/warranty ROPA records | Customer-facing processing remains outside DPDP scope | Sales + Service | P1 |
| MFG-ROPA-007 | Are vendor/processors linked to each relevant ROPA record, including payroll, security, transport, canteen, IT, cloud and OT vendors? | High-risk | ROPA-vendor linkage, vendor register | Processor governance cannot be assessed | Procurement + Legal | P1 |
| MFG-ROPA-008 | Are ROPA records reviewed periodically and whenever a new plant, system, vendor, CCTV camera, biometric device or AI tool is introduced? | Reassessment-linked | Review calendar, change log | ROPA becomes stale | DPDP Owner | P2 |

### 9.4 Purpose and data minimisation

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-PUR-001 | Is the purpose documented for each personal data field collected in employee, contractor, visitor and gate-entry forms? | Mandatory | Field-purpose mapping, forms review | Overcollection and vague-purpose processing | HR + Admin + Legal | P0 |
| MFG-PUR-002 | Are biometric attendance/access systems justified against less intrusive alternatives? | High-risk | Biometric purpose note, risk review, approval note | Biometric processing may be excessive | HR + Legal + IT | P0 |
| MFG-PUR-003 | Is CCTV purpose clearly limited to security, safety, quality or operational purpose, and not expanded informally? | High-risk | CCTV policy, signage, camera-zone map | Surveillance creep and employee monitoring risk | Security + Legal | P1 |
| MFG-PUR-004 | Are medical/fitness/EHS data fields limited to occupational health, safety or statutory requirements? | High-risk | Medical form review, EHS purpose note | Sensitive records used beyond legitimate need | EHS + HR + Legal | P1 |
| MFG-PUR-005 | Are contractor-worker documents collected by the principal employer limited to what is necessary for access, safety, payroll/compliance and statutory needs? | High-risk | Contractor onboarding checklist, document minimisation review | Unnecessary ID/document collection | HR + Procurement | P1 |
| MFG-PUR-006 | Are visitor ID proofs collected only when necessary and retained only for defined security purpose? | Conditional | Visitor SOP, register fields, retention policy | Visitor data overcollection | Security + Admin | P2 |
| MFG-PUR-007 | Are dealer/customer/warranty data fields limited to service, warranty, safety recall or legitimate customer-support purpose? | Conditional | Warranty form, CRM fields, service process note | Excess customer data captured | Sales + Service + Legal | P2 |
| MFG-PUR-008 | Are workforce productivity analytics, safety analytics or AI monitoring tools reviewed for purpose limitation and proportionality? | AI-linked | AI use-case review, privacy impact note | Unfair or excessive worker monitoring | HR + Operations + Legal | P1 |

### 9.5 Notice management

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-NOT-001 | Are privacy notices provided to employees and workers at onboarding or before digital personal data collection? | Mandatory | Employee notice, onboarding pack, HRMS screenshot | Workers are not informed about processing | HR + Legal | P0 |
| MFG-NOT-002 | Are contractors and agency workers given a clear notice where their data is collected by the company or through company systems? | High-risk | Contractor notice, agency onboarding materials | Contract workers remain uninformed | HR + Procurement + Legal | P1 |
| MFG-NOT-003 | Is notice/signage displayed at plant gates, visitor desks, biometric terminals and CCTV-monitored zones? | High-risk | Photos of notices/signage, gate desk process | Gate/CCTV/biometric collection lacks transparency | Admin + Security | P1 |
| MFG-NOT-004 | Are notices available in languages understood by the workforce, contractors and visitors where necessary? | High-risk | English/local-language notices, translation approvals | Notice exists but is not practically understandable | HR + Plant Admin | P1 |
| MFG-NOT-005 | Do digital forms, portals and apps used for HR, payroll, transport, canteen, EHS and training display or link relevant privacy notices? | Mandatory | System screenshots, form review | Notices missing at actual collection points | IT + Process Owner | P1 |
| MFG-NOT-006 | Are notices version-controlled and linked to relevant ROPA records? | Evidence-heavy | Notice repository, version history, ROPA linkage | Cannot prove which notice applied | Legal + DPDP Owner | P2 |
| MFG-NOT-007 | Are dealer, distributor and warranty/customer-service notices provided at collection points where end-customer data is collected? | Conditional | Portal/app/form screenshots, dealer process notice | Customer-facing data collection lacks notice | Sales + Service | P1 |
| MFG-NOT-008 | Are notices updated when new CCTV zones, biometric devices, AI/video analytics, HR systems or vendors are introduced? | Reassessment-linked | Change log, updated notices | Notices lag behind operational changes | Legal + IT + Plant Admin | P2 |

### 9.6 Consent and consent withdrawal

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-CON-001 | Has the organisation identified which processing relies on consent and which may require legal review for other permitted basis? | Mandatory | Purpose/basis matrix, legal review notes | Consent is used blindly or not captured where needed | Legal + DPDP Owner | P0 |
| MFG-CON-002 | Where consent is used for employees, contractors, visitors or customers, is it captured in clear affirmative form and linked to the processing purpose? | Conditional | Consent UI, forms, consent logs | Consent cannot be proven | HR + Legal + IT | P1 |
| MFG-CON-003 | Are consent records maintained for optional processing such as marketing, employee engagement apps, wellness programmes, surveys or events? | Conditional | Consent logs, survey forms, campaign preferences | Optional processing lacks traceability | HR + Marketing + Legal | P2 |
| MFG-CON-004 | Is withdrawal of consent supported where processing is consent-based and withdrawal is operationally feasible? | Conditional | Withdrawal workflow, helpdesk ticket category, SOP | Consent withdrawal cannot be honoured | Legal + IT + HR | P1 |
| MFG-CON-005 | Are biometric-related consent/legal-basis considerations separately reviewed rather than bundled into general employment consent? | High-risk | Biometric review memo, consent/legal basis decision | Biometric use becomes legally and ethically weak | Legal + HR | P0 |
| MFG-CON-006 | Are marketing communications to dealers, distributors, customers or service users governed by consent/preference management where applicable? | Conditional | CRM consent flags, unsubscribe logs | Uncontrolled marketing use | Sales + Marketing + Legal | P2 |
| MFG-CON-007 | Are consent logs retained with notice version, timestamp, channel and purpose where digital consent is captured? | Evidence-heavy | Consent database/export, audit logs | Cannot prove consent history | IT + Legal | P1 |
| MFG-CON-008 | Are consent/notice flows reviewed before implementing AI-based worker monitoring, wellness, productivity scoring or behavioural analytics? | AI-linked | AI review, consent/legal basis note | AI monitoring lacks valid assessment | HR + Legal + AI Owner | P1 |

### 9.7 Data Principal rights

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-RGT-001 | Is there a process for employees, workers, contractors, visitors and customer/service users to raise DPDP rights requests? | Mandatory | Rights SOP, request form, helpdesk category | Rights requests are not recognised | Legal + HR + Service | P0 |
| MFG-RGT-002 | Can the organisation locate personal data across HRMS, payroll, attendance, access control, CCTV, EHS, ERP and shared drives when a request is received? | High-risk | System map, ROPA linkage, search workflow | Cannot respond accurately to rights requests | DPDP Owner + IT | P1 |
| MFG-RGT-003 | Are contractor-worker rights requests routed between contractor agency and company without losing accountability? | High-risk | Contractor request SOP, agency escalation matrix | Contract worker requests fall through gaps | HR + Procurement + Legal | P1 |
| MFG-RGT-004 | Is there a standard identity-verification process before fulfilling rights requests? | Mandatory | Identity verification SOP, request form controls | Unauthorised disclosure or wrong changes | Legal + HR + IT | P1 |
| MFG-RGT-005 | Can correction requests be fulfilled for HR, attendance, payroll, contractor and customer-service records? | Mandatory | Correction workflow, ticket examples | Incorrect records continue to be used | HR + Service + IT | P1 |
| MFG-RGT-006 | Can erasure requests be evaluated against statutory, employment, safety, contractual and retention obligations? | Mandatory | Erasure decision matrix, legal review notes | Improper deletion or refusal | Legal + Records Owner | P1 |
| MFG-RGT-007 | Are CCTV footage access requests handled with safeguards for third-party privacy and operational/security needs? | High-risk | CCTV request SOP, redaction/restriction policy | Unsafe disclosure of footage | Security + Legal | P1 |
| MFG-RGT-008 | Are rights request metrics tracked and reported to the DPDP governance forum? | Dashboard-linked | Rights tracker, dashboard, minutes | Leadership lacks visibility | DPDP Owner | P2 |

### 9.8 Grievance redressal and contact publication

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-GRV-001 | Is a DPDP contact or grievance channel published for employees, contractors, visitors and customers where relevant? | Mandatory | Privacy notice, intranet, gate notice, website contact | No clear route for data-related complaints | Legal + HR + Admin | P0 |
| MFG-GRV-002 | Is the grievance route accessible to shop-floor workers and contract labour, including non-desk users? | High-risk | Poster, helpline, local-language communication | Deskless workforce cannot use grievance mechanism | Plant HR | P1 |
| MFG-GRV-003 | Are privacy grievances distinguished from HR, safety, ethics and disciplinary complaints? | Mandatory | Ticket categories, grievance SOP | Privacy issues get lost in generic complaints | HR + Legal | P1 |
| MFG-GRV-004 | Are grievance response timelines, escalation owners and closure evidence defined? | Mandatory | SOP, tracker, sample closed cases | Delayed/inconsistent grievance handling | DPDP Owner | P1 |
| MFG-GRV-005 | Can contract workers raise data-related complaints without retaliation or dependency on contractor agency only? | High-risk | Worker communication, contractor agreement, escalation process | Worker grievances suppressed or unmanaged | HR + Legal | P1 |
| MFG-GRV-006 | Are website, warranty, dealer and service portals linked to a grievance or privacy-contact route? | Conditional | Website screenshots, portal footer, CRM workflow | External Data Principals lack contact route | Sales + Service + Legal | P2 |
| MFG-GRV-007 | Are grievance trends reviewed by plant/corporate leadership? | Dashboard-linked | Monthly report, governance minutes | Recurring issues are not corrected | DPDP Owner | P2 |

### 9.9 Retention, erasure and archival

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-RET-001 | Are retention periods defined for employee, payroll, attendance, contractor, visitor, CCTV, EHS, training and access-control records? | Mandatory | Retention schedule, record classification | Data retained indefinitely | Legal + Records + IT | P0 |
| MFG-RET-002 | Are retention rules aligned with statutory employment, wage, social-security, factory, tax, safety and litigation requirements where applicable? | Legal-review | Legal retention matrix, statutory record mapping | Deletion or retention conflicts with law | Legal + HR | P1 |
| MFG-RET-003 | Is CCTV footage retention defined by camera purpose, zone risk and investigation need? | High-risk | CCTV policy, VMS retention settings | Surveillance footage retained too long | Security + Legal | P1 |
| MFG-RET-004 | Are biometric templates/logs retained only as long as needed for attendance/access and related legitimate purposes? | High-risk | Device retention settings, deletion SOP | Biometric records retained unnecessarily | HR + IT + Security | P1 |
| MFG-RET-005 | Are visitor and gate-entry registers archived/deleted according to approved retention rules? | Mandatory | Visitor register retention SOP, deletion logs | Visitor records accumulate indefinitely | Admin + Security | P2 |
| MFG-RET-006 | Are ex-employee and ex-contractor records reviewed for retention and deletion/archival? | Mandatory | Exit checklist, archival workflow, purge logs | Former worker data remains active | HR + IT | P1 |
| MFG-RET-007 | Are shared-drive/spreadsheet copies covered by retention and deletion rules? | High-risk | Shared-drive scan, records SOP | Retention rules apply only to main systems | IT + Records Owner | P1 |
| MFG-RET-008 | Can the organisation place legal hold on records where litigation, accident investigation or statutory inquiry is pending? | Conditional | Legal hold SOP, case register | Improper deletion during legal/safety proceedings | Legal + EHS | P2 |

### 9.10 Accuracy and data quality

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-ACC-001 | Are HR, payroll, attendance and statutory records periodically reconciled for accuracy? | Mandatory | Reconciliation reports, payroll audits | Incorrect wages/records and privacy-rights issues | HR + Payroll | P1 |
| MFG-ACC-002 | Are contractor-worker identities and employment status kept updated when workers join, move, or exit? | High-risk | Contractor master updates, exit/deactivation logs | Exited workers retain access or records remain wrong | Contractor Cell + Security | P1 |
| MFG-ACC-003 | Are access-control and badge/card systems updated promptly after transfer, role change or exit? | High-risk | Access review logs, disablement records | Unauthorised physical/system access | Security + IT | P1 |
| MFG-ACC-004 | Are emergency contact and dependent records periodically refreshed? | Conditional | Employee self-service update campaign, HR records | Outdated emergency/benefit data | HR | P2 |
| MFG-ACC-005 | Are warranty/customer-service records corrected when customer details change? | Conditional | CRM update workflow, service ticket records | Customer communication or service errors | Service + Sales | P2 |
| MFG-ACC-006 | Are EHS incident records protected from unauthorised alteration while allowing correction of factual errors? | High-risk | EHS access logs, incident revision history | Safety/legal records become unreliable | EHS + Legal | P1 |

### 9.11 Security safeguards

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-SEC-001 | Are access controls defined for HRMS, payroll, attendance, contractor, visitor, CCTV, ERP, EHS and service systems? | Mandatory | RBAC matrix, system role screenshots | Unauthorised access to workforce/customer data | IT + System Owners | P0 |
| MFG-SEC-002 | Are privileged admin accounts for HRMS, biometric, CCTV, access-control and ERP systems reviewed periodically? | High-risk | Admin access review, sign-off, logs | Excessive administrator access | IT + Security | P0 |
| MFG-SEC-003 | Are biometric templates, attendance logs and access logs encrypted or protected according to risk? | High-risk | Vendor security docs, configuration proof, encryption note | High-risk identity data exposure | IT + Security | P0 |
| MFG-SEC-004 | Are CCTV recordings protected from unauthorised viewing, copying, export or sharing? | High-risk | VMS access control, export logs, SOP | Video misuse or leakage | Security + IT | P1 |
| MFG-SEC-005 | Are plant shared drives and spreadsheets containing worker/customer data access-controlled and periodically cleaned? | High-risk | Access review, DLP scan, folder permissions | Uncontrolled personal data copies | IT + Departments | P1 |
| MFG-SEC-006 | Are contractor/vendor users given least-privilege and time-bound access to systems and plant networks? | High-risk | Vendor account register, access expiry settings | Dormant vendor accounts and remote access risk | IT + Procurement | P1 |
| MFG-SEC-007 | Are OT/MES/SCADA/IIoT user accounts and remote support access governed where they contain user/operator logs or enable access to IT data? | Conditional | OT access list, remote access logs, network diagram | IT/OT convergence security gap | OT + IT Security | P1 |
| MFG-SEC-008 | Are logs enabled and protected for major systems processing personal data? | Mandatory | System logs, SIEM evidence, log retention config | Weak investigation and breach evidence | IT Security | P1 |
| MFG-SEC-009 | Are backups available and tested for HRMS, payroll, ERP, EHS and access-control data? | Mandatory | Backup schedule, restore test report | Data loss and operational disruption | IT | P1 |
| MFG-SEC-010 | Are laptops/endpoints used by HR, payroll, security desk and plant admins secured with endpoint controls? | High-risk | EDR/AV inventory, encryption policy, device controls | Endpoint leakage of worker records | IT Security | P1 |

### 9.12 Personal data breach readiness

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-BR-001 | Does the organisation have a DPDP-specific personal data breach response playbook, not only a general cyber/safety incident SOP? | Mandatory | Breach playbook, incident-response SOP | Personal-data breach obligations are missed | CISO + Legal | P0 |
| MFG-BR-002 | Does the breach workflow cover workforce, contractor, visitor, CCTV, biometric, payroll, customer and vendor data exposure scenarios? | High-risk | Scenario matrix, tabletop exercise | Breach plan does not cover manufacturing realities | CISO + HR + Security | P0 |
| MFG-BR-003 | Are plant-level teams trained to recognise personal-data breaches, including lost registers, misdirected emails, CCTV leakage and payroll data exposure? | High-risk | Training records, posters, incident examples | Plant staff do not escalate privacy breaches | Plant Head + HR | P1 |
| MFG-BR-004 | Is there a defined escalation matrix across plant, corporate IT, HR, legal, security and vendors? | Mandatory | Escalation matrix, contact list | Delayed containment and reporting | CISO + DPDP Owner | P1 |
| MFG-BR-005 | Are Data Principal notification templates prepared for employees, contractors, visitors and customers where relevant? | Evidence-heavy | Notification templates, approval workflow | Cannot communicate clearly during breach | Legal + HR + Communications | P1 |
| MFG-BR-006 | Is vendor breach notification contractually required for payroll, HRMS, biometric, CCTV, security, cloud and IT vendors? | High-risk | Vendor clauses, DPA, incident notice terms | Vendor incidents are reported late | Legal + Procurement | P1 |
| MFG-BR-007 | Are breach logs, evidence preservation steps and investigation templates maintained? | Mandatory | Incident register, evidence checklist | Weak breach investigation and auditability | IT Security + Legal | P1 |
| MFG-BR-008 | Has a tabletop drill been conducted for payroll/biometric/CCTV data exposure? | Maturity 4/5 | Drill report, lessons learned | Playbook remains untested | CISO + HR + Security | P2 |

### 9.13 Vendor / Data Processor governance

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-VEN-001 | Is there a vendor register identifying all vendors processing personal data for plants and corporate functions? | Mandatory | Vendor processor register | Processor ecosystem remains unknown | Procurement + DPDP Owner | P0 |
| MFG-VEN-002 | Are payroll, HRMS, attendance, biometric, security, CCTV, transport, canteen, EHS, insurance/TPA, IT and cloud vendors classified by data-processing role? | High-risk | Vendor classification matrix | Wrong role assumptions and contract gaps | Procurement + Legal | P0 |
| MFG-VEN-003 | Do contracts with vendors processing personal data include confidentiality, security, breach notification, deletion/return and sub-processor obligations? | Mandatory | Contracts, DPDP addendum, DPA clauses | Vendor handling is uncontrolled | Legal + Procurement | P1 |
| MFG-VEN-004 | Are labour contractor agreements clear on what worker data is shared, why, how long retained and how rights/grievances are handled? | High-risk | Contractor agreement, data-sharing annexure | Contract-worker DPDP gaps | HR + Procurement + Legal | P1 |
| MFG-VEN-005 | Are remote support arrangements for ERP, MES, CCTV, biometric, OT and IT systems reviewed for access control and logging? | High-risk | Remote access logs, vendor support SOP | Vendor support causes data/security exposure | IT + OT + Procurement | P1 |
| MFG-VEN-006 | Are transport/canteen/security vendors restricted from using employee/worker data for their own unrelated purposes? | High-risk | Contract clauses, vendor policy, audit evidence | Downstream misuse of workforce data | Procurement + HR | P2 |
| MFG-VEN-007 | Are high-risk vendors reviewed periodically with evidence of security and privacy controls? | Maturity 4/5 | Vendor review checklist, audit reports | Vendor risk is not monitored | Procurement + IT Security | P2 |
| MFG-VEN-008 | Are vendor exits/offboarding handled with data return, deletion confirmation and access removal? | High-risk | Vendor offboarding checklist, deletion confirmation | Former vendors retain data/access | Procurement + IT | P1 |

### 9.14 Children’s data and guardian consent

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-CHILD-001 | Does the organisation identify whether apprentices, trainees, interns, CSR participants or dependents include individuals below 18? | Conditional | Age-verification process, trainee records | Children’s data risk missed | HR + CSR + Legal | P1 |
| MFG-CHILD-002 | Where under-18 apprentices or trainees are engaged, are guardian/parental consent and statutory employment restrictions reviewed by legal/HR? | High-risk | Legal review, consent process, trainee/apprentice records | Improper child/minor data handling | HR + Legal | P0 |
| MFG-CHILD-003 | Are dependent/family benefit records containing children’s data limited to required benefit/insurance purposes? | Conditional | Benefit forms, minimisation review | Unnecessary family/minor data collection | HR + Benefits | P2 |
| MFG-CHILD-004 | Are children participating in factory visits, school outreach, CSR training or community programmes covered by appropriate notice/consent controls? | Conditional | CSR forms, event notices, consent forms | CSR/event data risk | CSR + Legal | P2 |
| MFG-CHILD-005 | Are vendors processing children’s/dependent data identified and controlled? | Conditional | Insurance/benefit/CSR vendor mapping | Vendor exposure of minor/dependent data | Procurement + HR | P2 |

### 9.15 Cross-border transfer and cloud/SaaS risk

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-CB-001 | Is the data location known for HRMS, payroll, ERP, EHS, CRM, CCTV cloud storage, backups and collaboration platforms? | Mandatory | Cloud region documentation, vendor response | Unknown data location | IT + Procurement | P1 |
| MFG-CB-002 | Are global HQ, overseas plants, international buyers, auditors or group shared-services receiving employee/worker/customer personal data? | Conditional | Data-sharing map, transfer register | Cross-border sharing not governed | Legal + Group IT | P1 |
| MFG-CB-003 | Are cloud/SaaS contracts reviewed for hosting region, sub-processors, security and data return/deletion? | Mandatory | SaaS contract, DPA, sub-processor list | Cloud processing lacks governance | Procurement + IT + Legal | P1 |
| MFG-CB-004 | Are international quality, social-compliance or buyer audits sharing worker records, attendance, wages or health/safety documents externally? | Conditional | Audit data-sharing protocol, redaction evidence | Excessive sharing with auditors/buyers | Compliance + HR | P2 |
| MFG-CB-005 | Are remote vendor-support sessions from outside India logged and approved where personal data may be accessed? | Conditional | Remote support logs, access approvals | Cross-border access without visibility | IT + OT + Legal | P1 |
| MFG-CB-006 | Are backup, disaster recovery and log storage locations documented for personal-data systems? | Mandatory | Backup architecture, storage region evidence | Hidden cross-border/third-party processing | IT | P2 |

### 9.16 SDF, DPIA, audit and AI/algorithmic risk readiness

| Code | Assessment question | Type | Evidence to check | Risk if weak | Suggested owner | Priority |
|---|---|---|---|---|---|---|
| MFG-AI-001 | Are AI, analytics, computer vision, productivity monitoring, workforce planning and safety-monitoring tools using personal data inventoried? | AI-linked | AI inventory, use-case register | AI personal-data use remains hidden | AI/Data Owner + DPDP Owner | P1 |
| MFG-AI-002 | Is a DPIA-style privacy review conducted for biometric systems, CCTV/video analytics, worker productivity scoring and automated safety analytics? | High-risk | Privacy impact checklist, approval note | High-risk monitoring without review | Legal + HR + Operations | P1 |
| MFG-AI-003 | Are AI/analytics outputs used for disciplinary, performance, safety or access decisions subject to human review? | High-risk | Human-review SOP, decision logs | Automated or unfair decision-making risk | HR + Operations + Legal | P1 |
| MFG-AI-004 | Are AI vendors and model providers prevented from using employee/worker/customer data for unrelated model training without approval? | AI/vendor-linked | AI contract terms, provider settings | Client/workforce data reused improperly | Legal + Procurement + AI Owner | P1 |
| MFG-AI-005 | Are prompts, uploaded documents and AI outputs checked for personal data leakage when employees use general AI tools? | AI-linked | AI usage policy, DLP guidance, training | Personal data leaked into external AI tools | IT + HR + Legal | P2 |
| MFG-AI-006 | Is there audit evidence for periodic review of high-risk personal-data processing activities? | Maturity 4/5 | Audit plan, review report, action tracker | High-risk processing not reassessed | Internal Audit + DPDP Owner | P2 |
| MFG-AI-007 | If the organisation may be classified as a Significant Data Fiduciary in future, is it prepared for DPIA, audits and higher accountability expectations? | Conditional | SDF readiness checklist, leadership note | Future accountability obligations unprepared | Executive Sponsor + Legal | P2 |


---

## 10. Suggested ROPA / Processing Activity Register templates

The platform should suggest these ROPA records when the Manufacturing template is selected. Users should confirm, edit or delete them based on actual scope.

| ROPA activity code | Suggested processing activity | Typical owner | Default risk | Notes |
|---|---|---|---|---|
| MFG-ROPA-HR-001 | Employee onboarding and master-data creation | HR | High | Identity, contact, employment, bank/statutory data |
| MFG-ROPA-HR-002 | Payroll, wage and statutory benefits processing | HR/Payroll | High | Salary, wage, bank, tax, PF/ESIC-style data |
| MFG-ROPA-HR-003 | Employee lifecycle, transfers and exits | HR | Medium | Role, grade, location, exit records |
| MFG-ROPA-CON-001 | Contract worker onboarding and verification | Contractor Cell/HR | High | Agency worker data and documents |
| MFG-ROPA-CON-002 | Contractor attendance and wage coordination | HR/Contractor Cell | High | Attendance and payroll coordination with agency |
| MFG-ROPA-ACC-001 | Biometric attendance processing | HR/IT/Security | High | Biometric templates/logs require high control |
| MFG-ROPA-ACC-002 | Physical access control and badge management | Security | High | Plant-zone entry/access logs |
| MFG-ROPA-VIS-001 | Visitor registration and gate-entry management | Security/Admin | Medium | Visitor identity, phone, ID proof, host |
| MFG-ROPA-CCTV-001 | CCTV/video surveillance for security and safety | Security | High | Camera zones, footage access, retention |
| MFG-ROPA-EHS-001 | Occupational health and medical fitness records | EHS/HR | High | Medical/safety records |
| MFG-ROPA-EHS-002 | Incident, accident and safety investigation records | EHS | High | Injuries, witness data, investigation data |
| MFG-ROPA-TRN-001 | Safety training and skill certification records | Training/EHS | Medium | Training attendance, certificates, skills matrix |
| MFG-ROPA-CAN-001 | Canteen management and meal subsidy records | Admin | Medium | Employee meal usage, vendor access |
| MFG-ROPA-TRP-001 | Employee transport and route management | Admin/HR | Medium | Route, passenger, mobile, pickup point |
| MFG-ROPA-ERP-001 | ERP user and vendor/contact management | IT/Finance/Procurement | Medium | Employee/vendor/customer contacts |
| MFG-ROPA-MES-001 | MES operator logs and shop-floor user records | Operations/IT | Medium | Operator IDs, work orders, machine logs |
| MFG-ROPA-CMMS-001 | Maintenance contractor and work-permit processing | Maintenance/EHS | Medium | Contractor/service engineer data |
| MFG-ROPA-WMS-001 | Warehouse and logistics personnel processing | Supply Chain | Medium | Drivers, dispatch contacts, gate entries |
| MFG-ROPA-CRM-001 | Dealer/distributor portal management | Sales | Medium | Channel partner contacts and account data |
| MFG-ROPA-WAR-001 | Warranty registration and customer complaint processing | Service | Medium/High | End-customer data if collected |
| MFG-ROPA-FLD-001 | Field service engineer and customer-site support records | Service | Medium | Customer/site contacts and service logs |
| MFG-ROPA-MKT-001 | Dealer/customer marketing communication | Marketing/Sales | Medium | Consent/preference management required |
| MFG-ROPA-BGV-001 | Background verification of candidates/workers | HR | High | External verification agency involved |
| MFG-ROPA-INS-001 | Employee insurance and TPA claim processing | HR/Benefits | High | Health/dependent/claim data |
| MFG-ROPA-AI-001 | CCTV/video analytics for safety/security | Security/AI Owner | High | AI/vision monitoring risk |
| MFG-ROPA-AI-002 | Workforce productivity or scheduling analytics | HR/Operations | High | Monitoring and automated decision risk |
| MFG-ROPA-OT-001 | Remote OT/MES/vendor support access logging | OT/IT | Medium/High | Personal data may be in logs/support sessions |
| MFG-ROPA-AUD-001 | Buyer, customer or certification audit data sharing | Compliance/Quality | Medium | Worker/customer records may be shared |
| MFG-ROPA-GRV-001 | Employee/contractor grievance handling | HR/Legal | Medium | Complaint/grievance data |
| MFG-ROPA-BR-001 | Personal data breach and incident handling | CISO/Legal | High | Incident records and notifications |

---

## 11. Evidence checklist for manufacturing assessments

### 11.1 Governance evidence

| Evidence | Used for |
|---|---|
| DPDP owner appointment note | Governance score |
| Plant-wise DPDP RACI | Plant accountability |
| Steering committee minutes | Operational governance |
| DPDP action tracker | Remediation discipline |
| Plant coordinator list | Multi-site execution |
| DPDP training attendance | Workforce awareness |

### 11.2 Inventory and ROPA evidence

| Evidence | Used for |
|---|---|
| Personal data inventory | Data discovery |
| Plant-wise system inventory | Data location and ownership |
| Department data-flow maps | Process-level visibility |
| ROPA register | Processing activity documentation |
| HRMS/payroll/attendance field list | Workforce data inventory |
| Visitor/gate-entry register sample | Security/admin data mapping |
| CCTV camera-zone map | Surveillance purpose and scope |
| Biometric device list | High-risk data mapping |
| Vendor/processor register | Processor governance |

### 11.3 Notice and consent evidence

| Evidence | Used for |
|---|---|
| Employee privacy notice | Workforce notice |
| Contractor/agency worker notice | Contract labour notice |
| Visitor notice/signage | Gate/visitor transparency |
| CCTV signage photos | Surveillance transparency |
| Biometric notice/consent/legal review | High-risk processing review |
| Website/customer/warranty notice | External Data Principal notice |
| Consent/preference logs | Proof where consent is used |

### 11.4 Security evidence

| Evidence | Used for |
|---|---|
| RBAC/access matrix | System access control |
| Privileged access review | Admin access governance |
| CCTV access/export logs | Video-data protection |
| Biometric system security note | Biometric safeguards |
| Encryption/backups documentation | Technical safeguards |
| Log retention settings | Investigation readiness |
| Remote vendor access logs | Vendor and OT/IT access control |
| Endpoint security evidence | HR/security desk device protection |
| Backup restore test report | Resilience |

### 11.5 Breach and incident evidence

| Evidence | Used for |
|---|---|
| DPDP personal data breach playbook | Breach readiness |
| Escalation matrix | Response ownership |
| Data Principal notification templates | Communication readiness |
| Board/CERT-In reporting workflow where applicable | Regulatory coordination |
| Tabletop drill report | Implementation maturity |
| Vendor breach notification clauses | Processor readiness |
| Incident register | Auditability |

### 11.6 Vendor evidence

| Evidence | Used for |
|---|---|
| Vendor master / procurement register | Vendor visibility |
| Vendor data-processing classification | Processor assessment |
| Contracts / DPDP addenda | Contractual safeguards |
| Vendor security questionnaires | Due diligence |
| Sub-processor list | Downstream processing |
| Vendor review reports | Periodic assurance |
| Vendor offboarding/deletion confirmations | Lifecycle governance |

---

## 12. Dynamic question triggers for manufacturing

The assessment engine should trigger additional questions when these conditions apply.

| Trigger | Condition | Add question pack |
|---|---|---|
| Contract labour | `contractWorkers = true` or `contractorAgencies > 0` | Contractor worker and vendor governance pack |
| Biometric attendance/access | `biometricSystemUsed = true` | Biometric high-risk pack |
| CCTV/video surveillance | `cctvUsed = true` | CCTV notice/security/retention pack |
| Visitor management | `visitorManagement = true` | Visitor notice/retention/security pack |
| Occupational health | `medicalOrEhsRecords = true` | EHS/medical data pack |
| Employee transport | `transportVendorUsed = true` | Transport vendor and location data pack |
| Canteen vendor | `canteenVendorUsed = true` | Canteen vendor data pack |
| Multi-plant | `plantCount > 1` | Plant-wise governance and ROPA pack |
| Dealer/distributor network | `dealerPortal = true` or `warrantyData = true` | Dealer/customer data pack |
| Cloud/SaaS | `cloudHosted = true` or `saasSystemsUsed = true` | Cloud/cross-border/vendor pack |
| Cross-border | `globalHQAccess = true` or `dataLocationUnknown = true` | Cross-border review pack |
| AI/analytics | `aiUsage = true` or `videoAnalytics = true` | AI/privacy review pack |
| OT/IIoT | `otSystemsIntegrated = true` or `remoteOtSupport = true` | OT/IT access and logging pack |
| Children/minors | `under18Apprentices = true` or `childrenDependentsProcessed = true` | Children data pack |
| Marketing/warranty | `customerMarketing = true` or `warrantyRegistration = true` | Notice/consent/customer rights pack |

### Example trigger logic

```json
{
  "ruleCode": "TRIGGER_MANUFACTURING_BIOMETRIC",
  "condition": {
    "field": "biometricSystemUsed",
    "operator": "equals",
    "value": true
  },
  "addQuestionPack": "MFG_BIOMETRIC_HIGH_RISK_V1"
}
```

```json
{
  "ruleCode": "TRIGGER_MANUFACTURING_MULTI_PLANT",
  "condition": {
    "field": "plantCount",
    "operator": "greater_than",
    "value": 1
  },
  "addQuestionPack": "MFG_MULTI_PLANT_GOVERNANCE_V1"
}
```

---

## 13. Red flags and scoring considerations

### 13.1 Manufacturing-specific red flags

| Red flag | Suggested severity | Suggested score cap impact |
|---|---|---:|
| No personal data inventory covering plants and contractors | Critical | Cap 55 |
| No ROPA for employee, contractor, access, CCTV and biometric processing | Critical | Cap 60 |
| Biometric attendance/access used without purpose, notice, retention and safeguard review | Critical | Cap 50 |
| CCTV used without signage, access control or retention rule | High/Critical | Cap 60 |
| Contract labour personal data shared without responsibility matrix or vendor controls | High | Cap 65 |
| Payroll/HRMS/vendor processing without contract or DPDP clauses | High | Cap 70 |
| No breach playbook for workforce/payroll/biometric/CCTV data exposure | Critical | Cap 65 |
| No evidence of access controls for HRMS/payroll/attendance/CCTV systems | Critical | Cap 60 |
| Plant shared drives contain uncontrolled worker documents | High | Cap 70 |
| Remote vendor access to ERP/MES/OT systems is not logged or governed | High | Cap 70 |
| AI/video analytics used for workers without review | High/Critical | Cap 65 |
| Children/minor apprentices or CSR participant data processed without guardian/legal review | Critical | Cap 50 |

### 13.2 Evidence scoring guidance

| Claimed state | Evidence level likely supported |
|---|---|
| Verbal confirmation only | E0/E1 |
| Informal spreadsheet or email | E1 |
| Draft policy/SOP | E2 |
| Approved policy/SOP | E3 |
| Implemented process with screenshots/logs | E4 |
| Periodic review, audit, drill or monitored evidence | E5 |

### 13.3 Manufacturing maturity interpretation

| Maturity | Manufacturing meaning |
|---|---|
| Level 0 — Not Started | Plant data, worker records, vendors and CCTV/biometric systems are not mapped |
| Level 1 — Aware | Leadership recognises DPDP but evidence and ownership are weak |
| Level 2 — Defined | Policies and initial ROPA exist, but plant execution is partial |
| Level 3 — Implementing | Core systems, vendors, notices and actions are being operationalised |
| Level 4 — Operational | Plant-wise controls, evidence, breach readiness and vendor reviews are implemented |
| Level 5 — Continuous Assurance | Processing records, evidence, access, vendors and reassessment are continuously monitored |

---

## 14. Dashboard and report additions for manufacturing

### 14.1 Manufacturing executive dashboard cards

| Card | Meaning |
|---|---|
| Plant-wise DPDP maturity | Shows maturity by site/plant |
| Workforce data visibility | Employee + contractor data inventory coverage |
| Biometric/CCTV risk | High-risk monitoring data readiness |
| Contractor data governance | Contract labour processor/accountability readiness |
| Vendor processor readiness | Payroll/security/transport/canteen/IT vendor governance |
| OT/IT personal-data exposure | Operator logs/remote access/IIoT privacy visibility |
| EHS/medical data risk | Occupational health/safety record governance |
| Breach readiness | Personal-data breach playbook and drill maturity |
| ROPA completeness | Processing Activity Register maturity |
| Overdue plant actions | Plant-wise remediation accountability |

### 14.2 Manufacturing process dashboard

| Process | Relevant domains | Typical status/risk view |
|---|---|---|
| Employee onboarding | Notice, purpose, consent/basis, inventory, ROPA | Workforce baseline |
| Payroll and statutory benefits | Security, retention, vendors, accuracy | High-risk HR data |
| Contractor onboarding | Governance, vendor, notice, ROPA, security | Processor/accountability risk |
| Biometric attendance | Purpose, notice, consent/basis review, security, retention | High-risk identity processing |
| CCTV and video surveillance | Notice, purpose, security, retention, breach | Surveillance governance |
| Plant access and visitor management | Notice, security, retention, ROPA | Gate/admin data risk |
| EHS and occupational health | Inventory, purpose, security, retention, breach | Medical/safety records |
| Training and certification | Inventory, retention, accuracy | Skill/safety records |
| Dealer/distributor/warranty | Notice, consent, rights, CRM, vendor | Customer/channel data |
| Transport/canteen services | Vendor, purpose, security, retention | Employee service data |
| IT/OT and remote support | Security, vendor, logs, breach | Connected plant risk |
| AI/analytics | SDF/AI, purpose, security, human review | Worker monitoring risk |

### 14.3 Manufacturing report sections

The Manufacturing report should include additional sections:

1. Plant-wise DPDP maturity summary
2. Employee and contractor data-processing overview
3. Biometric and CCTV processing review
4. Contractor and agency data-governance review
5. Payroll, HRMS and statutory-record processing review
6. EHS/occupational health data review
7. Vendor/processor governance review
8. IT/OT and remote access privacy/security review
9. AI/video analytics and workforce-monitoring review
10. Manufacturing-specific 30/60/90-day remediation roadmap

---

## 15. UAT scenario for manufacturing template

Use this scenario to test the Manufacturing template.

### 15.1 Demo organisation

**Organisation:** Bharat Components Manufacturing Pvt. Ltd.  
**Industry:** Manufacturing / Auto Components  
**Structure:** 3 plants + corporate office  
**Employees:** 2,800 permanent employees  
**Contract workers:** 1,500 across security, housekeeping, maintenance, packaging and logistics  
**Systems:** HRMS, payroll, biometric attendance, access control, CCTV/VMS, ERP, MES, EHS system, visitor management, transport system, dealer portal  
**Vendors:** payroll processor, HRMS SaaS, security agency, manpower contractors, biometric vendor, CCTV vendor, transport vendor, canteen vendor, cloud backup, ERP support vendor  
**Risk triggers:** biometric, CCTV, contract labour, multi-plant, vendors, cloud, OT/MES, EHS medical records, AI safety analytics pilot

### 15.2 UAT flow

```text
1. Register Bharat Components Manufacturing Pvt. Ltd.
2. Select industry: Manufacturing / Industrial.
3. Add plants: Plant 1, Plant 2, Plant 3, Corporate Office.
4. Add departments: HR, Payroll, Security, EHS, IT, Procurement, Operations, Logistics, Sales/Service.
5. Add systems: HRMS, Payroll, Biometric Attendance, Access Control, CCTV/VMS, ERP, MES, EHS, Visitor Management.
6. Add vendors: HRMS SaaS, payroll processor, security agency, biometric vendor, CCTV vendor, labour contractors, transport vendor, canteen vendor, ERP support vendor.
7. Mark risk triggers: contract labour yes, biometric yes, CCTV yes, cloud yes, AI analytics yes, OT/MES yes, children/minors unknown.
8. Generate Manufacturing DPDP assessment.
9. Verify core + manufacturing + biometric + CCTV + contractor + vendor + AI + OT question packs.
10. Assign questions to HR, Security, EHS, IT, Procurement and Operations.
11. Create ROPA records for employee onboarding, payroll, contractor onboarding, biometric attendance, CCTV, visitor management, EHS incidents and transport.
12. Upload evidence: notices, access-control matrix, CCTV policy, biometric vendor contract, payroll contract, retention schedule, breach playbook.
13. Calculate score and verify red flags.
14. Generate gaps/actions and plant-wise dashboard.
15. Generate Manufacturing DPDP readiness report.
16. Close selected gaps and run reassessment.
```

### 15.3 UAT success criteria

| UAT check | Expected result |
|---|---|
| Manufacturing template selected | Manufacturing overlay appears |
| Biometric trigger enabled | Biometric high-risk questions appear |
| CCTV trigger enabled | CCTV notice/security/retention questions appear |
| Contract labour enabled | Contractor/vendor responsibility questions appear |
| Multi-plant enabled | Plant-wise governance and ROPA checks appear |
| AI analytics enabled | AI/privacy review questions appear |
| OT/MES enabled | OT/IT access and remote support questions appear |
| ROPA created | Manufacturing ROPA completeness calculated |
| No biometric evidence | High-risk gap generated |
| No vendor clauses | Vendor gap generated |
| No breach playbook | Critical breach gap generated |
| Report generated | Manufacturing-specific report sections included |

---

## 16. Notes for AI coding agent

The AI coding agent should implement Manufacturing as a separate industry overlay.

### 16.1 Template metadata

```json
{
  "templateCode": "MANUFACTURING_V1",
  "templateName": "Manufacturing / Industrial DPDP Assessment Template",
  "industryCode": "manufacturing",
  "version": "1.0",
  "coreTemplateRequired": true,
  "questionPacks": [
    "CORE_DPDP_V1",
    "MANUFACTURING_OVERLAY_V1",
    "MFG_CONTRACTOR_WORKER_V1",
    "MFG_BIOMETRIC_HIGH_RISK_V1",
    "MFG_CCTV_SURVEILLANCE_V1",
    "MFG_VENDOR_PROCESSOR_V1",
    "MFG_EHS_MEDICAL_V1",
    "MFG_OT_IT_ACCESS_V1",
    "AI_RISK_V1",
    "CLOUD_CROSSBORDER_V1"
  ]
}
```

### 16.2 Manufacturing-specific scope fields

Add these fields to the scope wizard when `industryCode = manufacturing`:

```json
{
  "plantCount": 0,
  "contractWorkers": false,
  "contractorAgencies": 0,
  "biometricSystemUsed": false,
  "cctvUsed": false,
  "visitorManagement": false,
  "medicalOrEhsRecords": false,
  "transportVendorUsed": false,
  "canteenVendorUsed": false,
  "dealerPortal": false,
  "warrantyData": false,
  "cloudHosted": false,
  "globalHQAccess": false,
  "dataLocationUnknown": false,
  "aiUsage": false,
  "videoAnalytics": false,
  "otSystemsIntegrated": false,
  "remoteOtSupport": false,
  "under18Apprentices": "unknown",
  "childrenDependentsProcessed": false
}
```

### 16.3 Assessment generation rule

```text
If industry = manufacturing:
    Add MANUFACTURING_OVERLAY_V1

If contractWorkers = true or contractorAgencies > 0:
    Add MFG_CONTRACTOR_WORKER_V1

If biometricSystemUsed = true:
    Add MFG_BIOMETRIC_HIGH_RISK_V1

If cctvUsed = true:
    Add MFG_CCTV_SURVEILLANCE_V1

If medicalOrEhsRecords = true:
    Add MFG_EHS_MEDICAL_V1

If otSystemsIntegrated = true or remoteOtSupport = true:
    Add MFG_OT_IT_ACCESS_V1

If aiUsage = true or videoAnalytics = true:
    Add AI_RISK_V1

If cloudHosted = true or globalHQAccess = true or dataLocationUnknown = true:
    Add CLOUD_CROSSBORDER_V1
```

### 16.4 Database seed tags

Use the following tags for questions:

```text
manufacturing
plant
employee_data
contractor_data
biometric
cctv
visitor_management
gate_access
occupational_health
ehs
payroll
attendance
access_control
transport
canteen
vendor_processor
remote_support
ot_security
iiots
ai_analytics
workforce_monitoring
warranty_customer_data
multi_plant
cross_border
```

### 16.5 Report generation notes

When generating a Manufacturing report, include:

- plant-wise readiness,
- employee and contractor data risk,
- biometric/CCTV review,
- vendor/processor readiness,
- EHS/medical data handling,
- IT/OT and remote support risks,
- AI/video analytics risks,
- breach-readiness maturity,
- 30/60/90-day remediation roadmap.

---

## 17. Suggested 30/60/90-day remediation roadmap for manufacturing clients

### First 30 days — Visibility and control foundation

| Priority | Action |
|---|---|
| P0 | Appoint DPDP owner and plant coordinators |
| P0 | Create personal data inventory across plants |
| P0 | Identify all HR/payroll/attendance/biometric/CCTV/contractor systems |
| P0 | Create ROPA records for top 10 processing activities |
| P0 | Identify all vendors/processors handling workforce/customer data |
| P0 | Prepare breach escalation matrix |

### 31–60 days — Evidence and high-risk remediation

| Priority | Action |
|---|---|
| P1 | Publish/update employee, contractor, visitor, CCTV and biometric notices |
| P1 | Define retention for CCTV, visitor logs, biometric, HR/payroll and EHS data |
| P1 | Review biometric purpose, security and retention |
| P1 | Review contractor/labour agency contracts and DPDP clauses |
| P1 | Review access controls for HRMS, payroll, attendance, CCTV and ERP |
| P1 | Create DPDP breach playbook and templates |

### 61–90 days — Operational maturity

| Priority | Action |
|---|---|
| P2 | Conduct evidence review and gap closure sprint |
| P2 | Conduct breach tabletop drill |
| P2 | Review high-risk vendors and remote access |
| P2 | Implement plant-wise DPDP dashboard |
| P2 | Conduct workforce awareness sessions |
| P2 | Run reassessment and generate improvement report |

---

## 18. Final implementation note

Manufacturing DPDP assessment must be practical and plant-aware. It should not remain at corporate policy level. The assessment should go into actual plant processes: gate entry, contractor onboarding, attendance, payroll, CCTV, biometric systems, EHS records, vendor support, OT/MES logs, shared drives, transport/canteen vendors, dealer/customer data and AI/video analytics.

The strongest TrustStack DPDP Compass manufacturing assessment will combine:

```text
Corporate DPDP governance
+ Plant-wise data discovery
+ Workforce/contractor ROPA
+ Biometric/CCTV review
+ Vendor/processor control
+ EHS/medical record safeguards
+ IT/OT security visibility
+ Evidence-backed scoring
+ Practical remediation roadmap
```

---

## 19. Source and context references for maintainers

These references were used as context for building this industry overlay. They should be checked and updated periodically by the TrustStack content owner.

| Reference | Use in this file |
|---|---|
| Digital Personal Data Protection Act, 2023 — MeitY official text | DPDP processing, fiduciary/processor roles, consent, obligations and penalties |
| Digital Personal Data Protection Rules, 2025 — MeitY/PIB official materials | Notice, safeguards, breach, rights, children, operational controls |
| Factories Act, 1948 — India Code / Ministry of Labour | Worker/factory record context; adult worker registers; occupational safety/health/welfare context |
| Code on Wages, 2019 — India Code / Ministry of Labour | Payroll, wages, records, returns and notices context |
| Code on Social Security, 2020 — India Code | Employee/worker social-security and record-keeping context |
| CERT-In Cyber Security Directions dated 28 April 2022 | Incident reporting, logs, time synchronisation and cybersecurity-operational context where applicable |
| NIST SP 800-82 Rev. 3 Guide to Operational Technology Security | OT/IT and industrial system security context |

**Legal note:** Sector references are used to improve assessment quality. They do not convert DPDP Compass into a full labour-law, factory-law, cybersecurity or OT-security compliance product. Final legal interpretation and statutory applicability should be reviewed by authorised legal counsel.
