import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { PropertyKey, SegmentSlug, TopicSlug } from "./resendResources";

const kindValidator = v.union(
	v.literal("topic"),
	v.literal("segment"),
	v.literal("property"),
);

export const setId = internalMutation({
	args: {
		kind: kindValidator,
		slug: v.string(),
		resendId: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("resendConfig")
			.withIndex("by_kind_slug", (q) =>
				q.eq("kind", args.kind).eq("slug", args.slug),
			)
			.first();
		const updatedAt = Date.now();
		if (existing) {
			await ctx.db.patch(existing._id, { resendId: args.resendId, updatedAt });
		} else {
			await ctx.db.insert("resendConfig", {
				kind: args.kind,
				slug: args.slug,
				resendId: args.resendId,
				updatedAt,
			});
		}
	},
});

export interface ResendConfigSnapshot {
	topics: Partial<Record<TopicSlug, string>>;
	segments: Partial<Record<SegmentSlug, string>>;
	properties: Partial<Record<PropertyKey, string>>;
}

export const getAll = internalQuery({
	args: {},
	handler: async (ctx): Promise<ResendConfigSnapshot> => {
		const rows = await ctx.db.query("resendConfig").collect();
		const topics: Partial<Record<TopicSlug, string>> = {};
		const segments: Partial<Record<SegmentSlug, string>> = {};
		const properties: Partial<Record<PropertyKey, string>> = {};
		for (const row of rows) {
			if (row.kind === "topic") topics[row.slug as TopicSlug] = row.resendId;
			else if (row.kind === "segment")
				segments[row.slug as SegmentSlug] = row.resendId;
			else if (row.kind === "property")
				properties[row.slug as PropertyKey] = row.resendId;
		}
		return { topics, segments, properties };
	},
});
