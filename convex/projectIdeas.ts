import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { buildMemberLookup, extractMentionTokens } from "./members";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_IDEAS_PER_DAY = 5;
const MAX_TITLE_LEN = 140;
const MIN_TITLE_LEN = 8;
const MIN_DESCRIPTION_LEN = 20;
const MAX_DESCRIPTION_LEN = 4000;
const MAX_COMMENT_LEN = 2000;

interface ClerkIdentity {
	subject: string;
	email?: string;
	name?: string;
	givenName?: string;
	familyName?: string;
	preferredUsername?: string;
	metadata?: { role?: string };
}

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<ClerkIdentity> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new Error("Not authenticated");
	return identity as unknown as ClerkIdentity;
}

async function requireAdmin(
	ctx: QueryCtx | MutationCtx,
): Promise<ClerkIdentity> {
	const id = await requireUser(ctx);
	if (id.metadata?.role !== "admin") throw new Error("Not authorized");
	return id;
}

function readableName(id: ClerkIdentity): string {
	const joined = [id.givenName, id.familyName].filter(Boolean).join(" ").trim();
	return joined || id.name || id.email || "Anonymous";
}

function readableUsername(id: ClerkIdentity): string | undefined {
	const u = id.preferredUsername?.trim();
	return u && u.length > 0 ? u : undefined;
}

/* ─── Submission ─────────────────────────────────────────────────────── */

export const submitIdea = mutation({
	args: {
		title: v.string(),
		description: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await requireUser(ctx);
		const title = args.title.trim();
		const description = args.description.trim();

		if (title.length < MIN_TITLE_LEN) {
			throw new Error(`Title must be at least ${MIN_TITLE_LEN} characters`);
		}
		if (title.length > MAX_TITLE_LEN) {
			throw new Error(`Title must be under ${MAX_TITLE_LEN} characters`);
		}
		if (description.length < MIN_DESCRIPTION_LEN) {
			throw new Error(
				`Description must be at least ${MIN_DESCRIPTION_LEN} characters`,
			);
		}
		if (description.length > MAX_DESCRIPTION_LEN) {
			throw new Error(
				`Description must be under ${MAX_DESCRIPTION_LEN} characters`,
			);
		}

		const cutoff = Date.now() - DAY_MS;
		const recent = await ctx.db
			.query("projectIdea")
			.withIndex("by_submitter", (q) =>
				q.eq("submitterClerkUserId", identity.subject),
			)
			.collect();
		const recentCount = recent.filter((r) => r._creationTime >= cutoff).length;
		if (recentCount >= MAX_IDEAS_PER_DAY) {
			throw new Error(
				`Slow down  you can submit up to ${MAX_IDEAS_PER_DAY} ideas per day.`,
			);
		}

		const email = identity.email ?? "";
		const id = await ctx.db.insert("projectIdea", {
			title,
			description,
			submitterClerkUserId: identity.subject,
			submitterEmail: email,
			submitterName: readableName(identity),
			upvoteCount: 0,
			commentCount: 0,
			status: "open",
		});

		return { id };
	},
});

/* ─── Public reads ───────────────────────────────────────────────────── */

export const listIdeas = query({
	args: {
		sort: v.optional(v.union(v.literal("top"), v.literal("new"))),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const sort = args.sort ?? "top";
		const limit = Math.min(args.limit ?? 50, 100);

		const allOpen = await ctx.db
			.query("projectIdea")
			.withIndex("by_status", (q) => q.eq("status", "open"))
			.collect();

		const scoreOf = (r: { upvoteCount: number; downvoteCount?: number }) =>
			r.upvoteCount - (r.downvoteCount ?? 0);

		const sorted = [...allOpen].sort((a, b) => {
			if (sort === "top") {
				const sa = scoreOf(a);
				const sb = scoreOf(b);
				if (sb !== sa) return sb - sa;
				return b._creationTime - a._creationTime;
			}
			return b._creationTime - a._creationTime;
		});

		const rows = sorted.slice(0, limit);

		const identity = await ctx.auth.getUserIdentity();
		const myVotes = new Map<string, "up" | "down">();
		if (identity) {
			for (const idea of rows) {
				const vote = await ctx.db
					.query("projectIdeaVote")
					.withIndex("by_idea_user", (q) =>
						q.eq("ideaId", idea._id).eq("clerkUserId", identity.subject),
					)
					.first();
				if (vote) myVotes.set(idea._id, vote.direction ?? "up");
			}
		}

		return rows.map((row) => ({
			id: row._id,
			title: row.title,
			description: row.description,
			submitterName: row.submitterName,
			upvoteCount: row.upvoteCount,
			downvoteCount: row.downvoteCount ?? 0,
			commentCount: row.commentCount,
			submittedAt: row._creationTime,
			myVote: myVotes.get(row._id) ?? null,
		}));
	},
});

