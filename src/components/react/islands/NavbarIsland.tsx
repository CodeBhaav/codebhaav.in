import { Navbar } from "../sections/Navbar";

interface NavbarIslandProps {
	isSignedIn?: boolean;
	isAdmin?: boolean;
}

// Auth state is computed server-side in the Astro layout via Clerk's
// middleware (Astro.locals.auth) and forwarded here as props. This keeps
// the Navbar free of Clerk hooks so it never mounts its own ClerkProvider
// — that would conflict with page-level islands (DashboardIsland,
// FoundingMemberIsland) that own their ClerkProvider for hooks like
// useUser / UserButton. One Clerk instance per page wins.
export default function NavbarIsland({
	isSignedIn = false,
	isAdmin = false,
}: NavbarIslandProps) {
	return <Navbar isSignedIn={isSignedIn} isAdmin={isAdmin} />;
}
