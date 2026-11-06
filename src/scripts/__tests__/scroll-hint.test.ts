// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { animation, hero } from "../../site.config";
import { setupScrollHint, strandLoop } from "../scroll-hint";

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

	it("plays its animation only while showing", () => {
		vi.useFakeTimers();
		const hint = document.createElement("a");
		const win = fakeWindow();
		const animation = { play: vi.fn(), pause: vi.fn() };
		setupScrollHint(hint, { delay: 1 }, win, animation);
		expect(animation.play).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1_100);
		expect(animation.play).toHaveBeenCalledTimes(1);
		win.scrollTo(300);
		expect(animation.pause).toHaveBeenCalledTimes(1);
		win.scrollTo(310);
		expect(animation.pause).toHaveBeenCalledTimes(1);
		win.scrollTo(0);
		expect(animation.play).toHaveBeenCalledTimes(2);
	});

	it("is set up in site.config.ts", () => {
		expect(animation.scrollHint.delay).toBe(4);
		expect(hero.scrollHint).toMatch(/scroll/i);
	});
});

describe("strandLoop", () => {
	const fakeFlow = () => ({ start: vi.fn(), stop: vi.fn(), setReveal: vi.fn() });

	it("mounts the strand on first play, draws it out on a loop, and stops it on pause", async () => {
		const flow = fakeFlow();
		const mount = vi.fn(() => flow);
		const el = document.createElement("div");
		const loop = strandLoop(el, 0.4, mount, false);
		expect(mount).not.toHaveBeenCalled();

		loop.play();
		expect(mount).toHaveBeenCalledTimes(1);
		expect(flow.start).toHaveBeenCalled();
		await new Promise((r) => setTimeout(r, 300));
		const reveals = flow.setReveal.mock.calls.map(([v]) => v as number);
		expect(reveals.length).toBeGreaterThan(1);
		expect(Math.max(...reveals)).toBeGreaterThan(0.5);

		loop.pause();
		expect(flow.stop).toHaveBeenCalled();
		loop.play();
		expect(mount).toHaveBeenCalledTimes(1);
		loop.pause();
	});

	it("shows the strand drawn and still for reduced motion", () => {
		const flow = fakeFlow();
		const loop = strandLoop(document.createElement("div"), 2, () => flow, true);
		loop.play();
		expect(flow.setReveal).toHaveBeenCalledExactlyOnceWith(1);
	});
});
