# Phase P4 — Innovation
## Next-gen features: AI Governance, Consent Propagation, ISO 27701, Data Discovery, Privacy-as-Code

**Phase:** P4  
**Status:** 🔲 Not Started  
**Prerequisites:** P3 complete (v3.6.0 tagged), Milestone 3 achieved  
**Version range:** v4.1.0 → v4.5.0  
**Target timeframe:** 2027+

---

## Why P4?

P4 cements TrustStack™ as India's privacy infrastructure layer — not just a compliance dashboard but a developer and enterprise platform that rivals OneTrust (US) for India's data protection landscape.

By 2027, two trends will dominate:
1. **AI governance** — Every company deploying AI will need to demonstrate data provenance, consent chains, and bias auditing. DPDP will issue guidance on AI training data usage.
2. **Cross-system consent** — Data principals will expect one consent decision to propagate across all of a company's systems (CRM, email, analytics, ads) — a technical challenge no Indian platform has solved.

P4 addresses both, plus adds ISO 27701 certification pathway, automated data discovery, and privacy-as-code for engineering teams.

---

## Module List

| Module | Name | Phase | Prompt File | Tag | Status |
|---|---|---|---|---|---|
| M26 | AI Governance Module | P4 | `P4_M26_AI_Governance.md` | v4.1.0 | 🔲 |
| M27 | Consent Propagation Engine | P4 | `P4_M27_Consent_Propagation.md` | v4.2.0 | 🔲 |
| M28 | ISO 27701 Pathway | P4 | `P4_M28_ISO27701_Pathway.md` | v4.3.0 | 🔲 |
| M29 | Data Discovery (Automated PII Scanning) | P4 | `P4_M29_Data_Discovery.md` | v4.4.0 | 🔲 |
| M30 | Privacy-as-Code | P4 | `P4_M30_Privacy_as_Code.md` | v4.5.0 | 🔲 |

---

## Module Descriptions

### M26 — AI Governance Module
Help organizations comply with emerging DPDP and MeitY guidance on AI training data usage, model bias, and automated decision-making.

**Features:**
- AI Model Registry: catalog all AI models in use, their training data sources, and consent basis
- Automated Decision-Making Disclosure: per DPDP Act §6, data principals must be able to opt out of automated decisions affecting them
- Training Data Consent Chain: for each ML model, TrustStack™ maps the consent records that authorized use of the underlying data
- Bias Audit Log: record when, by whom, and why bias audits were performed
- DPDP AI Readiness Score: extension of Compass Assessment for AI-using organizations

**Key tables:** `ai_models` (org_id, name, purpose, training_data_description, consent_basis, last_audit_at), `ai_decisions` (model_id, data_principal_id, decision_type, opted_out)

**Target customers:** FinTech (credit scoring), HealthTech (diagnostics), HRTech (resume screening), EdTech (adaptive learning), any company using AI that processes personal data

### M27 — Consent Propagation Engine
When a data principal withdraws consent, that withdrawal must propagate to ALL systems where their data lives — not just TrustStack™.

**Problem:** Today, consent withdrawal in TrustStack™ is recorded but doesn't actually delete the data from Salesforce, the email marketing list, the analytics platform, etc. M27 closes this gap.

**Architecture:**
- Consent event webhook: when consent status changes, fire to all registered webhooks
- Native propagation to M24's connector list (Salesforce, Zoho, Google Workspace, Shopify)
- Propagation log: every downstream system notified, with ack/nack tracking
- SLA: propagation must complete within 30 minutes (per DPDP spirit, not yet specified in rules)

**Key tables:** `consent_propagation_rules` (consent_config_id, connector_id, action, field_mapping), `propagation_events` (consent_record_id, connector_id, status, completed_at, error)

**Compliance value:** This is the most technically complex DPDP requirement and the one most orgs will fail — TrustStack™ being the only platform to solve it automated creates a major moat.

### M28 — ISO 27701 Pathway
Guided certification pathway for ISO 27701 (Privacy Information Management System — the privacy extension to ISO 27001).

**How it works:**
- ISO 27701 gap assessment: 76 controls mapped to TrustStack™ modules
- For each control: "implemented / partial / not implemented" status, evidence link, remediation plan
- Evidence collector: auto-pull evidence from M1–M25 (assessment reports, ROPA, consent records, vendor DPAs) into ISO 27701 control dossiers
- Audit-ready package: generate a PDF evidence pack per control section for auditors
- Certification tracker: log when formal audit is scheduled, auditor name, expected date, result

