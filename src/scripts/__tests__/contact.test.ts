// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import { contact } from "../../site.config";

let mod: typeof import("../contact");

beforeAll(async () => {
	// GSAP's ScrollTrigger asks for matchMedia when it loads; jsdom doesn't have it.
	window.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
	})) as unknown as typeof window.matchMedia;
	mod = await import("../contact");
});

const msg = {
	name: "Ada Lovelace",
	email: "ada@example.com",
	need: "A web app",
	message: "Booking for my studio.",
};

const settings = {
	email: "me@example.com",
	accessKey: "",
	sent: "Sent!",
	failed: "Didn't send.",
};

function page() {
	document.body.innerHTML = `
		<section>
			<a href="#contact-form" data-pick-need="A full-time role">Talk about a role</a>
			<a href="#contact-form" data-pick-need="A website">Start a project</a>
			<form data-contact-form>
				<input name="name" />
				<input name="email" />
				${contact.form.needs
					.map(
						(n, i) => `<input type="radio" name="need" value="${n}" ${i === 1 ? "checked" : ""} />`,
					)
					.join("")}
				<textarea name="message"></textarea>
				<input type="checkbox" name="botcheck" />
				<button type="submit">Send</button>
				<p data-form-status></p>
			</form>
		</section>`;
	const section = document.querySelector("section")!;
	const form = section.querySelector("form")!;
	// Typed in, not defaults, so resetting the form clears them.
	form.querySelector<HTMLInputElement>("input[name=name]")!.value = msg.name;
	form.querySelector<HTMLInputElement>("input[name=email]")!.value = msg.email;
	form.querySelector("textarea")!.value = msg.message;
	return { section, form };
}

const submit = async (form: HTMLFormElement) => {
	form.dispatchEvent(new Event("submit", { cancelable: true }));
	// Let the async handler finish.
	await new Promise((r) => setTimeout(r, 0));
};

const okFetch = () =>
	vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));

describe("compose and mailtoFor", () => {
	it("puts the need and name in the subject and signs the body", () => {
		expect(mod.compose(msg)).toEqual({
			subject: "A web app – Ada Lovelace",
			body: "Booking for my studio.\n\nAda Lovelace (ada@example.com)",
		});
	});

	it("builds an encoded mailto link", () => {
		const url = mod.mailtoFor("me@example.com", msg);
		expect(url.startsWith("mailto:me@example.com?subject=")).toBe(true);
		const params = new URLSearchParams(url.split("?")[1]);
		expect(params.get("subject")).toBe("A web app – Ada Lovelace");
		expect(params.get("body")).toContain("Booking for my studio.");
	});
});

describe("sendWithWeb3Forms", () => {
	it("posts the message with the access key", async () => {
		const fetcher = okFetch();
		expect(await mod.sendWithWeb3Forms("key-123", msg, fetcher)).toBe(true);
		const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe("https://api.web3forms.com/submit");
		expect(init.method).toBe("POST");
		expect(JSON.parse(String(init.body))).toMatchObject({
			access_key: "key-123",
			subject: "A web app – Ada Lovelace",
			email: msg.email,
			need: msg.need,
			message: msg.message,
		});
	});

	it("reports failure on an error response, a rejected request or success: false", async () => {
		const bad = vi.fn(async () => new Response("{}", { status: 500 }));
		const thrown = vi.fn(async () => {
			throw new Error("offline");
		});
		const refused = vi.fn(
			async () => new Response(JSON.stringify({ success: false }), { status: 200 }),
		);
		expect(await mod.sendWithWeb3Forms("k", msg, bad)).toBe(false);
		expect(await mod.sendWithWeb3Forms("k", msg, thrown)).toBe(false);
		expect(await mod.sendWithWeb3Forms("k", msg, refused)).toBe(false);
	});
});

describe("setupForm", () => {
	it("opens the email app when there's no access key", async () => {
		const { form } = page();
		const go = vi.fn();
		const fetcher = okFetch();
		mod.setupForm(form, settings, go, fetcher);
		await submit(form);
		expect(fetcher).not.toHaveBeenCalled();
		expect(go).toHaveBeenCalledWith(mod.mailtoFor(settings.email, msg));
	});

	it("sends through Web3Forms with a key, says so and clears the form", async () => {
		const { form } = page();
		const fetcher = okFetch();
		mod.setupForm(form, { ...settings, accessKey: "k" }, vi.fn(), fetcher);
		await submit(form);
		expect(fetcher).toHaveBeenCalledOnce();
		expect(form.dataset.state).toBe("sent");
		expect(form.querySelector("[data-form-status]")!.textContent).toBe("Sent!");
		expect(form.querySelector<HTMLInputElement>("input[name=name]")!.value).toBe("");
		expect(form.querySelector("button")!.hasAttribute("disabled")).toBe(false);
	});

	it("keeps what was typed and says it failed when sending fails", async () => {
		const { form } = page();
		const fetcher = vi.fn(async () => new Response("{}", { status: 500 }));
		mod.setupForm(form, { ...settings, accessKey: "k" }, vi.fn(), fetcher);
		await submit(form);
		expect(form.dataset.state).toBe("failed");
		expect(form.querySelector("[data-form-status]")!.textContent).toBe("Didn't send.");
		expect(form.querySelector<HTMLInputElement>("input[name=name]")!.value).toBe(msg.name);
	});

	it("quietly drops messages from bots that tick the hidden box", async () => {
		const { form } = page();
		form.querySelector<HTMLInputElement>("input[name=botcheck]")!.checked = true;
		const go = vi.fn();
		const fetcher = okFetch();
		mod.setupForm(form, { ...settings, accessKey: "k" }, go, fetcher);
		await submit(form);
		expect(fetcher).not.toHaveBeenCalled();
		expect(go).not.toHaveBeenCalled();
	});
});

describe("setupPicks", () => {
	it("each card's button picks its choice in the form, then focuses the name field", () => {
		vi.useFakeTimers();
		const { section } = page();
		mod.setupPicks(section);
		const checked = () =>
			section.querySelector<HTMLInputElement>("input[name=need]:checked")!.value;

		section.querySelector<HTMLAnchorElement>('[data-pick-need="A full-time role"]')!.click();
		expect(checked()).toBe("A full-time role");
		vi.advanceTimersByTime(800);
		expect(document.activeElement).toBe(section.querySelector("input[name=name]"));

		section.querySelector<HTMLAnchorElement>('[data-pick-need="A website"]')!.click();
		expect(checked()).toBe("A website");
		vi.useRealTimers();
	});

	it("each card's choice is one of the form's", () => {
		expect(contact.form.needs).toContain(contact.hiring.need);
		expect(contact.form.needs).toContain(contact.projects.need);
	});
});
