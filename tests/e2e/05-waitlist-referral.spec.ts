import { test, expect } from "@playwright/test";
import { WaitlistPage } from "./pages/WaitlistPage";

test.describe("Waitlist referral param", () => {
	test("OG image meta contains the ref code when ?ref= is present", async ({ page }) => {
		const waitlist = new WaitlistPage(page);
		const bogusCode = "BOGUS-CODE";
		await waitlist.goto(bogusCode);

		const ogMeta = waitlist.ogImageMeta();
		const content = await ogMeta.getAttribute("content");

		expect(content, "og:image meta should be present").not.toBeNull();

		// The content is the absolute URL form (BaseLayout resolves ogImage via new URL())
		// It should end with the ref param
		expect(content).toContain(`ref=${bogusCode}`);
	});

	test("auth gate still appears with referral param", async ({ page }) => {
		const waitlist = new WaitlistPage(page);
		await waitlist.goto("SOME-REF-CODE");

		await expect(waitlist.signInGateHeading()).toBeVisible({ timeout: 10_000 });
		await expect(waitlist.signInButton()).toBeVisible();
	});
});
