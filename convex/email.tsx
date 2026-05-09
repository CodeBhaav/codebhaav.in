"use node";

import { v } from "convex/values";
import * as React from "react";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import {
	PROPERTIES,
	type PropertyKey,
	SEGMENTS,
	type SegmentSlug,
	TOPICS,
	type TopicSlug,
} from "./resendResources";
import { AccountWelcomeEmail } from "./emails/AccountWelcomeEmail";
import { ApplicationAcceptedEmail } from "./emails/ApplicationAcceptedEmail";
import { ApplicationRejectedEmail } from "./emails/ApplicationRejectedEmail";
import { FoundingMemberEmail } from "./emails/FoundingMemberEmail";
import { TestEmail } from "./emails/TestEmail";
import { WaitlistEmail } from "./emails/WaitlistEmail";

const FROM = "CodeBhaav <noreply@codebhaav.in>";
const SITE_URL = "https://www.codebhaav.in";

function getResend(): Resend {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("RESEND_API_KEY environment variable is not set");
	}
	return new Resend(apiKey);
}

function splitName(fullName: string | undefined): {
	firstName?: string;
	lastName?: string;
} {
	const trimmed = (fullName ?? "").trim();
	if (!trimmed) return {};
	const parts = trimmed.split(/\s+/);
	if (parts.length === 1) return { firstName: parts[0] };
	return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/* ─────────────────────────────────────────────────────────────────────
 *  Resend Audiences (v2 model)  Topics + Segments + Properties
 * ───────────────────────────────────────────────────────────────────── */

const propertiesValidator = v.object({
	role: v.optional(v.string()),
	position: v.optional(v.number()),
	referral_count: v.optional(v.number()),
	application_status: v.optional(v.string()),
	signed_up_at: v.optional(v.string()),
});

const topicsValidator = v.object({
	community_updates: v.optional(v.boolean()),
	product_announcements: v.optional(v.boolean()),
	event_invitations: v.optional(v.boolean()),
	founders_only: v.optional(v.boolean()),
});

const segmentSlugValidator = v.union(
	v.literal("waitlist"),
	v.literal("founding_applicants"),
	v.literal("accepted_founders"),
);

/**
 * Idempotent setup: lists existing Resend topics, segments, and contact
 * properties; creates anything missing for the slugs defined in
 * `resendResources.ts`; caches the resulting Resend IDs in the
 * `resendConfig` table. Safe to re-run.
 *
 * Invoke from the Convex CLI once after deploy:
 *   npx convex run email:bootstrapResendResources
 */
export const bootstrapResendResources = internalAction({
	args: {},
	handler: async (ctx) => {
		const resend = getResend();
		// Resend's contact-property endpoints rate-limit at 5 req/sec; keep
		// every write at >=250ms apart to stay safely under the cap.
		const sleep = (ms: number) =>
			new Promise<void>((r) => setTimeout(r, ms));

		// 1. Properties
		const propsRes = await resend.contactProperties.list();
		if (propsRes.error) {
			throw new Error(
				`List contact properties: ${propsRes.error.message}`,
			);
		}
		const existingPropKeys = new Set(
			(propsRes.data?.data ?? []).map((p) => p.key),
		);
		for (const def of Object.values(PROPERTIES)) {
			if (existingPropKeys.has(def.key)) continue;
			const created =
				def.type === "number"
					? await resend.contactProperties.create({
							key: def.key,
							type: "number",
							fallbackValue:
								typeof def.fallback_value === "number"
									? def.fallback_value
									: null,
						})
					: await resend.contactProperties.create({
							key: def.key,
							type: "string",
							fallbackValue:
								typeof def.fallback_value === "string"
									? def.fallback_value
									: null,
						});
			if (created.error) {
				throw new Error(
					`Create property ${def.key}: ${created.error.message}`,
				);
			}
			await sleep(250);
		}

		// 2. Topics  match by name (Resend doesn't expose slugs)
		const topicsRes = await resend.topics.list();
		if (topicsRes.error) {
			throw new Error(`List topics: ${topicsRes.error.message}`);
		}
		const existingTopicByName = new Map(
			(topicsRes.data?.data ?? []).map((t) => [t.name, t]),
		);
		for (const def of Object.values(TOPICS)) {
			const existing = existingTopicByName.get(def.name);
			if (existing) {
				await ctx.runMutation(internal.resendConfig.setId, {
					kind: "topic",
					slug: def.slug,
					resendId: existing.id,
				});
				continue;
			}
			const created = await resend.topics.create({
				name: def.name,
				description: def.description,
				defaultSubscription: def.default_subscription,
			});
			if (created.error || !created.data) {
				throw new Error(
					`Create topic ${def.slug}: ${created.error?.message ?? "no data"}`,
				);
			}
			await ctx.runMutation(internal.resendConfig.setId, {
				kind: "topic",
				slug: def.slug,
				resendId: created.data.id,
			});
			await sleep(250);
		}

		// 3. Segments  match by name
		const segRes = await resend.segments.list();
		if (segRes.error) {
			throw new Error(`List segments: ${segRes.error.message}`);
		}
		const existingSegmentByName = new Map(
			(segRes.data?.data ?? []).map((s) => [s.name, s]),
		);
		for (const def of Object.values(SEGMENTS)) {
			const existing = existingSegmentByName.get(def.name);
			if (existing) {
				await ctx.runMutation(internal.resendConfig.setId, {
					kind: "segment",
					slug: def.slug,
					resendId: existing.id,
				});
				continue;
			}
			const created = await resend.segments.create({ name: def.name });
			if (created.error || !created.data) {
				throw new Error(
					`Create segment ${def.slug}: ${created.error?.message ?? "no data"}`,
				);
			}
			await ctx.runMutation(internal.resendConfig.setId, {
				kind: "segment",
				slug: def.slug,
				resendId: created.data.id,
			});
			await sleep(250);
		}

		return { ok: true };
	},
});

/**
 * Single high-level sync. Fans out to: contact upsert (with properties),
 * segment add/remove (idempotent diff), and topic patch.
 *
 * - `addSegments` / `removeSegments` use SegmentSlug; the action resolves
 *   slugs to Resend IDs from `resendConfig`.
 * - `topics` is a partial map  only the topics named are patched.
 *   Unspecified topics keep their current subscription state.
 *
 * Soft-skips when bootstrap hasn't run (no IDs in resendConfig).
 */
export const syncContact = internalAction({
	args: {
		email: v.string(),
		name: v.optional(v.string()),
		properties: v.optional(propertiesValidator),
		addSegments: v.optional(v.array(segmentSlugValidator)),
		removeSegments: v.optional(v.array(segmentSlugValidator)),
		topics: v.optional(topicsValidator),
	},
	handler: async (ctx, args) => {
		const config = await ctx.runQuery(internal.resendConfig.getAll, {});
		const topicIds = config.topics;
		const segmentIds = config.segments;

		const haveTopics = Object.keys(topicIds).length > 0;
		const haveSegments = Object.keys(segmentIds).length > 0;
		if (!haveTopics && !haveSegments) {
			console.warn(
				"Resend resources not bootstrapped  run `npx convex run email:bootstrapResendResources` first; skipping syncContact",
			);
			return;
		}

		const resend = getResend();
		const { firstName, lastName } = splitName(args.name);
		const propertiesPayload = filterUndefined(args.properties ?? {});

		const topicsForCreate = mapTopics(args.topics, topicIds);
		const segmentsForCreate = (args.addSegments ?? [])
			.map((slug) => segmentIds[slug])
			.filter((id): id is string => Boolean(id))
			.map((id) => ({ id }));

		// Try existing contact first
		const getRes = await resend.contacts.get({ email: args.email });
		const existing = getRes.data;

		if (!existing) {
			// New contact  one-shot create with everything inline
			const createRes = await resend.contacts.create({
				email: args.email,
				firstName,
				lastName,
				...(Object.keys(propertiesPayload).length
					? { properties: propertiesPayload }
					: {}),
				...(segmentsForCreate.length ? { segments: segmentsForCreate } : {}),
				...(topicsForCreate.length ? { topics: topicsForCreate } : {}),
			});
			if (createRes.error) {
				throw new Error(
					`Resend create contact ${args.email}: ${createRes.error.message}`,
				);
			}
			return;
		}

		// Existing contact  patch what changed
		if (
			Object.keys(propertiesPayload).length > 0 ||
			firstName !== undefined ||
			lastName !== undefined
		) {
			const updateRes = await resend.contacts.update({
				email: args.email,
				...(firstName !== undefined ? { firstName } : {}),
				...(lastName !== undefined ? { lastName } : {}),
				...(Object.keys(propertiesPayload).length
					? { properties: propertiesPayload }
					: {}),
			});
			if (updateRes.error) {
				throw new Error(
					`Resend update contact ${args.email}: ${updateRes.error.message}`,
				);
			}
		}

		if (topicsForCreate.length > 0) {
			const topicRes = await resend.contacts.topics.update({
				email: args.email,
				topics: topicsForCreate,
			});
			if (topicRes.error) {
				throw new Error(
					`Resend update topics ${args.email}: ${topicRes.error.message}`,
				);
			}
		}

		// Segments  diff against current and apply (idempotent)
		const desiredAddIds = new Set(
			(args.addSegments ?? [])
				.map((slug) => segmentIds[slug])
				.filter((id): id is string => Boolean(id)),
		);
		const desiredRemoveIds = new Set(
			(args.removeSegments ?? [])
				.map((slug) => segmentIds[slug])
				.filter((id): id is string => Boolean(id)),
		);

		if (desiredAddIds.size > 0 || desiredRemoveIds.size > 0) {
			const currentRes = await resend.contacts.segments.list({
				email: args.email,
			});
			if (currentRes.error) {
				throw new Error(
					`List contact segments ${args.email}: ${currentRes.error.message}`,
				);
			}
			const currentIds = new Set(
				(currentRes.data?.data ?? []).map((s) => s.id),
			);
			for (const id of desiredAddIds) {
				if (!currentIds.has(id)) {
					const r = await resend.contacts.segments.add({
						email: args.email,
						segmentId: id,
					});
					if (r.error) {
						throw new Error(
							`Add segment ${id} -> ${args.email}: ${r.error.message}`,
						);
					}
				}
			}
			for (const id of desiredRemoveIds) {
				if (currentIds.has(id)) {
					const r = await resend.contacts.segments.remove({
						email: args.email,
						segmentId: id,
					});
					if (r.error) {
						throw new Error(
							`Remove segment ${id} <- ${args.email}: ${r.error.message}`,
						);
					}
				}
			}
		}
	},
});

function filterUndefined<T extends Record<string, unknown>>(
	obj: T,
): Record<string, string | number> {
	const out: Record<string, string | number> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (v === undefined || v === null) continue;
		if (typeof v === "string" || typeof v === "number") out[k] = v;
	}
	return out;
}

