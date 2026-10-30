/**
 * The ROPA rules live in two places — `app.ropa_*` in the Slice 7 migration
 * (which derives and CHECKs every stored completeness score, band and risk
 * rating, and generates every ROPA gap) and `packages/core/src/ropa.ts`
 * (which the API and the UI use). This parses the SQL and fails if the two
 * ever differ — the mirror rule of D-053, applied to the register.
 *
 * There is no oracle for any of this (the workbook computes nothing), so the
 * mirror is what keeps the two engines honest with each other.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  GAP_ACTION_STATUSES,
  ROPA_APPROVAL_MIN_SCORE,
  ROPA_AREA_CODES,
  ROPA_BANDS,
  ROPA_COMPLETENESS_AREAS,
  ROPA_GAP_RULES,
  ROPA_LARGE_SCALE_THRESHOLD,
  ROPA_NAME_LIMIT,
  ROPA_NO_VENDOR_VALUES,
  ROPA_PLACEHOLDER_VALUES,
  ROPA_RECORD_CODE_PATTERN,
  ROPA_RISK_BANDS,
  ROPA_RISK_FACTORS,
  ROPA_RISK_RATINGS,
  ROPA_STATUSES,
  ROPA_TEXT_LIMIT,
  ROPA_TODO_PREFIX,
  ROPA_TRANSITIONS,
  ROPA_UNRESOLVED_PHRASES,
  SEVERITY_PRIORITY,
  TRI_STATES,
} from "@truststack/core";
import { describe, expect, it } from "vitest";

const MIGRATIONS = path.resolve(import.meta.dirname, "../../../../packages/db/prisma/migrations");
const THIS = "20261003000000_ropa";
const sql = readFileSync(path.join(MIGRATIONS, THIS, "migration.sql"), "utf8");
/**
 * The ROPA migrations, NEWEST first. A rule is read from the latest migration
 * that defines it — the D-065 migration redefined several (an applied
 * migration is frozen, so a change is always a new file).
 */
const STRUCTURE = "20261004000000_ropa_dpdp_structure";
const structureSql = readFileSync(path.join(MIGRATIONS, STRUCTURE, "migration.sql"), "utf8");
const ROPA_SQL = [structureSql, sql];

function block(startMarker: string, endMarker: string, from?: string): string {
  const source = from ?? ROPA_SQL.find((text) => text.includes(startMarker)) ?? sql;
  const start = source.indexOf(startMarker);
  expect(start, `${startMarker} not found in the migrations`).toBeGreaterThan(-1);
  const end = source.indexOf(endMarker, start + startMarker.length);
  return source.slice(start, end);
}

const fn = (name: string) => block(`CREATE OR REPLACE FUNCTION ${name}(`, "$$;");
/** A function's body only — past `SET search_path = ''`, whose quotes are not data. */
const body = (name: string) => fn(name).slice(fn(name).indexOf("AS $$"));
/** The migration without its comments, for "never mentions" assertions. */
const code = sql.replace(/--[^\n]*/g, "");
const quoted = (text: string) => [...text.matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1]!.replace(/''/g, "'"));

