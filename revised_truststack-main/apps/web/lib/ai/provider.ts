import "server-only";
import type { AiEffort, AiTask } from "@truststack/core";

/**
 * The provider interface (SLICE_11 §4.1, §4.14). The gateway, the guardrails
 * and the tests depend on this, never on a vendor SDK: Claude today
 * (`claude.ts`), a recorded fake in CI and e2e (`fake.ts`), and — for a
 * client-hosted install — the client's own account, cloud or private model,
 * configured by deployment, with no change to the gateway.
 */

export interface ProviderRequest {
  task: AiTask;
  /**
   * The byte-stable prefix: instructions, TrustStack's guidance and the whole
   * legal corpus. Cached (pitfall 3) — nothing per-request may appear in it.
   */
  system: string;
  /** Per-request: the task's instructions, the organisation's context and the question. */
  user: string;
  /** The answer's JSON schema (structured output, §4.3). */
  schema: Record<string, unknown>;
  effort: AiEffort;
  maxTokens: number;
}

export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

interface Base {
  /** The model that answered (a fallback may differ from the one asked). */
  model: string;
  usage: ProviderUsage;
  latencyMs: number;
}

export type ProviderResult =
  | (Base & { kind: "answer"; text: string })
  | (Base & { kind: "refusal"; category: string | null })
  | (Base & { kind: "truncated" });

export interface AiProvider {
  /** For the audit and the draft row. */
  readonly name: string;
  /** The model asked for — a config value recorded with every draft (§4.1). */
  readonly model: string;
  complete(request: ProviderRequest): Promise<ProviderResult>;
}

/** The provider could not be reached or failed — nothing is stored; the route answers 503. */
export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}
