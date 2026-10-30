/**
 * The RLS harness must refuse a non-local database unless the run opts in:
 * `.env.local` points at HOSTED, and the suite once ran there by accident.
 */
import { describe, expect, it } from "vitest";
import { assertLocalDatabase } from "../rls/db";

describe("assertLocalDatabase", () => {
  it.each([
    ["postgresql://postgres:postgres@127.0.0.1:54322/postgres", "127.0.0.1"],
    ["postgres://postgres:postgres@localhost:54322/postgres", "localhost"],
    ["postgresql://postgres:postgres@LOCALHOST:54322/postgres", "localhost"],
    ["postgresql://postgres:postgres@[::1]:54322/postgres", "::1"],
  ])("accepts the local stack: %s", (url, host) => {
    expect(assertLocalDatabase(url, false)).toBe(host);
  });

  const hosted = "postgresql://postgres.ref:secret@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";

  it("refuses the hosted pooler and names the host and the way out", () => {
    expect(() => assertLocalDatabase(hosted, false)).toThrow(/aws-0-ap-south-1\.pooler\.supabase\.com.*RLS_ALLOW_REMOTE=1/);
  });

  it("does not leak the password into the error", () => {
    expect(() => assertLocalDatabase(hosted, false)).toThrow(expect.objectContaining({ message: expect.not.stringContaining("secret") }));
  });

  it("refuses a ?host= override that points away from the local stack", () => {
    expect(() => assertLocalDatabase("postgresql://postgres@127.0.0.1:54322/postgres?host=db.example.com", false)).toThrow(
      /db\.example\.com/,
    );
  });

  it("refuses a lookalike host", () => {
    expect(() => assertLocalDatabase("postgresql://u:p@localhost.evil.com:5432/postgres", false)).toThrow(/localhost\.evil\.com/);
    expect(() => assertLocalDatabase("postgresql://u:p@127.0.0.2:5432/postgres", false)).toThrow(/127\.0\.0\.2/);
  });

  it("refuses a string it cannot parse rather than guessing", () => {
    expect(() => assertLocalDatabase("host=127.0.0.1 port=54322", false)).toThrow(/not a postgres:\/\/ URL/);
  });

  it("allows a remote host only with the explicit opt-in", () => {
    expect(assertLocalDatabase(hosted, true)).toBe("aws-0-ap-south-1.pooler.supabase.com");
  });
});
