import { clerkMiddleware } from "@clerk/astro/server";

// Wires Clerk's server-side auth into Astro.locals so SSR pages and the
// /admin guard can call Astro.locals.auth() to read sessionClaims.
export const onRequest = clerkMiddleware();
