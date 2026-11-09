import { expect, test, type Page } from "@playwright/test";
import { backgroundSection as background, sections } from "../../src/site.config";

const entries = background.groups.flatMap((g) => g.entries);
const rows = (page: Page) => page.locator("#background [data-background-row]");

/** Scroll to Background and wait for the smooth scroller to settle, so clicks land where they aim. */
async function showBackground(page: Page) {
	await page.locator("#background").scrollIntoViewIfNeeded();
	await expect
		.poll(() =>
			page.evaluate(() => {
				const content = document.getElementById("smooth-content");
				if (!content || getComputedStyle(content).transform === "none") return 0;
				const offset = -new DOMMatrix(getComputedStyle(content).transform).m42;
				return Math.round(Math.abs(offset - scrollY));
			}),
		)
		.toBe(0);
}

test.describe("background", () => {
	test("sits between Skills and Contact, and the side nav and menu list it", async ({ page }) => {
		await page.goto("/");
		const ids = await page
			.locator("main > section[id]")
			.evaluateAll((els) => els.map((el) => el.id));
		expect(ids.slice(-3)).toEqual(["skills", "background", "contact"]);
		expect(sections.map((s) => s.label)).toEqual([
			"Intro",
			"About",
			"Projects",
			"Skills",
			"Background",
			"Contact",
		]);
		await expect(page.locator('a[href="#background"]').first()).toBeAttached();
		await expect(page.locator("#background-title")).toHaveAccessibleName(
			background.headline.replace(/[[\]]/g, ""),
		);
	});

	test("has Experience and Education, each with its places as rows", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#background h3")).toHaveText(["Experience", "Education"]);
		await expect(page.locator("#background .availability li")).toHaveText([
			...background.availability,
		]);
		await expect(rows(page)).toHaveCount(entries.length);
		for (const [i, entry] of entries.entries()) {
			const row = rows(page).nth(i);
			await expect(row.locator(".bg__name")).toHaveText(entry.name);
			await expect(row.locator(".bg__role")).toHaveText(entry.role);
			await expect(row.locator(".bg__when")).toHaveText(entry.when);
			await expect(row.locator(".bg__points li")).toHaveCount(entry.points.length);
		}
		// Algonquin: the honours list, and no GPA.
		const algonquin = rows(page).filter({ hasText: "Algonquin College" });
		await expect(algonquin).toContainText("Dean's Honours List");
		await expect(page.locator("#background")).not.toContainText("GPA");
		// Every row starts closed.
		for (const toggle of await page.locator("#background [data-work-toggle]").all()) {
			await expect(toggle).toHaveAttribute("aria-expanded", "false");
		}
	});

	test("clicking a row opens its details and keeps them open; clicking again closes", async ({
		page,
	}) => {
		await page.goto("/");
		await showBackground(page);
		const row = rows(page).filter({ hasText: "Algonquin College" });
		const toggle = row.locator("[data-work-toggle]");
		await expect(async () => {
			await toggle.click();
			await expect(toggle).toHaveAttribute("aria-expanded", "true", { timeout: 500 });
		}).toPass();
		await expect(row.locator(".bg__summary")).toBeVisible();
		await page.mouse.move(5, 5);
		await page.waitForTimeout(800);
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	test("hovering a row opens it on wide screens, and leaving closes it", async ({ page }, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		await showBackground(page);
		const toggle = rows(page).first().locator("[data-work-toggle]");
		await expect(async () => {
			await page.mouse.move(5, 5);
			await toggle.hover();
			await expect(toggle).toHaveAttribute("aria-expanded", "true", { timeout: 800 });
		}).toPass();
		await page.mouse.move(5, 5);
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
	});
});
