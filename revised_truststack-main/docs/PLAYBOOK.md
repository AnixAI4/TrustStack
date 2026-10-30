# PLAYBOOK — how we work, session by session

Loaded with `CLAUDE.md` in every session (`@docs/PLAYBOOK.md`). CLAUDE.md holds
the **rules of the product** (the Slice Contract, the DPDP invariants, the
engineering rules); this file holds the **rules of the work** — how a session
starts, tests, hands over to Aniket and ends. Status lives in `docs/STATE.md`,
decisions in `docs/DECISIONS.md`, the next session's prompt in
`docs/slices/SLICE_NN_*.md`. Update this file in the Sync Step only when a
working rule changes (say so in DECISIONS). **CLAUDE.md has a 160-line cap
(CI `docs.yml`)** — new working rules go here, not there.

## 1. Where the next step is — never guess

1. `docs/STATE.md` → the **▶ Start here** box at the top: what is built, what
   waits on Aniket, the exact next start line, the gate baseline.
2. The slice prompt it names → its **▶ NEXT SESSION** line and the numbered
   section that is the full prompt. Everything else in that file is history.
3. If STATE and the prompt disagree, or a merge they assume has not happened
   (`git log`), **stop and ask Aniket** — do not pick one.

## 2. The local stack — every gate runs here, never on hosted

- `.env.local` (root and `apps/web/`) points at the **HOSTED** database that
  serves the live site and real tenants. `pnpm dev` is safe (Next reads
  `apps/web/.env.development.local`, the local stack, first); **`pnpm db:*`,
  `pnpm test:rls` and Playwright are not** unless the local env is exported.
