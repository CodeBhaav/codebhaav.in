import { type ReactNode, useMemo } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ErrorBoundary } from "./ErrorBoundary";

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

/** Full providers with Clerk + Convex. Use only ONCE per page. */
export function Providers({ children, name }: { children: ReactNode; name?: string }) {
	const client = useMemo(() => getConvexClient(), []);
	const clerkKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY as string;

	const convexWrapped = client ? (
		<ConvexProvider client={client}>{children}</ConvexProvider>
	) : (
		<>{children}</>
	);

	const withClerk = clerkKey ? (
		<ClerkProvider publishableKey={clerkKey}>{convexWrapped}</ClerkProvider>
	) : (
		convexWrapped
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
