// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { setupLogoHide } from "../logo-hide";

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
	return { win: win as unknown as Window, scrollTo, media };
}

describe("logo hide", () => {
	it("tucks the logo away scrolling down on small screens, and brings it back scrolling up", () => {
		const logo = document.createElement("a");
		const { win, scrollTo } = fakeWindow();
		setupLogoHide(logo, {}, win);
		const tucked = () => logo.classList.contains("is-tucked");

		scrollTo(40);
		expect(tucked()).toBe(false); // still near the top
		scrollTo(300);
		expect(tucked()).toBe(true);
		scrollTo(296);
		expect(tucked()).toBe(true); // a small wobble doesn't count
		scrollTo(200);
		expect(tucked()).toBe(false);
		scrollTo(500);
		expect(tucked()).toBe(true);
		scrollTo(20);
		expect(tucked()).toBe(false); // back at the top
	});

	it("comes back when reached with the keyboard", () => {
		const logo = document.createElement("a");
		const { win, scrollTo } = fakeWindow();
		setupLogoHide(logo, {}, win);
		scrollTo(400);
		expect(logo.classList.contains("is-tucked")).toBe(true);
		logo.dispatchEvent(new Event("focus"));
		expect(logo.classList.contains("is-tucked")).toBe(false);
	});

	it("always stays on wide screens", () => {
		const logo = document.createElement("a");
		const { win, scrollTo } = fakeWindow(false);
		setupLogoHide(logo, {}, win);
		scrollTo(300);
		scrollTo(900);
		expect(logo.classList.contains("is-tucked")).toBe(false);
	});
});