export const getIdea = query({
	args: { id: v.id("projectIdea") },
	handler: async (ctx, args) => {
		const idea = await ctx.db.get(args.id);
		if (!idea) return null;
		if (idea.status === "rejected") {
			// Hide rejected ideas from the public surface; admins can still
			// see them via the admin queries.
			const identity = await ctx.auth.getUserIdentity();
			const role = (identity as unknown as ClerkIdentity)?.metadata?.role;
			if (role !== "admin") return null;
		}

		const identity = await ctx.auth.getUserIdentity();
		let myVote: "up" | "down" | null = null;
		if (identity) {
			const v = await ctx.db
				.query("projectIdeaVote")
				.withIndex("by_idea_user", (q) =>
					q.eq("ideaId", idea._id).eq("clerkUserId", identity.subject),
				)
				.first();
			if (v) myVote = v.direction ?? "up";
		}

		const comments = await ctx.db
			.query("ideaComment")
			.withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
			.collect();
		comments.sort((a, b) => a._creationTime - b._creationTime);

		return {
			id: idea._id,
			title: idea.title,
			description: idea.description,
			status: idea.status,
			submitterName: idea.submitterName,
			submitterClerkUserId: idea.submitterClerkUserId,
			upvoteCount: idea.upvoteCount,
			downvoteCount: idea.downvoteCount ?? 0,
			commentCount: idea.commentCount,
			submittedAt: idea._creationTime,
			myVote,
			promotedToProjectId: idea.promotedToProjectId ?? null,
			rejectedReason: idea.rejectedReason ?? null,
			comments: comments.map((c) => ({
				id: c._id,
				authorName: c.authorName,
				authorUsername: c.authorUsername ?? null,
				clerkUserId: c.clerkUserId,
				body: c.body,
				createdAt: c._creationTime,
				mine: identity?.subject === c.clerkUserId,
				parentId: c.parentId ?? null,
				mentions: c.mentions ?? [],
			})),
		};
	},
});

export const listMyIdeas = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const ideas = await ctx.db
			.query("projectIdea")
			.withIndex("by_submitter", (q) =>
				q.eq("submitterClerkUserId", identity.subject),
			)
			.collect();
		ideas.sort((a, b) => b._creationTime - a._creationTime);

		return ideas.map((i) => ({
			id: i._id,
			title: i.title,
			status: i.status,
			upvoteCount: i.upvoteCount,
			downvoteCount: i.downvoteCount ?? 0,
			commentCount: i.commentCount,
			submittedAt: i._creationTime,
			promotedToProjectId: i.promotedToProjectId ?? null,
			rejectedReason: i.rejectedReason ?? null,
		}));
	},
});

/* ─── Voting ─────────────────────────────────────────────────────────── */

/**
 * Vote on an idea. Click your current direction again to clear; click the
 * opposite to flip. Counters are denormalized for cheap sort/listing.
 *
 * Behavior:
 *   no existing vote     -> insert vote(direction), +1 to that counter
 *   same direction click -> delete vote, -1 from that counter
 *   opposite click       -> patch direction, -1 from old / +1 to new
 */
export const voteOnIdea = mutation({
	args: {
		ideaId: v.id("projectIdea"),
		direction: v.union(v.literal("up"), v.literal("down")),
	},
	handler: async (ctx, args) => {
		const identity = await requireUser(ctx);
		const idea = await ctx.db.get(args.ideaId);
		if (!idea) throw new Error("Idea not found");
		if (idea.status !== "open") {
			throw new Error("This idea is no longer accepting votes");
		}

		const existing = await ctx.db
			.query("projectIdeaVote")
			.withIndex("by_idea_user", (q) =>
				q.eq("ideaId", args.ideaId).eq("clerkUserId", identity.subject),
			)
			.first();

		const upCount = idea.upvoteCount;
		const downCount = idea.downvoteCount ?? 0;
		const existingDir = existing?.direction ?? "up"; // legacy rows = up

		if (existing && existingDir === args.direction) {
			// Toggle off
			await ctx.db.delete(existing._id);
			const next = {
				upvoteCount: args.direction === "up" ? Math.max(0, upCount - 1) : upCount,
				downvoteCount:
					args.direction === "down" ? Math.max(0, downCount - 1) : downCount,
			};
			await ctx.db.patch(args.ideaId, next);
			return { myVote: null as null, ...next };
		}

		if (existing && existingDir !== args.direction) {
			// Flip
			await ctx.db.patch(existing._id, { direction: args.direction });
			const next =
				args.direction === "up"
					? {
							upvoteCount: upCount + 1,
							downvoteCount: Math.max(0, downCount - 1),
						}
					: {
							upvoteCount: Math.max(0, upCount - 1),
							downvoteCount: downCount + 1,
						};
			await ctx.db.patch(args.ideaId, next);
			return { myVote: args.direction, ...next };
		}

		// Fresh vote
		await ctx.db.insert("projectIdeaVote", {
			ideaId: args.ideaId,
			clerkUserId: identity.subject,
			direction: args.direction,
		});
		const next =
			args.direction === "up"
				? { upvoteCount: upCount + 1, downvoteCount: downCount }
				: { upvoteCount: upCount, downvoteCount: downCount + 1 };
		await ctx.db.patch(args.ideaId, next);
		return { myVote: args.direction, ...next };
	},
});

