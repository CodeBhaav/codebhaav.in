import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

interface SessionMetadata {
	role?: string;
}

// Single source of truth for /admin/* gating. Doing this in middleware
// (instead of per-page Astro.redirect from layout frontmatter) avoids
// the "response already sent" error when a layout tries to short-circuit
// after streaming has started.
export const onRequest = clerkMiddleware((auth, context) => {
	if (!isAdminRoute(context.request)) return;

	const { userId, sessionClaims, redirectToSignIn } = auth();

	if (!userId) {
		return redirectToSignIn();
	}

	const role = (sessionClaims as { metadata?: SessionMetadata } | null)
		?.metadata?.role;
	if (role !== "admin") {
		return context.redirect("/dashboard");
	}
});
