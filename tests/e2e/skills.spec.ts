import { expect, test, type Page } from "@playwright/test";
import { skills } from "../../src/site.config";

const all = skills.groups.flatMap((g) => g.skills);

/** Scroll to Skills and wait for the smooth scroller to settle, so clicks land where they aim. */
async function showSkills(page: Page) {
	await page.locator("#skills").scrollIntoViewIfNeeded();
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

test.describe("skills", () => {
	test("comes after Work, with a row per group and every tool as a logo", async ({ page }) => {
		await page.goto("/");
		const ids = await page
			.locator("main > section[id]")
			.evaluateAll((els) => els.map((el) => el.id));
		expect(ids.slice(0, 4)).toEqual(["intro", "about", "work", "skills"]);

		await expect(page.locator("#skills-title")).toHaveAccessibleName(
			skills.headline.replace(/[[\]]/g, ""),
		);
		await expect(page.locator("#skills [data-skill-row]")).toHaveCount(skills.groups.length);
		const logos = page.locator("#skills [data-skill]");
		await expect(logos).toHaveCount(all.length);
		// Every one is a drawn logo, named for screen readers, not text.
		await expect(page.locator("#skills [data-skill] svg")).toHaveCount(all.length);
		await expect(page.locator("#skills .tech--text")).toHaveCount(0);
		for (const s of all) {
			await expect(page.getByRole("img", { name: s.name, exact: true }).first()).toBeAttached();
		}
	});

	test("draws no lines between the rows", async ({ page }) => {
		await page.goto("/");
		const borders = await page.locator("#skills [data-skill-row]").evaluateAll((rows) =>
			rows.map((el) => {
				const cs = getComputedStyle(el);
				return `${cs.borderTopStyle} ${cs.borderBottomStyle}`;
			}),
		);
		expect(borders.every((b) => b === "none none")).toBe(true);
	});

	test("picking a project lights its tools and fades the rest", async ({ page }) => {
		await page.goto("/");
		await showSkills(page);
		const pick = (name: string) => page.locator(`#skills [data-pick="${name}"]`);
		await expect(pick("")).toHaveAttribute("aria-pressed", "true");

		// Clicks can land while the smooth scroller is still easing the section into place, so
		// retry until the click takes.
		const choose = (name: string) =>
			expect(async () => {
				await pick(name).click();
				await expect(pick(name)).toHaveAttribute("aria-pressed", "true", { timeout: 500 });
			}).toPass();
		await choose("Lineup");
		await expect(pick("")).toHaveAttribute("aria-pressed", "false");
		const lineup = all.filter((s) => s.usedIn.includes("Lineup")).map((s) => s.name);
		const lit = await page
			.locator("#skills [data-skill].is-lit")
			.evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.skill));
		expect(lit).toEqual(lineup);
		await expect
			.poll(() =>
				page
					.locator('#skills [data-skill="Docker"]')
					.evaluate((el) => getComputedStyle(el).opacity),
			)
			.toBe("0.16");

		await choose("");
		await expect(page.locator("#skills [data-skill].is-lit")).toHaveCount(0);
	});

	test("hovering a logo names it on wide screens", async ({ page }, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		await showSkills(page);
		await expect
			.poll(() =>
				page
					.locator("#skills [data-skill-row]")
					.last()
					.evaluate((el) => getComputedStyle(el).opacity),
			)
			.toBe("1");
		const react = page.locator('#skills [data-skill="React"]');
		await react.hover();
		await expect(
			page
				.locator("#skills [data-skill-row]", { has: page.locator('[data-skill="React"]') })
				.locator("[data-caption]"),
		).toHaveText("React");
		// It slides in rather than appearing at once.
		const caption = page
			.locator("#skills [data-skill-row]", { has: page.locator('[data-skill="React"]') })
			.locator("[data-caption]");
		expect(await caption.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain(
			"opacity",
		);
		await expect.poll(() => caption.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
	});

	test("rows don't overlap at tablet and desktop sizes", async ({ page }) => {
		for (const size of [
			{ width: 820, height: 695 },
			{ width: 1024, height: 768 },
			{ width: 1440, height: 900 },
		]) {
			await page.setViewportSize(size);
			await page.goto("/");
			const overlaps = await page.evaluate(() => {
				const hit = (a: DOMRect, b: DOMRect) =>
					!(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
				return [...document.querySelectorAll("#skills [data-skill-row]")].filter((row) =>
					hit(
						row.querySelector(".skills__name")!.getBoundingClientRect(),
						row.querySelector(".skills__logos")!.getBoundingClientRect(),
					),
				).length;
			});
			expect(overlaps, `${size.width}x${size.height}`).toBe(0);
		}
	});
});
