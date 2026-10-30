# SLICE 9 — TrustStack Intelligence: penalty exposure, forecasts and executive reports

**Branch:** `slice/09-intelligence` · **Est:** 3 sessions, in 4 stages, each
ending at an approval gate · **Week:** 13–14 ·
**Ships:** the reporting system Aniket approved on 2026-10-04
(`docs/proposals/INTELLIGENT_REPORTING_PROPOSAL.md`, decisions 0–5 all
"yes"). Every client in every sector sees how close it is to a DPDP penalty,
where it sits within the statutory ceiling and why, whether it will be ready
by 13 May 2027 at its current pace, and which actions retire the most
exposure. It ships as a live **Exposure Command Centre** plus stored,
versioned reports for the Board, the DPO, each action owner and an auditor,
and three working spreadsheets. **Slice 9 = commercially sellable**
(SLICES.md).

> **STATUS: ✅ COMPLETE — all four stages approved; merged as PR #25
> (`a691d88`) on 2026-10-08 and deployed (D-078, D-079). Do not run a session
> from this file; the next slice is `SLICE_10_workflow_modules.md`.**
>
> **(History) APPROVED by Aniket 2026-10-04** (§4 decisions and the rechecked
> §6 mapping). Slice 8 merged (`f5986f1`) with both migrations on hosted. Rewritten 2026-10-04 against the
> Slice 8 branch (PR #23, with D-071). It replaces the earlier "reports from
> the snapshot" prompt: the maturity scorecard is now an appendix, not the
> product. Every path, reader and symbol named below exists on that branch.
> If anything has drifted since, the code wins.

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. **D-011, D-026, D-028,
   D-035, D-038, D-040, D-042, D-046, D-050, D-052, D-053, D-055, D-058,
   D-061, D-062, D-067, D-068, D-069, D-070, D-071**), the proposal above,
   this file, and the Act's **Schedule, s.8, s.9, s.10, s.28, s.32, s.33 and
   s.37** in `docs/legal/DPDP_Act_2023.pdf` (`pdftotext -layout` works on
   the laptop).
2. **Find your stage** in the "Slice 9 tracker" at the top of
   `docs/STATE.md`. Statuses: 🔲 not started · ⏳ built, awaiting approval ·
   ✅ approved.
   - If a stage is ⏳, Aniket's message starting this session must approve
     it (e.g. "Stage 1 approved", or approved with changes). Mark it ✅ in
     the tracker, with the date and any changes he asked for, apply those
     changes FIRST, then run the next stage. If his message does not approve
     it, ask before writing any code.
   - Otherwise, run the first 🔲 stage.
   (Slice 8's prerequisites are done: PR #23 merged as `f5986f1`, both
   migrations on hosted.)
3. **Branch:**
   - **Stage 1:** `git checkout main && git pull && git checkout -b slice/09-intelligence`.
   - **Stages 2–4:** `git checkout slice/09-intelligence && git pull`. Never
     create another branch. If `main` moved since the last stage, merge it in
     (`git merge origin/main`) and re-run the gates.
4. `pnpm install && pnpm typecheck && pnpm test:unit && pnpm test:rls` green.
   Docker running. Baseline before Stage 1 (Slice 8 final, local stack):
   core **787**, web unit **349**, RLS **312**, e2e **209**. Later stages
   start from the numbers the tracker recorded. **Stop any `pnpm dev`
   first.**
5. **Develop against the local Supabase stack**, exactly as Slices 7 and 8
   did: `npx -y supabase@2.117.0 start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit`,
   export its URLs and keys plus CI's `SEED_USER_PASSWORD` and
   `ACTIVE_ORG_COOKIE_SECRET`. No `psql` on the laptop:
   `docker exec -i supabase_db_truststack psql -U postgres -d postgres`.
6. **The hosted project serves the LIVE site** (CLAUDE.md, D-071). Apply a
   migration before merge only if it is purely additive. Anything that
   revokes, narrows or drops goes on right after the production deploy.
7. Nothing may be University-specific (D-040). Every stage is demonstrated
   on MU **and** on a second sector (a disposable `healthcare` or `general`
   tenant with a different scope), and on BML's empty state.
8. **One stage per session. Stop at its approval gate (§12)** and show
   Aniket the result. Do not start the next stage in the same session. Do
   not merge the PR unless Aniket explicitly says so.

## 1. DPDP anchoring

