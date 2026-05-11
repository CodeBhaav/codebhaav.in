# Project Features Plan

> Working document. Update the **Status** column as features land.
> Safe to clear conversation context and resume from this file alone.

## Already shipped (for context)

### Project ideas + projects pipeline
- `projectIdea` table — title + description + upvote/downvote + threaded comments + @mentions
- `project` table — title + description + techStack[] + slug + status (open|building|shipped) + originator credit + interest count
- Build team with roles, team lead designation, permission gating (admin OR team lead can manage)
- Building-readiness gate (`flipProjectStatus("building")` rejects if techStack empty or no team)
- Sidebar layout on `/projects/[slug]` — main column = description + discussion, sticky sidebar = TechStackCard + BuildTeamCard
- Threaded Reddit-style comments with @mentions (Clerk preferred_username), reply-to breadcrumb, thread collapse, pagination, live highlight in composer, inline sign-in modal
- View Transitions in BaseLayout + AdminLayout (Convex query cache survives navigation)
- Admin Ideas inbox with promote/reject modals + Projects management page with team-lead crown picker + "Make lead" one-click button
- Member dashboard widgets: "Your ideas", "Projects I'm building", "Projects I've volunteered for"

### Newsletter / Resend
- 4 topics, 3 segments, 5 contact properties bootstrapped in Resend (legacy "General" audience deleted)
- `syncContact` action fans contact upserts + segment add/remove + topic patches from every mutation
- `/dashboard/settings` multi-switch UI for per-topic subscription state

### Key files
- `convex/schema.ts`, `convex/projectIdeas.ts`, `convex/projects.ts`, `convex/members.ts`
- `convex/email.tsx` (bootstrap + syncContact + email templates)
- `src/components/react/projects/` (panels, cards, comment thread, mention composer)
- `src/components/react/admin/AdminProjectDetail.tsx`, `AdminIdeasPanel.tsx`
- `src/layouts/BaseLayout.astro`, `AdminLayout.astro` (View Transitions)

---

## Roadmap — 8 features in build order

Status legend: ⬜ pending · 🟦 in progress · ✅ done

### 1. Repo URL + Live demo URL on projects ✅

**Scope:** two optional fields on the `project` table. Surface as link badges in the sidebar `TechStackCard` area (or a new tiny `ProjectLinksCard` above it). Editable by admin / team lead.

**Files**
- `convex/schema.ts` — add `repoUrl?: v.string()`, `demoUrl?: v.string()` to `project`
- `convex/projects.ts` — `updateProject` mutation already exists; add the two fields to its arg validator + return shape
- New component: `src/components/react/projects/ProjectLinksCard.tsx` — read mode shows GitHub/Globe icon + URL; edit mode = two inputs
- `ProjectDetailPanel.tsx` — render the card above TechStackCard

**Validation**
- URLs must start with `https://` (server-side check, friendly error)
- Optional — empty string treated as null

### Notes / decisions
- Server-side regex: `^https:\/\/[^\s]+$` (case-insensitive). Trim before check; empty string normalizes to `undefined` via `ctx.db.patch`, which clears the field.
- Read-only `LinkRow` displays `prettyHost(url)` (hostname minus `www.` + optional path) rather than the raw URL — keeps the sidebar tidy when repos have long paths.
- Card is hidden entirely for non-managers when both links are absent (avoids a confusing "no links yet" placeholder for visitors). For managers it shows the empty-state CTA.
- Reused `TechStackCard`'s read/edit toggle + `cn` button pattern verbatim for consistency with the rest of the sidebar.

---

### 2. User profile pages (`/u/[username]`) ⬜

**Scope:** public profile page per user. Shows their submitted ideas (with status), projects they're a team member of (with role), projects they originated, total comment count. Clickable from any `@mention` or comment author header.

**Files**
- `convex/schema.ts` — no schema change strictly needed; add `userProfile.preferredUsername` (cached) + `by_username` index for fast lookup. Backfill via the same path that captures `authorUsername`.
- New `convex/profiles.ts` query: `getProfileByUsername(username)` — returns ideas + projects + counts
- New pages:
  - `src/pages/u/[username].astro`
  - `src/components/react/profile/ProfilePanel.tsx`
  - `src/components/react/islands/ProfileIsland.tsx`
