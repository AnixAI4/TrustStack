import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// The monorepo keeps one .env.local at the repo root. Vercel/CI inject real env.
loadEnvConfig(path.resolve(import.meta.dirname, "../.."));

const nextConfig: NextConfig = {
  transpilePackages: ["@truststack/core"],
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(import.meta.dirname, "../.."),
  // The PDF renderer runs its own React reconciler: load it from node_modules
  // at run time rather than bundling it (Slice 9, D-076).
  serverExternalPackages: ["@react-pdf/renderer"],
  // The report fonts are read from disk at run time (lib/reports/pdf.ts), so
  // ship them with the functions that render reports.
  outputFileTracingIncludes: {
    "/api/v1/organizations/[id]/reports": ["./lib/reports/fonts/*"],
    "/api/v1/organizations/[id]/reports/[reportId]/regenerate": ["./lib/reports/fonts/*"],
  },
};

export default nextConfig;
