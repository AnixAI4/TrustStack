# TrustStack™ DPDP Compass

Multi-tenant, evidence-driven DPDP readiness platform for Indian organisations.
Built by **Anix AI LLP**. First production client: Mumbai University (no pilot — D-067).

> **The product thesis, in one line:**
> `adjusted score = min(what you claim, what your evidence can prove)`
>
> Competitors sell checklists. This sells proof.

## Start here

| Read | For |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Rules, invariants, session ritual. Auto-loaded every session. |
| [`docs/STATE.md`](./docs/STATE.md) | Where the build actually is. **Read first.** |
| [`docs/SLICES.md`](./docs/SLICES.md) | The canonical plan, Slices 0–14. |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Settled decisions and why. |

## How this repo is built

One vertical slice at a time, each in its own fresh session, each shipping
migration + RLS + logic + tests + API + UI + seed + audit + CI + deploy. Never
"all frontend, then all backend". The ten-gate Slice Contract is in `CLAUDE.md`.

Each session's prompt is `docs/slices/SLICE_NN_*.md`. Only the next slice is
written in full; the rest are stubs, promoted at the end of the preceding
session against code that actually exists.

## Repository status

**Slices 0B–8 live** at https://revised-truststack-web.vercel.app: tenancy and
RBAC, the scope wizard, the 1,527-question bank with scope-driven generation,
evidence-capped answers (answer → signed-URL evidence → review → score), the
full 16-domain engine with red-flag caps and an immutable finalised score, the
derived gap register with owner-assigned actions that cannot be closed on a
promise and a 30/60/90-day roadmap, and the ROPA / Processing Activity
Register (completeness /100 and a versioned risk floor derived by the
database, the DPDP lawful-ground and children structure, Excel/CSV import and
export, ROPA gaps on the shared action workflow), and Slice 8's dashboards
(the executive overview, every action across both parents by owner and due
date, and a question bank that is a black box to clients, enforced by the
database). Next: Slice 9, TrustStack Intelligence — penalty exposure,
forecasts and executive reports. Status and
blockers: `docs/STATE.md`.

```bash
pnpm install
pnpm db:migrate && pnpm db:seed   # needs .env.local (see .env.example)
pnpm dev                          # http://localhost:3000
pnpm typecheck && pnpm test:unit && pnpm test:rls && pnpm test:e2e
```

## Relationship to the older app

`aniketmhala/dpdp` → `truststack-platform/` is **frozen** (pre-beta, no
production tenants). Six of its modules are ported here in Slice 10 and it is
retired in Slice 13. This repo is the destination. See `DECISIONS.md` D-001/D-002.

## Legal position

TrustStack assesses and evidences DPDP **readiness**. It does not certify
compliance, does not provide legal opinion, and is not a statutory Consent
Manager. Final legal interpretation, notices, consent language and contracts are
reviewed by authorised legal counsel. See `DECISIONS.md` D-011.
