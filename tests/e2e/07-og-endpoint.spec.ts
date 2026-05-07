import { test, expect } from "@playwright/test";

// The OG endpoint fetches Inter fonts from jsDelivr on cold boot (~2s).
// Give it extra headroom on first call.
const OG_TIMEOUT = 15_000;

test.describe("OG image endpoint smoke tests", () => {
	test("/api/og.png returns a valid PNG", async ({ request }) => {
		const response = await request.get("/api/og.png", { timeout: OG_TIMEOUT });

		expect(response.status()).toBe(200);

		const contentType = response.headers()["content-type"];
		expect(contentType).toContain("image/png");

		const body = await response.body();
		expect(body.length).toBeGreaterThan(5_000);

		const cacheControl = response.headers()["cache-control"];
		expect(cacheControl).toContain("max-age=86400");
	});

	test("/api/og.png?page=mission returns a valid PNG", async ({ request }) => {
		const response = await request.get("/api/og.png?page=mission", {
			timeout: OG_TIMEOUT,
		});

		expect(response.status()).toBe(200);

		const contentType = response.headers()["content-type"];
		expect(contentType).toContain("image/png");

		const body = await response.body();
		expect(body.length).toBeGreaterThan(5_000);

		const cacheControl = response.headers()["cache-control"];
		expect(cacheControl).toContain("max-age=86400");
	});

	test("/api/og.png?ref=BOGUS-CODE falls back to a valid PNG (no referrer found)", async ({
		request,
	}) => {
		// With a bogus ref, loadReferrer() returns null and falls back to PageCard(home config).
		// We still expect a 200 PNG, not an error page.
		const response = await request.get("/api/og.png?ref=BOGUS-CODE", {
			timeout: OG_TIMEOUT,
		});

		expect(response.status()).toBe(200);

		const contentType = response.headers()["content-type"];
		expect(contentType).toContain("image/png");

		const body = await response.body();
		expect(body.length).toBeGreaterThan(5_000);
	});
});
