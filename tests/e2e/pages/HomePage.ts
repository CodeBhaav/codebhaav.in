import type { Page } from "@playwright/test";

export class HomePage {
	readonly page: Page;
	readonly url = "/";

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto(this.url);
	}

	heading() {
		// The hero title is split across two lines: "Code with Bhaav." and "Build with purpose."
		// Both are rendered inside the single <h1>. Match on the first visible text line.
		return this.page.getByRole("heading", { level: 1 }).first();
	}

	primaryCta() {
		// "Join the Waitlist" — the amber gradient CTA in the hero
		return this.page.getByRole("link", { name: "Join the Waitlist" }).first();
	}

	footer() {
		return this.page.locator("footer");
	}

	ogImageMeta() {
		return this.page.locator('meta[property="og:image"]');
	}
}
