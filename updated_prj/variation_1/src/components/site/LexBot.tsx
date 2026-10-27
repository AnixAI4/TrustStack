"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, Trash2, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { notifyProgressUpdate, OPEN_LEXBOT_EVENT } from "@/lib/progress";
import { storageGetJSON, storageSetJSON } from "@/lib/safe-storage";
import { useSubscription } from "@/contexts/SubscriptionContext";

type Msg = { who: "user" | "bot"; text: string; title?: string };
type LexBotProps = {
  initialOpen?: boolean;
  initialQuestion?: string;
};

const DEFAULT_SUGGESTIONS = [
  "What is valid consent?",
  "Penalties for a breach?",
  "Children's data rules",
  "Who must comply?",
];

function suggestionsForPath(pathname: string | null): string[] {
  if (!pathname?.startsWith("/trustdeck")) return DEFAULT_SUGGESTIONS;
  if (pathname.includes("/consent")) {
    return [
      "What makes consent valid under DPDP?",
      "Can consent be withdrawn?",
      "What must a consent notice say?",
      "Consent for children's data?",
    ];
  }
  if (pathname.includes("/dsr")) {
    return [
      "What rights do data principals have?",
      "How fast must a DSR be fulfilled?",
      "What is the right to erasure?",
      "Can we refuse a DSR request?",
    ];
  }
  if (pathname.includes("/breach")) {
    return [
      "When must we notify the Board of a breach?",
      "What is the 72-hour rule?",
      "What goes in a breach notice?",
      "Do we notify affected individuals?",
    ];
  }
  if (pathname.includes("/ropa")) {
    return [
      "What is a record of processing?",
      "What must a ROPA entry include?",
      "Is ROPA mandatory under DPDP?",
      "How do purposes map to ROPA?",
    ];
  }
  if (pathname.includes("/grievance")) {
    return [
      "Who must appoint a Grievance Officer?",
      "What is the complaint timeline?",
      "What must the public grievance page show?",
      "When does a complaint escalate to the Board?",
    ];
  }
  if (pathname.includes("/privacy-notice")) {
    return [
      "What must a privacy notice include?",
      "How often should notices be renewed?",
      "Notice language requirements?",
      "Notice vs consent - what's the difference?",
    ];
  }
  if (pathname.includes("/vendors")) {
    return [
      "What is a data processor under DPDP?",
      "What should a DPA cover?",
      "Cross-border transfer rules?",
      "How do we assess vendor risk?",
    ];
  }
  if (pathname.includes("/assessment")) {
    return [
      "What does the Compass Score measure?",
      "How should we prioritize P0 gaps?",
      "What is maturity level under Compass?",
      "What evidence should we keep?",
    ];
  }
  if (pathname.includes("/reports") || pathname.includes("/overview")) {
    return [
      "What should a board DPDP report cover?",
      "How do we explain readiness to leadership?",
      "What are critical compliance gaps?",
      "Which modules matter first?",
    ];
  }
  return [
    "What is valid consent?",
    "How do data principal rights work?",
    "Breach notification timelines?",
    "What should we do first for DPDP?",
  ];
}

