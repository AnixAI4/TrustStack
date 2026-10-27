# TrustStack™ — Production Deployment Guide
## Vercel + Supabase (Mumbai) + Resend + Razorpay

**Version:** 1.0 — June 2026  
**Applies to:** truststack-platform (Next.js 15.5.19 App Router)

---

## Architecture Overview

```
Data Principals / Customers
         ↓ HTTPS
    Vercel Edge (CDN)
         ↓
   Next.js App Router
   (Server Components + Route Handlers)
         ↓              ↓
   Supabase (Mumbai)   Anthropic Claude API
   PostgreSQL + Auth   (claude-sonnet-4-6)
         ↓              ↓
   Resend (Email)    Razorpay (Payments)
```

**Key constraint:** Supabase project MUST be in `ap-south-1` (Mumbai) for DPDP data residency. Never migrate to a different region.

---

## Services

| Service | Purpose | Region | Status |
|---|---|---|---|
| Vercel | Hosting + Cron + CDN | Auto-distributed | ✅ Active |
| Supabase | DB + Auth + Storage | Mumbai (ap-south-1) | ✅ Active |
| Resend | Transactional email | Global | ✅ Active |
| Anthropic Claude API | AI generation | Global | ✅ Active |
| Razorpay | Payments | India | 🔲 (M12) |

---

## Environment Variables (full list)

### Currently required (P0 + P1):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # NEVER expose to client

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...

# Resend (email)
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://truststack.in  # or vercel deployment URL
HMAC_SECRET=<random 32-byte hex>         # for board share links + vendor questionnaire tokens

# Cron (M8 breach escalation)
CRON_SECRET=<random 32-byte hex>         # added in P1.5 FIX2
```

### Added in P2 (billing):
```bash
# Razorpay
PAYMENT_GATEWAY=razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# WhatsApp (M15)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Added in P3:
```bash
# Aadhaar eKYC (M16)
AADHAAR_TSP_API_KEY=...
AADHAAR_TSP_API_URL=...
```

**Rules:**
- All secrets in Vercel Environment Variables (Production + Preview)
- NEVER commit `.env.local` to git
- `NEXT_PUBLIC_*` vars are safe to expose to the browser — don't put secrets in them
- Rotate `HMAC_SECRET` and `CRON_SECRET` if ever accidentally exposed

---

## Vercel Project Settings

### Framework preset: Next.js
### Build command: `npm run build`
### Output directory: `.next`
### Install command: `npm install`
### Node version: 20.x (LTS)

### Vercel Cron Jobs:
```json
// vercel.json (added in P1.5 FIX2)
{
  "crons": [
    {
      "path": "/api/breach/escalations/run",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Verify crons are active: Vercel Dashboard → Project → Cron Jobs tab.

---

## Supabase Project Setup

### Project settings:
- Region: **ap-south-1 (Mumbai)** — NEVER CHANGE
- Plan: Pro (for custom domains, daily backups, point-in-time recovery)
- Database password: stored in 1Password / secure team vault (NEVER in git)

### Row Level Security:
RLS is ENABLED on ALL tables. Every table has policies that scope reads/writes to `organization_id`. This is not optional — it's the DPDP data isolation requirement.

**Pattern for every new table:**
```sql
-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Policy: org members can manage their own rows
CREATE POLICY "org_members_manage" ON new_table
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### Database backups:
- Daily automated backups (Supabase Pro)
- Point-in-time recovery enabled
- Before any migration: take manual backup via Supabase Dashboard → Backups → Create backup

### SQL migrations tracking:
All SQL files are in `db/` directory. Track which have been applied in `progress.md`:

```
## Applied SQL Migrations (Supabase)
| File | Applied | Applied By | Date |
|---|---|---|---|
| db/auth.sql | ✅ | Aniket | 2026-05-XX |
| db/assessments.sql | ✅ | Aniket | 2026-05-XX |
| db/ropa.sql | ⏳ Pending FIX2 | — | — |
```

---

## Domain Setup (truststack.in)

