# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CodeBhaav.in is a community platform for self-taught developers, rebuilt with Astro + Convex + Cloudflare. Features a waitlist with AI-powered step wizard onboarding, referral leaderboard, and founding member applications.

## Commands

```bash
npm run dev       # Start Astro dev server
npm run build     # Production build (Cloudflare adapter)
npm run preview   # Preview production build locally
```

Convex (backend):
```bash
npx convex dev    # Start Convex dev server (watches for changes)
npx convex deploy # Deploy Convex functions to production
```

## Environment Variables

- `CONVEX_URL` — Convex deployment URL
- `RESEND_API_KEY` — Resend email service API key
- `BASE_URL` — Application base URL (used in email templates)

Cloudflare Workers AI is configured via `wrangler.toml` AI binding (no API key needed).

## Architecture

### Tech Stack

- **Framework:** Astro (hybrid mode) with React islands for interactive components
- **Backend/DB:** Convex (real-time document database + server functions)
- **AI:** Cloudflare Workers AI (Llama 3.1, powers info chatbot)
- **Deployment:** Cloudflare Pages
- **Email:** Resend (transactional emails via Convex actions)
- **Styling:** Tailwind CSS (dark mode, Inter font, violet accent #8B5CF6)

### Data Flow

Astro pages (static) → React islands (interactive)
React islands → Convex mutations/queries → Convex database
Convex actions → Resend API (email notifications)
Cloudflare Pages Function → Workers AI (chatbot at /api/chat)

### Key Directories

- `src/pages/` — Astro pages (index, waitlist, leaderboard, founding-member, mission, contact, projects, privacy, terms)
- `src/layouts/BaseLayout.astro` — Shared HTML shell, nav, footer
- `src/components/react/wizard/` — WaitlistWizard React component (step-by-step onboarding)
- `src/components/react/leaderboard/` — Leaderboard React component
- `src/components/react/forms/` — Founding member form
- `convex/schema.ts` — Database schema (waitlist, foundingMember tables)
- `convex/waitlist.ts` — Waitlist mutations/queries (submit, position, referrals, leaderboard)
- `convex/foundingMember.ts` — Founding member application mutation
- `convex/email.ts` — Email sending actions (Resend)
- `functions/api/chat.ts` — Cloudflare Pages Function for Workers AI chatbot

### Database (Convex)

Two tables:
- `waitlist` — signups with referral codes, interests, role. Indexes: by_email, by_referralCode, by_referralCount
- `foundingMember` — detailed applications. Index: by_email

Email uniqueness enforced in mutation logic (Convex has no native unique constraints).

### Design System

Linear.app-inspired: dark (#09090B), polished, restrained.
- Accent: violet #8B5CF6 (used sparingly)
- Surface: #111113, borders: #1F1F23
- Font: Inter (headlines bold), Geist Mono (metadata/stats)
- Border radius: 8px cards, 6px buttons, 4px badges
- No gradients/glows except subtle hero radial gradient

## Code Style

- **Formatter/Linter:** Biome with tab indentation
- **Path alias:** `@/*` maps to `./src/*`
- **Static pages:** Astro components (zero JS shipped)
- **Interactive parts:** React islands hydrated client-side
- **Convex functions:** Use `v.string()`, `v.optional()` validators

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
