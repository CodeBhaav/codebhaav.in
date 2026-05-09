import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

// Convex's UserIdentity is the standard set of JWT claims; custom claims
// like the role from publicMetadata aren't typed. We extend it here so
// admin checks read role with full type safety.
interface ClerkIdentity {
	subject: string;
	tokenIdentifier: string;
	metadata?: { role?: string };
}

async function requireAdmin(
	ctx: QueryCtx | MutationCtx,
): Promise<ClerkIdentity> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}
	const role = (identity as unknown as ClerkIdentity).metadata?.role;
	if (role !== "admin") {
		throw new Error("Not authorized");
	}
	return identity as unknown as ClerkIdentity;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(ms: number): string {
	return new Date(ms).toISOString().slice(0, 10);
}

function buildDailyBuckets(
	timestamps: readonly number[],
	days: number,
): Array<{ day: string; count: number }> {
	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);
	const start = today.getTime() - (days - 1) * DAY_MS;

	const counts = new Map<string, number>();
	for (let i = 0; i < days; i++) {
		const key = dayKey(start + i * DAY_MS);
		counts.set(key, 0);
	}
	for (const ts of timestamps) {
		if (ts < start) continue;
		const key = dayKey(ts);
		if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return Array.from(counts.entries()).map(([day, count]) => ({ day, count }));
}

/* ────────────────────────────────────────────────────────────────────
 *  Overview — totals + time-series for the /admin landing page
 * ──────────────────────────────────────────────────────────────────── */

export const getOverview = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);

		const waitlist = await ctx.db.query("waitlist").collect();
		const founding = await ctx.db.query("foundingMember").collect();

		const submittedCount = founding.filter(
			(f) => (f.status ?? "submitted") === "submitted",
		).length;
		const acceptedCount = founding.filter(
			(f) => f.status === "accepted",
		).length;

		const conversionRate = waitlist.length === 0
			? 0
			: Math.round((founding.length / waitlist.length) * 1000) / 10;

		const waitlistDaily = buildDailyBuckets(
			waitlist.map((w) => w._creationTime),
			30,
		);
		const foundingDaily = buildDailyBuckets(
			founding.map((f) => f._creationTime),
			30,
		);

		const signupsByDay = waitlistDaily.map((bucket, i) => ({
			day: bucket.day,
			Waitlist: bucket.count,
			"Founding applications": foundingDaily[i]?.count ?? 0,
		}));

		const statusOrder = ["submitted", "in_review", "accepted", "rejected"] as const;
		const statusBreakdown = statusOrder.map((status) => ({
			name: status,
			count: founding.filter((f) => (f.status ?? "submitted") === status).length,
		}));

		const recentApplications = founding
			.sort((a, b) => b._creationTime - a._creationTime)
			.slice(0, 5)
			.map((f) => ({
				id: f._id,
				name: f.name,
				email: f.email,
				submittedAt: f._creationTime,
				status: (f.status ?? "submitted") as
					| "submitted"
					| "in_review"
					| "accepted"
					| "rejected",
			}));

		return {
			waitlistCount: waitlist.length,
			foundingCount: founding.length,
			submittedCount,
			acceptedCount,
			conversionRate,
			signupsByDay,
			statusBreakdown,
			recentApplications,
		};
	},
});

/* ────────────────────────────────────────────────────────────────────
 *  Waitlist
 * ──────────────────────────────────────────────────────────────────── */

export const getWaitlistStats = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);

		const waitlist = await ctx.db.query("waitlist").collect();
		const now = Date.now();
		const weekAgo = now - 7 * DAY_MS;
		const monthAgo = now - 30 * DAY_MS;

		const thisWeekCount = waitlist.filter((w) => w._creationTime >= weekAgo).length;
		const thisMonthCount = waitlist.filter((w) => w._creationTime >= monthAgo).length;

		const sortedByReferrals = [...waitlist].sort(
			(a, b) => b.referralCount - a.referralCount,
		);
		const topReferrer = sortedByReferrals[0]
			? {
					name: sortedByReferrals[0].name,
					referralCount: sortedByReferrals[0].referralCount,
				}
			: null;

		const topReferrers = sortedByReferrals.slice(0, 10).map((w) => ({
			name: w.name,
			referralCount: w.referralCount,
			referralCode: w.referralCode,
		}));

		const interestCounts = new Map<string, number>();
		for (const w of waitlist) {
			for (const interest of w.interests) {
				interestCounts.set(interest, (interestCounts.get(interest) ?? 0) + 1);
			}
		}
		const byInterest = Array.from(interestCounts.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		const roleCounts = new Map<string, number>();
		for (const w of waitlist) {
			roleCounts.set(w.role, (roleCounts.get(w.role) ?? 0) + 1);
		}
		const byRole = Array.from(roleCounts.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		return {
			total: waitlist.length,
			thisWeekCount,
			thisMonthCount,
			topReferrer,
			topReferrers,
			byInterest,
			byRole,
		};
	},
});