describe("completeness — the thirteen areas", () => {
  it("app.ropa_area_codes() lists the areas in core's order", () => {
    expect(quoted(body("app.ropa_area_codes"))).toEqual([...ROPA_AREA_CODES]);
  });

  it("app.ropa_area_weight() carries core's weights", () => {
    const pairs = [...fn("app.ropa_area_weight").matchAll(/WHEN '([a-z_]+)' THEN (\d+)/g)].map((m) => [m[1]!, Number(m[2])]);
    expect(Object.fromEntries(pairs)).toEqual(Object.fromEntries(ROPA_COMPLETENESS_AREAS.map((a) => [a.code, a.weight])));
  });

  it("…which total exactly 100, and the migration asserts it at apply time", () => {
    expect(ROPA_COMPLETENESS_AREAS.reduce((n, a) => n + a.weight, 0)).toBe(100);
    expect(sql).toContain("FROM unnest(app.ropa_area_codes()) a) = 100");
  });

  it("app.ropa_missing_areas() names every area, in order", () => {
    const named = [...fn("app.ropa_missing_areas").matchAll(/THEN '([a-z_]+)' END/g)].map((m) => m[1]);
    expect(named).toEqual([...ROPA_AREA_CODES]);
  });

  it("the score is a sum of whole weights — never a fraction meeting a boundary", () => {
    const body = fn("app.ropa_completeness_score");
    expect(body).toContain("sum(app.ropa_area_weight(a.code))");
    expect(body).toContain("::integer");
    expect(block('CREATE TABLE "ropa_records"', ");")).toContain('"completeness_score" SMALLINT');
  });

  it("the bands' boundaries are core's: 30 / 60 / 80, each in the LOWER band", () => {
    const limits = [...fn("app.ropa_band").matchAll(/p_score <= (\d+) THEN '([a-z]+)'/g)].map((m) => [m[2], Number(m[1])]);
    expect(limits).toEqual(ROPA_BANDS.slice(0, 3).map((b) => [b.band, b.maxScore]));
    expect(fn("app.ropa_band")).toContain("ELSE 'strong'");
  });

  it("approval needs Usable: the same 61", () => {
    expect(Number(fn("app.ropa_approval_min_score").match(/SELECT (\d+);/)![1])).toBe(ROPA_APPROVAL_MIN_SCORE);
  });
});

describe("what 'complete' means — the same words in both places", () => {
  it("the unresolved phrases", () => {
    expect(quoted(body("app.ropa_unresolved_phrases"))).toEqual([...ROPA_UNRESOLVED_PHRASES]);
  });

  it("the placeholders and the to-do prefix", () => {
    const fnBody = fn("app.ropa_text_complete");
    expect(quoted(block("<> ALL (ARRAY[", "]", fnBody))).toEqual([...ROPA_PLACEHOLDER_VALUES]);
    expect(fnBody).toContain(`left(app.ropa_normalise(p_value), ${ROPA_TODO_PREFIX.length}) <> '${ROPA_TODO_PREFIX}'`);
  });

  it("the words that mean 'no Data Processor'", () => {
    expect(quoted(body("app.ropa_is_no_vendor"))).toEqual([...ROPA_NO_VENDOR_VALUES]);
  });

  it("normalising is lower-case, whitespace collapsed, trimmed — as core's", () => {
    expect(fn("app.ropa_normalise")).toContain("btrim(regexp_replace(lower(p_value), '\\s+', ' ', 'g'))");
  });

  it("a vendor list is split on the same characters", () => {
    expect(fn("app.ropa_vendor_count")).toContain("regexp_split_to_table(p_vendors_text, '[,;\\n]')");
  });
});

