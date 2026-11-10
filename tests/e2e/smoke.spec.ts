import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
	test("home page loads with title and a single h1", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));

		await page.goto("/");

		await expect(page).toHaveTitle(/Daniel Khojaste/);
		await expect(page.locator("h1")).toHaveCount(1);
		expect(errors).toEqual([]);
	});

	test("uses the dark colour scheme and self-hosted fonts", async ({ page }) => {
		await page.goto("/");

		const background = await page.evaluate(
			() => getComputedStyle(document.documentElement).backgroundColor,
		);
		expect(background).toBe("rgb(8, 4, 5)");

		await page.evaluate(() => document.fonts.ready);
		const fontsLoaded = await page.evaluate(() => document.fonts.check('16px "Inter Variable"'));
		expect(fontsLoaded).toBe(true);
	});

	test("every colour and timing from site.config.ts wins over the stylesheet's defaults", async ({
		page,
	}) => {
		await page.goto("/");
		const wrong = await page.evaluate(() => {
			const config = [...document.querySelectorAll("style")]
				.map((s) => s.textContent ?? "")
				.find((t) => t.startsWith(":root:root{"))!;
			const root = getComputedStyle(document.documentElement);
			return config
				.slice(":root:root{".length, -1)
				.split(";")
				.map((kv) => [kv.slice(0, kv.indexOf(":")), kv.slice(kv.indexOf(":") + 1)])
				.filter(([k, v]) => root.getPropertyValue(k!).trim() !== v!.trim());
		});
		expect(wrong).toEqual([]);
	});
});

test("serves the tab icon and the app icons", async ({ page, request }) => {
	await page.goto("/");
	for (const [rel, href, type] of [
		["icon", "/favicon.svg", "image/svg+xml"],
		["icon", "/favicon-32.png", "image/png"],
		["apple-touch-icon", "/apple-touch-icon.png", "image/png"],
	]) {
		await expect(page.locator(`link[rel="${rel}"][href="${href}"]`)).toHaveCount(1);
		const response = await request.get(href!);
		expect(response.ok(), href).toBe(true);
		expect(response.headers()["content-type"]).toContain(type);
	}
});

test("names both of Daniel's names: in the footer and for search engines", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("footer")).toContainText('Aref "Daniel" Khojaste');
	await expect(page.locator('meta[name="keywords"]')).toHaveAttribute(
		"content",
		'Daniel Khojaste, Aref Khojaste, Aref "Daniel" Khojaste',
	);
	await expect(page.locator('meta[name="author"]')).toHaveAttribute(
		"content",
		'Aref "Daniel" Khojaste',
	);
	const person = JSON.parse(
		(await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
	);
	expect(person.name).toBe("Daniel Khojaste");
	expect(person.legalName).toBe("Aref Khojaste");
	expect(person.alternateName).toEqual(["Aref Khojaste", 'Aref "Daniel" Khojaste']);
	await expect(page.locator('meta[name="description"]')).toHaveAttribute(
		"content",
		/^Aref "Daniel" Khojaste is/,
	);
});
