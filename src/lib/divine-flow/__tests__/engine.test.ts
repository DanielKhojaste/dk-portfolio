// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDivineFlow } from "../engine";

type Listener = (event: { matches: boolean }) => void;

/** A 2D context stand-in that records method calls and returns usable gradients. */
function fakeContext(canvas: HTMLCanvasElement) {
	const calls: string[] = [];
	const gradient = { addColorStop: vi.fn() };
	const target: Record<string | symbol, unknown> = { canvas };
	let gradients = 0;
	const images: unknown[] = [];
	return {
		calls,
		gradients: () => gradients,
		images,
		ctx: new Proxy(target, {
			get(obj, key) {
				if (key in obj) return obj[key];
				if (key === "createLinearGradient" || key === "createRadialGradient") {
					return () => {
						gradients += 1;
						return gradient;
					};
				}
				return (...args: unknown[]) => {
					calls.push(String(key));
					if (key === "drawImage") images.push(args[0]);
				};
			},
			set(obj, key, value) {
				obj[key] = value;
				return true;
			},
		}),
	};
}

let contexts: ReturnType<typeof fakeContext>[];
let rafQueue: Map<number, FrameRequestCallback>;
let rafId: number;
let resizeObservers: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[];
let intersectionCallbacks: IntersectionObserverCallback[];
let motionListeners: Listener[];
let prefersReduced: boolean;

function flushFrame(time = 16) {
	const callbacks = [...rafQueue.values()];
	rafQueue.clear();
	for (const cb of callbacks) cb(time);
}

beforeEach(() => {
	contexts = [];
	rafQueue = new Map();
	rafId = 0;
	resizeObservers = [];
	intersectionCallbacks = [];
	motionListeners = [];
	prefersReduced = false;

	vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
		this: HTMLCanvasElement,
	) {
		const fake = fakeContext(this);
		contexts.push(fake);
		return fake.ctx as unknown as CanvasRenderingContext2D;
	} as unknown as HTMLCanvasElement["getContext"]);

	vi.stubGlobal(
		"Path2D",
		class {
			moveTo() {}
			lineTo() {}
		},
	);
	vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
		rafId += 1;
		rafQueue.set(rafId, cb);
		return rafId;
	});
	vi.stubGlobal("cancelAnimationFrame", (id: number) => {
		rafQueue.delete(id);
	});

	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe = vi.fn();
			disconnect = vi.fn();
			constructor() {
				resizeObservers.push(this);
			}
		},
	);
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			observe = vi.fn();
			disconnect = vi.fn();
			constructor(cb: IntersectionObserverCallback) {
				intersectionCallbacks.push(cb);
			}
		},
	);
	vi.stubGlobal("matchMedia", (query: string) => ({
		media: query,
		get matches() {
			return prefersReduced;
		},
		addEventListener: (_: string, listener: Listener) => motionListeners.push(listener),
		removeEventListener: (_: string, listener: Listener) => {
			motionListeners = motionListeners.filter((l) => l !== listener);
		},
	}));
});

afterEach(() => {
	document.body.innerHTML = "";
});

function mount(options = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const flow = createDivineFlow(container, options);
	return { container, flow };
}