- **The Schedule (s.33(1))** sets seven penalty heads with ceilings ("may
  extend to"). The Data Protection Board imposes one only after an inquiry
  (s.28) finds a breach *significant*, weighing **s.33(2)(a)–(g)**: nature,
  gravity and duration; type of data; repetition; gain or loss avoided;
  mitigation and its timeliness; proportionality; impact on the person.
- **s.32**: a voluntary undertaking can end proceedings. Breaching one is
  itself penalised (head 6).
- **s.37**: after penalties in **two or more instances**, the Central
  Government may direct that public access to the service be **blocked**.
- **Commencement**: Rule 4 from **13 Nov 2026**; Rules 3, 5–16, 22, 23 from
  **13 May 2027** (STATE, "The clock"). **Counsel to confirm** which Act
  sections each head's obligations take effect from. Until then the model
  uses 13 May 2027 for heads 1–4 and 7, and says so.
- Everything here is a **readiness** view (D-011): never "compliant", never
  a prediction of any Board decision, never an SDF inference (D-028).

## 2. Goal

1. **The exposure model, as data**: the seven heads, their ceilings and
   statutory references, the mapping of Compass domains and register gap
   rules to heads (§6), the status rules and the positioning factors.
   Versioned (`EXPOSURE_MODEL_VERSION = "1.0.0"`), counsel-reviewable,
   mirrored in SQL.
2. **The exposure engine**: for one organisation, per head — applies?,
   status, indicative position within the ceiling and the reasons, the
   deadline. Plus the headline "statutory ceilings where you are exposed",
   and the s.37 flag.
3. **Intelligence**: deadline forecast with a range, leverage ranking (the
   actions that retire the most exposure), a what-if, slippage warnings,
   and "what changed" since the last snapshot.
4. **Exposure history**: stored snapshots, so exposure can be tracked over
   time, and so every report records the exposure it was based on.
5. **Exposure Command Centre** (`/dashboard/exposure`), and an exposure
   strip at the top of the Slice 8 overview.
6. **The report store**: versioned, per-tenant storage, signed and audited
   downloads, the D-011 caveat plus the exposure caveat on every output.
7. **Five flagship outputs**: the **DPDP Exposure Brief** (Board, 1-page
   PDF), the **Programme Status Report** (DPO, PDF, with the maturity
   scorecard as an appendix), the **Owner Action Pack** (per owner, PDF),
   the **Regulator-Ready Evidence Pack** (PDF summary + XLSX index), and
   **three exports** (Gap & Action Tracker XLSX, ROPA Register XLSX,
   Evidence Index XLSX, the last shared with the evidence pack).

## 3. Scope

**In:** everything in §2; the organisation's SDF-notification fields
(§4.4); RBAC, RLS, audit and route-sweep coverage for all of it; the Sync
Step.

**Out (phased, proposal §6):** the Security & Breach, Legal Position and
Processor Exposure reports, and breach/rights/grievance inputs (Slice 10);
AI narration (Slice 11); cross-cycle trends (Slice 12); scheduled email
delivery, evidence-decay predictions and weekly automatic snapshots
(Slice 13); portfolio view and opt-in benchmarks (Slice 14); DOCX (decision
3: only if asked).

## 4. Decisions — recommended here, for Aniket to confirm (record each in DECISIONS)

1. **Where the exposure numbers are computed.** As with the score (D-053):
   the **live** view computes in `packages/core` (fast, testable); a
   **stored** exposure snapshot is computed **in SQL** by one SECURITY
   DEFINER RPC that takes an organisation id and nothing else, so a client
   can never store numbers it chose (D-052's reason). A unit test parses
   the migration and fails if the SQL and core disagree on the heads, the
   mapping, the thresholds, the factor points or the model version.
2. **Which assessment feeds the model.** The same rule as the overview
   (`pickAssessments`, D-069.1): the newest finalised snapshot when one
   exists. Otherwise the live, provisional score, and every output then says
   "provisional". With no assessment at all, only the register and the scope
   feed it, and every head is "not yet assessed".
3. **"Not yet assessed" counts as exposed** in the headline ceilings, as
   "unknown" counts as risk everywhere else (D-026). Silence is not
   mitigation. Shown with its own label, never as "Exposed".
4. **SDF status is entered, never inferred** (D-028). New columns
   `organizations.sdf_notified_on date` and
   `organizations.sdf_notification_ref text`, set by
   `organization.update` holders and audited. Null means head 4 does not
   apply. The scope's internal triggers may say "enhanced review" (as
   today), and may never set this.
5. **The rupee band (decision 1 = yes)**: thirds of the ceiling, rounded to
   whole crore (e.g. "₹167–250 crore" for head 1's upper third), shown only
   when the status is Exposed, Partially mitigated or Not yet assessed, and
   always with its reasons. Never summed into a single predicted fine. The
   headline sums CEILINGS, labelled as ceilings.
6. **Forecast method (decision 4 = transparent only)**: weekly closures over
   the trailing 8 weeks, from stored `gap_actions.closed_at`. The projected
   date for (a) critical and high work and (b) all work. A P50/P85 range
   from resampling those weekly counts with a fixed seed, so the same data
   always gives the same answer. "Not enough history" when there are fewer
   than 2 weeks of closures. Also the required weekly rate to reach 13 May
   2027.
7. **PDF library (decision 3 = PDF + XLSX)**: `@react-pdf/renderer` (MIT,
   maintained, server-side `renderToBuffer`, layout by flexbox) is
   recommended over `pdf-lib`, which is drawing primitives only. It is a stack
   change: record it, run `pnpm audit` before and after, and check its cold
   start inside Vercel's function limits on the real MU Exposure Brief.
   `exceljs` (D-067) for every XLSX.
8. **Where generation runs.** Inside the route handler, synchronously, for
   the MVP sizes. `reports.status` (`queued → running → ready | failed`)
   keeps the shape a worker can take over later (Slice 13). Record the
   measured MU generation times.
9. **Permissions — no matrix change expected.** Reading exposure, forecast
   and what-if needs `score.read` (every role). Recording a snapshot needs
   `score.calculate` (programme roles). Reports use the existing
   `report.read` / `report.generate` / `report.download`. The Owner Action
   Pack: an owner may generate their OWN pack with `gap.read`. Anyone else's
   pack needs `report.generate`.
10. **Retention.** A report row and its stored file go together. Users never
    delete either (as evidence, D-042). Erasure is Slice 13's job.

## 5. What exists — build on it

| Concern | Where | Notes |
|---|---|---|
| Which assessment | `pickAssessments` in `apps/web/lib/dashboard/read.ts` | Finalised snapshot vs live provisional (D-069.1) |
| Score + domains + red flags | `readAssessmentScore` in `lib/assessments/score.ts` | `domains[]`: `code`, `state` (`scored` · `scoped_out` · `all_not_applicable`), `score`, `percent`, `weight`, `evidenceConfidence`, `outstandingCount`; `overall.redFlags[]` with `domainCode`, `cap`, `label` |
| Assessment gaps + actions | `readGapRegister` / `readGaps` (`lib/gaps/*`) | Gap `domainCode`, `severity`, `state`; actions with `ownerUserId`, `dueDate`, `status`, `closedAt` |
| ROPA gaps + actions | `readRopaGapRegister` (`lib/ropa/shape.ts`) | Gap `gapCode` (§6 maps these), `severity`, `state`, `stale` |
| Both parents' actions | `assessmentItems` / `ropaItems` in `lib/dashboard/read.ts` | Export them. Never re-join `gap_actions` to one parent (pitfall 3) |
| Counting | core `dashboard.ts`: `summariseActions`, `groupActionsByOwner`, `bucketActionsByWindow`, `isOutstanding`, `countRopaRegister` | Reuse. The forecast adds `closedAt` history |
| Scope facts | `loadScopeState` + core `scopeFactsFrom`, `assessScopeProfile` | `childrenData`, `sensitiveDocuments`, `crossBorder`, `processingScale`, Data Principal count: the s.33(2)(a)/(b) inputs |
| Register facts | `readAllRecords` (pages past 1,000) | `children_data`, `risk_rating`, `cross_border` |
| Dates | `todayInIndia()` (server and client) | D-055 |
| Black box | D-071 | Client roles cannot read bank tables or provenance columns. Nothing here may need them, and no output may contain a question code, pack code or trigger |
| Evidence + links | `evidence`, `evidence_links` (`assessment_response` · `gap_action` · `ropa_record`, D-064), `lib/evidence/shape.ts` | All three link types in the evidence index |
| Signed downloads | the evidence download-url route (60 s, audited every time) | Copy the pattern for reports |
| ROPA export columns | the `export` handler in `lib/ropa/routes.ts` | Extract its row builder into `lib/ropa/shape.ts` so CSV and XLSX share one column list |
| Overview | `app/dashboard/executive-overview.tsx` | Add the exposure strip at the top; keep the readiness tiles below |

## 6. The exposure model 1.0.0 — FOR ANIKET'S REVIEW (then counsel's)

### 6.1 Heads (statutory facts, from the Schedule)

| Head | Breach of | Ceiling | Shown as exposure |
|---|---|---|---|
| H1 | s.8(5) reasonable security safeguards to prevent a breach | ₹250 crore | yes |
| H2 | s.8(6) notice of a breach to the Board and Data Principals | ₹200 crore | yes |
| H3 | s.9 additional obligations for children | ₹200 crore | yes, if applicable |
| H4 | s.10 additional obligations of a Significant Data Fiduciary | ₹150 crore | only if `sdf_notified_on` is set |
| H5 | s.15 duties of a Data Principal | ₹10,000 | never (not a fiduciary duty) |
| H6 | s.32 a voluntary undertaking | as the original breach | not modelled until undertakings exist |
| H7 | any other provision of the Act or Rules | ₹50 crore | yes |

### 6.2 What evidences each head — rechecked against the Act and Rules (2026-10-04)

**Three layers, and only the first two are DPDP's.** (1) The heads and their
ceilings are the Schedule, verbatim. (2) Which OBLIGATIONS fall under each
head is the Act's own text: the Schedule names s.8(5), s.8(6), s.9 and s.10,
and everything else is H7. (3) Which Compass areas and register gap rules
EVIDENCE those obligations, and every threshold and point below, is
TrustStack's model. DPDP says nothing about it, which is why counsel signs it
off (§14).

**Direct evidence**: an obligation the Act or Rules actually impose. Only
these can set a head's status.

| Head | Obligation (provision) | Compass domain | Register gap rule |
|---|---|---|---|
| **H1** | Reasonable security safeguards, including processing on the fiduciary's behalf by a processor (s.8(5)); the Rule 6(1)(a)–(g) minimum: encryption/masking, access control, logs and monitoring for detection, backups/continuity, one-year retention of logs, a processor contract clause on safeguards, organisational measures | **SECURITY**; **VENDOR** (processors' safeguards, s.8(5) + Rule 6(1)(f)) | `safeguards_missing`, `rule6_unconfirmed`, `processor_contract_missing` (Rule 6(1)(f)) |
| **H2** | Intimation of a breach to each affected Data Principal and to the Board, the 72-hour detailed report (s.8(6), Rule 7) | **BREACH** (its detection questions are really Rule 6(1)(c), i.e. H1 — see the note below) | — (breach register: Slice 10) |
| **H3** | Verifiable consent of a parent, **or of the lawful guardian of a person with disability** (s.9(1), Rules 10–11); no processing likely to harm a child's well-being (s.9(2)); no tracking, behavioural monitoring or targeted advertising of children (s.9(3)); Fourth Schedule exemptions for 9(1)/9(3) only (s.9(4)) | **CHILD** | `child_consent_missing`, `child_tracking` |
| **H4** | DPO in India, independent data auditor, periodic DPIA and audit (s.10(2)); annual DPIA + audit reported to the Board, algorithmic due diligence, localisation of specified data (Rule 13) — **only once notified as an SDF** | **SDF_AI** | `ai_unreviewed` (Rule 13(3)) |
| **H7** | Lawful purpose and ground (s.4, s.7); notice (s.5, Rule 3); consent, limited to necessary data, withdrawable (s.6); valid contract to engage a processor (s.8(2)); accuracy where data drives decisions or is disclosed (s.8(3)); erasure when the purpose is served or consent is withdrawn, and the processor's erasure (s.8(7)–(8), Rule 8); published contact (s.8(9), Rule 9); grievance redressal (s.8(10), Rule 14(3), 90 days); Data Principal rights (s.11–14, Rule 14) | **PURPOSE, NOTICE, CONSENT, ACCURACY, RETENTION, RIGHTS, GRIEVANCE**; **VENDOR** (the contract duty, s.8(2)) | `purpose_missing`, `notice_missing`, `consent_missing`, `retention_missing`, `processor_contract_missing` (s.8(2)) |

**Enabling controls** are good practice and root causes of breaches, but **no
DPDP provision imposes them as such**. They NEVER set a head's status, and
appear only as "why this head is exposed".

| Control | Why it is not a direct obligation |
|---|---|
| **GOV** (DPDP owner, governance) | A DPO is required only of an SDF (s.10(2)(a), already in H4). The published contact is s.8(9), evidenced under GRIEVANCE. Arguably s.8(4) ("appropriate technical and organisational measures"): **for counsel** |
| **INV** (data inventory), **ROPA** (processing register) | DPDP has **no record-of-processing duty** (unlike GDPR art. 30). Treating them as H7 was my error |
| Register rules `no_records`, `no_owner`, `categories_missing`, `vendor_unmapped`, `review_overdue` | Register housekeeping, not statutory duties |
| `ai_unreviewed` for a non-SDF | No general AI duty in DPDP: Rule 13(3) binds SDFs only |
| **CROSSBORDER** | Transfers are allowed unless the Government notifies a restricted country (s.16(1)) or issues an order under Rule 15; Rule 13(4) localisation binds SDFs only. **A watch item**, which becomes H7 evidence only once a restriction applies to the organisation |

**Applies when** (unchanged except H3): H1, H2, H7 always; **H3 when children's
data OR data of persons with disability who have a lawful guardian is `yes` or
`unknown`** in the scope or the register (the scope gains that question); H4
when `sdf_notified_on` is set. A domain scoped out (D-038) evidences nothing.

**Known coarseness (accepted for 1.0.0):** the mapping is per DOMAIN, so a
BREACH question about detection logs counts towards H2 although it is Rule
6(1)(c) (H1). The fix is a provision tag on each question
(`legal_control_basis`, empty for all 1,527 today, a known launch blocker).
When those tags exist, the model maps by question and bumps its version.

### 6.3 Status per head (in this order; first match wins)

1. **Not applicable**: the head's "applies when" is false.
2. **Not yet assessed**: no assessment, or every DIRECT domain is unanswered
   (`outstandingCount = questionCount`), and no direct register gap is open.
3. **Exposed**: a red flag fires in a DIRECT domain (D-046), **or** an open
   CRITICAL direct gap is mapped to the head (assessment or register),
   **or** any direct scored domain is below **40%** of its weight.
4. **Mitigated**: every direct domain is scored at or above **60%** of its
   weight with evidence confidence at or above **60%**, **and** no open
   critical or high direct gap is mapped to the head.
5. **Partially mitigated**: everything else.

Red flags on enabling controls (`weak_data_inventory`, `weak_ropa`,
`no_evidenced_dpdp_owner`) still cap the READINESS score (D-046). On the
exposure model they are shown as root causes and set no status. The
40/60/60 thresholds are model data, counsel-reviewable, and bumped with the
model version.

### 6.4 Indicative position within the ceiling (decision 1)

Computed only for **Exposed**, **Partially mitigated** and **Not yet
assessed**. Points from the s.33(2) factors the platform can observe:

| Factor | s.33(2) | Points |
|---|---|---|
| Children's data in scope (`yes`) / possibly (`unknown`) | (b) type of data | +2 / +1 (H3: +3 / +2) |
| Sensitive documents (identity, financial, health) in scope | (b) | +1 |
| Large-scale processing (the scope's internal trigger, D-028) | (a) gravity | +1 |
| Where data is held or sent is unknown (cross-border `unknown`) | (a) | +1 (H1 only) |
| Status is Exposed (not just partial) | (a) | +1 |
| Every open gap mapped to the head has an owner and a due date | (e) mitigation | −1 |
| Mapped domains' evidence confidence ≥ 60% | (e) | −1 |
| Repetition (breach incidents) | (c) | 0 until Slice 10 |

These points are TrustStack's judgement of how the s.33(2) factors are likely to weigh. The Act names the factors but gives them no weights. Total ≤ 1 → **lower third** · 2–3 → **middle third** · ≥ 4 → **upper
third**. Every position lists its reasons in plain words ("large number of
Data Principals; children's data; no evidence of encryption…"). Factors
(d), (f) and (g) are the Board's own judgement and are stated as such,
never scored.

### 6.5 Headline figures

- **Statutory ceilings where you are exposed**: Σ ceilings of heads that
  are Exposed, Partially mitigated or Not yet assessed, labelled
  "ceilings, not a predicted fine; penalties are per breach".
- **Heads exposed**: n of the applicable heads.
- **s.37 flag**: always shown once any head is exposed — "two penalties
  can lead to blocking of public access to your service".
- **Days to 13 May 2027** and the forecast (§4.6).

### 6.6 Caveat (verbatim on every exposure output, beside D-011's)

> Exposure figures are indicative positions within statutory ceilings in the
> Schedule to the DPDP Act 2023, derived from your own assessment, register
> and remediation data under TrustStack exposure model {version}. They are
> not a prediction of any decision of the Data Protection Board, which
> imposes a penalty only after an inquiry finds a breach significant and
> weighs the factors in section 33(2). They are not legal advice.

## 7. Data model (one migration, additive — may be applied before merge)

- `organizations.sdf_notified_on date NULL`,
  `organizations.sdf_notification_ref text NULL`: a CHECK that both are
  set or neither; UPDATE by `organization.update` only; audited by the
  existing trigger.
- `exposure_snapshots` (tenant): `id`, `organization_id`, `recorded_at`,
  `recorded_by`, `model_version`, `basis` (`finalised` · `provisional` ·
  `none`), `assessment_id` / `snapshot_id` (composite FKs, nullable),
  `heads jsonb` (per head: status, position, reasons), `ceilings_at_stake`
  (crore), `exposed_heads`, `forecast jsonb`. RLS SELECT through the tenant
  helpers. **No user write grant of any kind**: rows come only from
  `public.record_exposure_snapshot(p_organization_id)` (SECURITY DEFINER,
  `score.calculate`), which derives every value in SQL. Immutable by trigger
  (UPDATE always refused; DELETE only by cascade, as D-052).
- `reports` (tenant): `id`, `organization_id`, `kind`, `format`, `version`
  (per organisation + kind + subject), `subject_user_id` (owner packs),
  `assessment_id`, `exposure_snapshot_id` (every exposure output records its
  basis), `status`, `storage_path`, `file_name`, `byte_size`,
  `generated_by`, `generated_at`, `error`. SELECT by RLS; writes only through
  the generator's RPC.
- A private `reports` bucket, with policies shaped like the evidence
  bucket's (D-042): tenancy in the path
  `organizations/{organization_id}/reports/{report_id}/{filename}`, no
  overwrite, no delete.
- REVOKE defaults (D-019); `pnpm db:types` after; CI seed counts updated.

## 8. Core logic — `packages/core` (`exposure.ts`, `forecast.ts`, `reports.ts`)

- `EXPOSURE_HEADS`, `EXPOSURE_MAPPING`, `EXPOSURE_THRESHOLDS`,
  `POSITION_FACTORS`, `EXPOSURE_MODEL_VERSION`, `EXPOSURE_CAVEAT`,
  `COMMENCEMENT`: all data.
- `exposureFor(input) → { heads[], ceilingsAtStake, exposedHeads, s37 }`:
  pure, over the reader shapes above. No clock inside; `today` is passed in.
- `forecast(closures[], outstanding, today, deadline, seed)`.
- `leverage(items, exposure)`: each open action weighted by its head's
  ceiling × the gap's severity, ranked.
- `whatIf(input, actionIds)`: `exposureFor` + `forecast` with those actions
  treated as closed.
- `REPORT_KINDS`, `DPDP_REPORT_CAVEAT` (D-011 verbatim), and pure section
  builders (rows, headings, labels) for each report, so their content is
  testable without rendering a PDF.

## 9. API (all `withApi`, nested under `/organizations/[id]/`, a route-sweep probe each, both directions)

- `GET …/exposure`: the live model and its intelligence (forecast,
  leverage top 10, slippage, what changed since the last snapshot).
- `POST …/exposure/snapshots` → `record_exposure_snapshot`;
  `GET …/exposure/snapshots`: history.
- `POST …/exposure/what-if` `{ actionIds: uuid[] (≤ 50) }`: read-only.
- `PATCH …/organization` gains the two SDF fields (or a dedicated route).
- `POST …/reports` `{ kind, format, ownerUserId? }` · `GET …/reports` ·
  `GET …/reports/{reportId}` · `GET …/reports/{reportId}/download-url`
  (60 s, audited every time) · `POST …/reports/{reportId}/regenerate` (a
  new version, never an overwrite). Every exposure report records a fresh
  exposure snapshot first.

## 10. UI

- **`/dashboard/exposure` — Exposure Command Centre**:
  - the headline (ceilings at stake, heads exposed, days to the deadline,
    forecast), one card per head (status, ceiling, indicative band, reasons,
    mapped domains and register rules as links), and the s.37 flag;
  - the top 10 leverage actions with owners and dates;
  - the what-if (tick actions → see the heads and the forecast move);
  - slippage warnings, "what changed", and the exposure history chart;
  - load the `dataviz` skill before any chart. One series over time, one
    hue, a table view alongside.
- **The overview** gains an exposure strip at the top linking to the
  Command Centre.
- **`/dashboard/reports`**: generate (by kind, hidden without the
  permission), the list with versions, who and when, and downloads.
- **Organisation settings**: the SDF notification date and reference, with
  the wording "only if the Central Government has notified you; TrustStack
  never infers this".
- Plain language throughout; never "compliant"; no code of any kind on a
  client screen (D-071).

## 11. Tests

| Test | Where | Assertion |
|---|---|---|
| mapping complete | unit | every domain and every ROPA gap rule is classified DIRECT (with ≥ 1 head and its provision) or ENABLING (with its reason); every direct row cites a section or rule; no enabling control can change a status |
| status rules | unit | each rule alone, in order; thresholds at 39/40 and 59/60; "not yet assessed" ≠ "exposed" in labels but counts in the headline |
| positions | unit | each factor alone; boundaries 1/2 and 3/4; bands are thirds rounded to whole crore |
| SQL ↔ core | unit | the migration's heads, mapping, thresholds, points and version equal core's (as `scoring-engine.test.ts` does) |
| forecast | unit | deterministic with a seed; "not enough history" below 2 weeks; required rate; P50 ≤ P85 |
| leverage / what-if | unit | closing the top action never raises exposure; what-if never writes |
| second sector | e2e | a `healthcare`-style tenant with no children's data has H3 Not applicable; one with children has it Exposed with children's reasons. Nothing University-specific |
| SDF | e2e + rls | H4 absent until `sdf_notified_on` is set by an org admin; a consultant-only scope trigger never sets it |
| stored = live | e2e | a recorded snapshot equals the live model at that moment |
| snapshot integrity | rls | no user INSERT/UPDATE/DELETE on `exposure_snapshots`; the RPC refuses another tenant and a role without `score.calculate` |
| caveats | unit + e2e | every report contains D-011's caveat and the exposure caveat verbatim (text extracted from the PDF/XLSX) |
| black box | unit + e2e | no report or exposure payload contains a question code, pack code or `trigger:` |
| versions | e2e | regenerate → version 2; version 1's file unchanged and downloadable |
| both parents | e2e | the tracker and the owner pack include an assessment action and a ROPA action, labelled by source |
| evidence index | e2e | all three link types appear |
| empty state | e2e | BML: every head "not yet assessed" or "not applicable", reports generate with zero rows and no error |
| audit | e2e | snapshot recorded, report generated, every download URL — each on the log, as the person |
| gate 5 | rls + sweep | Org A cannot read, record, what-if, generate, list, download or regenerate Org B's anything, by path or by id; the bucket refuses a foreign path |
| < 3 s | e2e | `GET …/exposure` for MU inside budget locally |

## 12. Stages and approval gates

| Stage | Builds | Gate: Aniket approves… |
|---|---|---|
| **1** | §6 as core data; `exposureFor`; unit tests; `GET …/exposure` (live only); SDF fields | the model's output for **MU and a second-sector tenant**, side by side, as a short written walk-through |
| **2** | the SQL mirror, `exposure_snapshots`, the forecast, leverage, what-if, slippage, what changed; the **Exposure Command Centre** and the overview strip | the Command Centre on real data (screenshots) |
| **3** | the report store (table, bucket, routes, signed downloads, audit); **DPDP Exposure Brief** and **Programme Status Report** | the two PDFs' layout and wording |
| **4** | the **Owner Action Pack**, **Regulator-Ready Evidence Pack**, the three XLSX exports; full test pass; Sync Step; PR | the PR (CI green). Merge is Aniket's |

**At the end of EVERY stage (1–3), before stopping:**
1. All gates green locally for what exists so far (typecheck, unit, RLS,
   e2e); record the counts.
2. Commit (conventional commits) and `git push`. **Stage 1 opens a DRAFT PR**
   (`gh pr create --draft`) so CI runs on every later push; Stages 2–3
   push to it.
3. Update the **Slice 9 tracker** in `docs/STATE.md`: the stage's status
   becomes ⏳, plus the last commit, the test counts and one
   line on what to show Aniket. Append any decision to `DECISIONS.md`. Commit
   and push those docs too.
4. Tell Aniket exactly what to review for the gate, and the one line to start
   the next session with.

**Stage 1 as built (2026-10-05, `043571c`)** — what Stages 2–4 build on:
`packages/core/src/exposure.ts` (`exposureFor`, `EXPOSURE_MAPPING`,
`EXPOSURE_THRESHOLDS`, `POSITION_FACTORS`, `gapIsOutstanding`,
`directDomains`, `directRegisterRules`, `bandRangeCrore`) and
`packages/core/src/reports.ts` (`DPDP_REPORT_CAVEAT`) — the SQL mirror must
match these, row for row. `lib/exposure/read.ts` (`readExposureInput`,
`scopeFacts`) gathers the inputs; reuse it for the snapshot's "stored = live"
test and for every report. The output's `heads[].reasons` are ordered
(applies → status → root causes), and `freshness` says when an input is
stale. The twelve modelling calls are D-073; read them before changing a rule.

**Stage 2 as built (2026-10-06)** — what Stages 3–4 build on: the model is in
SQL too (migration `20261009000000_exposure_snapshots`:
`app.exposure_evaluate(input)`, `app.exposure_input(org, today)`,
`app.exposure_forecast(…)`), held to core by `tests/unit/exposure-mirror.test.ts`
(data) and `tests/rls/exposure-mirror.test.ts` (400 generated inputs, 120
forecasts) — **a rule change goes in core AND a new migration, bumps the
version in both, and keeps both green**. `public.record_exposure_snapshot(org)
→ uuid` is the only write path (`score.calculate`, audited, immutable rows);
read a stored one with `readSnapshot` (`lib/exposure/snapshots.ts`) — its
`heads` (status, position, reasons), `forecast` and `asOf` are what a report
prints, so a report never recomputes exposure. Live intelligence is in core
`intelligence.ts` / `forecast.ts` (`leverage`, `whatIf`, `slippage`,
`exposureChanges`, `outstandingWork`); the action items behind leverage come
from the dashboard's exported `assessmentItems` / `ropaItems`. The calls are
D-074. Disposable tenant `…a009` is still free; never record a snapshot on MU
or BML in e2e (they are permanent).

**Stage 3 as built (2026-10-06)** — what Stage 4 builds on: migration
`20261010000000_reports` holds the `reports` table, the private `reports`
bucket and the only write path (`begin_report` → upload → `complete_report`
| `fail_report`), with ALL SEVEN kinds already in `app.report_kinds()` and
the kind/format CHECK (mirrored by core `REPORT_KIND_DEFINITIONS`, held by
`tests/unit/report-store.test.ts`) and decision 9's owner-pack rule in SQL.
A new report = a core builder returning a `ReportDocument`
(`packages/core/src/reports.ts`), a branch in `buildDocument`
(`lib/reports/generate.ts`) and the kind added to `AVAILABLE_REPORT_KINDS`;
`lib/reports/pdf.ts` renders any document. XLSX needs its own renderer
(`exceljs`, values only — pitfall 9) behind the same begin/upload/complete
path, with `contentType` set per format. Inputs come from readers only:
`readSnapshot`, `readLiveExposure`, `readDashboard` (and, for Stage 4, the
gap, ROPA and evidence readers). The e2e pattern is `e2e/api/reports.spec.ts`:
generate on a disposable tenant, download by signed URL, extract the text
(`tests/support/pdf-text.ts`) and assert on the FILE. The calls are D-076.

**Stage 4 as built (2026-10-08)** — what Slice 10 builds on: the Owner
Action Pack and the Regulator-Ready Evidence Pack (core `reports.ts`:
`ownerActionPack`, `evidencePack`, `evidenceCoverage`) and the three
spreadsheets (core `workbooks.ts`: `ReportWorkbook`, `gapActionTracker`,
`ropaRegisterWorkbook`, `evidenceIndexWorkbook`; renderer
`lib/reports/xlsx.ts`, values only, `defuseFormula`). Inputs:
`readRemediation` (`lib/dashboard/read.ts`, shared with the overview) via
`lib/reports/inputs.ts`, and `readEvidenceIndex`
(`lib/evidence/index-reader.ts`). One pipeline for both formats
(`buildOutput` in `lib/reports/generate.ts`); the evidence pack makes its
Evidence Index first and names it. An owner generates and downloads their own
pack (routes guarded by `report.read`). No migration. The calls are D-078.

**Migrations across stages:** Stage 1's SDF columns and Stage 2's
`exposure_snapshots` / `reports` tables are additive. They may go to hosted
when their stage is approved, never before, and only with `prisma migrate
deploy` from the branch's committed files (an applied migration is frozen —
CLAUDE.md). **Stage 4** marks the PR ready for review, runs the full Sync
Step (§15) and stops; the merge is Aniket's.

## 13. Seed data

Nothing finalised is seeded (D-052), and no exposure snapshot either:
seeded snapshots would freeze a date-dependent picture. e2e tests create
what they assert on (their own assessments, records and actions, with
explicit dates) and use a disposable second-sector tenant id not yet taken
(`…a008` is free).

## 14. Definition of Done

The 10 gates, plus: the §4 decisions recorded; the §6 model approved by
Aniket and **listed in STATE as a launch blocker pending counsel
sign-off**; both caveats on every output; no number in any output that the
engine, the database or the documented model did not produce; no code or
trigger in any client output; downloads only by signed, audited URL; the
four stage gates passed.

## 15. Sync Step

Update `STATE.md` (including the counsel sign-off blocker); append
`DECISIONS.md`; **promote `SLICE_10`** against the code that exists — each
workflow module must feed its head (breach register → H2 with
repetition, children's consent → H3, rights/grievance SLAs → H7,
processor contracts → H1/H7) and add its stakeholder report (Security &
Breach, Legal Position, Processor Exposure) on this slice's report store;
stub-check `SLICE_11` (AI narration of these reports, under the existing
guardrails).

## 16. Known pitfalls

1. **Never present a band as a fine.** "Indicative position within the
   statutory ceiling" every time; the caveat on every surface; ceilings
   summed only as ceilings.
2. **Never infer SDF** (D-028). H4 appears only after a human records a
   notification.
3. **The live model and the stored snapshot must agree** (D-053's lesson).
   The mirror test is the guard; any rule change goes in both and bumps the
   version.
4. **Two scoring models already exist** (D-061). Exposure is a third view
   built on them; it never feeds back into the readiness score or the
   register's completeness.
5. **`gap_actions.gap_id` is NULL for every ROPA action** (D-060). Use the
   Slice 8 item builders.
6. **The black box is the database's** (D-071): never `select("*")` on
   `assessment_questions`, `assessments` or `industries` (an embedded
   `assessment_questions(count)` fails too); no output may need provenance.
7. **The seeded ROPA review dates have passed.** Assert date-dependent
   figures only on rows the test creates, with explicit dates.
8. **PostgREST caps responses at 1,000 rows.** Reuse the paging readers;
   return one jsonb value from any RPC that could exceed it.
9. **XLSX formula injection.** Write values, never formulas; reuse
   `csvCell`'s rule.
10. **In e2e, never `auth.signOut()` without `{ scope: "local" }`.** The
    default is global and kills every other spec's cached token (guarded by
    a unit test since Slice 8).
11. **`next dev` and `next build` share `apps/web/.next`.** Stop the dev
    server before building or running e2e.
12. **Hosted serves the live site.** An additive migration may go on before
    merge; anything that withdraws a grant goes on right after the deploy.
13. **Each e2e spec file needs its own name prefix** per table. Taken
    (assessments): `E2E keystone%`, `E2E evidence UI%`, `E2E UI %`,
    `E2E API assessment%`, `E2E scoring API%`, `E2E scoring UI%`,
    `E2E gap register API%`, `E2E gap register UI%`, `E2E dashboard API%`,
    `E2E dashboard UI%`. Taken (ropa_records): `E2E ROPA API%`,
    `E2E ROPA UI%`, `E2E dashboard API%`, `E2E dashboard UI%`. Disposable
    tenant ids `…a003` to `…a00b` are taken (`…a008`: Stage 1's
    `e2e/api/exposure.spec.ts`, a healthcare tenant; `…a009` / `…a00a`:
    Stage 3's `e2e/api/reports.spec.ts`; `…a00b`: `e2e/ui/reports.spec.ts`).
    Members of a disposable tenant must be users no other spec asserts
    memberships for — `muItSecurity` and `muLegal`; never the Dean
    (`ui/tenancy.spec.ts` asserts the Dean has one organisation).
14. Carried: new route ⇒ sweep probe; migration ⇒ `pnpm db:types`; seed
    counts in `app.yml`; `service_role` only in `lib/supabase/admin.ts`;
    `git add <paths>`; the live e2e needs `--workers=1`; CI on `main` is
    authoritative; verify live after merge.
