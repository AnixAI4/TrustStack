# TrustStack Platform - Supabase schema

Run these in the **Supabase SQL Editor** in this order:

| # | File | What it creates |
|---|------|-----------------|
| 1 | `00_core.sql` | organizations, members, assessments, consent, grievance |
| 2 | `consent_config_versions.sql` | immutable consent version snapshots |
| 3 | `privacy_notices.sql` | privacy notice builder tables |
| 4 | `add_org_logo_url.sql` | `organizations.logo_url` (no-op if already in core) |
| 5 | `dsr_requests.sql` | DSR requests, nominations, OTPs |
| 6 | `ropa.sql` | ROPA entries |
| 7 | `vendors.sql` | vendors + questionnaire responses |
| 8 | `breach_incidents.sql` | breach incidents + 72h DPBI fields |
| 9 | `fix_grievance_reference_unique.sql` | per-org unique grievance refs (safe if core already did this) |
| 10 | `01_access_control.sql` | closed membership, role helpers, seat-limited invites |
| 11 | `02_session_registry.sql` | service-only device registry and concurrent-session controls |
| 12 | `03_payment_receipts.sql` | one-time server-only payment receipt ledger |
| 13 | `04_database_hardening.sql` | role-aware RLS, forced RLS, function grants, server-only public submissions |

All scripts are idempotent (`IF NOT EXISTS` / `DROP POLICY IF EXISTS`).

The four numbered security migrations are mandatory. Do not expose TrustDeck
until steps 10-13 have completed successfully; the module schemas alone do not
enforce read-only roles or close every privileged function grant.

Finally, run `verify_security.sql` in the SQL Editor. Deployment is complete
only when it returns `PASS`; any missing grant, policy, or forced-RLS flag raises
a `SECURITY FAIL` exception instead.

After the verifier passes, set `ENFORCE_DEVICE_SESSIONS=1` in the application
environment to activate account-sharing protection. `MAX_CONCURRENT_DEVICES`
defaults to `2` and is clamped by the server to the range 1-5.

After running, confirm in Supabase → Table Editor that `organizations` and `assessments` appear.
