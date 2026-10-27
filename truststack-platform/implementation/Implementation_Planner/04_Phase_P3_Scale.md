# Phase P3 — Scale
## Enterprise features: Sector Packs, Academy, Badge, DPO-as-a-Service, Connectors, API

**Phase:** P3  
**Status:** 🔲 Not Started  
**Prerequisites:** All P2 complete + v2.10.0 tagged; Milestone 2 (Public Launch) achieved  
**Version range:** v3.1.0 → v3.6.0  
**Target completion:** Milestone 3 (Scale + Enterprise, June 2027)

---

## Why P3?

P2 makes TrustStack™ sellable. P3 makes it defensible:
- **Sector Packs** lock in verticals (Healthcare, Finance, ITES) with industry-specific compliance templates
- **Academy** turns compliance education into a recurring revenue and retention tool  
- **Compliance Badge** makes customers into public advocates
- **DPO-as-a-Service** captures the large segment that can't afford a full-time DPO
- **India DSR Connectors** (pre-built integrations with Salesforce, Zoho, SAP) make TrustStack™ the system of record
- **DPDP API** enables B2B2C and consulting firm resellers

All P3 features target ₹50K–₹5L ACV enterprise customers and accelerate the journey to ₹2.5–5 Cr ARR.

---

## Module List

| Module | Name | Phase | Prompt File | Tag | Status |
|---|---|---|---|---|---|
| M20 | Sector Packs | P3 | `P3_M20_Sector_Packs.md` | v3.1.0 | 🔲 |
| M21 | TrustStack™ Academy | P3 | `P3_M21_TrustStack_Academy.md` | v3.2.0 | 🔲 |
| M22 | Compliance Badge | P3 | `P3_M22_Compliance_Badge.md` | v3.3.0 | 🔲 |
| M23 | DPO-as-a-Service | P3 | `P3_M23_DPO_as_a_Service.md` | v3.4.0 | 🔲 |
| M24 | India DSR Connectors | P3 | `P3_M24_India_DSR_Connectors.md` | v3.5.0 | 🔲 |
| M25 | DPDP API (Public API) | P3 | `P3_M25_DPDP_API.md` | v3.6.0 | 🔲 |

---

## Module Descriptions

### M20 — Sector Packs
Industry-specific pre-built DPDP compliance templates, risk matrices, and assessment overlays.

