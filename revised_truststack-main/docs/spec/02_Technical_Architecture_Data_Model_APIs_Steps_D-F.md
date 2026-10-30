# TrustStack™ DPDP Compass — Technical Architecture, Data Model and API Design

**Coverage:** Steps D–F  
**Purpose:** Technology architecture, deployment-ready stack, multi-tenant database model and reusable backend API design.

---

# Step D — Recommended Technology Architecture and Stack

## Architecture Decision

Build TrustStack™ DPDP Compass as an:

# API-first, multi-tenant, modular SaaS platform

The platform should have a separate frontend and backend so that backend APIs can be reused later by:

- main TrustStack web frontend,
- consultant portal,
- mobile app,
- partner frontend,
- white-labelled client portal,
- external integrations,
- AI workflows.

---

## Final Recommended Stack

| Layer | Recommendation |
|---|---|
| Frontend | Next.js + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Backend API | NestJS + TypeScript |
| API style | REST + OpenAPI/Swagger |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Clerk / Auth0 / Supabase Auth with backend RBAC |
| File storage | S3-compatible object storage |
| Queue | Redis + BullMQ |
| Worker | Separate worker service |
| AI | Backend-only AI Gateway using Claude / Gemini / OpenAI |
| RAG | PostgreSQL pgvector initially |
| Reports | PDF, DOCX, XLSX generation |
| Monitoring | Sentry + logs + product analytics |
| Deployment | Vercel frontend + separate backend deployment |

---

## High-Level Architecture

```text
TrustStack Web Frontend
Next.js / React / TypeScript
        ↓
Backend API Gateway
NestJS / REST / OpenAPI
        ↓
Core Application Services
Organisation | Assessment | Scoring | ROPA | Evidence | Gaps | Actions | Reports
        ↓
Data Layer
PostgreSQL + Prisma + tenant controls
        ↓
Supporting Services
Object Storage | Redis Queue | AI/RAG Service | Email/Notifications | Monitoring
        ↓
Deployment
Vercel Frontend + Managed Backend + Managed Database + Secure Storage
```

---

## Why Separate Backend Instead of Only Next.js

| Requirement | Why separate backend is better |
|---|---|
| Reusable APIs | External frontends can use the same backend. |
| Complex scoring | Easier to maintain and test in service layer. |
| Multi-tenant RBAC | Stronger backend enforcement. |
| AI workflows | Backend controls prompts, RAG, tenant context and cost. |
| Report generation | Long-running jobs need workers. |
| Evidence storage | Secure signed URLs and audit logs. |
| Enterprise integrations | Easier API contracts and system-to-system access. |

Recommended model:

> **Next.js for frontend experience + NestJS for backend business APIs.**

---

## Frontend Stack

| Component | Technology | Why |
|---|---|---|
| Framework | Next.js | Modern React app, routing, dashboard UI, Vercel deployment. |
| Language | TypeScript | Type safety across UI and APIs. |
| Styling | Tailwind CSS | Fast professional UI development. |
| Components | shadcn/ui + Radix UI | Enterprise-style UI components. |
| Forms | React Hook Form + Zod | Long forms and validation. |
| API state | TanStack Query | Caching, loading, mutation and refetch. |
| Tables | TanStack Table | ROPA, evidence, gaps and actions. |
| Charts | Recharts / ECharts / Tremor | Dashboards and scorecards. |
| Icons | Lucide React | Clean interface icons. |
| Rich text | TipTap / Lexical | Notes, report sections, AI drafts. |

---

## Backend Stack

| Component | Technology | Why |
|---|---|---|
| Framework | NestJS | Modular, scalable TypeScript backend. |
| API | REST + OpenAPI | Easy for AI agents, partners and frontends. |
| Validation | class-validator / Zod | Strong request validation. |
| ORM | Prisma | Type-safe database access and migrations. |
| Background jobs | BullMQ | Reports, imports, AI jobs, reminders. |
| Cache/queue | Redis / Upstash Redis | Queue and async processing. |
| Auth verification | Provider token validation | Clerk/Auth0/Supabase integration. |
| Logging | Structured logs | Auditability and debugging. |

---

## Database Stack

Primary database: **PostgreSQL**.

Why PostgreSQL fits:

