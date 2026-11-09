import { expect, test } from "@playwright/test";
import { LIMITS } from "../../src/scripts/contact-limits";

test.describe("security", () => {
	// Never send a real message from a test.
	test.beforeEach(async ({ page }) => {
		await page.route("https://api.web3forms.com/**", (route) =>
			route.fulfill({ json: { success: true }, status: 200 }),
		);
	});

	test("the page carries a strict Content Security Policy and breaks none of it", async ({
		page,
	}) => {
		// Record any violation from the very start of the page.
		await page.addInitScript(() => {
			const w = window as unknown as { __violations: string[] };
			w.__violations = [];
			document.addEventListener("securitypolicyviolation", (e) =>
				w.__violations.push(`${e.violatedDirective} ${e.blockedURI}`),
			);
		});
		await page.goto("/");
		const csp = await page
			.locator('meta[http-equiv="Content-Security-Policy"]')
			.getAttribute("content");
		expect(csp).toContain("default-src 'self'");
		expect(csp).toContain("object-src 'none'");
		expect(csp).toMatch(/script-src 'self' 'sha256-[^']+'/);
		expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);

		// Walk the whole page so every script, image, video and font loads.
		for (const id of ["about", "projects", "skills", "background", "contact"]) {
			await page.locator(`#${id}`).scrollIntoViewIfNeeded();
			await page.waitForTimeout(400);
		}
		// Load the screenshots and recordings in the closed project rows too.
		await page.evaluate(async () => {
			const images = [...document.querySelectorAll<HTMLImageElement>("#projects img")];
			images.forEach((img) => (img.loading = "eager"));
			document.querySelectorAll<HTMLVideoElement>("#projects video").forEach((v) => v.load());
			await Promise.all(images.map((img) => img.decode().catch(() => {})));
		});
		await page.waitForTimeout(1500);
		expect(
			await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations),
		).toEqual([]);
		// Scripts ran: the page knows it has JavaScript.
		await expect(page.locator("html")).toHaveClass(/\bjs\b/);
	});

	test("the contact form's fields have limits, and typed HTML stays text", async ({ page }) => {
		await page.goto("/");
		const form = page.locator("#contact-form");
		await expect(form.locator('input[name="name"]')).toHaveAttribute(
			"maxlength",
			String(LIMITS.name),
		);
		await expect(form.locator('input[name="email"]')).toHaveAttribute(
			"maxlength",
			String(LIMITS.email),
		);
		await expect(form.locator("textarea")).toHaveAttribute("maxlength", String(LIMITS.message));

		// An invalid email is refused with a message in plain text; nothing typed becomes markup.
		await form.locator('input[name="name"]').fill('<img src=x onerror="alert(1)">');
		await form.locator('input[name="email"]').evaluate((el: HTMLInputElement) => {
			el.type = "text"; // let the script's own check run, not the browser's
			el.value = "nope";
		});
		await form.locator("textarea").fill("<script>alert(1)</script>");
		page.on("dialog", () => {
			throw new Error("a dialog opened");
		});
		await form.evaluate((el: HTMLFormElement) => el.requestSubmit());
		await expect(form).toHaveAttribute("data-state", "invalid");
		await expect(page.locator("#contact img[src='x']")).toHaveCount(0);
	});
});
