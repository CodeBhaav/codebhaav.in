/**
 * Source-of-truth definitions for the Resend resources we manage:
 *  Topics   user-facing newsletter preferences
 *  Segments admin-side organizational buckets
 *  Properties custom contact fields used for personalization
 *
 * Slugs (the keys below) are stable identifiers we reference everywhere
 * in the app; Resend itself stores opaque UUIDs that we cache in the
 * `resendConfig` table after the bootstrap action runs.
 */

export type TopicSlug =
	| "community_updates"
	| "product_announcements"
	| "event_invitations"
	| "activity_updates"
	| "founders_only";

export type SegmentSlug =
	| "waitlist"
	| "founding_applicants"
	| "accepted_founders";

export type PropertyKey =
	| "role"
	| "position"
	| "referral_count"
	| "application_status"
	| "signed_up_at";

export interface TopicDef {
	slug: TopicSlug;
	name: string;
	description: string;
	default_subscription: "opt_in" | "opt_out";
	visibility: "public" | "private";
}

export const TOPICS: Record<TopicSlug, TopicDef> = {
	community_updates: {
		slug: "community_updates",
		name: "Community Updates",
		description:
			"Weekly community newsletter  what we're building, who's shipping, what we're reading.",
		default_subscription: "opt_in",
		visibility: "public",
	},
	product_announcements: {
		slug: "product_announcements",
		name: "Product Announcements",
		description:
			"Big launches, platform updates, and milestone news from CodeBhaav.",
		default_subscription: "opt_in",
		visibility: "public",
	},
	event_invitations: {
		slug: "event_invitations",
		name: "Event Invitations",
		description:
			"Meetups, AMAs, workshops, hackathons, and other community events.",
		default_subscription: "opt_out",
		visibility: "public",
	},
	activity_updates: {
		slug: "activity_updates",
		name: "Activity Updates",
		description:
			"Daily digest of your mentions, replies, and project updates  so you don't miss anything between sessions.",
		default_subscription: "opt_in",
		visibility: "public",
	},
	founders_only: {
		slug: "founders_only",
		name: "Founders Only",
		description:
			"Private updates and discussions for the founding cohort.",
		default_subscription: "opt_in",
		visibility: "private",
	},
};

/** Topics shown on the user-facing Settings page (excludes private). */
export const PUBLIC_TOPICS: TopicSlug[] = [
	"community_updates",
	"product_announcements",
	"event_invitations",
	"activity_updates",
];

/** Default subscription state for someone newly opted-in via a form. */
export function defaultTopicState(): Record<TopicSlug, boolean> {
	const out = {} as Record<TopicSlug, boolean>;
	for (const t of Object.values(TOPICS)) {
		out[t.slug] = t.default_subscription === "opt_in";
	}
	return out;
}

/** "Newsletter checkbox = false" state: every topic off. */
export function allTopicsOff(): Record<TopicSlug, boolean> {
	const out = {} as Record<TopicSlug, boolean>;
	for (const t of Object.values(TOPICS)) out[t.slug] = false;
	return out;
}

export interface SegmentDef {
	slug: SegmentSlug;
	name: string;
}

export const SEGMENTS: Record<SegmentSlug, SegmentDef> = {
	waitlist: { slug: "waitlist", name: "Waitlist" },
	founding_applicants: {
		slug: "founding_applicants",
		name: "Founding Applicants",
	},
	accepted_founders: {
		slug: "accepted_founders",
		name: "Accepted Founders",
	},
};

export interface PropertyDef {
	key: PropertyKey;
	type: "string" | "number";
	fallback_value?: string | number;
}

export const PROPERTIES: Record<PropertyKey, PropertyDef> = {
	role: { key: "role", type: "string" },
	position: { key: "position", type: "number" },
	referral_count: { key: "referral_count", type: "number", fallback_value: 0 },
	application_status: { key: "application_status", type: "string" },
	signed_up_at: { key: "signed_up_at", type: "string" },
};
