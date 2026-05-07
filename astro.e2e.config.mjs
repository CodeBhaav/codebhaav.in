/**
 * Astro config for E2E test runs.
 * Identical to astro.config.mjs except platformProxy is disabled so
 * the dev server starts without a Cloudflare remote proxy session
 * (which requires CF account auth and is not needed for local E2E).
 */
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	site: "https://codebhaav.in",
	integrations: [react()],
	adapter: cloudflare({
		platformProxy: { enabled: false },
	}),
	vite: {
		plugins: [tailwindcss()],
		ssr: {
			noExternal: [
				"clsx",
				"tailwind-merge",
				"workers-og",
				"satori",
				"@resvg/resvg-wasm",
				"yoga-wasm-web",
			],
		},
		assetsInclude: ["**/*.wasm"],
		optimizeDeps: {
			exclude: ["workers-og"],
		},
	},
});
