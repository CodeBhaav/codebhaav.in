/**
 * Canonical category tags applied to ideas and projects.
 *
 * Keep this list short and stable  filters depend on it. Adding a new
 * key is fine; renaming or removing one would orphan existing rows
 * (they'd just stop matching any filter, no data loss).
 */
export type CategoryKey =
	| "web"
	| "mobile"
	| "ai"
	| "tooling"
	| "infra"
	| "game"
	| "other";

interface CategoryDef {
	key: CategoryKey;
	label: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryDef> = {
	web: { key: "web", label: "Web" },
	mobile: { key: "mobile", label: "Mobile" },
	ai: { key: "ai", label: "AI" },
	tooling: { key: "tooling", label: "Tooling" },
	infra: { key: "infra", label: "Infra" },
	game: { key: "game", label: "Game" },
	other: { key: "other", label: "Other" },
};

export const CATEGORY_KEYS: CategoryKey[] = [
	"web",
	"mobile",
	"ai",
	"tooling",
	"infra",
	"game",
	"other",
];

export const MAX_CATEGORIES_PER_ROW = 2;

const VALID_KEY_SET = new Set<string>(CATEGORY_KEYS);

/** Normalize an incoming string[] from a mutation arg into stored shape. */
export function normalizeCategories(input: string[] | undefined): string[] | undefined {
	if (!input) return undefined;
	const seen = new Set<string>();
	for (const raw of input) {
		const key = raw.trim().toLowerCase();
		if (!VALID_KEY_SET.has(key)) continue;
		seen.add(key);
		if (seen.size >= MAX_CATEGORIES_PER_ROW) break;
	}
	return Array.from(seen);
}