describe("risk — the same factors, points and ratings", () => {
  it("app.ropa_risk_factor_points() is core's table", () => {
    const pairs = [...fn("app.ropa_risk_factor_points").matchAll(/WHEN '([a-z_]+)' THEN (\d+)/g)].map((m) => [m[1]!, Number(m[2])]);
    expect(Object.fromEntries(pairs)).toEqual(Object.fromEntries(ROPA_RISK_FACTORS.map((f) => [f.code, f.points])));
  });

  it("app.ropa_risk_factors() fires every factor, in core's order", () => {
    const named = [...fn("app.ropa_risk_factors").matchAll(/THEN '([a-z_]+)' END/g)].map((m) => m[1]);
    expect(named).toEqual(ROPA_RISK_FACTORS.map((f) => f.code));
  });

  it("the rating boundaries are core's: 2 / 5 / 8", () => {
    const limits = [...fn("app.ropa_risk_rating").matchAll(/p_points <= (\d+) THEN '([a-z]+)'/g)].map((m) => [m[2], Number(m[1])]);
    expect(limits).toEqual(ROPA_RISK_BANDS.slice(0, 3).map((b) => [b.rating, b.maxPoints]));
  });

  it("the ratings rank in core's order", () => {
    const ranks = [...fn("app.ropa_risk_rank").matchAll(/WHEN '([a-z]+)' THEN (\d)/g)].map((m) => [m[1], Number(m[2])]);
    expect(ranks).toEqual(ROPA_RISK_RATINGS.map((r, i) => [r, i]));
  });

  it("the large-scale trigger is the scope wizard's 1,00,000 (D-028)", () => {
    expect(Number(fn("app.ropa_large_scale_threshold").match(/SELECT (\d+);/)![1])).toBe(ROPA_LARGE_SCALE_THRESHOLD);
  });

  it("an assessor can only RAISE what is shown — a row invariant", () => {
    expect(block("ropa_records_rating_never_lowered", "ADD CONSTRAINT")).toContain(
      "risk_rating = app.ropa_effective_risk(risk_rating_derived, risk_rating_assessor)",
    );
    expect(fn("app.ropa_effective_risk")).toContain("app.ropa_risk_rank(p_assessor) > app.ropa_risk_rank(p_derived)");
    // …and setting a LOWER one is refused outright, with a message.
    expect(fn("app.ropa_record_before_write")).toContain(
      "app.ropa_risk_rank(NEW.risk_rating_assessor) < app.ropa_risk_rank(NEW.risk_rating_derived)",
    );
  });
});

describe("every derived number is a row invariant (the D-044 pattern)", () => {
  it.each([
    ["ropa_records_missing_is_derived", "completeness_missing = app.ropa_missing_areas("],
    ["ropa_records_score_is_derived", "completeness_score = app.ropa_completeness_score(completeness_missing)"],
    ["ropa_records_band_is_derived", "completeness_band = app.ropa_band(completeness_score)"],
    ["ropa_records_factors_are_derived", "risk_factors = app.ropa_risk_factors("],
    ["ropa_records_points_are_derived", "risk_points = app.ropa_risk_points(risk_factors)"],
    ["ropa_records_rating_is_derived", "risk_rating_derived = app.ropa_risk_rating(risk_points)"],
  ])("%s", (name, expression) => {
    expect(block(`ADD CONSTRAINT ${name}`, "ADD CONSTRAINT")).toContain(expression);
  });

  it("the functions those CHECKs call are IMMUTABLE and read no table", () => {
    for (const name of [
      "app.ropa_missing_areas",
      "app.ropa_completeness_score",
      "app.ropa_band",
      "app.ropa_risk_factors",
      "app.ropa_risk_points",
      "app.ropa_risk_rating",
      "app.ropa_effective_risk",
      "app.ropa_text_complete",
      "app.ropa_vendor_count",
    ]) {
      const text = fn(name);
      expect(text, name).toContain("IMMUTABLE");
      expect(text, name).not.toMatch(/FROM public\./);
    }
  });

  it("no user may write a derived or stamped column — the record's grants name content only", () => {
    const grants = ROPA_SQL.flatMap((text) => [...text.matchAll(/GRANT (INSERT|UPDATE) \(([^)]*)\) ON public\.ropa_records/g)]);
    expect(grants).toHaveLength(4);
    for (const [, , columns] of grants) {
      const cols = columns!.split(",").map((c) => c.trim());
      for (const derived of [
        "completeness_score", "completeness_band", "completeness_missing", "risk_factors", "risk_points",
        "risk_rating_derived", "risk_rating", "system_link_count", "vendor_link_count", "evidence_count",
        "version", "approved_by", "approved_at", "created_by", "updated_by", "vendor_contract_gaps",
      ]) {
        expect(cols).not.toContain(derived);
      }
    }
  });

  it("a record is never deleted by a user — it is archived", () => {
    expect(sql).not.toMatch(/GRANT[^;]*DELETE[^;]*ON public\.ropa_records/);
    expect(sql).not.toMatch(/CREATE POLICY ropa_records_delete/);
  });

  it("a ROPA gap has a SELECT grant and nothing else", () => {
    expect([...sql.matchAll(/GRANT (\w+)(?: \([^)]*\))? ON public\.ropa_gaps/g)].map((m) => m[1])).toEqual(["SELECT"]);
  });
});

