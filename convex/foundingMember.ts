import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
	internalMutation,
	mutation,
	query,
} from "./_generated/server";
import { upsertProfileInternal } from "./userProfile";

const statusValidator = v.union(
	v.literal("submitted"),
	v.literal("in_review"),
	v.literal("accepted"),
	v.literal("rejected"),
);

async function requireUser(
	ctx: QueryCtx | MutationCtx,
): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}
	return identity.subject;
}

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
		newsletter: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const clerkUserId = await requireUser(ctx);

		// Reject if this Clerk user already applied — one application per account.
		const existingByUser = await ctx.db
			.query("foundingMember")
			.withIndex("by_clerkUserId", (q) =>
				q.eq("clerkUserId", clerkUserId),
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

		await upsertProfileInternal(ctx, clerkUserId, {
			whatsapp: args.whatsapp,
			github: args.github,
			linkedin: args.linkedin,
			portfolio: args.portfolio,
			skills: args.skills,
			experience: args.experience,
			newsletter: args.newsletter,
		});

		const id = await ctx.db.insert("foundingMember", {
			clerkUserId,
			name: args.name,
			email: args.email,
			motivation: args.motivation,
			commitment: args.commitment,
			ideas: args.ideas,
			status: "submitted",
			newsletter: args.newsletter ?? false,
		});

		await ctx.scheduler.runAfter(0, internal.email.sendFoundingMemberEmail, {
			name: args.name,
			email: args.email,
		});

		const subscribed = args.newsletter === true;
		await ctx.scheduler.runAfter(0, internal.email.syncContact, {
			email: args.email,
			name: args.name,
			properties: { application_status: "submitted" },
			addSegments: ["founding_applicants"],
			topics:
				args.newsletter !== undefined
					? {
							community_updates: subscribed,
							product_announcements: subscribed,
						}
					: undefined,
		});

		return { id };
	},
});

export const getMyApplication = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const application = await ctx.db
			.query("foundingMember")
			.withIndex("by_clerkUserId", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.first();

		if (!application) return null;

		return {
			id: application._id,
			submittedAt: application._creationTime,
			status: application.status ?? "submitted",
			name: application.name,
			email: application.email,
			motivation: application.motivation,
			commitment: application.commitment,
			ideas: application.ideas ?? "",
			newsletter: application.newsletter ?? false,
		};
	},
});

export const updateMyApplication = mutation({
	args: {
		whatsapp: v.string(),
		github: v.optional(v.string()),
		linkedin: v.optional(v.string()),
		portfolio: v.optional(v.string()),
		skills: v.string(),
		experience: v.string(),
		motivation: v.string(),
		commitment: v.string(),
		ideas: v.optional(v.string()),
		newsletter: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const clerkUserId = await requireUser(ctx);

		const application = await ctx.db
			.query("foundingMember")
			.withIndex("by_clerkUserId", (q) =>
				q.eq("clerkUserId", clerkUserId),
			)
			.first();

		if (!application) {
			throw new Error("No application found to update");
		}

		const status = application.status ?? "submitted";
		if (status !== "submitted") {
			throw new Error(
				`Application is in '${status}' state and can no longer be edited`,
			);
		}

		await upsertProfileInternal(ctx, clerkUserId, {
			whatsapp: args.whatsapp,
			github: args.github,
			linkedin: args.linkedin,
			portfolio: args.portfolio,
			skills: args.skills,
			experience: args.experience,
			newsletter: args.newsletter,
		});

		await ctx.db.patch(application._id, {
			motivation: args.motivation,
			commitment: args.commitment,
			ideas: args.ideas,
			...(args.newsletter !== undefined ? { newsletter: args.newsletter } : {}),
		});

		if (args.newsletter !== undefined) {
			await ctx.scheduler.runAfter(0, internal.email.syncContact, {
				email: application.email,
				name: application.name,
				topics: {
					community_updates: args.newsletter,
					product_announcements: args.newsletter,
				},
			});
		}

		return { id: application._id };
	},
});

/**
 * Internal admin entry point — kept around for CLI invocations:
 * `npx convex run foundingMember:updateStatus '{...}'`. The frontend
 * uses admin:flipFoundingStatus instead, which is properly auth-gated.
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