/* ─── Comments ───────────────────────────────────────────────────────── */

export const commentOnIdea = mutation({
	args: {
		ideaId: v.id("projectIdea"),
		body: v.string(),
		parentId: v.optional(v.id("ideaComment")),
		mentions: v.optional(
			v.array(
				v.object({ clerkUserId: v.string(), name: v.string() }),
			),
		),
	},
	handler: async (ctx, args) => {
		const identity = await requireUser(ctx);
		const idea = await ctx.db.get(args.ideaId);
		if (!idea) throw new Error("Idea not found");
		if (idea.status === "rejected") {
			throw new Error("Cannot comment on a rejected idea");
		}

		const body = args.body.trim();
		if (!body) throw new Error("Comment cannot be empty");
		if (body.length > MAX_COMMENT_LEN) {
			throw new Error(`Comment must be under ${MAX_COMMENT_LEN} characters`);
		}

		// Validate parent belongs to the same idea  prevents cross-thread injection.
		if (args.parentId) {
			const parent = await ctx.db.get(args.parentId);
			if (!parent || parent.ideaId !== args.ideaId) {
				throw new Error("Invalid parent comment");
			}
		}

		// Start with explicit mentions selected via the typeahead.
		const merged = new Map<
			string,
			{ clerkUserId: string; name: string; username?: string }
		>();
		for (const m of args.mentions ?? []) {
			merged.set(m.clerkUserId, m);
		}

		// Auto-resolve any `@<token>` substrings in the body that weren't
		// picked from the dropdown. Match by lowercased username first,
		// then first-name. Self excluded.
		const tokens = extractMentionTokens(body);
		if (tokens.length > 0) {
			const lookup = await buildMemberLookup(ctx, identity.subject);
			for (const token of tokens) {
				const hit = lookup.get(token.toLowerCase());
				if (hit && !merged.has(hit.clerkUserId)) {
					merged.set(hit.clerkUserId, hit);
				}
			}
		}
		const finalMentions = Array.from(merged.values()).slice(0, 20);

		const authorUsername = readableUsername(identity);
		const id = await ctx.db.insert("ideaComment", {
			ideaId: args.ideaId,
			clerkUserId: identity.subject,
			authorName: readableName(identity),
			...(authorUsername ? { authorUsername } : {}),
			body,
			...(args.parentId ? { parentId: args.parentId } : {}),
			...(finalMentions.length > 0 ? { mentions: finalMentions } : {}),
		});

		await ctx.db.patch(args.ideaId, {
			commentCount: idea.commentCount + 1,
		});

		return { id };
	},
});

export const deleteMyComment = mutation({
	args: { commentId: v.id("ideaComment") },
	handler: async (ctx, args) => {
		const identity = await requireUser(ctx);
		const comment = await ctx.db.get(args.commentId);
		if (!comment) throw new Error("Comment not found");
		const isOwner = comment.clerkUserId === identity.subject;
		const isAdmin =
			(identity as unknown as ClerkIdentity).metadata?.role === "admin";
		if (!isOwner && !isAdmin) throw new Error("Not authorized");

		const idea = await ctx.db.get(comment.ideaId);
		await ctx.db.delete(args.commentId);
		if (idea) {
			await ctx.db.patch(comment.ideaId, {
				commentCount: Math.max(0, idea.commentCount - 1),
			});
		}
		return { ok: true };
	},
});

/* ─── Admin ──────────────────────────────────────────────────────────── */

