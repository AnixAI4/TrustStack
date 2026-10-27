# P3 — M24: India DSR Connectors
## Pre-built connectors to auto-fulfill DSR requests from Salesforce, Zoho, Google, Shopify

**Session:** P3 — M24  
**Phase:** P3 — Scale  
**Priority:** HIGH — makes TrustStack™ the DSR system-of-record; major sticky feature  
**Estimated time:** 2 sessions (~5 hours — complex OAuth + API integrations)  
**Branch:** `feature/p3-m24-dsr-connectors`  
**Tag after completion:** `v3.5.0`  
**Prerequisites:** M5 DSR Management live + Supabase Vault available (for encrypted creds)

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

Pre-built integrations that execute DSR fulfillments automatically. When an org admin approves a DSR request, TrustStack™ can automatically delete or export the data principal's records from connected third-party systems.

**V1 Connectors:**
1. **Salesforce CRM** — delete/export customer record via Salesforce REST API
2. **Zoho CRM** — delete/export via Zoho API
3. **MySQL/PostgreSQL** — custom SQL delete/export query runner
4. **Google Workspace** — delete via Google Admin SDK (Gmail, Drive, Contacts)
5. **Shopify** — delete customer data via Shopify Admin API

---

## Database Schema

```sql
-- DSR connector configurations per org
CREATE TABLE dsr_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_type TEXT NOT NULL,             -- 'salesforce' | 'zoho' | 'mysql' | 'postgresql' | 'google_workspace' | 'shopify'
  display_name TEXT NOT NULL,              -- User-set name e.g. "Main Salesforce Org"
  config JSONB NOT NULL DEFAULT '{}',      -- Non-secret config (endpoint URLs, field mappings)
  credentials_vault_key TEXT NOT NULL,     -- Reference to Supabase Vault secret (NEVER store creds here)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT,                   -- 'success' | 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, connector_type, display_name)
);

-- Fulfillment log per DSR × connector
CREATE TABLE dsr_fulfillment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dsr_request_id UUID NOT NULL REFERENCES dsr_requests(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES dsr_connectors(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  action TEXT NOT NULL,                    -- 'delete' | 'export' | 'rectify'
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  result_summary TEXT,                     -- "Deleted 1 contact record in Salesforce"
  error_message TEXT,
  records_affected INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dsr_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsr_fulfillment_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admins_manage_connectors" ON dsr_connectors
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'dpo')
    )
  );

CREATE POLICY "org_members_view_log" ON dsr_fulfillment_log
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
```

---

## Connector Architecture

```typescript
// src/lib/connectors/connector.interface.ts
export interface DSRConnector {
  type: string;
  
  testConnection(config: ConnectorConfig, credentials: ConnectorCredentials): Promise<boolean>;
  
  deleteRecord(
    config: ConnectorConfig,
    credentials: ConnectorCredentials,
    identifier: { email?: string; phone?: string; customId?: string }
  ): Promise<{ success: boolean; recordsDeleted: number; summary: string }>;
  
  exportRecord(
    config: ConnectorConfig,
    credentials: ConnectorCredentials,
    identifier: { email?: string; phone?: string; customId?: string }
  ): Promise<{ success: boolean; data: Record<string, unknown>; summary: string }>;
}

// Factory:
// src/lib/connectors/
//   connector.interface.ts
//   salesforce.connector.ts
//   zoho.connector.ts
//   mysql.connector.ts
//   google-workspace.connector.ts
//   shopify.connector.ts
//   connector.factory.ts
```

### Credential Storage (Supabase Vault)

```typescript
// Store credentials:
const { data: vaultKey } = await adminSupabase.rpc('vault.create_secret', {
  secret: JSON.stringify({ client_id, client_secret, access_token, refresh_token }),
  name: `dsr_connector_${connectorId}`,
});

// Retrieve credentials:
const { data } = await adminSupabase.rpc('vault.decrypted_secrets', {}).eq('name', `dsr_connector_${connectorId}`).single();
const credentials = JSON.parse(data.decrypted_secret);
```

---

## API Routes

### GET `/api/connectors` — List configured connectors
### POST `/api/connectors` — Add new connector (stores config + encrypts creds in Vault)
### POST `/api/connectors/[id]/test` — Test connection (returns success/failure)
### DELETE `/api/connectors/[id]` — Remove connector + delete from Vault

### POST `/api/dsr/requests/[id]/fulfill-via-connectors`
**Auth:** Admin or DPO  
**Flow:**
1. Get DSR request + identify data principal (email/phone)
2. Get all active connectors for this org
3. For each connector: create `dsr_fulfillment_log` record (status: 'running')
4. Execute connector's `deleteRecord()` or `exportRecord()` based on DSR type
5. Update log with result
6. Update DSR request: add connectors_fulfilled[] to notes
7. Return: `{ connectors_run, succeeded, failed, log_entries }`

---

## UI: `/dashboard/dsr-connectors`

```
Data Source Connectors                           [+ Add Connector]
─────────────────────────────────────────────────────────────────
Connect your data sources so TrustStack™ can automatically
fulfill DSR requests (delete, export) across all systems.

Connected:
✅ Salesforce (Main Org)     Last tested: Jun 26   [Test] [Remove]
✅ Zoho CRM                   Last tested: Jun 25   [Test] [Remove]
⚠️ Google Workspace           Last test: FAILED     [Test] [Remove]
   Error: OAuth token expired. Click Test to re-authorize.

─────────────────────────────────────────────────────────────────
Available Connectors:
[+] Salesforce    [+] Zoho CRM    [+] MySQL/PostgreSQL
[+] Google Workspace  [+] Shopify   [+] Custom Webhook (coming soon)
```

### DSR Request Detail (enhanced)

When viewing a DSR, add "Fulfillment" section:
```
Fulfillment Status
─────────────────────────────────────────────────────────────────
Action: Delete all personal data

[Auto-Fulfill via Connectors]

Connector               Status     Records    Result
────────────────────────────────────────────────────────────────
Salesforce (Main Org)   ✅ Done      1        Deleted contact: sarah@acme.com
Zoho CRM                ✅ Done      2        Deleted lead + contact records
Google Workspace        ⚠️ Skipped   —        OAuth expired — manual action needed
```

---

## Testing

1. Add Salesforce connector (use Salesforce Developer org sandbox)
2. Test connection → success
3. Submit DSR deletion request for a known email
4. Approve DSR + [Auto-Fulfill] → Salesforce API called
5. Log shows "Deleted 1 contact record in Salesforce"
6. Manually verify in Salesforce sandbox: contact deleted
7. Google Workspace with expired token → log shows "failed", org admin notified
8. Remove connector → Vault secret deleted
9. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M24 DSR Connectors ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M24 section (Supabase Vault usage, connector pattern)
3. Update `tracker-data.json` — M24 status → "built"
4. Apply SQL: dsr_connectors + dsr_fulfillment_log tables
5. Git commit + push + PR + merge + tag `v3.5.0`
