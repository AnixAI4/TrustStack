/**
 * The gap rules live in two places — `app.*` in the Slice 6 migration (which
 * generates every register and decides whether an action may close) and
 * `packages/core/src/{engine,gaps}.ts` (which the API and the UI use). This
 * parses the SQL and fails if the two ever differ.
 *
 * It is the mirror rule `scoring-engine.test.ts` applies to the engine, on
 * the layer above it (D-053): the threshold, the severity → priority table,
 * the due days, the workflow graph, the closing rule and the vocabularies.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  CLOSING_REVIEW_STATUSES,
  CLOSURE_BASES,
  CLOSURE_REFUSAL_MESSAGE,
  DOMAIN_CODES,
  GAP_ACTION_STATUSES,
  GAP_ACTION_TRANSITIONS,
  GAP_DUE_DAYS,
  GAP_MAX_ADJUSTED,
  GAP_OPENING_SEVERITIES,
  GAP_PRIORITIES,
  GAP_SEVERITIES,
  GAP_STATES,
  RED_FLAG_MAX_ADJUSTED,
  SEVERITY_PRIORITY,
} from "@truststack/core";
import { describe, expect, it } from "vitest";

const MIGRATIONS = path.resolve(import.meta.dirname, "../../../../packages/db/prisma/migrations");
const sql = readFileSync(path.join(MIGRATIONS, "20261002000000_gaps_actions/migration.sql"), "utf8");

function block(startMarker: string, endMarker: string): string {
  const start = sql.indexOf(startMarker);
  expect(start, `${startMarker} not found in the migration`).toBeGreaterThan(-1);
  const end = sql.indexOf(endMarker, start);
  return sql.slice(start, end);
}

const fn = (name: string) => block(`CREATE OR REPLACE FUNCTION ${name}(`, "$$;");
const quoted = (text: string) => [...text.matchAll(/'([A-Za-z0-9_]+)'/g)].map((m) => m[1]!);

describe("the gap threshold", () => {
  it("app.gap_max_adjusted() equals GAP_MAX_ADJUSTED — 3 (D-054)", () => {
    const match = fn("app.gap_max_adjusted").match(/SELECT\s+(\d+);/);
    expect(Number(match![1])).toBe(GAP_MAX_ADJUSTED);
    expect(GAP_MAX_ADJUSTED).toBe(3);
  });

  it("is NOT the red-flag threshold, and the migration asserts so at apply time", () => {
    expect(GAP_MAX_ADJUSTED).not.toBe(RED_FLAG_MAX_ADJUSTED);
    expect(sql).toContain("ASSERT app.gap_max_adjusted() <> app.red_flag_max_adjusted()");
  });

  it("the generator filters on the threshold function, with <=", () => {
    expect(fn("app.assessment_derived_gaps")).toContain("r.adjusted_score <= app.gap_max_adjusted()");
  });

  it("a stored gap can never sit above it — a row invariant", () => {
    expect(block("assessment_gaps_adjusted_opens_a_gap", "ADD CONSTRAINT")).toContain(
      "adjusted_score <= app.gap_max_adjusted()",
    );
  });
});

describe("app.question_priority() equals SEVERITY_PRIORITY", () => {
  const pairs = [...fn("app.question_priority").matchAll(/WHEN '([a-z_]+)' THEN '([A-Za-z0-9]+)'/g)].map((m) => [m[1]!, m[2]!]);

  it("covers every severity", () => {
    expect(new Set(pairs.map(([severity]) => severity))).toEqual(new Set(GAP_SEVERITIES));
  });

  it("is the same table: Critical→P0 · High→P1 · Medium→P2 · Low→P3 · Improvement→P3 · No Gap→Monitor", () => {
    expect(Object.fromEntries(pairs)).toEqual({ ...SEVERITY_PRIORITY });
    for (const [, priority] of pairs) expect(GAP_PRIORITIES).toContain(priority);
  });

  it("the generator derives priority from SEVERITY, never from the question's authored priority", () => {
    const generator = fn("app.assessment_derived_gaps");
    expect(generator).toContain("app.question_priority(app.question_severity(r.adjusted_score::integer))");
    expect(generator).not.toMatch(/q\.priority/);
  });

  it("severity is read from the stored ADJUSTED score — the claim is not consulted at all", () => {
    const generator = fn("app.assessment_derived_gaps");
    expect(generator).toContain("app.question_severity(r.adjusted_score::integer)");
    expect(generator).not.toContain("claimed_maturity");
  });
});

describe("app.gap_due_days() equals GAP_DUE_DAYS (D-055)", () => {
  const pairs = [...fn("app.gap_due_days").matchAll(/WHEN '(P\d)' THEN (\d+)/g)].map((m) => [m[1]!, Number(m[2])]);

  it("is 30 / 60 / 90 for P0 / P1 / P2", () => {
    expect(Object.fromEntries(pairs)).toEqual({ P0: GAP_DUE_DAYS.P0, P1: GAP_DUE_DAYS.P1, P2: GAP_DUE_DAYS.P2 });
    expect(pairs).toEqual([
      ["P0", 30],
      ["P1", 60],
      ["P2", 90],
    ]);
  });

  it("has no branch for P3 — next cycle, in both", () => {
    expect(fn("app.gap_due_days")).not.toContain("'P3'");
    expect(GAP_DUE_DAYS.P3).toBeNull();
    expect(GAP_DUE_DAYS.Monitor).toBeNull();
  });

  it("the due date is STORED when the action is created, never computed at read time", () => {
    expect(fn("app.refresh_assessment_gaps")).toContain("v_today + app.gap_due_days(g.priority)");
  });
});

describe("app.gap_action_transition_allowed() equals GAP_ACTION_TRANSITIONS", () => {
  const moves = [...fn("app.gap_action_transition_allowed").matchAll(/\('([a-z_]+)', '([a-z_]+)'\)/g)].map(
    (m) => `${m[1]}→${m[2]}`,
  );

  it("is the same graph, edge for edge", () => {
    const core = GAP_ACTION_STATUSES.flatMap((from) => GAP_ACTION_TRANSITIONS[from].map((to) => `${from}→${to}`));
    expect([...moves].sort()).toEqual([...core].sort());
    expect(moves).toHaveLength(9);
  });

  it("a Blocked action cannot close directly, in both", () => {
    expect(moves).not.toContain("blocked→closed");
  });

  it("the trigger enforces it", () => {
    expect(fn("app.gap_action_before_update")).toContain("app.gap_action_transition_allowed(OLD.status, NEW.status)");
  });
});

describe("the vocabularies match packages/core", () => {

  it("action statuses", () => {
    expect(quoted(block("gap_actions_status_check", "),"))).toEqual([...GAP_ACTION_STATUSES]);
  });

  it("closure bases — three, and no 'self-attested'", () => {
    // Slice 10 Stage 5 widened the CHECK in its own migration (an applied one is frozen): read the latest.
    const stage5 = readFileSync(path.join(MIGRATIONS, "20261017000000_retention_ai_risk/migration.sql"), "utf8");
    const start = stage5.indexOf("ADD CONSTRAINT gap_actions_closure_basis_check");
    expect(start).toBeGreaterThan(-1);
    expect(quoted(stage5.slice(start, stage5.indexOf("),", start)))).toEqual([...CLOSURE_BASES]);
    // The Slice 6 CHECK said two, as it was applied.
    expect(quoted(block("gap_actions_closure_basis_check", "),"))).toEqual(["evidence", "reviewer_approval"]);
  });

  it("gap states", () => {
    expect(quoted(block("assessment_gaps_state_check", "),"))).toEqual([...GAP_STATES]);
  });

  it("the severities a gap can carry — everything at or below the threshold", () => {
    expect(quoted(block("assessment_gaps_severity_check", "),"))).toEqual([...GAP_OPENING_SEVERITIES]);
  });

  it("all sixteen domain codes", () => {
    expect(quoted(block("assessment_gaps_code_check", "));"))).toEqual([...DOMAIN_CODES]);
  });

  it("evidence_links now accepts exactly two targets", () => {
    expect(quoted(block("ADD CONSTRAINT evidence_links_entity_type_check", ");"))).toEqual([
      "assessment_response",
      "gap_action",
    ]);
  });
});

describe("a gap is derived, never hand-written", () => {
  it("severity and priority are row invariants of the adjusted score", () => {
    expect(block("assessment_gaps_severity_is_derived", "ADD CONSTRAINT")).toContain(
      "severity = app.question_severity(adjusted_score::integer)",
    );
    expect(block("assessment_gaps_priority_is_derived", "ADD CONSTRAINT")).toContain(
      "priority = app.question_priority(severity)",
    );
  });

  it("the gap table has a SELECT grant and nothing else", () => {
    const grants = [...sql.matchAll(/GRANT (\w+)(?: \([^)]*\))? ON public\.assessment_gaps/g)].map((m) => m[1]);
    expect(grants).toEqual(["SELECT"]);
  });

  it("an action can be UPDATEd on six named columns — never inserted, deleted or stamped by a user", () => {
    const grants = [...sql.matchAll(/GRANT (\w+)(?: \(([^)]*)\))? ON public\.gap_actions/g)].map((m) => [m[1], m[2]]);
    expect(grants).toEqual([
      ["SELECT", undefined],
      ["UPDATE", "title, owner_user_id, owner_role, status, due_date, notes"],
    ]);
  });

  /** An RPC that stored a severity the caller passed in would store one the caller can forge. */
  it("the RPC takes two ids and NO gap data", () => {
    const signature = block("CREATE OR REPLACE FUNCTION public.generate_assessment_gaps", "RETURNS jsonb");
    expect(signature.match(/p_\w+ /g)).toEqual(["p_organization_id ", "p_assessment_id "]);
  });

  it("the RPC checks gap.write, not merely membership, and audits ONCE", () => {
    const rpc = fn("public.generate_assessment_gaps");
    expect(rpc).toContain("app.has_permission(p_organization_id, 'gap.write')");
    expect(rpc.match(/INSERT INTO public\.audit_logs/g)).toHaveLength(1);
    expect(rpc).toContain("'assessment.gaps.generated'");
  });

  it("the engine underneath it writes no audit row of its own", () => {
    expect(fn("app.refresh_assessment_gaps")).not.toContain("audit_logs");
  });

  it("regeneration never rewrites an existing action (D-057)", () => {
    const engine = fn("app.refresh_assessment_gaps");
    expect(engine).not.toMatch(/UPDATE public\.gap_actions/);
    expect(engine).toContain("NOT EXISTS (\n      SELECT 1 FROM public.gap_actions a");
  });

  it("…and deletes a gap only when nobody has worked on it", () => {
    const engine = fn("app.refresh_assessment_gaps");
    expect(engine).toContain("AND NOT app.gap_has_human_work(g.organization_id, g.id)");
    expect(engine).toContain("SET state = 'superseded'");
  });
});

