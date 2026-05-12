import { test, expect, type ConsoleMessage } from "@playwright/test";

/**
 * Smoke pass over every public route. Fails if any page emits:
 *
 *   - A `pageerror` event (uncaught exception during render/hydration)
 *   - A console error matching one of the FATAL_PATTERNS (these are bugs,
 *     not noise; we don't filter them out)
 *   - The shared ErrorBoundary's "Something went wrong in <Name>" string
 *     in the rendered DOM (caught-but-displayed runtime errors)
 *
 * Existed-because: two regressions slipped through the prior console
 * filter that masked anything mentioning "clerk" / "convex":
 *
 *   1. NotificationBell calling `useQuery` during SSR with no
 *      ConvexProvider in scope ("Could not find Convex client").
 *   2. NavbarIsland and a page island both mounting <ClerkProvider>
 *      ("You've added multiple <ClerkProvider>").
 *
 * Keep the FATAL_PATTERNS list tight; matches mean a real production
 * bug. Add new ones as we hit new failure modes.
 */
const FATAL_PATTERNS: RegExp[] = [
	/could not find convex client/i,
	/multiple <ClerkProvider>/i,
	/Cannot read propert(y|ies) of (undefined|null)/i,
	/is not a function/i,
	/is not defined/i,
	/Maximum update depth/i,
	/Hydration failed/i,
	/Text content does not match server-rendered HTML/i,
];

const ROUTES: Array<{ path: string; label: string }> = [
	{ path: "/", label: "home" },
	{ path: "/mission", label: "mission" },
	{ path: "/projects", label: "projects list" },
	{ path: "/ideas", label: "ideas list" },
	{ path: "/leaderboard", label: "leaderboard" },
	{ path: "/contact", label: "contact" },
	{ path: "/waitlist", label: "waitlist" },
	{ path: "/founding-member", label: "founding-member" },
	{ path: "/privacy", label: "privacy" },
	{ path: "/terms", label: "terms" },
];

function isFatalMessage(text: string): boolean {
	return FATAL_PATTERNS.some((re) => re.test(text));
}

function captureFailures(page: import("@playwright/test").Page): {
	pageerrors: string[];
	fatalConsole: string[];
} {
	const pageerrors: string[] = [];
	const fatalConsole: string[] = [];

	page.on("pageerror", (err) => {
		pageerrors.push(`${err.name}: ${err.message}`);
	});

	page.on("console", (msg: ConsoleMessage) => {
		if (msg.type() !== "error") return;
		const text = msg.text();
		if (isFatalMessage(text)) {
			fatalConsole.push(text);
		}
	});

	return { pageerrors, fatalConsole };
}

test.describe("Runtime error budget — public routes", () => {
	for (const route of ROUTES) {
		test(`${route.label} (${route.path}) has no runtime errors`, async ({
			page,
		}) => {
			const { pageerrors, fatalConsole } = captureFailures(page);

			await page.goto(route.path, { waitUntil: "domcontentloaded" });
			// Give React islands a chance to hydrate; networkidle lets Convex
			// websockets settle so post-hydration query failures surface.
			await page.waitForLoadState("networkidle", { timeout: 15_000 });

			// ErrorBoundary renders this when a child throws  catches the
			// "multiple <ClerkProvider>" UI seen in production where the
			// throw was swallowed by the boundary but visibly broke the page.
			const errorBoundary = page.getByText(/^Something went wrong in /);
			await expect(
				errorBoundary,
				`ErrorBoundary surfaced on ${route.path}`,
			).toHaveCount(0);

			expect(
				pageerrors,
				`Uncaught exceptions on ${route.path}: ${pageerrors.join(" | ")}`,
			).toEqual([]);

			expect(
				fatalConsole,
				`Fatal console errors on ${route.path}: ${fatalConsole.join(" | ")}`,
			).toEqual([]);
		});
	}
});

test.describe("Runtime error budget — dynamic routes", () => {
	test("/u/[unknown-username] renders not-found without errors", async ({
		page,
	}) => {
		const { pageerrors, fatalConsole } = captureFailures(page);

		await page.goto("/u/this-user-does-not-exist", {
			waitUntil: "domcontentloaded",
		});
		await page.waitForLoadState("networkidle", { timeout: 15_000 });

		const errorBoundary = page.getByText(/^Something went wrong in /);
		await expect(errorBoundary).toHaveCount(0);
		expect(pageerrors).toEqual([]);
		expect(fatalConsole).toEqual([]);

		// Sanity: the page should render the 'no one with that username' state.
		await expect(
			page.getByText(/No one with that username yet/i),
		).toBeVisible();
	});

	test("/projects/[unknown-slug] renders not-found without errors", async ({
		page,
	}) => {
		const { pageerrors, fatalConsole } = captureFailures(page);

		await page.goto("/projects/this-slug-does-not-exist", {
			waitUntil: "domcontentloaded",
		});
		await page.waitForLoadState("networkidle", { timeout: 15_000 });

		const errorBoundary = page.getByText(/^Something went wrong in /);
		await expect(errorBoundary).toHaveCount(0);
		expect(pageerrors).toEqual([]);
		expect(fatalConsole).toEqual([]);

		await expect(page.getByText(/Project not found/i)).toBeVisible();
	});
});

test.describe("Runtime error budget — protected routes", () => {
	// Signed-out visitors should be redirected, not error out.
	const PROTECTED = [
		"/dashboard",
		"/dashboard/settings",
		"/dashboard/notifications",
		"/admin",
	];
	for (const path of PROTECTED) {
		test(`signed-out visit to ${path} redirects without errors`, async ({
			page,
		}) => {
			const { pageerrors, fatalConsole } = captureFailures(page);

			await page.goto(path, { waitUntil: "domcontentloaded" });
			await page.waitForLoadState("networkidle", { timeout: 15_000 });

			// We don't assert the final URL  Clerk handles routing  but we
			// do assert no errors fired during the redirect dance.
			const errorBoundary = page.getByText(/^Something went wrong in /);
			await expect(errorBoundary).toHaveCount(0);
			expect(pageerrors).toEqual([]);
			expect(fatalConsole).toEqual([]);
		});
	}
});
