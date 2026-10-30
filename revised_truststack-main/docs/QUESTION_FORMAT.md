# Question packs — format, mapping and seeding rules

How assessment content is authored, where it lives, and how the Slice 3 seeder
turns it into database rows.

## Where content lives

| Source | Questions | Status |
|---|---:|---|
| `docs/source/*.xlsx` → `Question_Bank` | 98 core (`CORE_DPDP_V1`) | Validated (Step 12). Extracted to `packages/db/question-bank/core-pack.json` by `tools/extract_core_pack.py` |
| `docs/source/*.xlsx` → `MU_Overlay` | 10 (`U1`–`U10`) | **Fully reconciled into the University file (D-031).** U3 had no equivalent and became `UNI-GOV-009` |
| `docs/question_packs/industry/*.md` | **1,429** across 10 industries | Authored by Aniket, draft for counsel review |
| `docs/question_packs/OVERLAP_UNIVERSITY_CORE.md` | — | All 108 University questions classified against the 98 core ones (D-031) |
| `docs/question_packs/INVENTORY.md` | — | Generated summary. Re-run `tools/question_inventory.py --markdown` |

**The bank is 1,527 questions** (98 core + 1,429 industry), seeded into
`questions` / `question_versions`. `dpdp_domains` and `question_packs` come from
the migration; the questions come from the seeder, which parses the Markdown on
every run so there is no second copy to go stale (D-034).

**The Markdown files are the authoring source of truth (D-013).** Edit them, not a
copy. CSV remains accepted for small additions (`docs/templates/`), but nobody
needs to re-key the Markdown into CSV.

## Canonical record — what the seeder produces

Adopted from the field model in `01_University_*.md` §16, so authored content and
schema agree:

| Field | Required | Source / rule |
|---|---|---|
| `question_code` | ✅ | The `Code` cell, backticks stripped. Unique across all packs. Stable forever. |
| `question_text` | ✅ | `Question / Check` · `Assessment question` · `Question` |
| `industry_code` | ✅ | From the file: `university`, `edtech`, `bfsi`, `healthcare`, `saas`, `manufacturing`, `retail_ecommerce`, `professional_services`, `public_sector`, `general` |
| `pack_code` | ✅ | See pack taxonomy below |
| `domain_code` | ✅ | Primary domain — one of the 16 codes. Section heading, or the `Domain` column |
| `secondary_domain_codes` | — | Extra codes from a `Domain` cell such as `PURPOSE / INV` |
| `applicability` | ✅ | `mandatory` · `conditional` · `potentially_applicable`. **Resolved when the bank is loaded, not per assessment (D-033):** `conditional` means the condition is machine-evaluable; one that is not becomes `potentially_applicable` |
| `trigger_condition` | conditional only | The JSON expression (`{field, operator, value}`, `{all:[…]}`, `{any:[…]}`) from `mapTriggerText`. Non-null **iff** applicability is `conditional` — two CHECK constraints enforce it |
| `type_text` | — | The authored `Type` / `Trigger` cell verbatim, so the long tail of one-off labels is preserved without diluting `risk_tags` |
| `criticality` | core only | The workbook's `Criticality`. Absent from every authored Markdown file |
| `truststack_module` | core only | The workbook's `TrustStack Module` — the register a question's evidence lands in (Slice 10) |
| `risk_tags` | — | From `Type`, a CLOSED vocabulary: `advanced`, `ai_linked`, `children_linked`, `evidence_heavy`, `high_risk`, `marketing_linked`, `payment_linked`, `reassessment_trigger`, `vendor_linked`. An unrecognised label is dropped here and kept in `type_text` — never invented into a tag |
| `evidence_guidance` | ✅ | `Evidence to verify` · `Evidence to check` · `Evidence` |
| `risk_if_weak` | — | `Risk if weak` · `Why / risk if weak` · `Why it matters` |
| `suggested_owner` | ✅ | `Owner` · `Suggested owner` — a role, never a person |
| `priority` | — | `P0`–`P3`, or **`null`** where the authored file has no Priority column (234 questions). Never guessed. The core pack derives it from the workbook's `Criticality` by the documented equivalence below |
| `na_rule` | ✅ | When Not Applicable is allowed and what reason the assessor must give (D-029.3) |
| `legal_control_basis` | — at seed · ✅ before GA | Specific Act section / Rule. **Absent from all 1,527.** The workbook's generic sentence is a placeholder, stored as `null`; CI fails if it ever reaches the database |
| `recommended_fix` | — | Absent from industry files; Slice 6 derives actions from `risk_if_weak` + domain library |
| `version`, `status` | ✅ | `1.0`, `draft` until counsel approves |

