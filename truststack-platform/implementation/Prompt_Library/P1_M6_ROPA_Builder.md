# SESSION PROMPT — P1 M6: ROPA Builder
## TrustStack™ Platform — Phase 1, Module 6

---

## STEP 1 — READ THESE FILES FIRST

```
implementation/MASTER_CONTEXT.md
implementation/progress.md
```

---

## ⚠️ IMPLEMENTATION NOTES — read before building (synced after Session 7 / M7)

All Phase 0 modules + M5 (DSR) + M7 (Vendor DPA) are complete — see `progress.md`. M6 ROPA is structurally another CRUD + status + dashboard module with an AI-assist and an export, so reuse the existing patterns heavily. **M7 Vendor DPA is the freshest, closest twin — mirror it file-for-file.**

**1. Dashboard pages go in the PLAIN `src/app/dashboard/ropa/` folder — NOT a `(dashboard)` route group.** A route group adds no `/dashboard` URL segment, so pages land at `/ropa` and bypass the auth middleware that protects `/dashboard/*`. This exact bug was caught in M2/M3/M5/M7 — don't repeat it. **ROPA has NO public routes** (it's an internal inventory), so do NOT touch `src/middleware.ts` / `PUBLIC_API_ROUTES`.

**2. Reuse M7 (Vendor) and M5 (DSR) — they are the closest twins.** A CRUD entity → list/filter/search → status workflow (draft/active/archived) → DPO approval mirrors the vendor DPA lifecycle. Mirror these files:
- Components: `src/components/modules/vendors/` — `VendorStatusBadge` → `RopaStatusBadge` (draft/active/archived), `VendorsTable` → `RopaTable`, `VendorDetail` → `RopaEntryDetail`, `VendorFormModal` → `RopaEntryForm`, `VendorLibraryPicker` → `RopaTemplatePicker` (note 4).
- Auth API shape: `src/app/api/vendors/route.ts` (GET list/filter/search/paginate + POST create), `.../vendors/[id]/route.ts` (GET+PATCH+DELETE), `.../vendors/stats/route.ts` → make `/api/ropa`, `/api/ropa/[id]`, `/api/ropa/stats`.
- Dashboard pages: `src/app/dashboard/vendors/page.tsx` (home + stats + 30s refresh), `.../vendors/list/page.tsx` (list + filters), `.../vendors/[id]/page.tsx` (detail) → make the `ropa/` equivalents.

**3. AI-assisted entry → keep the prompt builder in a CLIENT-SAFE lib** (`src/lib/ropa/ai.ts`, no SDK import) and the `@anthropic-ai/sdk` call in the route (`POST /api/ropa/ai-suggest`) — mirror `src/lib/vendors/dpa.ts` + `src/app/api/vendors/[id]/dpa/route.ts` (and `src/lib/dsr/draft.ts`). Model **`claude-sonnet-4-6`**. **Return STRUCTURED JSON** (the ROPA fields) so the form can pre-fill — instruct Claude to output ONLY a JSON object, then parse it **defensively** in the route (try/catch, validate keys/enums, ignore unknown fields). The Vercel `ai` SDK was removed — use `@anthropic-ai/sdk` directly (same call shape as `src/app/api/chat/route.ts`).

**4. Industry templates → seed as a LIBRARY constant; let each org add what it uses** (do NOT bulk-insert into every org). Put `ROPA_INDUSTRY_TEMPLATES` in `src/lib/constants.ts` keyed by industry (at least fintech / healthtech / edtech / ecommerce / hrtech), each a list of pre-filled processing activities (`activity_name`, `data_categories`, `data_subject_types`, `processing_purposes`, `legal_basis`, `retention_period`, …). Normalize `bfsi → fintech` and fall back to a sensible default — copy the exact pattern of `getIndustryPurposes()` / `INDUSTRY_PURPOSES` (M3). Read the org's industry from `GET /api/organizations/me`. Offer an "Add from template" picker mirroring M7's `VendorLibraryPicker` (inserts the chosen activities as `ropa_entries` for the current org).

**5. Reuse existing domain vocab — don't invent new constants.** `legal_basis` → `DPDP_BASES`. `data_categories` → `DATA_CATEGORIES` (+ `DATA_CATEGORY_GROUPS`, from M3). `processing_purposes` → align with `INDUSTRY_PURPOSES` / `DEFAULT_PURPOSE_SUGGESTIONS`. `processor_names` → optionally pre-fill from the org's M7 `vendors` rows (a nice cross-link). Add `ROPA_SUBJECT_TYPES` (`customers` | `employees` | `children` | `vendors` | `website_visitors`) and `ROPA_STATUS_LABELS` to constants.

**6. ROPA ↔ Consent cross-reference is a READ-TIME join, not a stored column.** For each entry, check whether a matching `consent_purposes` row exists for the org (M2 table) — match on processing purpose / data category — and surface a "Consent configured ✓ / missing" badge. Do it in the detail/list API (auth server client) or a small `/api/ropa/consent-coverage` helper. Don't add a DB column for it.

