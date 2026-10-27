# SESSION PROMPT — P1 M5: DSR Management
## TrustStack™ Platform — Phase 1, Module 5

---

## STEP 1 — READ THESE FILES FIRST

```
implementation/MASTER_CONTEXT.md
implementation/progress.md
```

All Phase 0 modules must be complete before starting Phase 1. **They are** (M1, M1b, M2, M3, M4, M9, M10 ✅ — see progress.md).

---

## ⚠️ IMPLEMENTATION NOTES — read before building (synced after Session 5 / M9)

**1. Dashboard pages go in the PLAIN `src/app/dashboard/dsr/` folder — NOT a `(dashboard)` route group.** A `(dashboard)` route group adds no `/dashboard` URL segment, so pages land at `/dsr` and bypass the auth middleware that protects `/dashboard/*`. This exact bug was caught in M2, M3 and M9 — don't repeat it. The public portal goes at `src/app/public/dsr/[slug]/` (the `/public/*` prefix is intentionally unauthenticated).

**2. DSR is structurally a twin of M4 Grievance — reuse it heavily.** Public submission → `DSR-YYYY-NNN` reference → DPO dashboard → status workflow → email. Mirror these existing files:
- Components: `src/components/modules/grievance/` — `ComplaintStatusBadge`, `ComplaintsTable`, `ComplaintDetail`, `PublicComplaintForm` → make `dsr/` equivalents.
- API shape: `src/app/api/grievance/` — `submit/route.ts` (public POST, generates `GRV-YYYY-NNN`, Resend email), `complaints/route.ts` (auth GET, filter/search/paginate), `complaints/[id]/route.ts` (auth GET+PATCH).
- Public page: `src/app/public/grievance/[slug]/page.tsx`.
- **Public submit uses the ADMIN client** (`@/lib/supabase/admin` → `createAdminClient()`) + CORS, since no user session exists (same pattern as M2/M4 public routes). The `WITH CHECK (true)` public-insert policy in Step 3 is belt-and-suspenders.

**3. Dev server runs on port 3011** (Docker holds 3000): `npm run dev -- --port 3011`. `NEXT_PUBLIC_APP_URL` is already `http://localhost:3011`. Do **NOT** run `next build` while `next dev` is running — they share `.next/` and the build corrupts the dev server's chunk manifest. Stop dev first if you need a production build.

**4. Stack changed in Session 5 — note before coding:**
- **Next.js is now `15.5.19`** (bumped from 15.1.0 for security). App Router patterns are unchanged (async `params`/`cookies` still apply).
- **The Vercel `ai` SDK was removed** (it was unused). For any AI use, call **`@anthropic-ai/sdk`** directly with model **`claude-sonnet-4-6`**, mirroring `src/app/api/chat/route.ts`. (M5 is mostly CRUD + SLA; Claude is optional — e.g. drafting an access-request summary or a denial rationale.)
- `npm audit` is currently **0 vulnerabilities** — keep it clean; don't run `npm audit fix --force`.

**5. Email OTP identity verification has NO existing infra — you'll build it.** Keep it simple and DPDP-acceptable: store a short-lived hashed OTP (a small `dsr_otps` table, or columns on `dsr_requests`), send via **Resend** from `noreply@anixai.io` (verified domain; key in `.env.local`), and gate the move out of `identity_pending` on a verified OTP. This is the one genuinely new capability in M5 — everything else mirrors M4.

**6. New tables need SQL run in Supabase manually.** Save the Step-3 SQL as `db/dsr_requests.sql` (the project keeps migrations in `db/` and runs them by hand in the Supabase SQL Editor — same as `db/privacy_notices.sql`, `db/consent_config_versions.sql`). RLS pattern is correct as written (policies query `organization_members` from the DSR tables — the recursion trap only applies to policies ON `organization_members` itself).

**7. Activate the sidebar entry.** Flip the `dsr` entry in `SIDEBAR_MODULES` (`src/lib/constants.ts`) to `available: true`. (A `reports` entry was added there in M9 — leave it; it uses the `FileBarChart` icon already registered in `Sidebar.tsx`.)

**8. The M9 board dashboard reads M1–M4 only — it will NOT auto-show live M5 status.** The board's "M5 DSR · Coming Soon" tile is hardcoded in `src/components/modules/board/ModuleStatusGrid.tsx`, and `src/lib/dashboard/aggregate.ts` aggregates M1–M4. Lighting up M5 on the board (extend `aggregate.ts` + the grid) is a small **optional** follow-up — out of M5 scope unless you choose to do it.

---

## STEP 2 — WHAT THIS MODULE BUILDS

Data Subject Rights (DSR) Management — supports all 7 DPDP rights:
1. Right to Access (Section 11)
2. Right to Correction (Section 12a)
3. Right to Completeness (Section 12b)
4. Right to Erasure (Section 12c)
5. Right to Restrict Processing (Section 13)
6. Right to Grievance Redressal (Section 14) — handled in M4, link here
7. Right to Nominate (Section 15) — DPDP-unique, no GDPR equivalent

---

## STEP 3 — SUPABASE SQL

```sql
CREATE TABLE dsr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reference_number TEXT UNIQUE NOT NULL,  -- DSR-2026-001
  right_type TEXT NOT NULL,               -- 'access' | 'correction' | 'completeness' | 'erasure' | 'restrict' | 'nominate'
  requestor_name TEXT NOT NULL,
  requestor_email TEXT,
  requestor_phone TEXT,
  requestor_identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_method TEXT,               -- 'email_otp' | 'sms_otp' | 'aadhaar' (future)
  request_details TEXT,
  affected_data_categories TEXT[],
  status TEXT NOT NULL DEFAULT 'received', -- 'received' | 'identity_pending' | 'processing' | 'fulfilled' | 'denied' | 'overdue'
  assigned_to UUID REFERENCES auth.users(id),
  fulfillment_notes TEXT,
  denial_reason TEXT,
  fulfilled_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,                   -- recommended 30 days from created_at
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- For nomination right (Section 15)
CREATE TABLE dsr_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  data_principal_hash TEXT NOT NULL,
  nominee_name TEXT NOT NULL,
  nominee_email TEXT NOT NULL,
  nominee_phone TEXT,
  relationship TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dsr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsr_nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage dsr_requests" ON dsr_requests FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Public can insert (DSR portal is public-facing)
CREATE POLICY "public can submit dsr" ON dsr_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "org members manage nominations" ON dsr_nominations FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
```

---

## KEY FEATURES TO BUILD

1. **Public DSR Submission Portal** — `/public/dsr/[org-slug]` — anyone can submit a request
2. **Identity Verification** — Email OTP before processing (especially for erasure)
3. **7 Rights Support** — Different form fields for each right type
4. **30-Day SLA Tracker** — Visual countdown, overdue alerts
5. **Manual Fulfillment Workflow** — DPO marks which systems were checked
6. **Nomination Right** — Special flow for Section 15 (no GDPR equivalent)
7. **Dashboard Management** — All requests, filtering, assignment, notes

## ACCEPTANCE CRITERIA

- [ ] Public DSR form works without auth
- [ ] All 7 right types selectable
- [ ] Identity verification via email OTP before processing
- [ ] Reference number generated (DSR-YYYY-NNN)
- [ ] 30-day due date auto-set and SLA countdown visible
- [ ] Overdue requests highlighted in dashboard
- [ ] Nomination right has its own form (nominator + nominee details)
- [ ] Email notification to DPO on new request
