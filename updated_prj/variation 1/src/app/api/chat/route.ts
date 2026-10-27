import { NextResponse } from "next/server";
import { anthropicConfigured, anthropicText } from "@/lib/ai/anthropic";
import { getCurrentUserTier } from "@/lib/subscription-access";
import { canAccessFeature } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRUSTCHAT_SYSTEM = `You are TrustChat™, the DPDP knowledge assistant for TrustStack.

Answer questions about India's Digital Personal Data Protection Act, 2023 and the DPDP Rules 2025 in clear, practical language.

Rules:
- Stay factual and educational. This is not legal advice.
- Prefer concise answers (2–6 short paragraphs or bullets).
- When unsure, say what is uncertain and suggest what a compliance team should verify.
- Do not invent penalties, dates, or section numbers.
- Do not discuss internal business strategy, pricing, or competitor analysis.
- If asked about something outside DPDP/privacy law, politely redirect to DPDP topics.`;

function systemPromptForContext(context?: { surface?: string; path?: string }): string {
  if (!context?.surface || context.surface !== "trustdeck") return TRUSTCHAT_SYSTEM;
  const path = context.path || "/trustdeck";
  return `${TRUSTCHAT_SYSTEM}

You are currently assisting inside TrustDeck (the compliance workspace), on route: ${path}.
When helpful, briefly relate answers to the module the user is working in (consent, DSR, breach, RoPA, grievance, privacy notice, vendors, assessment, or board reports).
Keep answers actionable for an operator configuring controls — not marketing copy.`;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!anthropicConfigured()) {
    return NextResponse.json(
      { error: "TrustChat AI is not configured on this server." },
      { status: 503 }
    );
  }

  const tier = await getCurrentUserTier();
  if (!canAccessFeature(tier, "trustchat")) {
    return NextResponse.json(
      { error: "TrustChat requires an active Pilot subscription." },
      { status: 403 }
    );
  }

  let body: {
    question?: string;
    messages?: ChatMessage[];
    context?: { surface?: string; path?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = body.question?.trim();
  const history = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m): m is ChatMessage =>
            Boolean(m) &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0
        )
        .slice(-12)
    : [];

  const messages: ChatMessage[] = question
    ? [...history, { role: "user", content: question }]
    : history;

  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "A user question is required." },
      { status: 400 }
    );
  }

  try {
    const answer = await anthropicText({
      system: systemPromptForContext(body.context),
      messages,
      maxTokens: 900,
    });

    return NextResponse.json({ answer: answer.trim() });
  } catch (error) {
    console.error("[TrustChat]", error);
    return NextResponse.json(
      { error: "TrustChat could not generate a response. Please try again." },
      { status: 502 }
    );
  }
}
