import { expect, test, type Page } from "@playwright/test";
import {
	animation,
	colors,
	hero as heroCopy,
	menuUnderlineFlow,
	sections,
} from "../../src/site.config";

const hero = (page: Page) => page.locator("section.hero");
const COMPACT = "(max-width: 1023px), (max-aspect-ratio: 115/100)";
/** Below this the header has the menu button; at and above it, the side nav (desktop). */
const SIDE_NAV = "(min-width: 1024px) and (min-height: 600px)";

/** The desktop project gets the side nav, so menu tests use a tablet-sized window there. */
async function useMenuLayout(page: Page) {
	if (await page.evaluate((q) => matchMedia(q).matches, SIDE_NAV)) {
		await page.setViewportSize({ width: 1000, height: 800 });
	}
}

async function box(page: Page, selector: string) {
	const rect = await page.locator(selector).first().boundingBox();
	if (!rect) throw new Error(`${selector} is not visible`);
	return rect;
}

test.describe("hero", () => {
	test("fills the viewport height", async ({ page }) => {
		await page.goto("/");
		const viewport = page.viewportSize()!;
		const rect = await box(page, "section.hero");
		const floor = (await page.evaluate((query) => matchMedia(query).matches, COMPACT)) ? 480 : 600;
		expect(Math.round(rect.height)).toBe(Math.max(viewport.height, floor));
		expect(Math.round(rect.width)).toBe(viewport.width);
	});

	test("never gets shorter than its floor on short viewports", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 480 });
		await page.goto("/");
		expect(Math.round((await box(page, "section.hero")).height)).toBe(600);

		// Landscape phone: compact layout with a lower floor.
		await page.setViewportSize({ width: 740, height: 360 });
		expect(Math.round((await box(page, "section.hero")).height)).toBe(480);
	});

	test("shows the name as one heading, with the last name as a deep red shape behind the throne", async ({
		page,
	}) => {
		await page.goto("/");

		const heading = page.getByRole("heading", { level: 1 });
		await expect(heading).toHaveAccessibleName("Daniel Khojaste");

		const styles = await page.evaluate(() => {
			const last = getComputedStyle(document.querySelector(".hero__last")!);
			const first = getComputedStyle(document.querySelector(".hero__first")!);
			const name = getComputedStyle(document.querySelector(".hero__name")!);
			const figure = getComputedStyle(document.querySelector(".hero__figure")!);
			return {
				lastColor: last.color,
				lastClip: last.backgroundClip || last.getPropertyValue("-webkit-background-clip"),
				lastBackground: last.backgroundImage,
				lastSize: parseFloat(last.fontSize),
				firstSize: parseFloat(first.fontSize),
				nameZ: Number(name.zIndex),
				figureZ: Number(figure.zIndex),
			};
		});

		expect(styles.lastColor).toBe("rgba(0, 0, 0, 0)");
		expect(styles.lastClip).toBe("text");
		expect(styles.lastBackground).toContain("linear-gradient");
		expect(styles.nameZ).toBeLessThan(styles.figureZ);
		expect(styles.lastSize).toBeGreaterThan(styles.firstSize * 2);
		// No ghost copy of the name over the photo any more.
		await expect(page.locator("[data-name-ghost]")).toHaveCount(0);
	});

	test("the throne image loads and overlaps the last name", async ({ page }) => {
		await page.goto("/");
		const img = page.locator(".hero__figure img");
		await expect(img).toHaveAttribute("alt", /throne made of golf clubs/);
		await expect
			.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
			.toBe(true);

		const last = await box(page, ".hero__last");
		const figure = await box(page, ".hero__figure");
		expect(figure.y).toBeLessThan(last.y + last.height);
		expect(figure.y + figure.height).toBeLessThanOrEqual(
			(await box(page, "section.hero")).height + 1,
		);
	});

	test("desktop throne is 90% of the hero height", async ({ page }, info) => {
		test.skip(info.project.name !== "desktop", "desktop layout only");
		await page.goto("/");
		const heroBox = await box(page, "section.hero");
		const figure = await box(page, ".hero__figure");
		expect(figure.height / heroBox.height).toBeCloseTo(0.9, 2);
	});

	test("makes two claims: the role with location, and the current project", async ({ page }) => {
		await page.goto("/");
		const claims = page.locator(".hero__claim");
		await expect(claims).toHaveCount(2);

		await expect(claims.nth(0)).toContainText("Software Developer");
		await expect(claims.nth(0)).toContainText("Based in Canada");
		await expect(hero(page)).not.toContainText("Ottawa");
		await expect(hero(page)).not.toContainText("relocat");

		// Solid white headlines with a red glow, not a gradient fill.
		const headline = await claims
			.nth(0)
			.locator(".hero__headline")
			.evaluate((el) => {
				const cs = getComputedStyle(el);
				return { color: cs.color, image: cs.backgroundImage, shadow: cs.textShadow };
			});
		expect(headline.color).toBe("rgb(255, 255, 255)");
		expect(headline.image).toBe("none");
		expect(headline.shadow).not.toBe("none");

		const project = claims.nth(1).getByRole("link", { name: /Lineup/ });
		await expect(claims.nth(1)).toContainText("Currently building");
		await expect(project).toHaveAttribute("href", "https://github.com/DanielKhojaste/lineup");
		await expect(project).toHaveAttribute("target", "_blank");
		await expect(project).toHaveAttribute("rel", /noopener/);

		await expect(hero(page)).not.toContainText("ApotheonAI");
		await expect(hero(page)).not.toContainText("temporary slogan");
	});

	test("claims sit on either side, with their labels on one line at every size", async ({
		page,
	}) => {
		for (const size of [
			{ width: 1440, height: 900 },
			{ width: 1024, height: 768 },
			{ width: 820, height: 1180 },
			{ width: 390, height: 844 },
			{ width: 360, height: 640 },
		]) {
			await page.setViewportSize(size);
			await page.goto("/");
			const [a, b] = await Promise.all([
				box(page, ".hero__claim--start"),
				box(page, ".hero__claim--end"),
			]);
			expect(a.x + a.width).toBeLessThan(b.x);
			const [based, building] = await Promise.all([
				box(page, ".hero__claim--start .hero__kicker"),
				box(page, ".hero__claim--end .hero__kicker"),
			]);
			expect(based.height).toBeLessThan(20);
			expect(Math.abs(based.y - building.y)).toBeLessThanOrEqual(0.5);

			// The headlines start on the same line: "SOFTWARE" level with "LINEUP".
			const [software, lineup] = await Promise.all([
				box(page, ".hero__claim--start .hero__headline"),
				box(page, ".hero__claim--end .hero__headline"),
			]);
			expect(Math.abs(software.y - lineup.y)).toBeLessThanOrEqual(1);
			// No underlines in the hero any more.
			await expect(page.locator(".hero__rule")).toHaveCount(0);
		}
	});

	test("fits the whole hero on portrait phones without scrolling", async ({ page }) => {
		for (const size of [
			{ width: 375, height: 553 },
			{ width: 390, height: 844 },
			{ width: 820, height: 1180 },
		]) {
			await page.setViewportSize(size);
			await page.goto("/");
			const hint = await box(page, ".hero__hint");
			const claims = await box(page, ".hero__info");
			expect(hint.y + hint.height).toBeLessThanOrEqual(size.height);
			expect(claims.y + claims.height).toBeLessThanOrEqual(hint.y);
			expect(claims.x).toBeGreaterThanOrEqual(0);
			expect(claims.x + claims.width).toBeLessThanOrEqual(size.width);
		}
	});

	test("has no buttons, but a scroll prompt that fades in after a few seconds", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(hero(page).locator(".button, .hero__actions")).toHaveCount(0);

		const hint = hero(page).locator("[data-scroll-hint]");
		await expect(hint).toHaveText(heroCopy.scrollHint);
		await expect(hint).toHaveAttribute("href", "#about");
		await expect(hint).toBeHidden();
		await expect(hint).toBeVisible({ timeout: animation.scrollHint.delay * 1000 + 3000 });
		// Centred under the throne.
		const rect = (await hint.boundingBox())!;
		expect(Math.abs(rect.x + rect.width / 2 - page.viewportSize()!.width / 2)).toBeLessThanOrEqual(
			2,
		);

		// Just text, close to the bottom edge.
		await expect(hint.locator("canvas, [data-divine-flow]")).toHaveCount(0);
		expect(rect.y).toBeGreaterThan(page.viewportSize()!.height * 0.9);
		expect(rect.y + rect.height).toBeLessThanOrEqual(page.viewportSize()!.height);

		// Gone once you scroll.
		await page.evaluate(() => window.scrollTo(0, 400));
		await expect(hint).toBeHidden();
	});

	test("draws DivineFlow in on load, alongside the logo rather than after it", async ({ page }) => {
		await page.goto("/");
		const flow = page.locator(".hero > [data-divine-flow]");
		await expect(flow).toHaveAttribute("data-reveal", /duration/);
		await expect(flow).not.toHaveAttribute("data-after-logo");
		// Mounted while the logo is still being written.
		await expect(flow).toHaveAttribute("data-flow-ready", "true");
		await expect(page.locator("svg[data-logo-draw]")).not.toHaveAttribute("data-drawn", "true");

		// Filaments canvas on top of a separate, GPU-scaled bloom canvas.
		await expect(flow.locator("canvas[data-divine-flow-bloom]")).toHaveCount(1);
		// Both are drawn by a worker: their contexts were handed over, so the page can't take them.
		const transferred = await flow.locator("canvas").evaluateAll((canvases) =>
			canvases.map((c) => {
				try {
					return (c as HTMLCanvasElement).getContext("2d") === null;
				} catch {
					return true;
				}
			}),
		);
		expect(transferred).toEqual([true, true]);
		const canvas = flow.locator("canvas[data-divine-flow-canvas]");
		await expect(canvas).toHaveAttribute("aria-hidden", "true");
		const size = await canvas.evaluate((el: HTMLCanvasElement) => [el.width, el.height]);
		expect(size[0]).toBeGreaterThan(0);
		expect(size[1]).toBeGreaterThan(0);
	});

	test("has no console errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		page.on("console", (message) => {
			if (message.type() === "error") errors.push(message.text());
		});
		await page.goto("/");
		await page.waitForTimeout(500);
		expect(errors).toEqual([]);
	});
});

