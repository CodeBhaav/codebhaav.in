import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalQuery, mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

export type NotificationKind =
	| "mention_in_comment"
	| "reply_to_my_comment"
	| "idea_status_changed"
	| "project_status_changed"
	| "added_to_build_team"
	| "team_lead_assigned";

const kindValidator = v.union(
	v.literal("mention_in_comment"),
	v.literal("reply_to_my_comment"),
	v.literal("idea_status_changed"),
	v.literal("project_status_changed"),
	v.literal("added_to_build_team"),
	v.literal("team_lead_assigned"),
);

/**
 * Internal helper used by mutations across the codebase to enqueue a
 * notification inline. Cheap insert, self-mute (we never notify the actor
 * about their own action), and idempotent against duplicate mentions in
 * the same comment (caller is expected to dedupe).
 */
export async function enqueueNotification(
	ctx: MutationCtx,
	args: {
		recipientClerkUserId: string;
		actorClerkUserId?: string;
		kind: NotificationKind;
		payload: Record<string, unknown>;
	},
): Promise<Id<"notification"> | null> {
	if (!args.recipientClerkUserId) return null;
	if (
		args.actorClerkUserId &&
		args.actorClerkUserId === args.recipientClerkUserId
	) {
		// Don't notify yourself.
		return null;
	}
	return await ctx.db.insert("notification", {
		recipientClerkUserId: args.recipientClerkUserId,
		kind: args.kind,
		payload: args.payload,
		read: false,
	});
}

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<{
	subject: string;
}> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new Error("Not authenticated");
	return identity;
}

function publicRow(n: Doc<"notification">) {
	return {
		id: n._id,
		kind: n.kind,
		payload: n.payload as Record<string, unknown>,
		read: n.read,
		readAt: n.readAt ?? null,
		createdAt: n._creationTime,
	};
}

export const listMyNotifications = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return { page: [], isDone: true, continueCursor: "" as string };
		}
		const result = await ctx.db
			.query("notification")
			.withIndex("by_recipient", (q) =>
				q.eq("recipientClerkUserId", identity.subject),
			)
			.order("desc")
			.paginate(args.paginationOpts);

		return { ...result, page: result.page.map(publicRow) };
	},
});

export const listRecentNotifications = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];
		const limit = Math.min(args.limit ?? 10, 25);
		const rows = await ctx.db
			.query("notification")
			.withIndex("by_recipient", (q) =>
				q.eq("recipientClerkUserId", identity.subject),
			)
			.order("desc")
			.take(limit);
		return rows.map(publicRow);
	},
});

export const getMyUnreadCount = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return 0;
		const rows = await ctx.db
			.query("notification")
			.withIndex("by_recipient_unread", (q) =>
				q.eq("recipientClerkUserId", identity.subject).eq("read", false),
			)
			.collect();
		return rows.length;
	},
});

export const markRead = mutation({
	args: { ids: v.array(v.id("notification")) },
	handler: async (ctx, args) => {
		const identity = await requireUser(ctx);
		const now = Date.now();
		let updated = 0;
		for (const id of args.ids) {
			const row = await ctx.db.get(id);
			if (!row) continue;
			if (row.recipientClerkUserId !== identity.subject) continue;
			if (row.read) continue;
			await ctx.db.patch(id, { read: true, readAt: now });
			updated += 1;
		}
		return { updated };
	},
});

export const markAllRead = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await requireUser(ctx);
		const rows = await ctx.db
			.query("notification")
			.withIndex("by_recipient_unread", (q) =>
				q.eq("recipientClerkUserId", identity.subject).eq("read", false),
			)
			.collect();
		const now = Date.now();
		for (const r of rows) {
			await ctx.db.patch(r._id, { read: true, readAt: now });
		}
		return { updated: rows.length };
	},
});

export { kindValidator };

/**
 * Returns one row per recipient who has unread notifications generated
 * within the lookback window. Used by the daily digest cron  the action
 * then filters by `activity_updates` topic opt-in and sends one email
 * per recipient.
 */
export const collectUnreadForDigest = internalQuery({
	args: { sinceMs: v.number() },
	handler: async (ctx, args) => {
		const allUnread = await ctx.db.query("notification").collect();
		const fresh = allUnread.filter(
			(n) => !n.read && n._creationTime >= args.sinceMs,
		);

		const byRecipient = new Map<string, Doc<"notification">[]>();
		for (const n of fresh) {
			const list = byRecipient.get(n.recipientClerkUserId) ?? [];
			list.push(n);
			byRecipient.set(n.recipientClerkUserId, list);
		}

		const out: Array<{
			recipientClerkUserId: string;
			email: string;
			name: string;
			activitySubscribed: boolean;
			notifications: Array<{
				kind: NotificationKind;
				payload: Record<string, unknown>;
				createdAt: number;
			}>;
		}> = [];

		for (const [clerkUserId, notifications] of byRecipient) {
			notifications.sort((a, b) => b._creationTime - a._creationTime);

			const profile = await ctx.db
				.query("userProfile")
				.withIndex("by_clerkUserId", (q) =>
					q.eq("clerkUserId", clerkUserId),
				)
				.first();
			// Resolve email: try foundingMember by clerkUserId, then any
			// related record (project interest, build team, comments).
			let email: string | undefined;
			let name: string | undefined = profile?.displayName;

			const founding = await ctx.db
				.query("foundingMember")
				.withIndex("by_clerkUserId", (q) =>
					q.eq("clerkUserId", clerkUserId),
				)
				.first();
			if (founding) {
				email = founding.email;
				name = name ?? founding.name;
			}
			if (!email) {
				const interest = await ctx.db
					.query("projectInterest")
					.withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
					.first();
				if (interest) {
					email = interest.userEmail;
					name = name ?? interest.userName;
				}
			}
			if (!email) {
				const teamRow = await ctx.db
					.query("projectBuildTeamMember")
					.withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
					.first();
				if (teamRow) {
					email = teamRow.userEmail;
					name = name ?? teamRow.userName;
				}
			}
			if (!email) continue;

			// Default: opt-in (matches resendResources default). Honor an
			// explicit opt-out from profile.topics.activity_updates.
			const subscribed =
				profile?.topics?.activity_updates === undefined
					? true
					: profile.topics.activity_updates;

			out.push({
				recipientClerkUserId: clerkUserId,
				email,
				name: name ?? "Builder",
				activitySubscribed: subscribed,
				notifications: notifications.map((n) => ({
					kind: n.kind as NotificationKind,
					payload: n.payload as Record<string, unknown>,
					createdAt: n._creationTime,
				})),
			});
		}

		return out;
	},
});
