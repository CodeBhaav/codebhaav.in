import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";

/**
 * Resolve a username to a (clerkUserId, displayName) pair.
 *
 * Primary source is the `userProfile` table  populated lazily on every
 * write via `captureIdentity`. As a backfill fallback we scan recent
 * comment authors, since comments cache `authorUsername`.
 */
async function resolveUsername(
	ctx: QueryCtx,
	username: string,
): Promise<{ clerkUserId: string; displayName: string } | null> {
	const normalized = username.trim();
	if (!normalized) return null;

	const profile = await ctx.db
		.query("userProfile")
		.withIndex("by_username", (q) => q.eq("preferredUsername", normalized))
		.first();
	if (profile) {
		return {
			clerkUserId: profile.clerkUserId,
			displayName: profile.displayName ?? normalized,
		};
	}

	// Fallback: scan comments  acceptable at our scale and only hit until
	// the user takes another action (which then populates userProfile).
	const lowered = normalized.toLowerCase();
	const ideaComments = await ctx.db.query("ideaComment").collect();
	for (const c of ideaComments) {
		if (c.authorUsername && c.authorUsername.toLowerCase() === lowered) {
			return { clerkUserId: c.clerkUserId, displayName: c.authorName };
		}
	}
	const projectComments = await ctx.db.query("projectComment").collect();
	for (const c of projectComments) {
		if (c.authorUsername && c.authorUsername.toLowerCase() === lowered) {
			return { clerkUserId: c.clerkUserId, displayName: c.authorName };
		}
	}
	return null;
}

export const getProfileByUsername = query({
	args: { username: v.string() },
	handler: async (ctx, args) => {
		const resolved = await resolveUsername(ctx, args.username);
		if (!resolved) return null;
		const { clerkUserId, displayName } = resolved;

		// Submitted ideas (excluding rejected for non-owners).
		const allIdeas = await ctx.db
			.query("projectIdea")
			.withIndex("by_submitter", (q) =>
				q.eq("submitterClerkUserId", clerkUserId),
			)
			.collect();
		const identity = await ctx.auth.getUserIdentity();
		const isOwner = identity?.subject === clerkUserId;
		const ideas = allIdeas
			.filter((i) => isOwner || i.status !== "rejected")
			.sort((a, b) => b._creationTime - a._creationTime)
			.map((i) => ({
				id: i._id,
				title: i.title,
				status: i.status,
				upvoteCount: i.upvoteCount,
				downvoteCount: i.downvoteCount ?? 0,
				commentCount: i.commentCount,
				submittedAt: i._creationTime,
				promotedToProjectId: i.promotedToProjectId ?? null,
			}));

		// Projects originated by this user (their idea was promoted to a project).
		const allProjects = await ctx.db.query("project").collect();
		const originatedProjects = allProjects
			.filter((p) => p.originatorClerkUserId === clerkUserId)
			.sort((a, b) => b._creationTime - a._creationTime)
			.map((p) => ({
				id: p._id,
				slug: p.slug,
				title: p.title,
				status: p.status,
				interestCount: p.interestCount,
				techStack: p.techStack,
				categories: p.categories ?? [],
			}));

		// Projects user is on the build team for.
		const teamRows = await ctx.db
			.query("projectBuildTeamMember")
			.withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
			.collect();
		const teamProjects = (
			await Promise.all(
				teamRows.map(async (row) => {
					const project = await ctx.db.get(row.projectId);
					if (!project) return null;
					return {
						id: project._id,
						slug: project.slug,
						title: project.title,
						status: project.status,
						role: row.role,
						isTeamLead:
							project.teamLeadClerkUserId === clerkUserId,
					};
				}),
			)
		).filter((p): p is NonNullable<typeof p> => p !== null);

		// Total comment count across both feeds. Cheap O(n) scan at our scale.
		const ideaComments = await ctx.db.query("ideaComment").collect();
		const projectComments = await ctx.db.query("projectComment").collect();
		const commentCount =
			ideaComments.filter((c) => c.clerkUserId === clerkUserId).length +
			projectComments.filter((c) => c.clerkUserId === clerkUserId).length;

		// First-seen timestamp  earliest activity we can find. Helps the
		// profile feel like a real "member since" page.
		const candidateTimes: number[] = [];
		for (const i of allIdeas) candidateTimes.push(i._creationTime);
		for (const p of allProjects.filter(
			(p) => p.originatorClerkUserId === clerkUserId,
		)) {
			candidateTimes.push(p._creationTime);
		}
		for (const t of teamRows) candidateTimes.push(t._creationTime);
		for (const c of ideaComments) {
			if (c.clerkUserId === clerkUserId) candidateTimes.push(c._creationTime);
		}
		for (const c of projectComments) {
			if (c.clerkUserId === clerkUserId) candidateTimes.push(c._creationTime);
		}
		const memberSince =
			candidateTimes.length > 0 ? Math.min(...candidateTimes) : null;

		return {
			username: args.username.trim(),
			displayName,
			clerkUserId,
			isOwner,
			memberSince,
			commentCount,
			ideas,
			originatedProjects,
			teamProjects,
		};
	},
});
