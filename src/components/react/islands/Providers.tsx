import { type ReactNode, useMemo } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ErrorBoundary } from "./ErrorBoundary";
import { NotificationBellFloating } from "../notifications/NotificationBell";

let cachedClient: ConvexReactClient | null = null;

function getConvexClient(): ConvexReactClient | null {
	if (typeof window === "undefined") return null;
	if (cachedClient) return cachedClient;
	const url = import.meta.env.PUBLIC_CONVEX_URL as string;
	if (!url) {
		console.warn("[Providers] PUBLIC_CONVEX_URL is not set");
		return null;
	}
	cachedClient = new ConvexReactClient(url);
	return cachedClient;
}

/**
 * Full providers with Clerk + Convex (auth-aware). Use once per page.
 * ConvexProviderWithClerk forwards the Clerk JWT to Convex so server-side
 * functions can call `ctx.auth.getUserIdentity()` and read role/metadata
 * from verified claims.
 *
 * Also renders the floating notification bell since this is the single
 * ClerkProvider-bearing tree on each page. Pages that explicitly want
 * no bell (sign-in, sign-up, wizard) pass `chrome={false}`. The bell
 * itself renders null for signed-out visitors so it's safe by default.
 */
export function Providers({
	children,
	name,
	chrome = true,
}: {
	children: ReactNode;
	name?: string;
	chrome?: boolean;
}) {
	const client = useMemo(() => getConvexClient(), []);
	const clerkKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY as string;

	const body = (
		<>
			{children}
			{chrome && <NotificationBellFloating />}
		</>
	);

	const inner = client ? (
		<ConvexProviderWithClerk client={client} useAuth={useAuth}>
			{body}
		</ConvexProviderWithClerk>
	) : (
		body
	);

	const withClerk = clerkKey ? (
		<ClerkProvider publishableKey={clerkKey}>{inner}</ClerkProvider>
	) : (
		body
	);

	return <ErrorBoundary name={name}>{withClerk}</ErrorBoundary>;
}

/** Convex-only providers (no Clerk). Safe to use multiple times per page. */
export function ConvexOnlyProviders({ children, name }: { children: ReactNode; name?: string }) {
	const client = useMemo(() => getConvexClient(), []);

	const inner = client ? (
		<ConvexProvider client={client}>{children}</ConvexProvider>
	) : (
		<>{children}</>
	);

	return <ErrorBoundary name={name}>{inner}</ErrorBoundary>;
}
