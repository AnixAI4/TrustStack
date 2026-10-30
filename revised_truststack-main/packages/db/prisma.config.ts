import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Local dev reads the repo-root .env.local; CI and Vercel inject real env vars.
loadEnv({ path: path.resolve(import.meta.dirname, "../../.env.local"), quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations use the DIRECT port 5432. Runtime uses the pooled 6543 (src/client.ts).
    url: env("DIRECT_URL"),
  },
});
