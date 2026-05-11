import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	PUBLIC_TOPICS,
	type TopicSlug,
	defaultTopicState,
} from "./resendResources";

/**
 * Read the signed-in user's profile. Returns null if the user has never
 * filled out a form that creates a profile entry. Public so the frontend
 * can prefill forms without an extra round-trip.
 */
export const getMyProfile = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("userProfile")
			.withIndex("by_clerkUserId", (q) =>
				q.eq("clerkUserId", identity.subject),
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
			newsletter: profile.newsletter ?? false,
			updatedAt: profile.updatedAt,
		};
	},
});

const topicsValidator = v.object({
	community_updates: v.optional(v.boolean()),
	product_announcements: v.optional(v.boolean()),
	event_invitations: v.optional(v.boolean()),
	activity_updates: v.optional(v.boolean()),
	founders_only: v.optional(v.boolean()),
});

type TopicMap = Partial<Record<TopicSlug, boolean>>;

/**
 * Returns the live per-topic subscription state for the signed-in user.
 *
 * Order of precedence:
 *  1. `userProfile.topics` once they've toggled anything in /dashboard/settings.
 *  2. Inferred from the legacy `newsletter: boolean` if present (community_updates +
 *     product_announcements track it; event_invitations stays at its default opt-out).
 *  3. The codified default subscription state from `resendResources.ts`.
 *
 * Also computes whether the user is a founding member (status=accepted) so the
 * settings page knows to show the `founders_only` toggle.
 */
export const getMyTopicSubscriptions = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("userProfile")
			.withIndex("by_clerkUserId", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.first();

		const founding = await ctx.db
			.query("foundingMember")
			.withIndex("by_clerkUserId", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.first();
		const isFoundingMember = (founding?.status ?? null) === "accepted";

		const defaults = defaultTopicState();
		let topics: Record<TopicSlug, boolean> = { ...defaults };

		if (profile?.topics) {
			for (const slug of Object.keys(defaults) as TopicSlug[]) {
				const v = profile.topics[slug];
				if (typeof v === "boolean") topics[slug] = v;
			}
		} else if (typeof profile?.newsletter === "boolean") {
			// Legacy single-toggle  it set community_updates + product_announcements.
			topics.community_updates = profile.newsletter;
			topics.product_announcements = profile.newsletter;
		}

		// Visible-to-user surface: public topics always; founders_only only
		// when the user is actually an accepted founder.
		const visible: TopicSlug[] = isFoundingMember
			? [...PUBLIC_TOPICS, "founders_only"]
			: [...PUBLIC_TOPICS];

		return { topics, visible, isFoundingMember };
	},
});

/**
 * Set one or more topic subscriptions for the signed-in user. Accepts a
 * partial map  unspecified topics keep their previous state. Updates
 * Convex first (so the UI is consistent immediately), then schedules a
 * sync to Resend so the contact's topic state matches.
 */
export const setMyTopicSubscriptions = mutation({
	args: { topics: topicsValidator },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}
		const clerkUserId = identity.subject;
		const email = identity.email ?? null;
		const givenName = identity.givenName ?? "";
		const familyName = identity.familyName ?? "";
		const fullName =
			[givenName, familyName].filter(Boolean).join(" ").trim() ||
			identity.name ||
			undefined;

		// Read current state, merge incoming patch, write back.
		const profile = await ctx.db
			.query("userProfile")
			.withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		const current: TopicMap = profile?.topics ?? {};
		// Carry forward legacy `newsletter` if topics weren't set yet.
		if (!profile?.topics && typeof profile?.newsletter === "boolean") {
			current.community_updates = profile.newsletter;
			current.product_announcements = profile.newsletter;
		}

		const merged: TopicMap = { ...current };
		for (const [slug, value] of Object.entries(args.topics)) {
			if (typeof value === "boolean") merged[slug as TopicSlug] = value;
		}

		const now = Date.now();
		if (profile) {
			await ctx.db.patch(profile._id, { topics: merged, updatedAt: now });
		} else {
			await ctx.db.insert("userProfile", {
				clerkUserId,
				topics: merged,
				updatedAt: now,
			});
		}

		// Resolve email + name (fall back to the user's most recent submission row).
		let syncEmail = email;
		let syncName: string | undefined = fullName;
		if (!syncEmail) {
			const founding = await ctx.db
				.query("foundingMember")
				.withIndex("by_clerkUserId", (q) =>
					q.eq("clerkUserId", clerkUserId),
				)
				.first();
			if (founding) {
				syncEmail = founding.email;
				if (!syncName) syncName = founding.name;
			}
		}
		if (syncEmail) {
			// Mirror to waitlist/founding rows so admin views stay consistent.
			const waitlist = await ctx.db
				.query("waitlist")
				.withIndex("by_email", (q) => q.eq("email", syncEmail as string))
				.first();
			if (waitlist && typeof merged.community_updates === "boolean") {
				await ctx.db.patch(waitlist._id, {
					newsletter: Boolean(merged.community_updates),
				});
			}

			await ctx.scheduler.runAfter(0, internal.email.syncContact, {
				email: syncEmail,
				name: syncName,
				topics: args.topics,
			});
		}

		return { topics: merged };
	},
});

export interface UserProfileInput {
	whatsapp?: string;
	github?: string;
	linkedin?: string;
	portfolio?: string;
	skills?: string;
	experience?: string;
	newsletter?: boolean;
}

interface CapturedIdentity {
	subject: string;
	name?: string;
	givenName?: string;
	familyName?: string;
	preferredUsername?: string;
}

/**
 * Side-effect helper: ensure the signed-in user has a `userProfile` row
 * that caches their Clerk display name + preferred_username. Invoked from
 * write paths (commenting, voting, volunteering) so /u/[username] has a
 * canonical mapping to look up. Idempotent  no-op if the cached values
 * already match. Safe to call without a username (just stores displayName).
 */
export async function captureIdentity(
	ctx: MutationCtx,
	identity: CapturedIdentity,
): Promise<void> {
	const displayName =
		[identity.givenName, identity.familyName].filter(Boolean).join(" ").trim() ||
		identity.name ||
		undefined;
	const username = identity.preferredUsername?.trim() || undefined;

	const existing = await ctx.db
		.query("userProfile")
		.withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
		.first();

	if (existing) {
		const patch: Partial<{
			preferredUsername: string | undefined;
			displayName: string | undefined;
			updatedAt: number;
		}> = {};
		if (username !== existing.preferredUsername) {
			patch.preferredUsername = username;
		}
		if (displayName && displayName !== existing.displayName) {
			patch.displayName = displayName;
		}
		if (Object.keys(patch).length === 0) return;
		patch.updatedAt = Date.now();
		await ctx.db.patch(existing._id, patch);
		return;
	}

	await ctx.db.insert("userProfile", {
		clerkUserId: identity.subject,
		...(username ? { preferredUsername: username } : {}),
		...(displayName ? { displayName } : {}),
		updatedAt: Date.now(),
	});
}

/**
 * Internal upsert helper invoked from other mutations that collect profile
 * data as a side effect (e.g. submitApplication). Not exposed as a public
 * mutation  without per-user auth verification, anyone could overwrite
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
		...(input.newsletter !== undefined
			? { newsletter: input.newsletter }
			: {}),
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
