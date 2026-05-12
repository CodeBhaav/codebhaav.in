import "./load-env";
import { test, type Page } from "@playwright/test";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";

/**
 * Read the e2e test user creds. Returns null when any are missing so
 * the calling spec can skip itself cleanly  important for CI runs
 * without secrets + contributors without a Clerk dev test user.
 */
export function getSignedInCreds(): {
	identifier: string;
	password: string;
} | null {
	const identifier = process.env.E2E_CLERK_USER_USERNAME;
	const password = process.env.E2E_CLERK_USER_PASSWORD;
	const secretKey = process.env.CLERK_SECRET_KEY;
	if (!identifier || !password || !secretKey) return null;
	return { identifier, password };
}

/**
 * Call inside `test.beforeAll` (or at the top of `test.describe`) to skip
 * the entire group when test creds aren't available.
 */
export function requireSignedInCreds(): {
	identifier: string;
	password: string;
} {
	const creds = getSignedInCreds();
	if (!creds) {
		test.skip(
			true,
			"Set E2E_CLERK_USER_USERNAME, E2E_CLERK_USER_PASSWORD, and CLERK_SECRET_KEY to run signed-in specs.",
		);
		throw new Error("unreachable");
	}
	return creds;
}

/**
 * Sign in via Clerk's password strategy and land on the target path.
 *
 * Implementation notes:
 *  - `setupClerkTestingToken` must be called before any page.goto that
 *    hits the Frontend API, otherwise Clerk's bot protection blocks
 *    automated sign-ins.
 *  - We sign in from the homepage (a Clerk-loading public page) per the
 *    @clerk/testing recipe. Trying to sign in from a protected route
 *    races against the auth redirect.
 */
export async function signInAndGoto(
	page: Page,
	target: string,
	creds: { identifier: string; password: string },
): Promise<void> {
	await setupClerkTestingToken({ page });
	await page.goto("/");
	await clerk.signIn({
		page,
		signInParams: {
			strategy: "password",
			identifier: creds.identifier,
			password: creds.password,
		},
	});
	if (target !== "/") {
		await page.goto(target);
	}
}