- strongly relational data,
- organisations/users/roles,
- assessments/responses/questions,
- ROPA records,
- evidence metadata,
- gaps/actions,
- score snapshots,
- audit logs,
- JSONB support,
- vector extension support for RAG.

Recommended database options:

| Stage | Option |
|---|---|
| MVP | Supabase Postgres or Neon |
| Production MVP | Managed PostgreSQL with backup and pooling |
| Enterprise | AWS RDS PostgreSQL / Cloud SQL / Azure PostgreSQL |

---

## File Storage

Use S3-compatible object storage for evidence and reports.

Options:

- AWS S3,
- Supabase Storage,
- Cloudflare R2,
- Azure Blob,
- Google Cloud Storage.

Storage path design:

```text
organizations/{organization_id}/evidence/{evidence_id}/{filename}
organizations/{organization_id}/reports/{report_id}/{filename}
organizations/{organization_id}/exports/{export_id}/{filename}
```

Rules:

- no public evidence links,
- signed upload and download URLs,
- file type validation,
- file size limits,
- audit every upload/download,
- malware scan in production,
- evidence metadata stored in database.

---

## AI Architecture

The AI Assistant should be accessed only through a backend-controlled AI Gateway.

```text
Frontend AI Assistant Panel
        ↓
Backend AI Gateway
        ↓
Authentication + Tenant + Permission Check
        ↓
Context Builder
        ↓
RAG Retrieval Layer
        ↓
Prompt Builder
        ↓
LLM Provider Router
        ↓
Structured Output Validator
        ↓
Safety Check
        ↓
UI + Audit Log
```

AI provider strategy:

| Provider | Best use |
|---|---|
| Claude | Long-context reasoning and report drafting. |
| Gemini | Google ecosystem and structured outputs. |
| OpenAI | Structured outputs, function/tool workflows and summarisation. |
| Private/local later | Enterprise privacy-sensitive deployments. |

AI rules:

- AI can guide and draft.
- AI cannot certify compliance.
- AI cannot approve evidence.
- AI cannot override scores.
- AI cannot close gaps.
- AI cannot use another tenant’s data.

---

## Security Architecture

| Control | Requirement |
|---|---|
| Tenant isolation | `organization_id` on every client-specific record. |
| RBAC | Backend permission enforcement. |
| Evidence access | Signed URLs only. |
| Encryption | In transit and at rest. |
| Audit logs | Sensitive actions logged. |
| AI safety | Tenant-scoped RAG and guarded prompts. |
| Reports | Permission-controlled and versioned. |
| Secrets | Stored in platform secret manager/environment. |
| Backups | Automated database and storage backups. |

---

# Step E — Multi-Tenant Data Model and Database Schema

## Database Model Decision

Use:

# Shared database, shared schema, tenant-isolated by `organization_id`

This is the best balance for MVP and SaaS scalability.

| Option | Recommendation |
|---|---|
| Separate database per client | Too heavy for MVP. |
| Separate schema per client | Possible later for enterprise. |
| Shared DB + `organization_id` | Recommended. |
| Shared DB + RLS | Stronger production option. |

---

## Core Data Principles

| Principle | Requirement |
|---|---|
| UUID primary keys | Use UUIDs for major records. |
| Tenant isolation | Every client-specific table includes `organization_id`. |
| Auditability | Use `created_by`, `updated_by`, timestamps. |
| Soft delete | Use `deleted_at` where needed. |
| Versioning | Version questions, templates, scoring and reports. |
| Evidence traceability | Evidence can link to responses, ROPA, gaps, actions, reports. |
| Score snapshotting | Finalised scores are stored permanently. |
| AI safety | AI history is tenant-scoped. |

---

## Entity Relationship Overview

```text
Platform
  └── Organizations / Tenants
        ├── Users and Roles
        ├── Departments
        ├── Systems
        ├── Vendors / Processors
        ├── Assessment Templates
        ├── Assessments
        │     ├── Assessment Questions
        │     ├── Responses
        │     ├── Evidence Links
        │     ├── Score Snapshots
        │     ├── Gaps
        │     ├── Actions
        │     └── Reports
        ├── ROPA Records
        ├── Notices
        ├── Consent Records
        ├── Rights Requests
        ├── Grievances
        ├── Breach Records
        ├── AI Assistant Sessions
        └── Audit Logs
```

---

## Table Groups

