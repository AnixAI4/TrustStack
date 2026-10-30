import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

/**
 * Privileged Prisma client. Connects as `postgres` and BYPASSES RLS (D-015).
 * For migrations, seed and worker jobs. Never import it into a user request path.
 *
 * Runtime uses the POOLED connection (DATABASE_URL, :6543). Migrations use
 * DIRECT_URL via prisma.config.ts.
 */
export function createPrismaClient(connectionString = process.env.DATABASE_URL): PrismaClient {
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export type { PrismaClient };
