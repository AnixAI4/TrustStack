# P3 — M25: DPDP Public API
## REST API for third-party integrations — v1 endpoints with API key auth

**Session:** P3 — M25  
**Phase:** P3 — Scale  
**Priority:** MEDIUM — enables B2B2C, consulting resellers, and developer integrations  
**Estimated time:** 1 session (~2.5 hours)  
**Branch:** `feature/p3-m25-dpdp-api`  
**Tag after completion:** `v3.6.0`  
**Prerequisites:** M2 (Consent), M5 (DSR), M8 (Breach) live; M12 (Billing) for rate limits

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

A public REST API that third parties (CRM vendors, HR software, developer partners) can use to integrate TrustStack™ compliance into their own applications. Authentication is API key based (`ts_live_xxx`).

---

## Database Schema

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                       -- User-defined name: "Production Key", "CRM Integration"
  key_prefix TEXT NOT NULL,                 -- 'ts_live_' or 'ts_test_'
  key_hash TEXT NOT NULL,                   -- SHA-256 hash of the full key — NEVER store key plaintext
  scopes TEXT[] NOT NULL DEFAULT '{}',      -- ['consent:read', 'consent:write', 'dsr:write', 'score:read']
  rate_limit_per_min INTEGER NOT NULL DEFAULT 10,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

CREATE TABLE api_request_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admins_manage_api_keys" ON api_keys
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );
```

---

## API Key Generation

```typescript
// src/lib/api-keys/generate.ts
import { randomBytes, createHash } from 'crypto';

export function generateApiKey(isTest = false): { key: string; hash: string; prefix: string } {
  const prefix = isTest ? 'ts_test_' : 'ts_live_';
  const random = randomBytes(32).toString('hex');
  const key = `${prefix}${random}`;
  const hash = createHash('sha256').update(key).digest('hex');
  return { key, hash, prefix };
}

// Show the full key ONLY ONCE at creation time. After that, only the hash is stored.
```

---

## API Authentication Middleware

```typescript
// src/lib/api-keys/authenticate.ts
export async function authenticateApiKey(req: NextRequest): Promise<{ org: Organization; apiKey: ApiKey; scopes: string[] } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ts_')) return null;
  
  const key = authHeader.replace('Bearer ', '');
  const hash = createHash('sha256').update(key).digest('hex');
  
  const { data: apiKey } = await adminSupabase
    .from('api_keys')
    .select('*, organizations(*)')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single();
  
  if (!apiKey) return null;
  
  // Update last_used_at
  await adminSupabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id);
  
  return { org: apiKey.organizations, apiKey, scopes: apiKey.scopes };
}
```

---

## V1 API Endpoints

All endpoints at `/api/v1/*`. Require `Authorization: Bearer ts_live_xxx` header.

### GET `/api/v1/consent/{data_principal_id}`
**Scope:** `consent:read`  
**Returns:** Consent status for a data principal by email or phone

```json
{
  "data_principal_id": "sarah@example.com",
  "consent_records": [
    {
      "consent_config_id": "uuid",
      "purpose": "Marketing",
      "status": "active",
      "consented_at": "2026-06-20T10:00:00Z",
      "expires_at": "2027-06-20T10:00:00Z"
    }
  ]
}
```

### POST `/api/v1/consent/record`
**Scope:** `consent:write`  
**Body:** `{ data_principal_id, purpose, consent_config_id, channel, ip_address? }`  
**Returns:** Created consent record ID + reference number

### POST `/api/v1/dsr`
**Scope:** `dsr:write`  
**Body:** `{ email, dsr_type, description, data_principal_name? }`  
**Returns:** Created DSR reference number

### GET `/api/v1/compliance-score`
**Scope:** `score:read`  
**Returns:** Organization's current Compass Score + maturity level

### POST `/api/v1/breach/notify`
**Scope:** `breach:write`  
**Body:** `{ description, affected_data_types, estimated_records, discovered_at }`  
**Returns:** Created breach incident ID + 72-hour DPBI deadline

---

## Rate Limiting

Use `api_request_log` for sliding window rate limiting:

```typescript
// src/lib/api-keys/rate-limit.ts
export async function checkRateLimit(apiKeyId: string, limitPerMin: number): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await adminSupabase
    .from('api_request_log')
    .select('id', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('created_at', oneMinuteAgo);
  
  return (count ?? 0) < limitPerMin;
}
```

Rate limit response (HTTP 429):
```json
{ "error": "rate_limit_exceeded", "retry_after_seconds": 60 }
```

---

## API Key Management UI

In `/dashboard/settings` — add "API Keys" tab:

```
API Keys                                         [+ Create Key]
─────────────────────────────────────────────────────────────────
Production Key       ts_live_...xxxx   Created Jun 26   [Revoke]
  Scopes: consent:read, consent:write, dsr:write
  Last used: 2 hours ago   Rate limit: 100 req/min

Test Key             ts_test_...xxxx   Created Jun 26   [Revoke]
  Scopes: consent:read
  Last used: Never   Rate limit: 10 req/min

─────────────────────────────────────────────────────────────────
[View API Documentation →]   ← Links to /api/docs
```

**Create Key Modal:**
- Name
- Environment: Production / Test
- Scopes (multiselect): consent:read, consent:write, dsr:write, breach:write, score:read
- After creation: Show full key ONCE with copy button + "Save this key — it won't be shown again"

---

## API Documentation: `/api/docs`

OpenAPI 3.0 spec auto-served at `/api/v1/openapi.json`. Swagger UI at `/api/docs`.

```typescript
// src/app/api/v1/openapi.json/route.ts
export async function GET() {
  return NextResponse.json(openApiSpec); // Static JSON — no auth needed
}
```

Use `swagger-ui-react` or link to `https://petstore.swagger.io/?url=https://truststack.in/api/v1/openapi.json` for V1 (no npm package needed).

---

## Testing

1. Create Production API key in settings → key shown once → copy it
2. `curl -H "Authorization: Bearer ts_live_xxx" https://localhost:3011/api/v1/compliance-score` → returns Compass Score
3. Record consent via API: `POST /api/v1/consent/record` → consent_records entry created
4. Submit DSR via API: `POST /api/v1/dsr` → DSR appears in dashboard
5. Rate limit: send 11 requests in 60 seconds → 11th returns 429
6. Revoke key → same key returns 401
7. Wrong scope: use consent:read key to POST /api/v1/dsr → 403
8. `/api/docs` → Swagger UI loads
9. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M25 DPDP API ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M25 section (API key auth pattern, all v1 endpoints)
3. Update `tracker-data.json` — M25 status → "built"; phases.P3.status → "complete"
4. Apply SQL: api_keys + api_request_log tables
5. Git commit + push + PR + merge + tag `v3.6.0`

**P3 Scale Phase is complete. Next: P4 Innovation begins with M26 AI Governance.**