describe("closing cannot be faked (D-056)", () => {
  const trigger = fn("app.gap_action_before_update");

  it("accepted evidence is exactly the verdicts core names", () => {
    const match = trigger.match(/e\.review_status IN \(([^)]*)\)/);
    expect(quoted(match![1]!)).toEqual([...CLOSING_REVIEW_STATUSES]);
  });

  it("approval needs evidence.review AND a closer who is not the owner", () => {
    expect(trigger).toContain("v_actor <> NEW.owner_user_id");
    expect(trigger).toContain("app.has_permission(NEW.organization_id, 'evidence.review')");
  });

  it("the refusal messages are the ones the API gives", () => {
    expect(trigger).toContain(`'${CLOSURE_REFUSAL_MESSAGE.no_owner}'`);
    expect(trigger).toContain(`'${CLOSURE_REFUSAL_MESSAGE.no_evidence_or_reviewer}'`);
  });

  it("nobody approves their own work — a CHECK, so it binds tooling too", () => {
    expect(block("gap_actions_no_self_approval", "ADD CONSTRAINT")).toContain("closed_by <> owner_user_id");
  });

  it("closed means a timestamp and a basis — both or neither", () => {
    expect(block("gap_actions_closed_has_timestamp", "),")).toContain("(status = 'closed') = (closed_at IS NOT NULL");
    expect(block("gap_actions_closed_has_basis", "),")).toContain("(status = 'closed') = (closure_basis IS NOT NULL");
  });

  it("the closing columns are stamped by the trigger, from the JWT", () => {
    expect(trigger).toContain("NEW.closed_by := v_actor;");
    expect(trigger).toContain("NEW.closed_at := now();");
  });
});

