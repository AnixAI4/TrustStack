/**
 * Slice 9, Stage 3 — the report store at the database layer
 * (migration 20261010000000_reports).
 *
 * A report is a record of what was shown on the day, so — like evidence
 * (D-042) and a stored exposure snapshot (D-074.9) — nobody writes a
 * `reports` row but `begin_report` / `complete_report` / `fail_report`; an
 * exposure report records a FRESH snapshot first; the size is read from the
 * stored object, never sent; nothing may edit a finished report; the bucket
 * admits only the person who began a running report, at its own path, and
 * serves a ready one only with `report.download` (or to its owner, for an
 * owner's pack). And GATE 5 everywhere.
 */
import { SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

interface Begun {
  id: string;
  version: number;
  fileName: string;
  storagePath: string;
  exposureSnapshotId: string | null;
  assessmentId: string | null;
  asOf: string;
}

async function begin(tx: Tx, userId: string, org: string, kind = "exposure_brief", format = "pdf", subject: string | null = null): Promise<Begun> {
  const { rows } = await tx.as<{ r: Begun }>(u(userId), "SELECT public.begin_report($1, $2, $3, $4) AS r", [org, kind, format, subject]);
  return rows[0]!.r;
}

/** The rendered file, as Storage would store it — `metadata.size` is what complete_report reads. */
async function store(tx: Tx, path: string, size = 2048) {
  await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name, metadata) VALUES ('reports', $1, jsonb_build_object('size', $2::bigint))", [path, size]);
}

/** Stage 2b (D-133.1): the Exposure Brief, Programme Status Report and evidence pack keep the document they printed. */
const NARRATABLE = ["exposure_brief", "programme_status", "evidence_pack"];
const docFor = (kind: string, sections: unknown[] = [{ title: "Where we stand", blocks: [] }]) =>
  NARRATABLE.includes(kind) ? JSON.stringify({ kind, title: "T", meta: [], sections, caveats: [{ title: "Caveat", text: "c" }], notes: ["n"], footer: "f" }) : null;

async function ready(tx: Tx, userId: string, org: string, kind = "exposure_brief"): Promise<Begun> {
  const b = await begin(tx, userId, org, kind);
  await store(tx, b.storagePath);
  await tx.as(u(userId), "SELECT public.complete_report($1, $2, $3::jsonb)", [org, b.id, docFor(kind)]);
  return b;
}

/** The newest version so far — the local stack may hold reports from manual runs, so tests count from it. */
async function lastVersion(tx: Tx, org: string, kind: string, subject: string | null = null): Promise<number> {
  const { rows } = await tx.asAdmin<{ v: number }>(
    "SELECT coalesce(max(version), 0)::int AS v FROM public.reports WHERE organization_id = $1 AND kind = $2 AND subject_user_id IS NOT DISTINCT FROM $3::uuid",
    [org, kind, subject],
  );
  return rows[0]!.v;
}

const row = async (tx: Tx, id: string) =>
  (await tx.asAdmin<Record<string, unknown>>("SELECT * FROM public.reports WHERE id = $1", [id])).rows[0];

describe("only the three functions write a report", () => {
  it("no user role may INSERT, UPDATE or DELETE — not even the Organisation Admin", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      const admin = u(SEED_USERS.muAdmin.id);
      await expect(
        tx.as(admin, "INSERT INTO public.reports (organization_id, kind, format, version, as_of, storage_path, file_name) VALUES ($1, 'exposure_brief', 'pdf', 99, current_date, 'x', 'x.pdf')", [ORG_A]),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(admin, "UPDATE public.reports SET status = 'ready' WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(admin, "DELETE FROM public.reports WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("anon may call none of them", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(null, "SELECT public.begin_report($1, 'exposure_brief', 'pdf')", [ORG_A])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(null, "SELECT public.complete_report($1, $1)", [ORG_A])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(null, "SELECT public.fail_report($1, $1, 'x')", [ORG_A])).rejects.toMatchObject({ code: "42501" });
    });
  });
});

