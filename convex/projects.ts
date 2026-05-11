import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { buildMemberLookup, extractMentionTokens } from "./members";

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

/* ─── Public reads ───────────────────────────────────────────────────── */

export const listProjects = query({
	args: {
		status: v.optional(
			v.union(
				v.literal("all"),
				v.literal("open"),
				v.literal("building"),
				v.literal("shipped"),
			),
		),
		sort: v.optional(
			v.union(v.literal("interest"), v.literal("new"), v.literal("status")),
		),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const status = args.status ?? "all";
		const sort = args.sort ?? "interest";
		const limit = Math.min(args.limit ?? 50, 100);

		let rows: Doc<"project">[];
		if (status === "all") {
			rows = await ctx.db.query("project").collect();
		} else {
			rows = await ctx.db
				.query("project")
				.withIndex("by_status", (q) => q.eq("status", status))
				.collect();
		}

		const statusOrder: Record<Doc<"project">["status"], number> = {
			building: 0,
			open: 1,
			shipped: 2,
		};
		rows.sort((a, b) => {
			if (sort === "status") {
				if (statusOrder[a.status] !== statusOrder[b.status]) {
					return statusOrder[a.status] - statusOrder[b.status];
				}
			}
			if (sort === "interest") {
				if (b.interestCount !== a.interestCount) {
					return b.interestCount - a.interestCount;
				}
			}
			return b._creationTime - a._creationTime;
		});

		const slice = rows.slice(0, limit);
		const identity = await ctx.auth.getUserIdentity();
		const myInterestIds = new Set<string>();
		if (identity) {
			for (const p of slice) {
				const row = await ctx.db
					.query("projectInterest")
					.withIndex("by_project_user", (q) =>
						q.eq("projectId", p._id).eq("clerkUserId", identity.subject),
					)
					.first();
				if (row) myInterestIds.add(p._id);
			}
		}

		return slice.map((p) => ({
			id: p._id,
			slug: p.slug,
			title: p.title,
			description: p.description,
			techStack: p.techStack,
			status: p.status,
			interestCount: p.interestCount,
			commentCount: p.commentCount,
			originatorName: p.originatorName ?? null,
			createdAt: p._creationTime,
			buildStartedAt: p.buildStartedAt ?? null,
			shippedAt: p.shippedAt ?? null,
			youInterested: myInterestIds.has(p._id),
		}));
	},
});

export const getProjectBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const project = await ctx.db
			.query("project")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();
		if (!project) return null;

		const identity = await ctx.auth.getUserIdentity();
		let youInterested = false;
		if (identity) {
			const row = await ctx.db
				.query("projectInterest")
				.withIndex("by_project_user", (q) =>
					q.eq("projectId", project._id).eq("clerkUserId", identity.subject),
				)
				.first();
			youInterested = Boolean(row);
		}

		const comments = await ctx.db
			.query("projectComment")
			.withIndex("by_project", (q) => q.eq("projectId", project._id))
			.collect();
		comments.sort((a, b) => a._creationTime - b._creationTime);

		const teamRows = await ctx.db
			.query("projectBuildTeamMember")
			.withIndex("by_project", (q) => q.eq("projectId", project._id))
			.collect();
		teamRows.sort((a, b) => a._creationTime - b._creationTime);

		return {
			id: project._id,
			slug: project.slug,
			title: project.title,
			description: project.description,
			techStack: project.techStack,
			status: project.status,
			interestCount: project.interestCount,
			commentCount: project.commentCount,
			originatorName: project.originatorName ?? null,
			originatingIdeaId: project.originatingIdeaId ?? null,
			createdAt: project._creationTime,
			buildStartedAt: project.buildStartedAt ?? null,
			shippedAt: project.shippedAt ?? null,
			youInterested,
			team: teamRows.map((t) => ({
				clerkUserId: t.clerkUserId,
				userName: t.userName,
				role: t.role,
				addedAt: t._creationTime,
			})),
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

export const listMyInterestedProjects = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];
		const rows = await ctx.db
			.query("projectInterest")
			.withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
			.collect();

		const projects = await Promise.all(
			rows.map(async (r) => {
				const p = await ctx.db.get(r.projectId);
				if (!p) return null;
				return {
					id: p._id,
					slug: p.slug,
					title: p.title,
					status: p.status,
					interestCount: p.interestCount,
					commentCount: p.commentCount,
				};
			}),
		);
		return projects.filter((p): p is NonNullable<typeof p> => p !== null);
	},
});