- Build the env once per session: `npx -y supabase@2.117.0 status -o env`, map
  API_URL → `NEXT_PUBLIC_SUPABASE_URL`, ANON_KEY → `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  SERVICE_ROLE_KEY → `SUPABASE_SERVICE_ROLE_KEY`, DB_URL → `DATABASE_URL` and
  `DIRECT_URL`, plus CI's `SEED_USER_PASSWORD` and `ACTIVE_ORG_COOKIE_SECRET`
  (`.github/workflows/app.yml`); write it to a scratch file outside the repo and
  `source` it before every gate. Print the DB host before a reset or seed.
- Clean rebuild: `npx -y supabase@2.117.0 db reset` → `pnpm db:migrate` →
  `pnpm db:seed`. Do it before the gates, before the "after" screenshots, and
  after Aniket's manual test.
- **Gates**: `pnpm typecheck` · `pnpm test:unit` · `pnpm test:rls` ·
  `pnpm check:secrets` · **every** CI SQL gate (no `psql` on the Mac: a shim named
  `psql` that drops the URL argument and runs `docker exec -i
  supabase_db_truststack psql -U postgres -d postgres "$@"`; extract every
  `run:` body in `app.yml` that calls psql; run the seed one from the repo root;
  its count string differs locally only in `audit_logs`; **the seed prefers `DIRECT_URL`
  and otherwise loads the root `.env.local` — HOSTED — so any runner of these steps must
  have the local env exported, `DIRECT_URL` included, and refuse otherwise**: 2026-10-20 a
  runner without it reached hosted, and only a missing column stopped the first write) · the **full** e2e,
  `--workers=1`, on a production build (Playwright's own `pnpm build && pnpm
  start`; never `next build` beside a running `next dev`). Dev-mode e2e times out
  on cold pages — not a finding. CI is the authority for e2e. **From Slice 11,
  export `AI_ENABLED=true AI_PROVIDER=fake`** for e2e and for `pnpm dev` in a
  manual test (CI's env does the same): the recorded fake, never a live model. A
  live smoke runs by hand only (`AI_PROVIDER=anthropic`, the key in `.env.local`),
  on the local stack and fictional data (D-125).
- **CI minutes are metered** past GitHub Free's 2,000 a month (an Actions budget of $15 caps the
  rest, D-132): a documents-only push skips the app's heavy jobs. Batch documentation commits where
  sensible, and never push just to "see CI" — run the gates locally first.
- Commits as `176423906+aniketmhala@users.noreply.github.com` (repo-local
  `user.email`), or Vercel refuses the preview. `git add` explicit paths only.

## 3. Every approval gate (stage or batch) hands Aniket four things

1. **Gates green** locally and on CI (the PR's checks), numbers stated.
2. **Walk-through** `docs/testing/SLICE_NN_<stage>_walkthrough.md` in the
   standard shape: intro (how it was opened; the decisions it builds on;
   "nothing about the data, the law or who may do what changed" when true; the
   manual test; the gate phrase) · What you are approving · before/after tables ·
   What did not change · **Claude's calls — confirm or change** · Evidence.
3. **Manual test** `docs/testing/SLICE_NN_<stage>_manual_test.md`: before you
   start (Docker, checkout, `pnpm dev` → usually http://localhost:3001 because
   Docker holds 3000, the seed password, who plays whom), then numbered steps,
   each **Do** and **Expect**, plain words, on the LOCAL stack. Say which role
   each step needs — a step that a role cannot do must say what that role sees
   instead. Never tell Aniket to run `pnpm db:*` in a plain terminal; never make
   him create permanent records (reports, snapshots) on a seeded tenant on the
   live site. When he asks, **do every prerequisite for him** (start the app in
   his Terminal panel, any setup), name the step to start at, and stop and
   rebuild afterwards.
4. **Screenshots** before/after as `.webp` (`cwebp`) in
   `docs/testing/<slice-stage>/{before,after}/`, laptop and phone width; take the
   "before" set from the untouched code first.

Then: commit, push, open the PR (into `main`; merging it puts the work on the
live site), bind it, and wait for Aniket's gate phrase. On approval:
record it in DECISIONS (what he approved, the calls that stand), flip STATE /
SLICES / UX_REVIEW / the prompt, merge the PR, rebuild the local DB, push.

## 4. Claude's calls are a DPDP consultant's

Every call put to Aniket carries a **verdict** (confirm / confirm with a change /
change), its **legal basis** — section, rule or Schedule, checked in
`docs/legal/` with `pdftotext -layout`, never from memory — and the **risk if
wrong**. Keep statute apart from TrustStack defaults; say where the text is
ambiguous and counsel must confirm; never claim certification or that counsel
has reviewed anything.

## 5. Standing reminders at every gate

- **Simplicity** (Aniket, 2026-10-16): legally exact, yet simple for a
  non-lawyer — score new surfaces in `docs/UX_REVIEW.md`.
- **Client-hosted deployment** (proposed Slice 15): one line at every gate and
  every new prompt, and check the work added no hosted-only dependency (a
  Vercel-only feature, a non-self-hostable Supabase feature, a hard-wired
  provider key, an online-only licence check, a font CDN).
- **The clock** (moved here from CLAUDE.md, D-111): DPDP Rules 2025 (G.S.R.
  846(E), 13 Nov 2025) commence in stages — **Rule 4 → 13 Nov 2026**; **Rules 3,
  5–16, 22, 23 → 13 May 2027** (notice, security, breach, retention, contact,
  children, SDF, rights, cross-border). Clients need ~5 months (assessment +
  90-day sprint). This is why we ship fast.

## 6. The handover check — before every approval is closed (Aniket, 2026-10-18)

Aniket: *"always ensure that you are doing it without i am asking everytime
before i start new prompt in new session window."* After an approval is recorded
and merged — and before the session ends — Claude checks the handover **unasked**,
so the next window starts with no confusion or ambiguity:

1. **One next step, said the same everywhere:** STATE's ▶ box (Live site, In
   flight, Waiting on Aniket, Next session, Gate baseline, Local database, Open
   loops), the slice file's status block and ▶ NEXT line, its §0 bootstrap (the
   D-number range to read, the merge guard, the baseline numbers), `SLICES.md`'s
   row, `UX_REVIEW.md`'s rows and dated entry, and the last DECISIONS entry. Any
   two that disagree are fixed before the session ends.
2. **The next prompt checked against the code, not memory:** every file path,
   function, test, CI step, migration name and quoted old string it names is
   grepped and found; line counts and "today it does X" claims are re-read; a fix
   that is bigger than its row says (a new model input, a migration) is spelled
   out with what to build and what must not change.
3. **The prompt after next** (SLICE_NN+2, or the slice after the last batch) is
   read for anything the work just done made stale — its baseline, merged PRs,
   conventions — and either fixed or named as a deliverable of the next session.
4. **The local stack** is the clean seed, `main` is checked out and up to date,
   and the working tree is clean.
5. **The feature tracker (F-61, Aniket 2026-10-28):** update a row in
   `docs/reference/feature_register.json` for anything this work built, changed or dropped (status,
   `checks` — the files that prove it — and `where`); run `python3 tools/feature_tracker.py` (it
   checks every row against `origin/main`, and regenerates the standalone page
   `docs/reference/FEATURE_TRACKER.html`, which opens in any browser — add `--note "…"`, and do this at
   the end of **every** prompt or feature, not only here); upload `docs/reference/feature_tracker.json` to the live
   tracker (https://claude.ai/artifact/PZeYB4vxU8RRUSnYoB1YSq) and point its `features` source at
   the new file. A warning it prints is fixed or explained, never left silent.
6. The closing message says it was done and names anything left for Aniket.

## 7. Ending a turn

Commit and push before ending **every** turn that changed files (Aniket treats
the remote as the source of truth). Say what was pushed, to which branch, and
what is not done or not verified.
