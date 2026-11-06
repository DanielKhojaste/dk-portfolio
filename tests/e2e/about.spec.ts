import { expect, test, type Page } from "@playwright/test";
import { FILL_EMPTY } from "../../src/scripts/about";

/** FILL_FULL as the browser reports it back. */
const FILL_FULL_COMPUTED = "inset(-30% -8%)";
import {
	about,
	brand,
	colors,
	motion,
	sections,
	sideNavUnderlineFlow,
} from "../../src/site.config";

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
		// Read once: the red words' filled copies are hidden from screen readers.
		await expect(
			section.getByRole("heading", { level: 2, name: about.headline.replace(/[[\]]/g, "") }),
		).toBeVisible();
		await expect(section.locator("[data-fill]")).toHaveText(["fast", "sharp"]);
		await expect(section.locator("[data-fill]").first()).toHaveAttribute("aria-hidden", "true");
		await expect(section).toContainText("Canada");
		await expect(section).not.toContainText("Ottawa");
		// No call-to-action buttons: the only link is the project in the facts.
		await expect(section.getByRole("link")).toHaveCount(1);
		await expect(section.getByRole("link")).toHaveAttribute("href", about.facts[2]!.href!);
	});

	test("lights the headline up and wipes the red words in when it comes into view", async ({
		page,
	}) => {
		await page.goto("/");
		const fill = page.locator("#about [data-fill]").first();
		const clip = () => fill.evaluate((el) => getComputedStyle(el).clipPath);
		// Waiting below the fold: the red copy is clipped away to nothing.
		expect(await clip()).toBe(FILL_EMPTY);

		await page.locator("#about").scrollIntoViewIfNeeded();
		// Then wiped in, reaching past the word on every side so no letter is left half filled.
		await expect.poll(clip, { timeout: 6_000 }).toBe(FILL_FULL_COMPUTED);
		await expect
			.poll(() =>
				page.locator("#about .about__text").evaluate((el) => getComputedStyle(el).opacity),
			)
			.toBe("1");
	});

	test("animates the Lineup link on hover at the shared hover pace", async ({ page }, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		await page.locator("#about").scrollIntoViewIfNeeded();
		const link = page.locator("#about .text-link");
		const style = () =>
			link.evaluate((el) => {
				const cs = getComputedStyle(el);
				return { underline: cs.backgroundSize, duration: cs.transitionDuration };
			});
		expect(await style()).toEqual({
			underline: "0% 1px",
			duration: `${motion.hover}s, ${motion.hover}s`,
		});
		await link.hover();
		// Not instant: partway a moment after the pointer arrives, then fully drawn.
		await page.waitForTimeout(60);
		expect((await style()).underline).not.toBe("100% 1px");
		await expect.poll(async () => (await style()).underline).toBe("100% 1px");
	});

	test("shows everything straight away for reduced motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		const fill = page.locator("#about [data-fill]").first();
		expect(await fill.evaluate((el) => getComputedStyle(el).clipPath)).toBe(FILL_FULL_COMPUTED);
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
		await expect(nav.locator("canvas[data-divine-flow-canvas]")).toHaveCount(1);
		await expect(current.locator("canvas[data-divine-flow-canvas]")).toHaveCount(1);

		await page.locator("#skills").scrollIntoViewIfNeeded();
		await expect(nav.locator("[aria-current]")).toHaveAttribute("href", "#skills");

		await page.evaluate(() => window.scrollTo(0, 0));
		await expect(nav).toBeHidden();
	});

	test("uses its own, flatter underline and fills labels with soft white on hover", async ({
		page,
	}) => {
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
		const link = page.locator('[data-side-nav-link="work"]');
		const fill = link.locator(".side-nav__fill");
		const clip = () => fill.evaluate((el) => getComputedStyle(el).clipPath);
		expect(await clip()).toBe(FILL_EMPTY);
		expect(await fill.evaluate((el) => getComputedStyle(el).color)).toBe(
			"rgba(245, 236, 236, 0.4)",
		);
		// Slow enough to see it sweep: still going just after the pointer arrives.
		await link.hover();
		await page.waitForTimeout(150);
		expect(await clip()).not.toBe(FILL_FULL_COMPUTED);
		await expect.poll(clip).toBe(FILL_FULL_COMPUTED);
	});
});

test.describe("smooth scrolling", () => {
	test("glides to a stop instead of stopping dead, with no snapping to sections", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "phones keep their own scrolling");
		await page.goto("/");
		expect(
			await page.locator("#smooth-wrapper").evaluate((el) => getComputedStyle(el).position),
		).toBe("fixed");

		// Scroll and watch the content follow, frame by frame.
		const frames = await page.evaluate(async () => {
			const content = document.getElementById("smooth-content")!;
			const offset = () => -new DOMMatrix(getComputedStyle(content).transform).m42;
			scrollTo(0, 600);
			const seen: number[] = [];
			for (let i = 0; i < 8; i++) {
				await new Promise(requestAnimationFrame);
				seen.push(offset());
			}
			return seen;
		});
		// It's still catching up a few frames in, and only moving forward...
		expect(frames.at(-1)!).toBeGreaterThan(0);
		expect(frames.at(-1)!).toBeLessThan(590);
		expect([...frames].sort((a, b) => a - b)).toEqual(frames);
		// ...then settles exactly where the page scrolled to, not on a section.
		await expect
			.poll(() =>
				page
					.locator("#smooth-content")
					.evaluate((el) => Math.round(-new DOMMatrix(getComputedStyle(el).transform).m42)),
			)
			.toBe(600);
		expect(await page.evaluate(() => document.getElementById("about")!.offsetTop)).not.toBe(600);
	});

	test("keeps the content in line when something scrolls into view (tabbing, find-in-page)", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "phones keep their own scrolling");
		await page.goto("/");
		await page.locator("#skills").scrollIntoViewIfNeeded();
		await expect.poll(() => page.locator("#smooth-wrapper").evaluate((el) => el.scrollTop)).toBe(0);
		await expect(page.locator("#skills-title")).toBeInViewport();
	});

	test("is off for reduced motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		expect(
			await page.locator("#smooth-wrapper").evaluate((el) => getComputedStyle(el).position),
		).not.toBe("fixed");
	});
});

test.describe("logo hover", () => {
	test("turns the logo DivineFlow red with a glow, and back on leave", async ({ page }, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		const home = page.getByRole("link", { name: "Daniel Khojaste, home" });
		const style = () =>
			home.evaluate((el) => {
				const cs = getComputedStyle(el);
				return { color: cs.color, filter: cs.filter };
			});
		expect(await style()).toEqual({ color: "rgb(245, 236, 236)", filter: "none" });
		// The signature effect is gone.
		await expect(page.locator(".logo__red")).toHaveCount(0);

		await home.hover();
		const [r, g, b] = colors.logoHover.color.match(/\d+/g)!;
		await expect.poll(async () => (await style()).color).toBe(`rgb(${r}, ${g}, ${b})`);
		expect((await style()).filter).toContain("drop-shadow");

		await page.mouse.move(700, 600);
		await expect.poll(async () => (await style()).color).toBe("rgb(245, 236, 236)");
	});
});

test.describe("main colour", () => {
	test("sets every colour on the page from the one in site.config.ts", async ({ page }) => {
		await page.goto("/");
		const accent = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue("--shade-accent").trim(),
		);
		expect(accent).toBe(brand.join(" "));
		// Buttons use it.
		const button = page.locator(".hero").getByRole("link", { name: "View my work" });
		expect(await button.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
			`rgb(${brand.join(", ")})`,
		);
	});
});