### Column aliases — the authored layouts

| File | Columns as authored |
|---|---|
| University | Code · Question / Check · Trigger · Evidence to verify · Risk if weak · Owner · Priority |
| EdTech | Code · Assessment question · Type · Evidence to check · Owner · Priority |
| BFSI | Code · Assessment question · Type / trigger · Evidence to check · Suggested owner · Priority |
| Healthcare | Code · Assessment question · Type · Evidence to check · Risk if weak · Owner · Priority |
| SaaS | Code · Question · Evidence to check · Suggested owner |
| Manufacturing | Code · Assessment question · Type · Evidence to check · Risk if weak · Suggested owner · Priority |
| Retail, General | Code · (Assessment) question · Type · Evidence to check · (Risk if weak) · Suggested owner · Priority |
| Professional Services | Code · Assessment question · Why it matters · Evidence to check · Suggested owner · Priority · Type |
| Public Sector | Code · Question · Why / risk if weak · Evidence to check · Suggested owner · Priority |
| Process packs (BFSI §11, Healthcare §13) | Code · Question · Domain · (Evidence) |

The seeder maps by header name, never by column position.

### `Type` carries two different things

`Type` mixes **applicability** with **risk tags** — `High-risk / Payment-linked`,
`Evidence-heavy`, `Children-linked`. Split it: `Mandatory`/`Conditional` →
`applicability`; everything else → `risk_tags`. A `Type` with no applicability
word defaults to `mandatory`.

Text after `Conditional:` / `Mandatory if` / `Mandatory where` / `Trigger:`
becomes the human-readable `trigger_text`. **A trigger phrase is taken whole and
never split on `/`** — `Conditional: multi-campus/affiliated structure` is one
condition, not two.

**`Mandatory if X` and `Mandatory where X` resolve to `conditional`** (D-033): a
question that applies only when X holds is not mandatory for everyone, and
`Config`'s own D13 default applicability agrees. This is why the core pack's
`V1.1`–`V1.6` ("Mandatory where vendors exist") are conditional — and why an
organisation with no Data Processors is asked 92 of the 98 core questions.

### `trigger_text` → `trigger_condition`

`mapTriggerText()` in `packages/core/src/triggers.ts` is a **reviewed lookup
table of 46 phrases, never NLP**. An unrecognised phrase returns `null`, and the
question becomes `potentially_applicable`: shown to the assessor, answered or
marked N/A with a reason, never hidden (D-029.3).

Of the **110 distinct authored trigger phrases**, about 30 map today. The rest
are D-029's wizard-field backlog — the generator prints them by name on every
run, so the gap is measured rather than estimated. Guessing a mapping would be
worse than admitting one is missing: a wrong expression silently HIDES a
question a client needed to answer.

### Priority → gap severity

`P0 → critical` · `P1 → high` · `P2 → medium` · `P3 → low`. Priority is an
authored *hint*; the gap engine (Slice 6) still derives severity from the adjusted
score and red flags.

The core pack authored **`Criticality`** instead of `Priority`, so the extractor
applies the same equivalence in reverse — `Critical → P0`, `High → P1`,
`Medium → P2` — and keeps `criticality` verbatim as well. That is a documented
mapping, not new content; where a file authored neither, priority stays `null`.

## Pack taxonomy — four tiers

1. **Core** — `CORE_DPDP_V1`. Every assessment.
2. **Industry overlay** — one per industry, e.g. `UNIVERSITY_HIGHER_ED_V1`,
   `BFSI_OVERLAY_V1`. Loaded by `industry_code`.
3. **Conditional / process packs** — loaded by scope triggers, e.g.
   `UNIVERSITY_AI_PROCTORING_V1`, `UNIVERSITY_CONDITIONAL_V1`, plus cross-industry
   `CHILDREN_DATA_V1`, `VENDOR_PROCESSOR_V1`, `AI_RISK_V1`, `CLOUD_CROSSBORDER_V1`,
   `MARKETING_TRACKING_V1`, `SDF_READINESS_V1`.
4. **Reference** — `UNIVERSITY_REFERENCE_V1`. In the bank and browsable,
   **never generated** (D-032). It is how the 78 University questions that
   overlap core stay visible without being asked twice.

A pack also has a `status`: **the generator refuses anything but `approved`.**
Only `CORE_DPDP_V1` and the four University packs are approved today; the nine
other industry overlays are `draft` until each has had its own overlap
exercise (D-032). The six cross-industry conditional packs exist as rows with
**no authored questions at all** — a content gap, visible in the bank browser.

Overlay and process questions **add to the 16-domain score; they never create a
separate score** (D-014 — stated in the authored files themselves). Only the
**primary** domain scores; secondary codes are cross-reference tags (D-029.2).