| Group | Tables |
|---|---|
| Platform / Tenant | `organizations`, `organization_settings` |
| Users / RBAC | `users`, `organization_users`, `roles`, `permissions`, `role_permissions` |
| Master Configuration | `industries`, `dpdp_domains`, `dpdp_controls`, `question_bank`, `question_versions` |
| Templates | `assessment_templates`, `template_questions`, `industry_overlays` |
| Organisation Scope | `departments`, `systems`, `data_principal_types`, `data_categories`, `vendors` |
| Assessments | `assessments`, `assessment_questions`, `assessment_assignments`, `assessment_responses` |
| Evidence | `evidence_files`, `evidence_links`, `evidence_reviews` |
| ROPA | `ropa_records`, `ropa_data_categories`, `ropa_vendors`, `ropa_systems`, `ropa_evidence_links` |
| Scoring | `score_snapshots`, `domain_scores`, `red_flags` |
| Gaps / Actions | `gaps`, `remediation_actions`, `action_comments` |
| DPDP Workflows | `notices`, `consent_records`, `rights_requests`, `grievances`, `breach_incidents` |
| Reports | `reports`, `report_exports` |
| AI Assistant | `ai_sessions`, `ai_messages`, `ai_suggestions`, `knowledge_documents` |
| Audit / Security | `audit_logs`, `api_keys`, `webhooks`, `notification_events` |

---

## Core Enums

```text
organization_type:
  company, llp, university, trust, society, public_body, government, other

industry_code:
  university, edtech, bfsi, healthcare, saas, manufacturing, retail, public_sector, professional_services, other

assessment_type:
  baseline, reassessment, department, vendor, event_triggered

assessment_status:
  draft, active, submitted, under_review, finalised, archived

applicability:
  applicable, not_applicable, conditional, unknown

maturity_score:
  0, 1, 2, 3, 4, 5

evidence_level:
  E0, E1, E2, E3, E4, E5

evidence_status:
  requested, uploaded, under_review, partial, adequate, strong, outdated, rejected

risk_level:
  critical, high, medium, low, improvement

priority:
  P0, P1, P2, P3

action_status:
  open, assigned, in_progress, evidence_requested, evidence_submitted, under_review, closed, reopened, deferred, not_applicable
```

---

## Key Tables

### `organizations`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Tenant ID. |
| `name` | Text | Display name. |
| `legal_name` | Text | Legal entity. |
| `organization_type` | Enum | Company/university/etc. |
| `industry_id` | UUID FK | Industry. |
| `website` | Text | Optional. |
| `headquarters_city` | Text | Example: Mumbai. |
| `employee_count` | Integer | Optional. |
| `data_principal_count_estimate` | Integer | Optional. |
| `consultant_assisted` | Boolean | Whether Anix/TrustStack is assisting. |
| `created_at`, `updated_at`, `deleted_at` | Timestamp | Lifecycle fields. |

### `organization_users`

Maps users to organisations and roles.

| Column | Type |
|---|---|
| `id` | UUID PK |
| `organization_id` | UUID FK |
| `user_id` | UUID FK |
| `role_id` | UUID FK |
| `department_id` | UUID nullable |
| `status` | invited / active / suspended |
| `invited_by` | UUID |
| `joined_at` | Timestamp |

### `dpdp_domains`

Stores the 16-domain scoring model.

| Code | Domain | Weight |
|---|---|---:|
| GOV | Governance, accountability and DPDP ownership | 7 |
| INV | Personal data discovery and inventory | 8 |
| ROPA | Records of Processing Activities | 6 |
| PURPOSE | Purpose, lawful basis and data minimisation | 7 |
| NOTICE | Notice management | 7 |
| CONSENT | Consent and consent withdrawal | 7 |
| RIGHTS | Data Principal rights | 7 |
| GRIEVANCE | Grievance redressal and contact publication | 5 |
| RETENTION | Retention, erasure and archival | 6 |
| ACCURACY | Data accuracy and quality | 4 |
| SECURITY | Security safeguards | 10 |
| BREACH | Personal data breach readiness | 8 |
| VENDOR | Vendor / Data Processor governance | 7 |
| CHILD | Children’s data and guardian consent | 4 |
| CROSSBORDER | Cross-border transfer and cloud/SaaS risk | 3 |
| SDF_AI | SDF, DPIA, audit and AI risk readiness | 4 |

Total = **100**.

