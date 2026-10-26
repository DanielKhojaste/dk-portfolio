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
