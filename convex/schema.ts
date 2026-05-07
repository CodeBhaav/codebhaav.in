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
		whatsapp: v.string(),
		github: v.optional(v.string()),
		linkedin: v.optional(v.string()),
		portfolio: v.optional(v.string()),
		skills: v.string(),
		experience: v.string(),
		motivation: v.string(),
		commitment: v.string(),
		ideas: v.optional(v.string()),
	}).index("by_email", ["email"]),
});
