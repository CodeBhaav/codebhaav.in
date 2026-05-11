import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { buildMemberLookup, extractMentionTokens } from "./members";
import { captureIdentity } from "./userProfile";
import { enqueueNotification } from "./notifications";
import { normalizeCategories } from "./projectCategories";

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

interface ProjectPermissions {
	identity: ClerkIdentity;
	isAdmin: boolean;
	isTeamLead: boolean;
	canManage: boolean;
}

/**
 * Resolve who's acting on a project. Admin can do anything; the project's
 * teamLeadClerkUserId can manage that one project (tech stack, build team,
 * status->shipped). Use `requireProjectManager` to throw at mutation entry
 * points; use the returned booleans to gate response fields.
 */
async function getProjectPermissions(
	ctx: QueryCtx | MutationCtx,
	project: Doc<"project">,
): Promise<ProjectPermissions> {
	const identity = (await ctx.auth.getUserIdentity()) as
		| ClerkIdentity
		| null;
	const isAdmin = identity?.metadata?.role === "admin";
	const isTeamLead = !!(
		identity && project.teamLeadClerkUserId === identity.subject
	);
	return {
		identity: (identity ?? {
			subject: "",
		}) as ClerkIdentity,
		isAdmin,
		isTeamLead,
		canManage: isAdmin || isTeamLead,
	};
}

async function requireProjectManager(
	ctx: MutationCtx,
	projectId: Id<"project">,
): Promise<{ project: Doc<"project">; perms: ProjectPermissions }> {
	const project = await ctx.db.get(projectId);
	if (!project) throw new Error("Project not found");
	const perms = await getProjectPermissions(ctx, project);
	if (!perms.canManage) {
		throw new Error("Only the team lead or an admin can manage this project");
	}
	return { project, perms };
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
			categories: p.categories ?? [],
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

		const teamRows = await ctx.db
			.query("projectBuildTeamMember")
			.withIndex("by_project", (q) => q.eq("projectId", project._id))
			.collect();
		teamRows.sort((a, b) => a._creationTime - b._creationTime);

		const perms = await getProjectPermissions(ctx, project);

		// Volunteers list  visible to admin + team lead only (it's a private
		// pool used to assemble the team, not a public roster).
		let volunteers:
			| Array<{
					clerkUserId: string;
					userName: string;
					userEmail: string;
					interestedAt: number;
					onTeam: boolean;
			  }>
			| null = null;
		if (perms.canManage) {
			const rows = await ctx.db
				.query("projectInterest")
				.withIndex("by_project", (q) => q.eq("projectId", project._id))
				.collect();
			const teamUserIds = new Set(teamRows.map((m) => m.clerkUserId));
			rows.sort((a, b) => a._creationTime - b._creationTime);
			volunteers = rows.map((v) => ({
				clerkUserId: v.clerkUserId,
				userName: v.userName,
				userEmail: v.userEmail,
				interestedAt: v._creationTime,
				onTeam: teamUserIds.has(v.clerkUserId),
			}));
		}

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
			teamLeadClerkUserId: project.teamLeadClerkUserId ?? null,
			repoUrl: project.repoUrl ?? null,
			demoUrl: project.demoUrl ?? null,
			categories: project.categories ?? [],
			createdAt: project._creationTime,
			buildStartedAt: project.buildStartedAt ?? null,
			shippedAt: project.shippedAt ?? null,
			youInterested,
			youAreTeamLead: perms.isTeamLead,
			youAreAdmin: perms.isAdmin,
			team: teamRows.map((t) => ({
				id: t._id,
				clerkUserId: t.clerkUserId,
				userName: t.userName,
				userEmail: t.userEmail,
				role: t.role,
				addedAt: t._creationTime,
			})),
			volunteers,
		};
	},
});

