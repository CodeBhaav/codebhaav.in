import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { query } from "./_generated/server";

/**
 * Read the signed-in user's profile. Returns null if the user has never
 * filled out a form that creates a profile entry. Public so the frontend
 * can prefill forms without an extra round-trip.
 */
export const getMyProfile = query({
	args: { clerkUserId: v.string() },
	handler: async (ctx, args) => {
		const profile = await ctx.db
			.query("userProfile")
			.withIndex("by_clerkUserId", (q) =>
				q.eq("clerkUserId", args.clerkUserId),
			)
			.first();

		if (!profile) return null;

		return {
			clerkUserId: profile.clerkUserId,
			whatsapp: profile.whatsapp ?? "",
			github: profile.github ?? "",
			linkedin: profile.linkedin ?? "",
			portfolio: profile.portfolio ?? "",
			skills: profile.skills ?? "",
			experience: profile.experience ?? "",
			updatedAt: profile.updatedAt,
		};
	},
});

export interface UserProfileInput {
	whatsapp?: string;
	github?: string;
	linkedin?: string;
	portfolio?: string;
	skills?: string;
	experience?: string;
}

/**
 * Internal upsert helper invoked from other mutations that collect profile
 * data as a side effect (e.g. submitApplication). Not exposed as a public
 * mutation — without per-user auth verification, anyone could overwrite
 * anyone else's profile by passing their clerkUserId. Once we wire
 * ConvexProviderWithClerk we can promote this to a public mutation.
 */
export async function upsertProfileInternal(
	ctx: MutationCtx,
	clerkUserId: string,
	input: UserProfileInput,
): Promise<void> {
	const existing = await ctx.db
		.query("userProfile")
		.withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
		.first();

	const fields = {
		whatsapp: input.whatsapp,
		github: input.github,
		linkedin: input.linkedin,
		portfolio: input.portfolio,
		skills: input.skills,
		experience: input.experience,
		updatedAt: Date.now(),
	};

	if (existing) {
		await ctx.db.patch(existing._id, fields);
	} else {
		await ctx.db.insert("userProfile", {
			clerkUserId,
			...fields,
		});
	}
}
