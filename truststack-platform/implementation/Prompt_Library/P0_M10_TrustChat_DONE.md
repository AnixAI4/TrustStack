# M10: TrustChat™ — COMPLETE (reference only)
## Do not rebuild — this module is live.

## What exists

- `src/components/chatbot/TrustChat.tsx` — Floating chat widget component  
- `src/app/api/chat/route.ts` — Claude claude-sonnet-4-6 server-side API route  
- `src/app/api/health-check/route.ts` — 11-question DPDP health check scoring

## How it works

`TrustChat.tsx` renders a floating chat button. On click, opens a chat panel. Messages sent to `/api/chat` which calls Claude API with a DPDP system prompt. API key is server-side only — never exposed to browser.

## Enhancements to add (future session, not now)

- In-app contextual awareness: when user is in `/dashboard/assessment`, TrustChat should know they're doing an assessment and offer contextual help
- Add to dashboard as a persistent help widget (currently only on landing page)
- System prompt upgrade: add current org's assessment status as context so answers are personalized
- Multilingual TrustChat (Phase 2)

## How to add TrustChat to the dashboard

Import and render `<TrustChat />` inside `src/app/(dashboard)/layout.tsx` so it's available on every dashboard page.
