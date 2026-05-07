import { test, expect } from "@playwright/test";
import { WaitlistPage } from "./pages/WaitlistPage";

test.describe("Waitlist auth gate", () => {
	test("shows sign-in gate when unauthenticated", async ({ page }) => {
		const waitlist = new WaitlistPage(page);
		await waitlist.goto();

		// WaitlistIsland is client:only="react" — wait for it to hydrate
		// The gate renders "Sign in to join." as the h1
		await expect(waitlist.signInGateHeading()).toBeVisible({ timeout: 10_000 });
		await expect(waitlist.signInButton()).toBeVisible();

		// We do NOT click the button — Clerk sign-in is out of E2E scope
	});

	test("sign-in gate is visible even when navigated from another page", async ({ page }) => {
		// Arrive via a link, not a direct URL load
		await page.goto("/");
		await page.getByRole("link", { name: "Join the Waitlist" }).first().click();

		await expect(page).toHaveURL("/waitlist");

		const waitlist = new WaitlistPage(page);
		await expect(waitlist.signInGateHeading()).toBeVisible({ timeout: 10_000 });
	});
});
