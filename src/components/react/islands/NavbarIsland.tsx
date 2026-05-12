import { Navbar } from "../sections/Navbar";

interface NavbarIslandProps {
	isSignedIn?: boolean;
	isAdmin?: boolean;
}

// Auth state is computed server-side in the Astro layout via Clerk's
// middleware (Astro.locals.auth) and forwarded as props. The Navbar
// stays auth-free  it never mounts its own ClerkProvider, which would
// conflict with the single per-page ClerkProvider that page-level
// islands install via the shared <Providers> wrapper. The notification
// bell lives inside Providers as a floating element instead.
export default function NavbarIsland({
	isSignedIn = false,
	isAdmin = false,
}: NavbarIslandProps) {
	return <Navbar isSignedIn={isSignedIn} isAdmin={isAdmin} />;
}
