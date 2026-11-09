import { expect, test, type Page } from "@playwright/test";

/** The id of the section at the top of the screen, once the smooth scroller has settled. */
async function sectionInView(page: Page) {
	let last = -1;
	await expect
		.poll(async () => {
			const y = await page.evaluate(() => Math.round(scrollY));
			const settled = y === last;
			last = y;
			return settled;
		})
		.toBe(true);
	return page.evaluate(() => {
		const sections = [...document.querySelectorAll<HTMLElement>("main > section[id]")];
		const top = sections.map((s) => Math.abs(s.getBoundingClientRect().top));
		return sections[top.indexOf(Math.min(...top))]!.id;
	});
}

test.describe("keyboard", () => {
	test("the first Tab shows a Skip to content link that moves focus into the page", async ({
		page,
	}) => {
		await page.goto("/");
		await page.keyboard.press("Tab");
		const skip = page.getByRole("link", { name: "Skip to content" });
		await expect(skip).toBeFocused();
		await expect(skip).toBeInViewport();
		await page.keyboard.press("Enter");
		await expect(page.locator("main")).toBeFocused();
		// Unfocused, it's tucked away above the screen.
		await page.keyboard.press("Tab");
		await expect(skip).not.toBeInViewport();
	});

	test("links inside a closed project or background row can't be tabbed to", async ({ page }) => {
		await page.goto("/");
		const panels = page.locator("[data-work-panel]");
		const count = await panels.count();
		expect(count).toBeGreaterThan(0);
		for (let i = 0; i < count; i++) {
			expect(await panels.nth(i).evaluate((el) => (el as HTMLElement).inert)).toBe(true);
		}
		// Skill logos are named for screen readers but aren't tab stops.
		await expect(page.locator('#skills [data-skill][tabindex="0"]')).toHaveCount(0);
	});

	test("Enter on a project opens it, and its links can then be tabbed to", async ({ page }) => {
		await page.goto("/");
		const row = page.locator("#projects [data-work-row]").first();
		const toggle = row.locator("[data-work-toggle]");
		await toggle.focus();
		await page.keyboard.press("Enter");
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(await row.locator("[data-work-panel]").evaluate((el) => (el as HTMLElement).inert)).toBe(
			false,
		);
		await page.keyboard.press("Tab");
		await expect(row.locator("a").first()).toBeFocused();

		// Enter again closes it, and its links are out of reach again.
		await toggle.focus();
		await page.keyboard.press("Enter");
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(await row.locator("[data-work-panel]").evaluate((el) => (el as HTMLElement).inert)).toBe(
			true,
		);
	});

	test("the side nav takes you to a section from the keyboard and moves focus there", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "the side nav is for wide screens");
		await page.goto("/");
		await page.locator("#about").scrollIntoViewIfNeeded();
		const link = page.locator('[data-side-nav-link="background"]');
		await expect(link).toBeVisible();
		await link.focus();
		await page.keyboard.press("Enter");
		await expect(page.locator("#background")).toBeFocused();
		await expect.poll(() => sectionInView(page), { timeout: 8000 }).toBe("background");
	});

	test("a menu link opened from the keyboard takes you to its section", async ({ page }, info) => {
		test.skip(info.project.name !== "mobile", "the menu button is for phones and tablets");
		await page.goto("/");
		await page.locator("[data-menu-button]").focus();
		await page.keyboard.press("Enter");
		const link = page.locator("#site-menu").getByRole("link", { name: "Contact", exact: true });
		await expect(page.locator("#site-menu").getByRole("link").first()).toBeFocused();
		await link.focus();
		await page.keyboard.press("Enter");
		await expect(page.locator("#site-menu")).toBeHidden();
		await expect(page.locator("#contact")).toBeFocused();
		await expect.poll(() => sectionInView(page), { timeout: 8000 }).toBe("contact");
	});
});
