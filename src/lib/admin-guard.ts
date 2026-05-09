import type { AstroGlobal } from "astro";

interface SessionMetadata {
	role?: string;
}

interface SessionClaims {
	metadata?: SessionMetadata;
}

/**
 * Server-side gate for /admin/* pages. Returns a Response (redirect) if the
 * caller isn't signed in or doesn't have publicMetadata.role === "admin".
 * The caller should `return` whatever this returns, and only proceed with
 * page rendering if the return value is null.
 *
 * The role lives in publicMetadata (set in Clerk dashboard) and is mirrored
 * into the session token via Clerk's "Customize session token" config — the
 * project's session token includes `"metadata": "{{user.public_metadata}}"`.
 */
export function requireAdmin(Astro: AstroGlobal): Response | null {
	const auth = Astro.locals.auth();
	const isAuthenticated = Boolean(auth?.userId);

	if (!isAuthenticated) {
		const target = encodeURIComponent(Astro.url.pathname);
		return Astro.redirect(`/sign-in?redirect_url=${target}`);
	}

	const claims = auth?.sessionClaims as SessionClaims | undefined;
	const role = claims?.metadata?.role;
	if (role !== "admin") {
		return Astro.redirect("/dashboard");
	}

	return null;
}
