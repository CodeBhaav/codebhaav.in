import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
	internalMutation,
	mutation,
	query,
} from "./_generated/server";

const statusValidator = v.union(
	v.literal("submitted"),
	v.literal("in_review"),
	v.literal("accepted"),
	v.literal("rejected"),
);

export const submitApplication = mutation({
	args: {
		clerkUserId: v.string(),
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
		// Reject if this Clerk user already applied — one application per account.
		const existingByUser = await ctx.db
			.query("foundingMember")
			.withIndex("by_clerkUserId", (q) =>
				q.eq("clerkUserId", args.clerkUserId),
			)
			.first();

		if (existingByUser) {
			throw new Error("You've already submitted a founding-member application");
		}

		// Also reject if email already used (covers pre-auth applications).
		const existingByEmail = await ctx.db
			.query("foundingMember")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (existingByEmail) {
			throw new Error("Application already submitted with this email");
		}

		const id = await ctx.db.insert("foundingMember", {
			clerkUserId: args.clerkUserId,
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
			status: "submitted",
		});

		await ctx.scheduler.runAfter(0, internal.email.sendFoundingMemberEmail, {
			name: args.name,
			email: args.email,
		});

		return { id };
	},
});

export const getMyApplication = query({
	args: { clerkUserId: v.string() },
	handler: async (ctx, args) => {
		const application = await ctx.db
			.query("foundingMember")
			.withIndex("by_clerkUserId", (q) =>
				q.eq("clerkUserId", args.clerkUserId),
			)
			.first();

		if (!application) return null;

		return {
			id: application._id,
			submittedAt: application._creationTime,
			status: application.status ?? "submitted",
			name: application.name,
			email: application.email,
		};
	},
});

/**
 * Admin-only — invoke via `npx convex run foundingMember:updateStatus`.
 * Accepts an application id and a new status; sends a branded email for
 * `accepted` and `rejected` transitions. `in_review` updates silently
 * because it's a system-internal step the applicant doesn't need to be
 * notified about.
 */
export const updateStatus = internalMutation({
	args: {
		id: v.id("foundingMember"),
		status: statusValidator,
	},
	handler: async (ctx, args) => {
		const application = await ctx.db.get(args.id);
		if (!application) {
			throw new Error(`No founding-member application with id ${args.id}`);
		}

		await ctx.db.patch(args.id, { status: args.status });

		if (args.status === "accepted") {
			await ctx.scheduler.runAfter(
				0,
				internal.email.sendApplicationAcceptedEmail,
				{ name: application.name, email: application.email },
			);
		} else if (args.status === "rejected") {
			await ctx.scheduler.runAfter(
				0,
				internal.email.sendApplicationRejectedEmail,
				{ name: application.name, email: application.email },
			);
		}

		return { id: args.id, status: args.status };
	},
});
