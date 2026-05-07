import { test, expect } from "@playwright/test";

// For each static prerendered page, the BaseLayout passes ogImage="/api/og.png?page=<key>".
// BaseLayout resolves it to an absolute URL via new URL(ogImage, Astro.url).
// The content attribute will be the absolute URL including the origin.
const OG_META_PAGES = [
	{ path: "/", expectedParam: "page=home" },
	{ path: "/mission", expectedParam: "page=mission" },
	{ path: "/leaderboard", expectedParam: "page=leaderboard" },
	{ path: "/contact", expectedParam: "page=contact" },
	{ path: "/founding-member", expectedParam: "page=founding-member" },
	{ path: "/privacy", expectedParam: "page=privacy" },
	{ path: "/terms", expectedParam: "page=terms" },
	{ path: "/projects", expectedParam: "page=projects" },
] as const;

test.describe("Per-page OG image meta", () => {
	for (const { path, expectedParam } of OG_META_PAGES) {
		test(`${path} has og:image containing "${expectedParam}"`, async ({ page }) => {
			await page.goto(path);

			const content = await page
				.locator('meta[property="og:image"]')
				.getAttribute("content");

			expect(content, `og:image should be set on ${path}`).not.toBeNull();
			expect(content).toContain(expectedParam);
		});
	}
});
