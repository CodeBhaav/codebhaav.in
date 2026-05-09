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

	// Temporary debug log — shows what Clerk is actually sending in the
	// session token. Check Cloudflare Pages → Functions → Logs after
	// hitting /admin to see the shape. Remove once gate works.
	console.log("[admin-guard]", {
		userId,
		role,
		sessionClaimsKeys: sessionClaims ? Object.keys(sessionClaims) : null,
		metadata: (sessionClaims as { metadata?: unknown } | null)?.metadata,
	});

	if (role !== "admin") {
		return context.redirect("/dashboard");
	}
});
