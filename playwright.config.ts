import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

	use: {
		baseURL,
		trace: "on-first-retry",
	},

	projects: [
		{
			name: "desktop",
			use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
		},
		{
			name: "mobile",
			use: { ...devices["Pixel 7"] },
		},
	],

	webServer: {
		// `--ignore-lock` keeps `astro preview` in the foreground. Astro 7 otherwise backgrounds it when it
		// detects an AI coding agent, and Playwright then sees the process exit and gives up.
		command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT} --ignore-lock`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