describe("vocabularies in the CHECKs are core's", () => {
  it("statuses", () => {
    expect(quoted(block("ropa_records_status_check", "),"))).toEqual([...ROPA_STATUSES]);
  });

  it("tri-states", () => {
    expect(quoted(block("ropa_records_children_data_check", "),"))).toEqual([...TRI_STATES]);
  });

  it("bands", () => {
    expect(quoted(block("ropa_records_band_check", "),"))).toEqual(ROPA_BANDS.map((b) => b.band));
  });

  it("the record code pattern", () => {
    const pattern = block("ropa_records_record_code_check", "),").match(/~ '([^']+)'/)![1];
    expect(pattern).toBe(ROPA_RECORD_CODE_PATTERN.source);
  });

  it("text limits", () => {
    expect(block("ropa_records_name_not_blank", "),")).toContain(`char_length(name) <= ${ROPA_NAME_LIMIT}`);
    expect(block("ropa_records_text_length", "ADD CONSTRAINT")).toContain(`<= ${ROPA_TEXT_LIMIT}),`);
  });

  it("gap codes", () => {
    expect(quoted(block("ADD CONSTRAINT ropa_gaps_code_check", "));"))).toEqual(ROPA_GAP_RULES.map((r) => r.code));
  });
});

describe("the lifecycle", () => {
  it("app.ropa_transition_allowed() is core's graph", () => {
    const pairs = [...fn("app.ropa_transition_allowed").matchAll(/\('([a-z_]+)', '([a-z_]+)'\)/g)].map((m) => `${m[1]}→${m[2]}`);
    const core = Object.entries(ROPA_TRANSITIONS).flatMap(([from, tos]) => tos.map((to) => `${from}→${to}`));
    expect(pairs.sort()).toEqual(core.sort());
  });

  it("approval takes two people: evidence.review, not the owner — and a CHECK binds tooling too", () => {
    const trigger = fn("app.ropa_record_before_write");
    expect(trigger).toContain("app.has_permission(NEW.organization_id, 'evidence.review')");
    expect(trigger).toContain("v_actor = NEW.owner_user_id");
    expect(block("ropa_records_no_self_approval", ";")).toContain("approved_by <> owner_user_id");
  });

  it("content changes only while the record is being worked on", () => {
    expect(fn("app.ropa_record_before_write")).toContain("IF v_content_edited AND NEW.status NOT IN ('draft', 'in_review') THEN");
  });

  it("reopening an approved record starts a new version", () => {
    expect(fn("app.ropa_record_before_write")).toContain("NEW.version := OLD.version + 1;");
  });
});

