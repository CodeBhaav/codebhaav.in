import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Load .env.local into process.env if not already populated. Astro
 * auto-loads this file at runtime, but Playwright's globalSetup and
 * helper modules run outside of Astro's bootstrap, so they don't see
 * the variables. We re-parse the same file here (one-shot, no deps).
 *
 * Skips any key that's already set in process.env so explicit
 * environment vars (CI secrets) win over the local file. Values are
 * intentionally NOT exported  this exists only for its side effect.
 */
function loadEnvLocalOnce(): void {
	const path = resolve(process.cwd(), ".env.local");
	if (!existsSync(path)) return;
	const raw = readFileSync(path, "utf8");
	for (const line of raw.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq <= 0) continue;
		const key = trimmed.slice(0, eq).trim();
		if (key in process.env) continue;
		let value = trimmed.slice(eq + 1).trim();
		// Strip surrounding quotes (matches dotenv behavior).
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		process.env[key] = value;
	}
}

loadEnvLocalOnce();
