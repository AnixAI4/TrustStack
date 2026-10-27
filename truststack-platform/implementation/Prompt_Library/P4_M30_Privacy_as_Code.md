# P4 — M30: Privacy-as-Code
## Developer toolkit: npm SDK, GitHub Action, ESLint plugin for privacy checks in CI/CD

**Session:** P4 — M30  
**Phase:** P4 — Innovation  
**Priority:** MEDIUM — developer market; creates stickiest possible integration  
**Estimated time:** 2 sessions (~5 hours — npm package + GitHub Action + ESLint plugin)  
**Branch:** `feature/p4-m30-privacy-as-code`  
**Tag after completion:** `v4.5.0`  
**Prerequisites:** M25 DPDP Public API (SDK calls TrustStack™ API endpoints)

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

A developer toolkit that brings DPDP compliance into the engineering workflow:
1. **npm SDK** (`@truststack/privacy`) — call TrustStack™ APIs from any Node.js application
2. **GitHub Action** — scan PRs for new personal data fields that lack ROPA/consent documentation
3. **ESLint plugin** (`eslint-plugin-truststack`) — flag direct DB queries on PII tables

---

## Part 1: npm SDK (`@truststack/privacy`)

This is a NEW package in a new repository (not inside truststack-platform).

### Create `packages/truststack-sdk/`