describe("begin_report decides the version, the name, the path and the basis", () => {
  it("an exposure report records a FRESH exposure snapshot first, and points at it and its assessment", async () => {
    await inTransaction(client, async (tx) => {
      const count = async () => Number((await tx.asAdmin<{ n: string }>("SELECT count(*) AS n FROM public.exposure_snapshots WHERE organization_id = $1", [ORG_A])).rows[0]!.n);
      const before = await count();
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      expect(await count()).toBe(before + 1);
      const { rows } = await tx.asAdmin<{ id: string; assessment_id: string | null; as_of: string }>(
        "SELECT id, assessment_id, to_char(as_of, 'YYYY-MM-DD') AS as_of FROM public.exposure_snapshots WHERE organization_id = $1 ORDER BY recorded_at DESC, id DESC LIMIT 1",
        [ORG_A],
      );
      expect(b.exposureSnapshotId).toBe(rows[0]!.id);
      expect(b.assessmentId).toBe(rows[0]!.assessment_id);
      expect(b.asOf).toBe(rows[0]!.as_of);
      const r = await row(tx, b.id);
      expect(r).toMatchObject({ status: "running", exposure_snapshot_id: b.exposureSnapshotId, generated_by: SEED_USERS.muAdmin.id, byte_size: null });
    });
  });

  it("versions run 1, 2, 3 per organisation and kind; the name and path follow", async () => {
    await inTransaction(client, async (tx) => {
      const base = [await lastVersion(tx, ORG_A, "exposure_brief"), await lastVersion(tx, ORG_A, "programme_status"), await lastVersion(tx, ORG_B, "exposure_brief")];
      const b1 = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      const b2 = await begin(tx, SEED_USERS.mumbaiUniversity.id, ORG_A);
      const p1 = await begin(tx, SEED_USERS.muAdmin.id, ORG_A, "programme_status");
      const other = await begin(tx, SEED_USERS.bmlAdmin.id, ORG_B);
      expect([b1.version, b2.version, p1.version, other.version]).toEqual([base[0]! + 1, base[0]! + 2, base[1]! + 1, base[2]! + 1]);
      expect(b2.fileName).toBe(`TrustStack_DPDP_Exposure_Brief_v${b2.version}_${b2.asOf}.pdf`);
      expect(p1.fileName).toBe(`TrustStack_Programme_Status_Report_v${p1.version}_${p1.asOf}.pdf`);
      expect(b2.storagePath).toBe(`organizations/${ORG_A}/reports/${b2.id}/${b2.fileName}`);
    });
  });

  it("refuses an unknown kind, a format that is not the kind's, and a person on a report that names nobody (TS422)", async () => {
    await inTransaction(client, async (tx) => {
      const admin = SEED_USERS.muAdmin.id;
      await expect(begin(tx, admin, ORG_A, "board_pack")).rejects.toMatchObject({ code: "TS422" });
      await expect(begin(tx, admin, ORG_A, "exposure_brief", "xlsx")).rejects.toMatchObject({ code: "TS422" });
      await expect(begin(tx, admin, ORG_A, "exposure_brief", "pdf", SEED_USERS.muDean.id)).rejects.toMatchObject({ code: "TS422" });
      await expect(begin(tx, admin, ORG_A, "owner_action_pack", "pdf", null)).rejects.toMatchObject({ code: "TS422" });
      await expect(begin(tx, admin, ORG_A, "owner_action_pack", "pdf", SEED_USERS.bmlAdmin.id)).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("audits the request, as the person", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      const { rows } = await tx.asAdmin<{ user_id: string; metadata: { kind: string; version: number } }>(
        "SELECT user_id, metadata FROM public.audit_logs WHERE entity_id = $1 AND event_type = 'report.requested'",
        [b.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ user_id: SEED_USERS.muAdmin.id, metadata: { kind: "exposure_brief", version: b.version } });
    });
  });
});

describe("who may generate (decision 9)", () => {
  it("programme roles may: the Organisation Admin, the DPDP Programme Owner, the consultant", async () => {
    for (const userId of [SEED_USERS.muAdmin.id, SEED_USERS.mumbaiUniversity.id, SEED_USERS.consultant.id]) {
      await inTransaction(client, async (tx) => {
        const base = await lastVersion(tx, ORG_A, "exposure_brief");
        expect((await begin(tx, userId, ORG_A)).version, userId).toBe(base + 1);
      });
    }
  });

  it("read-only and contributor roles may not (TS403): the Dean, the CISO, Legal, a department owner", async () => {
    for (const userId of [SEED_USERS.muDean.id, SEED_USERS.muItSecurity.id, SEED_USERS.muLegal.id, SEED_USERS.muDepartmentOwner.id]) {
      await inTransaction(client, async (tx) => {
        await expect(begin(tx, userId, ORG_A), userId).rejects.toMatchObject({ code: "TS403" });
      });
    }
  });

  it("an owner may generate their OWN pack with gap.read, and nobody else's", async () => {
    await inTransaction(client, async (tx) => {
      const owner = SEED_USERS.muDepartmentOwner.id;
      const ownBase = await lastVersion(tx, ORG_A, "owner_action_pack", owner);
      const legalBase = await lastVersion(tx, ORG_A, "owner_action_pack", SEED_USERS.muLegal.id);
      const own = await begin(tx, owner, ORG_A, "owner_action_pack", "pdf", owner);
      expect(own).toMatchObject({ version: ownBase + 1, exposureSnapshotId: null });
      await expect(begin(tx, owner, ORG_A, "owner_action_pack", "pdf", SEED_USERS.muLegal.id)).rejects.toMatchObject({ code: "TS403" });
      // Anyone's, with report.generate — each owner's pack has its own sequence.
      expect((await begin(tx, SEED_USERS.muAdmin.id, ORG_A, "owner_action_pack", "pdf", owner)).version).toBe(ownBase + 2);
      expect((await begin(tx, SEED_USERS.muAdmin.id, ORG_A, "owner_action_pack", "pdf", SEED_USERS.muLegal.id)).version).toBe(legalBase + 1);
    });
  });

  it("GATE 5: Org B's admin cannot begin a report for Org A, nor Org A's for Org B", async () => {
    await inTransaction(client, async (tx) => {
      await expect(begin(tx, SEED_USERS.bmlAdmin.id, ORG_A)).rejects.toMatchObject({ code: "TS403" });
      await expect(begin(tx, SEED_USERS.muAdmin.id, ORG_B)).rejects.toMatchObject({ code: "TS403" });
    });
  });
});

describe("complete_report and fail_report — only the person who began it", () => {
  it("refuses to finish a report whose file was never stored (TS422)", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      await expect(tx.as(u(SEED_USERS.muAdmin.id), "SELECT public.complete_report($1, $2)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("reads the size from the stored object, marks it ready, audits it — once", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      await store(tx, b.storagePath, 31337);
      await tx.as(u(SEED_USERS.muAdmin.id), "SELECT public.complete_report($1, $2, $3::jsonb)", [ORG_A, b.id, docFor("exposure_brief")]);
      const r = await row(tx, b.id);
      expect(r).toMatchObject({ status: "ready", byte_size: "31337", error: null });
      expect(r!.generated_at).not.toBeNull();
      const audit = await tx.asAdmin("SELECT 1 FROM public.audit_logs WHERE entity_id = $1 AND event_type = 'report.generated' AND user_id = $2", [b.id, SEED_USERS.muAdmin.id]);
      expect(audit.rows).toHaveLength(1);
      await expect(tx.as(u(SEED_USERS.muAdmin.id), "SELECT public.complete_report($1, $2)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("another person in the same organisation cannot finish it (TS403); another tenant cannot see it (TS404)", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      await store(tx, b.storagePath);
      await expect(tx.as(u(SEED_USERS.mumbaiUniversity.id), "SELECT public.complete_report($1, $2)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(u(SEED_USERS.bmlAdmin.id), "SELECT public.complete_report($1, $2)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS404" });
      await expect(tx.as(u(SEED_USERS.bmlAdmin.id), "SELECT public.fail_report($1, $2, 'x')", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS404" });
      // Org B's own path does not reach it either.
      await expect(tx.as(u(SEED_USERS.bmlAdmin.id), "SELECT public.complete_report($1, $2)", [ORG_B, b.id])).rejects.toMatchObject({ code: "TS404" });
    });
  });

  it("a failure is recorded with its reason, audited, and final", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      await tx.as(u(SEED_USERS.muAdmin.id), "SELECT public.fail_report($1, $2, $3)", [ORG_A, b.id, "The report could not be rendered."]);
      expect(await row(tx, b.id)).toMatchObject({ status: "failed", error: "The report could not be rendered.", byte_size: null });
      const audit = await tx.asAdmin("SELECT 1 FROM public.audit_logs WHERE entity_id = $1 AND event_type = 'report.generation_failed'", [b.id]);
      expect(audit.rows).toHaveLength(1);
      await store(tx, b.storagePath);
      await expect(tx.as(u(SEED_USERS.muAdmin.id), "SELECT public.complete_report($1, $2)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS409" });
    });
  });
});

describe("a report is a record — nothing edits or deletes one", () => {
  it("tooling included: no field of a finished report changes, and it cannot be deleted (TS409)", async () => {
    await inTransaction(client, async (tx) => {
      const b = await ready(tx, SEED_USERS.muAdmin.id, ORG_A);
      await expect(tx.asAdmin("UPDATE public.reports SET byte_size = 1 WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.asAdmin("UPDATE public.reports SET status = 'running', byte_size = NULL, generated_at = NULL WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.asAdmin("UPDATE public.reports SET version = 7 WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.asAdmin("DELETE FROM public.reports WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("it outlives its basis: deleting the assessment clears the pointers and keeps the report", async () => {
    await inTransaction(client, async (tx) => {
      const b = await ready(tx, SEED_USERS.muAdmin.id, ORG_A);
      expect(b.assessmentId).not.toBeNull();
      await tx.asAdmin("DELETE FROM public.assessments WHERE id = $1", [b.assessmentId]);
      expect(await row(tx, b.id)).toMatchObject({ status: "ready", assessment_id: null, exposure_snapshot_id: null, organization_id: ORG_A });
    });
  });

  it("the row can only point at its own object, in its own tenant", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      const constraints = await tx.asAdmin<{ conname: string }>(
        "SELECT conname FROM pg_constraint WHERE conrelid = 'public.reports'::regclass AND conname = 'reports_storage_path_check'",
      );
      expect(constraints.rows).toHaveLength(1);
      expect(b.storagePath.startsWith(`organizations/${ORG_A}/reports/${b.id}/`)).toBe(true);
    });
  });
});

describe("reading a report (GATE 5)", () => {
  it("every Org A role sees Org A's reports; Org B's admin sees none of them", async () => {
    await inTransaction(client, async (tx) => {
      const b = await ready(tx, SEED_USERS.muAdmin.id, ORG_A);
      for (const userId of [SEED_USERS.muDean.id, SEED_USERS.muLegal.id, SEED_USERS.muDepartmentOwner.id, SEED_USERS.muItSecurity.id]) {
        const { rows } = await tx.as(u(userId), "SELECT id FROM public.reports WHERE id = $1", [b.id]);
        expect(rows, userId).toHaveLength(1);
      }
      const leak = await tx.as(u(SEED_USERS.bmlAdmin.id), "SELECT id FROM public.reports WHERE organization_id = $1", [ORG_A]);
      expect(leak.rows).toHaveLength(0);
    });
  });
});

describe("the reports bucket", () => {
  it("is private, and takes only PDF and XLSX", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ public: boolean; allowed_mime_types: string[] }>(
        "SELECT public, allowed_mime_types FROM storage.buckets WHERE id = 'reports'",
      );
      expect(rows[0]!.public).toBe(false);
      expect([...rows[0]!.allowed_mime_types].sort()).toEqual([
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]);
    });
  });

  it("admits the file only from the person who began it, at its own path, while it is running", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      const insert = (userId: string, path: string) =>
        tx.as(u(userId), "INSERT INTO storage.objects (bucket_id, name) VALUES ('reports', $1)", [path]);
      // Not a colleague, not another tenant, not a path the row does not name.
      await expect(insert(SEED_USERS.mumbaiUniversity.id, b.storagePath)).rejects.toMatchObject({ code: "42501" });
      await expect(insert(SEED_USERS.bmlAdmin.id, b.storagePath)).rejects.toMatchObject({ code: "42501" });
      await expect(insert(SEED_USERS.muAdmin.id, b.storagePath.replace(b.fileName, "other.pdf"))).rejects.toMatchObject({ code: "42501" });
      await expect(insert(SEED_USERS.muAdmin.id, `organizations/${ORG_B}/reports/${b.id}/${b.fileName}`)).rejects.toMatchObject({ code: "42501" });
      // The generator, at the path, while running: yes.
      await insert(SEED_USERS.muAdmin.id, b.storagePath);
    });
  });

  it("refuses a file for a report that is already finished", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      await tx.as(u(SEED_USERS.muAdmin.id), "SELECT public.fail_report($1, $2, 'x')", [ORG_A, b.id]);
      await expect(
        tx.as(u(SEED_USERS.muAdmin.id), "INSERT INTO storage.objects (bucket_id, name) VALUES ('reports', $1)", [b.storagePath]),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("serves a READY file with report.download — the Dean and the auditor role, not a department owner, never Org B", async () => {
    await inTransaction(client, async (tx) => {
      const b = await ready(tx, SEED_USERS.muAdmin.id, ORG_A);
      const sees = async (userId: string) =>
        (await tx.as(u(userId), "SELECT name FROM storage.objects WHERE bucket_id = 'reports' AND name = $1", [b.storagePath])).rows.length;
      expect(await sees(SEED_USERS.muDean.id)).toBe(1);
      expect(await sees(SEED_USERS.muAdmin.id)).toBe(1);
      expect(await sees(SEED_USERS.muDepartmentOwner.id)).toBe(0);
      expect(await sees(SEED_USERS.bmlAdmin.id)).toBe(0);
    });
  });

  it("does not serve a file whose report is not ready", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A);
      await store(tx, b.storagePath);
      const { rows } = await tx.as(u(SEED_USERS.muDean.id), "SELECT name FROM storage.objects WHERE name = $1", [b.storagePath]);
      expect(rows).toHaveLength(0);
    });
  });

  it("an owner's pack is served to its owner, who has no report.download", async () => {
    await inTransaction(client, async (tx) => {
      const owner = SEED_USERS.muDepartmentOwner.id;
      const b = await begin(tx, owner, ORG_A, "owner_action_pack", "pdf", owner);
      await store(tx, b.storagePath);
      await tx.as(u(owner), "SELECT public.complete_report($1, $2)", [ORG_A, b.id]);
      const mine = await tx.as(u(owner), "SELECT name FROM storage.objects WHERE name = $1", [b.storagePath]);
      expect(mine.rows).toHaveLength(1);
      const legal = await tx.as(u(SEED_USERS.muLegal.id), "SELECT name FROM storage.objects WHERE name = $1", [b.storagePath]);
      expect(legal.rows).toHaveLength(0);
    });
  });

  it("nobody may overwrite or delete a stored report", async () => {
    await inTransaction(client, async (tx) => {
      const b = await ready(tx, SEED_USERS.muAdmin.id, ORG_A);
      const up = await tx.as(u(SEED_USERS.muAdmin.id), "UPDATE storage.objects SET metadata = '{}'::jsonb WHERE name = $1", [b.storagePath]);
      expect(up.rowCount).toBe(0);
      const del = await tx.as(u(SEED_USERS.muAdmin.id), "DELETE FROM storage.objects WHERE name = $1", [b.storagePath]).catch((e: Error) => e);
      expect(del instanceof Error ? del : (del as pg.QueryResult).rowCount).toSatisfy((x: unknown) => x instanceof Error || x === 0);
    });
  });
});