describe("ROPA gaps — the spec's twelve, on the SHARED action table (D-060)", () => {
  const rules = [...fn("app.ropa_gap_rules").matchAll(/\('([a-z0-9_]+)', '([a-z]+)', '((?:[^']|'')*)', '((?:[^']|'')*)'\)/g)].map(
    (m) => ({ code: m[1]!, severity: m[2]!, label: m[3]!.replace(/''/g, "'"), fix: m[4]!.replace(/''/g, "'") }),
  );

  it("the rules — codes, severities, labels and fixes — are core's", () => {
    expect(rules).toEqual(ROPA_GAP_RULES.map((r) => ({ code: r.code, severity: r.severity, label: r.label, fix: r.fix })));
  });

  it("app.ropa_record_gap_codes() can raise every per-record rule, in core's order", () => {
    const named = [...fn("app.ropa_record_gap_codes").matchAll(/THEN '([a-z0-9_]+)' END/g)].map((m) => m[1]);
    expect(named).toEqual(ROPA_GAP_RULES.map((r) => r.code).filter((c) => c !== "no_records"));
  });

  it("severity is the rule's — never question_severity(), which needs an adjusted score", () => {
    expect(block("ropa_gaps_severity_is_derived", "ADD CONSTRAINT")).toContain("severity = app.ropa_gap_severity(gap_code)");
    expect(fn("app.ropa_derived_gaps")).not.toContain("question_severity");
  });

  it("priority follows the shared severity → priority table, so the roadmap needs no change", () => {
    expect(block("ropa_gaps_priority_is_derived", "ADD CONSTRAINT")).toContain("priority = app.question_priority(severity)");
    for (const rule of ROPA_GAP_RULES) expect(SEVERITY_PRIORITY[rule.severity]).toBeDefined();
  });

  it("'today' is India's date (D-055)", () => {
    expect(fn("app.ropa_derived_gaps")).toContain("(now() AT TIME ZONE 'Asia/Kolkata')::date");
    expect(fn("app.refresh_ropa_gaps")).toContain("(now() AT TIME ZONE 'Asia/Kolkata')::date");
  });

  it("an action has exactly one parent", () => {
    expect(block("gap_actions_one_parent", ";")).toContain("num_nonnulls(gap_id, ropa_gap_id) = 1");
  });

  it("the generator never rewrites an existing action, and deletes only untouched gaps (D-057)", () => {
    const engine = fn("app.refresh_ropa_gaps");
    expect(engine).not.toMatch(/UPDATE public\.gap_actions/);
    expect(engine).toContain("AND NOT app.ropa_gap_has_human_work(g.organization_id, g.id)");
    expect(engine).toContain("SET state = 'superseded'");
    expect(engine).not.toContain("audit_logs");
  });

  it("the RPC takes ONE id and no gap data, checks ropa.write, and audits ONCE", () => {
    const signature = block("CREATE OR REPLACE FUNCTION public.generate_ropa_gaps", "RETURNS jsonb");
    expect(signature.match(/p_\w+ /g)).toEqual(["p_organization_id "]);
    const rpc = fn("public.generate_ropa_gaps");
    expect(rpc).toContain("app.has_permission(p_organization_id, 'ropa.write')");
    expect(rpc.match(/INSERT INTO public\.audit_logs/g)).toHaveLength(1);
  });

  it("the shared action trigger keeps D-056's closing rule word for word, and the action workflow is untouched", () => {
    const now = fn("app.gap_action_before_update");
    const slice6 = readFileSync(path.join(MIGRATIONS, "20261002000000_gaps_actions", "migration.sql"), "utf8");
    const before = block("CREATE OR REPLACE FUNCTION app.gap_action_before_update(", "$$;", slice6);
    const closing = (body: string) => body.slice(body.indexOf("IF NEW.status IS DISTINCT FROM OLD.status THEN"));
    expect(closing(now)).toBe(closing(before));
    expect(now).toContain("(NEW.organization_id, NEW.gap_id, NEW.ropa_gap_id) IS DISTINCT FROM");
    expect(GAP_ACTION_STATUSES).toEqual(["open", "in_progress", "blocked", "closed"]);
  });
});

