import { expect, test } from "@playwright/test";
import { music } from "../../src/site.config";

test.describe("music", () => {
	test("sits between Background and Contact, with a card per song linking to Spotify", async ({
		page,
	}) => {
		await page.goto("/");
		const ids = await page
			.locator("main > section[id]")
			.evaluateAll((els) => els.map((el) => el.id));
		expect(ids.slice(-3)).toEqual(["background", "music", "contact"]);
		await expect(page.locator("#music-title")).toHaveAccessibleName(
			music.headline.replace(/[[\]]/g, ""),
		);
		const cards = page.locator("#music a.song");
		await expect(cards).toHaveCount(music.songs.length);
		for (const [i, song] of music.songs.entries()) {
			const card = cards.nth(i);
			await expect(card).toHaveAttribute("href", song.url);
			await expect(card).toHaveAttribute("target", "_blank");
			await expect(card).toHaveAttribute("rel", /noopener/);
			await expect(card).toHaveAccessibleName(
				`${song.title} ${song.artist} ${song.album} on Spotify (opens in a new tab)`,
			);
		}
		await expect(page.locator('a[href="#music"]').first()).toBeAttached();
	});

	test("cards are hollow until hovered, then fill in and light the title", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		const card = page.locator("#music a.song").first();
		await card.scrollIntoViewIfNeeded();
		await page.waitForTimeout(1500);
		const title = card.locator(".song__title");
		expect(await title.evaluate((el) => getComputedStyle(el).color)).toBe("rgba(0, 0, 0, 0)");
		await card.hover();
		await expect
			.poll(() => title.evaluate((el) => getComputedStyle(el).color))
			.toBe("rgb(255, 255, 255)");
		await expect
			.poll(() => card.evaluate((el) => getComputedStyle(el, "::before").opacity))
			.toBe("1");
	});

	test("only lines too long for their card are marked, and none leave their card", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#music").scrollIntoViewIfNeeded();
		await page.evaluate(() => document.fonts.ready);
		await page.waitForTimeout(800);
		const long = music.songs.findIndex((s) => s.title.length > 40);
		const titles = page.locator("#music .song__title");
		await expect(titles.nth(long)).toHaveClass(/is-overflowing/);
		await expect(titles.nth(0)).not.toHaveClass(/is-overflowing/);
		const outside = await page.locator("#music [data-marquee]").evaluateAll(
			(boxes) =>
				boxes.filter((b) => {
					const card = b.closest(".song")!.getBoundingClientRect();
					const r = b.getBoundingClientRect();
					return r.right > card.right + 0.5 || r.left < card.left - 0.5;
				}).length,
		);
		expect(outside).toBe(0);
	});

	test("a long line waits for a hover, slides at a steady pace, and keeps going after the mouse leaves", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		const long = music.songs.findIndex((s) => s.title.length > 40);
		const card = page.locator("#music a.song").nth(long);
		await card.scrollIntoViewIfNeeded();
		await page.waitForTimeout(1500);
		const x = () =>
			card
				.locator(".song__title > span")
				.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
		// Not hovered: still.
		expect(await x()).toBe(0);
		await page.waitForTimeout(1000);
		expect(await x()).toBe(0);
		// Hovered: it starts.
		await card.hover();
		await expect.poll(x, { timeout: 4000 }).toBeLessThan(-10);
		// Linear: the same distance in the same time, twice in a row.
		const a = await x();
		await page.waitForTimeout(1000);
		const b = await x();
		await page.waitForTimeout(1000);
		const c = await x();
		expect(Math.abs(b - a - (c - b))).toBeLessThan(12);
		// The mouse leaves: the run carries on.
		await page.mouse.move(0, 0);
		const d = await x();
		await page.waitForTimeout(1000);
		expect(await x()).toBeLessThan(d - 20);
	});

	test("on touch screens, nothing slides on its own: not after a jump to the section, not when a card scrolls into view", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "mobile", "touch only");
		await page.goto("/");
		const long = music.songs.findIndex((s) => s.title.length > 40);
		const card = page.locator("#music a.song").nth(long);
		const x = () =>
			card
				.locator(".song__title > span")
				.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
		// Jump there from the menu, like a visitor would.
		await page.locator("[data-menu-button]").click();
		await page.locator('#site-menu a[href="#music"]').click();
		await page.waitForTimeout(2500);
		await card.scrollIntoViewIfNeeded();
		await page.waitForTimeout(2500);
		expect(await x()).toBe(0);
	});
});
