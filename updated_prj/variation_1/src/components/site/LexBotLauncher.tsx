"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { MessageSquare } from "lucide-react";
import { OPEN_LEXBOT_EVENT } from "@/lib/progress";

type OpenRequest = { ask?: string };
type LexBotComponent = ComponentType<{
  initialOpen?: boolean;
  initialQuestion?: string;
}>;

export function LexBotLauncher({ platform = false }: { platform?: boolean }) {
  const [request, setRequest] = useState<OpenRequest | null>(null);
  const [Chat, setChat] = useState<LexBotComponent | null>(null);

  const openChat = useCallback(async (nextRequest: OpenRequest) => {
    setRequest(nextRequest);
    if (Chat) return;
    const loaded = await import("./LexBot");
    setChat(() => loaded.LexBot);
  }, [Chat]);

  useEffect(() => {
    if (request) return;

    const openBot = (event: Event) => {
      const ask = (event as CustomEvent<{ ask?: string }>).detail?.ask;
      void openChat({ ask });
    };

    window.addEventListener(OPEN_LEXBOT_EVENT, openBot);
    return () => window.removeEventListener(OPEN_LEXBOT_EVENT, openBot);
  }, [request, openChat]);

  if (request && Chat) {
    return <Chat initialOpen initialQuestion={request.ask} />;
  }

  return (
    <button
      type="button"
      data-trustchat-trigger
      onClick={() => void openChat({})}
      aria-label="Open TrustChat assistant"
      className={`trustchat-launcher fixed z-[55] grid h-14 w-14 place-items-center rounded-full text-[var(--on-accent)] shadow-glow transition-transform hover:scale-105 ${
        platform ? 'bottom-24 right-4 md:bottom-6 md:right-6' : 'bottom-6 right-6'
      }`}
      style={{
        background: "linear-gradient(180deg, var(--accent-soft), var(--accent))",
      }}
    >
      <MessageSquare className="h-6 w-6" />
    </button>
  );
}