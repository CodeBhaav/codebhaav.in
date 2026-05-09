# Project Ideas — Vision & Plan

> Captured 2026-05-09. Source: founder conversation. To be revisited after the
> admin panel ships.

## The product loop

Students submit project ideas → admin moderates → approved ideas become public
"project pages" → community votes (Product-Hunt-style) → top-voted projects
become the ones we actually build together. **Founder is mediator and guide,
students decide what gets built.** This is the heart of the "build together"
brand promise.

## Submission paths (multiple ways in)

The barrier to share an idea should match the user's appetite. Three modes:

1. **Quick idea (low-friction).** Single textbox: "Got an idea? Tell us in a
   sentence." Captured raw. Optimized for "thought just hit me, want to share
   before it's gone."
2. **Detailed idea (structured).** A form with explicit fields: title, problem
   it solves, proposed tech stack, target users, scope/effort estimate. For
   people who have actually thought about it.
3. **PDF / document upload.** User attaches a write-up (Notion export, doc,
   spec). The platform parses with an LLM (Workers AI / fallback) into the
   same structured shape as path #2. Optimized for power-users who already
   have ideas written down elsewhere.

The LLM normalization step turns paths #1 and #3 into the same shape as #2 so
the admin sees one consistent format regardless of input mode.

## Status pipeline

```
submitted → in_review → approved → published → building → shipped
                     └→ rejected
```

- **submitted** — fresh, awaits admin look
- **in_review** — admin is reading
- **approved (private)** — passed moderation, not yet on public page
- **published** — visible on public listing, accepting upvotes
- **building** — chosen by the community (or admin promote), team formed
- **shipped** — done, archived as case-study
- **rejected** — out of scope or duplicate, with optional admin note

Each transition can fire a branded React Email (welcome submission, your
idea is live, you got picked, etc.).

## Public surface (Product-Hunt-style)

- `/projects` — listing page, sorted by upvotes (default) or recency
- `/projects/[slug]` — detail page: title, problem, tech, submitter (with
  attribution), upvote button, comments (later), team-interest button (later)

Visual reference: Product Hunt cards, Linear changelog, Vercel templates page.
Cards should feel **alive** (animated upvote, status pill, submitter avatar).

## Voting system

- Auth-required (must be signed in via Clerk)
- One vote per user per project
- Optimistic UI on click
- Anti-spam: rate-limit at Convex level, log clerkUserId
- Display: live count, "you voted" state, recent voters as small avatars

## Admin moderation flow

Admin dashboard surface for ideas:
- Inbox view: all `submitted` ideas, sorted oldest first
- Detail view: all parsed fields, original raw input (text or PDF link),
  submitter info, "approve" / "reject" / "request more info" actions
- Bulk actions for triage: select N, mark as `in_review`
- Status flips fire emails (already pattern-established with
  `foundingMember:updateStatus`)

## Phasing (suggested cut)

**Phase 1 (this sprint):**
- `projectIdea` table + schema
- Quick textbox submission only
- Admin status flips (CLI initially, admin UI in next iteration)
- Show submitted ideas on the user's dashboard

**Phase 2:**
- Public listing (`/projects`) + detail pages
- Upvote system
- Branded transactional emails per status transition

**Phase 3:**
- Detailed-form submission path
- PDF upload + Workers-AI parsing → normalized fields
- Admin "request more info" reply flow
- Comments on project pages

## Open questions

- Comments on project pages: yes / no / when?
- Team-interest signal: should non-submitters be able to mark "I want to help
  build this" before status hits `building`?
- Voting weight: equal weight for everyone, or weight by waitlist position
  / referral count / founding-member status? (Probably just equal — easier to
  reason about, harder to game.)
- Slug strategy: human-readable from title, or short-id for stability?
- LLM extraction confidence: what to do when the model is uncertain — flag
  for admin? force user to confirm fields?

## What to build first

Once the admin panel is shipped, return here and start with **Phase 1**.
