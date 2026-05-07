import { type ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const CONVEX_URL = (import.meta as unknown as { env: Record<string, string> })
	.env.PUBLIC_CONVEX_URL;

const client = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;

if (!client) {
	console.warn(
		"[ConvexClientProvider] PUBLIC_CONVEX_URL is not set. Convex mutations will not work.",
	);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
	if (!client) {
		return <>{children}</>;
	}
	return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