### `question_bank` and `question_versions`

Questions must be versioned so old assessments remain reproducible.

Important fields:

- question code,
- domain,
- control mapping,
- question text,
- why it matters,
- scoring hint,
- evidence required,
- remediation hint,
- trigger condition,
- version.

### `assessments`

Stores assessment lifecycle.

| Column | Purpose |
|---|---|
| `assessment_type` | baseline / reassessment / vendor |
| `template_id` | selected template |
| `parent_assessment_id` | reassessment link |
| `status` | draft / active / submitted / finalised |
| `started_at`, `submitted_at`, `finalised_at` | lifecycle |
| `finalised_by` | accountability |

### `assessment_questions`

Question snapshot table. Stores actual question text and version used in an assessment.

### `assessment_responses`

Stores:

- applicability,
- claimed maturity score,
- evidence level,
- adjusted score,
- comments,
- review status,
- reviewer comments.

### `evidence_files`, `evidence_links`, `evidence_reviews`

Evidence can be linked to many entity types:

- assessment response,
- ROPA record,
- gap,
- action,
- vendor,
- notice,
- breach incident,
- report.

### `ropa_records`

Core fields:

- processing activity name,
- department,
- process owner,
- Data Principal type,
- personal data categories,
- purpose,
- DPDP basis/legal review note,
- source,
- systems,
- vendors,
- retention,
- erasure,
- safeguards,
- notice/consent links,
- children/cross-border/AI flags,
- risk rating,
- completeness score,
- review status.

### `score_snapshots` and `domain_scores`

Finalised assessments must store immutable score snapshots.

### `gaps` and `remediation_actions`

Weak responses create gaps, and gaps generate actions.

### `ai_sessions`, `ai_messages`, `ai_suggestions`

AI history and suggestions must be tenant-scoped and reviewable.

### `audit_logs`

Sensitive actions must be logged.

---

## Critical Indexes

| Table | Index |
|---|---|
| `organization_users` | `(organization_id, user_id)` |
| `assessments` | `(organization_id, status)` |
| `assessment_responses` | `(assessment_id, assessment_question_id)` |
| `evidence_files` | `(organization_id, evidence_status)` |
| `evidence_links` | `(linked_entity_type, linked_entity_id)` |
| `ropa_records` | `(organization_id, department_id)`, `(organization_id, risk_rating)` |
| `gaps` | `(organization_id, assessment_id, risk_level)` |
| `remediation_actions` | `(organization_id, assigned_to_user_id, status)` |
| `audit_logs` | `(organization_id, created_at)` |
| `ai_messages` | `(organization_id, ai_session_id)` |

---

# Step F — API Design for Reusable Backend

## API Design Principle

The backend should be:

# API-first, tenant-aware and role-secured

Every API request should follow:

```text
Authenticate user
    ↓
Identify active organisation / tenant
    ↓
Check user role and permission
    ↓
Validate payload
    ↓
Execute business logic
    ↓
Audit sensitive action
    ↓
Return structured response
```

---

## API Style

| Area | Recommendation |
|---|---|
| API style | REST |
| Versioning | `/api/v1` |
| Documentation | OpenAPI / Swagger |
| Payload | JSON |
| Auth | JWT/session token from auth provider |
| Authorization | RBAC + tenant membership |
| Uploads | Signed URLs |
| AI outputs | Structured JSON |
| Audit | Sensitive actions logged |

---

## API Groups

| API group | Path |
|---|---|
| Auth | `/api/v1/auth` |
| Organisations | `/api/v1/organizations` |
| Users/RBAC | `/api/v1/users`, `/api/v1/roles` |
| Industries | `/api/v1/industries` |
| Scope | `/api/v1/organizations/:id/scope` |
| Questions | `/api/v1/questions` |
| Templates | `/api/v1/templates` |
| Assessments | `/api/v1/assessments` |
| Responses | `/api/v1/responses` |
| Evidence | `/api/v1/evidence` |
| ROPA | `/api/v1/ropa` |
| Scores | `/api/v1/scores` |
| Gaps | `/api/v1/gaps` |
| Actions | `/api/v1/actions` |
| Dashboards | `/api/v1/dashboard` |
| Reports | `/api/v1/reports` |
| AI | `/api/v1/ai` |
| Audit | `/api/v1/audit-logs` |
| Admin | `/api/v1/admin` |

