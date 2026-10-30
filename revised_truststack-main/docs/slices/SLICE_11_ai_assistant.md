# SLICE 11 — AI assistant and guardrails

**Branch:** `slice/11-ai-assistant` · **Est:** 4 sessions, in 4 stages (1a, 1b,
2a, 2b), each ending at an approval gate (§7) · **Week:** 18–19 · **Ships:** the TrustStack DPDP
Assistant (spec Step J) — a backend-only gateway that explains, suggests and
**drafts for a person to accept**, grounded in the Act and the Rules, inside
one tenant, and never deciding anything the engine, a reviewer or counsel
decides.

> **✅ CLOSED AND LIVE 2026-10-22 (D-138):** all four stages approved (D-126, D-128, D-131, D-136); the
> reference set accepted after an expert review (D-137); merged as `49c9eba` (PR #41); the four migrations
> on hosted. The assistant stays OFF on the live site until A1. **The next slice is
> `SLICE_12_reassessment.md`** (full prompt, for approval: "SLICE_12 approved").
>
> **STATUS (2026-10-21): APPROVED ("SLICE_11 approved", D-124) — Stage 1a ✅ approved
> (D-125, D-126); Stage 1b ✅ approved (D-127, D-128, call 12 included); Stage 2a ✅ approved
> (D-129, D-130, D-131 — call 15 Option A); Stage 2b ✅ approved 2026-10-22 (D-133–D-136).** §4 and §6 stand as written. The s.16 / Rule 15 check is
> recorded (D-124.3). Stage 1a's walk-through, manual test and live smoke are in
> `docs/testing/SLICE_11_stage1a_{walkthrough,manual_test}.md` and
> `docs/testing/slice11-1a/`. A draft PR into `main` carries the branch for CI only;
> it merges once, at the end of 2b (D-123).
>
> *History (the approval request, kept):* **STATUS: FULL PROMPT, for Aniket's approval.** First written by the Sync Step
> of Slice 10 Stage 6 (2026-10-16, D-097); re-synced after Slice 10.5 B4 and
> **re-validated against `main` @ `5b411e1` on 2026-10-19 (D-123)**. **Do not
> start Stage 1a until Aniket has approved §4 (the decisions) and §6 (the
> data-protection position)** in his opening message:
> - **"SLICE_11 approved"** — every §4 decision as recommended and §6 as
>   written; or
> - **"SLICE_11 approved with changes: …"** — record each change in DECISIONS
>   and edit this file to match BEFORE writing code.
>
> Any other opening message: ask, and write no code. **PR #28 is merged**
> (Slice 10 is live, D-100); branch Stage 1a off `main`. **Slice 10.5 is
> finished and live** (B0, A, B5, B5a, B1–B4; D-100–D-122): the side panel sits on screens
> that already meet the non-lawyer bar, inside the B0 app shell, and must keep
> them there. If anything has drifted since, the code wins.
>
> **Re-synced 2026-10-19 by Slice 10.5 Batch B4's Sync Step** (D-118's handover
> check): the baseline, the merge state, the UI conventions (§0.7) and this
> order note, against the code after B4 (exposure model 1.7.0, D-119). §4 and §6
> are unchanged and still await "SLICE_11 approved".
>
> **How the sessions run (D-123):** the opening message "SLICE_11 approved"
> records the approval and starts **Stage 1a** in that session. Each later stage
> is its own new session, opened with **"Start Slice 11 Stage 1b"** (then 2a,
> 2b), only after the stage before it is approved ("Stage 1a approved", …). One
> branch for all four; one PR into `main` at the end of 2b, which carries the
> slice's migration to hosted (D-071).
>
> **2026-10-16 — Aniket agreed these additions before approval**, now written
> into §4 and §6: the data-protection additions **A1–A5**, the §4.2
> safeguards, the **experience principles and the reference-answer test**
> (§4.13), and **client-hosted AI** (§4.14). "SLICE_11 approved" approves them
> as written.

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. **D-011, D-019, D-020,
   D-027, D-028, D-042, D-043, D-056, D-067, D-068, D-069, D-071, D-076, D-078,
   D-097, D-098, D-101, D-104, D-119, and Slice 11's own D-123–D-132**), this file, `docs/UX_REVIEW.md` (the non-lawyer rubric
   every new panel is scored on), spec **Step J**
   (`docs/spec/04_AI_Dashboards_Security_Steps_J-L.md`, lines 8–278), and the
   Act's **s.2, s.4–8, s.16** and the Rules' **6, 13(3)–(4), 15**
   (`docs/legal/`, `pdftotext -layout`).