export const listProjectComments = query({
	args: {
		projectId: v.id("project"),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			return {
				page: [],
				isDone: true,
				continueCursor: "" as string,
			};
		}

		const topLevels = await ctx.db
			.query("projectComment")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => q.eq(q.field("parentId"), undefined))
			.order("asc")
			.paginate(args.paginationOpts);

		const allChildren: Doc<"projectComment">[] = [];
		const stack = topLevels.page.map((c) => c._id);
		const seen = new Set<string>();
		while (stack.length > 0) {
			const id = stack.pop()!;
			if (seen.has(id)) continue;
			seen.add(id);
			const kids = await ctx.db
				.query("projectComment")
				.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
				.filter((q) => q.eq(q.field("parentId"), id))
				.collect();
			for (const k of kids) {
				allChildren.push(k);
				stack.push(k._id);
			}
		}

		const identity = await ctx.auth.getUserIdentity();
		const everything = [...topLevels.page, ...allChildren];
		return {
			...topLevels,
			page: everything.map((c) => ({
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
		await captureIdentity(ctx, identity);
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
		await captureIdentity(ctx, identity);
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
		const actorName = readableName(identity);
		const id = await ctx.db.insert("projectComment", {
			projectId: args.projectId,
			clerkUserId: identity.subject,
			authorName: actorName,
			...(authorUsername ? { authorUsername } : {}),
			body,
			...(args.parentId ? { parentId: args.parentId } : {}),
			...(finalMentions.length > 0 ? { mentions: finalMentions } : {}),
		});
		await ctx.db.patch(args.projectId, {
			commentCount: project.commentCount + 1,
		});

		const snippet = body.length > 160 ? `${body.slice(0, 157)}…` : body;
		const targetUrl = `/projects/${project.slug}`;
		const notified = new Set<string>();
		for (const m of finalMentions) {
			if (notified.has(m.clerkUserId)) continue;
			notified.add(m.clerkUserId);
			await enqueueNotification(ctx, {
				recipientClerkUserId: m.clerkUserId,
				actorClerkUserId: identity.subject,
				kind: "mention_in_comment",
				payload: {
					actorName,
					actorUsername: authorUsername,
					surface: "project",
					targetId: args.projectId,
					targetTitle: project.title,
					targetUrl,
					snippet,
				},
			});
		}
		if (args.parentId) {
			const parent = await ctx.db.get(args.parentId);
			if (parent && !notified.has(parent.clerkUserId)) {
				await enqueueNotification(ctx, {
					recipientClerkUserId: parent.clerkUserId,
					actorClerkUserId: identity.subject,
					kind: "reply_to_my_comment",
					payload: {
						actorName,
						actorUsername: authorUsername,
						surface: "project",
						targetId: args.projectId,
						targetTitle: project.title,
						targetUrl,
						snippet,
					},
				});
			}
		}

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
			categories: p.categories ?? [],
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
			teamLeadClerkUserId: project.teamLeadClerkUserId ?? null,
			categories: project.categories ?? [],
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

function normalizeProjectLink(raw: string, label: string): string | undefined {
	const trimmed = raw.trim();
	if (!trimmed) return undefined;
	if (!/^https:\/\/[^\s]+$/i.test(trimmed)) {
		throw new Error(`${label} must start with https:// and have no spaces`);
	}
	return trimmed;
}

export const updateProject = mutation({
	args: {
		projectId: v.id("project"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		techStack: v.optional(v.array(v.string())),
		repoUrl: v.optional(v.string()),
		demoUrl: v.optional(v.string()),
		categories: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		await requireProjectManager(ctx, args.projectId);
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
		if (args.repoUrl !== undefined) {
			patch.repoUrl = normalizeProjectLink(args.repoUrl, "Repo URL");
		}
		if (args.demoUrl !== undefined) {
			patch.demoUrl = normalizeProjectLink(args.demoUrl, "Demo URL");
		}
		if (args.categories !== undefined) {
			patch.categories = normalizeCategories(args.categories) ?? [];
		}
		await ctx.db.patch(args.projectId, patch);
		return { ok: true };
	},
});

/**
 * Assign (or clear) the team lead for a project. Admin only.
 *
 * Setting a team lead auto-adds them to the build team with role
 * "Team Lead" if they aren't already on the team  saves admins a
 * second step. Pass `clerkUserId: null` to clear.
 */
export const setProjectTeamLead = mutation({
	args: {
		projectId: v.id("project"),
		clerkUserId: v.union(v.string(), v.null()),
	},
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");

		if (args.clerkUserId === null) {
			await ctx.db.patch(args.projectId, { teamLeadClerkUserId: undefined });
			return { ok: true };
		}

		// Find a name/email for the new lead so we can ensure they're on the team.
		const interest = await ctx.db
			.query("projectInterest")
			.withIndex("by_project_user", (q) =>
				q.eq("projectId", args.projectId).eq("clerkUserId", args.clerkUserId as string),
			)
			.first();

		const existingMember = await ctx.db
			.query("projectBuildTeamMember")
			.withIndex("by_project_user", (q) =>
				q
					.eq("projectId", args.projectId)
					.eq("clerkUserId", args.clerkUserId as string),
			)
			.first();

		if (!existingMember) {
			await ctx.db.insert("projectBuildTeamMember", {
				projectId: args.projectId,
				clerkUserId: args.clerkUserId,
				userName: interest?.userName ?? "Team Lead",
				userEmail: interest?.userEmail ?? "",
				role: "Team Lead",
				addedByClerkUserId: admin.subject,
			});
		}

		await ctx.db.patch(args.projectId, {
			teamLeadClerkUserId: args.clerkUserId,
		});

		if (project.teamLeadClerkUserId !== args.clerkUserId) {
			await enqueueNotification(ctx, {
				recipientClerkUserId: args.clerkUserId,
				actorClerkUserId: admin.subject,
				kind: "team_lead_assigned",
				payload: {
					projectTitle: project.title,
					slug: project.slug,
					targetUrl: `/projects/${project.slug}`,
					actorName: readableName(admin),
				},
			});
		}
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
		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");
		const perms = await getProjectPermissions(ctx, project);

		// Permission gating:
		// - open / building flips: admin only (they're the editorial moves)
		// - shipped flip: admin OR the project's team lead
		if (args.status === "shipped") {
			if (!perms.canManage) {
				throw new Error("Only the team lead or an admin can ship this project");
			}
		} else if (!perms.isAdmin) {
			throw new Error("Only an admin can change this project's stage");
		}

		// Building gate  enforce readiness before announcing.
		if (args.status === "building") {
			if (project.techStack.length === 0) {
				throw new Error(
					"Project can't move to building without a tech stack. Decide on the stack first.",
				);
			}
			const teamCount = await ctx.db
				.query("projectBuildTeamMember")
				.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
				.collect();
			if (teamCount.length === 0) {
				throw new Error(
					"Project can't move to building without at least one team member.",
				);
			}
		}

		const patch: Partial<Doc<"project">> = { status: args.status };
		if (args.status === "building" && !project.buildStartedAt) {
			patch.buildStartedAt = Date.now();
		}
		if (args.status === "shipped" && !project.shippedAt) {
			patch.shippedAt = Date.now();
		}
		await ctx.db.patch(args.projectId, patch);

		if (args.status !== project.status) {
			// Notify everyone with skin in the game: build team + volunteers +
			// originator. Set is implicit via enqueueNotification's self-mute.
			const recipients = new Set<string>();
			const teamRows = await ctx.db
				.query("projectBuildTeamMember")
				.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
				.collect();
			for (const r of teamRows) recipients.add(r.clerkUserId);
			const interestRows = await ctx.db
				.query("projectInterest")
				.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
				.collect();
			for (const r of interestRows) recipients.add(r.clerkUserId);
			if (project.originatorClerkUserId) {
				recipients.add(project.originatorClerkUserId);
			}
			const targetUrl = `/projects/${project.slug}`;
			for (const recipient of recipients) {
				await enqueueNotification(ctx, {
					recipientClerkUserId: recipient,
					actorClerkUserId: perms.identity.subject || undefined,
					kind: "project_status_changed",
					payload: {
						projectTitle: project.title,
						slug: project.slug,
						status: args.status,
						targetUrl,
					},
				});
			}
		}

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
		const { project, perms } = await requireProjectManager(
			ctx,
			args.projectId,
		);
		const actor = perms.identity;

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
			addedByClerkUserId: actor.subject,
		});

		await enqueueNotification(ctx, {
			recipientClerkUserId: args.clerkUserId,
			actorClerkUserId: actor.subject,
			kind: "added_to_build_team",
			payload: {
				projectTitle: project.title,
				slug: project.slug,
				role,
				targetUrl: `/projects/${project.slug}`,
				actorName: readableName(actor),
			},
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
		const member = await ctx.db.get(args.memberId);
		if (!member) throw new Error("Team member not found");
		await requireProjectManager(ctx, member.projectId);
		const role = args.role.trim();
		if (!role) throw new Error("Role is required");
		await ctx.db.patch(args.memberId, { role });
		return { ok: true };
	},
});

export const removeBuildTeamMember = mutation({
	args: { memberId: v.id("projectBuildTeamMember") },
	handler: async (ctx, args) => {
		const member = await ctx.db.get(args.memberId);
		if (!member) throw new Error("Team member not found");
		await requireProjectManager(ctx, member.projectId);
		// If removing the team lead, also clear the project pointer.
		const project = await ctx.db.get(member.projectId);
		if (project?.teamLeadClerkUserId === member.clerkUserId) {
			await ctx.db.patch(project._id, { teamLeadClerkUserId: undefined });
		}
		await ctx.db.delete(args.memberId);
		return { ok: true };
	},
});

/* ─── Project update log (milestones) ──────────────────────────────────── */

const UPDATE_TITLE_MAX = 120;
const UPDATE_BODY_MAX = 4000;
const UPDATE_THROTTLE_MS = 60 * 60 * 1000; // 1 update / hour / project / author

export const listProjectUpdates = query({
	args: { projectId: v.id("project") },
	handler: async (ctx, args) => {
		const rows = await ctx.db
			.query("projectUpdate")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();
		rows.sort((a, b) => b._creationTime - a._creationTime);
		const identity = await ctx.auth.getUserIdentity();
		return rows.map((r) => ({
			id: r._id,
			projectId: r.projectId,
			authorClerkUserId: r.authorClerkUserId,
			authorName: r.authorName,
			authorUsername: r.authorUsername ?? null,
			title: r.title,
			body: r.body,
			createdAt: r._creationTime,
			mine: identity?.subject === r.authorClerkUserId,
		}));
	},
});

export const postProjectUpdate = mutation({
	args: {
		projectId: v.id("project"),
		title: v.string(),
		body: v.string(),
	},
	handler: async (ctx, args) => {
		const { project, perms } = await requireProjectManager(
			ctx,
			args.projectId,
		);
		const actor = perms.identity;
		await captureIdentity(ctx, actor);

		const title = args.title.trim();
		const body = args.body.trim();
		if (!title) throw new Error("Update title cannot be empty");
		if (title.length > UPDATE_TITLE_MAX) {
			throw new Error(`Title must be under ${UPDATE_TITLE_MAX} characters`);
		}
		if (!body) throw new Error("Update body cannot be empty");
		if (body.length > UPDATE_BODY_MAX) {
			throw new Error(`Body must be under ${UPDATE_BODY_MAX} characters`);
		}

		// Anti-spam: one update / hour / project / author.
		const recent = await ctx.db
			.query("projectUpdate")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();
		const cutoff = Date.now() - UPDATE_THROTTLE_MS;
		const recentMine = recent.find(
			(r) => r.authorClerkUserId === actor.subject && r._creationTime >= cutoff,
		);
		if (recentMine) {
			throw new Error(
				"You've already posted an update for this project in the last hour. Give it a beat.",
			);
		}

		const authorUsername = readableUsername(actor);
		const id = await ctx.db.insert("projectUpdate", {
			projectId: args.projectId,
			authorClerkUserId: actor.subject,
			authorName: readableName(actor),
			...(authorUsername ? { authorUsername } : {}),
			title,
			body,
		});

		// Notify everyone on the team or volunteering. Self-mute inside.
		const teamRows = await ctx.db
			.query("projectBuildTeamMember")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();
		const interestRows = await ctx.db
			.query("projectInterest")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();
		const recipients = new Set<string>();
		for (const r of teamRows) recipients.add(r.clerkUserId);
		for (const r of interestRows) recipients.add(r.clerkUserId);
		if (project.originatorClerkUserId) {
			recipients.add(project.originatorClerkUserId);
		}
		for (const recipient of recipients) {
			await enqueueNotification(ctx, {
				recipientClerkUserId: recipient,
				actorClerkUserId: actor.subject,
				kind: "project_status_changed",
				payload: {
					projectTitle: project.title,
					slug: project.slug,
					status: "update",
					targetUrl: `/projects/${project.slug}`,
					actorName: readableName(actor),
					snippet: title,
				},
			});
		}

		return { id };
	},
});

export const deleteProjectUpdate = mutation({
	args: { updateId: v.id("projectUpdate") },
	handler: async (ctx, args) => {
		const identity = await requireUser(ctx);
		const row = await ctx.db.get(args.updateId);
		if (!row) throw new Error("Update not found");
		const isOwner = row.authorClerkUserId === identity.subject;
		const isAdmin =
			(identity as unknown as ClerkIdentity).metadata?.role === "admin";
		// Allow team-lead-of-the-same-project to clean up too.
		const project = await ctx.db.get(row.projectId);
		const isLead = project?.teamLeadClerkUserId === identity.subject;
		if (!isOwner && !isAdmin && !isLead) {
			throw new Error("Not authorized to delete this update");
		}
		await ctx.db.delete(args.updateId);
		return { ok: true };
	},
});
