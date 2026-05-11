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

	const add = (clerkUserId: string | undefined, name: string | undefined) => {
		if (!clerkUserId || !name) return;
		if (clerkUserId === excludeClerkUserId) return;
		const firstName = (name.split(/\s+/)[0] || "").toLowerCase();
		if (!firstName) return;
		if (!lookup.has(firstName)) {
			lookup.set(firstName, { clerkUserId, name });
		}
	};

	for (const f of await ctx.db.query("foundingMember").collect()) {
		add(f.clerkUserId, f.name);
	}
	for (const c of await ctx.db.query("ideaComment").collect()) {
		add(c.clerkUserId, c.authorName);
	}
	for (const c of await ctx.db.query("projectComment").collect()) {
		add(c.clerkUserId, c.authorName);
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

		const seen = new Map<string, string>();

		const push = (clerkUserId: string | undefined, name: string) => {
			if (!clerkUserId) return;
			if (clerkUserId === me.subject) return;
			if (seen.has(clerkUserId)) return;
			if (!name) return;
			if (!name.toLowerCase().includes(q)) return;
			seen.set(clerkUserId, name);
		};

		const founding = await ctx.db.query("foundingMember").collect();
		for (const f of founding) push(f.clerkUserId, f.name);
		if (seen.size >= MAX_RESULTS) {
			return Array.from(seen.entries(), ([clerkUserId, name]) => ({
				clerkUserId,
				name,
			})).slice(0, MAX_RESULTS);
		}

		const ideaComments = await ctx.db.query("ideaComment").collect();
		for (const c of ideaComments) push(c.clerkUserId, c.authorName);
		if (seen.size >= MAX_RESULTS) {
			return Array.from(seen.entries(), ([clerkUserId, name]) => ({
				clerkUserId,
				name,
			})).slice(0, MAX_RESULTS);
		}

		const projectComments = await ctx.db.query("projectComment").collect();
		for (const c of projectComments) push(c.clerkUserId, c.authorName);
		if (seen.size >= MAX_RESULTS) {
			return Array.from(seen.entries(), ([clerkUserId, name]) => ({
				clerkUserId,
				name,
			})).slice(0, MAX_RESULTS);
		}

		const interests = await ctx.db.query("projectInterest").collect();
		for (const i of interests) push(i.clerkUserId, i.userName);

		const teamMembers = await ctx.db.query("projectBuildTeamMember").collect();
		for (const m of teamMembers) push(m.clerkUserId, m.userName);

		return Array.from(seen.entries(), ([clerkUserId, name]) => ({
			clerkUserId,
			name,
		})).slice(0, MAX_RESULTS);
	},
});
