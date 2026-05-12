import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	globalSetup: "./tests/e2e/global-setup.ts",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["html", { open: "never" }], ["list"]],

	use: {
		baseURL: "http://localhost:4321",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "on-first-retry",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	webServer: {
		command: "npx astro dev --config astro.e2e.config.mjs",
		port: 4321,
		reuseExistingServer: true,
		timeout: 60_000,
	},
});