function mapTopics(
	topics: Partial<Record<TopicSlug, boolean | undefined>> | undefined,
	topicIds: Partial<Record<TopicSlug, string>>,
): Array<{ id: string; subscription: "opt_in" | "opt_out" }> {
	if (!topics) return [];
	const out: Array<{ id: string; subscription: "opt_in" | "opt_out" }> = [];
	for (const [slug, sub] of Object.entries(topics) as Array<
		[TopicSlug, boolean | undefined]
	>) {
		if (sub === undefined) continue;
		const id = topicIds[slug];
		if (!id) continue;
		out.push({ id, subscription: sub ? "opt_in" : "opt_out" });
	}
	return out;
}

// Suppress unused import warnings  these types are referenced in JSDoc.
export type { PropertyKey, SegmentSlug, TopicSlug };

export const sendWaitlistEmail = internalAction({
	args: {
		name: v.string(),
		email: v.string(),
		position: v.number(),
		referralCode: v.string(),
	},
	handler: async (_ctx, args) => {
		const referralLink = `${SITE_URL}/waitlist?ref=${args.referralCode}`;

		const result = await getResend().emails.send({
			from: FROM,
			to: args.email,
			subject: `You're #${args.position} on the CodeBhaav waitlist`,
			react: (
				<WaitlistEmail
					name={args.name}
					position={args.position}
					referralLink={referralLink}
				/>
			),
		});

		if (result.error) {
			throw new Error(
				`Resend error: ${result.error.name} — ${result.error.message}`,
			);
		}
	},
});