describe("createDivineFlow", () => {
	it("appends a decorative canvas and draws a first frame", () => {
		const { container, flow } = mount({ className: "flow" });

		expect(container.querySelector("canvas[data-divine-flow-canvas]")).toBe(flow.canvas);
		expect(flow.canvas.getAttribute("aria-hidden")).toBe("true");
		expect(flow.canvas.className).toBe("flow");
		expect(flow.canvas.hasAttribute("data-divine-flow-canvas")).toBe(true);
		expect(contexts[0]!.calls).toContain("stroke");
		expect(flow.isRunning).toBe(true);
		expect(rafQueue.size).toBe(1);
	});

	it("sizes the canvas from the container and caps the device pixel ratio", () => {
		vi.stubGlobal("devicePixelRatio", 3);
		const { flow } = mount({ maxDpr: 2 });
		// jsdom has no layout, so the engine falls back to the 1024x768 window.
		expect(flow.canvas.width).toBe(2048);
		expect(flow.canvas.height).toBe(1536);
	});

	it("keeps animating frame after frame", () => {
		mount();
		flushFrame(16);
		flushFrame(32);
		expect(rafQueue.size).toBe(1);
	});

	it("renders a still frame and never schedules when reduced motion is preferred", () => {
		prefersReduced = true;
		const { flow } = mount();
		expect(contexts[0]!.calls).toContain("stroke");
		expect(rafQueue.size).toBe(0);
		flow.start();
		expect(rafQueue.size).toBe(0);
	});

	it("reacts to prefers-reduced-motion changing at runtime", () => {
		mount();
		prefersReduced = true;
		motionListeners.forEach((l) => l({ matches: true }));
		expect(rafQueue.size).toBe(0);
		prefersReduced = false;
		motionListeners.forEach((l) => l({ matches: false }));
		expect(rafQueue.size).toBe(1);
	});

	it("can force motion on or off regardless of the media query", () => {
		prefersReduced = true;
		mount({ reducedMotion: false });
		expect(rafQueue.size).toBe(1);

		rafQueue.clear();
		prefersReduced = false;
		mount({ reducedMotion: true });
		expect(rafQueue.size).toBe(0);
	});

	it("does not loop when motion is 0", () => {
		mount({ motion: 0 });
		expect(rafQueue.size).toBe(0);
	});

	it("creates gradients once, not every frame", () => {
		mount({ theme: "crimson", emberCount: 20 });
		const count = () => contexts.reduce((sum, c) => sum + c.gradients(), 0);
		const afterMount = count();
		expect(afterMount).toBeGreaterThan(0);
		flushFrame(16);
		flushFrame(33);
		flushFrame(50);
		expect(count()).toBe(afterMount);
	});

	it("caps the frame rate with maxFps", () => {
		mount({ maxFps: 30 });
		// Count stroke calls on the main context to see which frames were actually drawn.
		const strokes = () => contexts[0]!.calls.filter((c) => c === "stroke").length;
		const before = strokes();
		flushFrame(1000);
		const afterFirst = strokes();
		flushFrame(1016); // 16ms later: under the 33ms budget, skipped
		expect(strokes()).toBe(afterFirst);
		flushFrame(1034); // 34ms after the last drawn frame: drawn
		expect(strokes()).toBeGreaterThan(afterFirst);
		expect(afterFirst).toBeGreaterThan(before);
		expect(rafQueue.size).toBe(1);
	});

	it("stops and starts", () => {
		const { flow } = mount();
		flow.stop();
		expect(flow.isRunning).toBe(false);
		expect(rafQueue.size).toBe(0);
		flow.start();
		expect(rafQueue.size).toBe(1);
	});

	it("pauses while off-screen and resumes when visible", () => {
		mount();
		const notify = intersectionCallbacks[0]!;
		notify([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
		expect(rafQueue.size).toBe(0);
		notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
		expect(rafQueue.size).toBe(1);
	});

	it("keeps running off-screen when pauseWhenHidden is false", () => {
		mount({ pauseWhenHidden: false });
		intersectionCallbacks[0]!(
			[{ isIntersecting: false } as IntersectionObserverEntry],
			{} as IntersectionObserver,
		);
		flushFrame();
		expect(rafQueue.size).toBe(1);
	});

	it("merges options on update", () => {
		const { flow } = mount({ theme: "crimson", lineCount: 3 });
		flow.update({ originY: 0.3 });
		expect(flow.options.lineCount).toBe(3);
		expect(flow.options.originY).toBe(0.3);
		expect(flow.options.palette.glow).toEqual([228, 52, 64]);
	});

	it("draws the bloom on its own canvas behind the filaments", () => {
		const { container, flow } = mount();
		const bloom = container.querySelector("canvas[data-divine-flow-bloom]");
		expect(bloom).not.toBeNull();
		expect(bloom!.nextElementSibling).toBe(flow.canvas);
		expect(flow.canvas.style.mixBlendMode).toBe("");
		// The bloom is never drawn into the main canvas in layered mode.
		expect(contexts[0]!.images).not.toContain(bloom);
		flow.destroy();
		expect(container.querySelectorAll("canvas")).toHaveLength(0);
	});

	it("composites the bloom into a provided canvas", () => {
		const canvas = document.createElement("canvas");
		mount({ canvas });
		expect(contexts[0]!.images).toContain(contexts[1]!.ctx.canvas);
	});

	it("draws into a provided canvas and leaves it in place on destroy", () => {
		const canvas = document.createElement("canvas");
		const { container, flow } = mount({ canvas });
		expect(flow.canvas).toBe(canvas);
		expect(container.contains(canvas)).toBe(false);
		document.body.appendChild(canvas);
		flow.destroy();
		expect(canvas.isConnected).toBe(true);
	});

	it("cleans up everything on destroy", () => {
		const { container, flow } = mount();
		flow.destroy();

		expect(container.querySelector("canvas")).toBeNull();
		expect(rafQueue.size).toBe(0);
		expect(resizeObservers[0]!.disconnect).toHaveBeenCalled();
		expect(motionListeners).toHaveLength(0);
		expect(flow.isRunning).toBe(false);

		// Calls after destroy are harmless no-ops.
		flow.start();
		flow.update({ lineCount: 2 });
		expect(rafQueue.size).toBe(0);
	});
});
