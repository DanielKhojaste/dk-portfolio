import { expect, test, type Page } from "@playwright/test";
import { FILL_EMPTY } from "../../src/scripts/about";
import {
	about,
	animation,
	brand,
	colors,
	sections,
	shades,
	sideNavUnderlineFlow,
} from "../../src/site.config";

/** FILL_FULL as the browser reports it back. */
const FILL_FULL_COMPUTED = "inset(-30% -8%)";

const SIDE_NAV = "(min-width: 1024px) and (min-height: 600px)";
const hasSideNav = (page: Page) => page.evaluate((q) => matchMedia(q).matches, SIDE_NAV);

/** Scroll a section into view and wait for smooth scrolling to settle, so nothing moves under the mouse. */
async function showSection(page: Page, id: string) {
	await page.locator(`#${id}`).scrollIntoViewIfNeeded();
	await expect
		.poll(() =>
			page.evaluate(() => {
				const content = document.getElementById("smooth-content");
				if (!content) return 0;
				const offset = -new DOMMatrix(getComputedStyle(content).transform).m42;
				return Math.round(Math.abs(offset - scrollY));
			}),
		)
		.toBe(0);
}

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
		const opacity = (selector: string) =>
			page.locator(selector).evaluate((el) => getComputedStyle(el).opacity);
		// Waiting below the fold: the red copy is clipped away to nothing and the facts are hidden, but
		// the text under the headline is there from the start.
		expect(await clip()).toBe(FILL_EMPTY);
		expect(await opacity("#about .about__facts")).toBe("0");
		expect(await opacity("#about .about__text")).toBe("1");

		await page.locator("#about").scrollIntoViewIfNeeded();
		// Then wiped in, reaching past the word on every side so no letter is left half filled.
		await expect.poll(clip, { timeout: 6_000 }).toBe(FILL_FULL_COMPUTED);
		await expect.poll(() => opacity("#about .about__facts")).toBe("1");
	});

	test("nudges the Lineup arrow on hover, like the hero link, without a glow", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		await showSection(page, "about");
		// Let About's entrance finish: the facts slide up into place, which would move the link out
		// from under the mouse.
		await expect
			.poll(() =>
				page.locator("#about .about__facts").evaluate((el) => {
					const cs = getComputedStyle(el);
					return `${cs.opacity} ${new DOMMatrix(cs.transform).m42}`;
				}),
			)
			.toBe("1 0");
		const link = page.locator("#about .about__link");
		const arrow = link.locator(".about__arrow");
		const shift = () => arrow.evaluate((el) => getComputedStyle(el).translate);
		expect(await shift()).toBe("none");
		await link.hover();
		// The arrow nudges up and right, like the hero's Lineup link, and nothing glows.
		await expect.poll(shift).not.toBe("none");
		expect(await link.evaluate((el) => getComputedStyle(el).textShadow)).toBe("none");
	});

	test("shows everything straight away for reduced motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		const fill = page.locator("#about [data-fill]").first();
		expect(await fill.evaluate((el) => getComputedStyle(el).clipPath)).toBe(FILL_FULL_COMPUTED);
		expect(
			await page.locator("#about .about__facts").evaluate((el) => getComputedStyle(el).opacity),
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

		// Moving on: the new label fills and the old one empties at the underline's pace. Read straight
		// after the change, while the old one is still emptying.
		const change = await page.evaluate(() => {
			document.dispatchEvent(new CustomEvent("section:change", { detail: "skills" }));
			const pace = (id: string) =>
				getComputedStyle(
					document.querySelector(`[data-side-nav-link="${id}"] .side-nav__label`)!,
				).transitionDuration.split(", ")[0];
			return {
				filling: pace("skills"),
				emptying: pace("about"),
				leaving: [...document.querySelectorAll<HTMLElement>("[data-leaving]")].map(
					(el) => el.dataset.sideNavLink,
				),
			};
		});
		expect(change.filling).toBe(`${animation.sideNav.labelIn}s`);
		expect(change.emptying).toBe(`${animation.sideNav.labelOut}s`);
		expect(change.leaving).toContain("about");
		expect(change.leaving).not.toContain("skills");
		expect(animation.sideNav.labelIn).toBe(animation.sideNav.underlineIn);
		expect(animation.sideNav.labelOut).toBe(animation.sideNav.underlineOut);
		// Once it has emptied, hovering it goes back to the hover's pace.
		await expect(nav.locator("[data-leaving]")).toHaveCount(0);
		expect(
			await nav
				.locator('[data-side-nav-link="about"] .side-nav__label')
				.evaluate((el) => getComputedStyle(el).transitionDuration.split(", ")[0]),
		).toBe(`${animation.textHover.duration}s`);

		// And it follows real scrolling.
		await page.locator("#contact").scrollIntoViewIfNeeded();
		await expect(nav.locator("[aria-current]")).toHaveAttribute("href", "#contact");

		await page.evaluate(() => window.scrollTo(0, 0));
		await expect(nav).toBeHidden();
	});

	test("uses its own, flatter underline; labels glow, slide right and whiten their marker on hover", async ({
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

		await showSection(page, "about");
		const link = page.locator('[data-side-nav-link="work"]');
		const label = link.locator(".side-nav__label");
		const marker = link.locator(".side-nav__marker");
		const style = () =>
			label.evaluate((el) => {
				const cs = getComputedStyle(el);
				return { color: cs.color, glow: cs.textShadow, translate: cs.translate };
			});
		expect(await style()).toMatchObject({
			// Filled grey (not an outline) until hovered.
			color: "rgba(245, 236, 236, 0.42)",
			glow: "none",
			translate: "none",
		});

		await link.hover();
		await expect.poll(async () => (await style()).translate).toBe(`${animation.sideNav.nudge}px`);
		const hovered = await style();
		expect(hovered.color).toBe("rgb(245, 236, 236)");
		expect(hovered.glow).toContain("14px");
		await expect
			.poll(() => marker.evaluate((el) => getComputedStyle(el).color))
			.toBe("rgb(245, 236, 236)");
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
	test("writes a brush stroke under the logo, without a glow or growing, and clears it on leave", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		test.skip(animation.logoUnderline.style === "off", "the underline is off");
		await page.goto("/");
		const home = page.getByRole("link", { name: "Daniel Khojaste, home" });
		const underline = home.locator("[data-logo-underline]");
		const drawn = () =>
			underline.evaluate((el) => {
				const dash = el.querySelectorAll<SVGPathElement>(".logo-underline__draw");
				return {
					opacity: getComputedStyle(el).opacity,
					offsets: [...dash].map((d) => getComputedStyle(d).strokeDashoffset),
				};
			});
		const strokes = animation.logoUnderline.style === "double" ? 2 : 1;
		await expect(underline.locator("mask")).toHaveCount(strokes);
		expect(await drawn()).toEqual({ opacity: "0", offsets: Array(strokes).fill("1px") });

		await home.hover();
		await expect.poll(drawn).toEqual({ opacity: "1", offsets: Array(strokes).fill("0px") });
		// It sits under the logo, by the set drop, and the logo itself stays white and the same size.
		const [logo, line] = await Promise.all([
			home.locator(".logo").boundingBox(),
			underline.boundingBox(),
		]);
		expect(line!.y + line!.height).toBeCloseTo(
			logo!.y + logo!.height + animation.logoUnderline.drop,
			0,
		);
		const style = await home.evaluate((el) => {
			const cs = getComputedStyle(el);
			return { color: cs.color, filter: cs.filter, scale: cs.scale };
		});
		expect(style).toEqual({ color: "rgb(245, 236, 236)", filter: "none", scale: "none" });

		await page.mouse.move(700, 600);
		await expect.poll(async () => (await drawn()).opacity).toBe("0");
	});

	test("with the underline off, the logo glows in the main colour instead", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		test.skip(animation.logoUnderline.style !== "off", "the underline is on");
		await page.goto("/");
		const home = page.getByRole("link", { name: "Daniel Khojaste, home" });
		await home.hover();
		await expect
			.poll(() => home.evaluate((el) => getComputedStyle(el).filter))
			.toContain(`${colors.logoHover.glowSize}px`);
		expect(await home.evaluate((el) => getComputedStyle(el).filter)).toContain(
			`rgb(${brand.join(", ")})`,
		);
	});
});

test.describe("main colour", () => {
	test("sets every colour on the page from the one in site.config.ts", async ({ page }) => {
		await page.goto("/");
		const accent = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue("--shade-accent").trim(),
		);
		expect(accent).toBe(brand.join(" "));
		// The hero photo is only regraded for a different main colour.
		expect(
			await page.locator(".hero__figure img").evaluate((el) => getComputedStyle(el).filter),
		).toBe("none");
		// The other shades are worked out from it.
		const bright = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue("--shade-bright").trim(),
		);
		expect(bright).toBe(shades.bright.join(" "));
	});
});
