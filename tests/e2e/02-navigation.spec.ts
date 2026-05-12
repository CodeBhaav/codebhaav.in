import { test, expect } from "@playwright/test";

const NAV_LINKS = [
	// headingPattern matches against the full text content of the page's <h1>.
	// Source: PageHeader eyebrow+title+titleAccent props from each page file.
	{ name: "Mission", href: "/mission", headingPattern: /why we're/i },
	{ name: "Projects", href: "/projects", headingPattern: /nothing.s shipped yet/i },
	{ name: "Leaderboard", href: "/leaderboard", headingPattern: /climb the line/i },
	{ name: "Contact", href: "/contact", headingPattern: /say hello/i },
] as const;

test.describe("Desktop navigation", () => {
	for (const link of NAV_LINKS) {
		test(`clicking "${link.name}" nav link navigates to ${link.href}`, async ({ page }) => {
			await page.goto("/");

			// Wait for the React Navbar island to hydrate before clicking
			await page.waitForSelector("nav", { state: "visible" });

			// Click the desktop nav link (hidden md:flex nav — only visible at desktop viewport)
			await page.getByRole("navigation").getByRole("link", { name: link.name }).click();

			await expect(page).toHaveURL(link.href);

			// Each destination has at least one <h1> visible and its text matches
			const h1 = page.getByRole("heading", { level: 1 }).first();
			await expect(h1).toBeVisible();
			await expect(h1).toHaveText(link.headingPattern);
		});
	}

	test("no console errors on home page load", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto("/");
		// Allow React islands to hydrate
		await page.waitForLoadState("networkidle");

		// Targeted noise filter. Used to be a blanket "clerk OR convex OR
		// WebSocket" filter which silently masked the regressions caught by
		// 09-runtime-errors.spec.ts (Could not find Convex client; multiple
		// <ClerkProvider>). Keep this allow-list short and specific so any
		// new clerk/convex error fails the test.
		const NOISE = [
			/favicon/i,
			/Failed to load resource.*posthog/i,
			/Clerk has been loaded with development keys/i,
		];
		const realErrors = consoleErrors.filter(
			(e) => !NOISE.some((re) => re.test(e)),
		);

		expect(
			realErrors,
			`Unexpected console errors: ${realErrors.join(", ")}`,
		).toHaveLength(0);
	});
});
