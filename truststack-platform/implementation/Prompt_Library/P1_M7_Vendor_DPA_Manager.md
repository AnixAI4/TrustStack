# SESSION PROMPT — P1 M7: Vendor DPA Manager
## TrustStack™ Platform — Phase 1, Module 7

---

## STEP 1 — READ THESE FILES FIRST

```
implementation/MASTER_CONTEXT.md
implementation/progress.md
```

---

## ⚠️ IMPLEMENTATION NOTES — read before building (synced after Session 6 / M5)

All Phase 0 modules + M5 (first P1) are complete — see `progress.md`. M7 is structurally another CRUD + status + dashboard module, so reuse the existing patterns heavily.

**1. Dashboard pages go in the PLAIN `src/app/dashboard/vendors/` folder — NOT a `(dashboard)` route group.** A route group adds no `/dashboard` URL segment, so pages land at `/vendors` and bypass the auth middleware that protects `/dashboard/*`. This exact bug was caught in M2, M3, M9 and M5 — don't repeat it. The public vendor-questionnaire page goes under `src/app/public/...` (the `/public/*` prefix is intentionally unauthenticated).

**2. Reuse M5 (DSR) and M4 (Grievance) — they are the closest twins.** Vendor registry → risk questionnaire → DPA status workflow (pending/sent/signed/expired) → expiry alerts mirrors the DSR request lifecycle. Mirror these files:
- Components: `src/components/modules/dsr/` — `DsrStatusBadge`, `DsrRequestsTable`, `DsrRequestDetail`, `SlaIndicator` → make `vendors/` equivalents (`VendorStatusBadge` for `dpa_status`, `VendorsTable`, `VendorDetail`, a DPA-expiry indicator modeled on `SlaIndicator`).
- Auth API shape: `src/app/api/dsr/requests/route.ts` (list/filter/search/paginate), `.../requests/[id]/route.ts` (GET+PATCH), `.../stats/route.ts` (aggregate) → make `/api/vendors`, `/api/vendors/[id]`, `/api/vendors/stats`.
- Dashboard pages: `src/app/dashboard/dsr/page.tsx` (home + stats + 30s auto-refresh), `.../dsr/requests/page.tsx` (list + filters), `.../dsr/requests/[id]/page.tsx` (detail) → make the `vendors/` equivalents.

**3. Risk scoring → keep the logic in a CLIENT-SAFE lib** (`src/lib/vendors/risk.ts`, pure functions, no node deps) so both the dashboard UI and the API import it — mirror `src/lib/dsr/sla.ts`. Compute `risk_score` (0–100) + `risk_tier` (low/medium/high/critical) from the questionnaire answers. `src/lib/ai/compass-scorer.ts` is a reference for weighted scoring.

**4. DPA expiry alerts are DERIVED, not stored** — no cron, no auto-flip. Add client-safe helpers (`isExpiringSoon(dpa_expires_at, 30)` / `isExpired(...)`) like `isOverdue` in `src/lib/dsr/sla.ts`, and highlight expiring/expired DPAs at read time (the "30 days before expiry" acceptance criterion). `dpa_status='expired'` may still be set manually.

**5. Public vendor questionnaire (no vendor login) — use a SIGNED TOKEN + the admin client.** The vendor fills the questionnaire without an account:
- Public route + page, e.g. `src/app/public/vendor-questionnaire/[token]/page.tsx` + `POST /api/vendors/questionnaire/submit`.
- Use a **stateless HMAC-SHA256 signed token** (no table) embedding `{ vendor_id, org_id, expiry }` — copy `src/lib/dashboard/share-token.ts` (the M9 board share-link pattern).
- The token-verified GET + the public submit use the **ADMIN client** (`createAdminClient()`) + CORS + an `OPTIONS` handler — no vendor session exists (same pattern as M5/M2 public routes).
- Add the public route(s) to `PUBLIC_API_ROUTES` in `src/middleware.ts`.
- Email the link via **Resend** from `noreply@anixai.io` (dynamic import; mirror `sendOtpEmail` in `src/lib/dsr/otp.ts`).

**6. DPA template generation = Claude.** Use **`@anthropic-ai/sdk`** directly, model **`claude-sonnet-4-6`** (the Vercel `ai` SDK was removed). Keep the prompt builder in a **client-safe** lib (`src/lib/vendors/dpa.ts`, no SDK import) and the SDK call in the route (`POST /api/vendors/[id]/dpa`) — mirror `src/lib/dsr/draft.ts` + `src/app/api/dsr/draft/route.ts` (and `src/app/api/chat/route.ts`). `@react-pdf/renderer@4.5.1` is installed if you want a downloadable DPA PDF (mirror `src/components/modules/board/BoardReportPDF.tsx`); a Markdown/print export is also fine.

**7. New tables → save as `db/vendors.sql` and run MANUALLY in the Supabase SQL Editor.** Write it in the **idempotent** style of `db/dsr_requests.sql` (`create table if not exists`, `drop policy if exists` before each `create policy`). The Step-3 RLS pattern is correct as written (policies query `organization_members` from the vendor tables — the recursion trap only applies to policies ON `organization_members` itself).

**8. Per-org identifiers must be unique PER ORG, not globally.** This schema has no `reference_number`, but if you add any per-org sequential id, use a composite `unique (organization_id, ...)` — a global `UNIQUE` collides across orgs (the bug fixed in M5; M4 still has it). See the M5 key decisions in `progress.md`.

**9. Activate the sidebar entry.** Flip the `vendors` entry in `SIDEBAR_MODULES` (`src/lib/constants.ts`) to `available: true`. The `Building2` icon is already registered in `Sidebar.tsx`.

