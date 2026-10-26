import { expect, test, type Page } from "@playwright/test";

const hero = (page: Page) => page.locator("section.hero");

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
		expect(Math.round(rect.height)).toBe(Math.max(viewport.height, 600));
		expect(Math.round(rect.width)).toBe(viewport.width);
	});

	test("never gets shorter than its floor on short viewports", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 480 });
		await page.goto("/");
		expect(Math.round((await box(page, "section.hero")).height)).toBe(600);

		await page.setViewportSize({ width: 390, height: 520 });
		expect(Math.round((await box(page, "section.hero")).height)).toBe(640);
	});

	test("shows the name as a single heading with an outlined last name behind the throne", async ({
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
				lastStroke: last.getPropertyValue("-webkit-text-stroke-color"),
				lastStrokeWidth: parseFloat(last.getPropertyValue("-webkit-text-stroke-width")),
				lastSize: parseFloat(last.fontSize),
				firstSize: parseFloat(first.fontSize),
				nameZ: Number(name.zIndex),
				figureZ: Number(figure.zIndex),
			};
		});

		expect(styles.lastColor).toBe("rgba(0, 0, 0, 0)");
		expect(styles.lastStroke).toBe("rgb(255, 255, 255)");
		expect(styles.lastStrokeWidth).toBeGreaterThan(0);
		expect(styles.nameZ).toBeLessThan(styles.figureZ);
		expect(styles.lastSize).toBeGreaterThan(styles.firstSize * 2);
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

	test("uses the temporary slogan and no ApotheonAI credit", async ({ page }) => {
		await page.goto("/");
		await expect(hero(page).getByText("temporary slogan", { exact: true })).toBeVisible();
		await expect(hero(page)).not.toContainText("ApotheonAI");
		await expect(hero(page)).not.toContainText("idea to deploy");
	});

	test("side info groups are aligned with each other", async ({ page }) => {
		await page.goto("/");
		const groups = page.locator("[data-hero-group]");
		await expect(groups).toHaveCount(2);
		const [a, b] = await Promise.all([groups.nth(0).boundingBox(), groups.nth(1).boundingBox()]);

		expect(Math.abs(a!.y - b!.y)).toBeLessThanOrEqual(1);
		expect(Math.abs(a!.height - b!.height)).toBeLessThanOrEqual(1);
		expect(a!.x + a!.width).toBeLessThan(b!.x);
	});

	test("calls to action are centred and link to their sections", async ({ page }) => {
		await page.goto("/");
		const work = hero(page).getByRole("link", { name: "View my work" });
		const contact = hero(page).getByRole("link", { name: "Get in touch" });
		await expect(work).toHaveAttribute("href", "#work");
		await expect(contact).toHaveAttribute("href", "#contact");

		const actions = await box(page, ".hero__actions");
		const [w, c] = await Promise.all([work.boundingBox(), contact.boundingBox()]);
		const centre = (w!.x + c!.x + c!.width) / 2;
		expect(Math.abs(centre - (actions.x + actions.width / 2))).toBeLessThanOrEqual(2);
	});

	test("mounts DivineFlow behind the hero", async ({ page }) => {
		await page.goto("/");
		const flow = page.locator("[data-divine-flow]");
		await expect(flow).toHaveAttribute("data-flow-ready", "true");

		const canvas = flow.locator("canvas");
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

test.describe("header", () => {
	test("shows the logo and a hamburger menu button on every screen size", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("link", { name: "Daniel Khojaste, home" })).toBeVisible();
		const menu = page.getByRole("button", { name: "Open menu" });
		await expect(menu).toBeVisible();
		await expect(menu).toHaveAttribute("aria-expanded", "false");
		const rect = await menu.boundingBox();
		expect(rect!.width).toBeGreaterThanOrEqual(44);
		expect(rect!.height).toBeGreaterThanOrEqual(44);
	});

	test("draws the logo on load and ends with the solid fill", async ({ page }) => {
		await page.goto("/");
		const logo = page.locator("svg[data-logo-draw]");

		// While drawing, stroke outlines exist and the fill is hidden.
		await expect(logo.locator(".logo__stroke").first()).toBeAttached();

		await expect(logo).toHaveAttribute("data-drawn", "true", { timeout: 6_000 });
		await expect(logo.locator(".logo__stroke")).toHaveCount(0);
		const opacities = await logo
			.locator(".logo__fill")
			.evaluateAll((paths) => paths.map((p) => getComputedStyle(p).opacity));
		expect(opacities.every((o) => o === "1")).toBe(true);
	});

	test("skips the draw animation when reduced motion is preferred", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		const logo = page.locator("svg[data-logo-draw]");
		await expect(logo).toHaveAttribute("data-drawn", "true", { timeout: 1_000 });
		await expect(logo.locator(".logo__stroke")).toHaveCount(0);
	});
});
