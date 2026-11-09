import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
	test("home page loads with title and a single h1", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));

		await page.goto("/");

		await expect(page).toHaveTitle(/Daniel Khojaste/);
		await expect(page.locator("h1")).toHaveCount(1);
		expect(errors).toEqual([]);
	});

	test("uses the dark colour scheme and self-hosted fonts", async ({ page }) => {
		await page.goto("/");

		const background = await page.evaluate(
			() => getComputedStyle(document.documentElement).backgroundColor,
		);
		expect(background).toBe("rgb(8, 4, 5)");

		await page.evaluate(() => document.fonts.ready);
		const fontsLoaded = await page.evaluate(() => document.fonts.check('16px "Inter Variable"'));
		expect(fontsLoaded).toBe(true);
	});
});

test("serves the tab icon and the app icons", async ({ page, request }) => {
	await page.goto("/");
	for (const [rel, href, type] of [
		["icon", "/favicon.svg", "image/svg+xml"],
		["icon", "/favicon-32.png", "image/png"],
		["apple-touch-icon", "/apple-touch-icon.png", "image/png"],
	]) {
		await expect(page.locator(`link[rel="${rel}"][href="${href}"]`)).toHaveCount(1);
		const response = await request.get(href!);
		expect(response.ok(), href).toBe(true);
		expect(response.headers()["content-type"]).toContain(type);
	}
});
