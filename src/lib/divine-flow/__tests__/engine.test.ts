// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDivineFlow } from "../engine";
import { themes } from "../palette";

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

	it("draws filaments in with setReveal, starting from nothing", () => {
		const { flow } = mount({ reveal: 0 });
		expect(flow.reveal).toBe(0);
		contexts[0]!.calls.length = 0;
		flushFrame(16);
		expect(contexts[0]!.calls).not.toContain("stroke");

		flow.setReveal(0.6);
		flushFrame(32);
		expect(contexts[0]!.calls).toContain("stroke");

		flow.setReveal(7);
		expect(flow.reveal).toBe(1);
		flow.setReveal(Number.NaN);
		expect(flow.reveal).toBe(1);
	});

	it("draws the last reveal before the loop stops, so nothing stale stays on screen", () => {
		const { flow } = mount({ reveal: 1, offscreen: false });
		flushFrame(16);
		flow.setReveal(0);
		contexts[0]!.calls.length = 0;
		flow.stop();
		// The frame drawn on stop has nothing left to stroke.
		expect(contexts[0]!.calls).toContain("clearRect");
		expect(contexts[0]!.calls).not.toContain("stroke");
	});

	it("redraws straight away when revealing a still canvas", () => {
		prefersReduced = true;
		const { flow } = mount({ reveal: 0 });
		contexts[0]!.calls.length = 0;
		flow.setReveal(1);
		expect(contexts[0]!.calls).toContain("stroke");
		expect(rafQueue.size).toBe(0);
	});

	it("merges options on update", () => {
		const { flow } = mount({ theme: "crimson", lineCount: 3 });
		flow.update({ originY: 0.3 });
		expect(flow.options.lineCount).toBe(3);
		expect(flow.options.originY).toBe(0.3);
		expect(flow.options.palette.glow).toEqual(themes.crimson.glow);
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

describe("offscreen (worker) mode", () => {
	let workers: { messages: { data: unknown; transfer: unknown[] }[] }[];
	let workerFails: boolean;

	beforeEach(async () => {
		const { resetSharedWorker } = await import("../engine");
		resetSharedWorker();
		workers = [];
		workerFails = false;
		vi.stubGlobal(
			"Worker",
			class {
				messages: { data: unknown; transfer: unknown[] }[] = [];
				constructor() {
					if (workerFails) throw new Error("no workers here");
					workers.push(this);
				}
				postMessage(data: unknown, transfer: unknown[] = []) {
					this.messages.push({ data, transfer });
				}
				addEventListener() {}
			},
		);
		vi.stubGlobal("OffscreenCanvas", class {});
		HTMLCanvasElement.prototype.transferControlToOffscreen = function () {
			return { offscreen: true } as unknown as OffscreenCanvas;
		};
	});

	afterEach(() => {
		delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).transferControlToOffscreen;
	});

	const sent = (type: string) =>
		workers[0]!.messages.map((m) => m.data as { type: string }).filter((m) => m.type === type);

	it("hands both canvases to one shared worker and never draws on the main thread", () => {
		const a = mount({ theme: "crimson" });
		const b = mount({ theme: "violet" });
		expect(workers).toHaveLength(1);
		expect(a.flow.offscreen).toBe(true);

		const inits = workers[0]!.messages.filter((m) => (m.data as { type: string }).type === "init");
		expect(inits).toHaveLength(2);
		expect(inits[0]!.transfer).toHaveLength(2);
		const [first, second] = inits.map((m) => m.data as { id: number; options: object });
		expect(first!.id).not.toBe(second!.id);
		expect(first!.options).toMatchObject({ theme: "crimson" });
		// The page canvases are still in the DOM, but nothing draws on them here.
		expect(a.container.querySelector("canvas[data-divine-flow-canvas]")).toBe(a.flow.canvas);
		expect(contexts).toHaveLength(0);
		expect(rafQueue.size).toBe(0);
		b.flow.destroy();
	});

	it("forwards reveal, start/stop, updates and destroy as messages", () => {
		const { flow } = mount();
		flow.setReveal(0.4);
		expect(sent("reveal").at(-1)).toMatchObject({ value: 0.4 });

		flow.stop();
		expect(sent("state").at(-1)).toMatchObject({ animate: false });
		flow.start();
		expect(sent("state").at(-1)).toMatchObject({ animate: true });

		flow.update({ lineCount: 2 });
		expect(sent("options").at(-1)).toMatchObject({ options: { lineCount: 2 } });

		intersectionCallbacks[0]!(
			[{ isIntersecting: false } as IntersectionObserverEntry],
			{} as IntersectionObserver,
		);
		expect(sent("state").at(-1)).toMatchObject({ animate: false });

		flow.destroy();
		expect(sent("destroy")).toHaveLength(1);
	});

	it("draws on the main thread when offscreen is off, a canvas is given, or workers fail", () => {
		expect(mount({ offscreen: false }).flow.offscreen).toBe(false);

		const canvas = document.createElement("canvas");
		expect(mount({ canvas }).flow.offscreen).toBe(false);

		workerFails = true;
		expect(mount().flow.offscreen).toBe(false);
		expect(contexts.length).toBeGreaterThan(0);
	});
});

describe("worker host", () => {
	function host(options: { failDraw?: boolean } = {}) {
		const frames: FrameRequestCallback[] = [];
		const posted: unknown[] = [];
		const fakeCanvas = () => {
			const canvas = { width: 0, height: 0, getContext: () => fake.ctx };
			const fake = fakeContext(canvas as unknown as HTMLCanvasElement);
			if (options.failDraw) {
				(fake.ctx as unknown as Record<string, unknown>).stroke = () => {
					throw new Error("boom");
				};
			}
			contexts.push(fake);
			return canvas;
		};
		vi.stubGlobal(
			"OffscreenCanvas",
			class {
				constructor() {
					return fakeCanvas();
				}
			},
		);
		return import("../worker").then(({ createFlowHost }) => {
			const flowHost = createFlowHost({
				postMessage: (m) => posted.push(m),
				requestAnimationFrame: (cb) => frames.push(cb),
				setTimeout: () => 0,
				performance: { now: () => 1000 },
			});
			const init = (animate: boolean) =>
				flowHost.handle({
					type: "init",
					id: 7,
					canvas: fakeCanvas() as unknown as OffscreenCanvas,
					bloom: fakeCanvas() as unknown as OffscreenCanvas,
					options: { lineCount: 2 },
					width: 400,
					height: 200,
					dpr: 1,
					reveal: 1,
					still: false,
					animate,
				});
			return { flowHost, frames, posted, init };
		});
	}

	const strokes = () =>
		contexts.reduce((n, c) => n + c.calls.filter((x) => x === "stroke").length, 0);

	it("draws a first frame and only loops while a flow animates", async () => {
		const { flowHost, frames, init } = await host();
		init(false);
		expect(strokes()).toBeGreaterThan(0);
		expect(frames).toHaveLength(0);

		flowHost.handle({ type: "state", id: 7, animate: true, still: false });
		expect(frames).toHaveLength(1);
		const before = strokes();
		frames.shift()!(2000);
		expect(strokes()).toBeGreaterThan(before);
		expect(frames).toHaveLength(1);

		flowHost.handle({ type: "state", id: 7, animate: false, still: false });
		frames.shift()!(3000);
		expect(frames).toHaveLength(0);
	});

	it("redraws idle flows on change and forgets destroyed ones", async () => {
		const { flowHost, init } = await host();
		init(false);
		const before = strokes();
		flowHost.handle({ type: "reveal", id: 7, value: 0.5 });
		expect(strokes()).toBeGreaterThan(before);
		flowHost.handle({ type: "destroy", id: 7 });
		expect(flowHost.flows.size).toBe(0);
		flowHost.handle({ type: "reveal", id: 7, value: 1 });
	});

	it("reports a flow that fails to draw and drops it", async () => {
		const { flowHost, posted, init } = await host({ failDraw: true });
		init(true);
		expect(posted).toEqual([{ type: "error", id: 7, message: "Error: boom" }]);
		expect(flowHost.flows.size).toBe(0);
	});
});
