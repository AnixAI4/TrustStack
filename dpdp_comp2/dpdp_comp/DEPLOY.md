# Production deployment guide

## Overview

| Component | Dev | Production |
|-----------|-----|------------|
| UI | Next.js dev (`:3000`) | Next.js `next start` or Docker `web` service |
| API | Flask `app.py` (`:5000`) | Gunicorn (`gunicorn.conf.py`) or Docker `api` service |
| Data | `./results`, `./uploads`, `./jobs` | `DATA_DIR` volume (default `/data` in Docker) |
| Auth | Optional | `APP_PASSWORD` (UI) + `API_KEY` (backend) recommended |

## Quick start (Docker)

1. Copy `.env.example` to `.env` and set at minimum:
   - `FLASK_SECRET_KEY` — `python -c "import secrets; print(secrets.token_hex(32))"`
   - `DEEPSEEK_API_KEY`
   - `API_KEY` — shared secret between web proxy and API
   - Set `APP_PASSWORD` — **required** if you don't want the public to run scans (HTTP Basic Auth on the UI; any username, this password)
- Set `API_KEY` — same value as `INTERNAL_API_KEY` in `web/.env.local`; blocks direct API calls without the UI

2. Build and run:

```bash
docker compose up --build
```

3. Open `http://localhost:3000` (browser will prompt for Basic Auth if `APP_PASSWORD` is set).

The API is **not** published to the host — only the Next.js web service is exposed. The web container forwards `/api/*` to the internal API and injects `X-API-Key`.

## Local production (without Docker)

```bash
# Backend env (.env in project root)
FLASK_ENV=production
FLASK_SECRET_KEY=<random-hex>
API_KEY=<random-secret>
DEEPSEEK_API_KEY=<your-key>
DATA_DIR=./data

# Frontend env (web/.env.local)
BACKEND_URL=http://127.0.0.1:5000
INTERNAL_API_KEY=<same-as-API_KEY>
APP_PASSWORD=<optional-ui-password>

# Build UI, then start both services
cd web && npm run build && cd ..
npm run start
```

`npm run start` runs Gunicorn + `next start` via `web/scripts/start.mjs`.

## Environment variables

### Backend (`.env`)

| Variable | Required (prod) | Description |
|----------|-----------------|-------------|
| `FLASK_ENV` | Yes | Set to `production` |
| `FLASK_SECRET_KEY` | Yes | Flask session/signing key |
| `DEEPSEEK_API_KEY` | Yes | LLM analysis |
| `API_KEY` | Recommended | Protects `/api/*` when set |
| `DATA_DIR` | No | Persistent storage root (default `.`) |
| `PORT` | No | API port (default `5000`) |
| `GUNICORN_WORKERS` | No | Default `1` (required for accurate in-memory rate limits) |
| `GUNICORN_THREADS` | No | Default `4` |
| `GUNICORN_TIMEOUT` | No | Default `120` (increase for long scans) |
| `MAX_CONCURRENT_SCANS` | No | Default `3` |
| `RATE_LIMIT_SCANS_PER_HOUR` | No | Per-IP limit (default `10`) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | If payments enabled | Razorpay checkout |
| `RAZORPAY_WEBHOOK_SECRET` | If payments enabled | Webhook signature (Dashboard → Webhooks) |
| `LOG_FILE` / `LOG_MAX_BYTES` / `LOG_BACKUP_COUNT` | No | Rotating Flask log (default `scanner.log`, 5×5MB) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | If auth enabled | Quotas, unlocks, user history |

### Frontend (`web/.env.local`)

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Flask/Gunicorn URL (default `http://127.0.0.1:5000`) |
| `INTERNAL_API_KEY` | Sent as `X-API-Key` on proxied `/api` requests |
| `APP_PASSWORD` | Enables HTTP Basic Auth on the entire UI |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Auth (browser) |

## Razorpay webhooks (production)

Payments are confirmed primarily via webhook — the browser unlock call is a fallback.

1. In Razorpay Dashboard → **Webhooks**, add:
   - **URL:** `https://<your-domain>/api/webhooks/razorpay`
   - **Events:** `payment.captured`
2. Copy the **Webhook Secret** into `.env` as `RAZORPAY_WEBHOOK_SECRET`.
3. The route is proxied by Next.js (`/api/*` → Flask). It does **not** require `X-API-Key`; it verifies `X-Razorpay-Signature`.
4. Processed payment IDs are logged in `DATA_DIR/processed_webhook_payments.json` for idempotency.

## Demo / QA data reset

**Script (clears Supabase tables, auth users, local report unlock flags):**

```powershell
python scripts/reset_all_data.py
```

Uses the Supabase Auth Admin REST API (`httpx`) so it works with `sb_secret_*` service keys.

**SQL (Supabase Dashboard → SQL Editor):** run `supabase/reset_all_data.sql` to truncate app tables and `auth.users`.

After reset, sign up with a fresh account. See **SMOKETEST.md** for the full checklist.

## Persistence

Scan jobs are stored under `DATA_DIR/jobs/` as JSON files. Reports live in `DATA_DIR/results/`. Uploads in `DATA_DIR/uploads/`.

Jobs left in `running` state after a crash are marked failed on the next API startup.

## Security notes

- Set `API_KEY` in production so the API is not callable without the header.
- **HTTPS:** Terminate TLS at your reverse proxy (nginx, Caddy, cloud load balancer). The Next.js middleware redirects HTTP→HTTPS when `x-forwarded-proto: http` is set and sends HSTS in production.
- **CSP:** Content-Security-Policy and related headers are applied on all UI responses via Next.js middleware (`web/src/lib/security/headers.ts`).
- **Flask headers:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `CSP`, `Permissions-Policy`, and HSTS (production) on API responses.
- **Logging:** Flask writes to a rotating log file (`LOG_FILE`, default `scanner.log`). Monitor disk usage via `LOG_MAX_BYTES` × (`LOG_BACKUP_COUNT` + 1).
- **URL validation:** Scan URLs are validated server-side (SSRF protection, private IP blocking, DNS resolution checks) in `security.py`.
- **Forms:** The scan form uses `POST`; data is sent via the API, not as GET query parameters.
- **Dependencies:** Run `npm run audit:deps` in `web/` regularly and patch moderate+ findings.
- Bind the API to localhost only when running without Docker (`127.0.0.1` via Gunicorn on a private network).
- Rate limiting is in-memory per worker — use `GUNICORN_WORKERS=1` or accept approximate limits.
- Selenium requires Chromium; the Docker image includes it. On Linux servers, install Chromium or set `CHROME_BIN` / `CHROMEDRIVER_PATH`.

## Health check

```bash
curl http://127.0.0.1:5000/health
```

Returns scanner version, rules version, and `status: ok`.