test.describe("menu", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await useMenuLayout(page);
	});

	test("opens and closes from the keyboard, trapping focus and returning it", async ({ page }) => {
		await page.goto("/");
		const button = page.locator("[data-menu-button]");
		const menu = page.locator("#site-menu");
		await expect(button).toHaveAttribute("aria-controls", "site-menu");
		await expect(menu).toBeHidden();

		await button.focus();
		await page.keyboard.press("Enter");
		await expect(button).toHaveAttribute("aria-expanded", "true");
		await expect(button).toHaveAccessibleName("Close menu");
		await expect(menu).toBeVisible();
		await expect(menu.getByRole("link", { name: "Intro", exact: true })).toBeFocused();
		expect(await page.locator("#smooth-wrapper").evaluate((el) => (el as HTMLElement).inert)).toBe(
			true,
		);

		await page.keyboard.press("Escape");
		await expect(button).toHaveAttribute("aria-expanded", "false");
		await expect(button).toBeFocused();
		await expect(menu).toBeHidden();
		expect(await page.locator("#smooth-wrapper").evaluate((el) => (el as HTMLElement).inert)).toBe(
			false,
		);
	});

	test("lists only the sections, centred, over a blurred page", async ({ page }) => {
		await page.goto("/");
		await page.locator("[data-menu-button]").click();
		const menu = page.locator("#site-menu");
		const viewport = page.viewportSize()!;
		for (const { label } of sections) {
			const link = menu.getByRole("link", { name: label, exact: true });
			await expect(link).toBeVisible();
			const rect = (await link.boundingBox())!;
			expect(Math.abs(rect.x + rect.width / 2 - viewport.width / 2)).toBeLessThan(2);
		}
		await expect(menu.getByRole("link")).toHaveCount(sections.length);
		await expect(menu).not.toContainText("Currently");
		const blur = await menu.evaluate(
			(el) =>
				getComputedStyle(el).backdropFilter ||
				getComputedStyle(el).getPropertyValue("-webkit-backdrop-filter"),
		);
		expect(blur).toContain("blur");
	});

	test("draws a DivineFlow underline under a hovered link, only while hovered", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		await page.locator("[data-menu-button]").click();
		const link = page.locator("#site-menu").getByRole("link", { name: "Skills", exact: true });
		const flow = link.locator("[data-divine-flow]");
		await expect(flow).toHaveAttribute("data-manual", "");
		// One wavy strand of the background's DivineFlow, drawn out from where the settings say.
		const options = JSON.parse((await flow.getAttribute("data-options"))!);
		const start = { center: [0.5, "both"], left: [0, "right"], right: [1, "left"] }[
			menuUnderlineFlow.from
		];
		expect(options).toMatchObject({
			originX: start[0],
			sides: start[1],
			lineCount: 1,
			revealStagger: 0,
			wave: menuUnderlineFlow.wave,
			wavePeriods: menuUnderlineFlow.waves,
			tailSway: menuUnderlineFlow.sway,
			amplitude: 0,
			fadeFromOrigin: false,
		});
		// Every link draws exactly the same strand, in the configured colours.
		const all = await page
			.locator("#site-menu [data-divine-flow]")
			.evaluateAll((els) => els.map((el) => el.getAttribute("data-options")));
		expect(new Set(all).size).toBe(1);
		expect(options.theme).toEqual(colors.menuUnderline);
		// Nothing runs until it's needed.
		await expect(flow.locator("canvas")).toHaveCount(0);

		await link.hover();
		await expect(flow).toHaveAttribute("data-flow-ready", "true");
		await expect(flow.locator("canvas[data-divine-flow-canvas]")).toHaveCount(1);
		// The menu's own focus on open doesn't light up the first link for mouse users.
		await expect(
			page
				.locator("#site-menu")
				.getByRole("link", { name: "Intro", exact: true })
				.locator("canvas"),
		).toHaveCount(0);
	});

	test("closes when the overlay is clicked, and a section link closes it too", async ({ page }) => {
		await page.goto("/");
		const button = page.locator("[data-menu-button]");
		const menu = page.locator("#site-menu");
		await button.click();
		await expect(menu).toBeVisible();
		await page.mouse.click(10, page.viewportSize()!.height - 10);
		await expect(menu).toBeHidden();
		await expect(button).toHaveAttribute("aria-expanded", "false");

		await button.click();
		await menu.getByRole("link", { name: "Contact", exact: true }).click();
		await expect(menu).toBeHidden();
		await expect(page).toHaveURL(/#contact$/);
	});
});

