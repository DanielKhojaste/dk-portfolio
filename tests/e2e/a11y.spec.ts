import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Runs axe on the page (WCAG 2.2 A and AA) and lists what it finds, readably. */
async function audit(page: Page, include?: string) {
	let builder = new AxeBuilder({ page }).withTags([
		"wcag2a",
		"wcag2aa",
		"wcag21a",
		"wcag21aa",
		"wcag22aa",
		"best-practice",
	]);
	if (include) builder = builder.include(include);
	const { violations } = await builder.analyze();
	return violations.map(
		(v) =>
			`${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`,
	);
}

test.describe("accessibility", () => {
	// With reduced motion everything is in its final state at once, so axe sees what a reader sees.
	test.use({ reducedMotion: "reduce" });

	test("the whole page passes axe", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(500);
		expect(await audit(page)).toEqual([]);
	});

	test("with every project and background row open, it still passes", async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => {
			for (const row of document.querySelectorAll<HTMLElement>("[data-work-row]")) {
				row.classList.add("is-open");
				row.querySelector("[data-work-toggle]")!.setAttribute("aria-expanded", "true");
				row.querySelector<HTMLElement>("[data-work-panel]")!.style.height = "auto";
			}
		});
		expect(await audit(page, "main")).toEqual([]);
	});

	test("the open menu passes axe", async ({ page }, info) => {
		test.skip(info.project.name !== "mobile", "the menu button is for phones and tablets");
		await page.goto("/");
		await page.getByRole("button", { name: /menu/i }).click();
		await page.waitForTimeout(600);
		expect(await audit(page)).toEqual([]);
	});
});

test("with motion, once every section has played in, the page passes axe", async ({ page }) => {
	await page.goto("/");
	for (const id of ["about", "projects", "skills", "background", "contact"]) {
		await page.locator(`#${id}`).scrollIntoViewIfNeeded();
		await page.waitForTimeout(2500);
	}
	expect(await audit(page, "main")).toEqual([]);
});
