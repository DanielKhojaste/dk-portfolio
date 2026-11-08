import { expect, test, type Page } from "@playwright/test";
import { work } from "../../src/site.config";

/** Scroll to a section and wait for the smooth scroller to settle on it. */
async function showSection(page: Page, id: string) {
	await page.locator(`#${id}`).scrollIntoViewIfNeeded();
	await expect
		.poll(() =>
			page.evaluate(() => {
				const content = document.getElementById("smooth-content");
				// No smooth scrolling (touch screens): the page is already there.
				if (!content || getComputedStyle(content).transform === "none") return 0;
				const offset = -new DOMMatrix(getComputedStyle(content).transform).m42;
				return Math.round(Math.abs(offset - scrollY));
			}),
		)
		.toBe(0);
}

const rows = (page: Page) => page.locator("#projects [data-work-row]");
const panelHeight = (page: Page, i: number) =>
	rows(page)
		.nth(i)
		.locator("[data-work-panel]")
		.evaluate((el) => el.getBoundingClientRect().height);

test.describe("work", () => {
	test("comes after About, with a red word in the headline and one row per project", async ({
		page,
	}) => {
		await page.goto("/");
		const ids = await page
			.locator("main > section[id]")
			.evaluateAll((els) => els.map((el) => el.id));
		expect(ids.slice(0, 3)).toEqual(["intro", "about", "projects"]);

		await expect(page.locator("#projects-title")).toHaveAccessibleName(
			work.headline.replace(/[[\]]/g, ""),
		);
		await expect(page.locator("#projects [data-fill]")).toHaveCount(1);
		await expect(rows(page)).toHaveCount(work.projects.length);
		for (const [i, project] of work.projects.entries()) {
			const row = rows(page).nth(i);
			await expect(row.locator(".work__name")).toHaveText(project.name);
			// The tools are shown once, as logos (or their name if there's no logo), next to the name.
			await expect(row.locator(".work__stack .tech")).toHaveCount(project.stack.length);
			await expect(row.locator(".work__stack")).toHaveAccessibleName(
				`Built with ${project.stack.join(", ")}`,
			);
			// What it does, in a few points, and its links: a GitHub repo for every project with code of
			// its own (the client site has its live address).
			await expect(row.locator(".work__features li")).toHaveCount(project.features.length);
			const links = row.locator("a.work__link");
			await expect(links).toHaveCount(project.links.length);
			for (const [j, link] of project.links.entries()) {
				await expect(links.nth(j)).toHaveAttribute("href", link.href);
				await expect(links.nth(j)).toHaveAttribute("target", "_blank");
			}
			await expect(links.filter({ hasText: "GitHub" })).toHaveCount(
				project.links.some((l) => l.label === "GitHub") ? 1 : 0,
			);
		}
		// Every row starts closed.
		for (let i = 0; i < work.projects.length; i++) expect(await panelHeight(page, i)).toBe(0);
	});

	test("on desktop, hovering a row fills its name and drops the screenshot open; leaving closes it", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		await showSection(page, "projects");
		await expect(page.locator("#projects .work__prompt-hover")).toBeVisible();
		await expect(page.locator("#projects .work__prompt-click")).toBeHidden();
		// Let the rows finish rising in, so they don't move under the mouse.
		await expect
			.poll(() =>
				rows(page)
					.last()
					.evaluate((el) => getComputedStyle(el).opacity),
			)
			.toBe("1");

		const name = rows(page).nth(0).locator(".work__name");
		// The row's place on the page (not on screen, which smooth scrolling may still be moving).
		const pageTop = () =>
			rows(page)
				.nth(0)
				.evaluate(
					(el) =>
						el.getBoundingClientRect().top -
						(document.getElementById("smooth-content") ?? document.body).getBoundingClientRect()
							.top,
				);
		const top = await pageTop();
		await name.hover();
		await expect(rows(page).nth(0).locator("[data-work-toggle]")).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		await expect.poll(() => panelHeight(page, 0)).toBeGreaterThan(200);
		await expect(rows(page).nth(0).locator(".work__media img")).toBeVisible();
		await expect
			.poll(() => name.evaluate((el) => getComputedStyle(el).color))
			.toBe("rgb(255, 255, 255)");
		// White, without a glow.
		expect(await name.evaluate((el) => getComputedStyle(el).textShadow)).toBe("none");
		// Anchored at the top: the opened row itself doesn't move.
		expect(Math.abs((await pageTop()) - top)).toBeLessThan(1);

		await page.mouse.move(5, 5);
		await expect.poll(() => panelHeight(page, 0)).toBe(0);
		await expect(rows(page).nth(0).locator("[data-work-toggle]")).toHaveAttribute(
			"aria-expanded",
			"false",
		);
	});

	test("on desktop, clicking a row keeps it open after the mouse leaves, until it's clicked again", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		await showSection(page, "projects");
		await expect
			.poll(() =>
				rows(page)
					.last()
					.evaluate((el) => getComputedStyle(el).opacity),
			)
			.toBe("1");

		const toggle = rows(page).nth(1).locator("[data-work-toggle]");
		await toggle.click();
		await page.mouse.move(5, 5);
		await page.waitForTimeout(800);
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(await panelHeight(page, 1)).toBeGreaterThan(200);

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	test("on touch screens, a tap opens one project at a time", async ({ page }, info) => {
		test.skip(info.project.name !== "mobile", "touch only");
		await page.goto("/");
		await showSection(page, "projects");
		await expect(page.locator("#projects .work__prompt-click")).toBeVisible();
		await expect(page.locator("#projects .work__prompt-hover")).toBeHidden();

		const toggle = (i: number) => rows(page).nth(i).locator("[data-work-toggle]");
		await toggle(0).click();
		await expect(toggle(0)).toHaveAttribute("aria-expanded", "true");
		await expect.poll(() => panelHeight(page, 0)).toBeGreaterThan(150);

		await toggle(2).click();
		await expect(toggle(2)).toHaveAttribute("aria-expanded", "true");
		await expect(toggle(0)).toHaveAttribute("aria-expanded", "false");
		await expect.poll(() => panelHeight(page, 0)).toBe(0);

		await toggle(2).click();
		await expect(toggle(2)).toHaveAttribute("aria-expanded", "false");
	});

	test("serves screenshots in modern formats and ToDone's recording as video", async ({ page }) => {
		await page.goto("/");
		for (const [i, project] of work.projects.entries()) {
			const media = page.locator("#projects .work__media").nth(i);
			if (project.motion) {
				const video = media.locator("video");
				await expect(video).toHaveAttribute("loop", "");
				expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
				for (const ext of ["webm", "mp4"]) {
					expect((await page.request.get(`${project.motion}.${ext}`)).ok()).toBe(true);
				}
			} else {
				await expect(media.locator("picture source[type='image/avif']")).toHaveCount(1);
				const src = await media.locator("img").getAttribute("src");
				expect((await page.request.get(src!)).ok()).toBe(true);
			}
		}
	});

	test("has no preview pages", async ({ page }) => {
		const response = await page.goto("/preview/work");
		expect(response?.status()).toBe(404);
	});
});

