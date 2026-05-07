import { test, expect } from "@playwright/test";

// All internal footer links that must resolve to HTTP 200.
// External links (GitHub, Instagram) are excluded — they hit real external servers
// and would make CI brittle/slow.
const INTERNAL_FOOTER_LINKS = [
	"/mission",
	"/projects",
	"/leaderboard",
	"/contact",
	"/waitlist",
	"/founding-member",
	"/privacy",
	"/terms",
];

test.describe("Footer link integrity", () => {
	for (const path of INTERNAL_FOOTER_LINKS) {
		test(`${path} returns 200`, async ({ request }) => {
			const response = await request.get(path);
			expect(
				response.status(),
				`Expected ${path} to return 200, got ${response.status()}`,
			).toBe(200);
		});
	}
});
