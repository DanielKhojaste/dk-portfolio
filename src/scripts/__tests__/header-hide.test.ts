// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { setupHeaderHide } from "../header-hide";

/** A window whose scroll position and screen size the test sets. */
function fakeWindow(small = true) {
	const listeners: Record<string, (() => void)[]> = {};
	const media = { matches: small, addEventListener: () => {} };
	const win = {
		scrollY: 0,
		addEventListener: (type: string, fn: () => void) => (listeners[type] ??= []).push(fn),
		matchMedia: () => media,
	};
	const scrollTo = (y: number) => {
		win.scrollY = y;
		listeners.scroll?.forEach((fn) => fn());
	};
	return { win: win as unknown as Window, scrollTo };
}

/** The hero ends 800px down. */
function header(small = true) {
	const logo = document.createElement("a");
	const button = document.createElement("button");
	button.setAttribute("aria-expanded", "false");
	const hero = document.createElement("section");
	document.body.append(logo, button);
	const { win, scrollTo } = fakeWindow(small);
	setupHeaderHide({ logo, button, hero }, { heroEnd: () => 800 }, win);
	const tucked = (el: HTMLElement) => el.classList.contains("is-tucked");
	return {
		logo,
		button,
		scrollTo,
		logoShown: () => !tucked(logo),
		buttonShown: () => !tucked(button),
	};
}

describe("header hide", () => {
	it("shows the logo only in the hero, whichever way you scroll", () => {
		const h = header();
		h.scrollTo(400);
		expect(h.logoShown()).toBe(true);
		h.scrollTo(1500);
		expect(h.logoShown()).toBe(false);
		h.scrollTo(1100);
		expect(h.logoShown()).toBe(false); // scrolling up past the hero doesn't bring it back
		h.scrollTo(300);
		expect(h.logoShown()).toBe(true);
	});

	it("hides the menu button scrolling down past the hero, and brings it back scrolling up", () => {
		const h = header();
		h.scrollTo(300);
		expect(h.buttonShown()).toBe(true);
		h.scrollTo(1500);
		expect(h.buttonShown()).toBe(false);
		h.scrollTo(1496);
		expect(h.buttonShown()).toBe(false); // a small wobble doesn't count
		h.scrollTo(1400);
		expect(h.buttonShown()).toBe(true);
		h.scrollTo(2000);
		expect(h.buttonShown()).toBe(false);
		h.scrollTo(0);
		expect(h.buttonShown()).toBe(true);
	});

	it("keeps the menu button while the menu is open", () => {
		const h = header();
		h.button.setAttribute("aria-expanded", "true");
		h.scrollTo(1500);
		h.scrollTo(2500);
		expect(h.buttonShown()).toBe(true);
	});

	it("brings both back when reached with the keyboard", () => {
		const h = header();
		h.scrollTo(1500);
		expect(h.logoShown()).toBe(false);
		expect(h.buttonShown()).toBe(false);
		h.logo.dispatchEvent(new Event("focus"));
		h.button.dispatchEvent(new Event("focus"));
		expect(h.logoShown()).toBe(true);
		expect(h.buttonShown()).toBe(true);
	});

	it("always keeps both on wide screens", () => {
		const h = header(false);
		h.scrollTo(1500);
		h.scrollTo(3000);
		expect(h.logoShown()).toBe(true);
		expect(h.buttonShown()).toBe(true);
	});
});
