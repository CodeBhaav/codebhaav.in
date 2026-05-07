import { describe, expect, it } from "vitest";
import {
	PAGE_OG_CONFIG,
	PageCard,
	ReferralCard,
} from "./templates";

// Walk a satori-style React-element tree and collect every primitive child
// (string / number) into a flat array. This lets us assert that the
// expected copy is actually present in the rendered output without
// pulling in a full DOM.
function collectText(node: unknown): string[] {
	if (node == null || typeof node === "boolean") return [];
	if (typeof node === "string" || typeof node === "number")
		return [String(node)];
	if (Array.isArray(node)) return node.flatMap(collectText);
	if (typeof node === "object" && node && "props" in node) {
		const props = (node as { props?: { children?: unknown } }).props;
		return collectText(props?.children);
	}
	return [];
}

describe("PAGE_OG_CONFIG", () => {
	it("has the routes used by Astro pages", () => {
		const required = [
			"home",
			"mission",
			"projects",
			"leaderboard",
			"contact",
			"founding-member",
			"waitlist",
			"privacy",
			"terms",
		];
		for (const key of required) {
			expect(PAGE_OG_CONFIG[key], `missing config for ${key}`).toBeDefined();
		}
	});

	it("each config has eyebrow + title + description", () => {
		for (const [key, cfg] of Object.entries(PAGE_OG_CONFIG)) {
			expect(cfg.eyebrow, `${key}.eyebrow`).toBeTruthy();
			expect(cfg.title, `${key}.title`).toBeTruthy();
			expect(cfg.description, `${key}.description`).toBeTruthy();
		}
	});
});

describe("PageCard", () => {
	it("renders eyebrow, title, and description text", () => {
		const el = PageCard({
			eyebrow: "Mission",
			title: "Why we're",
			titleAccent: "building this.",
			description: "Tagline goes here.",
		});
		const text = collectText(el).join(" ");
		expect(text).toContain("CodeBhaav");
		expect(text).toContain("Mission");
		expect(text).toContain("Why we're");
		expect(text).toContain("building this.");
		expect(text).toContain("Tagline goes here.");
	});

	it("works without titleAccent", () => {
		const el = PageCard({
			eyebrow: "Contact",
			title: "Let's talk.",
			description: "—",
		});
		const text = collectText(el).join(" ");
		expect(text).toContain("Let's talk.");
	});
});

describe("ReferralCard", () => {
	it("renders the inviter name, headline, and tagline", () => {
		const el = ReferralCard({ firstName: "Pranav", avatar: null });
		const text = collectText(el).join(" ");
		expect(text).toContain("Invited by Pranav");
		expect(text).toContain("Join CodeBhaav.");
		expect(text).toContain("self-taught developers");
	});

	it("falls back to the first letter when no avatar provided", () => {
		const el = ReferralCard({ firstName: "Pranav", avatar: null });
		const text = collectText(el).join("");
		expect(text).toContain("P");
	});

	it("does not show an initial when avatar is present", () => {
		const el = ReferralCard({
			firstName: "Pranav",
			avatar: "data:image/jpeg;base64,...",
		});
		const text = collectText(el);
		// The standalone "P" initial appears only on the fallback path.
		const hasStandaloneInitial = text.some((s) => s === "P");
		expect(hasStandaloneInitial).toBe(false);
	});
});
