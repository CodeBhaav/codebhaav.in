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
		updatedAt: v.number(),
	}).index("by_clerkUserId", ["clerkUserId"]),
});
