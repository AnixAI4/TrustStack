/**
 * The permission matrix lives in packages/core as data; the Slice 1 migration
 * inserts it as reference data (D-020). They must never drift. The RLS suite
 * repeats this check against the live database.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { INDUSTRIES, PERMISSION_CODES, ROLE_CODES, ROLE_PERMISSIONS, ROLES } from "@truststack/core";
import { describe, expect, it } from "vitest";

const migrationsDir = path.resolve(import.meta.dirname, "../../../../packages/db/prisma/migrations");
const sql = readdirSync(migrationsDir)
  .filter((d) => /^\d{14}_/.test(d))
  .sort()
  .map((d) => readFileSync(path.join(migrationsDir, d, "migration.sql"), "utf8"))
  .join("\n");

function block(startMarker: RegExp, endMarker: string): string {
  const start = sql.search(startMarker);
  expect(start, `marker ${startMarker} not found in migrations`).toBeGreaterThan(-1);
  const end = sql.indexOf(endMarker, start);
  return sql.slice(start, end);
}

describe("migration reference data == packages/core", () => {
  it("roles: same ten codes, names and platform flags", () => {
    const rows = [
      ...block(/INSERT INTO public\.roles \(code, name, description, is_platform_role\) VALUES/, ";\n").matchAll(
        /\('([a-z_]+)', '((?:[^']|'')*)', '(?:[^']|'')*', (true|false)\)/g,
      ),
    ].map(([, code, name, platform]) => ({ code, name: name!.replace(/''/g, "'"), platform: platform === "true" }));

    expect(rows.map((r) => r.code).sort()).toEqual([...ROLE_CODES].sort());
    for (const r of rows) {
      const def = ROLES[r.code as keyof typeof ROLES];
      expect(r.name).toBe(def.name);
      expect(r.platform).toBe(def.isPlatformRole);
    }
  });

  it("permissions: same codes, across every migration", () => {
    const codes = [...sql.matchAll(/INSERT INTO public\.permissions \(code, description\) VALUES([\s\S]*?);\n/g)].flatMap((m) =>
      [...m[1]!.matchAll(/\('([a-z_.]+)', '/g)].map((c) => c[1]!),
    );
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.sort()).toEqual([...PERMISSION_CODES].sort());
  });

  it("role_permissions: exactly the core matrix, pair for pair, across every migration", () => {
    // Form 1 (Slice 1): a (role_code, permission_code) VALUES matrix.
    const matrixPairs = [...sql.matchAll(/INSERT INTO public\.role_permissions \(role_id, permission_id\)\s*SELECT r\.id, p\.id\s*FROM \(VALUES([\s\S]*?)\) AS matrix/g)].flatMap(
      (m) => [...m[1]!.matchAll(/\('([a-z_]+)', '([a-z_.]+)'\)/g)].map(([, role, permission]) => `${role} ${permission}`),
    );
    // Form 2 (later slices): one permission granted to a list of roles.
    const grantPairs = [
      ...sql.matchAll(/FROM \(VALUES ([^;]*?)\) AS g\(role_code\)[\s\S]*?p\.code = '([a-z_.]+)';/g),
    ].flatMap((m) => [...m[1]!.matchAll(/\('([a-z_]+)'\)/g)].map(([, role]) => `${role} ${m[2]}`));

    const pairs = [...matrixPairs, ...grantPairs];
    const expected = ROLE_CODES.flatMap((r) => ROLE_PERMISSIONS[r].map((p) => `${r} ${p}`));
    expect(new Set(pairs).size).toBe(pairs.length);
    expect(pairs.sort()).toEqual(expected.sort());
  });

  it("industries: same codes, names and overlay packs as packages/core", () => {
    const rows = [
      ...block(/INSERT INTO public\.industries \(code, name, overlay_pack_code\) VALUES/, ";\n").matchAll(
        /\('([a-z_]+)', '((?:[^']|'')*)', '([A-Z0-9_]+)'\)/g,
      ),
    ].map(([, code, name, pack]) => ({ code, name: name!.replace(/''/g, "'"), overlayPackCode: pack }));
    expect(rows).toEqual(INDUSTRIES.map((i) => ({ code: i.code, name: i.name, overlayPackCode: i.overlayPackCode })));
  });
});
