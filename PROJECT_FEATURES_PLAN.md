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

### 2. User profile pages (`/u/[username]`) ✅

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

### Notes / decisions
- Added `preferredUsername` + `displayName` to `userProfile` plus a `by_username` index. New `captureIdentity` helper (in `convex/userProfile.ts`) is invoked from every authenticated write path (`submitIdea`, `voteOnIdea`, `commentOnIdea`, `commentOnProject`, `toggleInterest`) — lazily seeds the lookup table without a separate backfill script.
- `getProfileByUsername` falls back to scanning `ideaComment` / `projectComment` for `authorUsername` when no `userProfile` row exists yet. Acceptable at our scale and self-heals once the user takes another action.
- `BackdropBody` does *not* render `<a>` for mentions — the textarea sits on top and swallows clicks anyway. Both render functions now share `tokenizeBody` so styling stays consistent.
- `RenderedBody` only links mentions whose `username` is known on the mention record. Old comments mentioning by first-name still get the highlight pill (back-compat) but stay non-clickable until someone re-mentions them with a username.
- "Replying to @X" breadcrumb is also a link when the parent comment has a username.
- Comment avatar + author name + `@username` row are all links.
- Stat "Comments" counts both `ideaComment` and `projectComment` authored by the user — full table scans are fine at current scale.
- Rejected ideas are hidden from non-owner profile visitors but visible on your own profile.

---

### 3. Notifications ✅

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

### Notes / decisions
- Bell lives inside the navbar React tree via a new `rightSlot` prop on the `Navbar` component. `NavbarIsland` now wraps in `<Providers>` only when signed-in — anonymous prerendered pages keep the auth-free navbar (zero Clerk script). Multiple ClerkProviders on a page coexist as long as the publishableKey matches (Clerk warns in console but functions normally).
- `enqueueNotification` is a shared helper in `convex/notifications.ts` with built-in self-mute (`actor === recipient` → no-op). All trigger sites import it.
- Bell dropdown uses `listRecentNotifications` (take(10), no pagination); the inbox page uses `listMyNotifications` (paginated, 30/page). Two queries to keep the bell payload tiny.
- `notification.payload` is intentionally `v.any()` — kind-specific schemas would explode the validator and we already have a typed format layer (`NotificationFormat.ts`) on the client that interprets it. Reasonable tradeoff: less DB-side type safety, simpler evolution.
- Digest cron at `30 3 * * *` (UTC) = 09:00 IST. Pulls all unread notifications from the last 24h; one email per opted-in recipient.
- Recipients on `project_status_changed`: build team + interested volunteers + originator. On `flipProjectStatus`, only triggers if the status actually changed (no-op patches don't notify).
- `mention_in_comment` deduplicates against `reply_to_my_comment` — if you both mention and reply to someone, they get only the mention (it's the more specific signal).
- Settings page picks up `activity_updates` automatically through the existing per-topic switch UI. New Activity icon from lucide.
- Inbox auto-marks first-page items as read after a 1.2s delay (gives the user time to see the unread dot animate in before it disappears).
- `bootstrapResendResources` re-run on both dev (`watchful-gull-526`) and prod (`savory-lobster-743`) after deploy — creates the new `Activity Updates` topic in Resend.

---

### 4. Tag categories on ideas + projects ✅

**Scope:** small fixed set of category tags applied to ideas and projects. Powers filters and "more like this".

**Files**
- `convex/resendResources.ts`-style constants file: `convex/projectCategories.ts` listing canonical categories (`web`, `mobile`, `ai`, `tooling`, `infra`, `game`, `other`)
- `convex/schema.ts` — `categories: v.optional(v.array(v.string()))` on `projectIdea` AND `project`. Indexed by first category for cheap filter.
- Mutations: `submitIdea`, `promoteIdeaToProject`, `updateProject` accept `categories?: string[]`
- `IdeaSubmitForm.tsx` — small multi-select chip picker (max 2 categories)
- Admin promote modal — same picker (pre-fills from idea's categories)
- `TechStackCard.tsx` companion: `CategoriesCard.tsx` (read-only on detail; chip pills in sidebar)
- Filters: `IdeasListPanel` and `ProjectsListPanel` gain a "Category" segmented control next to the existing status filter

### Notes / decisions
- Skipped the first-category index. At our scale a full collect → filter is fine; a partial index keyed by `categories[0]` doesn't help because each row has up to 2 categories and the second wouldn't be indexed. If filter throughput becomes a problem later, switch to a separate `projectCategoryLink` join table.
- `normalizeCategories` is the single normalizer used by both `submitIdea`, `promoteIdeaToProject`, and `updateProject`. It lowercases + dedupes + drops anything not in `CATEGORY_KEYS` + truncates at `MAX_CATEGORIES_PER_ROW`. Server-side validation only — clients send raw strings.
- `promoteIdeaToProject` inherits the originating idea's categories by default; admin can override in the promote modal.
- Project sidebar now stacks Links → Categories → Tech stack → Build team. Categories card hidden for non-managers when empty (matches the Links card behavior).
- Idea + project list cards display the `<CategoryPills>` chip strip. Used `text-[9px]` xs variant on idea list to avoid wrapping the title.
- `<CategoryPicker>` caps at 2; selecting a third is a disabled-styled no-op rather than auto-evicting an earlier choice (clearer mental model).

---

### 5. Project update log (milestones) ✅

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

### Notes / decisions
- `postProjectUpdate` notifies build team + interested volunteers + originator via the existing `project_status_changed` kind with `status: "update"` discriminator in payload. NotificationFormat + email digest both special-case this pseudo-status.
- Delete authorized for: author, project team-lead, global admin. Lead can clean up departing members' updates.
- Visual: left accent bar on each card distinguishes updates from comments. No threading; sorted newest-first.
- `listProjectUpdates` is a separate query (not bundled into `getProjectBySlug`) so the project page only loads them when this section is rendered. Real-time via Convex reactivity.
- Section is hidden when there are no updates AND the visitor can't post — keeps the project page tight on early projects.

---

### 6. Comment reactions ✅

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

### Notes / decisions
- Schema uses flat fields (`parentKind` + `parentId: v.string()`) instead of a `v.union` discriminated parent. Flat fields play nicer with compound indexes; we lose a small amount of referential typing but the `toggleReaction` mutation re-validates the parent exists on every write.
- Aggregation lives in a shared `aggregateReactionsForComments` helper in `convex/reactions.ts`. Called from both `listIdeaComments` and `listProjectComments`. Currently does a full table `collect()` — fine at our scale; an indexed per-comment loop would be O(N) round-trips so this is actually preferable for now.
- Emoji order matches the picker order, so the pill row stays visually stable as users add reactions.
- "React" button replaces the smile icon plus action label, sits left of "Reply". Anonymous users get bumped to /sign-in on click.
- A user can react with multiple different emojis on the same comment; click your own emoji again to remove.

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
