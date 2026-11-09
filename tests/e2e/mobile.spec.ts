import { expect, test } from "@playwright/test";

test.describe("phones", () => {
	test("every menu label fits the screen, even the longest", async ({ page }, info) => {
		test.skip(info.project.name !== "mobile", "the menu button is for phones and tablets");
		for (const width of [320, 360, 393, 430]) {
			await page.setViewportSize({ width, height: 852 });
			await page.goto("/");
			await page.locator("[data-menu-button]").click();
			await expect(page.locator("#site-menu")).toBeVisible();
			await page.waitForTimeout(700);
			const overflow = await page.locator(".menu__label").evaluateAll((labels) =>
				labels
					.filter((l) => {
						const r = l.getBoundingClientRect();
						return r.left < 0 || r.right > innerWidth || l.scrollWidth > l.clientWidth + 1;
					})
					.map((l) => l.textContent?.trim()),
			);
			expect(overflow, `${width}px`).toEqual([]);
		}
	});

	test("the logo tucks away scrolling down and comes back scrolling up", async ({ page }, info) => {
		test.skip(info.project.name !== "mobile", "only on phones and tablets");
		await page.goto("/");
		const logo = page.getByRole("link", { name: "Daniel Khojaste, home" });
		await expect(logo).toBeVisible();
		await page.evaluate(() => scrollTo(0, 1600));
		await expect(logo).toBeHidden();
		await page.evaluate(() => scrollTo(0, 1200));
		await expect(logo).toBeVisible();
		await page.evaluate(() => scrollTo(0, 0));
		await expect(logo).toBeVisible();
		// The menu button never hides.
		await page.evaluate(() => scrollTo(0, 2400));
		await expect(page.locator("[data-menu-button]")).toBeVisible();
	});

	test("on desktop the logo always stays", async ({ page }, info) => {
		test.skip(info.project.name !== "desktop", "desktop only");
		await page.goto("/");
		await page.locator("#projects").scrollIntoViewIfNeeded();
		await page.waitForTimeout(500);
		await expect(page.getByRole("link", { name: "Daniel Khojaste, home" })).toBeVisible();
	});
});
