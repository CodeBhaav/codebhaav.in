import { ClerkProvider, SignUp } from "@clerk/clerk-react";

export default function SignUpIsland() {
	const clerkKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY as string;
	if (!clerkKey) return null;

	return (
		<ClerkProvider
			publishableKey={clerkKey}
			signInFallbackRedirectUrl="/dashboard"
			signUpFallbackRedirectUrl="/dashboard"
		>
			<SignUp
				routing="path"
				path="/sign-up"
				signInUrl="/sign-in"
				fallbackRedirectUrl="/dashboard"
			/>
		</ClerkProvider>
	);
}