2. **Branch:** Stage 1a: `git checkout main && git pull && git checkout -b
   slice/11-ai-assistant` (PR #28 and every Slice 10.5 PR are merged). Stages
   1b, 2a and 2b: `git checkout slice/11-ai-assistant && git pull`.
3. Local stack as Slice 10 (STATE: export the local env first — `.env.local`
   points at hosted; e2e `--workers=1`; how to run every gate: `docs/PLAYBOOK.md`
   §2). Baseline (after Slice 10.5 B4): core **1,302**, web unit **595**, RLS
   **542**, 23 CI SQL gates, e2e **425** (exposure model **1.7.0**, 27
   migrations; the last is `20261019000000_exposure_model_1_7_0`, so this
   slice's first is dated after it). **After Stage 1a** (the branch): core
   **1,363**, web unit **701**, RLS **561**, **24** CI SQL gates, e2e **438**; 28
   migrations, the last `20261020000000_ai_gateway` — a later stage's migration is
   dated after it. **After Stage 1b:** core **1,383**, web unit **807**, RLS **565**, **24**
   CI SQL gates, e2e **451**; 29 migrations, the last `20261021000000_ai_explain_helpers`.
   **After Stage 2a:** core **1,391**, web unit **864**, RLS **574**, **24** CI SQL gates (the AI
   one "Stages 1a–2a"), e2e **469**; 30 migrations, the last `20261022000000_ai_register_drafts`
   — 2b's is dated after it. **After Stage 2b:** core **1,401**, web unit **895**, RLS **581**, **24** CI
   SQL gates (the AI one "Stages 1a–2b"), e2e **485**; 31 migrations, the last
   `20261023000000_ai_notice_narrative`. **The seed gate needs the local `DIRECT_URL` exported** (PLAYBOOK §2).
   Export `AI_ENABLED=true AI_PROVIDER=fake` for e2e and `pnpm dev`
   (PLAYBOOK §2).
4. **No live model call in CI.** The gateway takes an injected provider; CI
   and e2e use a recorded fake. A live smoke test runs only by hand with
   `ANTHROPIC_API_KEY` set locally (never committed; `.env.example` gets the
   name only).
5. Before writing any Claude API code, read the `claude-api` skill — the
   model IDs, structured outputs and refusal handling below were current on
   2026-10-16 and may have moved.
6. Every stage ends with a walk-through **and** a step-by-step manual test
   (`docs/testing/SLICE_11_stageN_{walkthrough,manual_test}.md`), as Slice 10.
7. **The UI conventions (Slice 10.5, D-101):** the side panel lives in the B0
   shell (`components/shell/`; a menu entry, if any, in `lib/client/nav.ts` with
   its `nav-*` id and `<Can>`); colours are `globals.css` tokens only; messages
   are `<Notice>` (stays on the page) or `useToast()` (passing); a list that can
   grow goes through `<DataTable>` and a long panel through `<Tabs>`, under the
   paging guard (`tests/unit/paging-guard.test.ts`); counts in words through core
   `countNoun` (no "1 actions"); no font CDN or any hosted-only call (client-hosted,
   proposed Slice 15). Every new surface is scored in `docs/UX_REVIEW.md`.

## 1. DPDP anchoring (checked against the Gazette text, 2026-10-16)

- **TrustStack is each client's Data Processor** for the tenant data it holds
  (the client is the Data Fiduciary, s.2(i), s.2(k)). Sending tenant data to a
  model provider makes the provider a **sub-processor**: the fiduciary may
  engage a processor "only under a valid contract" (s.8(2)), and the
  fiduciary stays responsible (s.8(1)). Hence §6.
- **Security safeguards** (s.8(5), Rule 6(1)): keys server-only, access
  controlled and logged (Rule 6(1)(c)), the provider's retention known.
- **Cross-border** (s.16(1)): transfer is permitted unless the Central
  Government notifies a restricted country; Rule 15 adds requirements it may
  set by order on making data available to a foreign State. A **Significant
  Data Fiduciary** may be barred from transferring specified data out of
  India (Rule 13(4)) — so an SDF client's AI use needs its own check.
- **Children** (s.9): nothing about a child's identity is sent to a model.
- **The product's own rule** (CLAUDE.md, spec Step J): the AI may not certify
  compliance, approve evidence, close gaps, override a score, or see another
  tenant's data; uploaded evidence is untrusted input.

## 2. Goal

1. **A gateway** — `POST /api/v1/organizations/{id}/ai/{task}` through
   `withApi` — that checks the person, the tenant and the task's permissions,
   builds the context from the **routes' own readers** (D-069), calls the
   model, validates a **structured** answer, applies the guardrails, stores the
   result as a **draft**, and audits the call.
2. **Explain and suggest** (Stages 1a–1b): Question Helper, Evidence Helper, Gap
   and Action Helper, Score Helper ("why is this domain capped?") — on the
   assessment, gap and action pages.
3. **Draft for a person** (Stages 2a–2b): a ROPA record from a description; the
   **Board intimation under Rule 7(2)** from a breach record; a **privacy
   notice** from the processing register, and its translation (Rule 3; the
   languages of the Constitution's Eighth Schedule, s.5(3)); a **rights response** from a
   request; the **report narrative** for the Exposure Brief, the Programme
   Status Report and the evidence pack (Slice 9 sync). Every one is a draft
   that a person edits and accepts through the register's existing write path.
4. **Guardrails that are tested**, not promised: refusal, injection, black
   box, tenancy, personal data, wording.

## 3. Scope

**In:** the gateway, the provider interface and its Claude implementation, the
task catalogue, the draft store, the guardrails and their tests, the side
panel UI on the pages above, the org setting that turns AI on, usage records.
**Out (later slices):** reading the **contents** of uploaded evidence (Slice
13+, after an extraction sandbox); embeddings and pgvector (§4.2); a second
provider; the consultant copilot and the admin knowledge helper (Slice 14);
anything that writes a record without a person; AI in a public surface.

## 4. Decisions — recommended, for Aniket to confirm (record each in DECISIONS)

1. **Provider: Claude only, behind an interface.** `lib/ai/provider.ts`
   defines `complete(task, input) → validated output`; `lib/ai/claude.ts`
   implements it with `@anthropic-ai/sdk` (a new dependency — record it).
   Default model **`claude-opus-5-5`**, effort set per task (`low` to explain,
   `medium` to draft — Opus 5.5 defaults to `medium`, so set it explicitly),
   with the server-side refusal fallback (`fallbacks: "default"` with the beta
   header `server-side-fallback-2026-07-01`; on Bedrock or Vertex, §4.14, the
   SDK's client-side refusal-fallback middleware instead) and a check of
   `stop_reason` before reading the answer. Opus 5.5's thinking cannot be
   turned off; effort is the only control. No assistant prefill and no forced
   `tool_choice`: both return 400 on this model. Use structured outputs.
   *Re-checked 2026-10-19 against the `claude-api` skill:* `claude-opus-5-5` is
   the current default model. Claude Fable 5.1 is more capable but is **not**
   used: it requires 30-day data retention, which §6.4 rules out, and costs more. The model id is a config value
   recorded with every draft. A second provider is out of scope; the
   interface keeps it possible (spec Step J "provider-agnostic").
2. **Grounding without pgvector for the MVP — a deviation from the stub.** The
   approved global corpus (the Act and the Rules, ≈ 21,000 words; TrustStack's
   own guidance written by Anix) fits in one **cached** system prefix
   (prompt caching), so it is sent whole instead of retrieved by similarity:
   nothing to embed, no embeddings provider (another sub-processor), no
   retrieval misses. Tenant context is assembled deterministically by the
   backend from the routes' readers, never by similarity. Estimated cost on
   Opus 5.5: ≈ 30,000 cached tokens per call, about $0.03–0.06 a request with
   output. **Three safeguards:** (a) **citation check** — every answer cites a
   section, rule or Schedule from the corpus, and the server rejects or flags a
   citation the corpus does not contain; (b) **versioned corpus** — the corpus
   file carries a version hash stored with every draft, and an amendment or
   corrigendum is a new version; (c) **client-safe guidance** — TrustStack's
   own guidance in the corpus carries no question code, weight, trigger or cap
   (D-071), since the model can repeat anything it is given. **Switch to
   pgvector** (0.8.2 is available on the stack, not installed) behind a
   `Grounding` interface when the corpus passes ≈ 150,000 tokens, when
   evidence-content search is wanted, or when measured cost or latency says
   so. *Alternative:* pgvector RAG as the stub said — more moving parts and an
   embeddings sub-processor for a corpus this size.
3. **Structured output, server-forced flags.** Every task returns a JSON
   schema (`output_config.format`) derived from spec Step J's schema, then
   Zod-validated. The server — not the model — sets `requiresHumanReview:
   true` on every output and `legalReviewRequired: true` on every legal draft
   (notice, intimation, response, narrative). A failed parse or a refusal is a
   clear error, never a half-answer.
4. **Drafts only; the AI has no tool that writes.** A new tenant table
   `ai_drafts` (task, target, input digest, output, model, tokens, status
   `draft | accepted | discarded`, who and when; RLS by tenant + the task's
   read permission; composite FKs; audited). Accepting a draft pre-fills the
   register's existing form; the person saves through the existing route. No
   model call can change a score, an evidence verdict, an action's status or
   an approval.
5. **The black box holds** (D-068, D-071). The Question Helper gets the
   question **text** and the client-safe guidance only — never a question
   code, pack, weight, trigger, evidence cap or red-flag rule. A test sends
   the bank's internals through every task's context builder and fails if any
   reaches the prompt.
6. **Personal data stays home.** Each task has an **allow-list** of fields its
   context builder may send. Never sent: a Data Principal's name, email,
   phone or identifier (rights register, consent register, intake), a
   vendor respondent's details, a person's name (owners are sent as roles),
   evidence file contents. The Rule 7 draft is written from the breach's
   nature, categories, counts and times — never the people. **(A3) A
   free-text scrub** then masks emails, phone numbers and Aadhaar- or PAN-like
   patterns in titles and notes staff may have typed by mistake. Unit tests
   prove each builder drops a planted personal-data field and the scrub masks
   each pattern.
7. **Permissions — no new code unless needed.** `ai.use` (every role holds it,
   Slice 1) **plus** the task's own: the read permission of what it explains;
   the write permission of the register a draft is for (e.g. `breach.write`
   for the intimation, `consent.write` for a notice). Accepting a draft needs
   the register's write permission as today.
8. **On only where the contract allows.** `organizations.ai_enabled` (default
   **false**), set by `organization.update` after the client's contract names
   the AI sub-processor (§6). **(A2)** Turning it on requires the contract (DPA)
   reference; who, when and the reference are stamped and audited; turning it
   off is immediate. **(A4)** Tenants whose `industry_code` is **`bfsi`** (banking, financial services
   and insurance) or **`healthcare`** cannot turn it on until counsel's sign-off for that
   industry is recorded (s.16(2) keeps stricter sector rules, e.g. payment-data
   localisation); a tenant with an **SDF notification** cannot until Rule
   13(4)'s specified-data list is known. A platform kill switch (`AI_ENABLED`
   env) wins over all of it. MU's seed turns it on for the demo (a fictional
   contract reference); BML stays off (its empty state says why).
9. **Limits and usage.** Per person and per organisation rate limits (the
   Slice 10 intake limiter's pattern), a monthly token ceiling per
   organisation (a config value until Slice 14's licensing), and usage
   (input, output, cached tokens; model; latency) recorded per draft.
10. **Audit, as the person, never the text.** `ai.requested`,
    `ai.refused`, `ai.injection_flagged`, `ai.draft.accepted`,
    `ai.draft.discarded` — task, target, model, tokens; the prompt and answer
    live only in the draft row (tenant data, its own RLS).
11. **Wording rules in code.** A post-check rejects an answer that says the
    organisation "is compliant", "is certified", or presents a TrustStack
    target as statute; every answer carries D-011's caveat and, for a legal
    draft, "for review by counsel before use".
12. **Synchronous, streamed to the panel.** No worker exists yet (reports run
    in the request, D-076.10); AI calls do too, streamed, with `maxDuration`
    60 s and per-task `max_tokens`. A worker is revisited in Slice 13.
13. **Experience principles — expert and simple** (Aniket's product goal,
    `docs/UX_REVIEW.md`). Every answer has one shape: **(1)** the answer in
    one sentence; **(2)** why it matters to this organisation; **(3)** one next
    step, as a button to the right page; **(4)** the law — section, rule,
    Schedule — folded away by default. Plain words first: short sentences, a
    legal term glossed on first use ("Data Fiduciary — your organisation, which
    decides why and how data is used"); statute always told apart from
    TrustStack defaults; the organisation's own records and numbers, never
    generic text; calm and professional, never alarmist, never "compliant";
    "counsel to confirm" where the law is unclear. Short by default, "Tell me
    more" for the rest. Drafts in English or the languages the notice already
    supports (Hindi, Marathi first). Every answer takes a thumbs up or down
    with an optional comment. **The reference-answer test:** a versioned set of
    about 50 real questions and drafting cases (`packages/core/src/ai/
    reference-set.ts` or similar), each with the expected shape, citations and
    must-not-say lines, reviewed by a DPDP expert (Aniket) and later counsel;
    every change to prompts or the model runs against it before release, and
    the panel's screens are scored on the UX rubric at the gate.
14. **Client-hosted AI (bring your own provider).** For a client-hosted
    install (proposed Slice 15, STATE), the provider interface takes its
    credentials, model, region and endpoint from deployment config — the
    client's own Anthropic account, Claude through its own cloud (Bedrock or
    Vertex) in a region it chooses, or a private model — with no change to the
    gateway, the guardrails or the tests. The same §6 rules apply, re-pointed:
    the client contracts its provider directly and Anix is not in the chain
    unless it has support access.

## 5. What exists — build on it (verified 2026-10-16; re-checked against `main` 2026-10-19, D-123)

| Concern | Where |
|---|---|
| Route chain | `lib/api/guard.ts` `withApi` (auth, tenant, permission, Zod); sweep `e2e/api/route-sweep.spec.ts` (every new route needs a probe) |
| Permission | `ai.use` in core `rbac.ts` — all ten roles hold it |
| Readers (context) | assessment `lib/assessments/*`, gaps `lib/gaps/shape.ts`, ROPA `lib/ropa/shape.ts`, the six registers' `lib/*/shape.ts`, `readDashboard`, `readLiveExposure`, the report builders' inputs `lib/reports/{generate,inputs,stakeholders}.ts` |
| Report narration hook | core `reports.ts` `ReportDocument` (sections, notices, notes); a narrative is a new block type printed only once accepted — a narrated report is a new version (D-076) |
| Black box | D-071: `assessment_questions` never `select("*")`; the client sees question text, not codes |
| Secrets gate | `tools/check_service_role.mjs` — extend to `ANTHROPIC_API_KEY` (one server-only module may read it; never `NEXT_PUBLIC_`) |
| Intake rate limiter | `lib/intake/*` (Slice 10 Stage 3a) — the pattern for §4.9 |
| Legal corpus | `docs/legal/` PDFs (Act, Rules, corrigendum) — extract once to text in the repo for the cached prefix |
| Deferred drafts | old app `src/app/api/privacy-notice/{generate, translate}`, `src/app/api/dsr/draft` + `src/lib/dsr/draft.ts`, `src/lib/breach/notification.ts` (the Claude DPBI letter) — D-081.15, D-083, D-088; Slice 13's decommission inventory |

## 5a. What Stage 1a built — Stages 1b–2b build on it (2026-10-19, D-125)

| Concern | Where |
|---|---|
| Routes | `GET /api/v1/organizations/{id}/ai` (status: `available`, `offReason`, `message`, the switch) and `POST …/ai/{task}` — `lib/ai/routes.ts`; sweep probes in `e2e/api/route-sweep.spec.ts` |
| The chain | `lib/ai/gateway.ts` `runAiTask` (off → permission → body → context → limits → provider → guardrails → draft row); `buildContext` switches on the task — **a new task adds a case there** |
| Tasks | core `ai-tasks.ts` `AI_TASKS` / `AI_TASK_SPECS` (read/write permission, effort, `maxTokens`, `legal`, target type) — mirrored by the migration's `app.ai_tasks()`, `app.ai_task_read_permission()` and `ai_drafts_target_type_check`: **a new task is a new migration replacing those** (an applied migration is frozen) |
| Context builders | `lib/ai/tasks/question-helper.ts` — the model to copy: a Zod body, a raw input from the routes' readers, a pure `shape…Context` (allow-list, `stripBankInternals`, `scrubPersonalData`, `detectInjection`, `untrustedJson`), unit-tested in `tests/unit/ai-context.test.ts` |
| Answer | `lib/ai/answer.ts` — `modelAnswerSchema` (Zod) + `MODEL_ANSWER_JSON_SCHEMA` (kept equal by a test) + `evaluateAnswer` (the guardrails, pure); drafting tasks (2a) need their own output schema beside it |
| Prompt | `lib/ai/prompt.ts` — `SYSTEM_PREFIX` (byte-stable: instructions, guidance, Act, Rules, corrigendum), `PROMPT_VERSION` (bump by hand), `CORPUS_VERSION`, `provisionIndex()`; the guidance is `lib/ai/corpus/guidance.ts`; the law `lib/ai/corpus/legal-text.ts` (generated by `tools/extract_legal_corpus.mjs`) |
| Provider | `lib/ai/provider.ts` (interface), `claude.ts` (the only reader of the key), `fake.ts` (`[fake:<scenario>]` markers), `config.ts` (`AI_ENABLED`, `AI_PROVIDER`, `AI_MODEL`, `ANTHROPIC_BASE_URL`, `AI_SERVER_FALLBACK`) |
| Core guardrails | `ai-guardrails.ts` (scrub, allow-list, black box, injection, wording, other tenant), `ai-citations.ts` (index + check), `ai-tasks.ts` (`aiOffReason`, `aiLimitHit`, messages) |
| Database | `ai_drafts` (insert-only in 1a; **1b** let the asker rate it once — §5b; **2a adds `accepted`/`discarded`, its UPDATE grant and the accept/discard audit** — §7b), `organizations.ai_enabled` / `ai_contract_ref` (+ stamps), `ai_industry_signoffs`, `public.ai_usage()` |
| Switch API | `PATCH /api/v1/organizations/{id}` `{ ai: { enabled, contractRef } }` (organization.update) — the Organisation settings toggle in 1b calls this |
| Manual-test tool | `tools/ai_ask.mjs` (ask, `--status`, `--switch`, `--audit`) |
| Built since, in 1b (§5b) | the panel (a calm progress state, not streaming — D-127.1), thumbs up/down (columns on `ai_drafts`), the reference set — its R1 is the live smoke's s.8(10) mislabel (walk-through call 15) |

## 5b. What Stage 1b built — Stages 2a–2b build on it (2026-10-20, D-127)

| Concern | Where |
|---|---|
| Tasks | core `AI_TASKS` = `question_helper`, `evidence_helper`, `gap_helper`, `score_helper`; `AI_TARGET_TYPES`; mirrored by migration `20261021000000_ai_explain_helpers` (`app.ai_tasks()`, `app.ai_task_read_permission()`, `ai_drafts_target_type_check`) — a drafting task (2a) is again a new migration replacing those |
| Builders | `lib/ai/tasks/{evidence,gap,score}-helper.ts` on `tasks/shared.ts` (`createCleaner`, `userTurn`, `ShapedContext`); `gateway.ts` `buildContext` (`parseBody`, `organisationRaw`, `questionRaw`); reader `lib/assessments/responses.ts` `readResponsesForDomain` |
| Answer | `evaluateAnswer` relabels a cited provision "statute" unless its point names a TrustStack target (core `namesTrustStackTarget`, D-126.3); prompt `2026-10-20.1b`; the wording check exempts a denial or condition for evidence/gap phrases (D-127.15) |
| Panel | `components/ai/assistant-panel.tsx` (`ExplainButton`, `NextSteps`), `lib/client/ai.ts` (`useAiStatus`, `forgetAiStatus`); used in `answer-panel.tsx`, `assessment-detail.tsx` (`ai-next-steps.ts`), `score-panel.tsx` (`Scorecard explain`), `domain-score-tile.tsx`, `gap-register.tsx`, `actions-dashboard.tsx`. **A drafting task (2a) needs its own output schema and an "accept → pre-fill the form" path; the panel shows explain answers only** |
| Feedback | `ai_drafts.feedback`, `feedback_comment`, `feedback_by`, `feedback_at`; `POST …/ai/drafts/{draftId}/feedback`; guard `app.guard_ai_draft_update()` (only the rating changes) — **2a's `accepted` / `discarded` must replace this guard and widen `ai_drafts_status_check`**, keeping the rating rule |
| Settings | `app/dashboard/organization/ai-form.tsx` (tab `ai`); `GET /organizations/{id}` `ai.enabledByName` |
| Reference set | core `ai-reference-set.ts` (`AI_REFERENCE_SET` 20 explain cases, `checkReferenceAnswer`), `tests/unit/ai-reference-set.test.ts`; live: `tools/ai_reference_run.mjs` (results `docs/testing/slice11-1b/reference_run_live.md`, 20/20) |
| Tools | `tools/ai_manual_test_1b.mjs`, `tools/ai_panel_shots.mjs`, `tools/ui_shots.mjs` (`ONLY=`) |
| Free e2e tenants | `…a030` onwards (`…a028` API helpers, `…a029` the panel) |

## 5c. What Stage 2a built — Stage 2b builds on it (2026-10-20, D-129, D-130)

| Concern | Where |
|---|---|
| Tasks | core `AI_TASKS` + `ropa_draft`, `breach_intimation_draft`, `rights_response_draft` (`kind: "draft"`, effort medium, `writePermission` set; the intimation and the letter `legal: true`); `AI_DRAFT_TASKS`; `AI_TARGET_TYPES` + `ropa_new` (no id), `breach_incident`, `rights_request`. Mirrored by migration `20261022000000_ai_register_drafts` (`app.ai_tasks()`, `app.ai_task_read_permission()`, **`app.ai_task_write_permission()`**, the target CHECK) — **a 2b task is again a new migration replacing them** |
| Decisions | `ai_drafts.status` `draft · rejected · accepted · discarded`; `accepted_output` (the person's text, accepted only), `decided_by` / `decided_at` stamped; `app.guard_ai_draft_update()` = 1b's rating rule line for line + one decision by a write-permission holder; policy `ai_drafts_update_decision` OR'd with 1b's — **the guard, not the policies, keeps each change to its people**; trigger `ai_drafts_audit_decision` (`ai.draft.accepted` / `…discarded`, `edited`, never the text) — eight AI triggers |
| Shapes | `lib/ai/drafts.ts`: `DRAFT_MODEL_SCHEMAS` + `DRAFT_JSON_SCHEMAS` (kept equal by a test), `evaluateDraft` (1a's checks on every string; lists kept to the first eight; a letter stating an outcome or without `[Name]`/`[reference]` refused), `ACCEPTED_DRAFT_SCHEMAS`. Core `ai-drafts.ts`: `AI_INTIMATION_SECTIONS` (Rule 7(2)'s order; (iv) and (vi) `by: "server"`), `intimationPlainText`, `statesRightsOutcome`, the ROPA field lists. **A 2b draft (notice, translation, narrative) adds its schema here** |
| Builders | `lib/ai/tasks/{ropa-draft,breach-intimation,rights-response}.ts`; `ShapedContext.target.id` may be null and `facts` carries what the SERVER writes into a draft; `gateway.ts` checks `writePermission` beside the read one and picks the schema by `isDraftTask` |
| Routes | `GET …/ai/drafts?targetId=&task=&status=`, `GET …/ai/drafts/{id}`, `POST …/ai/drafts/{id}/accept` (`{ output }`), `…/discard` — `lib/ai/routes.ts`, sweep probes |
| Panel | `components/ai/draft-panel.tsx`: `DraftButton` (needs `ai.use` + the register's read and write), the drafting panel (describe → edit → Accept / Discard; `Feedback` shared from `assistant-panel.tsx`), `AcceptedDraft` (Copy, Download .txt). Used in `ropa-register.tsx` (→ `/dashboard/ropa/new?draft=`, `RecordView` `draftId`), `breach-detail.tsx` (Rule 7(2)(b) step), `rights-detail.tsx` (Response; the outcome starts unchosen after a draft) |
| Reference set | `AI_REFERENCE_SET_VERSION` `2026-10-20.2a`; `AI_DRAFT_REFERENCE_SET` D1–D10 + `checkDraftReferenceAnswer` (`refusalPasses` for D7); live `node tools/ai_reference_run.mjs --drafts` (records fictional fixtures on the local MU) → `docs/testing/slice11-2a/reference_run_live.md` 10/10 |
| Prompt | the cached prefix unchanged; drafting instructions in each task's user turn; `PROMPT_VERSION` `2026-10-20.2a` |
| Tools | `tools/ai_manual_test_2a.mjs`, `tools/ai_draft_shots.mjs`; free e2e tenants `…a032` onwards (`…a030` API, `…a031` UI) |

## 5d. What Stage 2b built — the slice's close builds on it (2026-10-22, D-133, D-134)

| Concern | Where |
|---|---|
| Tasks | core `AI_TASKS` + `notice_draft`, `notice_translation_draft` (`consent.read` / `consent.write`), `report_narrative_draft` (`report.read` / `report.generate`), all `legal: true`; `AI_TARGET_TYPES` + `notice_new` (no id), `privacy_notice`, `report`. Mirrored by migration `20261023000000_ai_notice_narrative` |
| Reports | `reports.document` (jsonb; the three narratable kinds keep the document they printed, written once by `complete_report(org, id, p_document)`), `narrated_from_id`, `narrative_draft_id` (composite FKs); `app.report_narratable_kinds()`; `public.begin_narrated_report(org, report, draft)`; `app.report_is_immutable()` replaced (document in the finish step; two new cleared pointers). `lib/reports/generate.ts` `runGeneration` (shared chain), `NARRATABLE_KINDS`; `lib/reports/narrate.ts` (`readNarratableReport`, `generateNarratedReport`, `pendingNarratives`, `narrativeNumberProblem`); route `POST …/reports/{id}/narrate` (`report.generate`, sweep probe); the list's `narratable`, `narratedFromId`, `pendingNarrativeDraftId` |
| Core rules | `ai-drafts.ts`: `isNoticeSource`, `AI_TRANSLATION_LANGUAGES` (hi, mr), `translationKeyProblems`, `statedNumbers` / `numbersNotInDocument` (citations exempt), `narrativeSection`, `narratedDocument`; `ai-tasks.ts` `AI_NARRATIVE_NUMBERS_MESSAGE`, `AI_TRANSLATION_KEYS_MESSAGE` |
| Schemas | `lib/ai/drafts.ts`: notice (title, summary, purposes — no "other means", no status), translation (same; language and keys the server's), narrative (headline, paragraphs ≤ 4, bullets ≤ 8; `law.minItems: 1` in its JSON schema only); the person's accept re-checked against the source (`lib/ai/routes.ts` `checkAcceptedAgainstSource`) |
| Builders | `lib/ai/tasks/{notice-draft,notice-translation,report-narrative}.ts` (`noticeSourceRecords`, `maskNames`), tested in `tests/unit/ai-context-2b.test.ts` |
| UI | `components/ai/draft-panel.tsx` (`NoticeFields`, `NarrativeFields`, `DraftButton` `label` / `size`); `consent-home.tsx` ("Draft a notice…"), `notice-editor.tsx` (`?draft=`, "Translate into Hindi / Marathi"), `reports-centre.tsx` ("Draft a narrative", "Print the narrated version", "With narrative · figures of vN") |
| Reference set | `AI_REFERENCE_SET_VERSION` `2026-10-22.2b`; D11–D20 (`facts` for CI; `purposeKeys`, `script`; D19, D20 `refusalPasses: "wording"`); live `node tools/ai_reference_run.mjs --only D11,…,D20` → `docs/testing/slice11-2b/reference_run_live.md` 10/10 |
| Prompt | `PROMPT_VERSION` `2026-10-22.2b` (the narrative's user turn); the cached prefix unchanged |
| Tools | `tools/ai_manual_test_2b.mjs`, `tools/ai_notice_shots.mjs`; free e2e tenants `…a034` onwards (`…a032` API, `…a033` UI) |

## 6. Data-protection position — FOR ANIKET'S APPROVAL (then counsel's)

1. **Sub-processor — the contract chain (A1).** Anthropic processes prompts
   on TrustStack's behalf. Before any client turns AI on: (a) TrustStack signs
   the provider's data processing addendum for the API account; (b)
   TrustStack's client DPA gains an AI sub-processor clause — provider, purpose,
   data categories sent, region, retention, and the client's right to keep it
   off. The client's contract reference is recorded when AI is turned on
   (§4.8, A2). Nothing is sent for a client that has not agreed.
2. **What is sent** is minimised by §4.6: register facts and drafts, no Data
   Principal's identity, no evidence contents.
3. **Where it runs.** Inference may run outside India. s.16(1) permits it
   unless a destination is restricted by notification; check the current
   notifications and any Rule 15 orders at Stage 1a, record the result in
   DECISIONS with the date, and re-check at every slice. If the API offers a
   region the client prefers, use it — do not assume an India region exists.
   **Sector rules (s.16(2)) and SDFs (Rule 13(4))** keep `bfsi` (which covers
   insurance) and `healthcare` tenants, and SDFs, off by default (§4.8, A4).
4. **Retention and incidents (A5).** Ask for zero data retention on the API
   account, or write the provider's actual retention into the client DPA;
   models that require 30-day retention are not used. The provider contract
   must notify TrustStack of an incident quickly enough for the client to meet
   Rule 7.
5. **Not a certification.** Every output says it is a draft for a person, and
   legal drafts are for counsel (D-011).
6. **Counsel signs off A1, A4 and A5 before Mumbai University goes live**
   (Slice 14). Development and the demo tenant proceed on fictional data.

## 7. Stages and approval gates

Four sessions, each small enough to finish, test and hand over cleanly, and each
ending at Aniket's gate with a walk-through and a manual test (§0.6). **Stage 1a
puts every safety rule in place before any screen can call the model.**

| Stage | Start line | Builds | Gate: Aniket approves… |
|---|---|---|---|
| **1a — the safe gateway (no UI)** | "SLICE_11 approved" | The provider interface + Claude implementation (fake in CI; config-driven for §4.14); the versioned corpus (the Act and the Rules extracted to text) + the citation check; migration: `ai_drafts` + RLS + audit trigger, and `organizations.ai_enabled` with the contract reference and the industry/SDF defaults (A2, A4); the gateway route through `withApi` with sweep probes; context builders with allow-lists + the free-text scrub (A3); guardrails (refusal, injection, black box, wording, forced review flags); audit; limits; usage; **one explain task (the Question Helper) through the API only**, to prove the chain end to end; the §8 suites | the guardrail evidence (§8), the off-by-default and industry rules, the black-box and personal-data tests, §6 checked (incl. the s.16 / Rule 15 check recorded with its date), the API answer on MU |
| **1b — explain in the app** | "Start Slice 11 Stage 1b" | The side panel in the B0 shell (§0.7): the **Question, Evidence, Gap/Action and Score helpers** on the assessment, gap and action pages, in §4.13's answer shape, with thumbs up/down; turning AI on and off in Organisation settings (A2's contract reference); the reference set's explain cases | the panel on real MU data, the reference-set results, the panel's UX score, the manual test |
| **2a — drafts for the registers** | "Start Slice 11 Stage 2a" | Drafting tasks: a **ROPA record** from a description, the **Board intimation under Rule 7(2)** from a breach, a **rights response** from a request; accepting a draft pre-fills the register's existing form (nothing writes without a person) — the breach and rights registers keep no letter text, so **§7b's calls (i)–(iii) come first**; the reference set's drafting cases for these | each draft on MU, that nothing writes without a person, the reference-set results |
| **2b — notice, translation, report narrative; close** | "Start Slice 11 Stage 2b" | A **privacy notice** from the processing register and its **translation** (Hindi, Marathi first); the **report narrative** for the Exposure Brief, the Programme Status Report and the evidence pack (a new version, printed only once accepted); the remaining reference cases; Sync Step (promote SLICE_12), the PR into `main`, the hosted migration after the deploy | each draft on MU, the reference-set results, the PR |

### 7a. Stage 1b — the exact build list (written 2026-10-19 by Stage 1a's handover check, against the code) — ✅ DONE: built D-127, approved D-128; kept for the record. Stage 2a's list is §7b

1. **One migration, dated after `20261020000000_ai_gateway`** (1a's is applied locally and
   frozen — never edit it). It replaces `app.ai_tasks()` with the four explain tasks
   `question_helper`, `evidence_helper`, `gap_helper`, `score_helper`;
   `app.ai_task_read_permission()` with `evidence.read`, `gap.read` and `score.read` for the
   new three; and widens `ai_drafts_target_type_check` with their target types. It adds
   thumbs up/down: `ai_drafts.feedback` (`up`/`down`/null), `feedback_comment` (≤ 500,
   scrubbed), `feedback_by`/`feedback_at` (stamped). The UPDATE grant is on those two
   columns only, by the person who asked, once; `ai.feedback` is audited by trigger, never
   the comment. The CI gate "The AI assistant is off unless…" and `tests/rls/ai.test.ts`
   §7 (the mirror) grow with it. Run `pnpm db:types` after.
2. **Core** `ai-tasks.ts`: the three specs (all `kind: "explain"`, effort `low`,
   `legal: false`). The mirror test must keep core and SQL equal.
3. **Context builders** in `lib/ai/tasks/`, each a copy of `question-helper.ts`'s shape —
   Zod body, raw input from the **routes' own readers**, a pure `shape…Context`, a unit
   test planting bank internals and personal data:
   - Evidence Helper — target the response (`assessmentId`, `questionCode`); reads
     `readAssessmentQuestion` + `readResponseForQuestion`; sends file **names** and review
     status, never contents, the reviewer or review notes.
   - Gap/Action Helper — target a gap (`assessmentId`, `gapId`); reads `lib/gaps/shape.ts`
     `readGaps` / `readGapForAction`; sends the gap's question text, severity, state and its
     actions' titles, status and due dates, **owners as roles** (never `names`), notes as
     untrusted data.
   - Score Helper — "why is this domain capped?"; target (`assessmentId`, `domainCode`);
     reads `lib/assessments/score.ts` `readAssessmentScore`; may say THAT evidence held a
     claim down and by how much, from the stored score (pitfall 1), never the cap TABLE,
     a weight or a red-flag rule (§4.5). Its wording check must still reject "the score
     has been changed".
   Add each to `gateway.ts` `buildContext` and a sweep-safe e2e case on a disposable tenant
   (`…a028` onwards are free).
4. **The reference set (§4.13)** — `packages/core/src/ai-reference-set.ts` (versioned):
   about 20 explain cases now (the rest come with 2a/2b), each with its task, input, the
   expected citations, the must-not-say lines and the shape. Run in CI against the
   recorded fake, and by hand against the live model with a small runner (like
   `tools/ai_manual_test.mjs`). **Case 1 is the live smoke's finding** (D-126.3): R1.1
   must not label s.8(10) a TrustStack default. **Build the server rule with it:** in
   `evaluateAnswer`, an entry citing the Act or the Rules is labelled `statute` unless its
   point names a TrustStack target (30 days, 48 h / 12 h alerts, the twelve-month review).
5. **The panel** in the B0 shell (§0.7) — one component, e.g. `components/ai/assistant-panel.tsx`,
   opened by an "Explain" button beside: each question in
   `app/dashboard/assessments/[assessmentId]/answer-panel.tsx` (Question + Evidence
   helpers), each gap in `…/gaps/gap-register.tsx` and each action in
   `app/dashboard/actions/actions-dashboard.tsx` (Gap/Action), and each domain tile in
   `…/domain-score-tile.tsx` / `score-panel.tsx` (Score). §4.13's shape: the answer, why it
   matters, one next-step button (map `nextStep.page` to a real link), the law folded
   (`<details>`), "Tell me more", the review note and the caveat, thumbs up/down with an
   optional comment. `<Notice>` for an off state (show `GET …/ai`'s `message`), a 422
   (the rejection message) and a 429. `useToast()` for "Thanks for the feedback". Hide
   the button with `<Can permission="ai.use">` AND when `GET …/ai` says unavailable.
   **Streaming (§4.12):** either stream the gateway's answer to the panel or show a calm
   progress state for the 15–25 s a live answer takes. Choose one and record it.
6. **Organisation settings** (`app/dashboard/organization/page.tsx`) — an "AI assistant"
   section like `sdf-form.tsx`: the switch, the contract (DPA) reference (required to turn
   it on), who turned it on and when, and the hold message for `bfsi` / `healthcare` / an
   SDF. Shown to everyone, editable with `organization.update` only. It calls the existing
   `PATCH /organizations/{id}` `{ ai: { enabled, contractRef } }`.
7. **Must not change:** the gateway's order (§5a), the guardrails, the 1a migration, the
   key gate, the kill switch default, any score / evidence / gap / action write path, and
   exposure model 1.7.0. No new permission.
8. **The gate:** walk-through + manual test, with a one-command runner like
   `tools/ai_manual_test.mjs` for the API checks plus the panel steps in the browser;
   before/after `.webp` screenshots of the four pages and the settings section; UX_REVIEW
   rows for the panel and the settings section; the reference-set results (fake in CI,
   live by hand).

### 7b. Stage 2a — the exact build list (written 2026-10-20 by Stage 1b's handover check, against the code) — ✅ DONE: built D-130, approved D-131; kept for the record. Stage 2b's list is §7c

**✅ Answered 2026-10-20 (D-129): all three as recommended, (i) with the attach line.** **Three calls to put to Aniket at the start of 2a, before any code** (each a DPDP-consultant
verdict; record the answers in DECISIONS). The code shows the registers keep **no text**
of a Board intimation or a response letter — only facts and references:
- **(i) Where an accepted Rule 7(2) intimation lives.** `breach_incidents` records
  `board_initial_at`, `board_report_at` and `board_report_ref` (the "Detailed report to the
  Board — Rule 7(2)(b)" step in `breach-detail.tsx`), never the text sent.
  *Recommendation:* the accepted, person-edited text lives on the draft row
  (`accepted_output`), shown on that step with Copy and Download. Recording that the report
  was made stays the person's existing step. No breach-register migration.
  *Alternative:* a `board_report_text` column.
- **(ii) The rights response.** `rights_requests.response_summary` (≤ 4,000,
  `RIGHTS_TEXT_LIMIT`) is a summary, recorded with the outcome by the person in
  `rights-respond-form`. *Recommendation:* the draft is a letter with placeholders
  (`[Name]`, `[reference]`). Accepting it shows the letter to copy and pre-fills the
  summary box with the draft's one-paragraph summary. **The outcome (fulfilled / partly /
  declined) is never pre-filled**: a person decides it.
- **(iii) Who may accept or discard a draft.** *Recommendation:* any person holding the
  register's WRITE permission (§4.7) — not only the asker — because the register's own
  write path still decides what is saved. Audited as `ai.draft.accepted` /
  `ai.draft.discarded` (§4.10).

**The build:**

1. **One migration, dated after `20261021000000_ai_explain_helpers`** (both 1a's and 1b's
   are applied locally and frozen).
   - Replace `app.ai_tasks()` with the three drafting tasks added: `ropa_draft`,
     `breach_intimation_draft`, `rights_response_draft`.
   - Replace `app.ai_task_read_permission()`: `ropa.read`, `breach.read`, `rights.read`.
   - Widen `ai_drafts_target_type_check` with `ropa_new` (no target id: a record not yet
     made), `breach_incident` and `rights_request`.
   - Widen `ai_drafts_status_check` to `draft | rejected | accepted | discarded` (§4.4).
     The outcome CHECK must still forbid a half-answer.
   - Add `accepted_output` (jsonb, the person's edited text), `decided_by` and
     `decided_at` (stamped).
   - Add `app.ai_task_write_permission(p_task)`: `ropa.write`, `breach.write`,
     `rights.write` for the three drafting tasks and null for the four explain tasks,
     mirroring core's `writePermission` (the §7 mirror test checks it).
   - Replace `app.guard_ai_draft_update()`: **keep the rating rule exactly** (D-127.7).
     Add one decision, draft → accepted | discarded, once, by a holder of the task's write
     permission (an explain task has none, so it can never be accepted). Nothing else
     changes.
   - Add a second UPDATE policy (`ai_drafts_update_decision`: the task's write
     permission) and the UPDATE grant on `accepted_output` and `status`. **Postgres ORs
     permissive policies**: through the new policy, a writer could reach another person's
     row. So the GUARD, not the policies, must keep a rating to its asker and a decision to
     a writer. Test both ways in `tests/rls/ai.test.ts` §8.
   - Add a trigger for `ai.draft.accepted` / `ai.draft.discarded` (task, target, never the
     text).
   - Grow the CI gate "The AI assistant is off unless…" (rename it "…Stages 1a–2a"). Its
     exact strings change:
     - the tasks string (`question_helper=assessment.read,…`) gains the three drafting
       tasks;
     - the UPDATE-columns check (`feedback,feedback_comment`) becomes
       `accepted_output,feedback,feedback_comment,status`;
     - the asker-only check on `ai_drafts_update_feedback` stays, and a write-permission
       check is added on the new policy;
     - the trigger count stays at seven, unless the decision audit is a new trigger.
   - Grow `tests/rls/ai.test.ts` §7–§8, then run `pnpm db:types`.
2. **Core `ai-tasks.ts`.** Three specs with `kind: "draft"`, effort `medium`, and
   `writePermission` set (`ropa.write`, `breach.write`, `rights.write`). **`legal: true`
   for the intimation and the response** (§4.3: the server forces `legalReviewRequired`
   and "for review by counsel before use"). `legal: false` for the ROPA record, which is a
   register entry, not a legal draft. The gateway must check `writePermission` beside the
   read one: today `runAiTask` checks only `spec.readPermission`.
3. **Drafting output schemas** beside `answer.ts`'s explain schema. Each is a Zod schema
   with its hand-written JSON schema, kept equal by a test, as `MODEL_ANSWER_JSON_SCHEMA` is.
   `evaluateAnswer`'s wording, other-tenant and citation checks run on every string. The
   label rule (D-126.3) applies to their `law` lists.
   - **ROPA:** the create body's own text fields, `lib/ropa/routes.ts` `fields` (`name`,
     `description`, `dataPrincipalTypes`, `dataCategories`, `purpose`, `collectionSource`,
     `sharing`, `retentionRule`, `securitySafeguards`, `lawfulBasis` as a
     `ROPA_LAWFUL_BASIS_CODES` code *for counsel*, `childrenData` / `crossBorder` /
     `aiProcessing` as tri-states). **Never** `riskRatingAssessor` or `status`: those are
     derived or a person's (D-061).
   - **Rule 7(2) intimation:** (a) the description — nature, extent, timing, location,
     likely impact; (b)(i)–(vi) as the Rule lists them. **(iv), "findings regarding the
     person who caused the breach", is always a placeholder** (`[to be completed by the
     organisation — do not name individuals in this draft]`). (vi) is written from
     `principals_intimated_at` and `principals_intimation_method`.
   - **Rights response:** a letter with `[Name]`, `[reference]` and `[date]` placeholders,
     a one-paragraph `summary`, and the law. **No outcome field.**
4. **Builders** in `lib/ai/tasks/`, on `shared.ts`, each unit-tested with planted personal
   data:
   - **ROPA** — body `{ description }`, the person's own words (untrusted, scrubbed),
     plus the organisation and its department and data-principal-type NAMES.
   - **Breach** — `{ breachId }` through `readBreaches` (`lib/breach/shape.ts`). It sends
     nature, severity, the clock facts, location, the count affected, data categories,
     likely impact and containment (free text untrusted, scrubbed). **Never** a recorder,
     a closer, `dismissal_reason` or any name.
   - **Rights** — `{ requestId }` through `readRights` (`lib/rights/shape.ts`). It sends
     kind, status, received / respond-by dates, channel, identity verified yes/no (never
     the method or the person) and the summary (untrusted, scrubbed). **Never**
     `requester_name`, `requester_email`, `requester_phone`, `principal_identifier`,
     `nominee_*` or `requester_capacity` (§4.6).
   Add each to `gateway.ts` `buildContext`.
5. **Routes:** `POST …/ai/drafts/{draftId}/accept` (body: the edited fields) and
   `…/discard`, through `withApi`, each with a sweep probe. The read and write permissions
   are checked again in the database.
6. **Accept pre-fills; the person saves.**
   - **ROPA:** "Use this draft" opens `/dashboard/ropa/new?draft={id}`. `RecordView`
     (`app/dashboard/ropa/record-view.tsx`, whose template picker at ~line 484 already
     pre-fills `name`, `dataPrincipalTypes` and `purpose`) pre-fills from the accepted
     draft. The person saves through the existing `POST …/ropa`.
   - **Breach:** per call (i) (D-129.1), on the Rule 7(2)(b) step — Copy, Download and one line:
     attach the copy actually sent under the breach's Documents.
   - **Rights:** per call (ii), on `rights-respond-form` (`rights-response-summary`).
   - Nothing writes a register row without a person's click on the register's own Save.
7. **The panel gets a drafting mode** (`components/ai/assistant-panel.tsx`):
   - editable fields;
   - "For review by counsel before use" on a legal draft;
   - Accept / Discard;
   - the same review note, caveat and thumbs.
   The buttons go on the ROPA register ("Draft a record from a description"), the breach's
   Rule 7(2) step and the request's respond step, each hidden without the register's
   write permission.
8. **The reference set's drafting cases** (`ai-reference-set.ts`, a new version): about ten.
   - **ROPA ×3:** a purpose stated; a lawful basis only as a note for counsel; children
     flagged.
   - **Rule 7(2) ×4:** seventy-two hours with "such longer period as the Board may allow";
     (iv) never names a person; (vi) from the recorded intimation; no "compliant".
   - **Rights ×3:** no identity; placeholders; never an outcome.
   `checkReferenceAnswer` grows a drafting shape check. Run it in CI on recorded answers
   and by hand live (`tools/ai_reference_run.mjs`).
9. **Must not change:**
   - the explain helpers, the gateway's order, and the guardrails as approved (D-126,
     D-128);
   - the rating rule, the kill switch, the key gate;
   - every register's write path (accept only pre-fills);
   - exposure model 1.7.0;
   - no new permission.
   Free e2e tenants are `…a030` onwards.
10. **The gate:** walk-through and manual test, with a one-command runner like
    `tools/ai_manual_test_1b.mjs` (strip colour codes from any child process's output —
    D-128) plus the browser steps. Before/after `.webp` of the ROPA register and new
    record, the breach's Rule 7(2) step and the request's respond step. UX_REVIEW rows.
    The drafting cases, recorded in CI and live by hand.

### 7c. Stage 2b — the exact build list (written 2026-10-21 by Stage 2a's handover check, against the code)

**CI: green on `3a5d05b` (2026-10-21) — D-131.3 is met.** GitHub refused every run on this branch from
`f5628b0` to `e278731` (billing); Aniket fixed billing on 2026-10-21, and `3a5d05b` (D-132's CI change on
top of all of Stage 2a) was the first full CI run of Stage 2a's code: every job green — core 1,391 ·
web unit 864 · RLS 574 · e2e 469/469, exactly the local numbers. A later documents-only commit skips the
app's heavy jobs (D-132), so its run shows them "skipped"; that is expected. If anything under `apps/`,
`packages/`, `supabase/` or `.github/` changes before 2b starts, check that its run is green first.
CI minutes past GitHub Free's 2,000 a month are paid ($15 Actions budget): run the gates locally first;
never push just to see CI. CI is the authority for e2e (PLAYBOOK §2).

**Three calls to put to Aniket at the start of 2b, before any code** (each a DPDP-consultant
verdict, checked in `docs/legal/`; record the answers in DECISIONS). What the code does today:

- **(i) A narrated report and its figures.** `POST …/reports/{id}/regenerate` (`lib/reports/routes.ts`)
  makes a NEW version; for an exposure report `public.begin_report(p_organization_id, p_kind,
  p_format, p_subject_user_id)` records a **fresh** exposure snapshot, and the registers are read
  live (`lib/reports/{generate,inputs,stakeholders}.ts`). The `reports` row keeps only the file —
  no document. So a narrative written about version N, printed on version N+1, could describe
  figures that have moved (pitfall 1: "anything the AI says about a score must come from the stored
  score"). *Recommendation:* store each Exposure Brief, Programme Status Report and evidence
  pack's built `ReportDocument` (core `reports.ts`) with its row (a `reports.document` jsonb,
  written by `complete_report`); the narrative is drafted FROM that stored document; accepting it
  renders version N+1 as **version N's stored document plus the narrative block** — the same
  snapshot, the same figures, a new file, the old version untouched (D-076). And a server check:
  **every number in the narrative must appear in the stored document** (else `invalid_output`).
  *Alternative:* narrate at generate time and reuse the snapshot id through a new
  `begin_report` parameter — the registers may still move between the two versions.
- **(ii) Which languages a translation offers.** `app.consent_languages()` holds English and the
  22 Eighth Schedule languages (s.5(3)); a widget defaults to `['en','hi','mr']`; §4.13 says
  "Hindi, Marathi first". *Recommendation:* 2b offers **Hindi and Marathi only**; another language
  is added once its own reference cases pass live. A translation keeps every purpose's `key` and
  the purposes' count (a server check), and is a legal draft for counsel.
- **(iii) What a privacy notice is drafted from.** A notice accompanies a request for CONSENT
  (s.5(1), s.6; Rule 3). *Recommendation:* draft from the processing records whose
  `lawfulBasis` is `consent` or not yet decided (`lib/ropa/shape.ts` `readAllRecords`) — never a
  s.7 legitimate use, which needs no consent notice; the Board-complaint and withdrawal sentences
  stay TrustStack's fixed texts (core `BOARD_COMPLAINT_TEXT`, `WITHDRAW_TEXT`), never drafted;
  the contact for rights is a `[placeholder]`.

**The build:**

1. **One migration, dated after `20261022000000_ai_register_drafts`** (1a, 1b and 2a are applied
   locally and frozen):
   - replace `app.ai_tasks()` with `notice_draft`, `notice_translation_draft`,
     `report_narrative_draft` added; `app.ai_task_read_permission()` → `consent.read`,
     `consent.read`, `report.read`; `app.ai_task_write_permission()` → `consent.write`,
     `consent.write`, `report.generate`;
   - widen `ai_drafts_target_type_check` with `notice_new` (no id), `privacy_notice` (the
     source notice) and `report` (the narrated version);
   - per call (i): `reports.document` (jsonb, the three kinds) and the narrated version's link to
     its accepted draft (`narrative_draft_id`, composite FK to `ai_drafts (organization_id, id)`,
     D-027), and whatever `begin_report` / `complete_report` need — **a report stays immutable**
     (`reports_immutable`, the CI gate "A report is a record…");
   - grow the CI gate "…Stages 1a–2a" → "…Stages 1a–2b": the tasks string and the write string
     gain the three tasks; the trigger count stays eight unless a trigger is added;
   - grow `tests/rls/ai.test.ts` §7 and §9; `pnpm db:types`.
2. **Core `ai-tasks.ts`:** three specs, `kind: "draft"`, effort medium, `legal: true` for all three
   (a notice, a translation, a report narrative are legal drafts, §4.3); `AI_TARGET_TYPES` grows.
3. **Schemas** beside 2a's in `lib/ai/drafts.ts` (Zod + JSON, kept equal by a test; lists kept to
   eight; 1a's checks on every string):
   - **notice:** `title`, `summary`, `purposes[]` (`key` by core `PURPOSE_KEY_PATTERN`, `title`,
     `uses`, `dataItems[]`, ≤ `NOTICE_LIMITS`), `withdrawMeans`, `rightsMeans`, `complaintMeans`
     — the create body's own fields (`lib/consent/routes.ts` `noticeContent`); never a status;
   - **translation:** the same shape in the target language; the server refuses a changed `key`
     or count;
   - **narrative:** per call (i) — a short executive narrative (paragraphs and bullets) for the
     report's front; the number check.
4. **Builders** in `lib/ai/tasks/`, unit-tested with planted personal data: the notice from the
   records (names, purposes, data categories and principal-type NAMES, lawful basis — never an
   owner or a system or vendor's details); the translation from the published notice
   (`lib/consent/shape.ts` `noticeToApi`); the narrative from the stored document (never the
   owner's pack — it names people).
5. **Accept pre-fills; the person saves:** the notice editor takes `?draft={id}` beside its
   existing `?from=` (`app/dashboard/consent/notices/new/page.tsx`, `notice-editor.tsx`) and the
   person saves and publishes through the existing routes (`consent.write`, `consent.publish`); a
   translation pre-fills a new notice in that language; a narrative's accept leads to "Generate the
   narrated version" (`report.generate`), never automatic.
6. **The panel:** `DraftPanel` gains notice fields (purposes editable, as the notice editor's) and
   narrative fields; buttons on the notices page ("Draft a notice from the processing register",
   "Translate into Hindi / Marathi" on a published notice) and on a report row ("Draft a
   narrative"), each hidden without the write permission.
7. **The reference set's remaining cases** (`AI_DRAFT_REFERENCE_SET`, version bump), about ten
   more toward §4.13's "about 50": notice ×4 (only consent purposes; the fixed Board and withdrawal
   texts never rewritten; no person; s.5(1)/Rule 3 order), translation ×3 (keys kept; Hindi;
   Marathi), narrative ×3 (no number absent from the document; never "compliant"; a TrustStack
   target never as statute). Live by hand: `tools/ai_reference_run.mjs` (fixtures as 2a's).
   Before the slice closes: **Aniket's review of R1–R20, D1–D10 and the new cases** (D-128.3).
8. **Close the slice:** the Sync Step (**promote `SLICE_12_reassessment.md` from its stub**,
   written against the code); CI green; PR #41 out of draft, Aniket's approval, merge; then the
   **four Slice 11 migrations applied to hosted after the deploy, in order** (D-071), and
   `gen_db_types --check` against hosted; **`AI_ENABLED` stays unset on the live site until A1**
   (§6).
9. **Must not change:** the explain helpers and 2a's drafting tasks as approved (D-128, D-131);
   the gateway's order; the guardrails, incl. call 15's Option A; the rating and decision rules;
   every register's write path (accept only pre-fills); reports' immutability; the black box
   (D-071); exposure model 1.7.0; no new permission. Free e2e tenants are `…a032` onwards.
10. **The gate:** walk-through and manual test with a one-command runner (strip colour codes),
    before/after `.webp` of the notices page and editor and a report row, UX_REVIEW rows, the
    new cases recorded in CI and live by hand.

**Stage tracker**

| Stage | Status | Aniket's approval |
|---|---|---|
| 1a — the safe gateway (no UI) | ✅ built 2026-10-19 (D-125); manual test 29/29 | ✅ 2026-10-19 "Stage 1a approved", all fifteen calls (D-126) |
| 1b — explain in the app | ✅ built 2026-10-20 (D-127); reference set 20/20 live (Claude's and Aniket's runs); CI green | ✅ 2026-10-20 "Stage 1b approved", all calls incl. 12 (D-128) |
| 2a — drafts for the registers | ✅ built 2026-10-20 (D-129, D-130); drafting cases 10/10 live (Aniket's Part C 9/10) | ✅ 2026-10-21 "Stage 2a approved with Option A" (D-131) |
| 2b — notice, translation, narrative; close | ✅ built 2026-10-22 (D-133–D-135); live D11–D20 10/10 (Claude's and Aniket's Part C after D-135); manual test Part A 39/39 | ✅ 2026-10-22 "Stage 2b approved, including call 11" (D-136) |

## 8. Tests (every stage)

- **Guardrail suite** (fake provider returning hostile outputs, plus a recorded
  set of real ones for the manual smoke): refuses to certify, to approve
  evidence, to override a score, to close a gap, to name another tenant; an
  answer saying "compliant" is rejected; `requiresHumanReview` and
  `legalReviewRequired` forced.
- **Prompt injection**: evidence names, notes, titles and register free text
  carrying "ignore previous instructions…" are wrapped as untrusted data; the
  answer is unchanged and `ai.injection_flagged` is audited.
- **Black box**: no question code, pack, weight, trigger or cap reaches any
  prompt (§4.5).
- **Personal data**: each context builder drops planted personal fields
  (§4.6).
- **Gate 5**: Org A's actor never gets Org B's context or drafts — API and
  RLS; sweep probes for every route.
- **Off by default**: a tenant with `ai_enabled = false` gets a clear 403 and
  no provider call.
- **Citations**: an answer citing a provision the corpus lacks is rejected or
  flagged; every legal claim carries one.
- **Personal data scrub**: planted emails, phone numbers and ID-like numbers
  in free text never reach the prompt.
- **Defaults by industry**: a `bfsi` or `healthcare` tenant, or an SDF, cannot
  turn AI on without the recorded sign-off.
- **Reference-answer set**: every case keeps its shape, citations and
  must-not-say lines (run in CI against the recorded fake; against the live
  model by hand before each release).
- Audit for every call and every accept/discard; usage recorded.

## 9. Known pitfalls

1. **The model is not the authority** — the engine, the reviewer and counsel
   are. Anything the AI says about a score must come from the stored score.
2. **Never present a TrustStack target as statute** (Slice 10 pitfall 1) —
   30 days, 48 h / 12 h, twelve-month reviews are ours.
3. **Caching is a prefix match**: keep the corpus and instructions first and
   byte-stable; per-request context after the cache breakpoint; verify with
   `cache_read_input_tokens`.
4. **No assistant prefill, no forced tool choice** on current Claude models;
   use structured outputs.
5. Carried: new route ⇒ sweep probe; migration ⇒ `pnpm db:types`; local gates
   on the local stack only; drafts and reports are permanent — create them on
   disposable tenants in e2e (`…a030` onwards free after Stage 1b).
