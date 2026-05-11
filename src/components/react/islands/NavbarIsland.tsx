import { Navbar } from "../sections/Navbar";
import { NotificationBell } from "../notifications/NotificationBell";
import { Providers } from "./Providers";

interface NavbarIslandProps {
	isSignedIn?: boolean;
	isAdmin?: boolean;
}

// Auth state is computed server-side in the Astro layout via Clerk's
// middleware (Astro.locals.auth) and forwarded as props. The Navbar
// itself stays auth-free, but when the visitor is signed in we wrap the
// island in Clerk + Convex providers so the notification bell can read
// the unread count from Convex. Multiple ClerkProviders on a page are
// safe in practice  they share the same publishableKey + cookies.
export default function NavbarIsland({
	isSignedIn = false,
	isAdmin = false,
}: NavbarIslandProps) {
	if (!isSignedIn) {
		return <Navbar isSignedIn={isSignedIn} isAdmin={isAdmin} />;
	}
	return (
		<Providers name="Navbar">
			<Navbar
				isSignedIn={isSignedIn}
				isAdmin={isAdmin}
				rightSlot={<NotificationBell />}
			/>
		</Providers>
	);
}