**7. DPO approval = the logged-in user acts as DPO; capture the approver SERVER-SIDE.** `PATCH /api/ropa/[id]` flips `dpo_approved=true`, stamps `dpo_approved_at=now()`, and sets `status='active'` in one action; set `created_by`/approver from `auth.getUser()` server-side, never from the client (mirror M3's server-side officer capture). There is no separate DPO entity — the M4 Grievance Officer is the §14 contact, but ROPA approval is performed by the authenticated dashboard user. Validate the draft→active→archived transitions in the PATCH handler.

**8. Export — PDF via `@react-pdf/renderer` (already installed); "Excel" via dependency-free CSV.** For the DPDP-format PDF, mirror `src/components/modules/board/BoardReportPDF.tsx` + `renderBoardReportPdf()` and the `POST /api/dashboard/report/pdf` route (`runtime='nodejs'`; `serverExternalPackages: ['@react-pdf/renderer']` is already in `next.config.ts`). For the auditor "Excel" export, generate **CSV** (opens in Excel) in the route/client — **do NOT add an xlsx library** (none is installed; keep `npm audit` at 0). A multi-row ROPA table is a clean fit for both. (A `window.print()` HTML export, like M3, is also acceptable for the PDF if you prefer no react-pdf.)

**9. New table → save as `db/ropa.sql` and run MANUALLY in the Supabase SQL Editor.** Write it in the **idempotent** style of `db/vendors.sql` (`create table if not exists`, `drop policy if exists` before each `create policy`). The Step-3 RLS pattern is correct as written (the policy queries `organization_members` from `ropa_entries` — the recursion trap only applies to policies ON `organization_members` itself). Add `organization_id`-scoped indexes (org+status, org+created_at desc). **No per-org sequential reference number here, so the M4/M5 global-unique pitfall does not apply.**

**10. Activate the sidebar entry.** Flip the `ropa` entry in `SIDEBAR_MODULES` (`src/lib/constants.ts`) to `available: true`. The `Database` icon is already registered in `Sidebar.tsx`.

**11. Types → add to `src/types/dpdp.ts`:** `RopaEntry` (the DB row), `RopaStatus` (`'draft' | 'active' | 'archived'`), `RopaSubjectType`, `RopaStats`, and the AI-suggest response shape. Keep DB-row types here; keep template/structural types co-located in the lib (as M7's questionnaire types are).

**12. Dev server runs on port 3011** (`npm run dev -- --port 3011`); Docker holds 3000. Do **NOT** run `next build` while `next dev` is running (shared `.next/` corrupts the dev manifest). Lint isn't configured — verify with `npm run type-check` + dev route checks (auth routes → 401, `/dashboard/ropa` → 307→login). Keep `npm audit` at **0**.

**13. The M9 board reads M1–M4 only — it will NOT auto-show M6.** Lighting up M6 (and the still-pending M5/M7 tiles) on the board (`src/lib/dashboard/aggregate.ts` + `src/components/modules/board/ModuleStatusGrid.tsx`) is an optional follow-up, out of M6 scope.

**Stack baseline (end of Session 7):** Next `15.5.19`, React 19, `@anthropic-ai/sdk 0.36.3` (model `claude-sonnet-4-6`), `@react-pdf/renderer 4.5.1`, Resend `6.14.0`, `npm audit` = 0. M6 should add **no** new dependencies (CSV export is hand-rolled).

---

## WHAT THIS MODULE BUILDS

Record of Processing Activities (ROPA) — the central inventory of all personal data processing activities. Required under DPDP best practices and essential for DPBI audits.

---

## SUPABASE SQL

```sql
CREATE TABLE ropa_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  activity_description TEXT,
  data_controller_name TEXT NOT NULL,
  data_categories TEXT[] NOT NULL,
  data_subject_types TEXT[] NOT NULL,       -- 'customers' | 'employees' | 'children' | 'vendors' | 'website_visitors'
  processing_purposes TEXT[] NOT NULL,
  legal_basis TEXT NOT NULL,                -- from DPDP_BASES constants
  data_sources TEXT[],
  recipients TEXT[],
  cross_border_transfer BOOLEAN DEFAULT FALSE,
  transfer_countries TEXT[],
  retention_period TEXT,
  security_measures TEXT[],
  processor_names TEXT[],
  dpo_approved BOOLEAN DEFAULT FALSE,
  dpo_approved_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',    -- 'draft' | 'active' | 'archived'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ropa_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage ropa" ON ropa_entries FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
```

---

## KEY FEATURES

1. **Industry-template pre-population** — When user sets up ROPA, pre-populate common processing activities for their sector (Fintech: KYC, payments, fraud detection; EdTech: enrollment, learning analytics; etc.)
2. **AI-assisted entry** — "Describe what you do with this data" → Claude suggests structured ROPA fields
3. **ROPA ↔ Consent cross-reference** — Each entry shows whether a consent purpose exists for it
4. **DPO Approval Workflow** — Entries need DPO sign-off before becoming active
5. **Export** — PDF export in DPDP-compliant format; Excel for auditors
6. **Status tracking** — Draft → Active → Archived

## ACCEPTANCE CRITERIA

- [ ] Industry templates pre-populate ROPA on first setup
- [ ] Claude API assists in filling ROPA from natural language description
- [ ] Cross-reference check shows which ROPA entries have consent configured
- [ ] DPO can approve entries with one click
- [ ] Export to PDF works
- [ ] RLS enforced
