import "server-only";
import { createClaudeProvider } from "./claude";
import { createFakeProvider } from "./fake";
import { ProviderUnavailableError, type AiProvider } from "./provider";

/**
 * Deployment config for the assistant (SLICE_11 §4.8, §4.14). Key NAMES only
 * in `.env.example`; values live in the host's environment.
 *
 *   AI_ENABLED=true        the platform kill switch — anything else is OFF, and
 *                          it wins over every organisation's setting (§4.8)
 *   AI_PROVIDER            `anthropic` (default) · `fake` (CI and e2e only)
 *   AI_MODEL               the model id (default claude-opus-5-5)
 *   the Anthropic key      read by ./claude.ts only (tools/check_service_role.mjs)
 *   ANTHROPIC_BASE_URL     a client-hosted install's own endpoint (read by the SDK)
 *   AI_SERVER_FALLBACK=off for an endpoint without server-side fallback
 */
export function aiPlatformEnabled(): boolean {
  return process.env.AI_ENABLED === "true";
}

export function createProvider(): AiProvider {
  const name = process.env.AI_PROVIDER?.trim() || "anthropic";
  switch (name) {
    case "anthropic":
      return createClaudeProvider();
    case "fake":
      return createFakeProvider();
    default:
      throw new ProviderUnavailableError(`Unknown AI_PROVIDER "${name}".`);
  }
}