export const sendFoundingMemberEmail = internalAction({
	args: {
		name: v.string(),
		email: v.string(),
	},
	handler: async (_ctx, args) => {
		const result = await getResend().emails.send({
			from: FROM,
			to: args.email,
			subject: `We received your application, ${args.name}`,
			react: <FoundingMemberEmail name={args.name} />,
		});

		if (result.error) {
			throw new Error(
				`Resend error: ${result.error.name} — ${result.error.message}`,
			);
		}
	},
});

export const sendApplicationAcceptedEmail = internalAction({
	args: {
		name: v.string(),
		email: v.string(),
	},
	handler: async (_ctx, args) => {
		const result = await getResend().emails.send({
			from: FROM,
			to: args.email,
			subject: `You're in. Welcome to the CodeBhaav founding cohort`,
			react: <ApplicationAcceptedEmail name={args.name} />,
		});

		if (result.error) {
			throw new Error(
				`Resend error: ${result.error.name} — ${result.error.message}`,
			);
		}
	},
});

export const sendApplicationRejectedEmail = internalAction({
	args: {
		name: v.string(),
		email: v.string(),
	},
	handler: async (_ctx, args) => {
		const result = await getResend().emails.send({
			from: FROM,
			to: args.email,
			subject: `An update on your CodeBhaav founding-member application`,
			react: <ApplicationRejectedEmail name={args.name} />,
		});

		if (result.error) {
			throw new Error(
				`Resend error: ${result.error.name} — ${result.error.message}`,
			);
		}
	},
});

export const sendAccountWelcomeEmail = internalAction({
	args: {
		name: v.string(),
		email: v.string(),
	},
	handler: async (_ctx, args) => {
		const result = await getResend().emails.send({
			from: FROM,
			to: args.email,
			subject: `Welcome to CodeBhaav, ${args.name}`,
			react: <AccountWelcomeEmail name={args.name} />,
		});

		if (result.error) {
			throw new Error(
				`Resend error: ${result.error.name} — ${result.error.message}`,
			);
		}
	},
});

export const sendTestEmail = internalAction({
	args: {
		email: v.string(),
	},
	handler: async (_ctx, args) => {
		const result = await getResend().emails.send({
			from: FROM,
			to: args.email,
			subject: "[Test] CodeBhaav email pipeline check",
			react: <TestEmail sentAt={new Date().toISOString()} />,
		});

		if (result.error) {
			throw new Error(
				`Resend error: ${result.error.name} — ${result.error.message}`,
			);
		}
	},
});