export const listIdeasForAdmin = query({
	args: {
		status: v.optional(
			v.union(
				v.literal("all"),
				v.literal("open"),
				v.literal("promoted"),
				v.literal("rejected"),
			),
		),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const status = args.status ?? "all";
		let rows: Doc<"projectIdea">[];
		if (status === "all") {
			rows = await ctx.db.query("projectIdea").collect();
		} else {
			rows = await ctx.db
				.query("projectIdea")
				.withIndex("by_status", (q) => q.eq("status", status))
				.collect();
		}
		const scoreOf = (r: { upvoteCount: number; downvoteCount?: number }) =>
			r.upvoteCount - (r.downvoteCount ?? 0);
		rows.sort((a, b) => {
			const sa = scoreOf(a);
			const sb = scoreOf(b);
			if (sb !== sa) return sb - sa;
			return b._creationTime - a._creationTime;
		});
		return rows.map((r) => ({
			id: r._id,
			title: r.title,
			description: r.description,
			status: r.status,
			submitterName: r.submitterName,
			submitterEmail: r.submitterEmail,
			upvoteCount: r.upvoteCount,
			downvoteCount: r.downvoteCount ?? 0,
			commentCount: r.commentCount,
			submittedAt: r._creationTime,
			rejectedReason: r.rejectedReason ?? null,
			promotedToProjectId: r.promotedToProjectId ?? null,
		}));
	},
});

export const rejectIdea = mutation({
	args: {
		ideaId: v.id("projectIdea"),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const idea = await ctx.db.get(args.ideaId);
		if (!idea) throw new Error("Idea not found");
		await ctx.db.patch(args.ideaId, {
			status: "rejected",
			rejectedReason: args.reason?.trim() || undefined,
		});
		return { ok: true };
	},
});

export const reopenIdea = mutation({
	args: { ideaId: v.id("projectIdea") },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const idea = await ctx.db.get(args.ideaId);
		if (!idea) throw new Error("Idea not found");
		if (idea.status === "promoted") {
			throw new Error(
				"This idea already became a project. Delete the project first if you really want to reopen.",
			);
		}
		await ctx.db.patch(args.ideaId, {
			status: "open",
			rejectedReason: undefined,
		});
		return { ok: true };
	},
});

/**
 * Promote an idea to a project. Admin can edit the title/description and
 * supply a tech stack. Marks the idea as `promoted` and back-references
 * the new project. Slug is generated server-side with a numeric
 * disambiguator on collision so URLs stay stable and human-readable.
 */
export const promoteIdeaToProject = mutation({
	args: {
		ideaId: v.id("projectIdea"),
		title: v.string(),
		description: v.string(),
		techStack: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const idea = await ctx.db.get(args.ideaId);
		if (!idea) throw new Error("Idea not found");
		if (idea.status !== "open") {
			throw new Error(`Cannot promote an idea in state '${idea.status}'`);
		}

		const title = args.title.trim();
		const description = args.description.trim();
		if (title.length < MIN_TITLE_LEN || title.length > MAX_TITLE_LEN) {
			throw new Error("Project title length is out of range");
		}
		if (
			description.length < MIN_DESCRIPTION_LEN ||
			description.length > MAX_DESCRIPTION_LEN
		) {
			throw new Error("Project description length is out of range");
		}
		const techStack = args.techStack
			.map((t) => t.trim())
			.filter(Boolean)
			.slice(0, 12);

		const baseSlug = slugify(title);
		const slug = await ensureUniqueSlug(ctx, baseSlug);

		const projectId: Id<"project"> = await ctx.db.insert("project", {
			title,
			description,
			techStack,
			slug,
			status: "open",
			originatingIdeaId: args.ideaId,
			originatorClerkUserId: idea.submitterClerkUserId,
			originatorName: idea.submitterName,
			interestCount: 0,
			commentCount: 0,
		});

		await ctx.db.patch(args.ideaId, {
			status: "promoted",
			promotedToProjectId: projectId,
		});

		return { projectId, slug };
	},
});

function slugify(input: string): string {
	const base = input
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
	return base.slice(0, 60) || "project";
}

async function ensureUniqueSlug(
	ctx: MutationCtx,
	baseSlug: string,
): Promise<string> {
	let candidate = baseSlug;
	let suffix = 1;
	while (true) {
		const existing = await ctx.db
			.query("project")
			.withIndex("by_slug", (q) => q.eq("slug", candidate))
			.first();
		if (!existing) return candidate;
		suffix += 1;
		candidate = `${baseSlug}-${suffix}`;
		if (suffix > 999) throw new Error("Could not produce a unique slug");
	}
}
