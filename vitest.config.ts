import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
	test: {
		// convex-test requires the edge-runtime VM to mimic the Convex isolate.
		environment: "edge-runtime",
		server: { deps: { inline: ["convex-test"] } },
		include: ["**/*.test.ts", "**/*.test.tsx"],
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
