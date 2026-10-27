# P2 — M16: Aadhaar OTP Verification
## Verify data principal identity via Aadhaar before processing sensitive DSR requests

**Session:** P2 — M16  
**Phase:** P2 — Commercialization  
**Priority:** MEDIUM — needed for high-value B2C orgs (banking, healthcare, insurance)  
**Estimated time:** 1 session (~2 hours)  
**Branch:** `feature/p2-m16-aadhaar-otp`  
**Tag after completion:** `v2.6.0`  
**Prerequisites:** M5 DSR Management live

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

An optional Aadhaar OTP verification layer that organizations can require before processing sensitive DSR requests (right to deletion, right to access). Verifies the data principal's identity via UIDAI's API before the request is accepted.

**Important:** This is feature-flagged per org. If the org doesn't enable it (or if Aadhaar API is unavailable), the system falls back gracefully to standard email OTP (already in M5).

---

## Architecture

```
Data Principal → DSR Form → Aadhaar OTP Step → UIDAI eKYC API
                                    ↓
                            OTP sent to registered mobile
                                    ↓
                         Data principal enters OTP
                                    ↓
                         UIDAI verifies → TrustStack™ records
                                    ↓
                            DSR request accepted
```

**Provider:** UIDAI eKYC API via a licensed Technology Service Provider (TSP).
- Recommended TSP for testing: use mock/sandbox from TSPs like Perfios, Signzy, or IDfy
- Production: Requires org to be a registered requesting entity with UIDAI or use TSP's KYC product

---

## Database Schema

```sql
CREATE TABLE aadhaar_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  request_id TEXT NOT NULL,                  -- TSP/UIDAI request ID
  masked_aadhaar TEXT NOT NULL,             -- Last 4 digits only: XXXX-XXXX-XXXXXXXX-1234
  phone_masked TEXT,                        -- Last 2 digits only: XXXXXXX89
  verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'verified' | 'failed' | 'expired'
  failure_reason TEXT,
  dsr_request_id UUID REFERENCES dsr_requests(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes')
);

ALTER TABLE aadhaar_verifications ENABLE ROW LEVEL SECURITY;

-- Only the org admin/DPO can view verifications (NEVER expose Aadhaar numbers)
CREATE POLICY "org_admins_view_verifications" ON aadhaar_verifications
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'dpo')
    )
  );

-- Feature flag on organizations:
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS aadhaar_verification_enabled BOOLEAN NOT NULL DEFAULT FALSE;
```

---

## API Routes

### POST `/api/dsr/verify-aadhaar/initiate` (PUBLIC — no auth)
**Body:** `{ aadhaar_number: string, consent_to_verify: boolean, org_slug: string }`

```typescript
// 1. Validate: aadhaar_number is 12 digits
// 2. Check feature flag: org.aadhaar_verification_enabled = true
// 3. Call TSP API: initiate OTP generation to registered mobile
//    POST https://tsp-api.example.com/kyc/init { aadhaar: aadhaar_number, ... }
//    → returns { requestId, maskedPhone }
// 4. Store aadhaar_verifications record (status: 'pending')
// 5. Return: { verification_id, masked_phone: 'XXXXXXX89' }
// NEVER log or return the full Aadhaar number
```

### POST `/api/dsr/verify-aadhaar/confirm` (PUBLIC — no auth)
**Body:** `{ verification_id: string, otp: string }`

```typescript
// 1. Find verification record by id, check not expired
// 2. Call TSP API: submit OTP for verification
//    POST https://tsp-api.example.com/kyc/verify { requestId, otp }
//    → returns { verified: boolean, eKYCData: { name, maskedAadhaar } }
// 3. If verified: update aadhaar_verifications.status = 'verified', verified_at = now
// 4. Return: { verified: true, name: data.name } (NEVER return Aadhaar number)
// 5. If failed: update status = 'failed', failure_reason = error message
//    Return: { verified: false, error: 'Invalid OTP. 2 attempts remaining.' }
```

---

## DSR Form Integration

Update the public DSR form (`/public/dsr/[slug]/page.tsx`):

**If org.aadhaar_verification_enabled = true:** Show Aadhaar OTP step BEFORE accepting DSR.

```
Step 1 of 3: Verify Your Identity

We require Aadhaar OTP verification to process your data request.

Aadhaar Number: [____] [____] [____]
                (12-digit number on your Aadhaar card)

[x] I consent to Aadhaar-based identity verification for this request.

[Send OTP →]

────────────────────────────────────────────
Alternatively: [Use Email OTP instead →]
```

After OTP verified → proceed to DSR form (Step 2) with `verification_id` attached.

**If org.aadhaar_verification_enabled = false (default):** Skip Aadhaar step entirely, go straight to DSR form with email OTP (existing M5 flow).

---

## Admin: Aadhaar Settings

In `/dashboard/settings`:

```
Identity Verification
─────────────────────────────────────────────────────────────────
☐ Require Aadhaar OTP for DSR requests

When enabled, data principals must verify their identity via 
Aadhaar OTP before DSR requests are accepted.

Note: Requires TSP API credentials. Leave disabled to use 
standard email OTP verification (DPDP-compliant).

TSP Configuration (shown only if enabled):
TSP Provider: [Dropdown: Perfios / Signzy / IDfy / Custom]
API Endpoint: _______________________
API Key: _______________________   [Save — stored encrypted]
```

---

## Graceful Fallback

If Aadhaar API returns an error (TSP downtime, UIDAI maintenance):
1. Log the error to Supabase
2. Show user: "Aadhaar verification is temporarily unavailable. Please use email OTP instead."
3. Auto-switch to email OTP flow

**This ensures no DSR requests are permanently blocked due to TSP downtime.**

---

## Privacy Constraints

- **NEVER log the full Aadhaar number** — not in DB, not in logs, not in API responses
- Store only: `masked_aadhaar` (e.g., `XXXX-XXXX-XXXX-1234`)
- Verification records auto-expire after 15 minutes
- eKYC data (name, DOB) returned from UIDAI: use only name, discard rest
- Do NOT store biometric data of any kind

---

## Environment Variables

```bash
AADHAAR_TSP_PROVIDER=perfios        # or 'signzy' | 'idfy' | 'custom'
AADHAAR_TSP_API_URL=https://...     # TSP sandbox URL for dev
AADHAAR_TSP_API_KEY=...             # Encrypted in Supabase, not here
```

---

## Testing

1. Enable Aadhaar verification for org in settings
2. DSR public form → Aadhaar OTP step appears first
3. Enter test Aadhaar number (TSP sandbox provides test numbers)
4. [Send OTP] → "OTP sent to your registered mobile (XXXXXXX89)"
5. Enter correct OTP → verified → proceed to DSR form
6. Enter wrong OTP → error message → can retry up to 3 times
7. After 3 failures → "Maximum attempts reached. Use email OTP instead."
8. Disable Aadhaar verification → DSR form goes back to email OTP only
9. TSP API down → graceful fallback message + email OTP option
10. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M16 Aadhaar OTP ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M16 section
3. Update `tracker-data.json` — M16 status → "built"
4. Apply SQL: aadhaar_verifications table + organizations column
5. Git commit + push + PR + merge + tag `v2.6.0`
