import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";

async function requireUser(ctx: QueryCtx): Promise<{ subject: string }> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new Error("Not authenticated");
	return identity;
}

const MAX_RESULTS = 8;

export interface MemberRecord {
	clerkUserId: string;
	name: string;
	username?: string;
}

/**
 * Extract `@<token>` substrings from a comment body. Tokens are word-
 * characters only (no spaces); they must follow start-of-string or
 * whitespace so we don't pick up email addresses.
 */
export function extractMentionTokens(body: string): string[] {
	const out: string[] = [];
	const re = /(^|\s)@(\w+)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(body)) !== null) {
		out.push(m[2]);
	}
	return out;
}

/**
 * Build a `token -> member` lookup keyed by lowercased first-name. Each
 * token resolves to the first member with that first name; self is
 * excluded. Use to auto-resolve mentions on submit when a user typed an
 * @-handle without selecting from the dropdown.
 *
 * Inefficient (full scans) but acceptable at our scale  the alternative
 * is a canonical users table which we don't have yet.
 */
export async function buildMemberLookup(
	ctx: QueryCtx | MutationCtx,
	excludeClerkUserId: string,
): Promise<Map<string, MemberRecord>> {
	const lookup = new Map<string, MemberRecord>();
	const byClerkId = new Map<string, MemberRecord>();

	const add = (
		clerkUserId: string | undefined,
		name: string | undefined,
		username?: string | undefined,
	) => {
		if (!clerkUserId || !name) return;
		if (clerkUserId === excludeClerkUserId) return;
		// Upgrade existing record if we now have a username.
		const existing = byClerkId.get(clerkUserId);
		const record: MemberRecord = {
			clerkUserId,
			name: existing?.name ?? name,
			username: username ?? existing?.username,
		};
		byClerkId.set(clerkUserId, record);
		// Index by username (preferred) and by first-name (fallback).
		if (record.username) {
			lookup.set(record.username.toLowerCase(), record);
		}
		const firstName = (record.name.split(/\s+/)[0] || "").toLowerCase();
		if (firstName && !lookup.has(firstName)) {
			lookup.set(firstName, record);
		}
	};

	for (const f of await ctx.db.query("foundingMember").collect()) {
		add(f.clerkUserId, f.name);
	}
	for (const c of await ctx.db.query("ideaComment").collect()) {
		add(c.clerkUserId, c.authorName, c.authorUsername);
	}
	for (const c of await ctx.db.query("projectComment").collect()) {
		add(c.clerkUserId, c.authorName, c.authorUsername);
	}
	for (const i of await ctx.db.query("projectInterest").collect()) {
		add(i.clerkUserId, i.userName);
	}
	for (const t of await ctx.db.query("projectBuildTeamMember").collect()) {
		add(t.clerkUserId, t.userName);
	}

	return lookup;
}

/**
 * Look up community members by name prefix for the @-mention typeahead.
 *
 * We don't have a canonical "users" table  members surface here in
 * decreasing order of canonical-ness:
 *   1. foundingMember rows (have both clerkUserId + name)
 *   2. Past comment authors on ideas + projects (also clerkUserId + name)
 *   3. Build team / project interest rows (same pair)
 *
 * Deduped by clerkUserId; first occurrence wins. Returns up to 8 matches
 * for prefix-or-substring matching, case-insensitive.
 *
 * Self is filtered out  no one needs to @-mention themselves.
 */
export const searchMembers = query({
	args: { prefix: v.string() },
	handler: async (ctx, args) => {
		const me = await requireUser(ctx);
		const q = args.prefix.trim().toLowerCase();
		if (q.length === 0) return [];

		const seen = new Map<string, MemberRecord>();

		const push = (
			clerkUserId: string | undefined,
			name: string,
			username?: string,
		) => {
			if (!clerkUserId) return;
			if (clerkUserId === me.subject) return;
			if (!name) return;
			const usernameMatch =
				typeof username === "string" && username.toLowerCase().includes(q);
			const nameMatch = name.toLowerCase().includes(q);
			if (!usernameMatch && !nameMatch) return;
			// Allow upgrading an earlier match if we now have a username.
			const existing = seen.get(clerkUserId);
			seen.set(clerkUserId, {
				clerkUserId,
				name: existing?.name ?? name,
				username: username ?? existing?.username,
			});
		};

		const founding = await ctx.db.query("foundingMember").collect();
		for (const f of founding) push(f.clerkUserId, f.name);

		const ideaComments = await ctx.db.query("ideaComment").collect();
		for (const c of ideaComments)
			push(c.clerkUserId, c.authorName, c.authorUsername);

		const projectComments = await ctx.db.query("projectComment").collect();
		for (const c of projectComments)
			push(c.clerkUserId, c.authorName, c.authorUsername);

		const interests = await ctx.db.query("projectInterest").collect();
		for (const i of interests) push(i.clerkUserId, i.userName);

		const teamMembers = await ctx.db.query("projectBuildTeamMember").collect();
		for (const m of teamMembers) push(m.clerkUserId, m.userName);

		return Array.from(seen.values()).slice(0, MAX_RESULTS);
	},
});