test.describe("header", () => {
	test("shows the logo everywhere, and the menu button on phones and tablets", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("link", { name: "Daniel Khojaste, home" })).toBeVisible();
		if (await page.evaluate((q) => matchMedia(q).matches, SIDE_NAV)) {
			// Desktop has the side nav instead.
			await expect(page.locator("[data-menu-button]")).toBeHidden();
			await page.setViewportSize({ width: 1000, height: 800 });
		}
		const menu = page.getByRole("button", { name: "Open menu" });
		await expect(menu).toBeVisible();
		await expect(menu).toHaveAttribute("aria-expanded", "false");
		const rect = await menu.boundingBox();
		expect(rect!.width).toBeGreaterThanOrEqual(44);
		expect(rect!.height).toBeGreaterThanOrEqual(44);
	});

	test("keeps the menu button on screen after scrolling down", async ({ page }) => {
		await page.goto("/");
		await useMenuLayout(page);
		await page.locator("#contact").scrollIntoViewIfNeeded();
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
		const button = page.getByRole("button", { name: "Open menu" });
		await expect(button).toBeInViewport();
		await button.click();
		await expect(page.locator("#site-menu")).toBeVisible();
	});

	test("writes the logo stroke by stroke and ends with the original artwork", async ({ page }) => {
		await page.goto("/");
		const logo = page.locator("svg[data-logo-draw]");

		// Four hand-traced pen strokes (D stem, D bowl, K stem, K arm + leg) inside the mask.
		await expect(logo.locator("mask .logo__pen")).toHaveCount(4);
		// The K stem is clipped so it writes as a clean italic I before the arm and leg.
		const clip = await logo.locator("mask .logo__pen").nth(2).getAttribute("clip-path");
		expect(clip).toMatch(/^url\(#logo-pen-\d+-clip-2\)$/);
		await expect(logo.locator(`clipPath${clip!.slice(4, -1)}`)).toHaveCount(1);

		await expect(logo).toHaveAttribute("data-drawn", "true", { timeout: 6_000 });
		// Once written, the mask is removed so the logo is exactly the artwork.
		await expect(logo.locator(".logo__ink")).not.toHaveAttribute("mask", /.*/);
	});

	test("skips the writing animation when reduced motion is preferred", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		const logo = page.locator("svg[data-logo-draw]");
		await expect(logo).toHaveAttribute("data-drawn", "true", { timeout: 1_000 });
		await expect(logo.locator(".logo__ink")).not.toHaveAttribute("mask", /.*/);
	});
});

test.describe("placeholder sections", () => {
	test("give the page room to scroll and the hero links somewhere to go", async ({ page }) => {
		await page.goto("/");
		for (const id of ["work", "skills", "contact"]) {
			await expect(page.locator(`main section#${id} h2`)).toBeVisible();
		}
		const height = await page.evaluate(() => document.documentElement.scrollHeight);
		expect(height).toBeGreaterThan(page.viewportSize()!.height * 2);
		await expect(page.locator("footer")).toContainText("Daniel Khojaste");
	});

	test("the scroll prompt takes you to About", async ({ page }) => {
		await page.goto("/");
		const hint = page.locator("[data-scroll-hint]");
		await expect(hint).toBeVisible({ timeout: animation.scrollHint.delay * 1000 + 3000 });
		await hint.click();
		await expect(page).toHaveURL(/#about$/);
		await expect(page.locator("#about-title")).toBeInViewport();
		await expect
			.poll(() =>
				page.evaluate(() => Math.abs(scrollY - document.getElementById("about")!.offsetTop)),
			)
			.toBeLessThan(3);
	});
});
