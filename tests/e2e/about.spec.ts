import { expect, test, type Page } from "@playwright/test";
import { about, colors, sections, sideNavUnderlineFlow } from "../../src/site.config";

const SIDE_NAV = "(min-width: 1024px) and (min-height: 600px)";
const hasSideNav = (page: Page) => page.evaluate((q) => matchMedia(q).matches, SIDE_NAV);

test.describe("about", () => {
	test("sits right under the hero, one screen tall, with no numbers and no buttons", async ({
		page,
	}) => {
		await page.goto("/");
		const ids = await page
			.locator("main > section[id]")
			.evaluateAll((els) => els.map((el) => el.id));
		expect(ids.slice(0, 2)).toEqual(["intro", "about"]);

		const section = page.locator("#about");
		const rect = (await section.boundingBox())!;
		expect(Math.round(rect.height)).toBeGreaterThanOrEqual(page.viewportSize()!.height);

		await expect(section.locator(".about__eyebrow")).toHaveText(about.eyebrow);
		await expect(section.locator(".about__eyebrow")).not.toContainText(/\d/);
		await expect(section.getByRole("heading", { level: 2 })).toHaveText(
			about.headline.replace(/[[\]]/g, ""),
		);
		await expect(section.locator("[data-highlight]")).toHaveText(["fast", "sharp"]);
		// No call-to-action buttons: the only link is the project in the facts.
		await expect(section.getByRole("link")).toHaveCount(1);
		await expect(section.getByRole("link")).toHaveAttribute("href", about.facts[2]!.href!);
	});

	test("lights the headline up and fills the red words in when it comes into view", async ({
		page,
	}) => {
		await page.goto("/");
		const highlight = page.locator("#about [data-highlight]").first();
		// Waiting below the fold: dim, red words still empty.
		expect(await highlight.evaluate((el) => getComputedStyle(el).backgroundSize)).toBe("0% 100%");

		await page.locator("#about").scrollIntoViewIfNeeded();
		await expect
			.poll(() => highlight.evaluate((el) => getComputedStyle(el).backgroundSize), {
				timeout: 6_000,
			})
			.toBe("100% 100%");
		await expect
			.poll(() =>
				page.locator("#about .about__text").evaluate((el) => getComputedStyle(el).opacity),
			)
			.toBe("1");
	});

	test("shows everything straight away for reduced motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		const highlight = page.locator("#about [data-highlight]").first();
		expect(await highlight.evaluate((el) => getComputedStyle(el).backgroundSize)).toBe("100% 100%");
		expect(
			await page.locator("#about .about__text").evaluate((el) => getComputedStyle(el).opacity),
		).toBe("1");
	});

	test("has the fixed dark red glow behind it", async ({ page }) => {
		await page.goto("/");
		const glow = page.locator(".page-glow");
		expect(await glow.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
		expect(await glow.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain(
			"radial-gradient",
		);
		// The hero paints over it; the sections after it are see-through.
		expect(
			await page.locator("#about").evaluate((el) => getComputedStyle(el).backgroundColor),
		).toBe("rgba(0, 0, 0, 0)");
	});
});

test.describe("side nav", () => {
	test("replaces the menu button on desktop only", async ({ page }) => {
		await page.goto("/");
		const nav = page.locator("[data-side-nav]");
		if (await hasSideNav(page)) {
			await expect(page.locator("[data-menu-button]")).toBeHidden();
			// It shows from About onwards.
			await page.locator("#about").scrollIntoViewIfNeeded();
			await expect(nav.getByRole("link")).toHaveCount(sections.length);
		} else {
			await expect(nav).toBeHidden();
			await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
		}
	});

	test("stays hidden on the hero, then follows the section you're on", async ({ page }) => {
		await page.goto("/");
		test.skip(!(await hasSideNav(page)), "desktop only");
		const nav = page.locator("[data-side-nav]");
		await expect(nav).toBeHidden();

		await page.locator("#about").scrollIntoViewIfNeeded();
		await expect(nav).toBeVisible();
		const current = nav.locator("[aria-current]");
		await expect(current).toHaveCount(1);
		await expect(current).toHaveAttribute("href", "#about");
		// Its underline is mounted and drawing; the others haven't been needed yet.
		await expect(current.locator("canvas[data-divine-flow-canvas]")).toHaveCount(1);
		await expect(nav.locator("canvas[data-divine-flow-canvas]")).toHaveCount(1);

		await page.locator("#skills").scrollIntoViewIfNeeded();
		await expect(nav.locator("[aria-current]")).toHaveAttribute("href", "#skills");

		await page.evaluate(() => window.scrollTo(0, 0));
		await expect(nav).toBeHidden();
	});

	test("uses its own, flatter underline settings and fills labels on hover", async ({ page }) => {
		await page.goto("/");
		test.skip(!(await hasSideNav(page)), "desktop only");
		const flow = page.locator('[data-side-nav-link="work"] [data-divine-flow]');
		const options = JSON.parse((await flow.getAttribute("data-options"))!);
		expect(options).toMatchObject({
			wave: sideNavUnderlineFlow.wave,
			thickness: sideNavUnderlineFlow.thickness,
			lineCount: 1,
			amplitude: 0,
		});
		expect(options.theme).toEqual(colors.sideNavUnderline);

		await page.locator("#about").scrollIntoViewIfNeeded();
		const label = page.locator('[data-side-nav-link="work"] .side-nav__label');
		expect(await label.evaluate((el) => getComputedStyle(el).backgroundSize)).toBe("0% 100%");
		await label.hover();
		await expect
			.poll(() => label.evaluate((el) => getComputedStyle(el).backgroundSize))
			.toBe("100% 100%");
	});
});

test.describe("paging", () => {
	test("moves exactly one section per key press or wheel flick on desktop", async ({ page }) => {
		await page.goto("/");
		test.skip(!(await hasSideNav(page)), "the placeholder sections don't fit one phone screen yet");
		const top = (id: string) => page.evaluate((i) => document.getElementById(i)!.offsetTop, id);
		const settledAt = async (y: number) =>
			expect.poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 4_000 }).toBe(y);

		await page.keyboard.press("ArrowDown");
		await settledAt(await top("about"));

		await page.waitForTimeout(400);
		await page.mouse.move(700, 450);
		await page.mouse.wheel(0, 2000);
		await settledAt(await top("work"));

		await page.waitForTimeout(400);
		await page.keyboard.press("ArrowUp");
		await settledAt(await top("about"));
	});
});

test.describe("logo hover", () => {
	test("writes the signature over the logo in red, and fades it on leave", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		const logo = page.locator("svg[data-logo-draw]");
		await expect(logo).toHaveAttribute("data-drawn", "true", { timeout: 6_000 });
		const red = logo.locator(".logo__red");
		await expect(logo.locator(".logo__red-pen")).toHaveCount(4);
		expect(await red.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");

		await page.getByRole("link", { name: "Daniel Khojaste, home" }).hover();
		await expect.poll(() => red.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");

		await page.mouse.move(700, 600);
		await expect.poll(() => red.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
	});
});