export const listMyBuildingProjects = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];
		const rows = await ctx.db
			.query("projectBuildTeamMember")
			.withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
			.collect();
		const projects = await Promise.all(
			rows.map(async (r) => {
				const p = await ctx.db.get(r.projectId);
				if (!p) return null;
				return {
					id: p._id,
					slug: p.slug,
					title: p.title,
					status: p.status,
					role: r.role,
				};
			}),
		);
		return projects.filter((p): p is NonNullable<typeof p> => p !== null);
	},
});

/* ─── Member actions ─────────────────────────────────────────────────── */

export const toggleInterest = mutation({
	args: { projectId: v.id("project") },
	handler: async (ctx, args) => {
		const identity = await requireUser(ctx);
		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");
		if (project.status === "shipped") {
			throw new Error("This project has already shipped");
		}

		const existing = await ctx.db
			.query("projectInterest")
			.withIndex("by_project_user", (q) =>
				q.eq("projectId", args.projectId).eq("clerkUserId", identity.subject),
			)
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
			await ctx.db.patch(args.projectId, {
				interestCount: Math.max(0, project.interestCount - 1),
			});
			return {
				interested: false,
				interestCount: Math.max(0, project.interestCount - 1),
			};
		}

		await ctx.db.insert("projectInterest", {
			projectId: args.projectId,
			clerkUserId: identity.subject,
			userName: readableName(identity),
			userEmail: identity.email ?? "",
		});
		await ctx.db.patch(args.projectId, {
			interestCount: project.interestCount + 1,
		});
		return {
			interested: true,
			interestCount: project.interestCount + 1,
		};
	},
});

export const commentOnProject = mutation({
	args: {
		projectId: v.id("project"),
		body: v.string(),
		parentId: v.optional(v.id("projectComment")),
		mentions: v.optional(
			v.array(
				v.object({ clerkUserId: v.string(), name: v.string() }),
			),
		),
	},
	handler: async (ctx, args) => {
		const identity = await requireUser(ctx);
		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");

		const body = args.body.trim();
		if (!body) throw new Error("Comment cannot be empty");
		if (body.length > MAX_COMMENT_LEN) {
			throw new Error(`Comment must be under ${MAX_COMMENT_LEN} characters`);
		}

		if (args.parentId) {
			const parent = await ctx.db.get(args.parentId);
			if (!parent || parent.projectId !== args.projectId) {
				throw new Error("Invalid parent comment");
			}
		}

		const merged = new Map<
			string,
			{ clerkUserId: string; name: string; username?: string }
		>();
		for (const m of args.mentions ?? []) merged.set(m.clerkUserId, m);

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
		const id = await ctx.db.insert("projectComment", {
			projectId: args.projectId,
			clerkUserId: identity.subject,
			authorName: readableName(identity),
			...(authorUsername ? { authorUsername } : {}),
			body,
			...(args.parentId ? { parentId: args.parentId } : {}),
			...(finalMentions.length > 0 ? { mentions: finalMentions } : {}),
		});
		await ctx.db.patch(args.projectId, {
			commentCount: project.commentCount + 1,
		});
		return { id };
	},
});

export const deleteMyProjectComment = mutation({
	args: { commentId: v.id("projectComment") },
	handler: async (ctx, args) => {
		const identity = await requireUser(ctx);
		const comment = await ctx.db.get(args.commentId);
		if (!comment) throw new Error("Comment not found");
		const isOwner = comment.clerkUserId === identity.subject;
		const isAdmin =
			(identity as unknown as ClerkIdentity).metadata?.role === "admin";
		if (!isOwner && !isAdmin) throw new Error("Not authorized");

		const project = await ctx.db.get(comment.projectId);
		await ctx.db.delete(args.commentId);
		if (project) {
			await ctx.db.patch(comment.projectId, {
				commentCount: Math.max(0, project.commentCount - 1),
			});
		}
		return { ok: true };
	},
});

/* ─── Admin ──────────────────────────────────────────────────────────── */

export const listProjectsForAdmin = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		const rows = await ctx.db.query("project").collect();
		const order: Record<Doc<"project">["status"], number> = {
			building: 0,
			open: 1,
			shipped: 2,
		};
		rows.sort((a, b) => {
			if (order[a.status] !== order[b.status]) {
				return order[a.status] - order[b.status];
			}
			if (b.interestCount !== a.interestCount) {
				return b.interestCount - a.interestCount;
			}
			return b._creationTime - a._creationTime;
		});
		return rows.map((p) => ({
			id: p._id,
			slug: p.slug,
			title: p.title,
			status: p.status,
			techStack: p.techStack,
			interestCount: p.interestCount,
			commentCount: p.commentCount,
			originatorName: p.originatorName ?? null,
			createdAt: p._creationTime,
			buildStartedAt: p.buildStartedAt ?? null,
			shippedAt: p.shippedAt ?? null,
		}));
	},
});

