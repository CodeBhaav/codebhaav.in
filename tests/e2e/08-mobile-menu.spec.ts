import { test, expect } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe("Mobile menu", () => {
	test.use({ viewport: MOBILE_VIEWPORT });

	test("hamburger button is visible and desktop nav is hidden", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector("[aria-label='Toggle menu']", { state: "visible" });

		// Hamburger is visible on mobile
		const hamburger = page.getByRole("button", { name: "Toggle menu" });
		await expect(hamburger).toBeVisible();

		// Desktop nav (hidden md:flex) should not be visible at 375px
		// It is rendered with className="hidden md:flex ..."
		// The nav element exists in DOM but Tailwind hides it below md breakpoint
		const desktopNav = page.locator("nav.hidden");
		await expect(desktopNav).toBeHidden();
	});

	test("tapping hamburger opens the mobile menu", async ({ page }) => {
		await page.goto("/");

		const hamburger = page.getByRole("button", { name: "Toggle menu" });
		await hamburger.click();

		// Mobile menu slides in — it contains the nav links as large text
		await expect(page.getByRole("link", { name: "Mission" }).last()).toBeVisible();
		await expect(page.getByRole("link", { name: "Projects" }).last()).toBeVisible();
		await expect(page.getByRole("link", { name: "Leaderboard" }).last()).toBeVisible();
		await expect(page.getByRole("link", { name: "Contact" }).last()).toBeVisible();
	});

	test("tapping a mobile menu link closes the menu and navigates", async ({ page }) => {
		await page.goto("/");

		const hamburger = page.getByRole("button", { name: "Toggle menu" });
		await hamburger.click();

		// Wait for the mobile menu animation to complete
		const missionLink = page.getByRole("link", { name: "Mission" }).last();
		await expect(missionLink).toBeVisible();
		await missionLink.click();

		// Navigated to /mission
		await expect(page).toHaveURL("/mission");

		// Mobile menu should be gone
		await expect(
			page.getByRole("button", { name: "Toggle menu" }),
		).toBeVisible(); // hamburger still present
		// The overlay (fixed inset-0) should not be visible
		const mobileMenuOverlay = page.locator(".fixed.inset-0.bg-background\\/80");
		await expect(mobileMenuOverlay).not.toBeVisible();
	});
});
