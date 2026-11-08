/**
 * The Contact section's form, and the buttons on the two cards that jump to it with the right
 * choice picked. With a Web3Forms access key the form posts there and says whether it sent; without
 * one, it opens the visitor's email app with the message filled in. On arrival the headline's red
 * word wipes in and the cards and form rise in.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FILL_EMPTY, FILL_FULL } from "./about";
import { LIMITS } from "./contact-limits";

gsap.registerPlugin(ScrollTrigger);

export interface ContactTiming {
	highlight: number;
	rows: number;
	rowStagger: number;
}

export interface FormSettings {
	email: string;
	accessKey: string;
	/** The choices under "What do you need?"; anything else is treated as the last one. */
	needs: readonly string[];
	sent: string;
	failed: string;
	/** Shown when a field is missing or the email doesn't look right. */
	invalid: string;
}

export interface Message {
	name: string;
	email: string;
	need: string;
	message: string;
}

export { LIMITS };

/** Control characters, except tab and newline. They have no place in a message. */
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

/** A plain email address: something@something.tld, no spaces or angle brackets. */
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/**
 * Cleans what was typed before it goes anywhere: drops control characters, keeps the name and
 * email on one line (no line breaks to slip extra headers into an email), trims everything to its
 * limit, and only accepts a "need" that's one of the form's own choices.
 */
export function clean(
	raw: { name: string; email: string; need: string; message: string },
	needs: readonly string[],
): Message {
	const line = (text: string, max: number) =>
		text
			.replace(CONTROL, "")
			.replace(/[\r\n\t]+/g, " ")
			.trim()
			.slice(0, max);
	return {
		name: line(raw.name, LIMITS.name),
		email: line(raw.email, LIMITS.email),
		need: needs.includes(raw.need) ? raw.need : (needs.at(-1) ?? ""),
		message: raw.message
			.replace(CONTROL, "")
			.replace(/\r\n?/g, "\n")
			.trim()
			.slice(0, LIMITS.message),
	};
}

/** Whether a cleaned message can be sent: a name, a real-looking email and some words. */
export function isValid(msg: Message) {
	return msg.name.length > 0 && EMAIL.test(msg.email) && msg.message.length > 0;
}

/** Subject and body for an email about a message. */
export function compose({ name, email, need, message }: Message) {
	return {
		subject: `${need} – ${name}`,
		body: `${message}\n\n${name} (${email})`,
	};
}

/** The mailto address that opens an email with the message filled in. */
export function mailtoFor(to: string, msg: Message) {
	const { subject, body } = compose(msg);
	return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Sends a message through Web3Forms. Resolves true when it was accepted. */
export async function sendWithWeb3Forms(
	accessKey: string,
	msg: Message,
	fetcher: typeof fetch = fetch,
): Promise<boolean> {
	const { subject } = compose(msg);
	// Give up after 15 seconds rather than leave the button waiting forever.
	const timeout = new AbortController();
	const timer = setTimeout(() => timeout.abort(), 15_000);
	try {
		const response = await fetcher("https://api.web3forms.com/submit", {
			method: "POST",
			signal: timeout.signal,
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify({
				access_key: accessKey,
				subject,
				from_name: msg.name,
				name: msg.name,
				email: msg.email,
				need: msg.need,
				message: msg.message,
			}),
		});
		const data = (await response.json().catch(() => ({}))) as { success?: boolean };
		return response.ok && data.success !== false;
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
	}
}

export function setupForm(
	form: HTMLFormElement,
	settings: FormSettings,
	go: (url: string) => void = (url) => (location.href = url),
	fetcher: typeof fetch = fetch,
) {
	const status = form.querySelector<HTMLElement>("[data-form-status]");
	const button = form.querySelector<HTMLButtonElement>("button[type=submit]");

	// One message at a time: a second click while one is on its way does nothing.
	let sending = false;
	const say = (text: string) => {
		// Plain text only: whatever the visitor typed is never put into the page as HTML.
		if (status) status.textContent = text;
	};

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (sending) return;
		const data = new FormData(form);
		// A bot filled in the hidden field: pretend it worked.
		if (data.get("botcheck")) return;
		const msg = clean(
			{
				name: String(data.get("name") ?? ""),
				email: String(data.get("email") ?? ""),
				need: String(data.get("need") ?? ""),
				message: String(data.get("message") ?? ""),
			},
			settings.needs,
		);
		if (!isValid(msg)) {
			form.dataset.state = "invalid";
			say(settings.invalid);
			return;
		}

		if (!settings.accessKey) {
			go(mailtoFor(settings.email, msg));
			return;
		}

		sending = true;
		button?.setAttribute("disabled", "");
		form.dataset.state = "sending";
		const ok = await sendWithWeb3Forms(settings.accessKey, msg, fetcher);
		form.dataset.state = ok ? "sent" : "failed";
		say(ok ? settings.sent : settings.failed);
		if (ok) form.reset();
		button?.removeAttribute("disabled");
		sending = false;
	});
}

/** The cards' buttons: pick their choice in the form, then move focus to the first field. */
export function setupPicks(section: HTMLElement) {
	for (const link of section.querySelectorAll<HTMLAnchorElement>("[data-pick-need]")) {
		link.addEventListener("click", () => {
			const radio = [...section.querySelectorAll<HTMLInputElement>("input[name=need]")].find(
				(input) => input.value === link.dataset.pickNeed,
			);
			if (radio) radio.checked = true;
			// After the glide to the form, so focusing doesn't jump the page.
			setTimeout(
				() =>
					section
						.querySelector<HTMLInputElement>("input[name=name]")
						?.focus({ preventScroll: true }),
				700,
			);
		});
	}
}

export function setupContact(
	section: HTMLElement,
	settings: FormSettings,
	timing: ContactTiming,
	reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
) {
	const form = section.querySelector<HTMLFormElement>("[data-contact-form]");
	if (form) setupForm(form, settings);
	setupPicks(section);
	if (reducedMotion) return;

	const fills = section.querySelectorAll<HTMLElement>("[data-fill]");
	const rows = section.querySelectorAll<HTMLElement>("[data-contact-rise]");
	gsap.set(fills, { clipPath: FILL_EMPTY });
	gsap.set(rows, { opacity: 0, y: 24 });
	ScrollTrigger.create({
		trigger: section,
		start: "top 75%",
		once: true,
		onEnter: () => {
			gsap.to(fills, {
				clipPath: FILL_FULL,
				duration: timing.highlight,
				delay: 0.2,
				ease: "power3.inOut",
			});
			gsap.to(rows, {
				opacity: 1,
				y: 0,
				duration: timing.rows,
				stagger: timing.rowStagger,
				delay: 0.15,
				ease: "power3.out",
				clearProps: "transform",
			});
		},
	});
}