export const getProjectForAdmin = query({
	args: { projectId: v.id("project") },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const project = await ctx.db.get(args.projectId);
		if (!project) return null;

		const volunteers = await ctx.db
			.query("projectInterest")
			.withIndex("by_project", (q) => q.eq("projectId", project._id))
			.collect();
		const team = await ctx.db
			.query("projectBuildTeamMember")
			.withIndex("by_project", (q) => q.eq("projectId", project._id))
			.collect();
		const teamUserIds = new Set(team.map((m) => m.clerkUserId));

		return {
			id: project._id,
			slug: project.slug,
			title: project.title,
			description: project.description,
			techStack: project.techStack,
			status: project.status,
			originatorName: project.originatorName ?? null,
			originatingIdeaId: project.originatingIdeaId ?? null,
			interestCount: project.interestCount,
			commentCount: project.commentCount,
			createdAt: project._creationTime,
			buildStartedAt: project.buildStartedAt ?? null,
			shippedAt: project.shippedAt ?? null,
			volunteers: volunteers
				.sort((a, b) => a._creationTime - b._creationTime)
				.map((v) => ({
					clerkUserId: v.clerkUserId,
					userName: v.userName,
					userEmail: v.userEmail,
					interestedAt: v._creationTime,
					onTeam: teamUserIds.has(v.clerkUserId),
				})),
			team: team.map((t) => ({
				id: t._id,
				clerkUserId: t.clerkUserId,
				userName: t.userName,
				userEmail: t.userEmail,
				role: t.role,
				addedAt: t._creationTime,
			})),
		};
	},
});

export const updateProject = mutation({
	args: {
		projectId: v.id("project"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		techStack: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");
		const patch: Partial<Doc<"project">> = {};
		if (args.title !== undefined) {
			const t = args.title.trim();
			if (!t) throw new Error("Title cannot be empty");
			patch.title = t;
		}
		if (args.description !== undefined) {
			const d = args.description.trim();
			if (!d) throw new Error("Description cannot be empty");
			patch.description = d;
		}
		if (args.techStack !== undefined) {
			patch.techStack = args.techStack
				.map((t) => t.trim())
				.filter(Boolean)
				.slice(0, 12);
		}
		await ctx.db.patch(args.projectId, patch);
		return { ok: true };
	},
});

export const flipProjectStatus = mutation({
	args: {
		projectId: v.id("project"),
		status: v.union(
			v.literal("open"),
			v.literal("building"),
			v.literal("shipped"),
		),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");
		const patch: Partial<Doc<"project">> = { status: args.status };
		if (args.status === "building" && !project.buildStartedAt) {
			patch.buildStartedAt = Date.now();
		}
		if (args.status === "shipped" && !project.shippedAt) {
			patch.shippedAt = Date.now();
		}
		await ctx.db.patch(args.projectId, patch);
		return { ok: true };
	},
});

/* ─── Build team management (admin) ──────────────────────────────────── */

export const addBuildTeamMember = mutation({
	args: {
		projectId: v.id("project"),
		clerkUserId: v.string(),
		role: v.string(),
	},
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");

		const role = args.role.trim();
		if (!role) throw new Error("Role is required");

		// Already on the team? Just update role.
		const existing = await ctx.db
			.query("projectBuildTeamMember")
			.withIndex("by_project_user", (q) =>
				q
					.eq("projectId", args.projectId)
					.eq("clerkUserId", args.clerkUserId),
			)
			.first();
		if (existing) {
			await ctx.db.patch(existing._id, { role });
			return { id: existing._id, updated: true };
		}

		// Need name/email  prefer the projectInterest row (the volunteer pool).
		const interest = await ctx.db
			.query("projectInterest")
			.withIndex("by_project_user", (q) =>
				q
					.eq("projectId", args.projectId)
					.eq("clerkUserId", args.clerkUserId),
			)
			.first();

		const userName = interest?.userName ?? "Member";
		const userEmail = interest?.userEmail ?? "";

		const id = await ctx.db.insert("projectBuildTeamMember", {
			projectId: args.projectId,
			clerkUserId: args.clerkUserId,
			userName,
			userEmail,
			role,
			addedByClerkUserId: admin.subject,
		});
		return { id, updated: false };
	},
});

export const updateBuildMemberRole = mutation({
	args: {
		memberId: v.id("projectBuildTeamMember"),
		role: v.string(),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const role = args.role.trim();
		if (!role) throw new Error("Role is required");
		await ctx.db.patch(args.memberId, { role });
		return { ok: true };
	},
});

export const removeBuildTeamMember = mutation({
	args: { memberId: v.id("projectBuildTeamMember") },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const exists = await ctx.db.get(args.memberId);
		if (!exists) throw new Error("Team member not found");
		await ctx.db.delete(args.memberId);
		return { ok: true };
	},
});
