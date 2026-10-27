import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_MODEL } from "@/lib/ai/anthropic";

/** Shared Anthropic client for TrustDeck AI routes. */
export function getPlatformAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  return new Anthropic({ apiKey });
}

export { ANTHROPIC_MODEL as PLATFORM_AI_MODEL };