describe("the Stage 4 kinds (Slice 9, Stage 4)", () => {
  it("each begins in its own format: the evidence pack records a snapshot; the owner's pack and the spreadsheets do not", async () => {
    await inTransaction(client, async (tx) => {
      const admin = SEED_USERS.muAdmin.id;
      const pack = await begin(tx, admin, ORG_A, "evidence_pack", "pdf");
      expect(pack.exposureSnapshotId).toBeTruthy();
      expect(pack.fileName).toMatch(/^TrustStack_Regulator_Ready_Evidence_Pack_v\d+_\d{4}-\d{2}-\d{2}\.pdf$/);
      for (const [kind, stem] of [
        ["gap_action_tracker", "Gap_and_Action_Tracker"],
        ["ropa_register", "ROPA_Register"],
        ["evidence_index", "Evidence_Index"],
      ] as const) {
        const b = await begin(tx, admin, ORG_A, kind, "xlsx");
        expect(b.exposureSnapshotId, kind).toBeNull();
        expect(b.fileName).toMatch(new RegExp(`^TrustStack_${stem}_v\\d+_\\d{4}-\\d{2}-\\d{2}\\.xlsx$`));
        await expect(begin(tx, admin, ORG_A, kind, "pdf")).rejects.toMatchObject({ code: "TS422" });
      }
      const own = await begin(tx, admin, ORG_A, "owner_action_pack", "pdf", admin);
      expect(own.exposureSnapshotId).toBeNull();
    });
  });

  it("the evidence pack needs score.calculate, as every exposure report does; the spreadsheets do not record one", async () => {
    await inTransaction(client, async (tx) => {
      // The consultant generates (report.generate) and calculates; the spreadsheet records no snapshot, so no score.calculate is consulted.
      const before = await tx.asAdmin<{ n: number }>("SELECT count(*)::int AS n FROM public.exposure_snapshots WHERE organization_id = $1", [ORG_A]);
      await begin(tx, SEED_USERS.consultant.id, ORG_A, "gap_action_tracker", "xlsx");
      const after = await tx.asAdmin<{ n: number }>("SELECT count(*)::int AS n FROM public.exposure_snapshots WHERE organization_id = $1", [ORG_A]);
      expect(after.rows[0]!.n).toBe(before.rows[0]!.n);
    });
  });

  it("a READY spreadsheet is served like a PDF: with report.download, never to a department owner, never to Org B", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, SEED_USERS.muAdmin.id, ORG_A, "evidence_index", "xlsx");
      await store(tx, b.storagePath);
      await tx.as(u(SEED_USERS.muAdmin.id), "SELECT public.complete_report($1, $2)", [ORG_A, b.id]);
      const sees = async (userId: string) =>
        (await tx.as<{ n: number }>(u(userId), "SELECT count(*)::int AS n FROM storage.objects WHERE bucket_id = 'reports' AND name = $1", [b.storagePath])).rows[0]!.n;
      expect(await sees(SEED_USERS.muAdmin.id)).toBe(1);
      expect(await sees(SEED_USERS.muDean.id)).toBe(1);
      expect(await sees(SEED_USERS.muDepartmentOwner.id)).toBe(0);
      expect(await sees(SEED_USERS.bmlAdmin.id)).toBe(0);
    });
  });
});