export const listWaitlist = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);

		const waitlist = await ctx.db
			.query("waitlist")
			.order("desc")
			.collect();

		return waitlist.map((w) => ({
			id: w._id,
			name: w.name,
			email: w.email,
			role: w.role,
			otherRole: w.otherRole,
			interests: w.interests,
			referralCode: w.referralCode,
			referralCount: w.referralCount,
			referredBy: w.referredBy,
			whatsapp: w.whatsapp,
			instagram: w.instagram,
			signedUpAt: w._creationTime,
		}));
	},
});

/* ────────────────────────────────────────────────────────────────────
 *  Founding members
 * ──────────────────────────────────────────────────────────────────── */

export const getFoundingStats = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);

		const founding = await ctx.db.query("foundingMember").collect();
		const statusOrder = ["submitted", "in_review", "accepted", "rejected"] as const;

		const byStatus = statusOrder.map((status) => ({
			name: status,
			count: founding.filter((f) => (f.status ?? "submitted") === status).length,
		}));

		const total = founding.length;
		const submittedCount =
			byStatus.find((s) => s.name === "submitted")?.count ?? 0;
		const acceptedCount =
			byStatus.find((s) => s.name === "accepted")?.count ?? 0;
		const rejectedCount =
			byStatus.find((s) => s.name === "rejected")?.count ?? 0;

		return { total, byStatus, submittedCount, acceptedCount, rejectedCount };
	},
});

export const listFoundingMembers = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);

		const founding = await ctx.db
			.query("foundingMember")
			.order("desc")
			.collect();

		return Promise.all(
			founding.map(async (f) => {
				let profile: {
					whatsapp: string;
					github: string;
					linkedin: string;
					portfolio: string;
					skills: string;
					experience: string;
				} | null = null;
				if (f.clerkUserId) {
					const row = await ctx.db
						.query("userProfile")
						.withIndex("by_clerkUserId", (q) =>
							q.eq("clerkUserId", f.clerkUserId as string),
						)
						.first();
					profile = row
						? {
								whatsapp: row.whatsapp ?? "",
								github: row.github ?? "",
								linkedin: row.linkedin ?? "",
								portfolio: row.portfolio ?? "",
								skills: row.skills ?? "",
								experience: row.experience ?? "",
							}
						: null;
				}

				const legacy = {
					whatsapp: f.whatsapp ?? "",
					github: f.github ?? "",
					linkedin: f.linkedin ?? "",
					portfolio: f.portfolio ?? "",
					skills: f.skills ?? "",
					experience: f.experience ?? "",
				};

				return {
					id: f._id,
					name: f.name,
					email: f.email,
					submittedAt: f._creationTime,
					status: (f.status ?? "submitted") as
						| "submitted"
						| "in_review"
						| "accepted"
						| "rejected",
					motivation: f.motivation,
					commitment: f.commitment,
					ideas: f.ideas ?? "",
					profile: profile ?? legacy,
				};
			}),
		);
	},
});

/* ────────────────────────────────────────────────────────────────────
 *  Mutations — admin actions
 * ──────────────────────────────────────────────────────────────────── */

export const flipFoundingStatus = mutation({
	args: {
		applicationId: v.id("foundingMember"),
		status: v.union(
			v.literal("submitted"),
			v.literal("in_review"),
			v.literal("accepted"),
			v.literal("rejected"),
		),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const application = await ctx.db.get(args.applicationId);
		if (!application) {
			throw new Error(`No application with id ${args.applicationId}`);
		}

		await ctx.db.patch(args.applicationId, { status: args.status });

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

		return { id: args.applicationId, status: args.status };
	},
});
