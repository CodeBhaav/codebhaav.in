import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

function generateReferralCode(name: string): string {
	const alphanumeric = name.replace(/[^a-zA-Z0-9]/g, "");
	const prefix = alphanumeric.slice(0, 5).toUpperCase();
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let suffix = "";
	for (let i = 0; i < 4; i++) {
		suffix += chars[Math.floor(Math.random() * chars.length)];
	}
	return `${prefix}-${suffix}`;
}

function maskName(fullName: string): string {
	const parts = fullName.trim().split(/\s+/);
	if (parts.length === 0) return "***";

	const firstName = parts[0];
	const firstTwoChars = firstName.slice(0, 2);
	const lastCharOfFirst = firstName.slice(-1);

	if (parts.length === 1) {
		return `${firstTwoChars}***${lastCharOfFirst}`;
	}

	const lastName = parts[parts.length - 1];
	const lastInitial = lastName[0];
	return `${firstTwoChars}***${lastCharOfFirst} ${lastInitial}.`;
}

export const submitWaitlist = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		role: v.string(),
		otherRole: v.optional(v.string()),
		whatsapp: v.optional(v.string()),
		instagram: v.optional(v.string()),
		reason: v.string(),
		interests: v.array(v.string()),
		otherInterest: v.optional(v.string()),
		referredBy: v.optional(v.string()),
		imageUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("waitlist")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (existing) {
			throw new Error("Already on the waitlist");
		}

		const referralCode = generateReferralCode(args.name);

		if (args.referredBy) {
			const referrer = await ctx.db
				.query("waitlist")
				.withIndex("by_referralCode", (q) =>
					q.eq("referralCode", args.referredBy as string),
				)
				.first();

			if (referrer) {
				await ctx.db.patch(referrer._id, {
					referralCount: referrer.referralCount + 1,
				});
			}
		}

		const id = await ctx.db.insert("waitlist", {
			name: args.name,
			email: args.email,
			role: args.role,
			otherRole: args.otherRole,
			whatsapp: args.whatsapp,
			instagram: args.instagram,
			reason: args.reason,
			interests: args.interests,
			otherInterest: args.otherInterest,
			referralCode,
			referredBy: args.referredBy,
			referralCount: 0,
			imageUrl: args.imageUrl,
		});

		const allEntries = await ctx.db.query("waitlist").collect();
		const position = allEntries.length;

		await ctx.scheduler.runAfter(0, internal.email.sendWaitlistEmail, {
			name: args.name,
			email: args.email,
			position,
			referralCode,
		});

		return { id, referralCode, position };
	},
});

export const getPosition = query({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("waitlist")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (!user) {
			return null;
		}

		const earlierEntries = await ctx.db
			.query("waitlist")
			.filter((q) => q.lt(q.field("_creationTime"), user._creationTime))
			.collect();

		return { position: earlierEntries.length + 1 };
	},
});

export const getReferrals = query({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("waitlist")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (!user) {
			return null;
		}

		return {
			referralCount: user.referralCount,
			referralCode: user.referralCode,
		};
	},
});

/**
 * Public lookup used by the OG image renderer. Returns just the public
 * fields needed to paint a referral card — no email, role, or reason.
 */
export const getReferrerByCode = query({
	args: { code: v.string() },
	handler: async (ctx, args) => {
		const referrer = await ctx.db
			.query("waitlist")
			.withIndex("by_referralCode", (q) => q.eq("referralCode", args.code))
			.first();

		if (!referrer) return null;

		const firstName = (referrer.name ?? "").trim().split(/\s+/)[0] || "Someone";
		return {
			firstName,
			imageUrl: referrer.imageUrl ?? null,
			referralCount: referrer.referralCount,
		};
	},
});

export const getCount = query({
	args: {},
	handler: async (ctx) => {
		const allEntries = await ctx.db.query("waitlist").collect();
		return { count: allEntries.length };
	},
});

export const getTopReferrers = query({
	args: {},
	handler: async (ctx) => {
		const topReferrers = await ctx.db
			.query("waitlist")
			.withIndex("by_referralCount")
			.order("desc")
			.take(50);

		return topReferrers.map((entry) => ({
			name: maskName(entry.name),
			referralCount: entry.referralCount,
			referralCode: entry.referralCode,
		}));
	},
});