## What reaches an assessment

A generated question set is a **snapshot**: `assessment_questions` copies the
text, domain, weight and version, so editing the bank afterwards cannot change
an assessment that already exists. Each row records why it is there:

| `included_reason` | Meaning |
|---|---|
| `core` | A mandatory question from the core pack |
| `overlay` | A mandatory question from an industry overlay |
| `trigger:<expression>` | Conditional, and the expression evaluated true against the scope |
| `potentially_applicable` | The condition cannot be decided from the scope — shown, answered or marked N/A with a reason |

A conditional question whose expression evaluates **false** is excluded and
reported by code, phrase and expression — not silently dropped.

## Invariants checked in CI today

`tools/question_inventory.py` (docs workflow) fails the build if a code is
duplicated anywhere, a question resolves to no domain, or an industry file stops
covering all 16 domains. It is kept as an INDEPENDENT cross-check of the
TypeScript parser in `packages/core/src/questions.ts`, which must agree with it.

Also enforced:

| Gate | Where |
|---|---|
| `core-pack.json` matches the workbook | docs workflow, `tools/extract_core_pack.py --check` |
| The University baseline is still exactly 10 questions (D-031) | docs workflow |
| Active domain weights total exactly 100.00 | app workflow (SQL), a deferred constraint trigger, and `assertDomainWeightsTotal()` |
| The bank and the snapshot have no user write grant | app workflow (SQL) |
| No question version carries the placeholder legal basis | app workflow (SQL) |
| Seed counts, including 1,527 questions and MU's 124 | app workflow |
| The whole bank parses: 1,527 questions, no duplicate code, 16/16 domains per file | `apps/web/tests/unit/question-bank.test.ts` |
| The migration's domains and packs equal `packages/core` | same file (D-020) |

## Known content gaps — for Aniket and counsel

| # | Gap | Scope | Blocks |
|---|---|---|---|
| 1 | **SaaS has no `Priority` column** | 156 questions | Seeded as `null`, shown as "—"; needs priorities before a SaaS client |
| 2 | **Process-pack rows lack priority** (BFSI §11, Healthcare §13) | 78 questions | As above |
| 3 | **No per-question `legal_control_basis`** anywhere | 1,527 questions | Report defensibility before GA |
| 4 | ~~Multi-domain process rows~~ | 21 questions | ✅ Settled: first code is primary and the only scoring domain (D-029.2) |
| 5 | ~~Overlap with core~~ | University 108 vs core 98 | ✅ Settled 2026-09-18: baseline is 98 + 10 (D-031, `OVERLAP_UNIVERSITY_CORE.md`) |
| 6 | **The six cross-industry conditional packs have no questions** | 0 authored | `CHILDREN_DATA_V1`, `VENDOR_PROCESSOR_V1`, `CLOUD_CROSSBORDER_V1`, `AI_RISK_V1`, `MARKETING_TRACKING_V1`, `SDF_READINESS_V1` |
| 7 | **The nine non-University overlays have no overlap map** | 1,321 questions | Each is `draft`; needed before that industry is sold (D-032) |
| 8 | **80 of 110 authored trigger phrases are unmapped** | 140 conditional questions | Shown as Potentially Applicable; wizard fields would turn judgement back into derivation (D-029) |
| 9 | **Five core gaps found by the overlap exercise** | core pack | No training question at all; no approval authority; no roadmap; erasure misses backups; grievance records unprotected. `OVERLAP_UNIVERSITY_CORE.md` §6 |

Plus the four core-pack gaps against the Rules text, still open:

| Rule | Requirement | Current core question | Gap |
|---|---|---|---|
| 8(3), 6(e) | Retain data, traffic data and logs **≥ 1 year** | `RE1.5` "as required" | No test of the floor |
| 14(3) | Grievance response within **≤ 90 days** | `GR1.4` "timeline" | No SLA tested |
| 9 | Publish contact **and** repeat it in *every* rights response | `GR1.1` publication only | Per-response duty missed |
| 3(c) | Notice links withdrawal, rights, **and complaint to the Board** | `N1.4` "complaint mechanisms" | Board route unnamed |

And **Fourth Schedule Part A(3)**: an educational institution is exempt from
s.9(1)/(3) **only** for tracking and behavioural monitoring for educational
activities or child safety — not a blanket exemption from verifiable parental
consent. Core `CH1.4` should encode that carve-out.

## Adding or changing questions

- Never change the meaning of a published `question_code`. Retire it and add a new
  code; finalised assessments snapshot the text they used.
- Bump the pack version (`_V2`) for material changes.
- Run `python3 tools/question_inventory.py` before committing.
