import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_SYSTEM = `You are TrustChat™, the AI compliance advisor for Anix AI TrustStack™ — India's most advanced DPDP compliance platform.

PRICING POLICY: NEVER share specific pricing or cost estimates. All pricing is custom. Direct pricing questions to the contact form.

Respond concisely in 2-4 paragraphs. Always end with one actionable next step. Use simple language, not legal jargon.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, systemContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemContext || DEFAULT_SYSTEM,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response type" }, { status: 500 });
    }

    return NextResponse.json({ content: content.text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 });
  }
}
