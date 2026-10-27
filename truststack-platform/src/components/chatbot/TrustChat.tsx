"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Shield, Minimize2, Maximize2,
  Bot, User, Sparkles, RefreshCw, Copy, Check, ArrowRight, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const STARTER_QUESTIONS = [
  "Does DPDP apply to my company?",
  "What is the penalty for data breach?",
  "What is a Consent Manager?",
  "How do I start DPDP compliance?",
  "Are DPDP Rules already in force?",
  "What is Director's personal liability?",
];

const SYSTEM_CONTEXT = `You are TrustChat, the AI compliance advisor for Anix AI TrustStack — India's most advanced DPDP compliance platform.

COMPANY: Anix AI LLP
TAGLINE: DPDP-ready. AI-ready. Trust-ready.

YOUR ROLE: Help organizations understand DPDP compliance, explain risks, and guide them toward Anix AI services.

KEY DPDP FACTS (as of 2025-2026):
- DPDP Act 2023 passed on 11 August 2023
- DPDP Rules 2025 notified on 3 January 2025 and are already IN FORCE
- Data Protection Board of India (DPBI) being constituted
- Maximum penalty: Rs 250 Crore per violation
- Directors and CXOs face PERSONAL LIABILITY
- 72-hour breach notification is mandatory under Rule 7
- Children's data requires verifiable parental consent under Rule 10
- Consent Manager is a new regulated intermediary under Rule 4
- Right to Erasure includes Machine Unlearning for AI systems
- DPDP applies to all organizations processing digital personal data in India, including foreign entities serving Indian users

ANIX AI SERVICES (do NOT share specific pricing — all pricing is custom, provided by proposal):
1. DPDP Ignite — Executive awareness workshop
2. DPDP Compass — 2-week readiness assessment (Starter / Standard / Enterprise tiers)
3. DPDP Build — Full implementation program
4. AI Privacy Shield — GenAI and AI governance
5. DPDP TrustOps — Monthly managed compliance service
6. TrustStack Platform — 12-module SaaS compliance dashboard
7. CDPP Certification — India's first DPDP professional certification

ANIX 7D FRAMEWORK: Discover, Define, Design, Defend, Deploy, Demonstrate, Drive

PRICING POLICY: Never share pricing, price ranges, or estimates. When asked about cost say: "Our pricing is tailored to your organization's size and needs. Fill in the contact form and our team will send you a custom proposal within 24 hours."

FORMATTING RULES (strictly follow):
- Do not use emojis anywhere in responses
- Do not use symbols like checkmarks, arrows, stars, bullets as characters
- Do not use decorative characters like >> or =>
- Use ## for main section headings where needed
- Use - for bullet points (single space after hyphen)
- Use 1. 2. 3. for ordered steps
- Use | col | col | tables when comparing multiple items
- Use **text** for key terms or emphasis
- Start responses directly — no "Certainly!" or "Great question!"
- Keep responses focused: 2-4 paragraphs or one structured list
- End with one clear action step for the user`;