describe("Stage 2b — a narratable report keeps its document; a narrated version prints version N's figures (D-133.1)", () => {
  const admin = SEED_USERS.muAdmin.id;
  const NARRATIVE = { headline: "One head is exposed.", paragraphs: ["SECRET-NARRATIVE-TEXT"], bullets: [] };

  /** An accepted narrative about `reportId`, drafted and accepted by the admin (ai.use, report.read, report.generate). */
  async function acceptedNarrative(tx: Tx, org: string, reportId: string, userId = admin): Promise<string> {
    const { rows } = await tx.as<{ id: string }>(
      u(userId),
      `INSERT INTO public.ai_drafts (organization_id, task, target_type, target_id, status, input_digest, context, output, model, corpus_version, prompt_version)
       VALUES ($1, 'report_narrative_draft', 'report', $2, 'draft', repeat('a', 64), '{}'::jsonb, '{"draft":{}}'::jsonb, 'fake', 't', 't') RETURNING id`,
      [org, reportId],
    );
    await tx.as(u(userId), "UPDATE public.ai_drafts SET status = 'accepted', accepted_output = $2 WHERE id = $1", [rows[0]!.id, JSON.stringify(NARRATIVE)]);
    return rows[0]!.id;
  }
  const narrate = (tx: Tx, userId: string, org: string, reportId: string, draftId: string) =>
    tx.as<{ r: Begun & { narratedFromId: string; narratedFromVersion: number } }>(u(userId), "SELECT public.begin_narrated_report($1, $2, $3) AS r", [org, reportId, draftId]);
  const narratedDoc = (kind: string) =>
    docFor(kind, [{ title: "Executive narrative", blocks: [] }, { title: "Where we stand", blocks: [] }]);

  it("a narratable kind must keep its document — of its own kind; any other kind keeps none", async () => {
    await inTransaction(client, async (tx) => {
      const b = await begin(tx, admin, ORG_A);
      await store(tx, b.storagePath);
      await expect(tx.as(u(admin), "SELECT public.complete_report($1, $2)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS422" });
      await expect(tx.as(u(admin), "SELECT public.complete_report($1, $2, $3::jsonb)", [ORG_A, b.id, docFor("programme_status")])).rejects.toMatchObject({ code: "TS422" });
      await tx.as(u(admin), "SELECT public.complete_report($1, $2, $3::jsonb)", [ORG_A, b.id, docFor("exposure_brief")]);
      expect((await tx.asAdmin<{ k: string }>("SELECT document->>'kind' AS k FROM public.reports WHERE id = $1", [b.id])).rows[0]!.k).toBe("exposure_brief");
      const x = await begin(tx, admin, ORG_A, "evidence_index", "xlsx");
      await store(tx, x.storagePath);
      await expect(tx.as(u(admin), "SELECT public.complete_report($1, $2, $3::jsonb)", [ORG_A, x.id, docFor("exposure_brief")])).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("a stored document never changes — tooling included", async () => {
    await inTransaction(client, async (tx) => {
      const b = await ready(tx, admin, ORG_A);
      await expect(tx.asAdmin("UPDATE public.reports SET document = '{\"kind\":\"exposure_brief\",\"sections\":[]}' WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.asAdmin("UPDATE public.reports SET document = NULL WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("version N+1: the same snapshot, assessment and date; a new number; linked to version N and its narrative; audited", async () => {
    await inTransaction(client, async (tx) => {
      const n = await ready(tx, admin, ORG_A);
      const draft = await acceptedNarrative(tx, ORG_A, n.id);
      const { r } = (await narrate(tx, admin, ORG_A, n.id, draft)).rows[0]!;
      expect(r.version).toBe(n.version + 1);
      expect(r).toMatchObject({ exposureSnapshotId: n.exposureSnapshotId, assessmentId: n.assessmentId, asOf: n.asOf, narratedFromId: n.id, narratedFromVersion: n.version });
      const row = (await tx.asAdmin<{ narrated_from_id: string; narrative_draft_id: string; status: string }>("SELECT narrated_from_id, narrative_draft_id, status FROM public.reports WHERE id = $1", [r.id])).rows[0]!;
      expect(row).toEqual({ narrated_from_id: n.id, narrative_draft_id: draft, status: "running" });
      const audit = await tx.asAdmin<{ metadata: Record<string, unknown> }>("SELECT metadata FROM public.audit_logs WHERE entity_id = $1 AND event_type = 'report.requested'", [r.id]);
      expect(audit.rows[0]!.metadata).toMatchObject({ narratedFromId: n.id, narrativeDraftId: draft });
      expect(JSON.stringify(audit.rows)).not.toContain("SECRET-NARRATIVE-TEXT");
      // Its document must be version N's sections with ONE section in front — nothing else.
      await store(tx, r.storagePath);
      await expect(tx.as(u(admin), "SELECT public.complete_report($1, $2, $3::jsonb)", [ORG_A, r.id, docFor("exposure_brief")])).rejects.toMatchObject({ code: "TS422" });
      await expect(
        tx.as(u(admin), "SELECT public.complete_report($1, $2, $3::jsonb)", [ORG_A, r.id, docFor("exposure_brief", [{ title: "Executive narrative", blocks: [] }, { title: "Changed figures", blocks: [] }])]),
      ).rejects.toMatchObject({ code: "TS422" });
      await tx.as(u(admin), "SELECT public.complete_report($1, $2, $3::jsonb)", [ORG_A, r.id, narratedDoc("exposure_brief")]);
      // One narrated version per narrative; a narrated version is not narrated again.
      await expect(narrate(tx, admin, ORG_A, n.id, draft)).rejects.toMatchObject({ code: "TS409" });
      const again = await acceptedNarrative(tx, ORG_A, r.id);
      await expect(narrate(tx, admin, ORG_A, r.id, again)).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("needs report.generate, a finished version N with its document, and an ACCEPTED narrative about version N", async () => {
    await inTransaction(client, async (tx) => {
      const n = await ready(tx, admin, ORG_A);
      const draft = await acceptedNarrative(tx, ORG_A, n.id);
      await expect(narrate(tx, SEED_USERS.muDean.id, ORG_A, n.id, draft)).rejects.toMatchObject({ code: "TS403" });
      // A narrative about ANOTHER version is not this version's.
      const other = await ready(tx, admin, ORG_A);
      await expect(narrate(tx, admin, ORG_A, other.id, draft)).rejects.toMatchObject({ code: "TS404" });
      // Not yet accepted.
      const { rows } = await tx.as<{ id: string }>(
        u(admin),
        `INSERT INTO public.ai_drafts (organization_id, task, target_type, target_id, status, input_digest, context, output, model, corpus_version, prompt_version)
         VALUES ($1, 'report_narrative_draft', 'report', $2, 'draft', repeat('a', 64), '{}'::jsonb, '{"draft":{}}'::jsonb, 'fake', 't', 't') RETURNING id`,
        [ORG_A, n.id],
      );
      await expect(narrate(tx, admin, ORG_A, n.id, rows[0]!.id)).rejects.toMatchObject({ code: "TS409" });
      // Still running: not finished.
      const running = await begin(tx, admin, ORG_A);
      const early = await acceptedNarrative(tx, ORG_A, running.id);
      await expect(narrate(tx, admin, ORG_A, running.id, early)).rejects.toMatchObject({ code: "TS409" });
      // A spreadsheet carries no narrative.
      const sheet = await begin(tx, admin, ORG_A, "evidence_index", "xlsx");
      await store(tx, sheet.storagePath);
      await tx.as(u(admin), "SELECT public.complete_report($1, $2)", [ORG_A, sheet.id]);
      await expect(narrate(tx, admin, ORG_A, sheet.id, draft)).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("a version generated before reports kept their figures cannot be narrated", async () => {
    await inTransaction(client, async (tx) => {
      const n = await ready(tx, admin, ORG_A);
      // As an old, pre-2b row: no document (written directly — the trigger is bypassed only by replica mode).
      await tx.asAdmin("SET LOCAL session_replication_role = replica");
      await tx.asAdmin("UPDATE public.reports SET document = NULL WHERE id = $1", [n.id]);
      await tx.asAdmin("SET LOCAL session_replication_role = origin");
      const draft = await acceptedNarrative(tx, ORG_A, n.id);
      await expect(narrate(tx, admin, ORG_A, n.id, draft)).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("GATE 5: Org B cannot narrate Org A's report, nor use Org A's narrative on its own", async () => {
    await inTransaction(client, async (tx) => {
      const n = await ready(tx, admin, ORG_A);
      const draft = await acceptedNarrative(tx, ORG_A, n.id);
      await expect(narrate(tx, SEED_USERS.bmlAdmin.id, ORG_A, n.id, draft)).rejects.toMatchObject({ code: "TS403" });
      await expect(narrate(tx, SEED_USERS.bmlAdmin.id, ORG_B, n.id, draft)).rejects.toMatchObject({ code: /TS40[34]/ });
      await expect(tx.as(null, "SELECT public.begin_narrated_report($1, $2, $3)", [ORG_A, n.id, draft])).rejects.toMatchObject({ code: "42501" });
    });
  });
});
