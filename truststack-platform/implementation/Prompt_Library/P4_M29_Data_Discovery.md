# P4 — M29: Data Discovery (Automated PII Scanning)
## Scan connected systems to find where personal data lives

**Session:** P4 — M29  
**Phase:** P4 — Innovation  
**Priority:** HIGH (for enterprise) — answers "where is my data?" — prerequisite for real ROPA  
**Estimated time:** 2 sessions (~5 hours — complex scanner implementations)  
**Branch:** `feature/p4-m29-data-discovery`  
**Tag after completion:** `v4.4.0`  
**Prerequisites:** M24 DSR Connectors (reuses connector framework for data source access)

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

Automated PII scanning of connected data sources. TrustStack™ connects to databases, files, and SaaS apps and identifies where personal data lives — without storing any of the personal data itself (only metadata about where it was found).

---

## Architecture

```
Org connects data source (reuses M24 dsr_connectors)
         ↓
TrustStack™ Scanner reads metadata + samples data
         ↓
PII Pattern Detection (email, phone, Aadhaar, PAN, name)
         ↓
Discovery findings stored (field location + PII type + confidence)
         ↓
Suggested ROPA entries generated
         ↓
Shadow Processing Map (PII found without ROPA entry = risk)
```

**CRITICAL PRIVACY RULE:** The scanner reads sample rows to detect PII patterns but NEVER stores the actual PII values. Only stores: "Column `email` in table `customers` likely contains email addresses (95% confidence)."

---

## Database Schema

```sql
CREATE TABLE discovery_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES dsr_connectors(id),
  status TEXT NOT NULL DEFAULT 'queued',    -- 'queued' | 'running' | 'complete' | 'failed'
  tables_scanned INTEGER DEFAULT 0,
  columns_scanned INTEGER DEFAULT 0,
  findings_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discovery_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES discovery_scans(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  source_type TEXT NOT NULL,                -- 'database_table' | 's3_file' | 'saas_field'
  location TEXT NOT NULL,                   -- e.g., "customers.email_address" or "s3://bucket/customers.csv:column_2"
  field_name TEXT NOT NULL,
  pii_type TEXT NOT NULL,                   -- 'email' | 'phone' | 'aadhaar' | 'pan' | 'name' | 'dob' | 'address' | 'ip_address' | 'other'
  confidence_percent INTEGER NOT NULL,      -- 0–100
  sample_count INTEGER NOT NULL DEFAULT 0,  -- How many rows were sampled
  has_ropa_entry BOOLEAN NOT NULL DEFAULT FALSE,
  suggested_ropa_entry JSONB,              -- Pre-filled ROPA entry to create
  is_shadow_processing BOOLEAN NOT NULL DEFAULT FALSE,  -- PII found but no ROPA
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE discovery_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_findings ENABLE ROW LEVEL SECURITY;

-- Org-scoped RLS for both tables
```

---

## PII Detection Patterns

```typescript
// src/lib/discovery/pii-detector.ts
const PII_PATTERNS: Record<string, RegExp> = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^(\+91|91|0)?[6-9]\d{9}$/,
  aadhaar: /^\d{4}\s?\d{4}\s?\d{4}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  dob: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/,
  ip_address: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
};

const PII_COLUMN_NAMES: Record<string, string> = {
  email: 'email',
  mobile: 'phone',
  phone: 'phone',
  contact: 'phone',
  aadhaar: 'aadhaar',
  aadhar: 'aadhaar',
  pan: 'pan',
  panno: 'pan',
  name: 'name',
  fullname: 'name',
  firstname: 'name',
  lastname: 'name',
  dob: 'dob',
  dateofbirth: 'dob',
  address: 'address',
  ip: 'ip_address',
  ipaddress: 'ip_address',
};

export function detectPII(columnName: string, sampleValues: string[]): { piiType: string; confidence: number } | null {
  // 1. Column name match (high confidence)
  const colLower = columnName.toLowerCase().replace(/[_\s-]/g, '');
  if (PII_COLUMN_NAMES[colLower]) {
    return { piiType: PII_COLUMN_NAMES[colLower], confidence: 90 };
  }
  
  // 2. Pattern match on sample values
  for (const [piiType, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = sampleValues.filter(v => pattern.test(v));
    const confidence = Math.round((matches.length / sampleValues.length) * 100);
    if (confidence >= 60) return { piiType, confidence };
  }
  
  return null;
}
```

---

## Scanner Implementation (PostgreSQL/MySQL)

```typescript
// src/lib/discovery/scanners/postgres.scanner.ts
export async function scanPostgresDatabase(connectionString: string): AsyncGenerator<ScanFinding> {
  // 1. Connect with read-only credentials
  // 2. List all tables: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  // 3. For each table: get column names + types
  // 4. For each column that MIGHT have PII (text/varchar): sample 100 rows
  //    SELECT column_name FROM table LIMIT 100 (never ORDER BY RANDOM — too slow on large tables)
  // 5. Run detectPII on each column's sample
  // 6. Yield finding if PII detected
  // IMPORTANT: Discard sample values after detection — never store them
}
```

---

## API Routes

### POST `/api/discovery/scans` — Start a new scan
**Auth:** Admin or DPO  
**Body:** `{ connector_id: string }`

### GET `/api/discovery/scans` — List all scans
### GET `/api/discovery/scans/[id]` — Scan status + findings

### PATCH `/api/discovery/findings/[id]/acknowledge`
**Auth:** Admin or DPO  
**Action:** Acknowledge finding (usually after creating the ROPA entry)

### POST `/api/discovery/findings/[id]/create-ropa-entry`
**Auth:** Admin or DPO  
**Action:** Create ROPA entry from suggested_ropa_entry JSONB

---

## UI: `/dashboard/data-discovery`

```
Data Discovery                                   [+ Start New Scan]
─────────────────────────────────────────────────────────────────
Personal Data Map — Your organization

Shadow Processing (PII found without ROPA): 3 locations ⚠️
Documented in ROPA: 12 locations ✅

─────────────────────────────────────────────────────────────────
Recent Scan: "Salesforce CRM"   Jun 26, 2026
Completed: 47 tables | 283 columns | 8 PII findings

PII Found:
────────────────────────────────────────────────────────────────
customers.email_address        EMAIL    95%  ✅ In ROPA   
customers.mobile_number        PHONE    92%  ✅ In ROPA
customers.dob                  DOB      88%  ⚠️ No ROPA entry  [Create ROPA →]
orders.delivery_address        ADDRESS  75%  ⚠️ No ROPA entry  [Create ROPA →]
leads.aadhaar_number           AADHAAR  97%  🔴 CRITICAL: No ROPA + sensitive data  [Create ROPA →]

─────────────────────────────────────────────────────────────────
Data Sources: [Salesforce ✅]  [+ Add source to scan →]
```

---

## Testing

1. Connect PostgreSQL test database (with synthetic PII)
2. Start scan → status: running → tables listed
3. Scan completes → 5 findings shown
4. Email column → 95% confidence → marked as "email" PII type
5. Shadow processing: field not in ROPA → shown as ⚠️
6. [Create ROPA →] → pre-filled ROPA entry in ROPA Builder
7. Acknowledge finding → no longer shows in shadow processing count
8. Verify: no PII values stored in `discovery_findings` (only column locations)
9. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M29 Data Discovery ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M29 section (scanner architecture, zero-PII-storage principle)
3. Update `tracker-data.json` — M29 status → "built"
4. Apply SQL: discovery_scans + discovery_findings tables
5. Git commit + push + PR + merge + tag `v4.4.0`
