import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		// Test against the package source so unit tests never depend on a prior package build.
		alias: {
			"divine-flow": fileURLToPath(new URL("./packages/divine-flow/src/index.ts", import.meta.url)),
		},
	},
	test: {
		include: ["src/**/*.test.ts"],
		environment: "node",
	},
});