test.describe("work layout", () => {
	for (const size of [
		{ width: 820, height: 695 },
		{ width: 1024, height: 768 },
		{ width: 1280, height: 800 },
		{ width: 1440, height: 900 },
	]) {
		test(`nothing overlaps at ${size.width}x${size.height}, closed or open`, async ({ page }) => {
			await page.setViewportSize(size);
			await page.goto("/");
			await page.locator("#projects [data-work-toggle]").first().click();
			await expect(page.locator("#projects [data-work-toggle]").first()).toHaveAttribute(
				"aria-expanded",
				"true",
			);
			await page.waitForTimeout(900);
			const overlaps = await page.evaluate(() => {
				const hit = (a: DOMRect, b: DOMRect) =>
					!(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
				const box = (root: Element, sel: string) =>
					root.querySelector(sel)!.getBoundingClientRect();
				const found: string[] = [];
				document.querySelectorAll("#projects [data-work-row]").forEach((row, i) => {
					const [name, meta, stack] = [".work__name", ".work__meta", ".work__stack"].map((s) =>
						box(row, s),
					);
					if (hit(name!, meta!) || hit(name!, stack!) || hit(meta!, stack!)) found.push(`row ${i}`);
				});
				const open = document.querySelector("#projects .is-open")!;
				if (hit(box(open, ".work__media"), box(open, ".work__copy"))) found.push("open project");
				return found;
			});
			expect(overlaps).toEqual([]);
		});
	}

	test("shows VS Code's logo, and keeps every logo in the repo", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator('#projects .tech[aria-label="VS Code"] svg')).toHaveCount(1);
		await expect(page.locator("#projects .tech--text")).toHaveCount(0);
		// No logo is loaded from another site.
		await expect(page.locator("#projects img[src^='http'], #projects .tech img")).toHaveCount(0);
	});

	test("draws no lines above, between or below the projects", async ({ page }) => {
		await page.goto("/");
		const list = page.locator("#projects .work__list");
		expect(await list.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("none");
		const styles = await page
			.locator("#projects [data-work-row]")
			.evaluateAll((rows) => rows.map((el) => getComputedStyle(el).borderBottomStyle));
		expect(styles.every((s) => s === "none")).toBe(true);
	});
});

test.describe("work details", () => {
	test("project names are a step smaller than the headline, at every size", async ({ page }) => {
		for (const width of [390, 820, 1024, 1280, 1440, 1920]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto("/");
			const [headline, name] = await Promise.all(
				["#projects-title", "#projects .work__name"].map((sel) =>
					page
						.locator(sel)
						.first()
						.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
				),
			);
			expect(name, `at ${width}px`).toBeLessThan(headline!);
		}
	});

	test("scrolling past an open project doesn't close it until the mouse moves", async ({
		page,
	}, info) => {
		test.skip(info.project.name !== "desktop", "needs a mouse");
		await page.goto("/");
		await page.locator("#projects").scrollIntoViewIfNeeded();
		const last = page.locator("#projects [data-work-row]").last();
		await expect.poll(() => last.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
		await page.waitForTimeout(1200);
		await last.locator(".work__name").hover();
		const toggle = last.locator("[data-work-toggle]");
		await expect(toggle).toHaveAttribute("aria-expanded", "true");

		// Scroll down with the wheel, without moving the mouse: it stays open.
		for (let i = 0; i < 6; i++) {
			await page.mouse.wheel(0, 120);
			await page.waitForTimeout(60);
		}
		await page.waitForTimeout(900);
		await expect(toggle).toHaveAttribute("aria-expanded", "true");

		// Moving the mouse off it closes it.
		await page.mouse.move(5, 5);
		await page.mouse.move(8, 8);
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
	});
});
