import "./helpers/load-env";
import { clerkSetup } from "@clerk/testing/playwright";

/**
 * Global setup for Playwright. Fetches the Clerk testing token once per
 * suite so signed-in specs can bypass bot protection on the Frontend API.
 *
 * Skips silently when CLERK_SECRET_KEY isn't set so contributors without
 * Clerk dev creds (and CI without secrets) can still run the unauth e2e
 * suite. Signed-in specs use `requireSignedInCreds()` to skip themselves
 * the same way.
 *
 * Reads the project's existing env-var names (PUBLIC_CLERK_PUBLISHABLE_KEY,
 * CLERK_SECRET_KEY)  no new global vars introduced.
 */
export default async function globalSetup() {
	const publishableKey =
		process.env.PUBLIC_CLERK_PUBLISHABLE_KEY ??
		process.env.CLERK_PUBLISHABLE_KEY;
	const secretKey = process.env.CLERK_SECRET_KEY;

	if (!publishableKey || !secretKey) {
		console.warn(
			"[clerk testing] CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY not set  signed-in specs will skip.",
		);
		return;
	}

	await clerkSetup({ publishableKey });
}
