/**
 * Static gate: every /api/v1 route handler is wrapped in withApi (Slice 1 §7).
 * A bare `export async function GET` would skip authentication, tenancy and
 * RBAC — the old app's route-group bug, in a new shape (D-012).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const apiRoot = path.resolve(import.meta.dirname, "../../app/api/v1");
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return routeFiles(full);
    return name === "route.ts" ? [full] : [];
  });
}

const files = routeFiles(apiRoot);

describe("every /api/v1 route goes through withApi", () => {
  it("finds the routes", () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  for (const file of files) {
    const rel = path.relative(apiRoot, file);
    const src = readFileSync(file, "utf8");

    it(`${rel}`, () => {
      const exported = [...src.matchAll(/export\s+(?:async\s+)?(?:const|function|let|var)\s+([A-Z]+)\b/g)].map((m) => m[1]!);
      const handlers = exported.filter((name) => HTTP_METHODS.includes(name));
      expect(handlers.length, "route exports no HTTP handler").toBeGreaterThan(0);

      for (const method of handlers) {
        expect(src, `${method} must be \`export const ${method} = withApi(\``).toMatch(
          new RegExp(`export\\s+const\\s+${method}\\s*=\\s*withApi\\(`),
        );
      }
      expect(src).not.toMatch(/export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/);
      expect(src).not.toMatch(/export\s*\{[^}]*\b(GET|POST|PUT|PATCH|DELETE)\b/);
      // Authentication happens in the guard only.
      expect(src).not.toContain("createSupabaseForRequest");
      expect(src).toMatch(/from "@\/lib\/api\/guard"/);
    });
  }

  it("health and the public intake routes are the only public routes, and nothing public is tenant-scoped", () => {
    const publicRoutes = files
      .filter((f) => /auth:\s*"public"/.test(readFileSync(f, "utf8")))
      .map((f) => path.relative(apiRoot, f))
      .sort();
    // Slice 10 Stage 3a: a Data Principal is not a user. Every public intake
    // route lives under public/ and reaches the database through lib/intake only.
    // Stage 3b adds the consent widget's one route, through the same door.
    expect(publicRoutes).toEqual(
      [
        path.join("health", "route.ts"),
        path.join("public", "[slug]", "route.ts"),
        path.join("public", "[slug]", "consent", "route.ts"),
        path.join("public", "[slug]", "submissions", "route.ts"),
        path.join("public", "[slug]", "submissions", "[submissionId]", "confirm", "route.ts"),
        path.join("public", "[slug]", "submissions", "[submissionId]", "resend", "route.ts"),
      ].sort(),
    );
    for (const f of files.filter((f) => path.relative(apiRoot, f).startsWith(`public${path.sep}`))) {
      const src = readFileSync(f, "utf8");
      expect(src, f).toMatch(/auth:\s*"public"/);
      expect(src, f).not.toMatch(/tenant:|permission:|createSupabaseAdminClient|\.from\(/);
      expect(src, f).toMatch(/from "@\/lib\/intake\/rpc"/);
    }
  });
});
