// Tells Convex how to verify Clerk-issued JWTs. The CLERK_JWT_ISSUER_DOMAIN
// env var should be the "Issuer" URL shown in the Clerk Dashboard's JWT
// template named "convex" (Clerk's built-in preset for Convex).
//
//   Dev:  npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer-url>
//   Prod: npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer-url> --prod

const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;

export default {
	providers: domain
		? [
				{
					domain,
					applicationID: "convex",
				},
			]
		: [],
};
