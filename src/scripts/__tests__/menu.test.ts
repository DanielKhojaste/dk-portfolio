// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseReveal, pauseWhileMenuOpen, revealFlow } from "../divine-flow";
import { setupMenu, wrapFocusIndex } from "../menu";

function render() {
	document.documentElement.removeAttribute("data-menu-open");
	document.documentElement.removeAttribute("style");
	document.body.innerHTML = `
		<header>
			<a href="/" id="home">Home</a>
			<button data-menu-button aria-expanded="false" aria-label="Open menu">Menu</button>
		</header>
		<div data-menu id="site-menu">
			<a href="#work" data-menu-link id="first">Work</a>
			<a href="#contact" data-menu-link id="last">Contact</a>
		</div>
		<main id="main"><a href="#x">x</a></main>
		<footer id="footer"></footer>
	`;
	// jsdom has no rAF timing worth waiting on; run focus callbacks straight away.
	vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
		cb(0);
		return 0;
	});
	const menu = setupMenu()!;
	const button = document.querySelector<HTMLButtonElement>("[data-menu-button]")!;
	return { menu, button };
}

const key = (k: string, shiftKey = false) =>
	document.dispatchEvent(new KeyboardEvent("keydown", { key: k, shiftKey, bubbles: true }));

describe("wrapFocusIndex", () => {
	it("wraps forwards and backwards", () => {
		expect(wrapFocusIndex(2, 3, false)).toBe(0);
		expect(wrapFocusIndex(0, 3, true)).toBe(2);
		expect(wrapFocusIndex(1, 3, false)).toBe(2);
	});

	it("starts at the matching end when focus is outside the list", () => {
		expect(wrapFocusIndex(-1, 3, false)).toBe(0);
		expect(wrapFocusIndex(-1, 3, true)).toBe(2);
		expect(wrapFocusIndex(0, 0, false)).toBe(-1);
	});
});

describe("setupMenu", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("returns null without the markup", () => {
		expect(setupMenu()).toBeNull();
	});

	it("opens from the button: state, label, inert page, scroll lock, focus", () => {
		const { menu, button } = render();
		button.click();

		expect(menu.isOpen).toBe(true);
		expect(button.getAttribute("aria-expanded")).toBe("true");
		expect(button.getAttribute("aria-label")).toBe("Close menu");
		expect(document.querySelector("[data-menu]")!.hasAttribute("data-open")).toBe(true);
		expect(document.documentElement.hasAttribute("data-menu-open")).toBe(true);
		expect(document.getElementById("main")!.inert).toBe(true);
		expect(document.getElementById("footer")!.inert).toBe(true);
		expect(document.querySelector("header")!.inert).toBeFalsy();
		expect(document.documentElement.style.overflow).toBe("hidden");
		expect(document.activeElement?.id).toBe("first");
	});

	it("closes on Escape and returns focus to the button", () => {
		const { menu, button } = render();
		button.click();
		key("Escape");

		expect(menu.isOpen).toBe(false);
		expect(button.getAttribute("aria-expanded")).toBe("false");
		expect(document.getElementById("main")!.inert).toBe(false);
		expect(document.documentElement.style.overflow).toBe("");
		expect(document.activeElement).toBe(button);
	});

	it("closes when a section link is followed", () => {
		const { menu } = render();
		menu.open();
		document.getElementById("last")!.click();
		expect(menu.isOpen).toBe(false);
	});

	it("closes when the overlay itself is clicked, returning focus to the button", () => {
		const { menu, button } = render();
		menu.open();
		document.querySelector<HTMLElement>("[data-menu]")!.click();
		expect(menu.isOpen).toBe(false);
		expect(document.activeElement).toBe(button);
	});

	it("keeps Tab inside the header and menu while open", () => {
		const { menu } = render();
		menu.open();
		document.getElementById("last")!.focus();
		key("Tab");
		expect(document.activeElement?.id).toBe("home");
		key("Tab", true);
		expect(document.activeElement?.id).toBe("last");
	});

	it("announces open and close so other scripts can react", () => {
		const { menu } = render();
		const events: string[] = [];
		document.addEventListener("menu:open", () => events.push("open"));
		document.addEventListener("menu:close", () => events.push("close"));
		menu.toggle();
		menu.toggle();
		menu.close();
		expect(events).toEqual(["open", "close"]);
	});
});

