import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

/**
 * Verify a Svix webhook signature in the Convex V8 runtime using WebCrypto.
 * Equivalent to `new Webhook(secret).verify(body, headers)` from the svix npm
 * package, but without depending on Node's `crypto` module.
 *
 * Spec: https://docs.svix.com/receiving/verifying-payloads/how-manual
 */
async function verifySvixSignature(
	secret: string,
	body: string,
	svixId: string,
	svixTimestamp: string,
	svixSignatureHeader: string,
): Promise<boolean> {
	const secretRaw = secret.startsWith("whsec_") ? secret.slice(6) : secret;

	let secretBytes: Uint8Array;
	try {
		secretBytes = Uint8Array.from(atob(secretRaw), (c) => c.charCodeAt(0));
	} catch {
		return false;
	}

	const key = await crypto.subtle.importKey(
		"raw",
		secretBytes as BufferSource,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signedContent = `${svixId}.${svixTimestamp}.${body}`;
	const sigBuffer = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(signedContent) as BufferSource,
	);
	const expectedSig = btoa(
		String.fromCharCode(...new Uint8Array(sigBuffer)),
	);
	const expectedHeaderEntry = `v1,${expectedSig}`;

	// Header format: "v1,<sig1> v1,<sig2> ..." — accept any matching v1 entry.
	return svixSignatureHeader
		.split(" ")
		.some((entry) => entry === expectedHeaderEntry);
}

const TIMESTAMP_TOLERANCE_SECONDS = 300;

const http = httpRouter();

http.route({
	path: "/clerk-user-created",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const secret = process.env.CLERK_WEBHOOK_SECRET;
		if (!secret) {
			console.error("CLERK_WEBHOOK_SECRET is not set");
			return new Response("Webhook not configured", { status: 500 });
		}

		const svixId = request.headers.get("svix-id");
		const svixTimestamp = request.headers.get("svix-timestamp");
		const svixSignature = request.headers.get("svix-signature");
		if (!svixId || !svixTimestamp || !svixSignature) {
			return new Response("Missing svix headers", { status: 400 });
		}

		// Replay-attack protection: drop messages older than 5 minutes.
		const tsNum = Number.parseInt(svixTimestamp, 10);
		const now = Math.floor(Date.now() / 1000);
		if (
			!Number.isFinite(tsNum) ||
			Math.abs(now - tsNum) > TIMESTAMP_TOLERANCE_SECONDS
		) {
			return new Response("Stale timestamp", { status: 400 });
		}

		const body = await request.text();
		const valid = await verifySvixSignature(
			secret,
			body,
			svixId,
			svixTimestamp,
			svixSignature,
		);
		if (!valid) {
			return new Response("Invalid signature", { status: 401 });
		}

		let event: { type?: string; data?: ClerkUserCreatedData };
		try {
			event = JSON.parse(body);
		} catch {
			return new Response("Invalid JSON", { status: 400 });
		}

		// Only react to user.created — acknowledge other events without action.
		if (event.type !== "user.created" || !event.data) {
			return new Response(null, { status: 200 });
		}

		const user = event.data;
		const primaryEmail = user.email_addresses?.find(
			(addr) => addr.id === user.primary_email_address_id,
		)?.email_address;

		if (!primaryEmail) {
			// Account exists but has no primary email yet — nothing to send to.
			// Acknowledge so Clerk doesn't retry indefinitely.
			return new Response(null, { status: 200 });
		}

		const fullName = [user.first_name, user.last_name]
			.filter(Boolean)
			.join(" ")
			.trim();
		const displayName = fullName || "there";

		await ctx.scheduler.runAfter(0, internal.email.sendAccountWelcomeEmail, {
			name: displayName,
			email: primaryEmail,
		});

		return new Response(null, { status: 200 });
	}),
});

interface ClerkUserCreatedData {
	id: string;
	first_name?: string | null;
	last_name?: string | null;
	primary_email_address_id?: string | null;
	email_addresses?: Array<{
		id: string;
		email_address: string;
	}>;
}

export default http;
