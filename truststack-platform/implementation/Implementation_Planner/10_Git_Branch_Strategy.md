# TrustStack™ — Git Branch Strategy
## Feature branches, merge to main, semantic tags

**Version:** 1.0 — June 2026

---

## Branch Naming Convention

```
feature/p{phase}-{m/fix/tracker}-{name}
```

**Examples:**
```bash
feature/p15-fix1-m4-reference-bug
feature/p15-fix2-sql-and-cron
feature/p15-fix3-m9-enhancement
feature/p15-fix4-production-hardening
feature/p2-m11-team-management
feature/p2-m12-billing-engine
feature/p2-m13-payg-credits
feature/p2-m14-onboarding-wizard
feature/p2-m15-whatsapp-consent
feature/p3-m20-sector-packs
feature/p4-m26-ai-governance
```

**Rules:**
- Always branch from `main` (never from another feature branch)
- One module = one branch = one PR
- Branch lives only until PR is merged → then delete it
- Never work directly on `main`

---

## Workflow per Session

```bash
# 1. Start of session — always update local main first
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/p2-m11-team-management

# 3. Work: incremental commits
git add src/app/api/team/invite/route.ts
git commit -m "feat(m11): add team invite API with email send"

git add src/components/modules/team/TeamMemberList.tsx
git commit -m "feat(m11): add team member list with role badges"

git add db/organization_invites.sql
git commit -m "feat(m11): add organization_invites table + RLS"

# 4. Update context docs before final commit
git add implementation/progress.md
git add implementation/MASTER_CONTEXT.md
git add implementation/Implementation_Planner/tracker-data.json
git commit -m "docs: update progress, MASTER_CONTEXT, tracker for M11"

# 5. Push and open PR
git push origin feature/p2-m11-team-management
gh pr create --title "feat(M11): Team Management — invite, roles, seat limits"

# 6. After PR approved: merge via GitHub (squash or merge commit — not rebase)
# Then tag on main:
git checkout main
git pull origin main
git tag -a v2.1.0 -m "feat(M11): Team Management complete"
git push origin v2.1.0
```

---

## Commit Message Format

```
type(scope): short description

body (optional): why, not what
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation/progress/context updates
- `chore` — config, dependencies, tooling
- `test` — tests only
- `refactor` — no behavior change

**Scopes:** `m1`, `m2`, ... `m30`, `p15`, `auth`, `billing`, `tracker`, `infra`

**Examples:**
```
feat(m11): add user invite with Resend email
fix(m4): scope reference number count to org + year
docs: update MASTER_CONTEXT v2.4 — add M11-M15 sections
chore(deps): add razorpay npm package
feat(billing): implement Razorpay PaymentGateway class
```

---

## Tag Naming Convention

| Phase | Format | Examples |
|---|---|---|
| P1.5 fixes | v1.5.Y | v1.5.1, v1.5.2, v1.5.3, v1.5.4 |
| P2 features | v2.X.0 | v2.1.0 (M11), v2.2.0 (M12), v2.10.0 (Tracker) |
| P2 patches | v2.X.Y | v2.1.1 (M11 bug fix after PR merge) |
| P3 features | v3.X.0 | v3.1.0 (M20), v3.6.0 (M25) |
| P4 features | v4.X.0 | v4.1.0 (M26), v4.5.0 (M30) |
| Milestone releases | vM1.0, vM2.0 | vM1.0 (Controlled Beta release) |

**Annotated tags only** (not lightweight):
```bash
git tag -a v2.1.0 -m "feat(M11): Team Management — invite, roles, seat limits"
git push origin v2.1.0
```

---

## PR Template (GitHub)

All PRs should use this body format:

```markdown
## What
[1-2 sentence summary]

## Module
[Module name + phase]

## Test Plan
- [ ] Golden path works end-to-end
- [ ] Edge case: [specific edge case]
- [ ] npm run type-check → 0 errors
- [ ] npm audit → 0 vulnerabilities
- [ ] New auth routes: 401 unauthenticated
- [ ] New dashboard routes: 307 unauthenticated
- [ ] Public routes: CORS headers present

## DB
- Run `db/xxx.sql` in Supabase if applicable

## Context updated
- [ ] progress.md
- [ ] MASTER_CONTEXT.md
- [ ] tracker-data.json

🤖 Generated with Claude Code
```

---

## Protected Branch Rules (set in GitHub)

For `main` branch:
- Require PR review (1 approver) — even if solo, use self-review as final check
- Require status checks: `type-check` + `build` (if CI is set up)
- No direct push to main
- No force push ever

---

## What NEVER Goes in a Commit
- `.env.local` or any file with secrets (`.gitignore` must cover these)
- `node_modules/`
- `.next/` build output
- API keys, passwords, HMAC secrets
- `tracker-data.json` before updating module status (always update first)

The `.gitignore` should already exclude these. Run `git status` before `git add` and inspect every file before staging.

---

## Hotfix Process (for production bugs)

```bash
# For an urgent bug in production that can't wait for a full feature session:
git checkout main
git pull origin main
git checkout -b hotfix/m4-reference-duplicate-collision

# Fix, commit
git commit -m "fix(m4): prevent duplicate reference on concurrent inserts"

# PR → merge → tag with patch version
git tag -a v2.1.1 -m "hotfix(m4): reference collision on concurrent requests"
git push origin v2.1.1
```

---

## Supabase SQL + Vercel as Part of the Branch

Some "deployments" happen outside git (Supabase SQL, Vercel env vars). Track these in `progress.md`:

```
## Pending Manual Steps (not in git)
- [ ] db/organization_invites.sql → apply in Supabase
- [ ] CRON_SECRET → add to Vercel Production + Preview
```

The rule: every piece of infra must be tracked somewhere in the repository. `progress.md` is the fallback for anything that can't be committed as code.
