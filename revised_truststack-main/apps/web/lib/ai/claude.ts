import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ProviderUnavailableError, type AiProvider, type ProviderRequest, type ProviderResult } from "./provider";

/**
 * Claude, behind the provider interface (SLICE_11 §4.1; D-124).
 *
 * THE ONLY module that reads `ANTHROPIC_API_KEY` — `tools/check_service_role.mjs`
 * fails the build otherwise, and refuses any `NEXT_PUBLIC_` name for it.
 *
 *   * Default model `claude-opus-5-5`; `AI_MODEL` overrides it (a config value,
 *     recorded with every draft). Thinking cannot be turned off on it; effort is
 *     the only control, set per task (low to explain, medium to draft).
 *   * Structured output (`output_config.format`), never an assistant prefill or
 *     a forced tool choice — both return 400 on this model (pitfall 4).
 *   * The server-side refusal fallback, `fallbacks: "default"` under the beta
 *     `server-side-fallback-2026-07-01`. `AI_SERVER_FALLBACK=off` drops it for an
 *     endpoint that lacks it (a client-hosted install on Bedrock or Vertex uses
 *     the SDK's client-side fallback there, §4.14).
 *   * `stop_reason` is checked before the answer is read: a refusal or a
 *     truncated answer is never a half-answer (§4.3).
 *   * The corpus prefix is cached for an hour (`cache_control`, pitfall 3);
 *     `cache_read_input_tokens` is recorded with every draft to prove it.
 *   * `ANTHROPIC_BASE_URL` (read by the SDK) points a client-hosted install at
 *     its own endpoint (§4.14).
 */

export const DEFAULT_MODEL = "claude-opus-5-5";

export function createClaudeProvider(): AiProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ProviderUnavailableError("ANTHROPIC_API_KEY is not set on the server.");
  const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
  const serverFallback = process.env.AI_SERVER_FALLBACK !== "off";
  // Retries: the SDK's own (408/409/429/5xx); a 60-second ceiling matches the route's maxDuration.
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 55_000 });

  return {
    name: "anthropic",
    model,
    async complete(request: ProviderRequest): Promise<ProviderResult> {
      const started = Date.now();
      let message: Anthropic.Beta.BetaMessage;
      try {
        const stream = client.beta.messages.stream({
          model,
          max_tokens: request.maxTokens,
          ...(serverFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
          output_config: {
            effort: request.effort,
            format: { type: "json_schema", schema: request.schema },
          },
          system: [{ type: "text", text: request.system, cache_control: { type: "ephemeral", ttl: "1h" } }],
          messages: [{ role: "user", content: request.user }],
        });
        message = await stream.finalMessage();
      } catch (error) {
        if (error instanceof Anthropic.APIError) {
          throw new ProviderUnavailableError(`AI provider error ${error.status ?? ""}: ${error.message}`.trim());
        }
        throw new ProviderUnavailableError(error instanceof Error ? error.message : "AI provider error");
      }

      const base = {
        model: message.model,
        latencyMs: Date.now() - started,
        usage: {
          inputTokens: message.usage.input_tokens ?? 0,
          outputTokens: message.usage.output_tokens ?? 0,
          cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
          cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
        },
      };
      if (message.stop_reason === "refusal") {
        return { ...base, kind: "refusal", category: message.stop_details?.category ?? null };
      }
      if (message.stop_reason === "max_tokens" || message.stop_reason === "model_context_window_exceeded") {
        return { ...base, kind: "truncated" };
      }
      const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
      return { ...base, kind: "answer", text };
    },
  };
}