**10. Pre-assessed India vendors → seed as a LIBRARY constant; let each org add what they use** (do NOT bulk-insert into every org). Put `INDIA_VENDOR_PREASSESSMENTS` in `src/lib/constants.ts` and add an "Add from library" action that inserts the chosen vendor into the current org. ⚠️ The prompt says "20 vendors" but lists only **10** below — either expand to 20 or seed the 10 given and note the gap.

**11. The 45-question questionnaire cites `Company_Documents/09_Vanta analysis`, which may NOT be in this repo.** If you can't find it, define a sensible 45-question DPDP vendor questionnaire (Sections A–G: e.g. Company & Certifications, Data Handling, Security Controls, Sub-processors, Data Residency, Incident Response, DPDP-specific) in `src/lib/vendors/questionnaire.ts`, and give each question a risk weight the scorer (note 3) consumes.

**12. Dev server runs on port 3011** (`npm run dev -- --port 3011`); Docker holds 3000. Do **NOT** run `next build` while `next dev` is running (shared `.next/` corrupts the dev manifest). Lint isn't configured — verify with `npm run type-check` + dev route checks (auth routes → 401, public token route works, `/dashboard/vendors` → 307→login). Keep `npm audit` at **0**.

**13. The M9 board reads M1–M4 only — it will NOT auto-show M7.** Lighting up M7 on the board (`src/lib/dashboard/aggregate.ts` + `src/components/modules/board/ModuleStatusGrid.tsx`) is an optional follow-up, out of M7 scope.

**Stack baseline (end of Session 6):** Next `15.5.19`, React 19, `@anthropic-ai/sdk 0.36.3` (model `claude-sonnet-4-6`), `@react-pdf/renderer 4.5.1`, Resend `6.14.0`, `npm audit` = 0.

---

## WHAT THIS MODULE BUILDS

Vendor Data Processing Agreement (DPA) Manager — track all data processors, assess their DPDP compliance, generate DPA templates, and manage digital signing.

---

## SUPABASE SQL

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  vendor_type TEXT NOT NULL,               -- 'cloud' | 'payments' | 'analytics' | 'marketing' | 'crm' | 'hr' | 'communications' | 'other'
  data_location TEXT[],                    -- countries where data is stored
  india_data_residency BOOLEAN DEFAULT FALSE,
  personal_data_categories TEXT[],
  risk_tier TEXT,                          -- 'low' | 'medium' | 'high' | 'critical' (computed from questionnaire)
  risk_score INTEGER,                      -- 0-100 computed
  dpa_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'signed' | 'expired'
  dpa_signed_at TIMESTAMPTZ,
  dpa_expires_at TIMESTAMPTZ,
  dpa_document_url TEXT,
  questionnaire_completed BOOLEAN DEFAULT FALSE,
  questionnaire_completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_questionnaire_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage vendors" ON vendors FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members manage questionnaires" ON vendor_questionnaire_responses FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
```

---

## KEY FEATURES

1. **Vendor Registry** — Add/edit vendors, track DPA status
2. **45-Question DPDP Vendor Questionnaire** (from Company_Documents/09_Vanta analysis) — Sections A–G
3. **Automated Risk Scoring** — Low / Medium / High / Critical based on questionnaire
4. **DPA Template Generator** — Claude-generated DPA based on vendor type and risk level
5. **DPA Status Tracking** — Pending / Sent / Signed / Expired with 30-day expiry alerts
6. **Pre-Assessed India Vendors** — 20 common Indian SaaS vendors pre-rated at launch

## PRE-ASSESSED INDIA VENDORS (seed data)

```typescript
const INDIA_VENDOR_PREASSESSMENTS = [
  { name: 'Zoho CRM', type: 'crm', india_data_residency: true, risk_tier: 'low', notes: 'ISO 27001 certified, India DCs available' },
  { name: 'Freshdesk', type: 'crm', india_data_residency: true, risk_tier: 'low', notes: 'SOC 2 Type II, India region' },
  { name: 'Razorpay', type: 'payments', india_data_residency: true, risk_tier: 'medium', notes: 'PCI-DSS, RBI-regulated, India only' },
  { name: 'Paytm', type: 'payments', india_data_residency: true, risk_tier: 'medium', notes: 'RBI-regulated, no published ISO cert' },
  { name: 'CleverTap', type: 'analytics', india_data_residency: true, risk_tier: 'medium', notes: 'India DC available' },
  { name: 'Exotel', type: 'communications', india_data_residency: true, risk_tier: 'low', notes: 'India-only platform' },
  { name: 'AWS ap-south-1', type: 'cloud', india_data_residency: true, risk_tier: 'low', notes: 'ISO 27001, SOC 2, Mumbai region' },
  { name: 'Google Cloud (Mumbai)', type: 'cloud', india_data_residency: true, risk_tier: 'low', notes: 'ISO 27001, Mumbai PoP' },
  { name: 'Azure (Pune/Chennai)', type: 'cloud', india_data_residency: true, risk_tier: 'low', notes: 'ISO 27001, India regions' },
  { name: 'Tally Solutions', type: 'hr', india_data_residency: true, risk_tier: 'low', notes: 'India-based, financial data handling' },
]
```

## ACCEPTANCE CRITERIA

- [ ] Vendor can be added with type + data categories
- [ ] Questionnaire link can be sent to vendor (email with token)
- [ ] Risk score auto-computed from questionnaire responses
- [ ] DPA template generated by Claude based on vendor type
- [ ] DPA status tracked through signing workflow
- [ ] Pre-assessed India vendors available in library
- [ ] Expiry alerts shown on dashboard (30 days before DPA expires)