**Key tables:** `iso27701_controls` (control_id, name, description, mapped_modules), `iso27701_assessments` (org_id, control_id, status, evidence_links, notes, updated_at)

**Target customers:** Enterprises required by corporate parent, customers, or sector regulator to achieve ISO 27701 (BFSI, healthcare, large IT services firms)

**Revenue:** Included in Enterprise plan; ₹50K/year premium add-on for SMEs; DPO-as-a-Service session for audit prep

### M29 — Data Discovery (Automated PII Scanning)
Automatically scan connected databases, file stores, and SaaS apps to discover where personal data lives.

**Scanners (V1):**
- PostgreSQL/MySQL: connect read-only, scan column names and sample data for PII patterns
- S3/GCS buckets: scan CSV/JSON files for email, phone, Aadhaar, PAN patterns
- Salesforce/Zoho: scan fields via API
- Google Drive: scan document content via Drive API

**Output:**
- PII Map: visual graph of where personal data was found (database → table → column, file → field)
- Confidence score per finding (regex match vs. semantic match)
- Auto-suggest ROPA entries based on discovered processing activities
- Risk heat map: systems with PII but no corresponding ROPA entry = "shadow processing"

**Key tables:** `discovery_scans` (org_id, connector_type, status, started_at, completed_at), `discovery_findings` (scan_id, location, field_name, pii_type, confidence, suggested_ropa_entry)

**Privacy note:** Scanner uses only metadata and sampled data (never full records). Credentials for scanning are stored encrypted (same as M24 connectors).

### M30 — Privacy-as-Code
Developer toolkit to embed privacy checks directly into CI/CD pipelines and code.

**Components:**
- TrustStack™ SDK (npm package `@truststack/privacy`): `checkConsent()`, `recordDSR()`, `logProcessingActivity()`, `notifyBreach()` — server-side only
- GitHub Action: scan PRs for new data fields that lack ROPA entries or consent basis
- ESLint plugin: flag direct DB queries on personal data tables that don't pass through TrustStack™ API
- Privacy Review Checklist: auto-generated checklist for PRs that touch personal data fields (similar to security review)

**Workflow:**
1. Developer adds a new `user_email` column to a table
2. GitHub Action detects new personal data field
3. Auto-comments on PR: "⚠️ This field contains personal data. Please ensure: (1) ROPA entry created, (2) Consent basis documented, (3) Retention period set."
4. PR cannot be merged until DPO approves in TrustStack™ dashboard (optional — org configures gate strictness)

**Target customers:** Tech companies with engineering teams; required by enterprise procurement in ITES, FinTech

**Revenue:** Included in Business + Enterprise plans; ₹1,000/developer/month PAYG for smaller teams

---

## P4 Technical Considerations

- **M26 AI Governance:** The regulatory landscape is still evolving (MeitY AI Policy 2025 is a draft). Build flexibly — the Compass Score extension should be easy to update as rules solidify.
- **M27 Consent Propagation:** Race conditions are the main risk — a consent withdrawal firing 10 webhooks simultaneously. Use a queue (Supabase pg_queues or Vercel serverless with retry) rather than direct HTTP calls from the route handler.
- **M28 ISO 27701:** The controls change between ISO versions. Store control text in DB (not code) so it can be updated without deployment.
- **M29 Data Discovery:** The scan must NEVER store raw personal data. Sample 100 rows, check for PII patterns, discard. Log only: "Column X in Table Y matches email pattern with 97% confidence."
- **M30 Privacy-as-Code:** The npm SDK should have ZERO runtime dependencies on the TrustStack™ dashboard being up — it calls the DPDP API (M25) with API key auth. If TrustStack™ is down, SDK logs locally and syncs when connection restored.

---

## P4 Competitive Position

By P4 completion, TrustStack™ will be the **only platform** in India that offers:
- AI governance integrated with consent management
- Automated consent propagation across all connected systems
- ISO 27701 certification pathway built-in
- Automated PII discovery without manual inventory
- Privacy checks in developer CI/CD pipelines

This creates significant switching cost and positions TrustStack™ to compete with OneTrust, BigID, and DataGrail in the Indian enterprise segment — at a fraction of their price.