---

## Standard API Response Format

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-09-07T12:30:00Z"
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Maturity score must be between 0 and 5.",
    "details": [
      { "field": "maturityScoreClaimed", "issue": "Value must be between 0 and 5" }
    ]
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-09-07T12:30:00Z"
  }
}
```

---

## Core API Endpoints

### Auth APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/auth/me` | Current logged-in user. |
| GET | `/auth/me/organizations` | Organisations available to user. |
| POST | `/auth/switch-organization` | Set active organisation. |
| GET | `/auth/me/permissions` | Current permissions. |

### Organisation APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/organizations` | Register organisation. |
| GET | `/organizations/{organizationId}` | Get profile. |
| PATCH | `/organizations/{organizationId}` | Update profile. |
| POST | `/organizations/{organizationId}/users/invite` | Invite user. |
| GET | `/organizations/{organizationId}/users` | List users. |

### Scope APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/industries` | List supported industries. |
| POST | `/organizations/{organizationId}/scope` | Save scope wizard. |
| GET | `/organizations/{organizationId}/scope` | Fetch scope. |
| POST | `/organizations/{organizationId}/scope/preview-assessment` | Preview applicable questions. |

### Assessment APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/organizations/{organizationId}/assessments` | Create assessment. |
| GET | `/organizations/{organizationId}/assessments` | List assessments. |
| GET | `/assessments/{assessmentId}` | Get detail. |
| POST | `/assessments/{assessmentId}/generate-questions` | Generate question set. |
| GET | `/assessments/{assessmentId}/questions` | List questions. |
| POST | `/assessments/{assessmentId}/submit` | Submit assessment. |
| POST | `/assessments/{assessmentId}/finalise` | Finalise assessment. |
| POST | `/assessments/{assessmentId}/clone-reassessment` | Create reassessment. |

### Response APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/assessments/{assessmentId}/responses` | List responses. |
| POST | `/assessments/{assessmentId}/responses` | Save response. |
| PATCH | `/responses/{responseId}` | Update response. |
| POST | `/responses/{responseId}/submit` | Submit for review. |
| POST | `/responses/{responseId}/review` | Review response. |

### Evidence APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/evidence/upload-url` | Generate signed upload URL. |
| POST | `/evidence/confirm-upload` | Confirm upload. |
| GET | `/organizations/{organizationId}/evidence` | List evidence. |
| POST | `/evidence/{evidenceId}/link` | Link evidence. |
| POST | `/evidence/{evidenceId}/review` | Review evidence. |
| GET | `/evidence/{evidenceId}/download-url` | Generate signed download URL. |

### ROPA APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/organizations/{organizationId}/ropa` | Create ROPA. |
| GET | `/organizations/{organizationId}/ropa` | List ROPA. |
| GET | `/ropa/{ropaId}` | Get ROPA detail. |
| PATCH | `/ropa/{ropaId}` | Update ROPA. |
| DELETE | `/ropa/{ropaId}` | Archive ROPA. |
| POST | `/ropa/import` | Import Excel. |
| GET | `/ropa/export` | Export Excel/CSV. |
| GET | `/ropa/{ropaId}/completeness` | Completeness score. |

### Scoring APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/assessments/{assessmentId}/scores/calculate` | Calculate score. |
| GET | `/assessments/{assessmentId}/scores` | Latest score. |
| GET | `/assessments/{assessmentId}/domain-scores` | Domain scorecard. |
| GET | `/assessments/{assessmentId}/red-flags` | Red flags. |
| POST | `/assessments/{assessmentId}/scores/finalise` | Store final snapshot. |

### Gap and Action APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/assessments/{assessmentId}/gaps/generate` | Generate gaps. |
| GET | `/assessments/{assessmentId}/gaps` | List gaps. |
| PATCH | `/gaps/{gapId}` | Update gap. |
| POST | `/gaps/{gapId}/close` | Close gap. |
| POST | `/assessments/{assessmentId}/actions/generate` | Generate actions. |
| GET | `/assessments/{assessmentId}/actions` | List actions. |
| PATCH | `/actions/{actionId}` | Update action. |
| POST | `/actions/{actionId}/close` | Close action. |

### Dashboard APIs

