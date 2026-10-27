# P4 — M27: Consent Propagation Engine
## Auto-propagate consent withdrawal to all connected systems

**Session:** P4 — M27  
**Phase:** P4 — Innovation  
**Priority:** HIGH (for enterprise) — solves the hardest DPDP technical compliance problem  
**Estimated time:** 1 session (~3 hours)  
**Branch:** `feature/p4-m27-consent-propagation`  
**Tag after completion:** `v4.2.0`  
**Prerequisites:** M2 (Consent Management) + M24 (DSR Connectors, for reusing connector framework)

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

When a data principal withdraws consent, TrustStack™ automatically notifies and triggers deletion/suppression in all connected systems — not just recording the withdrawal in the platform.

**Why this matters:** Recording consent withdrawal is easy. Actually removing the data from Salesforce, the email list, the analytics platform, and the ad targeting system is hard. TrustStack™ will be the only Indian DPDP platform that automates this.

---

## Database Schema

```sql
-- Propagation rules: which connector actions to trigger per consent event
CREATE TABLE consent_propagation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  consent_config_id UUID NOT NULL REFERENCES consent_configs(id),
  connector_id UUID NOT NULL REFERENCES dsr_connectors(id),
  trigger_event TEXT NOT NULL,              -- 'consent.withdrawn' | 'consent.expired'
  action TEXT NOT NULL,                     -- 'delete' | 'suppress' | 'unsubscribe' | 'webhook'
  field_mapping JSONB NOT NULL DEFAULT '{}', -- { "consent_field": "email", "connector_field": "EmailAddress" }
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consent_config_id, connector_id, trigger_event)
);

-- Log of propagation events
CREATE TABLE propagation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  consent_record_id UUID NOT NULL REFERENCES consent_records(id),
  rule_id UUID NOT NULL REFERENCES consent_propagation_rules(id),
  connector_id UUID NOT NULL REFERENCES dsr_connectors(id),
  trigger_event TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'running' | 'completed' | 'failed' | 'retrying'
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consent_propagation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE propagation_events ENABLE ROW LEVEL SECURITY;

-- Org-scoped RLS for both tables
```

---

## Propagation Flow

```typescript
// When consent is withdrawn (update to consent_records.status = 'withdrawn'):
// 1. Update consent_records (existing M2 code)
// 2. Call: triggerConsentPropagation(consentRecordId, orgId, 'consent.withdrawn')

// src/lib/consent/propagation.ts
export async function triggerConsentPropagation(
  consentRecordId: string,
  orgId: string,
  event: 'consent.withdrawn' | 'consent.expired'
): Promise<void> {
  // 1. Find all active rules for this consent_config + event
  const rules = await getRulesForConsentRecord(consentRecordId, event);
  
  // 2. For each rule: create propagation_event (status: 'pending')
  const events = await createPropagationEvents(rules, consentRecordId);
  
  // 3. Process immediately (or queue for async — see below)
  await processPropagationEvents(events);
}

async function processPropagationEvents(events: PropagationEvent[]): Promise<void> {
  for (const event of events) {
    try {
      await adminSupabase.from('propagation_events').update({ status: 'running', attempts: event.attempts + 1 }).eq('id', event.id);
      
      const connector = await loadConnector(event.connector_id);
      await connector.deleteRecord(/* credentials from Vault, identifier from consent_record */);
      
      await adminSupabase.from('propagation_events').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', event.id);
    } catch (err) {
      await adminSupabase.from('propagation_events').update({
        status: event.attempts >= 3 ? 'failed' : 'retrying',
        last_error: String(err),
      }).eq('id', event.id);
    }
  }
}
```

**V1 processing:** Sequential, in-request (acceptable for small connector counts).  
**V2 enhancement:** Queue with Supabase pg_queues or Vercel async background function.

**SLA:** Propagation completes within 30 minutes of withdrawal (log tracks this).

---

## API Routes

### GET `/api/consent/propagation/rules` — List propagation rules
### POST `/api/consent/propagation/rules` — Create rule
### DELETE `/api/consent/propagation/rules/[id]` — Delete rule
### GET `/api/consent/propagation/events` — List propagation event log (paginated)
### POST `/api/consent/propagation/events/[id]/retry` — Retry failed event

---

## UI: Propagation Rules (inside `/dashboard/consent/[configId]` — new "Propagation" tab)

```
Consent Propagation Rules
─────────────────────────────────────────────────────────────────
When data principals withdraw consent for "Marketing Communications":

Trigger         System              Action        Status
──────────────────────────────────────────────────────────────
Withdrawn  →  Salesforce CRM  →  Suppress Lead   ✅ Active
Withdrawn  →  Zoho Marketing  →  Unsubscribe     ✅ Active
Expired    →  Salesforce CRM  →  Delete record   ✅ Active

[+ Add Rule]

─────────────────────────────────────────────────────────────────
Recent Propagations (last 7 days)
──────────────────────────────────────────────────────────────
Jun 26  sarah@ex.com withdrew  →  Salesforce  ✅  0.8s
Jun 25  john@ex.com expired    →  Zoho        ⚠️  Failed — retrying (2/3)
Jun 24  ravi@ex.com withdrew   →  Salesforce  ✅  1.2s
                               →  Zoho        ✅  0.9s
```

---

## Testing

1. Configure rule: "Marketing consent withdrawn → delete from Salesforce"
2. Data principal withdraws consent via public consent widget
3. Propagation event created + executed within 30 seconds
4. Verify in Salesforce sandbox: record suppressed
5. Simulate connector failure → retry mechanism fires (up to 3 attempts)
6. After 3 failures → status = 'failed', alert created in M18 Alert Center
7. [Retry] button → manual re-trigger works
8. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M27 Consent Propagation ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M27 section
3. Update `tracker-data.json` — M27 status → "built"
4. Apply SQL: consent_propagation_rules + propagation_events tables
5. Git commit + push + PR + merge + tag `v4.2.0`