- Update `MentionComposer.RenderedBody` + `BackdropBody` — wrap matched `@username` substrings in `<a href="/u/<username>">`
- Update `CommentThread` — author name links to `/u/<username>` when username present
- Update `Avatar` in `AdminOverview.tsx` to optionally accept an `href` prop

**Edge cases**
- User with no username falls back to non-clickable name
- 404 page for unknown username
- Self-profile via `/u/<own-username>` works; no separate `/me`

---

### 3. Notifications ⬜

**Scope:** in-app inbox + opt-in email digest.

#### Triggers (event types)
- `mention_in_comment` — you were @-mentioned
- `reply_to_my_comment` — someone replied to your comment
- `idea_status_changed` — your idea was promoted / rejected
- `project_status_changed` — a project you're on team / volunteered for changed status
- `added_to_build_team` — admin/team-lead added you to a project's build team
- `team_lead_assigned` — you were made team lead of a project

#### Backend
- New table `notification`:
  ```
  recipientClerkUserId: string
  kind: union of literals (the events above)
  payload: object (links, names, ids)
  read: boolean
  readAt: optional number
  by_recipient: index (recipientClerkUserId, _creationTime)
  by_recipient_unread: index (recipientClerkUserId, read)
  ```
- New `convex/notifications.ts`:
  - `listMyNotifications({ paginationOpts })`
  - `getMyUnreadCount()` (cheap, drives the badge)
  - `markRead({ ids })`
  - `markAllRead()`
- Triggering: every mutation that creates a relevant event inserts a `notification` row inline (cheap; same transaction). Email digest is a separate scheduled action.
- Email digest: new cron `internal.email.sendDailyNotificationDigest` (daily at e.g. 09:00 IST). Groups unread notifications per user, sends one Resend email gated on the existing `community_updates` topic OR a new `activity_updates` topic — recommend the latter so people can opt in/out separately.

#### Frontend
- New `NotificationBellIsland` in the navbar (signed-in users only). Shows unread badge, click opens dropdown with last 10. Polls via Convex reactive query (already real-time).
- New `/dashboard/notifications` page — full paginated list, mark-all-read button.
- Update `/dashboard/settings` — add the new `activity_updates` topic toggle (uses existing per-topic Resend wiring).

#### Resend changes (1 new topic)
- Add `activity_updates` to `convex/resendResources.ts` with `default_subscription: "opt_in"`, `visibility: "public"`. Run `bootstrapResendResources` again to create it. Updates user toggle UI automatically.

---

### 4. Tag categories on ideas + projects ⬜

**Scope:** small fixed set of category tags applied to ideas and projects. Powers filters and "more like this".

