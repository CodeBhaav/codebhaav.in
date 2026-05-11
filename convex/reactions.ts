import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { captureIdentity } from "./userProfile";

export const ALLOWED_REACTION_EMOJIS = ["👍", "❤️", "💡", "🚀"] as const;
const EMOJI_SET: ReadonlySet<string> = new Set(ALLOWED_REACTION_EMOJIS);

const parentKindValidator = v.union(
	v.literal("ideaComment"),
	v.literal("projectComment"),
);

interface ClerkIdentity {
	subject: string;
	email?: string;
	name?: string;
	givenName?: string;
	familyName?: string;
	preferredUsername?: string;
}

function readableName(id: ClerkIdentity): string {
	const joined = [id.givenName, id.familyName].filter(Boolean).join(" ").trim();
	return joined || id.name || id.email || "Anonymous";
}

function readableUsername(id: ClerkIdentity): string | undefined {
	const u = id.preferredUsername?.trim();
	return u && u.length > 0 ? u : undefined;
}

/**
 * Toggle a reaction on a comment. One row per (parent, user, emoji).
 * Click again on the same emoji = remove. Different emoji = additional
 * reaction (a user can react with multiple emojis on the same comment).
 */
export const toggleReaction = mutation({
	args: {
		parentKind: parentKindValidator,
		parentId: v.string(),
		emoji: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		await captureIdentity(ctx, identity as unknown as ClerkIdentity);

		if (!EMOJI_SET.has(args.emoji)) {
			throw new Error("Unsupported emoji");
		}

		// Verify the comment exists  prevents reaction rows pointing at
		// nothing. Cast through the right table.
		if (args.parentKind === "ideaComment") {
			const c = await ctx.db.get(args.parentId as Id<"ideaComment">);
			if (!c) throw new Error("Comment not found");
		} else {
			const c = await ctx.db.get(args.parentId as Id<"projectComment">);
			if (!c) throw new Error("Comment not found");
		}

		const existing = await ctx.db
			.query("commentReaction")
			.withIndex("by_parent_user_emoji", (q) =>
				q
					.eq("parentKind", args.parentKind)
					.eq("parentId", args.parentId)
					.eq("clerkUserId", identity.subject)
					.eq("emoji", args.emoji),
			)
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
			return { reacted: false };
		}

		const id = identity as unknown as ClerkIdentity;
		const userUsername = readableUsername(id);
		await ctx.db.insert("commentReaction", {
			parentKind: args.parentKind,
			parentId: args.parentId,
			clerkUserId: identity.subject,
			userName: readableName(id),
			...(userUsername ? { userUsername } : {}),
			emoji: args.emoji,
		});
		return { reacted: true };
	},
});

export interface ReactionAggregate {
	emoji: string;
	count: number;
	mine: boolean;
}

/**
 * Helper used by comment-listing queries to attach per-comment reaction
 * aggregates. Returns a map: commentId  reaction summary array.
 */
export async function aggregateReactionsForComments(
	ctx: QueryCtx | MutationCtx,
	parentKind: "ideaComment" | "projectComment",
	commentIds: Iterable<string>,
): Promise<Map<string, ReactionAggregate[]>> {
	const idSet = new Set<string>();
	for (const id of commentIds) idSet.add(id);
	if (idSet.size === 0) return new Map();

	// One query per comment via the compound index would be O(N); a single
	// table scan filtered down is the same complexity but issues fewer
	// round-trips. Acceptable at our scale.
	const all: Doc<"commentReaction">[] = await ctx.db
		.query("commentReaction")
		.collect();

	const identity = await ctx.auth.getUserIdentity();
	const me = identity?.subject ?? "";

	// Stable emoji order matches the picker so the pill row is consistent.
	const orderIndex = new Map(
		ALLOWED_REACTION_EMOJIS.map((e, i) => [e as string, i]),
	);

	const grouped = new Map<string, Map<string, { count: number; mine: boolean }>>();
	for (const r of all) {
		if (r.parentKind !== parentKind) continue;
		if (!idSet.has(r.parentId)) continue;
		let inner = grouped.get(r.parentId);
		if (!inner) {
			inner = new Map();
			grouped.set(r.parentId, inner);
		}
		const cur = inner.get(r.emoji) ?? { count: 0, mine: false };
		cur.count += 1;
		if (r.clerkUserId === me) cur.mine = true;
		inner.set(r.emoji, cur);
	}

	const out = new Map<string, ReactionAggregate[]>();
	for (const [parentId, inner] of grouped) {
		const rows: ReactionAggregate[] = Array.from(inner.entries())
			.map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }))
			.sort((a, b) => {
				const ai = orderIndex.get(a.emoji) ?? 99;
				const bi = orderIndex.get(b.emoji) ?? 99;
				return ai - bi;
			});
		out.set(parentId, rows);
	}
	return out;
}
