import pg from "pg";

/**
 * Direct-to-Postgres harness for the RLS suites. Impersonates a signed-in user
 * exactly as PostgREST does — `request.jwt.claims` + `SET LOCAL ROLE
 * authenticated` — inside a transaction that is ALWAYS rolled back.
 */
export const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

/**
 * `apps/web/.env.local` points at the HOSTED project, and on 2026-10-11 the
 * suite ran against it because nothing overrode it. Refuse any host but the
 * local stack (CI's is 127.0.0.1:54322) unless `RLS_ALLOW_REMOTE=1` says the
 * remote run is deliberate. Returns the host it accepted.
 */
export function assertLocalDatabase(url: string, allowRemote = process.env.RLS_ALLOW_REMOTE === "1"): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("RLS tests: DIRECT_URL / DATABASE_URL is not a postgres:// URL — refusing to guess its host");
  }
  // pg honours a `?host=` override over the authority, so that is the host it would reach.
  const host = (parsed.searchParams.get("host") ?? parsed.hostname).replace(/^\[(.*)\]$/, "$1").toLowerCase();
  if (LOCAL_HOSTS.has(host) || allowRemote) return host;
  throw new Error(
    `RLS tests refuse to run against non-local host "${host}". ` +
      "Export the local stack's env first (DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres), " +
      "or set RLS_ALLOW_REMOTE=1 to run against it deliberately.",
  );
}

export async function connect(): Promise<pg.Client> {
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set for RLS tests");
  assertLocalDatabase(connectionString);
  const client = new pg.Client({ connectionString });
  await client.connect();
  return client;
}

export interface Tx {
  /** Run as the privileged connection role (setup only — bypasses RLS). */
  asAdmin<T extends pg.QueryResultRow>(sql: string, params?: unknown[]): Promise<pg.QueryResult<T>>;
  /** Run as `authenticated` with this JWT subject (+ email claim), or as `anon` when sub is null. */
  as<T extends pg.QueryResultRow>(
    who: { sub: string; email?: string } | null,
    sql: string,
    params?: unknown[],
  ): Promise<pg.QueryResult<T>>;
  /** Run as `service_role` — the web server's admin client (Slice 10 Stage 3a: the public intake functions). */
  asServer<T extends pg.QueryResultRow>(sql: string, params?: unknown[]): Promise<pg.QueryResult<T>>;
}

export async function inTransaction<T>(client: pg.Client, fn: (tx: Tx) => Promise<T>): Promise<T> {
  await client.query("BEGIN");
  try {
    let n = 0;
    // A failed statement aborts the transaction; a savepoint per call keeps
    // later calls in the same test usable after an expected error.
    async function savepoint<R>(run: () => Promise<R>): Promise<R> {
      const sp = `sp_${n++}`;
      await client.query(`SAVEPOINT ${sp}`);
      try {
        const result = await run();
        await client.query(`RELEASE SAVEPOINT ${sp}`);
        return result;
      } catch (error) {
        await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
        throw error;
      }
    }
    const tx: Tx = {
      asAdmin: async (sql, params = []) => {
        await client.query("RESET ROLE");
        // Tooling has no JWT: clear any claims a previous `as()` set in this transaction.
        await client.query("SELECT set_config('request.jwt.claims', '', true)");
        return savepoint(() => client.query(sql, params));
      },
      as: async (who, sql, params = []) => {
        await client.query("RESET ROLE");
        if (who === null) {
          await client.query("SELECT set_config('request.jwt.claims', '', true)");
          await client.query("SET LOCAL ROLE anon");
        } else {
          await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
            JSON.stringify({ sub: who.sub, email: who.email, role: "authenticated" }),
          ]);
          await client.query("SET LOCAL ROLE authenticated");
        }
        return savepoint(() => client.query(sql, params));
      },
      asServer: async (sql, params = []) => {
        await client.query("RESET ROLE");
        await client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "service_role" })]);
        await client.query("SET LOCAL ROLE service_role");
        return savepoint(() => client.query(sql, params));
      },
    };
    return await fn(tx);
  } finally {
    await client.query("ROLLBACK");
  }
}

export async function authSubjects(client: pg.Client, userIds: string[]): Promise<Map<string, { sub: string; email: string }>> {
  const { rows } = await client.query<{ id: string; auth_provider_user_id: string; email: string }>(
    "SELECT id, auth_provider_user_id, email FROM public.users WHERE id = ANY($1::uuid[])",
    [userIds],
  );
  if (rows.length !== userIds.length) throw new Error("Seed data missing — run `pnpm db:seed` first");
  return new Map(rows.map((r) => [r.id, { sub: r.auth_provider_user_id, email: r.email }]));
}