**Files**
- `convex/resendResources.ts`-style constants file: `convex/projectCategories.ts` listing canonical categories (`web`, `mobile`, `ai`, `tooling`, `infra`, `game`, `other`)
- `convex/schema.ts` — `categories: v.optional(v.array(v.string()))` on `projectIdea` AND `project`. Indexed by first category for cheap filter.
- Mutations: `submitIdea`, `promoteIdeaToProject`, `updateProject` accept `categories?: string[]`
- `IdeaSubmitForm.tsx` — small multi-select chip picker (max 2 categories)
- Admin promote modal — same picker (pre-fills from idea's categories)
- `TechStackCard.tsx` companion: `CategoriesCard.tsx` (read-only on detail; chip pills in sidebar)
- Filters: `IdeasListPanel` and `ProjectsListPanel` gain a "Category" segmented control next to the existing status filter

---

### 5. Project update log (milestones) ⬜

**Scope:** team-lead-only "post a build update" entries pinned above the comment thread. Visual: timeline cards with date, title, body. Once shipped, these become the case-study.

**Files**
- `convex/schema.ts` — new table `projectUpdate`:
  ```
  projectId: id("project")
  authorClerkUserId, authorName, authorUsername?
  title: string
  body: string
  index "by_project" — (projectId, _creationTime)
  ```
- `convex/projects.ts`:
  - `listProjectUpdates({ projectId })`
  - `postProjectUpdate({ projectId, title, body })` — team-lead or admin only
  - `deleteProjectUpdate({ updateId })` — author or admin
- `ProjectDetailPanel.tsx` — new "Updates" section between header and comments. Composer visible to team lead/admin only.
- Style: distinguished from comments — left accent bar, date prominently shown, no nesting.

**Anti-spam:** cap at 1 update per hour per project per author (server-side rate check).

---

### 6. Comment reactions ⬜

**Scope:** small emoji reactions (`👍 ❤️ 💡 🚀`) on every comment. One reaction per emoji per user per comment.

**Files**
- `convex/schema.ts` — new table `commentReaction`:
  ```
  parent: union(id("ideaComment"), id("projectComment"))
  clerkUserId, userName, userUsername?
  emoji: string (validated against a whitelist)
  by_parent_user_emoji: index for uniqueness check
  by_parent: index for aggregation
  ```
- `convex/projectIdeas.ts` + `convex/projects.ts`: `toggleReaction({ commentId, emoji })` mutation each (or shared in new `convex/reactions.ts`)
- Update `getIdea` / `listIdeaComments` / `listProjectComments` to return aggregated reactions: `{ "👍": { count: 5, mine: true }, ... }` per comment
- `CommentThread.tsx` — reaction picker (small smile icon → emoji palette) + horizontal pill row showing counts. Click a pill to toggle your reaction.

---

### 7. Custom OG images per project / idea ⬜

**Scope:** dynamic OG images for `/projects/[slug]` and `/ideas/[id]` so X/WhatsApp/Slack link previews look like proper cards.

**Files**
- `src/pages/api/og/project.png.ts` — Astro endpoint using `workers-og` (already in deps from the existing `/api/og.png` route). Renders title + status pill + tech-stack chips + vote/interest count + originator.
- `src/pages/api/og/idea.png.ts` — title + score + author + comment count.
- `[slug].astro` + `[id].astro` — pass through to `<BaseLayout ogImage={...}>` so `<meta property="og:image">` resolves to the dynamic endpoint.
- Reuse design language from the existing `/api/og.png` (founder card).

**Caching:** Cloudflare edge cache headers — `cache-control: public, s-maxage=3600` is fine; project metadata doesn't change often, and re-render on slug change is automatic.

---

### 8. Project screenshots gallery ⬜

**Scope:** 1–6 image uploads per project. Visible on detail page. Editable by team lead / admin.

**Files**
- `convex/schema.ts` — new table `projectScreenshot` (or a `screenshots: v.array(...)` field if we want it inline; separate table is cleaner for ordering + delete):
  ```
  projectId
  storageId: id("_storage")  // Convex File Storage
  alt?: string
  order: number
  by_project: index
  ```
- Storage: use Convex File Storage (already configured); no extra setup. Returned URLs come from `ctx.storage.getUrl(storageId)`.
- Mutations: `addScreenshot({ projectId, storageId, alt? })` + `removeScreenshot({ id })` + `reorderScreenshots({ projectId, ids })` — team-lead-or-admin only.
- Upload helper: `getUploadUrl` action (Convex pattern).
- Frontend: new `ProjectScreenshotsCard.tsx` in the sidebar (or below the description in main column when screenshots > 0). Lightbox on click.
- Validation: max 6 images, max 5MB each, JPEG/PNG/WebP only.

---

## Quick-clear checklist

When clearing context and resuming, the agent should:

1. Read this file top-to-bottom.
2. Find the lowest-numbered ⬜ feature and start there.
3. Update its status to 🟦 while working, ✅ when shipped + committed.
4. Append a `### Notes / decisions` subsection under each feature as decisions are made (e.g. "skipped `infra` category — confused users").
5. Commit messages: `feat(<area>): <feature name>` matching the project's existing convention.

## Deferred / explicitly out of scope

These came up earlier — keep them out unless requirements change:
- Watch/subscribe button on projects (duplicates "I wanna build this")
- Full-text search (premature at our scale)
- Linked tasks / Kanban (use GitHub/Linear, don't compete)
- Edit history on comments
- Comment-level threading deeper than 5 visual levels (already capped)
- Project activity feed (notifications subsume it)
- Founder onboarding wizard (separate concern, deferred indefinitely)
