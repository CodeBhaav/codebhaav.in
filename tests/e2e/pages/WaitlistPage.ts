import type { Page } from "@playwright/test";

export class WaitlistPage {
	readonly page: Page;
	readonly url = "/waitlist";

	constructor(page: Page) {
		this.page = page;
	}

	async goto(ref?: string) {
		const search = ref ? `?ref=${ref}` : "";
		await this.page.goto(`${this.url}${search}`);
	}

	// The auth gate heading rendered by SignInGate: "Sign in to join."
	signInGateHeading() {
		return this.page.getByRole("heading", { name: /sign in to join/i });
	}

	// The amber "Sign in to continue" button inside the Clerk SignInButton wrapper
	signInButton() {
		return this.page.getByRole("button", { name: /sign in to continue/i });
	}

	ogImageMeta() {
		return this.page.locator('meta[property="og:image"]');
	}
}
