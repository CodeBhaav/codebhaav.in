import { ClerkProvider, SignIn } from "@clerk/clerk-react";

export default function SignInIsland() {
	const clerkKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY as string;
	if (!clerkKey) return null;

	return (
		<ClerkProvider
			publishableKey={clerkKey}
			signInFallbackRedirectUrl="/dashboard"
			signUpFallbackRedirectUrl="/dashboard"
		>
			<SignIn
				routing="path"
				path="/sign-in"
				signUpUrl="/sign-up"
				fallbackRedirectUrl="/dashboard"
			/>
		</ClerkProvider>
	);
}
