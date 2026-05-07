import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Home page", () => {
	test("renders heading and primary CTA", async ({ page }) => {
		const home = new HomePage(page);
		await home.goto();

		// h1 contains both title lines — assert each text fragment is visible on the page
		const h1 = home.heading();
		await expect(h1).toBeVisible();
		await expect(h1).toContainText("Code with Bhaav.");

		// "Build with purpose." is rendered as the AuroraText child span inside the same h1
		await expect(h1).toContainText("Build with purpose.");

		// Primary CTA exists and points to /waitlist
		const cta = home.primaryCta();
		await expect(cta).toBeVisible();
		await expect(cta).toHaveAttribute("href", "/waitlist");
	});

	test("footer is present with expected link sections", async ({ page }) => {
		const home = new HomePage(page);
		await home.goto();

		const footer = home.footer();
		await expect(footer).toBeVisible();

		// Spot-check key footer links by their visible text
		for (const label of ["Mission", "Projects", "Leaderboard", "Contact", "Privacy", "Terms"]) {
			await expect(footer.getByRole("link", { name: label })).toBeVisible();
		}
	});
});