describe("pauseWhileMenuOpen", () => {
	it("stops the flow while the menu is open and resumes it after", () => {
		document.documentElement.removeAttribute("data-menu-open");
		const doc = document.implementation.createHTMLDocument();
		const flow = { start: vi.fn(), stop: vi.fn() };
		pauseWhileMenuOpen(flow, doc);

		doc.dispatchEvent(new CustomEvent("menu:open"));
		expect(flow.stop).toHaveBeenCalledTimes(1);
		doc.dispatchEvent(new CustomEvent("menu:close"));
		expect(flow.start).toHaveBeenCalledTimes(1);
	});

	it("starts paused when the menu is already open", () => {
		const doc = document.implementation.createHTMLDocument();
		doc.documentElement.setAttribute("data-menu-open", "");
		const flow = { start: vi.fn(), stop: vi.fn() };
		pauseWhileMenuOpen(flow, doc);
		expect(flow.stop).toHaveBeenCalledTimes(1);
	});
});

describe("parseReveal", () => {
	it("is off without the attribute and fills in defaults", () => {
		expect(parseReveal(undefined)).toBeNull();
		expect(parseReveal("{}")).toEqual({ delay: 0.2, duration: 2, ease: "power2.out" });
		expect(parseReveal('{"delay":0.5,"duration":1.6,"ease":"none"}')).toEqual({
			delay: 0.5,
			duration: 1.6,
			ease: "none",
		});
		expect(parseReveal('{"delay":-1,"duration":"x"}')).toEqual({
			delay: 0.2,
			duration: 2,
			ease: "power2.out",
		});
		expect(parseReveal("{oops")).toEqual({ delay: 0.2, duration: 2, ease: "power2.out" });
	});
});

describe("revealFlow", () => {
	const settings = { delay: 0, duration: 1, ease: "none" };

	it("draws the flow in from nothing with a GSAP tween", () => {
		const flow = { setReveal: vi.fn() };
		const tween = revealFlow(flow, settings, false)!;
		expect(flow.setReveal).toHaveBeenLastCalledWith(0);
		expect(tween.duration()).toBe(1);
		tween.progress(0.5);
		expect(flow.setReveal).toHaveBeenLastCalledWith(0.5);
		tween.progress(1);
		expect(flow.setReveal).toHaveBeenLastCalledWith(1);
		tween.kill();
	});

	it("shows the whole flow at once for reduced motion", () => {
		const flow = { setReveal: vi.fn() };
		expect(revealFlow(flow, settings, true)).toBeNull();
		expect(flow.setReveal).toHaveBeenCalledExactlyOnceWith(1);
	});
});

describe("underlineController", () => {
	const timing = { in: 0.6, out: 0.3 };
	const fakeFlow = () => ({ start: vi.fn(), stop: vi.fn(), setReveal: vi.fn() });

	it("mounts on first show only and starts the flow drawing out", async () => {
		const { underlineController } = await import("../menu-underlines");
		const flow = fakeFlow();
		const mount = vi.fn(() => flow);
		const underline = underlineController(mount, timing, false);

		underline.hide();
		expect(mount).not.toHaveBeenCalled();

		underline.show();
		underline.show();
		expect(mount).toHaveBeenCalledTimes(1);
		expect(flow.start).toHaveBeenCalled();
		expect(flow.stop).not.toHaveBeenCalled();
	});

	it("shows and hides instantly for reduced motion", async () => {
		const { underlineController } = await import("../menu-underlines");
		const flow = fakeFlow();
		const underline = underlineController(() => flow, timing, true);
		underline.show();
		expect(flow.setReveal).toHaveBeenLastCalledWith(1);
		underline.hide();
		expect(flow.setReveal).toHaveBeenLastCalledWith(0);
		expect(flow.stop).toHaveBeenCalledTimes(1);
	});
});
