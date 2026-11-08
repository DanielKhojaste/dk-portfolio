import { expect, test } from "@playwright/test";
import { contact } from "../../src/site.config";

test.describe("contact", () => {
	test("comes last, after Skills, with both paths, the form and the links", async ({ page }) => {
		await page.goto("/");
		const ids = await page
			.locator("main > section[id]")
			.evaluateAll((els) => els.map((el) => el.id));
		expect(ids).toEqual(["intro", "about", "work", "skills", "contact"]);

		await expect(page.locator("#contact-title")).toHaveAccessibleName(
			contact.headline.replace(/[[\]]/g, ""),
		);
		await expect(page.locator("#contact h3")).toHaveText([
			contact.hiring.title,
			contact.projects.title,
		]);
		for (const s of contact.projects.services) {
			await expect(page.locator("#contact .contact__service", { hasText: s.title })).toBeVisible();
		}
		await expect(page.locator('#contact input[name="need"]')).toHaveCount(
			contact.form.needs.length,
		);
		await expect(page.locator("#contact .divine-flow, #contact canvas")).toHaveCount(0);
	});

	test("links are logos with names, and the email address isn't spelled out", async ({ page }) => {
		await page.goto("/");
		const shown = contact.links.filter((l) => l.href);
		const links = page.locator("#contact .contact__socials a");
		await expect(links).toHaveCount(shown.length);
		await expect(page.locator("#contact .contact__socials a svg")).toHaveCount(shown.length);
		for (const l of shown) {
			await expect(links.filter({ hasText: l.label })).toHaveAttribute("href", l.href);
		}
		await expect(links.filter({ hasText: "Email" })).not.toHaveAttribute("target", /.*/);
		await expect(links.filter({ hasText: "GitHub" })).toHaveAttribute("target", "_blank");
		await expect(page.locator("#contact")).not.toContainText(contact.email);
	});

	test("each card's button picks its choice in the form and takes you there", async ({ page }) => {
		await page.goto("/");
		await page.locator("#contact").scrollIntoViewIfNeeded();
		const checked = () => page.locator('#contact input[name="need"]:checked');

		await expect(async () => {
			await page.getByRole("link", { name: contact.hiring.cta }).click();
			await expect(checked()).toHaveValue(contact.hiring.need, { timeout: 500 });
		}).toPass();
		await expect(page.locator("#contact-form")).toBeInViewport();
		await expect(page.locator('#contact input[name="name"]')).toBeFocused({ timeout: 3000 });

		await expect(async () => {
			await page.getByRole("link", { name: contact.projects.cta }).click();
			await expect(checked()).toHaveValue(contact.projects.need, { timeout: 500 });
		}).toPass();
	});

	test("without an access key, sending stays on the page and posts nothing", async ({ page }) => {
		test.skip(contact.form.accessKey !== "", "a Web3Forms key is set");
		// (It opens the visitor's email app with a mailto link; the link itself is checked in the
		// unit tests.)
		await page.goto("/");
		await page.locator("#contact-form").scrollIntoViewIfNeeded();
		const posts: string[] = [];
		page.on("request", (r) => r.method() === "POST" && posts.push(r.url()));
		const form = page.locator("#contact-form");
		await form.locator('input[name="name"]').fill("Ada Lovelace");
		await form.locator('input[name="email"]').fill("ada@example.com");
		await form.getByText("A web app").click();
		await expect(form.locator('input[name="need"]:checked')).toHaveValue("A web app");
		await form.locator('textarea[name="message"]').fill("Booking for my studio.");
		await form.getByRole("button", { name: "Send" }).click();
		await page.waitForTimeout(500);
		expect(posts).toEqual([]);
		await expect(page).toHaveURL(/^http:/);
		await expect(form).toBeVisible();
	});

	test("the form needs a name, an email and a message", async ({ page }) => {
		await page.goto("/");
		const form = page.locator("#contact-form");
		for (const field of ['input[name="name"]', 'input[name="email"]', "textarea"]) {
			await expect(form.locator(field)).toHaveAttribute("required", "");
		}
		await expect(form.locator('input[name="email"]')).toHaveAttribute("type", "email");
		// Every field has a visible label.
		await expect(form.getByLabel("Name")).toBeVisible();
		await expect(form.getByLabel("Email")).toBeVisible();
	});
});
