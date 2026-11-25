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

	test("a title too long for its card slides; the rest stay still and nothing leaves its card", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#music").scrollIntoViewIfNeeded();
		await page.evaluate(() => document.fonts.ready);
		await page.waitForTimeout(800);
		const long = music.songs.findIndex((s) => s.title.length > 40);
		const titles = page.locator("#music .song__title");
		await expect(titles.nth(long)).toHaveClass(/is-moving/);
		await expect(titles.nth(0)).not.toHaveClass(/is-moving/);
		// The moving text actually moves.
		const x = () =>
			titles
				.nth(long)
				.locator("span")
				.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
		await expect.poll(x, { timeout: 8000 }).toBeLessThan(-20);
		// Every line stays inside its card.
		const overflow = await page.locator("#music [data-marquee]").evaluateAll(
			(boxes) =>
				boxes.filter((b) => {
					const card = b.closest(".song")!.getBoundingClientRect();
					const r = b.getBoundingClientRect();
					return r.right > card.right + 0.5 || r.left < card.left - 0.5;
				}).length,
		);
		expect(overflow).toBe(0);
	});
});