| Endpoint | Purpose |
|---|---|
| `/dashboard/executive/{organizationId}` | Executive dashboard. |
| `/dashboard/assessment/{assessmentId}` | Assessment dashboard. |
| `/dashboard/domains/{assessmentId}` | Domain scorecard. |
| `/dashboard/evidence/{assessmentId}` | Evidence confidence. |
| `/dashboard/ropa/{organizationId}` | ROPA dashboard. |
| `/dashboard/gaps/{assessmentId}` | Gap dashboard. |
| `/dashboard/actions/{assessmentId}` | Action dashboard. |
| `/dashboard/vendors/{organizationId}` | Vendor dashboard. |
| `/dashboard/breach/{assessmentId}` | Breach readiness. |
| `/dashboard/ai-risk/{assessmentId}` | AI/privacy risk. |
| `/dashboard/reassessment/{assessmentId}` | Reassessment trend. |

### Report APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/assessments/{assessmentId}/reports` | Generate report. |
| GET | `/assessments/{assessmentId}/reports` | List reports. |
| GET | `/reports/{reportId}` | Metadata. |
| GET | `/reports/{reportId}/download-url` | Signed download. |
| POST | `/reports/{reportId}/regenerate` | New version. |

### AI APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/ai/explain-question` | Explain question. |
| POST | `/ai/suggest-evidence` | Suggest evidence. |
| POST | `/ai/draft-response` | Draft response. |
| POST | `/ai/draft-ropa` | Draft ROPA. |
| POST | `/ai/explain-gap` | Explain gap. |
| POST | `/ai/recommend-actions` | Suggest actions. |
| POST | `/ai/draft-report-section` | Draft report text. |
| POST | `/ai/explain-score` | Explain score. |
| POST | `/ai/reassessment-summary` | Explain reassessment. |

---

## API Error Codes

| Code | Meaning |
|---|---|
| `UNAUTHENTICATED` | User not logged in. |
| `FORBIDDEN` | Permission missing. |
| `TENANT_ACCESS_DENIED` | User cannot access organisation. |
| `VALIDATION_ERROR` | Invalid payload. |
| `NOT_FOUND` | Entity not found. |
| `ASSESSMENT_LOCKED` | Finalised assessment cannot be edited. |
| `EVIDENCE_REQUIRED` | Evidence required for high score. |
| `DOMAIN_WEIGHT_TOTAL_INVALID` | Domain weights do not total 100. |
| `REPORT_GENERATION_FAILED` | Report job failed. |
| `AI_CONTEXT_NOT_AVAILABLE` | AI lacks safe context. |
| `LEGAL_REVIEW_REQUIRED` | Human legal review needed. |

---

## API Permissions Matrix

| API group | Super Admin | Consultant | Org Admin | DPDP Owner | Dept Owner | Executive | Auditor |
|---|---|---|---|---|---|---|---|
| Organisations | Full | Assigned | Own org | Read | Limited | Read | Read |
| Users | Full | Limited | Manage org | Limited | No | No | No |
| Questions/admin | Full | Read | Read | Read | Read | Read | Read |
| Assessments | Full | Assigned | Full | Full | Assigned | Read | Read |
| Responses | Full | Assigned | Full | Full | Assigned | Read | Read |
| Evidence | Full | Assigned | Full | Full | Assigned | Read | Read |
| ROPA | Full | Assigned | Full | Full | Assigned | Read | Read |
| Scores | Full | Assigned | Full | Full | Read | Read | Read |
| Gaps/actions | Full | Assigned | Full | Full | Assigned | Read | Read |
| Reports | Full | Assigned | Full | Full | Limited | Read/download | Read/download |
| AI Assistant | Full | Assigned | Full | Full | Assigned | Read-only | Limited |
| Audit logs | Full | Assigned | Org-level | Org-level | Own actions | Summary | Read |

---

## API Design Summary

| Area | Decision |
|---|---|
| API style | REST |
| Version | `/api/v1` |
| Documentation | OpenAPI / Swagger |
| Authentication | JWT/session-based |
| Authorisation | Tenant-aware RBAC |
| Uploads | Signed URLs |
| Scoring | Dedicated scoring APIs |
| ROPA | Dedicated ROPA APIs |
| Reports | Async report-generation APIs |
| AI | Backend AI Gateway APIs |
| Audit | Organisation and platform audit logs |
| Future integration | API keys and webhooks |