describe("all four evidence_links triggers know a gap action from an answer", () => {
  it("BEFORE INSERT branches on the target type, and refuses a type nobody defined", () => {
    const body = fn("app.evidence_link_before_insert");
    expect(body).toContain("IF NEW.linked_entity_type = 'assessment_response' THEN");
    expect(body).toContain("ELSIF NEW.linked_entity_type = 'gap_action' THEN");
    expect(body).toContain("'Evidence cannot be linked to that.'");
  });

  it("the object-exists rule applies to BOTH targets (D-039)", () => {
    const body = fn("app.evidence_link_before_insert");
    // After the branch, not inside either arm.
    expect(body.indexOf("app.evidence_object_exists(v_path)")).toBeGreaterThan(body.indexOf("END IF;"));
  });

  it("AFTER INSERT does not re-derive anything for a gap action", () => {
    const body = fn("app.evidence_link_after_insert");
    const guard = body.indexOf("IF NEW.linked_entity_type <> 'assessment_response' THEN");
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(body.indexOf("UPDATE public.assessment_responses"));
  });

  it("AFTER DELETE does not re-derive anything for a gap action", () => {
    const body = fn("app.evidence_link_after_delete");
    const guard = body.indexOf("IF OLD.linked_entity_type <> 'assessment_response' THEN");
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(body.indexOf("UPDATE public.assessment_responses"));
  });

  it("BEFORE DELETE refuses to detach evidence from a closed action", () => {
    const body = fn("app.evidence_link_before_delete");
    expect(body).toContain("IF OLD.linked_entity_type = 'gap_action' THEN");
    expect(body).toContain("v_status = 'closed'");
  });

  /**
   * The slice prompt's own count of these triggers had been wrong once. So
   * count them from the migrations rather than trust a number: every trigger
   * FUNCTION ever attached to evidence_links must be redefined here, apart
   * from the generic audit one.
   */
  it("every trigger function on evidence_links, counted from the migrations, is redefined in this one", () => {
    const attached = new Set<string>();
    for (const dir of ["20260918200000_evidence_scoring", "20260920000000_scoring_engine"]) {
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
});

describe("a finalised assessment's gaps are frozen with its score (D-058)", () => {
  it("finalise brings the register in line BEFORE the status flips", () => {
    const finalise = fn("public.finalise_assessment");
    const refresh = finalise.indexOf("PERFORM app.refresh_assessment_gaps(p_organization_id, p_assessment_id);");
    expect(refresh).toBeGreaterThan(-1);
    expect(refresh).toBeLessThan(finalise.indexOf("UPDATE public.assessments SET status = 'finalised'"));
  });

  it("finalise still takes two ids, still refuses an outstanding question, and still audits once", () => {
    const finalise = fn("public.finalise_assessment");
    expect(block("CREATE OR REPLACE FUNCTION public.finalise_assessment", "RETURNS uuid").match(/p_\w+ /g)).toHaveLength(2);
    expect(finalise).toContain("IF v_outstanding > 0 THEN");
    expect(finalise.match(/INSERT INTO public\.audit_logs/g)).toHaveLength(1);
  });

  it("the freeze is a trigger on every write, so it binds tooling too", () => {
    const trigger = block("CREATE TRIGGER assessment_gaps_frozen_when_finalised", ";");
    expect(trigger).toContain("BEFORE INSERT OR UPDATE OR DELETE");
    expect(fn("app.gap_is_frozen_when_finalised")).toContain("IF v_status = 'finalised' THEN");
  });

  it("the RPC refuses a finalised assessment with a message of its own", () => {
    expect(fn("public.generate_assessment_gaps")).toContain("IF v_status = 'finalised' THEN");
  });

  it("actions are deliberately NOT frozen: no trigger on gap_actions looks at the assessment's status", () => {
    expect(fn("app.gap_action_before_update")).not.toContain("finalised");
  });
});

describe("audit carries no free text", () => {
  it("a user's change to an action is audited by trigger, on UPDATE only", () => {
    const trigger = block("CREATE TRIGGER gap_actions_audit", ";");
    expect(trigger).toContain("AFTER UPDATE ON public.gap_actions");
    expect(trigger).toContain("app.audit_scope_change('gap')");
  });

  it("the metadata names the workflow fields and never the notes, the title or the finding", () => {
    const metadata = block("jsonb_strip_nulls(jsonb_build_object(", "))");
    for (const key of ["gapId", "actionStatus", "ownerUserId", "dueDate", "closureBasis"]) {
      expect(metadata).toContain(`'${key}'`);
    }
    expect(metadata).not.toMatch(/'notes'|'title'|'finding'|'recommended_fix'/);
  });
});

describe("the migration asserts its own rules at apply time", () => {
  const assertions = block("DO $$", "END;\n$$;");

  it("pins the threshold, the whole priority table and the due days", () => {
    expect(assertions).toContain("app.gap_max_adjusted() = 3");
    for (const [severity, priority] of Object.entries(SEVERITY_PRIORITY)) {
      expect(assertions).toContain(`app.question_priority('${severity}') = '${priority}'`);
    }
    expect(assertions).toContain("app.gap_due_days('P3') IS NULL");
  });

  it("pins the cap's consequence: an unevidenced claim of 5 is P1, not P0", () => {
    expect(assertions).toContain("app.question_priority(app.question_severity(app.adjusted_score(5, NULL))) = 'P1'");
  });
});