/* ── Markdown renderer ── */

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:600">$1</strong>')
    .replace(/\*((?!\s).*?(?<!\s))\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

function parseMarkdown(raw: string): React.ReactNode {
  const lines = raw.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    // Skip pure blank lines between blocks
    if (!line.trim()) { i++; continue; }

    // ## Heading
    if (line.startsWith("## ")) {
      nodes.push(<h3 key={i} className="chat-h3">{line.slice(3).trim()}</h3>);
      i++; continue;
    }
    // ### Sub-heading
    if (line.startsWith("### ")) {
      nodes.push(<h4 key={i} className="chat-h4">{line.slice(4).trim()}</h4>);
      i++; continue;
    }
    // --- Divider
    if (/^-{3,}$/.test(line.trim())) {
      nodes.push(<hr key={i} className="chat-hr" />);
      i++; continue;
    }

    // Unordered list block
    if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="chat-ul">
          {items.map((item, j) => (
            <li key={j} className="chat-li">
              <span className="chat-bullet" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list block
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++; num++;
      }
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="chat-ol">
          {items.map((item, j) => (
            <li key={j} className="chat-li">
              <span className="chat-num">{j + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Table block
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const dataLines = tableLines.filter((l) => !/^\|[-|:\s]+\|/.test(l));
      if (dataLines.length >= 1) {
        const headers = dataLines[0].split("|").filter(Boolean).map((h) => h.trim());
        const rows = dataLines.slice(1);
        nodes.push(
          <div key={`tbl-${nodes.length}`} className="overflow-x-auto my-2">
            <table className="chat-table">
              <thead>
                <tr>{headers.map((h, j) => <th key={j} dangerouslySetInnerHTML={{ __html: formatInline(h) }} />)}</tr>
              </thead>
              <tbody>
                {rows.map((row, j) => (
                  <tr key={j}>
                    {row.split("|").filter(Boolean).map((cell, k) => (
                      <td key={k} dangerouslySetInnerHTML={{ __html: formatInline(cell.trim()) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Regular paragraph
    nodes.push(
      <p key={i} className="chat-p" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
    );
    i++;
  }

  return <>{nodes}</>;
}

/* ── Sub-components ── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--c-navy)" }}>
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm border" style={{ background: "var(--c-bg-secondary)", borderColor: "var(--c-border)" }}>
        <div className="typing-dots flex gap-1">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex items-start gap-2.5 px-4 py-2 group", isUser && "flex-row-reverse")}>
      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",)}
        style={isUser
          ? { background: "var(--c-blue-pale)", border: "1px solid var(--c-border-mid)" }
          : { background: "var(--c-navy)" }}>
        {isUser
          ? <User className="w-3.5 h-3.5" style={{ color: "var(--c-navy)" }} />
          : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>

      <div className={cn("relative max-w-[82%] flex flex-col", isUser ? "items-end" : "items-start")}>
        <div className={cn("px-4 py-3 text-sm leading-relaxed", isUser ? "rounded-2xl rounded-tr-sm text-white" : "rounded-2xl rounded-tl-sm chat-content")}
          style={isUser
            ? { background: "var(--c-navy)" }
            : { background: "var(--c-bg-secondary)", border: "1px solid var(--c-border)" }}>
          {isUser
            ? <p className="text-sm leading-relaxed">{message.content}</p>
            : parseMarkdown(message.content)}
        </div>

        <div className={cn("flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity", isUser ? "flex-row-reverse" : "")}>
          <span className="text-[10px] text-text-muted">
            {message.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && (
            <button onClick={copyText} className="text-text-muted hover:text-text-secondary transition-colors">
              {copied ? <Check className="w-3 h-3 text-success-DEFAULT" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function TrustChat() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am TrustChat, your AI guide for DPDP compliance.\n\nDPDP Rules 2025 are already in force. Is your organization compliant?\n\nAsk me anything about DPDP obligations, penalties, timelines, or how Anix AI can help.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) { setTimeout(() => inputRef.current?.focus(), 100); setShowNotification(false); } }, [open]);
  useEffect(() => { const t = setTimeout(() => setShowNotification(true), 6000); return () => clearTimeout(t); }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content, timestamp: new Date() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          systemContext: SYSTEM_CONTEXT,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((p) => [...p, { id: (Date.now() + 1).toString(), role: "assistant", content: data.content, timestamp: new Date() }]);
    } catch {
      setMessages((p) => [...p, {
        id: (Date.now() + 1).toString(), role: "assistant",
        content: "I am having trouble connecting right now. Please try again, or fill in our contact form and a DPDP expert will reach out within 4 business hours.",
        timestamp: new Date(),
      }]);
    } finally { setLoading(false); }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetChat = () => setMessages([{
    id: "welcome-reset", role: "assistant",
    content: "Chat reset. I am TrustChat, your DPDP compliance advisor. How can I help you today?",
    timestamp: new Date(),
  }]);

  return (
    <>
      {/* Floating trigger */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {showNotification && !open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="rounded-2xl px-4 py-3 max-w-[220px] cursor-pointer"
              style={{ background: "var(--c-bg-card-flat)", border: "1px solid var(--c-border)", boxShadow: "var(--s-card-h)" }}
              onClick={() => setOpen(true)}
            >
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--c-navy)" }} />
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-0.5">Ask TrustChat AI</p>
                  <p className="text-[11px] text-text-muted">&ldquo;Is my company DPDP compliant?&rdquo;</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(!open)}
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#003366,#2563EB)", boxShadow: "0 8px 30px rgba(37,99,235,0.45)" }}
          aria-label="Open TrustChat"
        >
          <AnimatePresence mode="wait">
            <motion.div key={open ? "close" : "open"} initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
              {open ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
            </motion.div>
          </AnimatePresence>
          {!open && <span className="absolute inset-0 rounded-2xl animate-ping bg-brand-blue/30" />}
          {!open && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-danger-DEFAULT border-2 border-white" />}
        </motion.button>
      </div>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn("fixed z-50 flex flex-col overflow-hidden rounded-2xl", expanded ? "inset-4 sm:inset-8 lg:inset-16" : "bottom-24 right-6 w-[380px] sm:w-[420px] h-[600px]")}
            style={{ background: "var(--c-bg-card-flat)", border: "1px solid var(--c-border)", boxShadow: "var(--s-brand-lg)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b" style={{ background: "var(--c-navy)", borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success-DEFAULT border-2 border-brand-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-white">TrustChat</div>
                <div className="text-[11px] text-white/60">by Anix AI — DPDP Compliance AI</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={resetChat} title="New chat" className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
                <button onClick={() => setExpanded(!expanded)} className="w-7 h-7 rounded-lg hidden sm:flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Urgency strip */}
            <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b" style={{ background: "var(--c-danger-bg)", borderColor: "var(--c-danger-bd)" }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--c-danger)" }} />
              <span className="text-[11px] font-medium" style={{ color: "var(--c-danger-tx)" }}>
                DPDP Rules 2025 in force — Penalties up to Rs 250 Crore — Director liability applies
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto chat-scroll py-2" style={{ background: "var(--c-bg)" }}>
              {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Starter questions */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 border-t flex-shrink-0" style={{ background: "var(--c-bg-secondary)", borderColor: "var(--c-border)" }}>
                <p className="text-[10px] text-text-muted mb-2 font-semibold uppercase tracking-wider">Common Questions</p>
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_QUESTIONS.map((q) => (
                    <button key={q} onClick={() => { sendMessage(q); setInput(""); }}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg border text-text-secondary hover:text-text-primary transition-all text-left leading-tight"
                      style={{ background: "var(--c-bg-card-flat)", borderColor: "var(--c-border)" }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-2 px-3 py-3 border-t flex-shrink-0" style={{ background: "var(--c-bg-card-flat)", borderColor: "var(--c-border)" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about DPDP compliance..."
                rows={1}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm placeholder:text-text-muted resize-none focus:outline-none transition-colors leading-relaxed max-h-24 overflow-y-auto chat-scroll"
                style={{
                  background: "var(--c-bg-secondary)",
                  border: "1px solid var(--c-border-mid)",
                  color: "var(--c-text-1)",
                  minHeight: "40px",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--c-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--c-border-mid)"; e.target.style.boxShadow = "none"; }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={input.trim() && !loading
                  ? { background: "var(--c-navy)", boxShadow: "var(--s-brand)", color: "white" }
                  : { background: "var(--c-bg-secondary)", color: "var(--c-text-3)", cursor: "not-allowed" }}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>

            {/* AI consent notice */}
            <div className="flex items-start gap-2 px-4 py-2.5 border-t flex-shrink-0" style={{ background: "var(--c-bg-secondary)", borderColor: "var(--c-border)" }}>
              <Info className="w-3 h-3 text-text-muted flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-text-muted leading-relaxed">
                <strong className="text-text-secondary">AI Notice:</strong> TrustChat is powered by an AI language model (Claude by Anthropic). Responses are for general information only — not legal advice. Do not share sensitive personal data. See our <a href="/privacy-policy" className="underline hover:text-brand-blue">Privacy Policy</a>.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t flex-shrink-0" style={{ background: "var(--c-bg-card-flat)", borderColor: "var(--c-border)" }}>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-brand-blue" />
                <span className="text-[10px] text-text-muted">Powered by Claude AI — Anix AI TrustStack</span>
              </div>
              <a href="#contact" onClick={() => setOpen(false)} className="flex items-center gap-1 text-[10px] text-brand-blue hover:underline transition-colors">
                Talk to an expert <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat content styles injected inline */}
      <style>{`
        .chat-h3 { font-size: 0.8125rem; font-weight: 700; color: var(--c-text-1); margin: 0.7rem 0 0.35rem; border-bottom: 1px solid var(--c-border); padding-bottom: 0.25rem; }
        .chat-h4 { font-size: 0.75rem; font-weight: 600; color: var(--c-text-1); margin: 0.5rem 0 0.2rem; }
        .chat-p  { font-size: 0.8125rem; line-height: 1.6; margin-bottom: 0.35rem; color: var(--c-text-1); }
        .chat-ul, .chat-ol { margin: 0.35rem 0 0.5rem; }
        .chat-li { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.8125rem; line-height: 1.55; margin-bottom: 0.25rem; color: var(--c-text-1); }
        .chat-bullet { width: 5px; height: 5px; border-radius: 50%; background: var(--c-blue); flex-shrink: 0; margin-top: 0.45rem; }
        .chat-num { width: 18px; height: 18px; border-radius: 50%; background: var(--c-navy); color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.1rem; }
        .chat-hr { border: 0; border-top: 1px solid var(--c-border); margin: 0.6rem 0; }
        .chat-table { width: 100%; font-size: 0.7rem; border-collapse: collapse; }
        .chat-table th { background: var(--c-blue-pale); color: var(--c-navy); font-weight: 600; text-align: left; padding: 5px 8px; border: 1px solid var(--c-border); }
        .chat-table td { padding: 5px 8px; border: 1px solid var(--c-border); color: var(--c-text-2); vertical-align: top; }
        .chat-table tr:nth-child(even) td { background: var(--c-bg-secondary); }
        .chat-content strong { font-weight: 600; color: var(--c-text-1); }
        .chat-content em { font-style: italic; }
        .chat-content code { background: var(--c-bg-secondary); padding: 1px 5px; border-radius: 3px; font-size: 11px; font-family: monospace; border: 1px solid var(--c-border); }
      `}</style>
    </>
  );
}
