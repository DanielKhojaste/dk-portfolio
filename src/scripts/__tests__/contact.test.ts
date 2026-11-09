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
	needs: contact.form.needs,
	sent: "Sent!",
	failed: "Didn't send.",
	invalid: "Fill it in.",
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
			subject: "A web app | Ada Lovelace",
			body: "Booking for my studio.\n\nAda Lovelace (ada@example.com)",
		});
	});

	it("builds an encoded mailto link", () => {
		const url = mod.mailtoFor("me@example.com", msg);
		expect(url.startsWith("mailto:me@example.com?subject=")).toBe(true);
		const params = new URLSearchParams(url.split("?")[1]);
		expect(params.get("subject")).toBe("A web app | Ada Lovelace");
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
			subject: "A web app | Ada Lovelace",
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
		expect(contact.form.needs).toContain("A full-time role");
		expect(contact.form.needs).toContain(contact.projects.need);
	});
});

describe("safety", () => {
	const needs = contact.form.needs;

	it("keeps the name and email on one line and drops control characters", () => {
		const msg = mod.clean(
			{
				name: "Ada\r\nBcc: everyone@example.com\u0000",
				email: " ada@example.com\n",
				need: "A web app",
				message: "Line one\r\nLine two\u0007",
			},
			needs,
		);
		expect(msg.name).toBe("Ada Bcc: everyone@example.com");
		expect(msg.email).toBe("ada@example.com");
		expect(msg.message).toBe("Line one\nLine two");
		expect(mod.compose(msg).subject).not.toMatch(/[\r\n]/);
	});

	it("cuts every field to its limit", () => {
		const msg = mod.clean(
			{
				name: "a".repeat(500),
				email: "b".repeat(500),
				need: "A website",
				message: "c".repeat(9000),
			},
			needs,
		);
		expect(msg.name).toHaveLength(mod.LIMITS.name);
		expect(msg.email).toHaveLength(mod.LIMITS.email);
		expect(msg.message).toHaveLength(mod.LIMITS.message);
	});

	it("only takes a need from the form's own list", () => {
		const msg = mod.clean(
			{ ...{ name: "a", email: "a@b.co", message: "x" }, need: "<script>" },
			needs,
		);
		expect(msg.need).toBe(needs.at(-1));
	});

	it("rejects a missing name, a bad email or an empty message", () => {
		const ok = { name: "Ada", email: "ada@example.com", need: "A website", message: "Hi" };
		expect(mod.isValid(ok)).toBe(true);
		expect(mod.isValid({ ...ok, name: "" })).toBe(false);
		expect(mod.isValid({ ...ok, message: "   ".trim() })).toBe(false);
		for (const email of ["abc", "a@b", "a b@c.com", "<a@b.com>", "a@b.com\nBcc: x@y.com"]) {
			expect(mod.isValid({ ...ok, email }), email).toBe(false);
		}
	});

	it("never puts what was typed into the page as HTML", async () => {
		const { form } = page();
		const attack = '<img src=x onerror="alert(1)">';
		form.querySelector<HTMLInputElement>("input[name=name]")!.value = attack;
		const failing = vi.fn(async () => new Response("{}", { status: 500 }));
		mod.setupForm(form, { ...settings, accessKey: "k", failed: attack }, vi.fn(), failing);
		await submit(form);
		const status = form.querySelector("[data-form-status]")!;
		expect(status.textContent).toBe(attack);
		expect(status.querySelector("img")).toBeNull();
		expect(document.querySelectorAll("img")).toHaveLength(0);
	});

	it("doesn't send an invalid message, and says what's missing", async () => {
		const { form } = page();
		form.querySelector<HTMLInputElement>("input[name=email]")!.value = "not-an-email";
		const go = vi.fn();
		const fetcher = okFetch();
		mod.setupForm(form, { ...settings, accessKey: "k" }, go, fetcher);
		await submit(form);
		expect(fetcher).not.toHaveBeenCalled();
		expect(go).not.toHaveBeenCalled();
		expect(form.dataset.state).toBe("invalid");
		expect(form.querySelector("[data-form-status]")!.textContent).toBe(settings.invalid);
	});

	it("sends one message at a time, however many times Send is clicked", async () => {
		const { form } = page();
		let release!: () => void;
		const fetcher = vi.fn(
			() =>
				new Promise<Response>((resolve) => {
					release = () => resolve(new Response(JSON.stringify({ success: true })));
				}),
		);
		mod.setupForm(form, { ...settings, accessKey: "k" }, vi.fn(), fetcher);
		form.dispatchEvent(new Event("submit", { cancelable: true }));
		form.dispatchEvent(new Event("submit", { cancelable: true }));
		await new Promise((r) => setTimeout(r, 0));
		expect(fetcher).toHaveBeenCalledOnce();
		release();
		await new Promise((r) => setTimeout(r, 0));
	});

	it("gives up on a request that hangs", async () => {
		vi.useFakeTimers();
		const fetcher = vi.fn(
			(_url: string, init: RequestInit) =>
				new Promise<Response>((_, reject) =>
					init.signal!.addEventListener("abort", () => reject(new Error("aborted"))),
				),
		);
		const sent = mod.sendWithWeb3Forms("k", msg, fetcher as unknown as typeof fetch);
		await vi.advanceTimersByTimeAsync(15_000);
		expect(await sent).toBe(false);
		vi.useRealTimers();
	});
});