export function LexBot({ initialOpen = false, initialQuestion }: LexBotProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { canAccess, loading: subLoading } = useSubscription();
  const trustChatAllowed = canAccess("trustchat");
  const inTrustDeck = Boolean(pathname?.startsWith("/trustdeck"));
  const suggestions = useMemo(() => suggestionsForPath(pathname), [pathname]);
  const [open, setOpen] = useState(initialOpen && trustChatAllowed);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const initialQuestionHandled = useRef(false);
  const msgsRef = useRef<Msg[]>([]);

  useEffect(() => {
    if (!subLoading && !trustChatAllowed) {
      setOpen(false);
    }
  }, [subLoading, trustChatAllowed]);

  useEffect(() => {
    msgsRef.current = msgs;
  }, [msgs]);

  const persist = useCallback((next: Msg[]) => {
    msgsRef.current = next;
    setMsgs(next);
    storageSetJSON("dpdp-lexbot-chat", next.slice(-40));
    window.dispatchEvent(new Event("storage"));
    notifyProgressUpdate();
  }, []);

  const ask = useCallback(
    async (q: string) => {
      const query = q.trim();
      if (!query || loading) return;

      const prior = msgsRef.current;
      const withUser: Msg[] = [...prior, { who: "user", text: query }];
      persist(withUser);
      setInput("");
      setLoading(true);

      const history = withUser
        .slice(-12)
        .map((m) => ({
          role: m.who === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            context: inTrustDeck ? { surface: "trustdeck", path: pathname } : undefined,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          answer?: string;
          error?: string;
        };

        if (!res.ok) {
          const errText =
            res.status === 403
              ? "TrustChat requires an active Pilot subscription."
              : data.error ?? "TrustChat could not respond. Please try again.";
          persist([
            ...withUser,
            { who: "bot", text: errText, title: "Unavailable" },
          ]);
          return;
        }

        persist([
          ...withUser,
          {
            who: "bot",
            text: data.answer?.trim() || "I couldn't generate a response. Please try again.",
            title: "TrustChat",
          },
        ]);
      } catch {
        persist([
          ...withUser,
          {
            who: "bot",
            text: "TrustChat is temporarily unavailable. Check your connection and try again.",
            title: "Error",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, persist, inTrustDeck, pathname]
  );

  useEffect(() => {
    const saved = storageGetJSON<Msg[]>("dpdp-lexbot-chat", []);
    if (saved.length > 0) {
      msgsRef.current = saved;
      setMsgs(saved);
    }
  }, []);

  useEffect(() => {
    if (!initialQuestion || initialQuestionHandled.current) return;
    initialQuestionHandled.current = true;
    void ask(initialQuestion);
  }, [ask, initialQuestion]);

  useEffect(() => {
    const openBot = (e: Event) => {
      if (!canAccess("trustchat")) {
        router.push("/subscribe");
        return;
      }
      setOpen(true);
      const q = (e as CustomEvent<{ ask?: string }>).detail?.ask;
      if (q) void ask(q);
    };
    window.addEventListener(OPEN_LEXBOT_EVENT, openBot);
    return () => window.removeEventListener(OPEN_LEXBOT_EVENT, openBot);
  }, [ask, canAccess, router]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, open, loading]);

  const clear = () => persist([]);

  return (
    <>
      <button
        type="button"
        data-trustchat-trigger
        onClick={() => {
          if (!trustChatAllowed) {
            router.push("/subscribe");
            return;
          }
          setOpen((v) => !v);
        }}
        aria-label={
          trustChatAllowed
            ? "Open TrustChat assistant"
            : "TrustChat requires Pilot - upgrade to unlock"
        }
        title={trustChatAllowed ? undefined : "Pilot plan required"}
        className={cn(
          "trustchat-launcher fixed z-[55] grid h-14 w-14 place-items-center rounded-full text-[var(--on-accent)] shadow-glow transition-transform hover:scale-105",
          inTrustDeck ? "bottom-24 right-4 md:bottom-6 md:right-6" : "bottom-6 right-6"
        )}
        style={{ background: "linear-gradient(180deg, var(--accent-soft), var(--accent))" }}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : trustChatAllowed ? (
          <MessageSquare className="h-6 w-6" />
        ) : (
          <Crown className="h-6 w-6" />
        )}
      </button>

      <AnimatePresence>
        {open && trustChatAllowed && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className={cn(
              "fixed z-[55] flex h-[min(520px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-line bg-bg-2/95 shadow-glow backdrop-blur-xl",
              inTrustDeck
                ? "bottom-40 right-4 md:bottom-24 md:right-6"
                : "bottom-24 right-6"
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-text">TrustChat</div>
                  <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                    {inTrustDeck ? "TrustDeck assistant" : "DPDP assistant"}
                  </div>
                </div>
              </div>
              {msgs.length > 0 && (
                <button
                  onClick={clear}
                  aria-label="Clear chat"
                  className="grid h-8 w-8 place-items-center rounded-pill border border-line text-text-faint hover:text-text"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.length === 0 && (
                <div className="text-sm text-text-muted">
                  <p>
                    Hi! I&apos;m <strong className="text-text">TrustChat</strong>. Ask
                    me anything about the DPDP Act &amp; Rules
                    {inTrustDeck ? " while you work in TrustDeck" : ""}.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => void ask(s)}
                        disabled={loading}
                        className="chip py-1 text-xs disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex", m.who === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                      m.who === "user"
                        ? "bg-accent/15 text-text"
                        : "border border-line bg-surface-2/60 text-text-muted"
                    )}
                  >
                    {m.title && m.who === "bot" && (
                      <div className="mb-1 font-mono text-label uppercase tracking-wider text-accent">
                        {m.title}
                      </div>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2/60 px-3.5 py-2.5 text-sm text-text-faint">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Thinking…
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ask(input);
              }}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the DPDP Act…"
                disabled={loading}
                className="min-w-0 flex-1 rounded-pill border border-line bg-surface-2/60 px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-faint focus:border-accent/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-pill text-[var(--on-accent)] disabled:opacity-50"
                style={{ background: "linear-gradient(180deg, var(--accent-soft), var(--accent))" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
