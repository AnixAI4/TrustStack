# Anix AI TrustStack™ — Project Structure

## Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **AI Chatbot**: Claude API (claude-sonnet-4-6)
- **Icons**: Lucide React
- **Hosting**: Vercel (recommended)
- **Payments**: Razorpay (to add)

## Folder Structure

```
truststack-platform/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # HOME / Landing page
│   │   ├── layout.tsx                # Root layout + metadata
│   │   ├── globals.css               # Global styles + design tokens
│   │   └── api/
│   │       ├── chat/route.ts         # TrustChat™ Claude API endpoint
│   │       └── health-check/route.ts # DPDP Health Check scoring API
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            # Sticky nav with dropdowns + mobile menu
│   │   │   └── Footer.tsx            # Footer with newsletter signup
│   │   ├── marketing/
│   │   │   ├── Hero.tsx              # Hero with particles + stats
│   │   │   ├── RiskQuestions.tsx     # Interactive 11-question risk checker
│   │   │   ├── Framework7D.tsx       # Anix 7D DPDP Framework™ interactive
│   │   │   ├── ServicesGrid.tsx      # 18-product service catalog
│   │   │   ├── IndustriesSection.tsx # 6-industry selector with detail
│   │   │   ├── WhyAnixAI.tsx         # Differentiators + comparison table
│   │   │   └── ContactSection.tsx    # Lead capture form
│   │   ├── chatbot/
│   │   │   └── TrustChat.tsx         # TrustChat™ floating AI chatbot
│   │   ├── platform/                 # (Future) Dashboard modules
│   │   └── ui/                       # (Future) Shared UI components
│   │
│   ├── lib/
│   │   └── utils.ts                  # cn() helper + formatting utilities
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   └── hooks/                        # (Future) Custom React hooks
│
├── public/
│   └── images/                       # Logo, OG image, etc.
│
├── .env.example                      # Environment variable template
├── .env.local                        # Your secrets (git-ignored)
├── package.json
├── tailwind.config.ts               # Full custom design system
├── next.config.ts
└── tsconfig.json
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local

# 3. Add your Anthropic API key to .env.local
# ANTHROPIC_API_KEY=sk-ant-...

# 4. Run dev server
npm run dev

# 5. Open http://localhost:3000
```

## Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | TrustChat™ AI chatbot (Claude-powered) |
| `/api/health-check` | GET | Get DPDP health check questions |
| `/api/health-check` | POST | Score DPDP health check answers |

## Design System

Color tokens defined in `tailwind.config.ts`:
- `background.*` — Dark navy backgrounds
- `brand.*` — Electric blue (#2563EB)
- `accent.gold` — Gold (#F59E0B)
- `danger.*` — Red (#EF4444) for risk/penalty messaging
- `text.*` — Text hierarchy

Utility classes in `globals.css`:
- `.glass-card` — Glassmorphism card
- `.btn-primary / .btn-secondary / .btn-danger` — Buttons
- `.section-label / .section-label-danger / .section-label-gold` — Labels
- `.text-gradient-brand / .text-gradient-gold / .text-gradient-danger` — Gradients
- `.grid-bg / .glow-bg` — Background effects

## Sections (Landing Page)

1. **Hero** — Full-screen with particles, urgency messaging, stats
2. **Risk Questions** — Interactive 11-question DPDP risk checker with live scoring
3. **Framework 7D** — Interactive Anix 7D DPDP Framework™ explorer
4. **Services Grid** — All 18 products across 4 tiers
5. **Industries** — 6-industry interactive selector
6. **Why Anix AI** — Differentiators + competitor comparison table
7. **Contact** — Lead capture form with urgency framing
8. **TrustChat™** — Floating AI chatbot (Claude-powered, appears on all pages)

## Next Platform Modules to Build

| Module | Priority | Revenue Connection |
|--------|----------|-------------------|
| Dashboard | P0 | TrustStack Platform™ SaaS |
| Data Inventory | P0 | DPDP Build™ delivery |
| Consent Register | P0 | Core compliance module |
| Breach Tracker | P1 | 72-hr notification |
| Rights Request Tracker | P1 | Data Principal rights |
| Vendor Risk Register | P1 | Processor governance |
| RoPA Builder | P2 | Record of processing |
| Board Dashboard | P2 | Executive reporting |
| CDPP Exam Platform | P2 | Certification revenue |
| Cookie Scanner | P3 | Freemium lead gen |

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable
vercel env add ANTHROPIC_API_KEY
```

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | TrustChat™ AI chatbot |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL for SEO |
| `RESEND_API_KEY` | Optional | Lead notification emails |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | Analytics |