**Sectors:** Healthcare, Financial Services, ITES/SaaS, E-commerce/Retail, Education, Manufacturing  
**What each pack includes:**
- Pre-filled ROPA templates for the sector's common processing activities
- Industry-specific assessment questions (on top of M1's 45 core questions)
- Sector-specific vendor checklist templates
- Pre-approved consent templates compliant with sector's primary regulator (SEBI, IRDAI, RBI, NABH, AICTE)
- Privacy Notice clauses specific to the sector

**Key tables:** `sector_packs` (sector_id, name, version, is_active), `sector_pack_templates` (pack_id, template_type, content)  
**Access:** Enterprise plan + Business plan; PAYG credit per sector pack applied  
**UI:** `/dashboard/sector-packs` — gallery of available packs, apply pack button, pack content preview

### M21 — TrustStack™ Academy
In-platform DPDP compliance training for employees, DPOs, and board members.

**Content:** Short courses (15–30 min) on: DPDP Act overview, data classification, consent best practices, DSR handling, breach response, vendor risk, board obligations  
**Delivery:** Video + quiz format (embedded via YouTube/Vimeo or self-hosted)  
**Certificates:** AI-generated PDF certificate after course completion (signed by "TrustStack™ Academy")  
**Tracking:** Per-user completion, course pass/fail, certificate expiry (1 year)  
**Revenue:** Included in Business + Enterprise; ₹500/user/year PAYG; bulk corporate training packages  

**Key tables:** `academy_courses`, `academy_enrollments` (user_id, course_id, started_at, completed_at, score), `academy_certificates`  
**UI:** `/dashboard/academy` — course catalog, progress bars, certificate download

### M22 — Compliance Badge
Embeddable badge for org's website and LinkedIn showing TrustStack™ compliance status.

**Badge types:**
- "DPDP Compliant" (Compass Score 70+, all critical modules active)
- "Data Privacy Certified" (Compass Score 85+, Academy training complete)
- "Breach-Ready Organization" (M8 active, incident plan in place)

**Implementation:**
- Badge is an SVG embed code (similar to M2's consent widget)
- Real-time: badge darkens if org's Compass Score drops below threshold
- Public URL: `https://truststack.in/badge/{org-slug}/verify` shows full certificate

**Key tables:** `compliance_badges` (org_id, badge_type, issued_at, expires_at, is_revoked)  
**UI:** `/dashboard/badges` — badge gallery, embed code, share to LinkedIn button

### M23 — DPO-as-a-Service
Monthly advisory service for organizations that need a DPO but can't hire one full-time.

**What it provides:**
- Dedicated Anix AI DPO assigned to the org (via TrustStack™ platform)
- Monthly video call (scheduled via Calendly integration or in-platform booking)
- Async Q&A channel (in-platform messaging thread)
- Annual DPDP risk assessment review
- Breach response on-call support

**Tiers:** Starter DPO (₹8K/month, 2hr/month), Growth DPO (₹15K/month, 5hr/month), Enterprise DPO (₹30K/month, dedicated)  

**Key tables:** `dpo_engagements` (org_id, dpo_user_id, tier, hours_per_month, start_date, end_date), `dpo_advisory_sessions`, `dpo_messages`  
**Integration:** Calendly API for scheduling; Resend for session summaries  
**UI:** `/dashboard/dpo-advisory` — assigned DPO profile, upcoming sessions, message thread, session notes

### M24 — India DSR Connectors
Pre-built connectors that automatically fulfill DSR requests (delete, export) from India's most-used business systems.

**Connectors (V1):**
- Salesforce CRM — delete/export customer records via Salesforce API
- Zoho CRM/Zoho Books — delete/export via Zoho API
- MySQL/PostgreSQL — custom SQL delete/export query runner (admin provides schema)
- Google Workspace (Gmail, Drive) — delete via Admin SDK
- Shopify — delete customer data via Shopify API

**Architecture:** Per-connector OAuth/API key config stored per org; connector executes when admin approves DSR; results logged to dsr_fulfillment_log

**Key tables:** `dsr_connectors` (org_id, connector_type, config_encrypted, is_active), `dsr_fulfillment_log` (dsr_id, connector_id, status, executed_at, result_summary)  
**Security:** Connector API keys encrypted at rest (AES-256 via Supabase Vault)  
**UI:** `/dashboard/dsr-connectors` — connector marketplace, configure, test connection, fulfillment log

### M25 — DPDP Public API
REST API so third parties can integrate TrustStack™ compliance into their own applications.

**Use cases:**
- CRM vendors add TrustStack™ consent check before sending marketing emails
- HR software checks DSR status before employee offboarding
- DPO consulting firms build client portals on top of TrustStack™ data
- Startups embed TrustStack™ into their own product without the dashboard UI

**Authentication:** API keys (`ts_live_xxx` prefix) scoped per org, rate-limited per plan  
**V1 endpoints:**
- GET /v1/consent/{data_principal_id} — check consent status
- POST /v1/consent/record — record consent programmatically
- POST /v1/dsr — submit DSR request
- GET /v1/compliance-score/{org-id} — retrieve current Compass Score (with org's permission)
- POST /v1/breach/notify — log a breach incident

**Key tables:** `api_keys` (org_id, key_hash, scopes[], rate_limit_per_min, last_used_at, revoked_at)  
**Docs:** Auto-generated OpenAPI 3.0 spec at `/api/v1/openapi.json`; Swagger UI at `/api/docs`  
**Rate limits:** Micro 10 req/min, Starter 100 req/min, Enterprise unlimited

---

## P3 Revenue Model

| Module | Included in Plan | PAYG Price |
|---|---|---|
| M20 Sector Packs | Enterprise only | ₹5,000/sector/month |
| M21 Academy | Business + Enterprise | ₹500/user/year |
| M22 Badge | Growth + | Free (drives awareness) |
| M23 DPO Advisory | Add-on (all plans) | ₹8K–30K/month |
| M24 DSR Connectors | Business + Enterprise | ₹2,000/connector/month |
| M25 DPDP API | All (rate-limited) | ₹1/API call over limit |

---

## P3 Technical Considerations

- **M25 API versioning:** Use path-based versioning (`/api/v1/`) — never header-based. Easier to document, easier to deprecate.
- **M24 Connector security:** Never store API keys in plaintext. Use Supabase Vault (`pgsodium`) for encryption-at-rest.
- **M23 DPO matching:** V1 uses Anix AI's own DPO team. V2 can build a marketplace of registered DPOs.
- **M20 Sector Pack versions:** Version every pack (1.0, 1.1) — orgs may be on old versions; notify to upgrade.
- **M22 Badge real-time:** The badge SVG endpoint must be fast (< 200ms) — it's loaded by the org's website on every page.
