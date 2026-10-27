import "server-only";

import Anthropic from "@anthropic-ai/sdk";

// Temporary: Haiku for cost/speed. Flip default back to "claude-sonnet-4-6" later,
// or set ANTHROPIC_MODEL=claude-sonnet-4-6 in .env.local to override without a code change.
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";

export const DEFAULT_ANTHROPIC_MAX_TOKENS = (() => {
  const parsed = Number.parseInt(
    process.env.ANTHROPIC_MAX_TOKENS ?? process.env.GROQ_MAX_TOKENS ?? "5000",
    10
  );
  return Number.isFinite(parsed)
    ? Math.max(256, Math.min(8_000, parsed))
    : 5_000;
})();

export function anthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export function extractAnthropicText(
  content: Anthropic.Messages.Message["content"]
): string {
  return content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export async function anthropicText(params: {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const response = await client.messages.create({
    model: params.model ?? ANTHROPIC_MODEL,
    max_tokens: params.maxTokens ?? DEFAULT_ANTHROPIC_MAX_TOKENS,
    system: params.system,
    messages: params.messages,
  });

  const text = extractAnthropicText(response.content);
  if (!text) {
    throw new Error("Anthropic returned no text content.");
  }
  return text;
}

export async function anthropicJson<T>(params: {
  system: string;
  userPayload: unknown;
  maxTokens?: number;
  model?: string;
}): Promise<T> {
  const text = await anthropicText({
    system: params.system,
    messages: [{ role: "user", content: JSON.stringify(params.userPayload) }],
    maxTokens: params.maxTokens,
    model: params.model,
  });

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Anthropic returned malformed JSON.");
  }
}
