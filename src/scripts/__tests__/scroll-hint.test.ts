// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { dkLogoPens } from "../../assets/brand/dk-logo-pens";
import { animation, hero } from "../../site.config";
import { setupScrollHint } from "../scroll-hint";

function fakeWindow() {
	const listeners: (() => void)[] = [];
	return {
		scrollY: 0,
		setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
		addEventListener: (_: string, fn: () => void) => void listeners.push(fn),
		scrollTo(y: number) {
			this.scrollY = y;
			listeners.forEach((fn) => fn());
		},
	};
}

describe("setupScrollHint", () => {
	afterEach(() => vi.useRealTimers());

	it("fades in after the delay, hides when you scroll and comes back at the top", () => {
		vi.useFakeTimers();
		const hint = document.createElement("a");
		const win = fakeWindow();
		setupScrollHint(hint, { delay: 4 }, win);

		expect(hint.classList.contains("is-shown")).toBe(false);
		vi.advanceTimersByTime(3_900);
		expect(hint.classList.contains("is-shown")).toBe(false);
		vi.advanceTimersByTime(200);
		expect(hint.classList.contains("is-shown")).toBe(true);

		win.scrollTo(300);
		expect(hint.classList.contains("is-shown")).toBe(false);
		win.scrollTo(0);
		expect(hint.classList.contains("is-shown")).toBe(true);
	});

	it("never shows if you've already scrolled when the delay is up", () => {
		vi.useFakeTimers();
		const hint = document.createElement("a");
		const win = fakeWindow();
		setupScrollHint(hint, { delay: 4 }, win);
		win.scrollTo(500);
		vi.advanceTimersByTime(5_000);
		expect(hint.classList.contains("is-shown")).toBe(false);
	});

	it("is set up in site.config.ts", () => {
		// Right after the hero's animations: the signature and the DivineFlow draw-in, whichever ends last.
		const { logo, background, scrollHint } = animation;
		expect(scrollHint.delay).toBeCloseTo(
			Math.max(
				logo.delay + logo.duration + logo.penLift * (dkLogoPens.length - 1),
				background.delay + background.duration,
			) + scrollHint.gap,
		);
		expect(scrollHint.gap).toBe(0);
		expect(hero.scrollHint).toMatch(/scroll/i);
	});
});
