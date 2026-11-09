import { expect, test } from "@playwright/test";
import { contact } from "../../src/site.config";

test.describe("contact", () => {
	// Never send a real message from a test, whether or not a Web3Forms key is set: answer every
	// request to Web3Forms here instead.
	test.beforeEach(async ({ page }) => {
		await page.route("https://api.web3forms.com/**", (route) =>
			route.fulfill({ json: { success: true }, status: 200 }),
		);
	});

	test("comes last, after Background, with both paths, the form and the links", async ({
		page,
	}) => {
		await page.goto("/");
		const ids = await page
			.locator("main > section[id]")
			.evaluateAll((els) => els.map((el) => el.id));
		expect(ids).toEqual(["intro", "about", "projects", "skills", "background", "contact"]);

		await expect(page.locator("#contact-title")).toHaveAccessibleName(
			contact.headline.replace(/[[\]]/g, ""),
		);
		await expect(page.locator("#contact h3")).toHaveText([contact.projects.title]);
		// What I'm open to, under the headline: one line each, with a dot.
		const open = page.locator("#contact .availability li");
		await expect(open).toHaveText([...contact.availability]);
		await expect(page.locator("#contact .availability__dot")).toHaveCount(
			contact.availability.length,
		);
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

	test("the card's button picks its choice in the form and takes you there", async ({ page }) => {
		await page.goto("/");
		await page.locator("#contact").scrollIntoViewIfNeeded();
		const checked = () => page.locator('#contact input[name="need"]:checked');
		// Pick something else first, so the button has something to change.
		await page.locator("#contact-form").getByText("Something else").click();
		await expect(checked()).toHaveValue("Something else");

		await expect(async () => {
			await page.getByRole("link", { name: contact.projects.cta }).click();
			await expect(checked()).toHaveValue(contact.projects.need, { timeout: 500 });
		}).toPass();
		await expect(page.locator("#contact-form")).toBeInViewport();
		await expect(page.locator('#contact input[name="name"]')).toBeFocused({ timeout: 3000 });
	});

	test("sending posts nothing for real: it either sends (faked here) or opens the email app", async ({
		page,
	}) => {
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
		await page.waitForTimeout(800);
		if (posts.length) {
			// A key is set: it went to Web3Forms (answered above), and the form says so.
			expect(posts).toEqual(["https://api.web3forms.com/submit"]);
			await expect(form).toHaveAttribute("data-state", "sent");
			await expect(form.locator("[data-form-status]")).toHaveText(contact.form.sent);
		} else {
			// No key: the email app opens, and the page stays.
			await expect(page).toHaveURL(/^http:/);
			await expect(form).toBeVisible();
		}
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
