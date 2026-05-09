import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import clerk from "@clerk/astro";
import tailwindcss from "@tailwindcss/vite";

// Adapter is loaded in every mode so individual SSR routes
// (e.g. /api/og.png, /waitlist) work in `astro dev` and `astro build`.
// Static pages still prerender by default. The Clerk integration provides
// server-side auth (Astro.locals.auth()) used by the /admin guard.
export default defineConfig({
	site: "https://codebhaav.in",
	integrations: [clerk(), react()],
	adapter: cloudflare({
		platformProxy: { enabled: true },
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
