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

	test("past the hero the logo stays hidden, and the menu button only comes back scrolling up", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "mobile", "only on phones and tablets");
		await page.goto("/");
		const logo = page.getByRole("link", { name: "Daniel Khojaste, home" });
		const button = page.locator("[data-menu-button]");
		await expect(logo).toBeVisible();
		await expect(button).toBeVisible();
		await page.evaluate(() => scrollTo(0, 2400));
		await expect(logo).toBeHidden();
		await expect(button).toBeHidden();
		// Scrolling up a little: the menu button comes back, the logo doesn't.
		await page.evaluate(() => scrollTo(0, 2000));
		await expect(button).toBeVisible();
		await expect(logo).toBeHidden();
		// Back in the hero, both show.
		await page.evaluate(() => scrollTo(0, 0));
		await expect(logo).toBeVisible();
		await expect(button).toBeVisible();
	});

	test("on desktop the logo always stays", async ({ page }, info) => {
		test.skip(info.project.name !== "desktop", "desktop only");
		await page.goto("/");
		await page.locator("#projects").scrollIntoViewIfNeeded();
		await page.waitForTimeout(500);
		await expect(page.getByRole("link", { name: "Daniel Khojaste, home" })).toBeVisible();
	});
});