### DNS (Cloudflare or registrar):
```
A     truststack.in       → Vercel IP (from Vercel DNS settings)
CNAME www.truststack.in   → cname.vercel-dns.com

# For Resend email domain verification:
TXT   resend._domainkey    → [DKIM record from Resend]
TXT   @                   → v=spf1 include:spf.resend.com ~all
```

### Vercel domain:
- Add `truststack.in` and `www.truststack.in` in Vercel Dashboard → Project → Domains
- SSL auto-provisioned by Vercel (Let's Encrypt)

### Resend domain:
- Add `truststack.in` in Resend Dashboard → Domains
- Add all three DNS records (DKIM, SPF, DMARC)
- Verify and wait for "Verified" status (can take 24–48 hours)
- After verification: update all `from: 'noreply@anixai.io'` → `from: 'noreply@truststack.in'`

---

## Deployment Process

### Normal deployment (every PR merge to main):
Automatic. Vercel watches `main` branch and deploys on every push.

### Manual deployment (if auto-deploy is paused):
```bash
# Install Vercel CLI once:
npm install -g vercel

# Deploy to production:
vercel --prod
```

### Post-deployment checks (run after every production deploy):
1. `https://truststack.in/` → loads login page
2. `https://truststack.in/api/health` → 200 (if health endpoint exists)
3. `https://truststack.in/public/consent/widget.js` → loads consent widget script
4. Sign in → dashboard loads → no console errors
5. Vercel Cron Jobs tab → cron last ran successfully

---

## Monitoring & Alerts

### Vercel:
- Deployment notifications: set up Slack webhook in Vercel → Integrations → Slack
- Error monitoring: Vercel Error monitoring in Vercel Dashboard → Monitoring tab
- Function logs: Vercel Dashboard → Functions → Realtime logs

### Supabase:
- DB CPU/connections: Supabase Dashboard → Reports → Database
- Slow query log: Supabase Dashboard → Logs → Postgres
- Alert on DB connections approaching limit: set up Supabase email alerts

### Application-level:
Until a proper APM is added, monitor via:
- Vercel function logs for 500 errors
- Supabase logs for slow queries
- Resend delivery dashboard for email failures
- Razorpay dashboard for payment failures (when M12 is live)

---

## Disaster Recovery

### If Vercel deploy fails:
1. Go to Vercel Dashboard → Deployments → find last successful deployment
2. Click "Promote to Production" on the last good deployment
3. Investigate the failed build in Vercel build logs

### If Supabase is down:
1. Check status.supabase.com
2. If DB is unreachable: Next.js app returns 503 (Supabase client throws)
3. No action needed from TrustStack™ side — wait for Supabase recovery
4. All data is safe — Supabase Pro has guaranteed uptime SLA

### If a bad migration is applied:
1. DO NOT run another migration to "fix" it
2. Supabase Dashboard → Backups → restore to pre-migration backup
3. Fix the SQL migration file locally
4. Test on Supabase staging project first
5. Apply to production after verification

### Supabase staging project:
Create a second Supabase project (same region — Mumbai) for staging:
- `truststack-staging.supabase.co`
- Apply all migrations here first before production
- Vercel Preview deployments use staging Supabase project

---

## Security Hardening Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NEVER in `NEXT_PUBLIC_*` vars or exposed to browser
- [ ] RLS is enabled on every table (`SELECT tablename FROM pg_tables WHERE tableowner = 'postgres'` → check all have RLS)
- [ ] No SQL queries without `organization_id` filter (except admin client + system queries)
- [ ] All public API routes have CORS + OPTIONS handlers
- [ ] No secrets in `src/` directory (`grep -r "sk-ant\|rzp_live\|re_\|service_role" src/`)
- [ ] `HMAC_SECRET` is 32+ bytes of random entropy
- [ ] `vercel.json` cron is gated by `CRON_SECRET` header
- [ ] HTTP security headers set (Next.js `headers()` in next.config.js):
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy` (adjust for widget embed needs)
- [ ] Rate limiting on auth routes (Supabase handles this natively)
- [ ] Razorpay webhook endpoint verifies HMAC signature before processing
