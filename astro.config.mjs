// @ts-check
import { defineConfig } from "astro/config";
import securityHeaders from "./integrations/security-headers.mjs";

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
	server: {
		port: 4321,
	},
	// A Content Security Policy and other security headers for the built site.
	integrations: [securityHeaders()],
});