```typescript
// @truststack/privacy — published to npm

// src/index.ts
export class TrustStackClient {
  constructor(private apiKey: string, private baseUrl = 'https://truststack.in/api/v1') {}
  
  async checkConsent(dataPrincipalId: string): Promise<ConsentStatus[]> {
    const res = await fetch(`${this.baseUrl}/consent/${dataPrincipalId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) throw new TrustStackError(await res.json());
    return res.json();
  }
  
  async recordConsent(params: RecordConsentParams): Promise<ConsentRecord> {
    const res = await fetch(`${this.baseUrl}/consent/record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new TrustStackError(await res.json());
    return res.json();
  }
  
  async submitDSR(params: DSRParams): Promise<DSRRecord> { /* ... */ }
  async notifyBreach(params: BreachParams): Promise<BreachRecord> { /* ... */ }
  async getComplianceScore(): Promise<ComplianceScore> { /* ... */ }
}

// Offline buffer: if TrustStack™ API is unreachable, log locally and sync when reconnected
export class TrustStackClientWithBuffer extends TrustStackClient {
  private buffer: BufferedEvent[] = [];
  
  override async recordConsent(params: RecordConsentParams): Promise<ConsentRecord> {
    try {
      return await super.recordConsent(params);
    } catch (err) {
      this.buffer.push({ type: 'consent', params, timestamp: new Date() });
      return { id: 'buffered', ...params } as ConsentRecord;
    }
  }
  
  async flushBuffer(): Promise<void> {
    // Retry all buffered events
  }
}
```

### Package.json for SDK

```json
{
  "name": "@truststack/privacy",
  "version": "1.0.0",
  "description": "TrustStack™ DPDP Privacy SDK for Node.js",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### Usage (customer's code)

```typescript
import { TrustStackClient } from '@truststack/privacy';

const truststack = new TrustStackClient(process.env.TRUSTSTACK_API_KEY);

// Before sending marketing email:
const consent = await truststack.checkConsent(user.email);
const hasMarketingConsent = consent.some(c => c.purpose === 'Marketing' && c.status === 'active');
if (!hasMarketingConsent) {
  logger.info(`Skipping marketing email for ${user.email} — no consent`);
  return;
}
```

---

## Part 2: GitHub Action

**New repository:** `truststack-github-action` or publish to GitHub Marketplace.

**Action:** Scans PR diffs for new columns/fields containing PII-like names. Posts a comment on the PR.

```yaml
# .github/workflows/privacy-check.yml (in customer's repo)
name: TrustStack Privacy Check
on: [pull_request]

jobs:
  privacy-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: truststack/privacy-check-action@v1
        with:
          api-key: ${{ secrets.TRUSTSTACK_API_KEY }}
          # Optional: fail PR if PII field found without ROPA entry
          fail-on-missing-ropa: true
```

**Action logic:**

```javascript
// action.js (inside the GitHub Action)
const { getOctokit } = require('@actions/github');
const core = require('@actions/core');

// 1. Get PR diff from GitHub API
// 2. Parse diff for new column names (SQL migrations + ORM schema files)
// 3. For each new column: check against PII column name list (from M29's detector)
// 4. For each PII-like column: call GET /api/v1/data-discovery/check-ropa?field=email_address
//    → TrustStack™ checks if there's a matching ROPA entry for this org
// 5. If no ROPA: post PR comment + optionally set check status to "failed"
```

**PR Comment example:**

```markdown
## 🔒 TrustStack™ Privacy Check

Found 1 new personal data field in this PR:

| Field | Table | PII Type | ROPA Entry |
|-------|-------|----------|------------|
| `email_address` | `new_table` (migration_042.sql) | Email | ⚠️ Missing |

**Action required:** Create a ROPA entry in TrustStack™ for this processing activity before merging.

[Create ROPA Entry →](https://truststack.in/dashboard/ropa/new?prefill=email_address)

_[TrustStack™ Privacy-as-Code](https://truststack.in)_
```

---

## Part 3: ESLint Plugin (`eslint-plugin-truststack`)

```javascript
// eslint-plugin-truststack/rules/no-direct-pii-query.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent direct database queries on PII tables without TrustStack SDK',
    },
  },
  create(context) {
    const PII_TABLE_NAMES = ['users', 'customers', 'contacts', 'leads', 'patients', 'employees'];
    
    return {
      CallExpression(node) {
        // Detect: db.query('SELECT * FROM users') or prisma.user.findMany()
        // If PII table accessed without TrustStackClient.recordConsent() in scope → warn
        if (isPIITableAccess(node, PII_TABLE_NAMES)) {
          context.report({
            node,
            message: 'Direct query on PII table. Ensure consent is checked via TrustStack SDK before accessing personal data.',
          });
        }
      }
    };
  }
};
```

---

## New TrustStack™ API Endpoint (needed for GitHub Action)

### GET `/api/v1/data-discovery/check-ropa`
**Scope:** `discovery:read` (new scope in M25 API keys)  
**Query:** `?field_name=email_address&table_name=new_customers`  
**Returns:** `{ has_ropa_entry: boolean, ropa_entry_id?: string, suggested_entry?: ROPAEntry }`

---

## Developer Dashboard (`/dashboard/developer`)

Add a Developer section to the dashboard:

```
Developer Tools
─────────────────────────────────────────────────────────────────
npm SDK:     npm install @truststack/privacy
             [View Documentation →]

GitHub Action:  [View on GitHub Marketplace →]

ESLint Plugin:  npm install --save-dev eslint-plugin-truststack
                [View Rules Documentation →]

API Keys:    [Manage API Keys →]  (links to settings/api-keys from M25)
```

---

## Testing

1. Install SDK: `npm install @truststack/privacy`
2. `const ts = new TrustStackClient('ts_test_xxx')` → connects to test environment
3. `ts.checkConsent('test@example.com')` → returns consent records
4. `ts.recordConsent({...})` → new consent record in dashboard
5. SDK offline buffer: disconnect internet → `recordConsent()` buffers → reconnect → `flushBuffer()` syncs
6. GitHub Action: create a test PR adding a column `user_email` → Action comments on PR
7. ESLint plugin: add to ESLint config → `db.query("SELECT * FROM users")` shows lint warning
8. `npm run type-check` in truststack-platform → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M30 Privacy-as-Code ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M30 section + note about external SDK/Action repos
3. Update `tracker-data.json` — M30 status → "built"; phases.P4.status → "complete"
4. Publish `@truststack/privacy` to npm (version 1.0.0)
5. Publish GitHub Action to Marketplace
6. Git commit + push + PR + merge + tag `v4.5.0`

**P4 Innovation Phase is complete. All 35 TrustStack™ modules are now fully defined and ready for implementation.**
