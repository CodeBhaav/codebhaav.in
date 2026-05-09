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
});
