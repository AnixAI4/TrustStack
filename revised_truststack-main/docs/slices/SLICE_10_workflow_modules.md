# SLICE 10 — Workflow modules: Breach, Rights & Grievance, Notice & Consent, Processors, Retention, AI Risk

**Branch:** `slice/10-workflow-modules` · **Est:** 8 sessions, in 8 stages
(1, 2, 3a, 3b, 4a, 4b, 5, 6 — Stages 3 and 4 split 2026-10-13, D-084,
D-089), each ending at an
approval gate · **Week:** 14–17 · **Ships:** the 90-Day
Sprint's working modules, each one FEEDING the exposure model it was
promised to (SLICE_09 §15), with a stakeholder report on the Slice 9 report
store.

> **STATUS: APPROVED by Aniket 2026-10-11, as written (D-080).** Stage 1
> built 2026-10-11 (D-081) — progress lives in STATE's "▶ Slice 10 tracker".
> Stage 1 deferred the `breach_incident` evidence link type to Stage 6 with
> the other new link types (D-081.13). Stage 1 approved 2026-10-11 (D-082);
> Stage 2 built 2026-10-11 (D-083) — one register for requests and
> grievances, a fourth action parent, and a `rights_request` link type also
> deferred to Stage 6. Stage 2 manual test passed by Aniket 2026-10-13.
>
> **2026-10-13 — Aniket's two decisions (D-084):** (1) **Stage 3 is split**
> into **3a** (public intake: slug, Rule 9 contact, rate limiting, one-time
> codes, the public rights and grievance forms — no model change) and **3b**
> (the notice page, the consent widget, children's consent → model 1.3.0);
> (2) **deploy as planned**: the live site stays on Slice 9 until PR #28
> merges at Stage 6 — each stage's additive migration still goes to hosted
> at its approval. **§7a below is the verified build brief for 3a and 3b.**
>
> **2026-10-13 — Stage 2 approved (D-085); Stage 3a built (D-086).** One
> change to §7a.3, for Aniket's approval at the 3a gate: the four intake
> functions are executable by `service_role` only, not `anon` — the anon key
> is public, so an anon-executable function would let a caller skip the
> emailed code and the address limit (D-086.1). Stage 3b builds on the same
> server-only pattern unless that is rejected.
>
> **2026-10-13 — Stage 3a approved (D-087); Stage 3b built (D-088).** The
> notice, the widget and the consent register on the server-only pattern;
> model 1.3.0 is §7a.5's row plus ONE addition for Aniket's approval at the
> gate: a consent still given for a child (or by a guardian) makes head 3
> apply (D-088.9). Two refinements of §7a "Stage 3b": Rule 11's three
> appointing bodies for a guardian beside Rule 10's three for a parent, and a
> Rule 12 exemption basis (D-088.7); and no "required" purpose (D-088.4).
>
> **2026-10-13 — Stage 3b manual test passed by Aniket** (all fifteen steps;
> one 3a carry-over fixed in `36de5e7`: an empty public address now warns that
> the pages stay closed). **Aniket, 2026-10-13 (D-089): Stage 4 is split into
> 4a (staff-entered questionnaire + accuracy controls + model 1.4.0) and 4b
> (the vendor-facing link); the accuracy controls are required.** §7b is the
> verified build brief for 4a and the outline for 4b.
>
> **2026-10-13 — Stage 3b approved (D-090).** **2026-10-14 — Stage 4a built
> (D-091)**: the processor register, the staff-entered questionnaire with the
> seven controls in the database, and model 1.4.0 as §7b.5 settled it. Calls
> for Aniket at the gate: who may change the contract facts (today the leads'
> `scope.write`), a pending document counts for the evidence rule, nobody who
> ANSWERED may review (stricter than "entered"), and the out-of-date reason on
> both heads. **§7b "Stage 4b" is now verified against the 4a code.** CI green
> on `92ebae9` (e2e 355/355); **Stage 4a manual test done by Aniket 2026-10-14**.
>
> **2026-10-14 — Stage 4a approved (D-092)**, its four calls as built; its
> migration is on hosted. **Aniket settled 4b's one call in the same message:
> the link's sender may not review the vendor's answers (D-092).** **Stage 4b
> built (D-093)** — the vendor-facing link on migration
> `20261016000000_vendor_link`, no model change. **§7c is Stage 5's build
> brief, verified against the 4b code.**
>
> **2026-10-14 — Stage 4b approved (D-094)**, its six calls as built; its
> migration is on hosted. Aniket settled three Stage 5 calls in the same
> message: **no end recorded is a reason; the AI register is written with
> `ropa.write`; no AI actions (D-094).** **Stage 5 built (D-095)** — the
> retention register and the AI risk register on migration
> `20261017000000_retention_ai_risk`, **model 1.5.0**. **§7d is Stage 6's
> build brief, verified against the Stage 5 code.**
>
> **2026-10-16 — Stage 5 approved with changes R1–R6 (D-096)**, built inside
> its migration, re-tested by Aniket, on hosted. **Stage 6 built (D-097)** —
> Aniket kept §7d's four calls as recommended: the three stakeholder reports,
> `breach_incident` and `rights_request` documents, the evidence index reading
> every link type, on migration `20261018000000_slice10_reports`, no model
> change. SLICE_11 promoted. Gate: the PR (CI green); the merge is Aniket's.
> **Aniket's change in the Stage 6 manual test (D-098): exposure model 1.6.0**
> — a recorded, non-dismissed breach makes head 2 assessed — added to the same
> migration (local only), so Stage 6 does change one rule after all.
>
> *Original status:* full prompt, for Aniket's approval. Promoted by the Sync Step
> of Slice 9 Stage 4 (2026-10-08) and re-verified 2026-10-10 against `main` @
> `8161688` (Slice 9 merged as PR #25, `a691d88`). Every path, reader and
> symbol named below exists on `main`; the legal references were checked
> against the Gazette text. **Do not start Stage 1 until Aniket has approved
> §4 (the decisions) and §6 (the model change).** His message opening Stage 1
> must say so, in one of two forms:
> - **"SLICE_10 approved"** — every §4 decision as recommended and every §6
>   row as written; or
> - **"SLICE_10 approved with changes: …"** — record each change in DECISIONS
>   and edit this file to match BEFORE writing code.
>
> Any other opening message: ask, and write no code. If anything has drifted
> since, the code wins.

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. **D-008, D-011, D-019,
   D-026, D-027, D-028, D-042, D-043, D-055, D-056, D-058, D-060, D-064,
   D-067, D-069, D-071, D-073 – D-078**), this file, and the Act's **s.8(2),
   s.8(6) – (10), s.9, s.11 – 14, s.33 and the Schedule**, and the Rules'
   **3, 6, 7, 8, 9, 10 – 11, 13, 14** (`docs/legal/`, `pdftotext -layout`).
2. **Stage 1 creates the "▶ Slice 10 tracker"** in `docs/STATE.md`, shaped
   exactly like Slice 9's (columns: Stage · Builds · Status · Last commit ·
   Aniket's approval; one row per stage in §7; statuses 🔲 / ⏳ / ✅), and
   records Aniket's approval of this prompt as the next free D-number in DECISIONS (D-080 at the time of writing). From Stage 2 on:
   find your stage in that tracker. A ⏳ stage → Aniket's opening message must
   approve it ("Stage N approved", or with changes); mark it ✅ with the date
   and any changes, apply the changes first, then run the next 🔲 stage.
3. **Branch:** Stage 1: `git checkout main && git pull && git checkout -b
   slice/10-workflow-modules` (PR #25 is merged; `main` holds Slice 9).
   Stages 2–6: `git checkout slice/10-workflow-modules && git pull`, never a
   new branch; merge `origin/main` if it moved, and re-run the gates.
4. `pnpm install && pnpm typecheck && pnpm test:unit && pnpm test:rls` green
   on the local stack, Docker running, no `pnpm dev`. Baseline (Slice 9
   final): core **938**, web unit **425**, RLS **370**, e2e **259**.
5. Local stack exactly as Slice 9 (SLICE_09 §0.5). No `psql`:
   `docker exec -i supabase_db_truststack psql -U postgres -d postgres`.
6. **Hosted serves the live site** (D-071): additive migrations may go on at
   their stage's approval; anything that revokes goes on after the deploy.
7. Nothing University-specific (D-040): every stage demonstrated on MU **and**
   a second sector (a disposable `healthcare` tenant), and BML's empty state.
8. **One stage per session, stop at its gate.** The merge is Aniket's.

## 1. DPDP anchoring (checked against the Gazette text, 2026-10-08)

| Module | Obligation | Penalty head (SLICE_09 §6) |
|---|---|---|
| Breach register | Intimate each affected Data Principal without delay (Rule 7(1)); intimate the Board without delay, and **within seventy-two hours** of becoming aware the detailed report, "or within such longer period as the Board may allow on a request made in writing" (Rule 7(2)(b)) | **H2** s.8(6); repetition is s.33(2)(c) |
| Rights requests | Access, correction, completion, updating, erasure, grievance, nomination (s.11–14); publish the means and the identifiers needed (Rule 14(1)–(2)); nomination (Rule 14(4)) | **H7** |
| Grievance | Publish, and respond within **a reasonable period not exceeding ninety days** (Rule 14(3)); a published contact (s.8(9), Rule 9) | **H7** |
| Notice | Notice before or at consent, itemised, in plain language, with how to withdraw, exercise rights and complain (s.5, Rule 3) | **H7** |
| Consent | Free, specific, informed, unambiguous; withdrawal as easy as giving (s.6) | **H7** |
| Children / guardians | Verifiable consent of a parent or lawful guardian (s.9(1), Rules 10–11); no tracking or targeted advertising (s.9(3)) | **H3** |
| Processors | A valid contract to engage a processor (s.8(2)); the contract clause on safeguards (Rule 6(1)(f)) | **H1** (6(1)(f)), **H7** (s.8(2)) |
| Retention | Erase when the purpose is served or consent is withdrawn, and have the processor erase (s.8(7)); **every** fiduciary keeps personal data, traffic data and processing logs **at least one year** from the processing, then erases them unless another law needs longer (Rule 8(3); for safeguards, Rule 6(1)(e)). **Only the Third-Schedule classes** — e-commerce entities with ≥ 2 crore registered users, online gaming intermediaries with ≥ 50 lakh, social media intermediaries with ≥ 2 crore — get the deemed-purpose period (three years of inactivity, Rule 8(1)) and must **inform the person at least forty-eight hours before** erasing (Rule 8(2)); for every other client those two sub-rules do not apply | **H7** (and H1 for log retention) |
| AI risk | Algorithmic due diligence binds a **Significant Data Fiduciary** only (Rule 13(3)) | **H4** when notified; otherwise enabling, never a status (D-073) |

**Not in the Rules — TrustStack defaults, for counsel:** the old app's
**30-day** rights-request SLA (the Rules set no separate period: requests go
through the grievance system, whose ceiling is 90 days); the breach
escalation alerts at 48 h and 12 h remaining. Each is model data, labelled
as a TrustStack target, never as statute (D-028's rule, applied to periods).

## 2. Goal

Six modules, each a tenant register with its own workflow, each joining the
platform's existing spine rather than standing beside it:

1. **Their remediation joins the ONE actions view** (D-067, D-069): a
   module that creates work adds a parent column on `gap_actions` and a new
   `ACTION_SOURCES` entry (as ROPA did, D-060) — never a second action list.
2. **Their facts feed the exposure model** (SLICE_09 §15): breach incidents →
   H2 status and the s.33(2)(c) repetition factor (0 today:
   `POSITION_FACTORS`, "Repetition — scored as 0 until breach incidents are
   recorded"); children's consent records → H3; rights and grievance SLA
   breaches → H7; processor contracts → H1/H7; retention → H7. This is a
   **model change, one minor version per stage that changes it** (Aniket,
   2026-10-10, D-079): Stage 1 → **1.1.0**, Stage 2 → **1.2.0**, Stage 3b →
   **1.3.0** (3a changes no rule), Stage 4a → **1.4.0** (4b changes no rule), Stage 5 → **1.5.0** — each in core AND a
   new migration, both mirror tests green (D-074, SLICE_09 "Stage 2 as
   built"). Counsel signs off the new rows with the rest of the model.
3. **Their headline counts join the overview** as their own section of
   `GET …/dashboard` (open requests, overdue grievances, breaches inside the
   72-hour window) — counted in core over rows a reader returned, never on
   the readiness tile (D-069).
4. **Three stakeholder reports** on the Slice 9 report store: the
   **Security & Breach Report** (CISO), the **Legal Position Report**
   (counsel: rights, grievance, notice, consent, retention) and the
   **Processor Exposure Report** (procurement) — PDF, versioned, signed,
   audited, both caveats.
5. **Their evidence links** through `evidence_links` (polymorphic, D-008):
   a new `linked_entity_type` per module, in the evidence index (Stage 4 of
   Slice 9 reads every link type; add each new one there).

## 3. Scope

**In:** the six modules' registers, workflows, public intake where the law
requires one (rights, grievance, notice, consent), RBAC/RLS/audit/sweep,
their exposure inputs (model 1.1.0 → 1.5.0, one version per stage), their overview section, the three
reports, the Sync Step.

**Out:** AI drafting of any kind — the old app's Claude-written DPBI letter,
notice generation and translation (**Slice 11**, under its guardrails);
scheduled jobs and email escalations on a timer (**Slice 13**'s job runner —
countdowns here are derived at read time, as the old app's were); payment,
WhatsApp, SMS OTP; a consent-manager integration (s.6(7)–(9)).

## 4. Decisions — recommended, for Aniket to confirm (record each in DECISIONS)

1. **Port the logic, not the schema.** The old app's tables
   (`breach_incidents`, `dsr_requests`, `grievance_complaints`, `vendors`,
   `privacy_notices`, `consent_config_versions`) are not copied. Each module
   is designed here on composite `(organization_id, id)` keys, RLS through
   the tenant helpers, D-019 grants, triggers for audit (D-027). The old
   app's pure helpers (`src/lib/dsr/sla.ts`, `src/lib/breach/countdown.ts`,
   `src/lib/vendors/risk.ts`, `questionnaire.ts`) are ported into
   `packages/core` with their tests.
2. **Processors extend the Slice 2 `vendors` table**, which the register
   already links (`ropa_vendors`) and whose `contract_exists` /
   `dpdp_clauses` the ROPA rule `processor_contract_missing` reads. A
   processor's contract becomes evidence (a stored artefact, `evidence_links`
   type `vendor`), not a URL; the old `dpa_document_url` is not ported.
3. **Public intake is RPC-only, and comes in Stage 3 (3a and 3b, D-084), not Stage 2
   (recommended).** Rights requests, grievances and consent records arrive
   from people who are not users. They reach the database through one
   SECURITY DEFINER function each, rate-limited and size-limited, never a
   table grant to `anon`, addressed by a **new** `organizations.public_slug`
   column (it does not exist today; Stage 3a's migration adds it, unique,
   set by `organization.update`). Identity for a rights request: an emailed
   one-time code (hash stored, as the old `dsr_otp` did) — Resend is already
   wired for invites (`apps/web/lib/email/send.ts`). *Made exact in §7a
   (2026-10-13): the code confirms the person controls the email address;
   Stage 2's recorded identity check is still what allows a request to be
   fulfilled.* **Stage 2 therefore ships staff-entered rights requests and
   grievances only**; Stage 3 adds every public surface — 3a the rights and
   grievance forms with the slug, rate limiting and codes, 3b the notice page
   and the consent widget on top of them (D-084).
4. **Breach facts are derived, never forged.** `dpbi_notification_due_at` =
   aware-at + 72 h is computed by the database; "notified" needs a timestamp
   and who recorded it; an extension granted by the Board (Rule 7(2)(b)) is
   recorded with its reference and moves the due time — audited.
5. **Per-stage model versions (§6; decided by Aniket 2026-10-10, D-079).**
   Each stage's migration goes to hosted when that stage is approved, and an
   applied rule can never change under the same version (D-074). So every
   stage that adds model rows bumps the minor version, in core and in its
   own new migration, with both mirror tests green: 1.1.0 (breach) · 1.2.0
   (rights and grievance) · 1.3.0 (consent and children) · 1.4.0
   (processors) · 1.5.0 (retention). Stage 6 changes no model rule. The
   positioning's repetition factor (s.33(2)(c)) becomes live in 1.1.0.
6. **The consent widget.** The old `public/consent-widget.js` (361 lines,
   22 languages in `SUPPORTED_LANGUAGES`) is ported as a static, versioned
   asset with a published config per organisation; recorded consents are
   pseudonymous (a hashed principal identifier) and append-only. Language
   **text** in all 22 needs human translation and counsel review — the
   widget ships English + Hindi + Marathi with the rest flagged "translation
   pending", never machine-translated in Slice 10.
7. **Three new report kinds** need a migration: `app.report_kinds()` and
   `reports_kind_format_check` list today's seven (migration
   `20261010000000_reports`, held by `tests/unit/report-store.test.ts`). Add
   `security_breach`, `legal_position`, `processor_exposure` (all PDF, all
   recording an exposure snapshot) in one new additive migration, mirrored
   in `REPORT_KIND_DEFINITIONS`.

## 5. What exists — build on it

| Concern | Where |
|---|---|
| The actions spine | `gap_actions` (`gap_id` XOR `ropa_gap_id`, D-060); core `ACTION_SOURCES`, `ACTION_SOURCE_LABEL`, `summariseActions`, `groupActionsByOwner`; `readRemediation` + `assessmentItems` / `ropaItems` in `lib/dashboard/read.ts` — the overview, the exposure view and every Stage 4 report read through it |
| Closing an action | `closureDecision` (core `gaps.ts`, D-056); `applyActionUpdate` in `lib/gaps/routes.ts` |
| Exposure model | core `exposure.ts` (`EXPOSURE_MAPPING`, `POSITION_FACTORS`, `exposureFor`, `directHeadsOf`), SQL mirror in `20261009000000_exposure_snapshots` (`app.exposure_evaluate`, `app.exposure_input`); mirror tests `tests/unit/exposure-mirror.test.ts`, `tests/rls/exposure-mirror.test.ts`; input reader `lib/exposure/read.ts` |
| Report store | `begin_report` / `complete_report` / `fail_report`; builders in core `reports.ts` (`ReportDocument`) and `workbooks.ts` (`ReportWorkbook`); renderers `lib/reports/pdf.ts`, `lib/reports/xlsx.ts`; one pipeline `lib/reports/generate.ts` (`buildOutput`, `Gathered`) |
| Evidence | `evidence`, `evidence_links` (three types today), the review rules (D-039, D-043); the index reader `lib/evidence/index-reader.ts` |
| Vendors, systems, departments | Slice 2 tables; `ropa_vendors`, `vendor_systems`; ROPA rule `processor_contract_missing` |
| Dates | `todayInIndia()` (D-055); a breach clock is a TIMESTAMP (hours matter), not a date |
| Email | `lib/email` (Resend, invites) |
| Exports | `defuseFormula` / `csvCell` (pitfall 9); `ropaExportHeaders` / `ropaExportRow` as the pattern for one column list per register |

## 6. Exposure model 1.1.0 → 1.5.0 — FOR ANIKET'S REVIEW (then counsel's)

New **direct** inputs (each can set a status; each is a mapping row in core
and SQL, with its provision):

| Version (stage) | Input | Head | Rule (proposed) |
|---|---|---|---|
| **1.1.0** (Stage 1) | A breach whose Board intimation is past due (72 h, or the extended time) and not recorded as made | H2 | **Exposed** |
| **1.1.0** (Stage 1) | A breach with affected Data Principals not yet intimated | H2 | can never be **Mitigated** — at best **Partially mitigated** (a cap on the status, not a status of its own) |
| **1.1.0** (Stage 1) | Breaches recorded in the last 24 months | H2 position | s.33(2)(c): 1 → +1, ≥ 2 → +2 (replaces the "0 until Slice 10" factor) |
| **1.2.0** (Stage 2) | A grievance or rights request open past 90 days | H7 | **Exposed** |
| **1.2.0** (Stage 2) | Open past the TrustStack target (30 days) but within 90 | H7 | a reason, no status (target, not statute) |
| **1.3.0** (Stage 3b) | A child's record without verifiable parental/guardian consent | H3 | as `child_consent_missing` today |
| **1.4.0** (Stage 4a) | A processor with no contract, or one without the safeguards clause | H1 (6(1)(f)), H7 (s.8(2)) | **Not Mitigated** (bars Mitigated; never Exposed on its own) — as `processor_contract_missing` today (§7b, 4a.5; D-089) |
| **1.5.0** (Stage 5) | Retention past its end with no erasure recorded | H7 | **Exposed** when > 0 |

**One version per stage, never one version across stages.** Each bump is in
core (`EXPOSURE_MODEL_VERSION`) and in that stage's own NEW migration
(`app.exposure_model_version()` plus the rows), with both mirror tests green;
an applied migration is never edited. A stored snapshot keeps the version it
was recorded under (Slice 9's "what changed" already flags a model change).
If a stage is approved with a change to its rows, the change goes into that
stage's migration before it is applied — the version does not move twice.

## 7. Stages and approval gates

| Stage | Builds | Gate: Aniket approves… |
|---|---|---|
| **1** | Breach register (incidents, Rule 7 timeline, Board extension, intimation records), its actions source, overview section; **model 1.1.0**: the breach rows + repetition, core and SQL | the register on real data + the 1.1.0 rows |
| **2** | Rights requests + grievance, **staff-entered** (decision 3), SLA (90-day ceiling, 30-day target), nomination; **model 1.2.0** (H7 rows) | the two workflows + the SLA wording + the 1.2.0 rows |
| **3a** | Public intake: `organizations.public_slug`, the published Rule 9 contact, rate limiting, emailed one-time codes, the public rights and grievance forms (§7a). **No model change** | the public forms, the codes, the abuse limits |
| **3b** | The published notice page (versioned), the consent widget (config versions, records, withdrawal); children's consent → H3, **model 1.3.0** (§7a) | the notice page, the widget + the 1.3.0 rows |
| **4a** | Processors on `vendors`: contract as evidence, the questionnaire (staff-entered) and risk (ported from `src/lib/vendors`) with the accuracy controls — complete, evidenced, consistency-checked, second-person review, attributed, frozen, current (§7b) — → H1/H7, **model 1.4.0** | the processor register, the controls + the 1.4.0 rows |
| **4b** | The vendor-facing questionnaire link: emailed token, confirmed respondent, signed declaration, server-only (§7b). **No model change** | the link, its safeguards, and that nothing counts until reviewed |
| **5** | Retention register (s.8(7), Rule 8(3); Rule 8(1)–(2) only for Third-Schedule classes) + AI risk register (H4 for an SDF only), **model 1.5.0** | both registers + the 1.5.0 rows |
| **6** | The three reports (new kinds migration), the evidence index's new link types, full test pass, Sync Step (promote SLICE_11), PR | the PR (CI green) |

At the end of every stage, before stopping:
1. Gates green locally (typecheck, unit, RLS, the stage's e2e specs and the
   specs it touched); record the counts. CI on the PR is the authority for
   the full e2e suite.
2. Commit (conventional commits) and push. **Stage 1 opens a DRAFT PR**
   (`gh pr create --draft`); later stages push to it.
3. Write **`docs/testing/SLICE_10_stageN_walkthrough.md`** (`stage3a`, `stage3b` for the split stage; what was built,
   the calls, what to approve) **and `docs/testing/SLICE_10_stageN_manual_test.md`**
   — numbered steps, each with *Do* and *Expect*, on the LOCAL stack, with
   the users, password and URL (Aniket tests by hand from it, as in
   `docs/testing/SLICE_09_stage4_manual_test.md`).
4. Update the Slice 10 tracker (⏳, last commit, counts, what to show);
   append DECISIONS; commit and push the docs.
5. Tell Aniket exactly what to review, and the one line that starts the next
   session ("Stage N approved" — e.g. "Stage 3a approved").

## 7a. Stage 3a and 3b — build brief (verified against the code 2026-10-13)

Verified on `slice/10-workflow-modules` @ `9ebf57d` (Stages 1–2 built; Stage
2 manual test passed). What exists, what does not, and the calls each stage
makes unless Aniket's opening message changes them. Each is recorded as
Claude's call in that stage's D-number and approved at its gate, as in
Stages 1–2.

**What exists — build on it**

| Concern | Where (verified) |
|---|---|
| Public API routes | `withApi({ auth: "public" })` (`lib/api/guard.ts`, `AuthMode`); `/api/v1/health` is one |
| Public pages | `middleware.ts` protects only `/dashboard*`; any other page renders signed-out |
| Email | `lib/email/send.ts` (Resend over HTTP, idempotency keys; `@example.com` suppressed, so CI sends nothing). Production sends from `notify.truststack.co.in` (STATE) |
| The rights register | `rights_requests` (Stage 2): `channel` already has `web_form`; status, clock, identity and response as built; no `anon` grant |
| Children in the model | ROPA rule `child_consent_missing` (critical, `s.9(1), Rule 10`) → H3 direct; domain `CHILDREN` → H3 |
| Organisation profile | `organizations` has no slug and no contact columns today; `organization.update` edits it (`organization-panel.tsx`) |

**What does NOT exist** — no rate-limiting anywhere in the code or the
database; no table or role for a public writer; no `public_slug`; no
published contact. Every one is new in 3a.

**Old app — port the logic (§10), never the schema:** `src/app/public/{[slug],
dsr/[slug], grievance/[slug]}` (pages), `api/dsr/{submit, otp/verify,
otp/resend}`, `lib/dsr/otp.ts`, `api/grievance/{submit, officer}` → **3a**;
`api/privacy-notice/{save, publish, [slug]}`, `api/consent/{config, versions,
record, withdraw, manage, audit, stats}`, `public/consent-widget.js` (361
lines), `db/{privacy_notices, consent_config_versions}.sql` → **3b**.
`api/privacy-notice/{generate, translate}` and `api/dsr/draft` are AI →
**Slice 11**, not ported.

### Stage 3a — public intake (no model change)

1. **`organizations.public_slug`** — nullable, unique, `^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$`,
   set by `organization.update` in the organisation panel. **No slug = no
   public surface.** An unknown slug and a tenant without one answer the SAME
   404 — slugs cannot be enumerated, and another tenant's slug never reaches
   this one. **Confirmed by Aniket 2026-10-13 (D-084).**
2. **The Rule 9 contact** — `organizations.public_contact_{name, email, phone}`
   and `public_contact_is_dpo` (a DPO only "if applicable"), set the same way;
   shown on every public page and in every email a Data Principal receives
   (Rule 9: "mention in every response"). Public intake is closed until it is set.
3. **The public writer is RPC-only** (decision 3): a public route
   (`auth: "public"`) calls ONE `SECURITY DEFINER` function per action with the
   **anon** key — never the service-role key. `anon` gets EXECUTE on those
   functions and nothing on any table (CI already fails on any anon table grant).
4. **Rate limiting in the database** (Vercel functions share no memory):
   an `intake_attempts` table with no user grants, keyed by organisation,
   surface and a hash of the client address (the route passes
   `sha256(ip + a server secret)`, never the address). Recommended limits —
   5 submissions per hour per address per tenant per form; 3 codes per hour
   and 10 per day per email address; 5 wrong code entries per submission.
   Over the limit → 429 with a plain message. Text sizes capped by CHECK and
   Zod, as in Stage 2.
5. **Emailed one-time codes** (old `dsr_otp`): 6 digits, only a hash stored,
   10 minutes, single use, 5 attempts. **A code proves control of the email
   address — not identity under Rule 14**: staff still record the identity
   check (Stage 2's rule stands). An unconfirmed submission is held in a
   separate `intake_submissions` table and never enters the register; it
   expires after 24 hours (Slice 13's job purges it). **On confirmation** the
   RPC creates the `rights_requests` row (`channel = web_form`, created_by
   null, audited as the public intake) with **`received_on` = the day it was
   SUBMITTED in India** — receipt, not confirmation, starts the ninety days.
   **Confirmed by Aniket 2026-10-13 (D-084).**
6. **The forms**: `/p/{slug}/rights` (the six request kinds, nomination with
   its nominee) and `/p/{slug}/grievance` (optionally naming an earlier
   request by code). Each asks only what Stage 2's register records, says
   who it goes to (the Rule 9 contact) and the ninety days, and ends with the
   code and an acknowledgement email carrying the request code and the
   respond-by date.
7. **Gate 5 for public surfaces**: a slug answers for its own tenant only;
   no response ever carries another tenant's name or data; the RPCs refuse a
   submission whose organisation does not match the slug; rate-limit and size
   tests; abuse tests (no anon table grant, no enumeration, replayed and
   expired codes refused). The authenticated register shows a web-form
   request like any other, labelled "Web form".
8. **Not in 3a**: the notice page and the consent widget (3b); SMS or
   WhatsApp codes (out of scope, §3); a captcha (not needed at these limits —
   revisit if abuse is seen).

### Stage 3b — the notice page, the consent widget, children's consent (model 1.3.0)

1. **Versioned notice** (s.5, Rule 3): `privacy_notices` — per organisation,
   version and language, structured to Rule 3(b)–(c): the itemised personal
   data, each purpose with its goods, services or uses, and the means to
   withdraw consent, exercise rights (links to 3a's forms) and complain to the
   Board. Written by staff (no AI, Slice 11); **a published version is
   immutable**; the public page `/p/{slug}/notice` shows the latest published
   version; older versions stay readable by staff.
2. **The consent widget** (decision 6): the old `consent-widget.js` ported as
   a static, versioned asset (`/widget/consent-v1.js`) reading a published
   **config version** (purposes, each linked to the notice version it cites;
   languages). English, Hindi and Marathi text; every other language shown as
   "translation pending", never machine-translated.
3. **Consent records** (s.6): append-only; a pseudonymous principal key
   (`sha256(organisation salt + the identifier the client supplies)`), the
   config version, purposes given, given or withdrawn, the time. **Withdrawal
   is a new record** — as easy as giving (s.6(4)), from the same widget.
4. **Children and guardians** (s.9(1), Rules 10–11): a record may be marked
   as a child's (or a person with disability with a lawful guardian); it then
   carries how the parent or guardian was verified — **Rule 10(1)(a)** reliable
   details already held, **10(1)(b)(i)** details given by the individual,
   **10(1)(b)(ii)** a virtual token (e.g. DigiLocker) — or nothing.
5. **Model 1.3.0** — the §6 row, made exact: `child_consent_unverified` on
   **H3**, provision "s.9(1), Rules 10–11", effect **`exposed`** (as the
   critical ROPA rule `child_consent_missing` already makes H3 Exposed): the
   number of principals whose LATEST record is a child's or a guardian's
   consent, still given, with no verification method recorded. Reason text,
   like the others, one and `{n}`. A withdrawn consent counts nothing. 1.3.0
   in core and in 3b's own migration, both mirror tests green.

## 7b. Stage 4a and 4b — build brief (verified against the code 2026-10-13)

Verified on `slice/10-workflow-modules` @ `36de5e7` (Stages 1–3b built; 3b's
manual test passed). Like §7a: what exists, what does not, and the calls each
stage makes **unless Aniket's opening message changes them** — each recorded
as Claude's call in that stage's D-number and approved at its gate.

**Settled by Aniket 2026-10-13 (D-089):** Stage 4 is **split** like Stage 3 —
**4a** the processor register, the questionnaire entered by STAFF, its
accuracy controls and model **1.4.0**; **4b** the vendor-facing questionnaire
link (a public surface, no model change). The **accuracy controls (4a.4) are
required** — for answers entered by staff and, in 4b, by a vendor.

**What exists — build on it**

| Concern | Where (verified) |
|---|---|
| The vendor register | `vendors` (migration `20260915100000_scope_wizard`): `name`, `service`, `vendor_role` (`data_processor` · `independent` · `unknown`), tri-states `contract_exists`, `dpdp_clauses`, `cross_border`, `sub_processors_known`; `vendor_systems`. Routes `GET·POST /organizations/{id}/vendors`, `PATCH·DELETE …/vendors/{vendorId}` (`lib/scope/registers.ts`); edited in the scope wizard (`app/dashboard/scope/scope-wizard.tsx`); `organization_scopes.uses_data_processors` gates it |
| The register's contract rule | `ropa_vendors`; `app.ropa_vendor_contract_gaps()` (migration `20261004000000_ropa_dpdp_structure`) counts LINKED vendors that are not `independent` with `contract_exists <> 'yes' OR dpdp_clauses <> 'yes'` → `ropa_records.vendor_contract_gaps` → ROPA rule `processor_contract_missing` (high) → `EXPOSURE_MAPPING.registerRules` direct on **H1 (Rule 6(1)(f))** and **H7 (s.8(2))**. It fires only for a vendor linked to a record, and only once the register's gaps are generated |
| The Compass domain | `VENDOR` direct on H1 (s.8(5), Rule 6(1)(f)) and H7 (s.8(2)) |
| Evidence | `evidence_links.linked_entity_type` CHECK = `assessment_response`, `gap_action`, `ropa_record` (migration `20261003000000_ropa`); the index reader `lib/evidence/index-reader.ts` |
| Seed | MU: LMS provider (contract yes, DPDP clauses **no**), payment gateway (yes/yes), AI proctoring vendor (yes, clauses **unknown**) — three; BML: payroll bureau (yes/yes). **So 1.4.0 changes MU's heads 1 and 7** — say so in the walk-through; e2e that pins MU's H1/H7 will move |
| Old app (port the logic, never the schema) | `src/lib/vendors/risk.ts` (93 lines: weighted answers, risk 0–100, higher = riskier; tiers ≤25 low · ≤50 medium · ≤75 high · >75 critical), `questionnaire.ts` (161: sections A Company · B Data handling · C Security · D Sub-processors · E Residency · F Incident · G DPDP; question types yes_no, yes_no_partial (partial = half), select with per-option risk, text = weight 0), `status.ts`, `dpa.ts`; routes `api/vendors/{route, [id], [id]/dpa, [id]/send-questionnaire, questionnaire/[token], questionnaire/submit, stats}`; page `src/app/public/vendor-questionnaire`; `db/vendors.sql` |

### Stage 4a — the processor register, the questionnaire, its controls (model 1.4.0)

1. **Processors are `vendors`** (decision 2): additive columns on `vendors`
   for the contract — signed on, review by — and the facts the model reads stay
   the existing tri-states. No second vendor table.
2. **The contract is evidence**, not a URL: 4a's migration widens the
   `evidence_links` CHECK with **`vendor`** (decision 2 names it), so a
   contract — and the certificates the questionnaire asks for — can be attached
   now; the evidence index learns to read the type in Stage 6 with the others.
   The old `dpa_document_url` is not ported.
3. **The questionnaire** — the old bank ported as DATA in core (codes,
   sections A–G, types, weights, risky answer, and which answers need a
   document), answers in a new tenant table, the risk score **derived by the
   database** and mirrored in core (as the scoring engine is). The score is
   **TrustStack's indicator, never statute and never a status** (pitfall 1).
   **Entered by staff** in 4a. **Every assessment records its source** —
   `staff`, with who entered it and where the answers came from (e.g. "the
   vendor's email of 3 Oct 2026"); 4b adds `vendor`. Designed so 4b adds a
   source, not a second table.
4. **Accuracy controls (required, D-089).** No software proves a vendor is
   truthful; these make every answer complete, evidenced, checked, reviewed,
   attributed and current — whoever entered it:
   1. **Complete** — an assessment is SUBMITTED only when every scored
      question is answered or marked "not applicable" with a reason; the
      DATABASE refuses an incomplete submission (its submit function or a
      CHECK), not only the form. A draft may be partial.
   2. **Evidence-backed** — questions the bank marks as needing a document
      (e.g. ISO 27001 certificate, SOC 2 report, the signed contract with DPDP
      clauses, the sub-processor list, a penetration-test summary) score as the
      **risky answer — "claimed, no evidence"** until a document is attached to
      the vendor (`evidence_links` type `vendor`), mirroring the Compass's
      evidence cap (Slice 4). The screen says so plainly.
   3. **Consistency checks** — contradictions with the register are FLAGGED
      for the reviewer, never silently resolved: e.g. "data stored in India:
      yes" against the vendor's `cross_border = yes`; "no sub-processors"
      against `sub_processors_known = no`; "contract with DPDP clauses: yes"
      against `dpdp_clauses <> 'yes'`. The rules are data in core; the
      reviewer sees each one.
   4. **Reviewed by a second person** — a submitted assessment counts (its
      score is the vendor's, its facts are read anywhere) only once
      **accepted** by someone holding the review permission who is **not the
      person who entered it** (D-043's rule, applied here). The reviewer may
      **return** it with a reason. Who reviewed, and when, is stamped by the
      database.
   5. **Attributed** — who entered it, the stated source, who reviewed it, and
      when: stamped, never sent by the client; audited without free text.
   6. **Frozen once accepted** — an accepted assessment never changes; a
      correction or a re-assessment is a **new version**, and every version
      stays readable (as a published notice in 3b).
   7. **Current** — each accepted assessment carries a **review-by date**
      (default twelve months — a TrustStack default, labelled so, never
      statute); after it the vendor shows **"Assessment out of date"** on its
      page and in the register's counts, and the model gives it as a **reason,
      never a status**.
5. **Model 1.4.0 — §6's row, made exact:** a module input
   `vendor_contract_missing` on **H1 (Rule 6(1)(f))** and **H7 (s.8(2))**,
   counting vendors whose role is **not `independent`** (unknown counts, D-026)
   with `contract_exists <> 'yes' OR dpdp_clauses <> 'yes'` — the same test as
   `app.ropa_vendor_contract_gaps()`, but over the whole vendor register,
   linked to a record or not. **Effect: `not_mitigated` — settled by Aniket
   2026-10-13 (D-089 addendum):** it bars Mitigated and does not set Exposed,
   as the register rule (*high*, not critical) does today. An out-of-date assessment (4a.4.7) is a `reason` row. 1.4.0 in
   core and in 4a's own migration, both mirror tests green; the generator gains
   vendors. **It changes MU's heads 1 and 7** (two seeded processors have
   gaps) — update the pins and say so in the walk-through.
6. **Permissions** (a matrix change, core + migration, D-020): reading with the
   vendor register's readers; entering and submitting an assessment with the
   register writers; **accepting or returning** one needs a new review
   permission — proposed for the programme leads, Procurement and Legal.
7. **Remediation**: a vendor's fix is the register's (record the contract,
   attach it, re-assess) — no fifth action parent unless the build shows a
   need; say so.
8. **Seed**: for one MU processor an ACCEPTED assessment (with its contract as
   evidence), for another a SUBMITTED one awaiting review — so the manual test
   shows both, and the second-person rule.
9. **Not in 4a**: the vendor-facing link (4b); the reports (Stage 6); AI review
   of a contract (Slice 11); reminder emails on a timer (Slice 13).

### Stage 4b — the vendor-facing questionnaire link (no model change)

**Verified against the 4a code on 2026-10-14** (`slice/10-workflow-modules`,
migration `20261015000000_processor_register`; D-091). What exists:
`vendor_assessments` (`source` CHECK `IN ('staff')`, `created_by`,
`submitted_by`, the stamps, `unevidenced`, `review_by`) and
`vendor_assessment_answers` (`answered_by`, `evidence_id`), SELECT-only for
members; the five staff functions (`start_` / `save_` / `submit_` /
`review_` / `discard_vendor_assessment`), each requiring a signed-in caller
with `vendor.assess` / `vendor.review`; the guard triggers (frozen once
accepted, answers change only while draft or returned); the score
(`app.vendor_assessment_risk`) and completeness (`app.vendor_assessment_missing`);
`evidence_links` type `vendor`. From 3a: `intake_submissions` /
`intake_attempts`, the emailed one-time code, the limits in the database, the
one door `lib/intake/rpc.ts` (service role), the signed-out `/p/[slug]` pages,
Resend in `lib/email/send.ts`. `audit_logs.user_id` and `evidence.uploaded_by`
are nullable.

1. **Same questionnaire, same controls — a source, not a second table.** 4b's
   migration widens `vendor_assessments_source_check` to `('staff', 'vendor')`
   and core `VENDOR_ASSESSMENT_SOURCES`. A vendor's answers land in the SAME
   rows; `app.vendor_assessment_missing` and `app.vendor_assessment_risk` are
   reused unchanged; **nothing a vendor submits counts until a person in the
   organisation accepts it** (`review_vendor_assessment`, unchanged). Staff can
   still enter answers themselves on the same draft when a vendor does not respond.
2. **The link** — a new table `vendor_assessment_links` (one per draft
   assessment at a time): `token_hash` only (as `intake_submissions` keeps the
   code's hash), `respondent_name`, `respondent_email`, `expires_at` (14 days),
   `revoked_at`, `confirmed_at`, `created_by`. A staff function
   `send_vendor_link` (`vendor.assess`; the assessment must be a draft or
   returned) issues it and emails it through Resend; `revoke_vendor_link`
   ends it. Starting a link sets the assessment's `source` to `vendor`.
3. **The respondent's email is confirmed** with a one-time code (3a's pattern
   and limits, a new surface in `intake_attempts`), then they **sign a
   declaration** — "These answers are accurate and complete", their name, role
   and the date — stored on the assessment (new columns `declared_name`,
   `declared_role`, `declared_at`; a CHECK: a `vendor` submission carries one).
4. **Server-only**: `vendor_link_open`, `vendor_link_confirm`,
   `vendor_link_save`, `vendor_link_submit` — `service_role` only, through
   `lib/intake/rpc.ts` (D-086.1, D-087); each re-checks the token, its expiry
   and revocation, and that the assessment is still a draft or returned. The
   page (e.g. `/v/[token]`) is signed-out, `noindex`, outside the dashboard
   middleware; an unknown, expired or revoked link is the SAME 404.
5. **Attribution, made exact for a vendor**: their answers carry
   `answered_by = NULL` with the assessment's `source = 'vendor'` and the
   declaration; `submitted_by` is NULL and `submitted_at` stamped. **Settled by
   Aniket 2026-10-14 (D-092): the link's sender may not review the vendor's
   answers** — whether or not they answered anything (built as D-093.1: any
   link for that version, open or not). Audit rows for vendor steps have `user_id NULL`
   and say "by the vendor's respondent", never their name or email.
6. **Documents a vendor uploads**: the evidence bucket's INSERT policy signs an
   upload only for a path registered to its uploader (D-042), so the server
   registers the `evidence` row (`uploaded_by` NULL) and mints the signed URL
   with the service role, then links it to the vendor (`evidence_links` type
   `vendor`) — pending review, never visible to another vendor or tenant. The
   link's own function, not a table grant, does it.
7. **Not in 4b**: reminders on a timer (Slice 13); a vendor portal or account;
   AI review of a vendor's answers (Slice 11). **No model change** — the model
   reads the register, not who typed the answers.

## 7c. Stage 5 — build brief (verified against the code 2026-10-14)

Verified on `slice/10-workflow-modules` @ the Stage 4b commit (Stages 1–4b
built; 4b at its gate; migrations to `20261016000000_vendor_link`). Like §7a
and §7b: what exists, what does not, and the calls the stage makes **unless
Aniket's opening message changes them** — each recorded as Claude's call in
Stage 5's D-number and approved at its gate. **Model 1.5.0** in core and in
Stage 5's own new migration (`20261017000000_retention_ai_risk`).

**What exists — build on it**

| Concern | Where (verified) |
|---|---|
| Retention facts today | `ropa_records.retention_rule` (free text), `retention_trigger`, `retention_law` (D-065); core `ropa.ts` rule **`retention_missing`** ("Retention or erasure undecided", high) → `EXPOSURE_MAPPING.registerRules` direct on **H7 (s.8(7), Rule 8)** — fires only on a generated ROPA gap. Nothing records a retention END date or an ERASURE |
| AI facts today | `systems.system_type` (`SYSTEM_TYPES`, incl. `ai`); `organization_scopes.ai_usage_types` (`AI_USAGE_TYPES`: proctoring, chatbot, analytics, scoring, recommendation, none); `ropa_records.ai_processing`; ROPA rule **`ai_unreviewed`** → **H4 (Rule 13(3))**; head 4 **applies only when an SDF notification is recorded** (`organizations.sdf_notified_on`, `exposure.ts` `headApplies` "H4"; D-028, D-073) |
| The model | core `exposure.ts` 1.4.0 (`MODULE_INPUTS`, `ExposureVendorInput`); SQL `app.exposure_module_inputs()` (9 rows), `app.exposure_evaluate_head`, `app.exposure_input` — all last replaced in `20261015000000_processor_register` (4b changed none); mirror tests `tests/unit/exposure-mirror.test.ts`, `tests/rls/exposure-mirror.test.ts`, generator carrying breaches, rights, consents, vendors |
| The actions spine | `gap_actions` parents `gap_id` · `ropa_gap_id` · `breach_incident_id` · `rights_request_id`; core `ACTION_SOURCES` = assessment, ropa, breach, rights (`dashboard.ts`); `readRemediation` in `lib/dashboard/read.ts` |
| Patterns to copy | a register with SECURITY DEFINER writers and stamps (4a, `vendor_assessments`); a register with derived dates in India (`rights_requests.respond_by`, `todayInIndia()`); evidence by link type (`evidence_links` CHECK, widened per stage — Stage 6 teaches the index) |
| Old app | **no retention or AI-risk module** (SLICE_10 §10 lists none) — designed here, nothing to port |

**Calls Stage 5 makes (recommended — Aniket may change any in his opening message)**

1. **The retention register is a schedule per ROPA record**, not free text: a
   new tenant table (e.g. `retention_schedules`) keyed to `ropa_records`
   (composite FK) — what ends the retention (purpose served · consent
   withdrawn · a fixed period · a law that requires keeping it, with the law
   named), the period, the **end date derived by the database** in India, and
   **erasure records** (when, by whom, how, the processor told — s.8(7)(b)) as
   append-only rows. The ROPA free-text fields stay as they are.
2. **Rule 8(3) is a floor for every client**: personal data, traffic data and
   processing logs kept **at least one year** from the processing — a schedule
   shorter than one year for logs is refused by a CHECK, with the rule cited.
3. **Rule 8(1)–(2) only for the Third-Schedule classes** (§1): a new
   organisation fact (e.g. `third_schedule_class`, `organization.update`, none
   by default) — only then do the deemed three-year period and the 48-hour
   notice before erasure appear. **Never inferred** from size or sector
   (pitfall 1; D-028's rule for SDF status applies by analogy).
4. **Model 1.5.0 — §6's row, made exact**: a module input
   `retention_overdue` on **H7 (s.8(7), Rule 8)** — schedules past their end
   date with **no erasure recorded** — **Exposed** when > 0, as §6 says. Ask
   at the gate whether a schedule with **no end recorded** is a `reason` (as
   the 30-day rights target is) or nothing. The ROPA `retention_missing` rule
   is unchanged.
5. **Overdue erasure is work**: a fifth action parent
   (`gap_actions.retention_schedule_id`, `ACTION_SOURCES` + `retention`,
   "Retention register") — one actions view (D-067); closing it needs an
   erasure record or a reviewer who is not its owner (D-056's rule).
6. **The AI risk register is enabling, never a status** (D-073): one row per AI
   system (`systems.system_type = 'ai'`) or AI use (`ai_usage_types`) — purpose,
   the personal data it uses, whether it affects children (s.9(3)), the
   human-review step, the last review — with **no model row** unless head 4
   applies (an SDF notification recorded), and then only as Rule 13(3)'s
   algorithmic due diligence: an unreviewed AI system is a **reason** on H4,
   never Exposed on its own. Recommend: no action parent (its fixes are the
   register's).
7. **Permissions** (core + migration, D-020): `retention.read` /
   `retention.write` like `rights.*` (ten / eight roles); AI risk read by
   members, written with `ropa.write` (or a new `ai_risk.write` — say which at
   the gate).
8. **Evidence**: link types `retention_schedule` (the erasure certificate) and
   `ai_system` widened in the CHECK; the index reads them in Stage 6.
9. **Seed**: MU — schedules for its ten ROPA records (one past its end with no
   erasure → H7 Exposed on MU, **say so in the walk-through**: e2e pinning
   MU's H7 status will move), one erasure recorded; the AI proctoring system in
   the AI register (MU is not an SDF: no H4 effect). BML's empty state.
10. **Not in Stage 5**: an automated erasure job (Slice 13's runner); AI
    drafting of retention policies (Slice 11); the reports (Stage 6).

## 7d. Stage 6 — build brief (verified against the code 2026-10-14)

Verified on `slice/10-workflow-modules` @ the Stage 5 commits (Stages 1–5
built; 5 at its gate; migrations to `20261017000000_retention_ai_risk`, model
**1.5.0**). Stage 6 **changes no model rule** (D-079.6) — exposure stays 1.5.0.
*Superseded at the gate (2026-10-16, D-098): Aniket asked for one change —
a recorded, non-dismissed breach makes head 2 assessed — built as model
**1.6.0** inside Stage 6's migration.*
Its own migration: `20261018000000_slice10_reports`. **If Aniket approves Stage 5
"with changes: R1–R6" (or a subset)**, those changes — specified exactly in
`docs/testing/SLICE_10_stage5_walkthrough.md` §9 — are applied FIRST, inside
`20261017000000_retention_ai_risk`, CI green, then that migration to hosted;
only then does this brief start (STATE, "To start Stage 6").

**Re-synced 2026-10-16 — R1–R6 approved and applied (D-096).** What Stage 6
reads changed shape: each erasure in `readRetention` carries `standing`
(`counts` · `incomplete` · `voided`) and `void` (reason, who, when); a schedule
carries `erasureIncomplete`; `lastErasedOn` is the latest erasure that COUNTS.
A new table `retention_erasure_voids` (no evidence link type — nothing attaches
to a void). The AI register reads `childTracking`, `childExemption`,
`childExemptionLabel` and `childTrackingUnexempt` (no more `affectsChildren`)
and is read with `ropa.read`. The dashboard payload has a `retention` section
(`countRetention` + the overdue list; `omitted` gains `retention`). The
`legal_position` report should say an erasure counts only when complete and
not voided, and may count AI systems tracking children with no exemption — as
an enabling note, never a status.

**What exists — build on it**

| Concern | Where (verified) |
|---|---|
| Report kinds | core `REPORT_KINDS` (7) and `REPORT_KIND_DEFINITIONS`; SQL `app.report_kinds()` in `20261010000000_reports` (`VALUES` of kind, format, records_exposure, per_owner, file_slug) and the `reports_kind_format_check`; held by `tests/unit/report-store.test.ts` |
| Report pipeline | builders in core `reports.ts` (`ReportDocument`) / `workbooks.ts`; renderers `lib/reports/pdf.ts`, `xlsx.ts`; one pipeline `lib/reports/generate.ts` (`buildOutput`, `Gathered`); remediation lines `lib/reports/inputs.ts` (`readRemediationLines` — already carries breach, rights and retention lines) |
| The registers' readers | `readBreaches` (`lib/breach/shape.ts`), `readRights` (`lib/rights/shape.ts`), the consent register (`lib/consent/shape.ts`), the processor register (`lib/vendors/shape.ts`), `readRetention` (`lib/retention/shape.ts`), `readAiSystems` (`lib/ai-risk/shape.ts`) |
| Evidence link types | the CHECK allows `assessment_response`, `gap_action`, `ropa_record`, `vendor`, `retention_schedule`, `ai_system` (Stage 5). **`breach_incident` and `rights_request` were deferred here** (D-081.13, D-083). The index reader `lib/evidence/index-reader.ts` reads only the first three |
| Closure bases | `evidence`, `reviewer_approval`, `erasure_recorded` (D-095.7) — the evidence pack's tiles already handle all three |

**Calls Stage 6 makes (recommended — Aniket may change any in his opening message)**

1. **Three report kinds**, all PDF, all recording an exposure snapshot (§4.7):
   `security_breach` (CISO — the breach register, the Rule 7 clocks, the H2
   position), `legal_position` (counsel — rights and grievance, notice and
   consent, retention, the H3/H7 positions; the AI register only as an
   enabling note), `processor_exposure` (procurement — the processor register,
   assessments, contract gaps, H1/H7). One migration widening
   `app.report_kinds()` and the CHECK; mirrored in `REPORT_KIND_DEFINITIONS`;
   both caveats verbatim; no bank internals; nothing University-specific.
2. **Two deferred link types** — `breach_incident` (incident evidence: the Board
   report, the intimations) and `rights_request` (the response sent) — added to
   the CHECK and the link trigger (breach.write, rights.write).
3. **The evidence index** reads every link type: vendor, retention schedule, AI
   system, breach, request — each named as its register names it, never a
   person's personal data.
4. **Full test pass** (gates on the local stack and CI green), the Sync Step —
   **promote SLICE_11** from stub to full prompt — and PR #28 marked ready for
   review (the merge is Aniket's).

## 8. Tests (every stage, for its module)

Mapping complete (every new input classified, every direct row cites a
provision) · SQL ↔ core mirror for that stage's version · status and factor boundaries
(72 h exactly, 90 days exactly, the extension) · clocks in India for dates
and UTC timestamps for hours · public intake: rate limit, size limit, no
`anon` table grant, another tenant's slug never reaches this one · gate 5 on
every route and RPC (API **and** RLS), sweep probes · audit for every write
· the module's actions in the one actions view, labelled by source · its
evidence in the evidence index · its overview section on BML's empty state ·
the reports' caveats verbatim, no bank internals, nothing
University-specific.

## 9. Known pitfalls

1. **Never present a TrustStack target as statute.** 30 days is ours; 90 days
   and 72 hours are the Rules'.
2. **A breach clock is hours, in UTC, shown in IST.** `todayInIndia()` is for
   dates only.
3. **The model is in two places** (core and SQL). Each stage bumps the minor
   version in both, in its own new migration — never edit an applied one.
4. **No AI in this slice.** The old app's DPBI letter and notice drafting
   used Claude; they wait for Slice 11's guardrails.
5. **Public endpoints are attack surface**: RPC-only, rate-limited, logged;
   a Data Principal's name, email and phone are personal data with their own
   retention (Slice 13's purge job).
6. **One actions view** (D-067). A module that keeps its own task list has
   broken the product's promise.
7. Carried from Slice 9: new route ⇒ sweep probe; migration ⇒
   `pnpm db:types`; e2e name prefixes and disposable tenant ids (`…a00c`,
   `…a00d` taken by `e2e/api/report-packs.spec.ts`; `…a00e` onwards free);
   never `auth.signOut()` without `{ scope: "local" }`; reports and snapshots
   are permanent — generate them only on disposable tenants in e2e.

## 10. Source inventory (old app, for Slice 13's decommission)

`aniketmhala/dpdp` → `truststack-platform/src/app/api/{privacy-notice,
consent, dsr, grievance, vendors, breach}` (≈ 3,360 lines of routes),
`src/lib/{breach, dsr, vendors}` (≈ 865 lines), `public/consent-widget.js`,
`db/{breach_incidents, dsr_requests, vendors, privacy_notices,
consent_config_versions, fix_grievance_reference_unique}.sql`. Each stage
records in STATE which of these it replaced; Slice 13 confirms nothing is
left behind.
