import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";
import {
	getSignedInCreds,
	signInAndGoto,
} from "./helpers/clerk-auth";

/**
 * Authenticated counterpart to 09-runtime-errors.spec.ts. The
 * multi-<ClerkProvider> regression that prompted this suite only
 * surfaced for signed-in users (the buggy NavbarIsland only mounted
 * Providers when `isSignedIn`), so the anonymous spec couldn't see it.
 *
 * Each test signs in fresh, navigates to a protected/authenticated
 * route, and asserts:
 *
 *   - No `pageerror` events (uncaught exceptions during render or
 *     hydration  this is what would have caught the original Clerk
 *     dup since the duplicate-provider exception bubbles to React's
 *     error boundary and re-throws if uncaught).
 *   - No fatal console patterns (could-not-find-Convex, multiple
 *     ClerkProvider, hydration mismatch, etc.).
 *   - No visible ErrorBoundary "Something went wrong in …" state.
 *
 * Skips itself silently when test creds aren't set so the default
 * `pnpm e2e` flow stays green for contributors without a Clerk test
 * user. See tests/e2e/helpers/clerk-auth.ts for the env vars.
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

const SIGNED_IN_ROUTES: Array<{ path: string; label: string }> = [
	{ path: "/dashboard", label: "dashboard" },
	{ path: "/dashboard/settings", label: "dashboard settings" },
	{ path: "/dashboard/notifications", label: "dashboard notifications inbox" },
	// Public routes  authenticated visit. These are exactly where the
	// original multi-<ClerkProvider> regression appeared because the
	// page island AND the navbar both mounted their own provider.
	{ path: "/", label: "home (signed-in)" },
	{ path: "/projects", label: "projects list (signed-in)" },
	{ path: "/ideas", label: "ideas list (signed-in)" },
	{ path: "/mission", label: "mission (signed-in)" },
	{ path: "/leaderboard", label: "leaderboard (signed-in)" },
	{ path: "/founding-member", label: "founding-member (signed-in)" },
];

function attachErrorCaptures(page: Page): {
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
		if (FATAL_PATTERNS.some((re) => re.test(text))) {
			fatalConsole.push(text);
		}
	});
	return { pageerrors, fatalConsole };
}

test.describe("Runtime error budget — signed in", () => {
	// Per-spec skip: surfaces a clear "skipped because creds missing"
	// reason in the report instead of silently passing.
	test.beforeAll(() => {
		if (!getSignedInCreds()) {
			test.skip(
				true,
				"Set E2E_CLERK_USER_USERNAME, E2E_CLERK_USER_PASSWORD, and CLERK_SECRET_KEY to run signed-in specs.",
			);
		}
	});

	for (const route of SIGNED_IN_ROUTES) {
		test(`${route.label} (${route.path}) has no runtime errors`, async ({
			page,
		}) => {
			const creds = getSignedInCreds();
			if (!creds) test.skip();

			const { pageerrors, fatalConsole } = attachErrorCaptures(page);

			await signInAndGoto(page, route.path, creds!);

			// networkidle gives Clerk + Convex websockets a beat to settle
			// so post-hydration query failures land before the assertions.
			await page.waitForLoadState("networkidle", { timeout: 20_000 });

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