describe("evidence_links gains a THIRD type, and the first two still behave", () => {
  it("accepts exactly three targets", () => {
    expect(quoted(block("ADD CONSTRAINT evidence_links_entity_type_check", ");"))).toEqual([
      "assessment_response",
      "gap_action",
      "ropa_record",
    ]);
  });

  /**
   * Every trigger function EVER attached to evidence_links, counted from all
   * earlier migrations, must be redefined here — and from its latest body, so
   * Slice 6's gap_action branches survive (pitfall 4).
   */
  it("every trigger function on evidence_links is redefined in this migration", () => {
    const attached = new Set<string>();
    for (const dir of readdirSync(MIGRATIONS).filter((d) => d < THIS && !d.endsWith(".toml")).sort()) {
      const earlier = readFileSync(path.join(MIGRATIONS, dir, "migration.sql"), "utf8");
      for (const m of earlier.matchAll(/ON public\.evidence_links\s+FOR EACH ROW EXECUTE FUNCTION (app\.\w+)\(/g)) {
        attached.add(m[1]!);
      }
    }
    attached.delete("app.audit_scope_change");
    expect([...attached].sort()).toEqual([
      "app.evidence_link_after_delete",
      "app.evidence_link_after_insert",
      "app.evidence_link_before_delete",
      "app.evidence_link_before_insert",
    ]);
    for (const name of attached) expect(sql).toContain(`CREATE OR REPLACE FUNCTION ${name}()`);
  });

  it("BEFORE INSERT keeps both earlier branches and adds the third", () => {
    const body = fn("app.evidence_link_before_insert");
    expect(body).toContain("IF NEW.linked_entity_type = 'assessment_response' THEN");
    expect(body).toContain("ELSIF NEW.linked_entity_type = 'gap_action' THEN");
    expect(body).toContain("ELSIF NEW.linked_entity_type = 'ropa_record' THEN");
    expect(body).toContain("'Evidence cannot be linked to that.'");
    // The object-exists rule applies to all three, after the branch.
    expect(body.indexOf("app.evidence_object_exists(v_path)")).toBeGreaterThan(body.indexOf("ELSE\n    RAISE EXCEPTION 'Evidence cannot be linked to that.'"));
  });

  it("the locked-assessment rule is still for answers only", () => {
    expect(fn("app.evidence_link_before_insert")).toContain("IF v_status IN ('submitted', 'finalised') THEN");
  });

  it("AFTER INSERT / DELETE: an answer re-derives its score; a ROPA link re-derives completeness and returns BEFORE any answer is touched", () => {
    for (const [name, rec] of [
      ["app.evidence_link_after_insert", "NEW"],
      ["app.evidence_link_after_delete", "OLD"],
    ] as const) {
      const body = fn(name);
      const ropa = body.indexOf(`IF ${rec}.linked_entity_type = 'ropa_record' THEN`);
      const guard = body.indexOf(`IF ${rec}.linked_entity_type <> 'assessment_response' THEN`);
      const answer = body.indexOf("UPDATE public.assessment_responses");
      expect(ropa, name).toBeGreaterThan(-1);
      expect(guard, name).toBeGreaterThan(ropa);
      expect(answer, name).toBeGreaterThan(guard);
      // The ROPA branch returns before the answer branch begins.
      expect(body.slice(ropa, guard), name).toContain("RETURN NULL;");
      expect(body.slice(ropa, guard), name).not.toContain("assessment_responses");
    }
  });

  it("BEFORE DELETE: a closed action and an approved record each refuse a detach", () => {
    const body = fn("app.evidence_link_before_delete");
    expect(body).toContain("IF OLD.linked_entity_type = 'gap_action' THEN");
    expect(body).toContain("v_status = 'closed'");
    expect(body).toContain("IF OLD.linked_entity_type = 'ropa_record' THEN");
    expect(body).toContain("v_status = 'approved'");
  });
});

describe("the register never moves the readiness score (D-035)", () => {
  it("nothing in this migration touches the domain engine or the snapshot", () => {
    for (const name of ["assessment_domain_results", "assessment_responses SET", "finalise_assessment", "assessment_score_snapshots"]) {
      expect(code.replace(/UPDATE public\.assessment_responses r\n  SET evidence_level/g, "")).not.toContain(name);
    }
  });
});

describe("audit — once per import, and no free text", () => {
  it("the import RPC writes ONE audit row and silences the per-row trigger for its own inserts", () => {
    const rpc = fn("public.import_ropa_records");
    expect(rpc.match(/INSERT INTO public\.audit_logs/g)).toHaveLength(1);
    expect(rpc).toContain("set_config('app.ropa_bulk_import', 'on', true)");
    expect(rpc).toContain("set_config('app.ropa_bulk_import', 'off', true)");
    expect(fn("app.audit_scope_change")).toContain(
      "TG_TABLE_NAME = 'ropa_records' AND current_setting('app.ropa_bulk_import', true) = 'on'",
    );
  });

  it("a bad row is rejected, never the file: every insert has its own exception block", () => {
    const rpc = fn("public.import_ropa_records");
    expect(rpc).toContain("WHEN unique_violation THEN");
    expect(rpc).toContain("An import is at most 2,000 records.");
  });

  it("a processing activity's name never enters the log", () => {
    expect(fn("app.audit_scope_change")).toContain("'name', CASE WHEN TG_TABLE_NAME <> 'ropa_records' THEN");
  });

  it("a re-derivation alone is not an event", () => {
    const changed = block("WHERE n.key NOT IN (", ")", fn("app.audit_scope_change"));
    for (const derived of ["completeness_score", "risk_rating", "evidence_count", "system_link_count"]) {
      expect(changed).toContain(`'${derived}'`);
    }
  });
});

describe("D-065 — the DPDP structure, mirrored", () => {
  const structureFn = (name: string) => block(`CREATE OR REPLACE FUNCTION ${name}(`, "$$;", structureSql);
  const structureBody = (name: string) => structureFn(name).slice(structureFn(name).indexOf("AS $$"));

  it("the lawful grounds are core's", async () => {
    const { ROPA_LAWFUL_BASIS_CODES } = await import("@truststack/core");
    expect(quoted(structureBody("app.ropa_lawful_bases"))).toEqual([...ROPA_LAWFUL_BASIS_CODES]);
  });

  it("which grounds need a notice and which need consent are core's", async () => {
    const { ROPA_NOTICE_REQUIRED_BASES, ROPA_CONSENT_REQUIRED_BASES } = await import("@truststack/core");
    expect(quoted(structureBody("app.ropa_notice_required"))).toEqual([...ROPA_NOTICE_REQUIRED_BASES]);
    expect(quoted(structureBody("app.ropa_consent_required"))).toEqual([...ROPA_CONSENT_REQUIRED_BASES]);
    // Undecided counts as required in both (D-026).
    expect(structureBody("app.ropa_notice_required")).toContain("p_basis IS NULL OR");
    expect(structureBody("app.ropa_consent_required")).toContain("p_basis IS NULL OR");
  });

  it("the Fourth Schedule exemptions, the retention triggers and the Rule 6 safeguards are core's", async () => {
    const { ROPA_CHILD_EXEMPTION_CODES, ROPA_RETENTION_TRIGGER_CODES, ROPA_SAFEGUARD_CODES, ROPA_REVIEW_CYCLE_MONTHS } =
      await import("@truststack/core");
    expect(quoted(structureBody("app.ropa_child_exemptions"))).toEqual([...ROPA_CHILD_EXEMPTION_CODES]);
    expect(quoted(structureBody("app.ropa_retention_triggers"))).toEqual([...ROPA_RETENTION_TRIGGER_CODES]);
    expect(quoted(structureBody("app.ropa_safeguard_codes"))).toEqual([...ROPA_SAFEGUARD_CODES]);
    expect(Number(structureBody("app.ropa_review_cycle_months").match(/SELECT (\d+);/)![1])).toBe(ROPA_REVIEW_CYCLE_MONTHS);
  });

  it("the derivation lives in one function, called before AND after the lifecycle", () => {
    const trigger = structureFn("app.ropa_record_before_write");
    expect(trigger.match(/NEW := app\.ropa_derive\(NEW\);/g)).toHaveLength(2);
    expect(structureFn("app.ropa_derive")).toContain("r.risk_rating := app.ropa_effective_risk(r.risk_rating_derived, r.risk_rating_assessor);");
  });

  it("approval sets the next review a cycle out, unless a sooner one is set (D-066)", () => {
    expect(structureFn("app.ropa_record_before_write")).toContain("make_interval(months => app.ropa_review_cycle_months())");
  });

  it("the new structured fields are CONTENT: an approved record cannot change them either", () => {
    const trigger = structureFn("app.ropa_record_before_write");
    for (const column of ["lawful_basis", "child_parental_consent", "child_exemption", "child_tracking", "retention_trigger", "retention_law", "safeguards"]) {
      expect(trigger, column).toContain(`NEW.${column}`);
    }
  });

  it("processor contracts are read from the vendor register — independent fiduciaries excepted", () => {
    const counter = structureFn("app.ropa_vendor_contract_gaps");
    expect(counter).toContain("v.vendor_role <> 'independent'");
    expect(counter).toContain("(v.contract_exists <> 'yes' OR v.dpdp_clauses <> 'yes')");
    expect(structureSql).toContain("AFTER UPDATE OF vendor_role, contract_exists, dpdp_clauses ON public.vendors");
  });

  it("the import RPC and the audit trigger were redefined from their Slice 7 bodies, keeping the one-row audit", () => {
    const rpc = structureFn("public.import_ropa_records");
    expect(rpc.match(/INSERT INTO public\.audit_logs/g)).toHaveLength(1);
    expect(rpc).toContain("set_config('app.ropa_bulk_import', 'on', true)");
    expect(structureFn("app.audit_scope_change")).toContain("'vendor_contract_gaps'");
    expect(structureFn("app.audit_scope_change")).toContain("'name', CASE WHEN TG_TABLE_NAME <> 'ropa_records' THEN");
  });

  it("every row is re-derived BEFORE the constraints come back", () => {
    const touch = structureSql.indexOf("UPDATE public.ropa_records r\nSET vendor_contract_gaps");
    const constraint = structureSql.indexOf("ADD CONSTRAINT ropa_records_missing_is_derived");
    expect(touch).toBeGreaterThan(-1);
    expect(constraint).toBeGreaterThan(touch);
  });
});

describe("D-067 — risk governance, mirrored", () => {
  const governance = readFileSync(path.join(MIGRATIONS, "20261005000000_ropa_risk_governance", "migration.sql"), "utf8");
  const gfn = (name: string) => block(`CREATE OR REPLACE FUNCTION ${name}(`, "$$;", governance);

  it("the risk model version is core's, and the derivation stamps it on every row", async () => {
    const { ROPA_RISK_MODEL_VERSION } = await import("@truststack/core");
    expect(gfn("app.ropa_risk_model_version")).toContain(`SELECT '${ROPA_RISK_MODEL_VERSION}';`);
    expect(gfn("app.ropa_derive")).toContain("r.risk_model_version := app.ropa_risk_model_version();");
  });

  it("a raise carries a reason — a CHECK, so it binds tooling too — and withdrawing the raise clears it", () => {
    expect(block("ADD CONSTRAINT ropa_records_raise_has_reason", "ADD CONSTRAINT", governance)).toContain(
      "risk_rating_assessor IS NULL",
    );
    expect(gfn("app.ropa_derive")).toContain("r.risk_rating_assessor_reason := NULL;");
  });

  it("the reason is content: an approved record cannot change it either", () => {
    expect(gfn("app.ropa_record_before_write")).toContain("NEW.risk_rating_assessor_reason");
  });

  it("the trigger and the import were redefined from their D-065 bodies (the ground and the children's duties survive)", () => {
    expect(gfn("app.ropa_record_before_write")).toContain("NEW.lawful_basis, NEW.child_parental_consent");
    expect(gfn("public.import_ropa_records")).toContain("NULLIF(v_row ->> 'lawful_basis', '')");
    expect(gfn("public.import_ropa_records").match(/INSERT INTO public\.audit_logs/g)).toHaveLength(1);
  });
});
