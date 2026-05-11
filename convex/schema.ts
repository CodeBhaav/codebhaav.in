import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	waitlist: defineTable({
		name: v.string(),
		email: v.string(),
		role: v.string(),
		otherRole: v.optional(v.string()),
		whatsapp: v.optional(v.string()),
		instagram: v.optional(v.string()),
		reason: v.string(),
		interests: v.array(v.string()),
		otherInterest: v.optional(v.string()),
		referralCode: v.string(),
		referredBy: v.optional(v.string()),
		referralCount: v.number(),
		originalCreatedAt: v.optional(v.number()),
		imageUrl: v.optional(v.string()),
		newsletter: v.optional(v.boolean()),
	})
		.index("by_email", ["email"])
		.index("by_referralCode", ["referralCode"])
		.index("by_referralCount", ["referralCount"]),

	foundingMember: defineTable({
		name: v.string(),
		email: v.string(),
		// Legacy profile fields — kept optional for back-compat with rows
		// inserted before the userProfile table existed. New submissions do
		// not populate these; profile data lives in `userProfile` instead.
		whatsapp: v.optional(v.string()),
		github: v.optional(v.string()),
		linkedin: v.optional(v.string()),
		portfolio: v.optional(v.string()),
		skills: v.optional(v.string()),
		experience: v.optional(v.string()),
		// Application-specific fields stay on the row.
		motivation: v.string(),
		commitment: v.string(),
		ideas: v.optional(v.string()),
		clerkUserId: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("submitted"),
				v.literal("in_review"),
				v.literal("accepted"),
				v.literal("rejected"),
			),
		),
		newsletter: v.optional(v.boolean()),
	})
		.index("by_email", ["email"])
		.index("by_clerkUserId", ["clerkUserId"]),

	userProfile: defineTable({
		clerkUserId: v.string(),
		whatsapp: v.optional(v.string()),
		github: v.optional(v.string()),
		linkedin: v.optional(v.string()),
		portfolio: v.optional(v.string()),
		skills: v.optional(v.string()),
		experience: v.optional(v.string()),
		// Legacy single boolean  superseded by `topics` once the user
		// goes through the multi-toggle settings page. Kept for backfill.
		newsletter: v.optional(v.boolean()),
		// Per-topic subscription state, keyed by TopicSlug
		// (community_updates | product_announcements | event_invitations | founders_only).
		topics: v.optional(
			v.object({
				community_updates: v.optional(v.boolean()),
				product_announcements: v.optional(v.boolean()),
				event_invitations: v.optional(v.boolean()),
				founders_only: v.optional(v.boolean()),
			}),
		),
		// Cached Resend contact id so we don't have to look it up by email
		// for every sync. Populated on first successful upsert.
		resendContactId: v.optional(v.string()),
		updatedAt: v.number(),
	}).index("by_clerkUserId", ["clerkUserId"]),

	/**
	 * Cache of Resend resource IDs created by the bootstrap action.
	 * One row per (kind, slug). The action is idempotent: it lists what
	 * exists in Resend, creates missing ones, and upserts the IDs here.
	 */
	resendConfig: defineTable({
		kind: v.union(
			v.literal("topic"),
			v.literal("segment"),
			v.literal("property"),
		),
		slug: v.string(),
		resendId: v.string(),
		updatedAt: v.number(),
	}).index("by_kind_slug", ["kind", "slug"]),

	/* ─── Project ideas (Reddit-style submission, community-voted) ──── */

	projectIdea: defineTable({
		title: v.string(),
		description: v.string(),
		submitterClerkUserId: v.string(),
		submitterEmail: v.string(),
		submitterName: v.string(),
		upvoteCount: v.number(),
		// Optional for back-compat with pre-downvote rows. Treat missing as 0.
		downvoteCount: v.optional(v.number()),
		commentCount: v.number(),
		status: v.union(
			v.literal("open"),
			v.literal("promoted"),
			v.literal("rejected"),
		),
		rejectedReason: v.optional(v.string()),
		promotedToProjectId: v.optional(v.id("project")),
	})
		.index("by_status", ["status"])
		.index("by_submitter", ["submitterClerkUserId"])
		.index("by_upvoteCount", ["upvoteCount"]),

	projectIdeaVote: defineTable({
		ideaId: v.id("projectIdea"),
		clerkUserId: v.string(),
		// Optional for back-compat with pre-downvote rows  treat missing as "up".
		direction: v.optional(v.union(v.literal("up"), v.literal("down"))),
	})
		.index("by_idea_user", ["ideaId", "clerkUserId"])
		.index("by_user", ["clerkUserId"]),

	ideaComment: defineTable({
		ideaId: v.id("projectIdea"),
		clerkUserId: v.string(),
		authorName: v.string(),
		// Clerk username (preferred_username JWT claim). Optional because
		// not every user sets one  fall back to first-name handle.
		authorUsername: v.optional(v.string()),
		body: v.string(),
		// Threading  null/absent for top-level comments. Reply comments
		// point at their parent. Tree depth handled in the frontend.
		parentId: v.optional(v.id("ideaComment")),
		// Inline @mentions: array of snapshots. The body itself contains
		// the `@handle` substrings; this array is the metadata for
		// highlighting + future notifications.
		mentions: v.optional(
			v.array(
				v.object({
					clerkUserId: v.string(),
					name: v.string(),
					username: v.optional(v.string()),
				}),
			),
		),
	}).index("by_idea", ["ideaId"]),

	/* ─── Projects (curated, promoted from ideas by the admin) ──────── */

	project: defineTable({
		title: v.string(),
		description: v.string(),
		techStack: v.array(v.string()),
		slug: v.string(),
		status: v.union(
			v.literal("open"),
			v.literal("building"),
			v.literal("shipped"),
		),
		// Credit back to the originator  preserves the social loop.
		originatingIdeaId: v.optional(v.id("projectIdea")),
		originatorClerkUserId: v.optional(v.string()),
		originatorName: v.optional(v.string()),
		// Denormalized counters for cheap sorting on the public listing.
		interestCount: v.number(),
		commentCount: v.number(),
		buildStartedAt: v.optional(v.number()),
		shippedAt: v.optional(v.number()),
		// Per-project "manager" appointed by an admin. Can edit tech stack,
		// manage the build team, and flip status to shipped without being
		// a global admin. Promotion of ideas + assigning the team lead
		// itself stay admin-only.
		teamLeadClerkUserId: v.optional(v.string()),
	})
		.index("by_slug", ["slug"])
		.index("by_status", ["status"])
		.index("by_interestCount", ["interestCount"])
		.index("by_teamLead", ["teamLeadClerkUserId"]),

	/**
	 * "I wanna build this" signal. One row per (project, user). Cached
	 * email/name so the admin can reach volunteers off-platform when
	 * picking the build team for the month.
	 */
	projectInterest: defineTable({
		projectId: v.id("project"),
		clerkUserId: v.string(),
		userName: v.string(),
		userEmail: v.string(),
	})
		.index("by_project_user", ["projectId", "clerkUserId"])
		.index("by_project", ["projectId"])
		.index("by_user", ["clerkUserId"]),

	projectComment: defineTable({
		projectId: v.id("project"),
		clerkUserId: v.string(),
		authorName: v.string(),
		authorUsername: v.optional(v.string()),
		body: v.string(),
		parentId: v.optional(v.id("projectComment")),
		mentions: v.optional(
			v.array(
				v.object({
					clerkUserId: v.string(),
					name: v.string(),
					username: v.optional(v.string()),
				}),
			),
		),
	}).index("by_project", ["projectId"]),

	/**
	 * Build team membership  one row per (project, user) when admin
	 * commits a volunteer to the build. `role` is free text the admin
	 * fills in ("Team Manager", "Backend", "Designer", etc.).
	 */
	projectBuildTeamMember: defineTable({
		projectId: v.id("project"),
		clerkUserId: v.string(),
		userName: v.string(),
		userEmail: v.string(),
		role: v.string(),
		addedByClerkUserId: v.string(),
	})
		.index("by_project_user", ["projectId", "clerkUserId"])
		.index("by_project", ["projectId"])
		.index("by_user", ["clerkUserId"]),
});
