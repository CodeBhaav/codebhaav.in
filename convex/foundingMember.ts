import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const submitApplication = mutation({
	args: {
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
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("foundingMember")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (existing) {
			throw new Error("Application already submitted with this email");
		}

		const id = await ctx.db.insert("foundingMember", {
			name: args.name,
			email: args.email,
			whatsapp: args.whatsapp,
			github: args.github,
			linkedin: args.linkedin,
			portfolio: args.portfolio,
			skills: args.skills,
			experience: args.experience,
			motivation: args.motivation,
			commitment: args.commitment,
			ideas: args.ideas,
		});

		return { id };
	},
});
